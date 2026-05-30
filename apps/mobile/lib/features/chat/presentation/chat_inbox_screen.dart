import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/network/mock_data.dart';
import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_spacing.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/widgets/v_button.dart';
import '../../../core/widgets/v_icon_button.dart';
import '../../challenges/presentation/challenges_provider.dart';
import '../../my_challenges/presentation/my_challenges_provider.dart';

/// Chat inbox — "your conversations" surface. One row per ACTIVE challenge
/// the user has joined; tap a row to open that challenge's community chat.
///
/// Completed/abandoned challenges still have chats (the API doesn't gate on
/// status) but we hide them here so the inbox stays a "what am I currently
/// part of" view — matching the web `/chat` page.
class ChatInboxScreen extends ConsumerWidget {
  const ChatInboxScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final myAsync = ref.watch(myChallengesNotifierProvider);

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: Row(
                children: [
                  VIconButton(
                    icon: Icons.arrow_back_ios_new,
                    iconSize: 16,
                    onPressed: () =>
                        context.canPop() ? context.pop() : context.go('/home'),
                  ),
                  const SizedBox(width: 14),
                  Text('Chats', style: Vital30Text.h3.copyWith(fontSize: 16)),
                  const Spacer(),
                  Text('One channel per active challenge',
                      style: Vital30Text.caption.copyWith(fontSize: 11)),
                ],
              ),
            ),
            Expanded(
              child: myAsync.when(
                loading: () => const Center(
                  child:
                      CircularProgressIndicator(color: Vital30Colors.primary),
                ),
                error: (_, __) => _ErrorState(
                  onRetry: () =>
                      ref.read(myChallengesNotifierProvider.notifier).load(),
                ),
                data: (list) {
                  final active = list
                      .where((u) => u.status == 'ACTIVE')
                      .toList()
                    ..sort((a, b) => b.startDate.compareTo(a.startDate));
                  if (active.isEmpty) return const _EmptyState();
                  return RefreshIndicator(
                    color: Vital30Colors.primary,
                    onRefresh: () =>
                        ref.read(myChallengesNotifierProvider.notifier).load(),
                    child: ListView.separated(
                      padding: const EdgeInsets.fromLTRB(
                          Vital30Space.screenH, 12, Vital30Space.screenH, 32),
                      itemCount: active.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (_, i) => _InboxRow(uc: active[i]),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InboxRow extends ConsumerWidget {
  const _InboxRow({required this.uc});
  final UserChallenge uc;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final challengesAsync = ref.watch(challengesProvider);
    final challenge = challengesAsync.maybeWhen(
      data: (l) {
        for (final c in l) {
          if (c.id == uc.challengeId) return c;
        }
        return null;
      },
      orElse: () => null,
    );
    final title = challenge?.title ?? 'Challenge';
    final totalDays = challenge?.durationDays ?? 30;
    final dayN = (DateTime.now().difference(uc.startDate.toLocal()).inDays + 1)
        .clamp(1, totalDays);

    return Material(
      color: Vital30Colors.card,
      borderRadius: BorderRadius.circular(Vital30Radius.lg),
      child: InkWell(
        borderRadius: BorderRadius.circular(Vital30Radius.lg),
        onTap: () => context.push('/chat/${uc.challengeId}'),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(Vital30Radius.lg),
            border: Border.all(color: Vital30Colors.hairlineSoft),
            boxShadow: Vital30Shadow.card,
          ),
          child: Row(
            children: [
              _ChannelAvatar(title: title),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Vital30Text.title.copyWith(fontSize: 15),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 3),
                    Row(
                      children: [
                        const Icon(Icons.forum_outlined,
                            size: 13, color: Vital30Colors.muted),
                        const SizedBox(width: 5),
                        Text('Community chat · Day $dayN of $totalDays',
                            style: Vital30Text.caption.copyWith(fontSize: 12)),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              const Icon(Icons.chevron_right,
                  size: 20, color: Vital30Colors.muted),
            ],
          ),
        ),
      ),
    );
  }
}

class _ChannelAvatar extends StatelessWidget {
  const _ChannelAvatar({required this.title});
  final String title;

  String get _initials {
    final parts = title.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) return '·';
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return (parts.first.substring(0, 1) + parts[1].substring(0, 1))
        .toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 46,
      height: 46,
      decoration: const BoxDecoration(
        color: Vital30Colors.primaryDeep,
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: Text(
        _initials,
        style: GoogleFonts.manrope(
          color: Vital30Colors.onPrimary,
          fontWeight: FontWeight.w800,
          fontSize: 14,
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.forum_outlined,
                size: 56, color: Vital30Colors.inkSoft),
            const SizedBox(height: 12),
            Text('No active challenges yet', style: Vital30Text.h3),
            const SizedBox(height: 6),
            Text(
              'Each challenge you join has its own community chat. Pick one '
              'to get started.',
              style: Vital30Text.body,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 18),
            VButton(
              label: 'Browse challenges',
              size: VButtonSize.md,
              onPressed: () => context.go('/home'),
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.onRetry});
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline,
                size: 48, color: Vital30Colors.inkSoft),
            const SizedBox(height: 12),
            Text('Could not load your chats.',
                style: Vital30Text.body, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            TextButton(onPressed: onRetry, child: const Text('Try again')),
          ],
        ),
      ),
    );
  }
}
