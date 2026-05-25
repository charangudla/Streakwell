import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/widgets/v_button.dart';
import '../../../core/widgets/v_icon_button.dart';
import '../../../core/widgets/v_text_field.dart';
import 'widgets/recovery_step_pips.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
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
                  label: 'Send code',
                  fullWidth: true,
                  onPressed: () => context.push(
                      '/otp?email=${Uri.encodeQueryComponent(_emailController.text)}'),
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
