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
  late final String _originalName;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    final u = ref.read(authProvider).user;
    _originalName = u?.name ?? '';
    _name = TextEditingController(text: _originalName);
    _email = TextEditingController(text: u?.email ?? '');
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    super.dispose();
  }

  Future<void> _confirmAndDeleteAccount() async {
    if (_submitting) return;

    final confirmed = await showDialog<bool>(
      context: context,
      barrierColor: Colors.black.withValues(alpha: 0.55),
      builder: (dialogContext) => AlertDialog(
        backgroundColor: Vital30Colors.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Vital30Radius.xl),
        ),
        title: const Text('Delete your account?'),
        content: const Text(
          'This will permanently remove your profile, all challenge progress, '
          'check-ins, and shared activity. This cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Keep account'),
          ),
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            style: TextButton.styleFrom(foregroundColor: Vital30Colors.berry),
            child: const Text('Delete forever'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() => _submitting = true);
    final error = await ref.read(authProvider.notifier).deleteAccount();
    // On success, the auth state flips to unauthenticated and the router
    // redirects us away from this screen — there is no `mounted` widget to
    // call setState on.
    if (!mounted) return;
    setState(() => _submitting = false);
    if (error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error)),
      );
    }
  }

  Future<void> _save() async {
    if (_submitting) return;

    final newName = _name.text.trim();
    if (newName.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Name cannot be empty.')),
      );
      return;
    }
    if (newName == _originalName.trim()) {
      // Nothing to save — match the user's "Save" expectation by closing.
      context.pop();
      return;
    }

    setState(() => _submitting = true);
    final error =
        await ref.read(authProvider.notifier).updateProfile(name: newName);
    if (!mounted) return;
    setState(() => _submitting = false);

    if (error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error)),
      );
      return;
    }
    context.pop();
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
                    onPressed: _submitting ? null : _save,
                    child: _submitting
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Vital30Colors.primary,
                            ),
                          )
                        : Text(
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
                enabled: false,
                helper: 'Email changes aren’t available yet.',
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
                onTap: _submitting ? () {} : _confirmAndDeleteAccount,
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
