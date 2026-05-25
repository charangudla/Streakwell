import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_spacing.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/widgets/v_button.dart';
import '../../../core/widgets/v_icon_button.dart';
import '../../../core/widgets/v_pill.dart';
import '../../../core/widgets/v_text_field.dart';
import '../../auth/presentation/auth_provider.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  late final TextEditingController _name;
  late final TextEditingController _email;

  @override
  void initState() {
    super.initState();
    final u = ref.read(authProvider).user;
    _name = TextEditingController(text: u?.name ?? '');
    _email = TextEditingController(text: u?.email ?? '');
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    super.dispose();
  }

  String _initials() {
    final n = _name.text.trim();
    if (n.isEmpty) return 'V';
    final parts = n.split(RegExp(r'\s+'));
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return (parts.first.substring(0, 1) + parts.last.substring(0, 1))
        .toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  VIconButton(
                    icon: Icons.arrow_back_ios_new,
                    iconSize: 16,
                    onPressed: () => context.pop(),
                  ),
                  const Spacer(),
                  Text('Edit profile',
                      style: Vital30Text.h3.copyWith(fontSize: 16)),
                  const Spacer(),
                  TextButton(
                    onPressed: () => context.pop(),
                    child: Text(
                      'Save',
                      style: Vital30Text.body.copyWith(
                        color: Vital30Colors.primary,
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 22),
              Center(
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Container(
                      width: 84,
                      height: 84,
                      decoration: const BoxDecoration(
                        color: Vital30Colors.primaryDeep,
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        _initials(),
                        style: const TextStyle(
                          color: Vital30Colors.onPrimary,
                          fontSize: 28,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    Positioned(
                      bottom: -4,
                      right: -4,
                      child: Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: Vital30Colors.ink,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: Vital30Colors.surface,
                            width: 2,
                          ),
                        ),
                        alignment: Alignment.center,
                        child: const Icon(
                          Icons.camera_alt_outlined,
                          size: 14,
                          color: Vital30Colors.surface,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 22),
              VTextField(
                label: 'Name',
                controller: _name,
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 14),
              VTextField(
                label: 'Email',
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                suffix: const Padding(
                  padding: EdgeInsets.only(right: 10),
                  child: VPill(
                    label: 'Verified',
                    tone: VPillTone.primary,
                    size: VPillSize.sm,
                  ),
                ),
              ),
              const SizedBox(height: 28),
              Text('ACCOUNT', style: Vital30Text.label),
              const SizedBox(height: 8),
              _AccountRow(
                label: 'Change password',
                icon: Icons.lock_outline,
                onTap: () => context.push('/forgot-password'),
              ),
              const SizedBox(height: 8),
              _AccountRow(
                label: 'Delete account',
                icon: Icons.delete_outline,
                berry: true,
                onTap: () {},
              ),
              const SizedBox(height: 28),
              VButton(
                label: 'Log out',
                kind: VButtonKind.danger,
                fullWidth: true,
                onPressed: () => ref.read(authProvider.notifier).logout(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AccountRow extends StatelessWidget {
  const _AccountRow({
    required this.label,
    required this.icon,
    required this.onTap,
    this.berry = false,
  });
  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final bool berry;

  @override
  Widget build(BuildContext context) {
    final color = berry ? Vital30Colors.berry : Vital30Colors.ink;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(Vital30Radius.lg),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        decoration: BoxDecoration(
          color: Vital30Colors.card,
          borderRadius: BorderRadius.circular(Vital30Radius.lg),
          border: Border.all(color: Vital30Colors.hairlineSoft),
        ),
        child: Row(
          children: [
            Icon(icon, size: 18, color: color),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: Vital30Text.body.copyWith(
                  color: color,
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                ),
              ),
            ),
            Icon(Icons.chevron_right,
                size: 18,
                color: berry ? Vital30Colors.berry : Vital30Colors.muted),
          ],
        ),
      ),
    );
  }
}
