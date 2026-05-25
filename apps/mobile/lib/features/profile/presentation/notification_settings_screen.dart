import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_spacing.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/widgets/v_icon_button.dart';
import '../application/notification_settings_provider.dart';

class NotificationSettingsScreen extends ConsumerWidget {
  const NotificationSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(notificationSettingsProvider);
    final notifier = ref.read(notificationSettingsProvider.notifier);
    final prefs = state.preferences;

    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(0, 12, 0, 30),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
              child: Row(
                children: [
                  VIconButton(
                    icon: Icons.arrow_back_ios_new,
                    iconSize: 16,
                    onPressed: () => context.pop(),
                  ),
                  const SizedBox(width: 14),
                  Text('Notifications',
                      style: Vital30Text.h3.copyWith(fontSize: 16)),
                ],
              ),
            ),
            const SizedBox(height: 20),
            _Section(
              title: 'Daily',
              rows: [
                _SettingRow(
                  title: 'Daily reminder',
                  description: 'A friendly nudge to check in.',
                  trailing: state.reminderTime.format(context),
                  trailingTap: () => context.push('/reminder-time'),
                  toggle: prefs.daily,
                  onToggle: notifier.setDailyReminderEnabled,
                ),
                _SettingRow(
                  title: 'Quiet hours',
                  description: 'No reminders 10pm – 7am.',
                  toggle: prefs.quietHours,
                  onToggle: notifier.setQuietHoursEnabled,
                ),
              ],
            ),
            _Section(
              title: 'Milestones & friends',
              rows: [
                _SettingRow(
                  title: 'Streak milestones',
                  description: 'Day 7, 14, 21 celebrations.',
                  toggle: prefs.streakMilestones,
                  onToggle: notifier.setStreakMilestonesEnabled,
                ),
                _SettingRow(
                  title: 'Challenge complete',
                  description: 'When you finish day 30.',
                  toggle: prefs.challengeComplete,
                  onToggle: notifier.setChallengeCompleteEnabled,
                ),
                _SettingRow(
                  title: 'Friend activity',
                  description: 'When friends join challenges via your invite.',
                  toggle: prefs.friendActivity,
                  onToggle: notifier.setFriendActivityEnabled,
                ),
              ],
            ),
            _Section(
              title: 'Updates',
              rows: [
                _SettingRow(
                  title: 'Weekly summary',
                  description: 'Sundays at 7pm.',
                  toggle: prefs.weeklySummary,
                  onToggle: notifier.setWeeklySummaryEnabled,
                ),
                _SettingRow(
                  title: 'New challenges',
                  description: 'When new categories or challenges launch.',
                  toggle: prefs.newChallenges,
                  onToggle: notifier.setNewChallengesEnabled,
                ),
                _SettingRow(
                  title: 'Tips & guides',
                  description: 'Short reads on habit science.',
                  toggle: prefs.tips,
                  onToggle: notifier.setTipsEnabled,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _SettingRow {
  const _SettingRow({
    required this.title,
    required this.description,
    required this.toggle,
    required this.onToggle,
    this.trailing,
    this.trailingTap,
  });
  final String title;
  final String description;
  final bool toggle;
  final ValueChanged<bool> onToggle;
  final String? trailing;
  final VoidCallback? trailingTap;
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.rows});
  final String title;
  final List<_SettingRow> rows;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding:
          const EdgeInsets.fromLTRB(Vital30Space.screenH, 0, Vital30Space.screenH, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 0, 4, 8),
            child: Text(title.toUpperCase(), style: Vital30Text.label),
          ),
          Container(
            decoration: BoxDecoration(
              color: Vital30Colors.card,
              borderRadius: BorderRadius.circular(Vital30Radius.lg),
              border: Border.all(color: Vital30Colors.hairlineSoft),
            ),
            child: Column(
              children: [
                for (var i = 0; i < rows.length; i++) ...[
                  Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 14),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(rows[i].title,
                                  style: Vital30Text.title
                                      .copyWith(fontSize: 14)),
                              const SizedBox(height: 2),
                              Text(
                                rows[i].description,
                                style: Vital30Text.caption,
                              ),
                            ],
                          ),
                        ),
                        if (rows[i].trailing != null)
                          GestureDetector(
                            onTap: rows[i].trailingTap,
                            child: Padding(
                              padding: const EdgeInsets.only(right: 10),
                              child: Text(
                                rows[i].trailing!,
                                style: Vital30Text.body.copyWith(
                                  color: Vital30Colors.primary,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ),
                        Switch.adaptive(
                          value: rows[i].toggle,
                          onChanged: rows[i].onToggle,
                        ),
                      ],
                    ),
                  ),
                  if (i < rows.length - 1)
                    const Divider(
                      height: 1,
                      indent: 14,
                      endIndent: 14,
                      color: Vital30Colors.hairlineSoft,
                    ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
