import 'package:flutter/material.dart';

import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_spacing.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/widgets/v_button.dart';

class StreakMilestoneModal extends StatelessWidget {
  const StreakMilestoneModal({
    super.key,
    required this.streakDays,
    required this.totalDays,
    this.title,
    this.subtitle,
    this.onShare,
  });

  final int streakDays;
  final int totalDays;
  final String? title;
  final String? subtitle;
  final VoidCallback? onShare;

  static Future<void> show(
    BuildContext context, {
    required int streakDays,
    int totalDays = 30,
    String? title,
    String? subtitle,
    VoidCallback? onShare,
  }) {
    return showDialog(
      context: context,
      barrierColor: Colors.black.withValues(alpha: 0.55),
      builder: (_) => StreakMilestoneModal(
        streakDays: streakDays,
        totalDays: totalDays,
        title: title,
        subtitle: subtitle,
        onShare: onShare,
      ),
    );
  }

  String get _milestoneTitle {
    if (title != null) return title!;
    if (streakDays == 7) return 'One week';
    if (streakDays == 14) return 'Two weeks';
    if (streakDays == 21) return 'Three weeks';
    return '$streakDays days';
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Vital30Colors.surface,
      insetPadding: const EdgeInsets.symmetric(horizontal: 18),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(Vital30Radius.xl),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          Positioned(
            top: -60,
            left: 0,
            right: 0,
            child: Container(
              height: 300,
              decoration: const BoxDecoration(
                gradient: RadialGradient(
                  colors: [Vital30Colors.accentTint, Vital30Colors.surface],
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(22, 34, 22, 22),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _StreakBadge(streakDays: streakDays),
                const SizedBox(height: 22),
                Text(
                  'STREAK MILESTONE',
                  style: Vital30Text.eyebrow.copyWith(
                    color: Vital30Colors.accent,
                    letterSpacing: 1.8,
                    fontSize: 11,
                  ),
                ),
                const SizedBox(height: 8),
                RichText(
                  textAlign: TextAlign.center,
                  text: TextSpan(
                    style: Vital30Text.h2.copyWith(fontSize: 26),
                    children: [
                      TextSpan(text: '$_milestoneTitle '),
                      TextSpan(
                        text: 'strong',
                        style: Vital30Text.serifAccent(
                          size: 26,
                          color: Vital30Colors.primary,
                        ),
                      ),
                      const TextSpan(text: '.'),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  subtitle ??
                      '$streakDays days strong. Keep going — your next milestone is on its way.',
                  textAlign: TextAlign.center,
                  style: Vital30Text.body.copyWith(
                    color: Vital30Colors.inkSoft,
                    fontSize: 13.5,
                  ),
                ),
                const SizedBox(height: 18),
                _MiniGrid(done: streakDays, total: totalDays.clamp(streakDays, 30)),
                const SizedBox(height: 22),
                VButton(
                  label: 'Share milestone',
                  fullWidth: true,
                  icon: Icons.ios_share,
                  onPressed: () {
                    onShare?.call();
                    Navigator.of(context).pop();
                  },
                ),
                const SizedBox(height: 4),
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: Text(
                    'Keep going',
                    style: Vital30Text.body.copyWith(
                      color: Vital30Colors.inkSoft,
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StreakBadge extends StatelessWidget {
  const _StreakBadge({required this.streakDays});
  final int streakDays;
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 120,
      height: 120,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              color: Vital30Colors.ink,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.45),
                  offset: const Offset(0, 22),
                  blurRadius: 40,
                  spreadRadius: -14,
                ),
              ],
            ),
            alignment: Alignment.center,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  streakDays.toString().padLeft(2, '0'),
                  style: Vital30Text.serifAccent(
                    size: 52,
                    color: Vital30Colors.accent,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'DAY STREAK',
                  style: Vital30Text.label.copyWith(
                    color: Vital30Colors.surface.withValues(alpha: 0.65),
                    fontSize: 9,
                    letterSpacing: 1.4,
                  ),
                ),
              ],
            ),
          ),
          Positioned(
            top: -6,
            right: -6,
            child: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: Vital30Colors.accent,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Vital30Colors.accent.withValues(alpha: 0.6),
                    offset: const Offset(0, 6),
                    blurRadius: 12,
                    spreadRadius: -4,
                  ),
                ],
              ),
              alignment: Alignment.center,
              child: const Icon(
                Icons.local_fire_department,
                size: 18,
                color: Vital30Colors.surface,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MiniGrid extends StatelessWidget {
  const _MiniGrid({required this.done, required this.total});
  final int done;
  final int total;
  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        for (var i = 0; i < total; i++)
          Padding(
            padding: EdgeInsets.only(right: i == total - 1 ? 0 : 5),
            child: Container(
              width: 14,
              height: 14,
              decoration: BoxDecoration(
                color: i < done ? Vital30Colors.primary : Colors.transparent,
                borderRadius: BorderRadius.circular(4),
                border: i == done
                    ? Border.all(color: Vital30Colors.ink, width: 2)
                    : (i > done
                        ? Border.all(color: Vital30Colors.hairline)
                        : null),
              ),
            ),
          ),
      ],
    );
  }
}
