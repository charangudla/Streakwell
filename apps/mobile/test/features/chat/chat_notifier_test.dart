import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:vital30/core/network/api_service.dart';
import 'package:vital30/features/chat/application/chat_provider.dart';

/// A stand-in for the `/challenges/:id/chat` surface. It serves a fixed
/// channel payload, mints a message on POST (so a notifier prepend can be
/// observed), tracks per-message reactions for a single viewer (so a toggle
/// round-trips correctly), and returns a members list — exactly the four
/// endpoints the chat notifier + members provider call.
class _FakeChatBackend {
  _FakeChatBackend({
    required this.channel,
    List<Map<String, dynamic>>? members,
  }) : members = members ?? <Map<String, dynamic>>[];

  final Map<String, dynamic> channel;
  final List<Map<String, dynamic>> members;
  final List<RequestOptions> requests = [];

  /// messageId -> the set of emoji codes this single viewer is reacting with.
  final Map<String, Set<String>> _reactions = {};
  int _postSeq = 0;

  Dio build() {
    final dio = Dio(BaseOptions(baseUrl: 'http://test.local'));
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, h) {
          requests.add(options);
          final path = options.path;
          final method = options.method;

          if (method == 'GET' && path.endsWith('/chat')) {
            h.resolve(_ok(options, channel));
            return;
          }
          if (method == 'POST' && path.endsWith('/chat')) {
            final code = (options.data as Map)['presetCode'] as String;
            _postSeq++;
            h.resolve(_ok(
              options,
              _message('posted-$_postSeq',
                  presetCode: code, user: {'id': 'me', 'name': 'Me'}),
            ));
            return;
          }
          if (method == 'GET' && path.endsWith('/members')) {
            h.resolve(_okList(options, members));
            return;
          }
          if (method == 'POST' && path.startsWith('/chat-messages/')) {
            final messageId = path.split('/')[2];
            final emoji = (options.data as Map)['emoji'] as String;
            final set = _reactions.putIfAbsent(messageId, () => <String>{});
            final bool added;
            if (set.contains(emoji)) {
              set.remove(emoji);
              added = false;
            } else {
              set.add(emoji);
              added = true;
            }
            h.resolve(_ok(options, {
              'added': added,
              'counts': {for (final c in set) c: 1},
              'mine': {for (final c in set) c: true},
            }));
            return;
          }
          h.resolve(_ok(options, {'ok': true}));
        },
      ),
    );
    return dio;
  }

  Response<Map<String, dynamic>> _ok(
    RequestOptions options,
    Map<String, dynamic> data,
  ) =>
      Response<Map<String, dynamic>>(
        requestOptions: options,
        statusCode: 200,
        data: data,
      );

  Response<List<dynamic>> _okList(
    RequestOptions options,
    List<dynamic> data,
  ) =>
      Response<List<dynamic>>(
        requestOptions: options,
        statusCode: 200,
        data: data,
      );
}

Map<String, dynamic> _message(
  String id, {
  String? presetCode,
  String kind = 'PRESET',
  Map<String, dynamic>? user,
  Map<String, dynamic>? reactions,
}) =>
    {
      'id': id,
      'kind': kind,
      'presetCode': presetCode,
      'body': null,
      'scheduledDate': null,
      'createdAt': '2026-05-30T00:00:00.000Z',
      'user': user,
      'reactions': reactions ?? {'counts': <String, int>{}, 'mine': <String, bool>{}},
    };

Map<String, dynamic> _channel({
  required List<Map<String, dynamic>> messages,
}) =>
    {
      'presets': [
        {'code': 'DONE_TODAY', 'text': "I'm done today ✅", 'tone': 'success'},
        {'code': 'KEEP_GOING', 'text': "Let's go everyone! 🙌", 'tone': 'encourage'},
      ],
      'emoji': [
        {'code': 'fire', 'char': '🔥', 'label': 'Fire'},
        {'code': 'love', 'char': '❤️', 'label': 'Love'},
      ],
      'poll': {
        'completed': 1,
        'missed': 0,
        'skipped': 0,
        'pending': 2,
        'total': 3,
        'yourStatus': 'COMPLETED',
      },
      'messages': messages,
    };

Map<String, dynamic> _member(
  String userId,
  String name, {
  String? todayCheckinStatus,
  bool isYou = false,
  String friendship = 'none',
  String? friendshipId,
}) =>
    {
      'userId': userId,
      'name': name,
      'joinedAt': '2026-05-01T00:00:00.000Z',
      'todayCheckinStatus': todayCheckinStatus,
      'isYou': isYou,
      'friendship': friendship,
      'friendshipId': friendshipId,
    };

ProviderContainer _containerFor(Dio dio) {
  final container = ProviderContainer(
    overrides: [apiServiceProvider.overrideWithValue(ApiService(dio))],
  );
  addTearDown(container.dispose);
  return container;
}

void main() {
  group('ChatChannelNotifier.build', () {
    test('loads catalogs, poll, and messages', () async {
      final fake = _FakeChatBackend(
        channel: _channel(messages: [
          _message('m1',
              presetCode: 'DONE_TODAY', user: {'id': 'u1', 'name': 'Ada'}),
        ]),
      );
      final container = _containerFor(fake.build());

      final channel = await container.read(chatChannelProvider('c1').future);

      expect(channel.presets, hasLength(2));
      expect(channel.emoji.first.char, '🔥');
      expect(channel.poll.total, 3);
      expect(channel.poll.yourStatus, 'COMPLETED');
      expect(channel.messages.single.presetCode, 'DONE_TODAY');
      expect(channel.messages.single.user?.name, 'Ada');
      // The catalog resolves a preset code to its display text.
      expect(channel.presetText('DONE_TODAY'), "I'm done today ✅");
      expect(channel.presetTone('KEEP_GOING'), 'encourage');
    });

    test('parses a system CELEBRATION card with a null user', () async {
      final fake = _FakeChatBackend(
        channel: _channel(messages: [
          _message('cel-1', kind: 'CELEBRATION', user: null)
            ..['body'] = '💪 Day 5 — every check-in counts.',
        ]),
      );
      final container = _containerFor(fake.build());

      final channel = await container.read(chatChannelProvider('c1').future);
      final card = channel.messages.single;

      expect(card.isCelebration, isTrue);
      expect(card.user, isNull);
      expect(card.body, contains('every check-in counts'));
    });
  });

  group('ChatChannelNotifier.post', () {
    test('prepends the created message (wire order is newest-first)',
        () async {
      final fake = _FakeChatBackend(
        channel: _channel(messages: [
          _message('m1',
              presetCode: 'DONE_TODAY', user: {'id': 'u1', 'name': 'Ada'}),
        ]),
      );
      final container = _containerFor(fake.build());
      await container.read(chatChannelProvider('c1').future);

      await container.read(chatChannelProvider('c1').notifier).post('KEEP_GOING');

      final data = container.read(chatChannelProvider('c1')).requireValue;
      expect(data.messages, hasLength(2));
      expect(data.messages.first.presetCode, 'KEEP_GOING');

      final post = fake.requests
          .firstWhere((r) => r.method == 'POST' && r.path.endsWith('/chat'));
      expect(post.path, '/challenges/c1/chat');
      expect((post.data as Map)['presetCode'], 'KEEP_GOING');
    });
  });

  group('ChatChannelNotifier.toggleReaction', () {
    test('adds then removes a reaction, reconciling with the server',
        () async {
      final fake = _FakeChatBackend(
        channel: _channel(messages: [
          _message('m1',
              presetCode: 'DONE_TODAY', user: {'id': 'u1', 'name': 'Ada'}),
        ]),
      );
      final container = _containerFor(fake.build());
      await container.read(chatChannelProvider('c1').future);
      final notifier = container.read(chatChannelProvider('c1').notifier);

      await notifier.toggleReaction('m1', 'fire');
      var msg = container.read(chatChannelProvider('c1')).requireValue.messages.single;
      expect(msg.reactions.countFor('fire'), 1);
      expect(msg.reactions.mineFor('fire'), isTrue);

      await notifier.toggleReaction('m1', 'fire');
      msg = container.read(chatChannelProvider('c1')).requireValue.messages.single;
      expect(msg.reactions.countFor('fire'), 0);
      expect(msg.reactions.mineFor('fire'), isFalse);

      // Two reaction round-trips hit the toggle endpoint.
      expect(
        fake.requests
            .where((r) =>
                r.method == 'POST' && r.path.startsWith('/chat-messages/'))
            .length,
        2,
      );
    });
  });

  group('chatMembersProvider', () {
    test('reads the members list off GET /challenges/:id/members', () async {
      final fake = _FakeChatBackend(
        channel: _channel(messages: const []),
        members: [
          _member('u1', 'Ada', todayCheckinStatus: 'COMPLETED'),
          _member('me', 'Me', isYou: true),
        ],
      );
      final container = _containerFor(fake.build());

      final members = await container.read(chatMembersProvider('c1').future);

      expect(members, hasLength(2));
      expect(members.first.name, 'Ada');
      expect(members.first.todayCheckinStatus, 'COMPLETED');
      expect(members.first.friendship, 'none');
      expect(members[1].isYou, isTrue);
      expect(
        fake.requests.any((r) => r.path == '/challenges/c1/members'),
        isTrue,
      );
    });
  });
}
