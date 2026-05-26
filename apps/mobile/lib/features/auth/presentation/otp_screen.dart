import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/widgets/v_button.dart';
import '../../../core/widgets/v_icon_button.dart';
import '../../../core/widgets/v_text_field.dart';
import 'widgets/recovery_step_pips.dart';

/// Step 2 of the password-recovery flow. The user pastes the reset code
/// (an opaque token from the email Better Auth sent). We don't verify it
/// here — the token is checked at the moment we POST the new password on
/// the next screen.
class OtpScreen extends StatefulWidget {
  const OtpScreen({super.key, this.email});
  final String? email;

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _next() {
    final code = _controller.text.trim();
    if (code.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Paste the code from the email.')),
      );
      return;
    }
    context.push(
      '/new-password?token=${Uri.encodeQueryComponent(code)}',
    );
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
                const RecoveryStepPips(active: 2),
                const SizedBox(height: 20),
                Text('Paste the\nreset code', style: Vital30Text.h1),
                const SizedBox(height: 10),
                Text(
                  widget.email == null || widget.email!.isEmpty
                      ? 'Open the email we sent and paste the code below.'
                      : 'We emailed ${widget.email}. Open it and paste the code below.',
                  style: Vital30Text.body,
                ),
                const SizedBox(height: 26),
                VTextField(
                  label: 'Reset code',
                  hint: 'Paste the code from your email',
                  controller: _controller,
                ),
                const SizedBox(height: 22),
                VButton(
                  label: 'Continue',
                  fullWidth: true,
                  onPressed: _next,
                ),
                const SizedBox(height: 14),
                Center(
                  child: TextButton(
                    onPressed: () => context.pop(),
                    child: Text(
                      "Didn't get an email?",
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
