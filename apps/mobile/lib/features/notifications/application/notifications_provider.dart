import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_service.dart';
import '../../../core/network/models.dart';

/// Live list of the current user's notifications. AsyncValue lets the UI
/// distinguish loading / error / empty / data states cleanly.
final notificationsProvider =
    AsyncNotifierProvider<NotificationsNotifier, List<AppNotification>>(
  NotificationsNotifier.new,
);

class NotificationsNotifier extends AsyncNotifier<List<AppNotification>> {
  @override
  Future<List<AppNotification>> build() async {
    final api = ref.read(apiServiceProvider);
    return api.getNotifications();
  }

  Future<void> refresh() async {
    final api = ref.read(apiServiceProvider);
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(api.getNotifications);
  }

  Future<void> markRead(String id) async {
    final current = state.valueOrNull ?? const <AppNotification>[];
    // Optimistic update.
    state = AsyncValue.data(
      current
          .map((n) => n.id == id && n.readAt == null
              ? AppNotification(
                  id: n.id,
                  type: n.type,
                  title: n.title,
                  body: n.body,
                  createdAt: n.createdAt,
                  readAt: DateTime.now(),
                  data: n.data,
                )
              : n)
          .toList(),
    );
    try {
      await ref.read(apiServiceProvider).markNotificationRead(id);
    } catch (_) {
      // Roll back on failure so the badge count stays honest.
      await refresh();
    }
  }

  Future<void> markAllRead() async {
    final now = DateTime.now();
    final current = state.valueOrNull ?? const <AppNotification>[];
    state = AsyncValue.data(
      current
          .map((n) => n.readAt != null
              ? n
              : AppNotification(
                  id: n.id,
                  type: n.type,
                  title: n.title,
                  body: n.body,
                  createdAt: n.createdAt,
                  readAt: now,
                  data: n.data,
                ))
          .toList(),
    );
    try {
      await ref.read(apiServiceProvider).markAllNotificationsRead();
    } catch (_) {
      await refresh();
    }
  }
}

final unreadNotificationCountProvider = Provider<int>((ref) {
  final notifications =
      ref.watch(notificationsProvider).valueOrNull ?? const <AppNotification>[];
  return notifications.where((n) => n.isUnread).length;
});
