import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:share_plus/share_plus.dart' show SharePlus, ShareParams;

import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_spacing.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/widgets/v_button.dart';
import '../../../core/widgets/v_icon_button.dart';
import '../../../core/widgets/v_pill.dart';
import '../../auth/presentation/auth_provider.dart';

class InviteFriendsScreen extends ConsumerWidget {
  const InviteFriendsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final code = '${(user?.name ?? 'YOU').split(' ').first.toUpperCase()}-30';

    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(0, 12, 0, 32),
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
                  Text('Invite friends',
                      style: Vital30Text.h3.copyWith(fontSize: 16)),
                ],
              ),
            ),
            const SizedBox(height: 18),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: Vital30Space.screenH),
              child: _HeroCard(),
            ),
            const SizedBox(height: 18),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: Vital30Space.screenH),
              child: _CodeTile(
                code: code,
                onCopy: () {
                  Clipboard.setData(ClipboardData(text: code));
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Copied $code')),
                  );
                },
              ),
            ),
            const SizedBox(height: 18),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: Vital30Space.screenH),
              child: _PlatformGrid(code: code),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: Vital30Space.screenH),
              child: VButton(
                label: 'Share invite link',
                fullWidth: true,
                icon: Icons.ios_share,
                onPressed: () => SharePlus.instance.share(ShareParams(
                  text:
                      'Try Vital30 with me — 30-day wellness challenges. Use code $code to get started.',
                )),
              ),
            ),
            const SizedBox(height: 24),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: Vital30Space.screenH),
              child: _FriendsList(),
            ),
          ],
        ),
      ),
    );
  }
}

class _HeroCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Vital30Colors.ink,
        borderRadius: BorderRadius.circular(Vital30Radius.xl),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: TextSpan(
              style: Vital30Text.h2.copyWith(
                color: Vital30Colors.surface,
                fontSize: 22,
              ),
              children: [
                const TextSpan(text: 'Bring a friend —\n'),
                TextSpan(
                  text: 'better together',
                  style: Vital30Text.serifAccent(
                    size: 22,
                    color: Vital30Colors.accent,
                  ),
                ),
                const TextSpan(text: '.'),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'Friends who start a challenge together are 2x more likely to finish.',
            style: TextStyle(
              fontSize: 13.5,
              color: Vital30Colors.surface.withValues(alpha: 0.7),
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _CodeTile extends StatelessWidget {
  const _CodeTile({required this.code, required this.onCopy});
  final String code;
  final VoidCallback onCopy;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
      decoration: BoxDecoration(
        color: Vital30Colors.card,
        borderRadius: BorderRadius.circular(Vital30Radius.lg),
        border: Border.all(color: Vital30Colors.hairline),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('YOUR INVITE CODE', style: Vital30Text.label),
                const SizedBox(height: 4),
                Text(
                  code,
                  style: GoogleFonts.jetBrainsMono(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: Vital30Colors.ink,
                    letterSpacing: 1,
                  ),
                ),
              ],
            ),
          ),
          VButton(
            label: 'Copy',
            kind: VButtonKind.secondary,
            size: VButtonSize.sm,
            icon: Icons.copy,
            onPressed: onCopy,
          ),
        ],
      ),
    );
  }
}

class _PlatformGrid extends StatelessWidget {
  const _PlatformGrid({required this.code});
  final String code;
  @override
  Widget build(BuildContext context) {
    final platforms = [
      ('WhatsApp', Icons.chat_bubble_outline, const Color(0xFF25D366)),
      ('Instagram', Icons.camera_alt_outlined, const Color(0xFFE1306C)),
      ('Facebook', Icons.facebook, const Color(0xFF1877F2)),
      ('X', Icons.alternate_email, Vital30Colors.ink),
    ];
    return Row(
      children: [
        for (var i = 0; i < platforms.length; i++) ...[
          Expanded(
            child: GestureDetector(
              onTap: () => SharePlus.instance.share(ShareParams(
                text: 'Try Vital30 with code $code.',
              )),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  color: Vital30Colors.card,
                  borderRadius: BorderRadius.circular(Vital30Radius.lg),
                  border: Border.all(color: Vital30Colors.hairlineSoft),
                ),
                child: Column(
                  children: [
                    Icon(platforms[i].$2, color: platforms[i].$3, size: 22),
                    const SizedBox(height: 6),
                    Text(
                      platforms[i].$1,
                      style: Vital30Text.caption.copyWith(
                        fontWeight: FontWeight.w700,
                        fontSize: 11.5,
                        color: Vital30Colors.inkSoft,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          if (i < platforms.length - 1) const SizedBox(width: 10),
        ],
      ],
    );
  }
}

class _FriendsList extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final friends = [
      ('Priya R.', 'Joined Day 3', true),
      ('Arjun N.', 'Joined Day 1', true),
      ('Meera S.', 'Invite pending', false),
      ('Rohan K.', 'Invite pending', false),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: Text('YOUR INVITES', style: Vital30Text.label),
        ),
        const SizedBox(height: 8),
        for (final f in friends) ...[
          Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: Vital30Colors.card,
              borderRadius: BorderRadius.circular(Vital30Radius.lg),
              border: Border.all(color: Vital30Colors.hairlineSoft),
            ),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: f.$3
                        ? Vital30Colors.primaryTint
                        : Vital30Colors.surfaceAlt,
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    f.$1.substring(0, 1),
                    style: TextStyle(
                      color: f.$3
                          ? Vital30Colors.primaryDeep
                          : Vital30Colors.inkSoft,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(f.$1, style: Vital30Text.title.copyWith(fontSize: 14)),
                      Text(f.$2,
                          style: Vital30Text.caption.copyWith(fontSize: 12)),
                    ],
                  ),
                ),
                VPill(
                  label: f.$3 ? 'Joined' : 'Invited',
                  tone: f.$3 ? VPillTone.primary : VPillTone.outline,
                  size: VPillSize.sm,
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}
