import 'package:flutter/material.dart';

import '../theme/v_colors.dart';
import '../theme/v_spacing.dart';
import '../theme/v_typography.dart';
import 'v_button.dart';

class VStateMessage extends StatelessWidget {
  const VStateMessage({
    super.key,
    required this.title,
    required this.body,
    required this.icon,
    this.iconBackground = Vital30Colors.primaryTint,
    this.iconColor = Vital30Colors.primaryDeep,
    this.ctaLabel,
    this.onCtaPressed,
    this.ctaIcon,
  });

  final String title;
  final String body;
  final IconData icon;
  final Color iconBackground;
  final Color iconColor;
  final String? ctaLabel;
  final VoidCallback? onCtaPressed;
  final IconData? ctaIcon;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Vital30Space.screenH),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 84,
            height: 84,
            decoration: BoxDecoration(
              color: iconBackground,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 36, color: iconColor),
          ),
          const SizedBox(height: Vital30Space.l),
          Text(title, style: Vital30Text.h2, textAlign: TextAlign.center),
          const SizedBox(height: Vital30Space.s),
          Text(body, style: Vital30Text.body, textAlign: TextAlign.center),
          if (ctaLabel != null) ...[
            const SizedBox(height: Vital30Space.xl),
            VButton(
              label: ctaLabel!,
              icon: ctaIcon,
              onPressed: onCtaPressed,
            ),
          ],
        ],
      ),
    );
  }
}
