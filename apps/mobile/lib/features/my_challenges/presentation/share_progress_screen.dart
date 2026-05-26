import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/network/models.dart';
import '../../../core/theme/v_categories.dart';
import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_spacing.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/utils/progress_calculator.dart';
import '../../../core/widgets/v_button.dart';
import '../../../core/widgets/v_icon_button.dart';
import '../../challenges/presentation/challenges_provider.dart';
import 'my_challenges_provider.dart';

class ShareProgressScreen extends ConsumerStatefulWidget {
  const ShareProgressScreen({super.key, required this.userChallengeId});
  final String userChallengeId;

  @override
  ConsumerState<ShareProgressScreen> createState() =>
      _ShareProgressScreenState();
}

class _ShareProgressScreenState extends ConsumerState<ShareProgressScreen> {
  final GlobalKey _cardKey = GlobalKey();
  bool _sharing = false;

  Future<void> _shareImage(String challengeTitle, int activeDays, int dayNumber) async {
    if (_sharing) return;
    setState(() => _sharing = true);
    try {
      final bytes = await _capturePng();
      if (bytes == null) {
        throw Exception('Capture failed.');
      }

      final tmpDir = await getTemporaryDirectory();
      final file = File(
          '${tmpDir.path}/vital30-progress-${DateTime.now().millisecondsSinceEpoch}.png');
      await file.writeAsBytes(bytes);

      final text =
          "I'm on day $dayNumber of $challengeTitle on Vital30. $activeDays active days so far. Join me — https://vital30.com/download";

      await SharePlus.instance.share(
        ShareParams(
          text: text,
          files: [XFile(file.path, mimeType: 'image/png')],
          subject: 'My Vital30 progress',
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not share: $e')),
      );
    } finally {
      if (mounted) setState(() => _sharing = false);
    }
  }

  Future<Uint8List?> _capturePng() async {
    final boundary = _cardKey.currentContext?.findRenderObject()
        as RenderRepaintBoundary?;
    if (boundary == null) return null;
    // Higher pixelRatio = sharper image. 3.0 yields ~1080x1920 from a
    // 360x640 logical card — perfect for IG stories.
    final ui.Image image = await boundary.toImage(pixelRatio: 3.0);
    final byteData =
        await image.toByteData(format: ui.ImageByteFormat.png);
    return byteData?.buffer.asUint8List();
  }

  @override
  Widget build(BuildContext context) {
    final myAsync = ref.watch(myChallengesNotifierProvider);
    final challengesAsync = ref.watch(challengesProvider);
    final checkinsAsync =
        ref.watch(checkinsProvider(widget.userChallengeId));

    return Scaffold(
      backgroundColor: Vital30Colors.surface,
      body: SafeArea(
        child: myAsync.when(
          loading: () =>
              const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(
            child: Text('Could not load: $e', style: Vital30Text.body),
          ),
          data: (list) {
            final uc = list.firstWhere(
              (u) => u.id == widget.userChallengeId,
              orElse: () => UserChallenge(
                id: '',
                userId: '',
                challengeId: '',
                status: 'ACTIVE',
                startDate: DateTime.now(),
                progressPercent: 0,
              ),
            );
            if (uc.id.isEmpty) {
              return const Center(child: Text('Challenge not found'));
            }

            final challenge = challengesAsync.maybeWhen(
              data: (cs) => cs.firstWhere(
                (c) => c.id == uc.challengeId,
                orElse: () => cs.first,
              ),
              orElse: () => null,
            );
            if (challenge == null) {
              return const Center(child: CircularProgressIndicator());
            }

            final dayNumber = DateTime.now()
                    .toUtc()
                    .difference(uc.startDate.toUtc())
                    .inDays +
                1;
            final clampedDay = dayNumber.clamp(1, challenge.durationDays);
            final checkins =
                checkinsAsync.valueOrNull ?? const <DailyCheckin>[];
            final stats = ProgressCalculator.calculate(checkins);

            return Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                  child: Row(
                    children: [
                      VIconButton(
                        icon: Icons.arrow_back_ios_new,
                        iconSize: 16,
                        onPressed: () => context.pop(),
                      ),
                      const Spacer(),
                      Text(
                        'Share progress',
                        style: Vital30Text.h3.copyWith(fontSize: 16),
                      ),
                      const Spacer(),
                      const SizedBox(width: 40),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Center(
                      child: RepaintBoundary(
                        key: _cardKey,
                        child: _ShareCard(
                          challenge: challenge,
                          activeDays: stats.completedCount,
                          totalDays: challenge.durationDays,
                          dayNumber: clampedDay,
                          currentStreak: stats.currentStreak,
                          checkins: checkins,
                          startDate: uc.startDate,
                        ),
                      ),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                  child: VButton(
                    label: _sharing ? 'Preparing…' : 'Share to…',
                    fullWidth: true,
                    icon: Icons.ios_share,
                    onPressed: _sharing
                        ? null
                        : () => _shareImage(
                              challenge.title,
                              stats.completedCount,
                              clampedDay,
                            ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

/// The image that gets captured. Sized to 9:16 (story-ratio) so it looks
/// right on Instagram, WhatsApp status, etc.
class _ShareCard extends StatelessWidget {
  const _ShareCard({
    required this.challenge,
    required this.activeDays,
    required this.totalDays,
    required this.dayNumber,
    required this.currentStreak,
    required this.checkins,
    required this.startDate,
  });

  final Challenge challenge;
  final int activeDays;
  final int totalDays;
  final int dayNumber;
  final int currentStreak;
  final List<DailyCheckin> checkins;
  final DateTime startDate;

  @override
  Widget build(BuildContext context) {
    final category = Vital30Categories.fromCategoryId(challenge.categoryId);
    final catStyle = Vital30Categories.of(category);

    // Map each calendar day to a status for the 30-day grid.
    final statusByDay = <int, String>{};
    for (final c in checkins) {
      final dayIdx = c.checkinDate.toUtc().difference(startDate.toUtc()).inDays;
      if (dayIdx >= 0 && dayIdx < totalDays) {
        statusByDay[dayIdx] = c.status;
      }
    }

    return Container(
      width: 320,
      height: 568, // 9:16 ratio
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [catStyle.tint, Vital30Colors.surface],
        ),
        borderRadius: BorderRadius.circular(Vital30Radius.xl),
        border: Border.all(color: Vital30Colors.hairlineSoft),
      ),
      padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: Vital30Colors.primary,
                  borderRadius: BorderRadius.circular(8),
                ),
                alignment: Alignment.center,
                child: const Text(
                  'V',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'Vital30',
                style: Vital30Text.title.copyWith(fontSize: 16),
              ),
            ],
          ),
          const SizedBox(height: 26),
          Text(
            catStyle.label.toUpperCase(),
            style: Vital30Text.eyebrow.copyWith(
              color: catStyle.ink,
              fontSize: 11,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            challenge.title,
            maxLines: 3,
            style: GoogleFonts.instrumentSerif(
              fontSize: 30,
              height: 1.1,
              color: Vital30Colors.ink,
              fontWeight: FontWeight.w400,
            ),
          ),
          const SizedBox(height: 26),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '$activeDays',
                style: GoogleFonts.instrumentSerif(
                  fontStyle: FontStyle.italic,
                  fontSize: 64,
                  height: 0.95,
                  color: Vital30Colors.ink,
                ),
              ),
              const SizedBox(width: 10),
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(
                  'of $totalDays\nactive days',
                  style: Vital30Text.body.copyWith(
                    fontSize: 13,
                    color: Vital30Colors.inkSoft,
                    height: 1.25,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              _StatChip(label: 'Day $dayNumber of $totalDays'),
              const SizedBox(width: 8),
              _StatChip(label: '$currentStreak-day streak'),
            ],
          ),
          const Spacer(),
          // 30-day grid
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 6,
              mainAxisSpacing: 4,
              crossAxisSpacing: 4,
              childAspectRatio: 1,
            ),
            itemCount: totalDays,
            itemBuilder: (context, i) {
              final status = statusByDay[i];
              Color color;
              if (status == 'COMPLETED') {
                color = Vital30Colors.primary;
              } else if (status == 'MISSED') {
                color = Vital30Colors.berryTint;
              } else if (status == 'SKIPPED') {
                color = Vital30Colors.hairline;
              } else {
                color = Vital30Colors.surface;
              }
              return Container(
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: Vital30Colors.hairlineSoft),
                ),
              );
            },
          ),
          const SizedBox(height: 18),
          Text(
            '30 days. Better habits. Healthier you.',
            style: Vital30Text.caption.copyWith(
              fontSize: 11,
              color: Vital30Colors.inkSoft,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            'vital30.com',
            style: Vital30Text.caption.copyWith(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: Vital30Colors.primary,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  const _StatChip({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Vital30Colors.surface,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Vital30Colors.hairline),
      ),
      child: Text(
        label,
        style: Vital30Text.caption.copyWith(
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
