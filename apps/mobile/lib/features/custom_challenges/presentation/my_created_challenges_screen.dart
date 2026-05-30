import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart' show SharePlus, ShareParams;

import '../../../core/network/api_service.dart';
import '../../../core/network/models.dart';
import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_spacing.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/widgets/v_button.dart';
import '../../../core/widgets/v_icon_button.dart';

final myCreatedChallengesProvider =
    FutureProvider<List<CustomChallenge>>((ref) async {
  return ref.read(apiServiceProvider).getMyCreatedChallenges();
});

class MyCreatedChallengesScreen extends ConsumerWidget {
  const MyCreatedChallengesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final list = ref.watch(myCreatedChallengesProvider);
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
                    onPressed: () => context.pop(),
                  ),
                  const SizedBox(width: 14),
                  Text('Challenges you created',
                      style: Vital30Text.h3.copyWith(fontSize: 16)),
                  const Spacer(),
                  VButton(
                    label: 'New',
                    kind: VButtonKind.primary,
                    size: VButtonSize.sm,
                    icon: Icons.add,
                    onPressed: () => context.push('/create-challenge'),
                  ),
                ],
              ),
            ),
            Expanded(
              child: list.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Text('Could not load: $e',
                        style: Vital30Text.body, textAlign: TextAlign.center),
                  ),
                ),
                data: (items) {
                  if (items.isEmpty) {
                    return Center(
                      child: Padding(
                        padding: const EdgeInsets.all(32),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text('No custom challenges yet',
                                style: Vital30Text.h3),
                            const SizedBox(height: 8),
                            Text(
                              'Make one with custom days and invite people.',
                              style: Vital30Text.body,
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 18),
                            VButton(
                              label: 'Create your first',
                              icon: Icons.add,
                              onPressed: () =>
                                  context.push('/create-challenge'),
                            ),
                          ],
                        ),
                      ),
                    );
                  }
                  return RefreshIndicator(
                    onRefresh: () =>
                        ref.refresh(myCreatedChallengesProvider.future),
                    child: ListView.separated(
                      padding: const EdgeInsets.fromLTRB(
                          Vital30Space.screenH, 16, Vital30Space.screenH, 32),
                      itemCount: items.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (_, i) => _CreatedCard(challenge: items[i]),
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

class _CreatedCard extends StatelessWidget {
  const _CreatedCard({required this.challenge});
  final CustomChallenge challenge;

  String get _shareUrl =>
      'https://vital30.com/c/${challenge.inviteToken ?? ""}';

  String get _shareText =>
      'Join my "${challenge.title}" challenge on Vital30:\n$_shareUrl';

  @override
  Widget build(BuildContext context) {
    final isPublic = challenge.visibility == 'PUBLIC';
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Vital30Colors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Vital30Colors.hairlineSoft),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(challenge.title,
                    style: Vital30Text.title.copyWith(fontSize: 15)),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: isPublic
                      ? Vital30Colors.primaryTint
                      : Vital30Colors.surfaceAlt,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  challenge.visibility.toLowerCase(),
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: isPublic
                        ? Vital30Colors.primaryDeep
                        : Vital30Colors.inkSoft,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(challenge.shortDescription,
              style: Vital30Text.body.copyWith(fontSize: 13)),
          const SizedBox(height: 8),
          Text(
            '${challenge.durationDays} days · ${challenge.joinedCount} joined · ${challenge.inviteCount} invited',
            style: Vital30Text.caption.copyWith(fontSize: 12),
          ),
          if (challenge.inviteToken != null) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: VButton(
                    label: 'Copy link',
                    kind: VButtonKind.secondary,
                    size: VButtonSize.sm,
                    icon: Icons.link,
                    onPressed: () {
                      Clipboard.setData(ClipboardData(text: _shareUrl));
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Link copied.')),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: VButton(
                    label: 'Share',
                    kind: VButtonKind.dark,
                    size: VButtonSize.sm,
                    icon: Icons.ios_share,
                    onPressed: () =>
                        SharePlus.instance.share(ShareParams(text: _shareText)),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
