import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../network/models.dart';
import '../theme/v_categories.dart';
import '../theme/v_colors.dart';
import '../theme/v_spacing.dart';
import '../theme/v_typography.dart';
import 'cat_tile.dart';
import 'v_button.dart';
import 'v_pill.dart';

enum ChallengeCardVariant { list, heroHorizontal }

class ChallengeCard extends StatelessWidget {
  const ChallengeCard({
    super.key,
    required this.challenge,
    this.variant = ChallengeCardVariant.list,
    this.badge,
    this.participants,
    this.onTap,
    this.onJoinTap,
    this.showJoin = true,
  });

  final Challenge challenge;
  final ChallengeCardVariant variant;
  final String? badge;
  final String? participants;
  final VoidCallback? onTap;
  final VoidCallback? onJoinTap;
  final bool showJoin;

  Vital30Category get _category =>
      Vital30Categories.fromCategoryId(challenge.categoryId);

  String get _diff {
    switch (challenge.difficulty.toUpperCase()) {
      case 'EASY':
        return 'Beginner';
      case 'MEDIUM':
        return 'Moderate';
      case 'HARD':
        return 'Hard';
      default:
        return challenge.difficulty;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (variant == ChallengeCardVariant.heroHorizontal) {
      return _buildHero(context);
    }
    return _buildList(context);
  }

  Widget _buildHero(BuildContext context) {
    final style = Vital30Categories.of(_category);
    return Material(
      color: Vital30Colors.card,
      borderRadius: BorderRadius.circular(Vital30Radius.lg),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(Vital30Radius.lg),
        child: Container(
          width: 240,
          decoration: BoxDecoration(
            color: Vital30Colors.card,
            borderRadius: BorderRadius.circular(Vital30Radius.lg),
            border: Border.all(color: Vital30Colors.hairlineSoft),
            boxShadow: Vital30Shadow.card,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(Vital30Radius.lg),
                ),
                child: Container(
                  height: 96,
                  width: double.infinity,
                  color: style.tint,
                  padding: const EdgeInsets.all(14),
                  child: Stack(
                    clipBehavior: Clip.hardEdge,
                    children: [
                      Positioned(
                        right: -10,
                        bottom: -50,
                        child: Text(
                          '30',
                          style: GoogleFonts.instrumentSerif(
                            fontStyle: FontStyle.italic,
                            fontSize: 130,
                            fontWeight: FontWeight.w400,
                            color: style.ink.withValues(alpha: 0.18),
                            height: 1,
                          ),
                        ),
                      ),
                      CatTile(category: _category, size: 34, radius: 9),
                      if (badge != null)
                        Positioned(
                          top: 0,
                          right: 0,
                          child: VPill(
                            label: badge!,
                            tone: VPillTone.dark,
                            size: VPillSize.sm,
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(14, 14, 14, 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      style.short.toUpperCase(),
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.3,
                        color: style.ink.withValues(alpha: 0.8),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      challenge.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Vital30Text.title.copyWith(
                        fontSize: 15.5,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        if (participants != null)
                          Text(
                            '$participants joined',
                            style: Vital30Text.caption.copyWith(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w600,
                            ),
                          )
                        else
                          Text(
                            '30 days',
                            style: Vital30Text.caption.copyWith(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        VPill(
                          label: _diff,
                          tone: VPillTone.outline,
                          size: VPillSize.sm,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildList(BuildContext context) {
    final style = Vital30Categories.of(_category);
    return Material(
      color: Vital30Colors.card,
      borderRadius: BorderRadius.circular(Vital30Radius.lg),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(Vital30Radius.lg),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Vital30Colors.card,
            borderRadius: BorderRadius.circular(Vital30Radius.lg),
            border: Border.all(color: Vital30Colors.hairlineSoft),
            boxShadow: Vital30Shadow.card,
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: 64,
                height: 64,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: Stack(
                    children: [
                      Container(color: style.tint),
                      Positioned(
                        right: -6,
                        bottom: -16,
                        child: Text(
                          '30',
                          style: GoogleFonts.instrumentSerif(
                            fontStyle: FontStyle.italic,
                            fontSize: 46,
                            fontWeight: FontWeight.w400,
                            color: style.ink.withValues(alpha: 0.18),
                            height: 1,
                          ),
                        ),
                      ),
                      Center(
                        child: Icon(style.glyph, size: 26, color: style.ink),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          style.short.toUpperCase(),
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.3,
                            color: style.ink,
                          ),
                        ),
                        if (badge != null) ...[
                          const SizedBox(width: 6),
                          VPill(
                            label: badge!,
                            tone: VPillTone.primary,
                            size: VPillSize.sm,
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      challenge.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Vital30Text.title.copyWith(
                        fontSize: 15.5,
                        height: 1.22,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      challenge.shortDescription,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Vital30Text.caption.copyWith(fontSize: 12.5),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        VPill(
                          label: _diff,
                          tone: VPillTone.outline,
                          size: VPillSize.sm,
                        ),
                        const SizedBox(width: 6),
                        VPill(
                          label: '30 days',
                          tone: VPillTone.outline,
                          size: VPillSize.sm,
                        ),
                        const Spacer(),
                        if (showJoin)
                          VButton(
                            label: 'Join',
                            kind: VButtonKind.dark,
                            size: VButtonSize.sm,
                            onPressed: onJoinTap ?? onTap,
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
