import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Non-sensitive local key/value store backed by SharedPreferences.
/// For sensitive material (tokens, user JSON), use [SecureStorage] instead.
///
/// This provider must be overridden at startup (see [runWithEnv]) with an
/// instance built from an already-resolved [SharedPreferences]. Reading it
/// before the override fires throws.
final preferencesStorageProvider = Provider<PreferencesStorage>((ref) {
  throw StateError(
    'preferencesStorageProvider was read before being overridden. '
    'Initialize SharedPreferences in main and pass an override to ProviderScope.',
  );
});

class PreferencesStorage {
  PreferencesStorage(this._prefs);
  final SharedPreferences _prefs;

  static const _reminderHourKey = 'reminder_hour';
  static const _reminderMinuteKey = 'reminder_minute';
  static const _onboardingSeenKey = 'onboarding_seen';

  // Notification toggle keys.
  static const _notifDailyKey = 'notif_daily';
  static const _notifQuietHoursKey = 'notif_quiet_hours';
  static const _notifStreakKey = 'notif_streak';
  static const _notifChallengeCompleteKey = 'notif_challenge_complete';
  static const _notifFriendKey = 'notif_friend';
  static const _notifWeeklyKey = 'notif_weekly';
  static const _notifNewChallengesKey = 'notif_new_challenges';
  static const _notifTipsKey = 'notif_tips';

  // Default values surface here so the UI and scheduler agree.
  static const defaultReminderHour = 8;
  static const defaultReminderMinute = 0;

  TimeOfDay getReminderTime() {
    final hour = _prefs.getInt(_reminderHourKey) ?? defaultReminderHour;
    final minute = _prefs.getInt(_reminderMinuteKey) ?? defaultReminderMinute;
    return TimeOfDay(hour: hour, minute: minute);
  }

  Future<void> setReminderTime(TimeOfDay time) async {
    await _prefs.setInt(_reminderHourKey, time.hour);
    await _prefs.setInt(_reminderMinuteKey, time.minute);
  }

  bool getOnboardingSeen() => _prefs.getBool(_onboardingSeenKey) ?? false;

  Future<void> setOnboardingSeen(bool value) =>
      _prefs.setBool(_onboardingSeenKey, value);

  NotificationPreferences getNotificationPreferences() {
    return NotificationPreferences(
      daily: _prefs.getBool(_notifDailyKey) ?? true,
      quietHours: _prefs.getBool(_notifQuietHoursKey) ?? true,
      streakMilestones: _prefs.getBool(_notifStreakKey) ?? true,
      challengeComplete: _prefs.getBool(_notifChallengeCompleteKey) ?? true,
      friendActivity: _prefs.getBool(_notifFriendKey) ?? false,
      weeklySummary: _prefs.getBool(_notifWeeklyKey) ?? true,
      newChallenges: _prefs.getBool(_notifNewChallengesKey) ?? false,
      tips: _prefs.getBool(_notifTipsKey) ?? false,
    );
  }

  Future<void> setNotificationPreferences(NotificationPreferences prefs) async {
    await _prefs.setBool(_notifDailyKey, prefs.daily);
    await _prefs.setBool(_notifQuietHoursKey, prefs.quietHours);
    await _prefs.setBool(_notifStreakKey, prefs.streakMilestones);
    await _prefs.setBool(_notifChallengeCompleteKey, prefs.challengeComplete);
    await _prefs.setBool(_notifFriendKey, prefs.friendActivity);
    await _prefs.setBool(_notifWeeklyKey, prefs.weeklySummary);
    await _prefs.setBool(_notifNewChallengesKey, prefs.newChallenges);
    await _prefs.setBool(_notifTipsKey, prefs.tips);
  }
}

@immutable
class NotificationPreferences {
  const NotificationPreferences({
    required this.daily,
    required this.quietHours,
    required this.streakMilestones,
    required this.challengeComplete,
    required this.friendActivity,
    required this.weeklySummary,
    required this.newChallenges,
    required this.tips,
  });

  final bool daily;
  final bool quietHours;
  final bool streakMilestones;
  final bool challengeComplete;
  final bool friendActivity;
  final bool weeklySummary;
  final bool newChallenges;
  final bool tips;

  NotificationPreferences copyWith({
    bool? daily,
    bool? quietHours,
    bool? streakMilestones,
    bool? challengeComplete,
    bool? friendActivity,
    bool? weeklySummary,
    bool? newChallenges,
    bool? tips,
  }) {
    return NotificationPreferences(
      daily: daily ?? this.daily,
      quietHours: quietHours ?? this.quietHours,
      streakMilestones: streakMilestones ?? this.streakMilestones,
      challengeComplete: challengeComplete ?? this.challengeComplete,
      friendActivity: friendActivity ?? this.friendActivity,
      weeklySummary: weeklySummary ?? this.weeklySummary,
      newChallenges: newChallenges ?? this.newChallenges,
      tips: tips ?? this.tips,
    );
  }
}
