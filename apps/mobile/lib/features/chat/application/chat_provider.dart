import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_service.dart';
import '../../../core/network/models.dart';

/// The live chat channel for a single challenge, keyed by `challengeId`.
///
/// `build` loads the channel (catalogs + poll + messages, newest-first).
/// Mutations are local-first where it's safe:
///   • [post] prepends the server-created message (wire order is DESC, so a
///     prepend keeps the list newest-first; the screen reverses for display).
///   • [toggleReaction] applies an optimistic flip, then reconciles with the
///     server's authoritative tallies — reverting on failure.
class ChatChannelNotifier
    extends FamilyAsyncNotifier<ChatChannel, String> {
  @override
  Future<ChatChannel> build(String challengeId) async {
    return ref.watch(apiServiceProvider).getChatChannel(challengeId);
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => ref.read(apiServiceProvider).getChatChannel(arg),
    );
  }

  /// Posts a preset and prepends the created message. Errors propagate to
  /// the caller (the screen surfaces a snackbar) — state is untouched on
  /// failure.
  Future<void> post(String presetCode) async {
    final channel = state.valueOrNull;
    if (channel == null) return;
    final message =
        await ref.read(apiServiceProvider).postChatMessage(arg, presetCode);
    state = AsyncValue.data(
      _withMessages(channel, [message, ...channel.messages]),
    );
  }

  /// Optimistically toggles [emojiCode] on [messageId], then reconciles with
  /// the server. Reverts to the pre-toggle state if the request fails.
  Future<void> toggleReaction(String messageId, String emojiCode) async {
    final channel = state.valueOrNull;
    if (channel == null) return;

    final original = channel.messages;
    final idx = original.indexWhere((m) => m.id == messageId);
    if (idx == -1) return;

    // 1. Optimistic flip.
    final optimistic = _toggle(original[idx].reactions, emojiCode);
    state = AsyncValue.data(
      _withMessages(
        channel,
        _replaceAt(original, idx, original[idx].withReactions(optimistic)),
      ),
    );

    // 2. Reconcile with the server's authoritative tallies.
    try {
      final result = await ref
          .read(apiServiceProvider)
          .toggleChatReaction(messageId, emojiCode);
      final current = state.valueOrNull;
      if (current == null) return;
      final at = current.messages.indexWhere((m) => m.id == messageId);
      if (at == -1) return;
      state = AsyncValue.data(
        _withMessages(
          current,
          _replaceAt(current.messages, at,
              current.messages[at].withReactions(result.reactions)),
        ),
      );
    } catch (_) {
      // 3. Revert the optimistic flip on failure.
      final current = state.valueOrNull;
      if (current == null) return;
      final at = current.messages.indexWhere((m) => m.id == messageId);
      if (at == -1) return;
      state = AsyncValue.data(
        _withMessages(
          current,
          _replaceAt(current.messages, at,
              current.messages[at].withReactions(original[idx].reactions)),
        ),
      );
      rethrow;
    }
  }

  // -- helpers --------------------------------------------------------------

  ChatChannel _withMessages(ChatChannel base, List<ChatMessage> messages) =>
      ChatChannel(
        presets: base.presets,
        emoji: base.emoji,
        poll: base.poll,
        messages: messages,
      );

  List<ChatMessage> _replaceAt(
    List<ChatMessage> list,
    int index,
    ChatMessage value,
  ) {
    final next = [...list];
    next[index] = value;
    return next;
  }

  /// Pure local toggle of one emoji on a reactions map.
  ChatReactions _toggle(ChatReactions r, String code) {
    final counts = Map<String, int>.from(r.counts);
    final mine = Map<String, bool>.from(r.mine);
    final on = mine[code] ?? false;
    if (on) {
      mine[code] = false;
      final next = (counts[code] ?? 1) - 1;
      counts[code] = next < 0 ? 0 : next;
    } else {
      mine[code] = true;
      counts[code] = (counts[code] ?? 0) + 1;
    }
    return ChatReactions(counts: counts, mine: mine);
  }
}

final chatChannelProvider = AsyncNotifierProvider.family<ChatChannelNotifier,
    ChatChannel, String>(ChatChannelNotifier.new);

/// Members of a challenge's chat — for the Members sheet. Kept separate from
/// the channel so friend-action mutations can re-fetch just this list
/// (via `ref.invalidate`) without reloading the whole message thread.
final chatMembersProvider =
    FutureProvider.family<List<ChatMember>, String>((ref, challengeId) async {
  return ref.watch(apiServiceProvider).getChatMembers(challengeId);
});
