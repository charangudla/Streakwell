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

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState
    extends ConsumerState<ForgotPasswordScreen> {
  final _emailController = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    if (_submitting) return;
    final email = _emailController.text.trim();
    if (email.isEmpty || !email.contains('@')) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a valid email address.')),
      );
      return;
    }
    setState(() => _submitting = true);
    final error =
        await ref.read(authProvider.notifier).requestPasswordReset(email);
    if (!mounted) return;
    setState(() => _submitting = false);
    if (error != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error)));
      return;
    }
    // Even if the email is unknown, backend returns 204 (anti-enumeration).
    // We always advance to OTP screen so attackers can't infer that distinction.
    context.push('/otp?email=${Uri.encodeQueryComponent(email)}');
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
                const RecoveryStepPips(active: 1),
                const SizedBox(height: 20),
                Text('Forgot your\npassword?', style: Vital30Text.h1),
                const SizedBox(height: 10),
                Text(
                  "Enter your email — we'll send a 6-digit verification code.",
                  style: Vital30Text.body,
                ),
                const SizedBox(height: 26),
                VTextField(
                  label: 'Email',
                  hint: 'you@email.com',
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  autofillHints: const [AutofillHints.email],
                ),
                const SizedBox(height: 22),
                VButton(
                  label: _submitting ? 'Sending…' : 'Send code',
                  fullWidth: true,
                  onPressed: _submitting ? null : _send,
                ),
                const SizedBox(height: 14),
                Center(
                  child: TextButton(
                    onPressed: () => context.pop(),
                    child: Text(
                      'Back to log in',
                      style: Vital30Text.body.copyWith(
                        color: Vital30Colors.inkSoft,
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
