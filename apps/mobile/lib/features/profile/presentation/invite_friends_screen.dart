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
import '../application/referral_provider.dart';

class InviteFriendsScreen extends ConsumerWidget {
  const InviteFriendsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final referral = ref.watch(referralProvider);

    return Scaffold(
      body: SafeArea(
        child: referral.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, _) => Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('Could not load your invite code.',
                      style: Vital30Text.body, textAlign: TextAlign.center),
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: () =>
                        ref.read(referralProvider.notifier).refresh(),
                    child: const Text('Try again'),
                  ),
                ],
              ),
            ),
          ),
          data: (info) => ListView(
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
                padding: const EdgeInsets.symmetric(
                    horizontal: Vital30Space.screenH),
                child: _HeroCard(referredCount: info.referredCount),
              ),
              const SizedBox(height: 18),
              Padding(
                padding: const EdgeInsets.symmetric(
                    horizontal: Vital30Space.screenH),
                child: _CodeTile(
                  code: info.code,
                  onCopy: () {
                    Clipboard.setData(ClipboardData(text: info.code));
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Copied ${info.code}')),
                    );
                  },
                ),
              ),
              const SizedBox(height: 18),
              Padding(
                padding: const EdgeInsets.symmetric(
                    horizontal: Vital30Space.screenH),
                child: _PlatformGrid(code: info.code, shareText: info.shareText),
              ),
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(
                    horizontal: Vital30Space.screenH),
                child: VButton(
                  label: 'Share invite link',
                  fullWidth: true,
                  icon: Icons.ios_share,
                  onPressed: () => SharePlus.instance
                      .share(ShareParams(text: info.shareText)),
                ),
              ),
              const SizedBox(height: 24),
              Padding(
                padding: const EdgeInsets.symmetric(
                    horizontal: Vital30Space.screenH),
                child: _RedeemTile(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RedeemTile extends ConsumerStatefulWidget {
  @override
  ConsumerState<_RedeemTile> createState() => _RedeemTileState();
}

class _RedeemTileState extends ConsumerState<_RedeemTile> {
  final _controller = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final code = _controller.text.trim();
    if (code.isEmpty) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    final err = await ref.read(referralProvider.notifier).redeem(code);
    if (!mounted) return;
    setState(() {
      _busy = false;
      _error = err;
    });
    if (err == null) {
      _controller.clear();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Referral code redeemed.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Vital30Colors.card,
        borderRadius: BorderRadius.circular(Vital30Radius.lg),
        border: Border.all(color: Vital30Colors.hairlineSoft),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('HAVE A CODE?', style: Vital30Text.label),
          const SizedBox(height: 8),
          Text(
            'Enter a friend\'s code to credit them as your referrer.',
            style: Vital30Text.body.copyWith(fontSize: 13),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _controller,
                  textCapitalization: TextCapitalization.characters,
                  decoration: InputDecoration(
                    hintText: 'ABCD1234',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 12),
                    errorText: _error,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              VButton(
                label: _busy ? 'Redeeming…' : 'Redeem',
                kind: VButtonKind.primary,
                size: VButtonSize.sm,
                onPressed: _busy ? null : _submit,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({required this.referredCount});
  final int referredCount;

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
            referredCount == 0
                ? 'Friends who start a challenge together are 2x more likely to finish.'
                : '$referredCount ${referredCount == 1 ? "friend has" : "friends have"} joined with your code.',
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
  const _PlatformGrid({required this.code, required this.shareText});
  final String code;
  final String shareText;
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
              onTap: () =>
                  SharePlus.instance.share(ShareParams(text: shareText)),
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

