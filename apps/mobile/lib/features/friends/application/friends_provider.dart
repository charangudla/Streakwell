import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_service.dart';
import '../../../core/network/models.dart';

/// The current user's friends graph (accepted / incoming / outgoing /
/// blocked), mirroring the web /friends surface.
///
/// Mutations re-fetch the whole list afterwards rather than patching it
/// in place: rows move between buckets in ways that are awkward to do
/// optimistically (accepting an incoming request moves it to accepted;
/// blocking can delete a row from any bucket), and the server is the
/// source of truth. A re-fetch keeps every bucket honest for one cheap
/// round-trip.
final friendsProvider =
    AsyncNotifierProvider<FriendsNotifier, FriendsList>(FriendsNotifier.new);

class FriendsNotifier extends AsyncNotifier<FriendsList> {
  @override
  Future<FriendsList> build() async {
    return ref.read(apiServiceProvider).getFriends();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(ref.read(apiServiceProvider).getFriends);
  }

  /// Accept or decline an incoming request. Errors propagate so the caller
  /// can show a snackbar; on success we re-fetch + refresh the badge count.
  Future<void> respond(String friendshipId, String decision) async {
    await ref
        .read(apiServiceProvider)
        .respondToFriendRequest(friendshipId, decision);
    await refresh();
    ref.invalidate(incomingFriendCountProvider);
  }

  /// Remove a friend OR cancel an outgoing request.
  Future<void> unfriend(String friendshipId) async {
    await ref.read(apiServiceProvider).unfriend(friendshipId);
    await refresh();
  }

  Future<void> block(String userId) async {
    await ref.read(apiServiceProvider).blockUser(userId);
    await refresh();
    ref.invalidate(incomingFriendCountProvider);
  }

  Future<void> unblock(String friendshipId) async {
    await ref.read(apiServiceProvider).unblockUser(friendshipId);
    await refresh();
  }
}

/// Cheap incoming-request count for the header badge. Kept separate from
/// the full [friendsProvider] payload so the home header can render a dot
/// without paying for the entire list.
final incomingFriendCountProvider = FutureProvider<int>((ref) async {
  return ref.read(apiServiceProvider).getIncomingFriendCount();
});

/// A single user's public profile, keyed by user id. Errors surface as
/// AsyncValue.error so the profile screen can render its own error state.
final userProfileProvider =
    FutureProvider.family<UserProfile, String>((ref, userId) async {
  return ref.read(apiServiceProvider).getUserProfile(userId);
});
