import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_spacing.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/widgets/screen_header.dart';
import '../../auth/presentation/auth_provider.dart';
import '../../my_challenges/presentation/my_challenges_provider.dart';
import '../application/notification_settings_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final myAsync = ref.watch(myChallengesNotifierProvider);
    final notificationSettings = ref.watch(notificationSettingsProvider);

    final active = myAsync.maybeWhen(
      data: (l) => l.where((u) => u.status == 'ACTIVE').length,
      orElse: () => 0,
    );
    final completed = myAsync.maybeWhen(
      data: (l) => l.where((u) => u.status == 'COMPLETED').length,
      orElse: () => 0,
    );

    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.only(top: 14, bottom: 140),
        children: [
          const ScreenHeader(title: 'Profile'),
          const SizedBox(height: 18),
          if (user != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: Vital30Space.screenH),
              child: _IdentityCard(name: user.name, email: user.email),
            ),
          const SizedBox(height: 14),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Vital30Space.screenH),
            child: Row(
              children: [
                Expanded(
                  child: _StatTile(label: 'Active challenges', value: '$active'),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _StatTile(label: 'Completed', value: '$completed'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Vital30Space.screenH),
            child: _SettingsCard(rows: [
              _SettingsRow(
                title: 'Edit profile',
                icon: Icons.person_outline,
                onTap: () => context.push('/edit-profile'),
              ),
              _SettingsRow(
                title: 'Notifications',
                icon: Icons.notifications_outlined,
                trailing: notificationSettings.preferences.daily ? 'On' : 'Off',
                onTap: () => context.push('/notification-settings'),
              ),
              _SettingsRow(
                title: 'Reminder time',
                icon: Icons.schedule_outlined,
                trailing: notificationSettings.reminderTime.format(context),
                onTap: () => context.push('/reminder-time'),
              ),
              _SettingsRow(
                title: 'Invite friends',
                icon: Icons.share_outlined,
                trailing: '2 joined',
                onTap: () => context.push('/invite'),
              ),
              _SettingsRow(
                title: 'Privacy',
                icon: Icons.shield_outlined,
                onTap: () {},
              ),
              _SettingsRow(
                title: 'Health disclaimer',
                icon: Icons.health_and_safety_outlined,
                onTap: () => context.push('/health-disclaimer'),
              ),
              _SettingsRow(
                title: 'Terms of service',
                icon: Icons.menu_book_outlined,
                onTap: () {},
              ),
            ]),
          ),
          const SizedBox(height: 18),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Vital30Space.screenH),
            child: _LogoutCard(onTap: () => ref.read(authProvider.notifier).logout()),
          ),
          const SizedBox(height: 18),
          Center(
            child: Text(
              'Vital30 · v1.0 (MVP) — Wellness guidance only — not medical advice.',
              style: Vital30Text.caption.copyWith(fontSize: 11),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }
}

class _IdentityCard extends StatelessWidget {
  const _IdentityCard({required this.name, required this.email});
  final String name;
  final String email;

  String _initials() {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) return 'V';
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return (parts.first.substring(0, 1) + parts.last.substring(0, 1))
        .toUpperCase();
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
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: const BoxDecoration(
              color: Vital30Colors.primaryDeep,
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Text(
              _initials(),
              style: const TextStyle(
                color: Vital30Colors.onPrimary,
                fontSize: 18,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: Vital30Text.h3.copyWith(fontSize: 16)),
                const SizedBox(height: 2),
                Text(email, style: Vital30Text.caption),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: Vital30Colors.muted),
        ],
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Vital30Colors.card,
        borderRadius: BorderRadius.circular(Vital30Radius.lg),
        border: Border.all(color: Vital30Colors.hairlineSoft),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: Text(
              label.toUpperCase(),
              style: Vital30Text.label.copyWith(fontSize: 10.5),
            ),
          ),
          Text(
            value,
            style: GoogleFonts.jetBrainsMono(
              fontSize: 24,
              fontWeight: FontWeight.w600,
              letterSpacing: -1,
              color: Vital30Colors.ink,
            ),
          ),
        ],
      ),
    );
  }
}

class _SettingsRow {
  const _SettingsRow({
    required this.title,
    required this.icon,
    this.trailing,
    this.onTap,
  });
  final String title;
  final IconData icon;
  final String? trailing;
  final VoidCallback? onTap;
}

class _SettingsCard extends StatelessWidget {
  const _SettingsCard({required this.rows});
  final List<_SettingsRow> rows;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Vital30Colors.card,
        borderRadius: BorderRadius.circular(Vital30Radius.lg),
        border: Border.all(color: Vital30Colors.hairlineSoft),
      ),
      child: Column(
        children: [
          for (var i = 0; i < rows.length; i++) ...[
            InkWell(
              onTap: rows[i].onTap,
              child: Padding(
                padding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 14),
                child: Row(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: Vital30Colors.surfaceAlt,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      alignment: Alignment.center,
                      child: Icon(rows[i].icon,
                          size: 16, color: Vital30Colors.inkSoft),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        rows[i].title,
                        style: Vital30Text.body.copyWith(
                          color: Vital30Colors.ink,
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                    ),
                    if (rows[i].trailing != null)
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: Text(
                          rows[i].trailing!,
                          style: Vital30Text.caption,
                        ),
                      ),
                    const Icon(Icons.chevron_right,
                        size: 18, color: Vital30Colors.muted),
                  ],
                ),
              ),
            ),
            if (i < rows.length - 1)
              const Divider(
                height: 1,
                indent: 60,
                endIndent: 16,
                color: Vital30Colors.hairlineSoft,
              ),
          ],
        ],
      ),
    );
  }
}

class _LogoutCard extends StatelessWidget {
  const _LogoutCard({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(Vital30Radius.lg),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Vital30Colors.card,
          borderRadius: BorderRadius.circular(Vital30Radius.lg),
          border: Border.all(color: Vital30Colors.berryTint),
        ),
        child: Row(
          children: [
            const Icon(Icons.logout, color: Vital30Colors.berry, size: 18),
            const SizedBox(width: 10),
            Text(
              'Log out',
              style: Vital30Text.body.copyWith(
                color: Vital30Colors.berry,
                fontWeight: FontWeight.w700,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
