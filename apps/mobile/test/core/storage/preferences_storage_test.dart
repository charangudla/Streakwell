import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:vital30/core/storage/preferences_storage.dart';

void main() {
  late PreferencesStorage storage;

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    storage = PreferencesStorage(prefs);
  });

  group('PreferencesStorage reminder time', () {
    test('returns the documented default when nothing is persisted', () {
      final time = storage.getReminderTime();
      expect(time.hour, PreferencesStorage.defaultReminderHour);
      expect(time.minute, PreferencesStorage.defaultReminderMinute);
    });

    test('round-trips a custom reminder time', () async {
      await storage.setReminderTime(const TimeOfDay(hour: 21, minute: 45));
      final time = storage.getReminderTime();
      expect(time.hour, 21);
      expect(time.minute, 45);
    });
  });

  group('PreferencesStorage notification preferences', () {
    test('defaults are sensible: daily on, niche channels off', () {
      final prefs = storage.getNotificationPreferences();
      expect(prefs.daily, isTrue);
      expect(prefs.streakMilestones, isTrue);
      expect(prefs.challengeComplete, isTrue);
      expect(prefs.weeklySummary, isTrue);
      expect(prefs.friendActivity, isFalse);
      expect(prefs.newChallenges, isFalse);
      expect(prefs.tips, isFalse);
    });

    test('round-trips every toggle', () async {
      const flipped = NotificationPreferences(
        daily: false,
        quietHours: false,
        streakMilestones: false,
        challengeComplete: false,
        friendActivity: true,
        weeklySummary: false,
        newChallenges: true,
        tips: true,
      );
      await storage.setNotificationPreferences(flipped);

      final loaded = storage.getNotificationPreferences();
      expect(loaded.daily, isFalse);
      expect(loaded.quietHours, isFalse);
      expect(loaded.streakMilestones, isFalse);
      expect(loaded.challengeComplete, isFalse);
      expect(loaded.friendActivity, isTrue);
      expect(loaded.weeklySummary, isFalse);
      expect(loaded.newChallenges, isTrue);
      expect(loaded.tips, isTrue);
    });
  });

  group('PreferencesStorage onboarding flag', () {
    test('defaults to false (so onboarding shows on first launch)', () {
      expect(storage.getOnboardingSeen(), isFalse);
    });

    test('round-trips after being set', () async {
      await storage.setOnboardingSeen(true);
      expect(storage.getOnboardingSeen(), isTrue);
    });
  });
}
