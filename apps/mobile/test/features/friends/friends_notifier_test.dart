import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:vital30/core/network/api_service.dart';
import 'package:vital30/features/friends/application/friends_provider.dart';

/// A stand-in for the `/friends` surface of the backend. It keeps the four
/// buckets in mutable lists and applies the same row-moving rules the real
/// service does, so a notifier mutation followed by its re-fetch reflects
/// the new server truth — exactly what the UI relies on.
class _FakeBackend {
  _FakeBackend({
    List<Map<String, dynamic>>? accepted,
    List<Map<String, dynamic>>? incoming,
    List<Map<String, dynamic>>? outgoing,
    List<Map<String, dynamic>>? blocked,
  }) : payload = {
          'accepted': accepted ?? <Map<String, dynamic>>[],
          'incoming': incoming ?? <Map<String, dynamic>>[],
          'outgoing': outgoing ?? <Map<String, dynamic>>[],
          'blocked': blocked ?? <Map<String, dynamic>>[],
        };

  final Map<String, dynamic> payload;
  final List<RequestOptions> requests = [];

  List<Map<String, dynamic>> _bucket(String name) =>
      payload[name] as List<Map<String, dynamic>>;

  Dio build() {
    final dio = Dio(BaseOptions(baseUrl: 'http://test.local'));
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, h) {
          requests.add(options);
          final path = options.path;
          final method = options.method;

          if (method == 'GET' && path == '/friends') {
            h.resolve(_ok(options, payload));
            return;
          }
          if (method == 'GET' && path == '/friends/counts') {
            h.resolve(_ok(options, {'incoming': _bucket('incoming').length}));
            return;
          }
          if (method == 'POST' && path.endsWith('/respond')) {
            _applyRespond(path, options.data as Map);
            h.resolve(_ok(options, {'ok': true}));
            return;
          }
          if (method == 'DELETE' && path.startsWith('/friends/')) {
            _applyUnfriend(path.substring('/friends/'.length));
            h.resolve(_ok(options, {'ok': true}));
            return;
          }
          if (method == 'POST' && path == '/friends/block') {
            _applyBlock((options.data as Map)['userId'] as String);
            h.resolve(_ok(options, {'ok': true}));
            return;
          }
          // Anything else (request, unblock) just succeeds.
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

  /// `/friends/:id/respond` — ACCEPTED moves the incoming row into accepted;
  /// any other decision drops it.
  void _applyRespond(String path, Map data) {
    final id = path.split('/')[2]; // /friends/<id>/respond
    final incoming = _bucket('incoming');
    final idx = incoming.indexWhere((e) => e['friendshipId'] == id);
    if (idx == -1) return;
    final row = incoming.removeAt(idx);
    if (data['decision'] == 'ACCEPTED') {
      row['respondedAt'] = '2026-05-30T00:00:00.000Z';
      _bucket('accepted').add(row);
    }
  }

  /// `DELETE /friends/:id` — unfriend or cancel: drop the row wherever it sits.
  void _applyUnfriend(String id) {
    for (final name in const ['accepted', 'incoming', 'outgoing']) {
      _bucket(name).removeWhere((e) => e['friendshipId'] == id);
    }
  }

  /// `POST /friends/block` — remove every relationship row for that user.
  void _applyBlock(String userId) {
    for (final name in const ['accepted', 'incoming', 'outgoing']) {
      _bucket(name)
          .removeWhere((e) => (e['user'] as Map)['id'] == userId);
    }
  }
}

Map<String, dynamic> _entry(
  String friendshipId,
  String userId,
  String name, {
  String? respondedAt,
}) =>
    {
      'friendshipId': friendshipId,
      'user': {'id': userId, 'name': name},
      'createdAt': '2026-05-01T00:00:00.000Z',
      if (respondedAt != null) 'respondedAt': respondedAt,
    };

ProviderContainer _containerFor(Dio dio) {
  final container = ProviderContainer(
    overrides: [apiServiceProvider.overrideWithValue(ApiService(dio))],
  );
  addTearDown(container.dispose);
  return container;
}

void main() {
  group('FriendsNotifier.build', () {
    test('loads and sorts the payload into its four buckets', () async {
      final fake = _FakeBackend(
        accepted: [
          _entry('f-acc', 'u-acc', 'Ada Lovelace',
              respondedAt: '2026-05-02T00:00:00.000Z'),
        ],
        incoming: [_entry('f-in', 'u-in', 'Grace Hopper')],
        outgoing: [_entry('f-out', 'u-out', 'Alan Turing')],
        blocked: [_entry('f-blk', 'u-blk', 'Spammer McSpam')],
      );
      final container = _containerFor(fake.build());

      final list = await container.read(friendsProvider.future);

      expect(list.accepted.single.user.name, 'Ada Lovelace');
      expect(list.accepted.single.respondedAt, isNotNull);
      expect(list.incoming.single.user.id, 'u-in');
      expect(list.outgoing.single.friendshipId, 'f-out');
      expect(list.blocked.single.user.name, 'Spammer McSpam');
      expect(list.isEmpty, isFalse);
    });

    test('defaults missing buckets to empty rather than throwing', () async {
      // Older API build that predates `blocked`: only three keys present.
      final fake = _FakeBackend(incoming: [_entry('f-in', 'u-in', 'Solo')]);
      fake.payload.remove('blocked');
      final container = _containerFor(fake.build());

      final list = await container.read(friendsProvider.future);

      expect(list.blocked, isEmpty);
      expect(list.incoming, hasLength(1));
    });
  });

  group('FriendsNotifier.respond', () {
    test('ACCEPTED posts the decision then re-fetches into accepted',
        () async {
      final fake = _FakeBackend(
        incoming: [_entry('f-in', 'u-in', 'Grace Hopper')],
      );
      final container = _containerFor(fake.build());
      await container.read(friendsProvider.future);

      await container
          .read(friendsProvider.notifier)
          .respond('f-in', 'ACCEPTED');

      final data = container.read(friendsProvider).requireValue;
      expect(data.incoming, isEmpty);
      expect(data.accepted.single.friendshipId, 'f-in');

      final respond =
          fake.requests.firstWhere((r) => r.path.endsWith('/respond'));
      expect(respond.method, 'POST');
      expect(respond.path, '/friends/f-in/respond');
      expect((respond.data as Map)['decision'], 'ACCEPTED');
      // A re-fetch must follow the mutation: at least two GET /friends.
      expect(
        fake.requests
            .where((r) => r.method == 'GET' && r.path == '/friends')
            .length,
        greaterThanOrEqualTo(2),
      );
    });

    test('DECLINED drops the incoming row entirely', () async {
      final fake = _FakeBackend(
        incoming: [_entry('f-in', 'u-in', 'Grace Hopper')],
      );
      final container = _containerFor(fake.build());
      await container.read(friendsProvider.future);

      await container
          .read(friendsProvider.notifier)
          .respond('f-in', 'DECLINED');

      final data = container.read(friendsProvider).requireValue;
      expect(data.incoming, isEmpty);
      expect(data.accepted, isEmpty);
    });
  });

  group('FriendsNotifier.unfriend', () {
    test('DELETEs the friendship then re-fetches without it', () async {
      final fake = _FakeBackend(
        accepted: [
          _entry('f-acc', 'u-acc', 'Ada Lovelace',
              respondedAt: '2026-05-02T00:00:00.000Z'),
        ],
      );
      final container = _containerFor(fake.build());
      await container.read(friendsProvider.future);

      await container.read(friendsProvider.notifier).unfriend('f-acc');

      expect(container.read(friendsProvider).requireValue.accepted, isEmpty);
      final del = fake.requests.firstWhere((r) => r.method == 'DELETE');
      expect(del.path, '/friends/f-acc');
    });
  });

  group('FriendsNotifier.block', () {
    test('posts the userId then re-fetches with the user gone', () async {
      final fake = _FakeBackend(
        accepted: [
          _entry('f-acc', 'u-acc', 'Ada Lovelace',
              respondedAt: '2026-05-02T00:00:00.000Z'),
        ],
      );
      final container = _containerFor(fake.build());
      await container.read(friendsProvider.future);

      await container.read(friendsProvider.notifier).block('u-acc');

      expect(container.read(friendsProvider).requireValue.accepted, isEmpty);
      final block =
          fake.requests.firstWhere((r) => r.path == '/friends/block');
      expect(block.method, 'POST');
      expect((block.data as Map)['userId'], 'u-acc');
    });
  });

  group('incomingFriendCountProvider', () {
    test('reads the count off GET /friends/counts', () async {
      final fake = _FakeBackend(
        incoming: [
          _entry('f1', 'u1', 'One'),
          _entry('f2', 'u2', 'Two'),
        ],
      );
      final container = _containerFor(fake.build());

      final count = await container.read(incomingFriendCountProvider.future);

      expect(count, 2);
      expect(
        fake.requests.any((r) => r.path == '/friends/counts'),
        isTrue,
      );
    });
  });
}
