import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/v_colors.dart';
import '../theme/v_typography.dart';

class VStat extends StatelessWidget {
  const VStat({
    super.key,
    required this.label,
    required this.value,
    this.color = Vital30Colors.ink,
    this.icon,
    this.iconColor,
    this.alignment = CrossAxisAlignment.start,
    this.fontSize = 16,
  });

  final String label;
  final String value;
  final Color color;
  final IconData? icon;
  final Color? iconColor;
  final CrossAxisAlignment alignment;
  final double fontSize;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: alignment,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          label.toUpperCase(),
          style: Vital30Text.label.copyWith(fontSize: 10),
        ),
        const SizedBox(height: 2),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 13, color: iconColor ?? color),
              const SizedBox(width: 4),
            ],
            Text(
              value,
              style: GoogleFonts.jetBrainsMono(
                fontSize: fontSize,
                fontWeight: FontWeight.w600,
                color: color,
                letterSpacing: -0.5,
                height: 1,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class VStatCard extends StatelessWidget {
  const VStatCard({
    super.key,
    required this.label,
    required this.value,
    this.color = Vital30Colors.ink,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
      decoration: BoxDecoration(
        color: Vital30Colors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Vital30Colors.hairlineSoft),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: GoogleFonts.jetBrainsMono(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: color,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label.toUpperCase(),
            style: Vital30Text.label.copyWith(fontSize: 10),
          ),
        ],
      ),
    );
  }
}
