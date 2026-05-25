import 'package:flutter/material.dart';

import '../theme/v_colors.dart';
import '../theme/v_spacing.dart';
import '../theme/v_typography.dart';

class ScreenHeader extends StatelessWidget {
  const ScreenHeader({
    super.key,
    this.eyebrow,
    required this.title,
    this.subtitle,
    this.titleAccent,
    this.trailing,
  });

  final String? eyebrow;
  final String title;
  final String? titleAccent;
  final String? subtitle;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Vital30Space.screenH),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (eyebrow != null) ...[
                  Text(
                    eyebrow!.toUpperCase(),
                    style: Vital30Text.eyebrow,
                  ),
                  const SizedBox(height: 6),
                ],
                if (titleAccent == null)
                  Text(title, style: Vital30Text.h1)
                else
                  RichText(
                    text: TextSpan(
                      style: Vital30Text.h1,
                      children: [
                        TextSpan(text: title),
                        TextSpan(
                          text: titleAccent,
                          style: Vital30Text.serifAccent(
                            size: 30,
                            color: Vital30Colors.primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                if (subtitle != null) ...[
                  const SizedBox(height: 6),
                  Text(subtitle!, style: Vital30Text.body),
                ],
              ],
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}
