import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/notifications/notification_service.dart';
import '../../../core/storage/preferences_storage.dart';

@immutable
class NotificationSettingsState {
  const NotificationSettingsState({
    required this.reminderTime,
    required this.preferences,
  });

  final TimeOfDay reminderTime;
  final NotificationPreferences preferences;

  NotificationSettingsState copyWith({
    TimeOfDay? reminderTime,
    NotificationPreferences? preferences,
  }) {
    return NotificationSettingsState(
      reminderTime: reminderTime ?? this.reminderTime,
      preferences: preferences ?? this.preferences,
    );
  }
}

final notificationSettingsProvider = StateNotifierProvider<
    NotificationSettingsNotifier, NotificationSettingsState>((ref) {
  return NotificationSettingsNotifier(
    ref.watch(preferencesStorageProvider),
    ref.watch(notificationServiceProvider),
  );
});

class NotificationSettingsNotifier
    extends StateNotifier<NotificationSettingsState> {
  NotificationSettingsNotifier(this._prefs, this._notifications)
      : super(NotificationSettingsState(
          reminderTime: _prefs.getReminderTime(),
          preferences: _prefs.getNotificationPreferences(),
        ));

  final PreferencesStorage _prefs;
  final NotificationService _notifications;

  /// Initialise the notification subsystem and align the OS schedule with
  /// the persisted preferences. Call once at app startup.
  ///
  /// If the daily reminder is enabled but the OS has not granted permission,
  /// we proactively request it here — otherwise iOS silently drops every
  /// scheduled notification and the user never gets the system prompt. If
  /// permission ends up denied, we persist the toggle as off so the UI
  /// reflects reality (the user can re-enable from Settings + the in-app
  /// toggle later).
  Future<void> bootstrap() async {
    await _notifications.init();

    if (state.preferences.daily) {
      final granted = await _notifications.requestPermission();
      if (!granted) {
        debugPrint(
          '[notification_settings] Daily reminder is enabled in prefs but the '
          'OS denied notification permission. Disabling the toggle.',
        );
        await _updatePreferences(state.preferences.copyWith(daily: false));
        await _notifications.cancelDailyReminder();
        return;
      }
    }

    await _applyDailyReminderSchedule();
  }

  Future<void> setReminderTime(TimeOfDay time) async {
    await _prefs.setReminderTime(time);
    state = state.copyWith(reminderTime: time);
    await _applyDailyReminderSchedule();
  }

  Future<void> setDailyReminderEnabled(bool enabled) async {
    if (enabled && !state.preferences.daily) {
      // Ask for OS permission only when turning the reminder on.
      final granted = await _notifications.requestPermission();
      if (!granted) {
        debugPrint(
          '[notification_settings] Daily reminder requested but '
          'OS permission was denied.',
        );
        return;
      }
    }
    await _updatePreferences(state.preferences.copyWith(daily: enabled));
    await _applyDailyReminderSchedule();
  }

  Future<void> setQuietHoursEnabled(bool enabled) =>
      _updatePreferences(state.preferences.copyWith(quietHours: enabled));

  Future<void> setStreakMilestonesEnabled(bool enabled) =>
      _updatePreferences(state.preferences.copyWith(streakMilestones: enabled));

  Future<void> setChallengeCompleteEnabled(bool enabled) => _updatePreferences(
      state.preferences.copyWith(challengeComplete: enabled));

  Future<void> setFriendActivityEnabled(bool enabled) =>
      _updatePreferences(state.preferences.copyWith(friendActivity: enabled));

  Future<void> setWeeklySummaryEnabled(bool enabled) =>
      _updatePreferences(state.preferences.copyWith(weeklySummary: enabled));

  Future<void> setNewChallengesEnabled(bool enabled) =>
      _updatePreferences(state.preferences.copyWith(newChallenges: enabled));

  Future<void> setTipsEnabled(bool enabled) =>
      _updatePreferences(state.preferences.copyWith(tips: enabled));

  Future<void> _updatePreferences(NotificationPreferences next) async {
    await _prefs.setNotificationPreferences(next);
    state = state.copyWith(preferences: next);
  }

  Future<void> _applyDailyReminderSchedule() async {
    if (state.preferences.daily) {
      await _notifications.scheduleDailyReminder(state.reminderTime);
    } else {
      await _notifications.cancelDailyReminder();
    }
  }
}
