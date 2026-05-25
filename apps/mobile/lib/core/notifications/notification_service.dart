import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:timezone/data/latest_all.dart' as tz_data;
import 'package:timezone/timezone.dart' as tz;

/// Wraps [FlutterLocalNotificationsPlugin] so the rest of the app never
/// imports the plugin directly. UI calls high-level intents
/// (schedule/cancel) and the implementation handles platform details.
final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService(FlutterLocalNotificationsPlugin());
});

class NotificationService {
  NotificationService(this._plugin);
  final FlutterLocalNotificationsPlugin _plugin;

  static const _dailyReminderId = 1001;
  static const _dailyReminderChannelId = 'vital30_daily_reminder';
  static const _dailyReminderChannelName = 'Daily reminder';
  static const _dailyReminderChannelDescription =
      'A daily nudge to check in on your active challenge.';

  bool _initialized = false;

  Future<void> init() async {
    if (_initialized) return;
    await _configureTimezone();

    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const darwinInit = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );
    const initSettings = InitializationSettings(
      android: androidInit,
      iOS: darwinInit,
      macOS: darwinInit,
    );

    await _plugin.initialize(initSettings);
    _initialized = true;
  }

  Future<void> _configureTimezone() async {
    tz_data.initializeTimeZones();
    try {
      final name = await FlutterTimezone.getLocalTimezone();
      tz.setLocalLocation(tz.getLocation(name));
    } catch (e) {
      debugPrint('[NotificationService] Falling back to UTC timezone: $e');
      tz.setLocalLocation(tz.UTC);
    }
  }

  /// Asks the OS for permission to display notifications.
  /// Returns true if the user granted (or has already granted) permission.
  Future<bool> requestPermission() async {
    if (Platform.isIOS || Platform.isMacOS) {
      final ios = _plugin.resolvePlatformSpecificImplementation<
          IOSFlutterLocalNotificationsPlugin>();
      final granted = await ios?.requestPermissions(
        alert: true,
        badge: true,
        sound: true,
      );
      return granted ?? false;
    }
    if (Platform.isAndroid) {
      final android = _plugin.resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>();
      final granted = await android?.requestNotificationsPermission();
      return granted ?? true;
    }
    return false;
  }

  /// (Re)schedule the daily reminder at the given time. Replaces any
  /// existing daily reminder so the caller doesn't need to cancel first.
  Future<void> scheduleDailyReminder(TimeOfDay time) async {
    if (!_initialized) await init();

    final scheduled = _nextInstanceOfTime(time);

    const androidDetails = AndroidNotificationDetails(
      _dailyReminderChannelId,
      _dailyReminderChannelName,
      channelDescription: _dailyReminderChannelDescription,
      importance: Importance.high,
      priority: Priority.high,
    );
    const darwinDetails = DarwinNotificationDetails();
    const details = NotificationDetails(
      android: androidDetails,
      iOS: darwinDetails,
      macOS: darwinDetails,
    );

    await _plugin.zonedSchedule(
      _dailyReminderId,
      'Vital30',
      "Time for today's check-in.",
      scheduled,
      details,
      androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      matchDateTimeComponents: DateTimeComponents.time,
    );
  }

  Future<void> cancelDailyReminder() async {
    if (!_initialized) await init();
    await _plugin.cancel(_dailyReminderId);
  }

  /// Returns the next [tz.TZDateTime] matching the wall-clock [time].
  /// Public so it can be unit-tested in isolation.
  @visibleForTesting
  static tz.TZDateTime nextInstanceOfTimeFrom(
    TimeOfDay time,
    tz.TZDateTime now,
  ) {
    var scheduled = tz.TZDateTime(
      now.location,
      now.year,
      now.month,
      now.day,
      time.hour,
      time.minute,
    );
    if (!scheduled.isAfter(now)) {
      scheduled = scheduled.add(const Duration(days: 1));
    }
    return scheduled;
  }

  tz.TZDateTime _nextInstanceOfTime(TimeOfDay time) {
    return nextInstanceOfTimeFrom(time, tz.TZDateTime.now(tz.local));
  }
}
