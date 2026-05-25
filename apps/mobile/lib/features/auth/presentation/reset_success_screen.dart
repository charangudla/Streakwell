import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/widgets/v_button.dart';
import 'widgets/recovery_step_pips.dart';

class ResetSuccessScreen extends StatelessWidget {
  const ResetSuccessScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 28),
          child: Column(
            children: [
              const RecoveryStepPips(active: 4),
              const Spacer(),
              Container(
                width: 104,
                height: 104,
                decoration: BoxDecoration(
                  color: Vital30Colors.primary,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Vital30Colors.primary.withValues(alpha: 0.4),
                      offset: const Offset(0, 18),
                      blurRadius: 40,
                      spreadRadius: -10,
                    ),
                    BoxShadow(
                      color: Vital30Colors.primary.withValues(alpha: 0.10),
                      spreadRadius: 14,
                    ),
                  ],
                ),
                alignment: Alignment.center,
                child: const Icon(Icons.check,
                    size: 58, color: Vital30Colors.onPrimary),
              ),
              const SizedBox(height: 22),
              Text("You're all set.", style: Vital30Text.h1),
              const SizedBox(height: 10),
              Text(
                'Your password has been updated. You can now log in with the new one.',
                style: Vital30Text.body,
                textAlign: TextAlign.center,
              ),
              const Spacer(),
              VButton(
                label: 'Continue to my challenges',
                fullWidth: true,
                onPressed: () => context.go('/login'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
