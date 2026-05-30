import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:timezone/data/latest_all.dart' as tz_data;
import 'package:timezone/timezone.dart' as tz;
import 'package:vital30/core/notifications/notification_service.dart';

void main() {
  setUpAll(() {
    tz_data.initializeTimeZones();
  });

  group('NotificationService.nextInstanceOfTimeFrom', () {
    final fixedZone = tz.UTC;

    test('returns later today when the target hour has not yet passed', () {
      final now = tz.TZDateTime(fixedZone, 2026, 5, 25, 7, 30);
      final next = NotificationService.nextInstanceOfTimeFrom(
        const TimeOfDay(hour: 8, minute: 0),
        now,
      );
      expect(next.year, 2026);
      expect(next.month, 5);
      expect(next.day, 25);
      expect(next.hour, 8);
      expect(next.minute, 0);
    });

    test('rolls to tomorrow when the target time has already passed today', () {
      final now = tz.TZDateTime(fixedZone, 2026, 5, 25, 9, 0);
      final next = NotificationService.nextInstanceOfTimeFrom(
        const TimeOfDay(hour: 8, minute: 0),
        now,
      );
      expect(next.day, 26);
      expect(next.hour, 8);
      expect(next.minute, 0);
    });

    test('rolls to tomorrow when the target equals the current time exactly',
        () {
      final now = tz.TZDateTime(fixedZone, 2026, 5, 25, 8, 0);
      final next = NotificationService.nextInstanceOfTimeFrom(
        const TimeOfDay(hour: 8, minute: 0),
        now,
      );
      expect(next.day, 26);
    });

    test('handles month boundary correctly', () {
      final now = tz.TZDateTime(fixedZone, 2026, 5, 31, 23, 30);
      final next = NotificationService.nextInstanceOfTimeFrom(
        const TimeOfDay(hour: 7, minute: 0),
        now,
      );
      expect(next.year, 2026);
      expect(next.month, 6);
      expect(next.day, 1);
      expect(next.hour, 7);
    });
  });
}
