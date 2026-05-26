import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/widgets/v_button.dart';
import '../../../core/widgets/v_icon_button.dart';
import '../../../core/widgets/v_text_field.dart';
import 'auth_provider.dart';
import 'widgets/recovery_step_pips.dart';

class NewPasswordScreen extends ConsumerStatefulWidget {
  const NewPasswordScreen({super.key, required this.resetToken});

  /// The opaque reset code the user pasted on the previous screen — passed
  /// straight through to Better Auth's /reset-password endpoint.
  final String resetToken;

  @override
  ConsumerState<NewPasswordScreen> createState() => _NewPasswordScreenState();
}

class _NewPasswordScreenState extends ConsumerState<NewPasswordScreen> {
  final _pw = TextEditingController();
  final _confirm = TextEditingController();
  bool _obscure = true;
  bool _submitting = false;

  @override
  void dispose() {
    _pw.dispose();
    _confirm.dispose();
    super.dispose();
  }

  bool get _isLong => _pw.text.length >= 8;
  bool get _hasNumber => RegExp(r'\d').hasMatch(_pw.text);
  bool get _hasMixedCase =>
      RegExp(r'[a-z]').hasMatch(_pw.text) &&
      RegExp(r'[A-Z]').hasMatch(_pw.text);
  bool get _matches => _pw.text.isNotEmpty && _pw.text == _confirm.text;

  int get _strength {
    var s = 0;
    if (_isLong) s++;
    if (_hasNumber) s++;
    if (_hasMixedCase) s++;
    if (_pw.text.length >= 12) s++;
    return s;
  }

  Future<void> _submit() async {
    if (widget.resetToken.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Reset code missing — start over.')),
      );
      return;
    }
    setState(() => _submitting = true);
    final error = await ref.read(authProvider.notifier).resetPassword(
          token: widget.resetToken,
          newPassword: _pw.text,
        );
    if (!mounted) return;
    setState(() => _submitting = false);
    if (error != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error)));
      return;
    }
    context.go('/reset-success');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                VIconButton(
                  icon: Icons.arrow_back_ios_new,
                  iconSize: 16,
                  onPressed: () => context.pop(),
                ),
                const SizedBox(height: 16),
                const RecoveryStepPips(active: 3),
                const SizedBox(height: 20),
                Text('Set a new\npassword', style: Vital30Text.h1),
                const SizedBox(height: 10),
                Text(
                  "Choose something memorable but strong. You'll use this every time you sign in.",
                  style: Vital30Text.body,
                ),
                const SizedBox(height: 26),
                VTextField(
                  label: 'New password',
                  hint: 'Min. 8 characters',
                  controller: _pw,
                  obscureText: _obscure,
                  autofillHints: const [AutofillHints.newPassword],
                  onChanged: (_) => setState(() {}),
                  suffix: IconButton(
                    icon: Icon(
                      _obscure
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                      size: 20,
                      color: Vital30Colors.muted,
                    ),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  ),
                ),
                const SizedBox(height: 10),
                _StrengthBars(level: _strength),
                const SizedBox(height: 14),
                VTextField(
                  label: 'Confirm password',
                  hint: 'Re-enter password',
                  controller: _confirm,
                  obscureText: _obscure,
                  onChanged: (_) => setState(() {}),
                ),
                const SizedBox(height: 18),
                Column(
                  children: [
                    _Requirement(label: 'At least 8 characters', met: _isLong),
                    _Requirement(label: 'Includes a number', met: _hasNumber),
                    _Requirement(label: 'Both cases match', met: _matches),
                  ],
                ),
                const SizedBox(height: 22),
                VButton(
                  label: _submitting ? 'Updating…' : 'Update password',
                  fullWidth: true,
                  onPressed: (_matches && _isLong && _hasNumber && !_submitting)
                      ? _submit
                      : null,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _StrengthBars extends StatelessWidget {
  const _StrengthBars({required this.level});
  final int level;
  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        for (var i = 0; i < 4; i++) ...[
          Expanded(
            child: Container(
              height: 4,
              decoration: BoxDecoration(
                color: i < level
                    ? (level >= 3
                        ? Vital30Colors.primary
                        : level == 2
                            ? Vital30Colors.accent
                            : Vital30Colors.berry)
                    : Vital30Colors.hairline,
                borderRadius: BorderRadius.circular(99),
              ),
            ),
          ),
          if (i < 3) const SizedBox(width: 6),
        ],
      ],
    );
  }
}

class _Requirement extends StatelessWidget {
  const _Requirement({required this.label, required this.met});
  final String label;
  final bool met;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 220),
            width: 16,
            height: 16,
            decoration: BoxDecoration(
              color: met ? Vital30Colors.primary : Colors.transparent,
              shape: BoxShape.circle,
              border: Border.all(
                color: met ? Vital30Colors.primary : Vital30Colors.hairline,
              ),
            ),
            alignment: Alignment.center,
            child: met
                ? const Icon(Icons.check,
                    size: 11, color: Vital30Colors.onPrimary)
                : const SizedBox.shrink(),
          ),
          const SizedBox(width: 10),
          Text(
            label,
            style: Vital30Text.body.copyWith(
              fontSize: 13,
              color: met ? Vital30Colors.ink : Vital30Colors.muted,
              fontWeight: met ? FontWeight.w700 : FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
