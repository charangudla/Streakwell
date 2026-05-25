import 'package:flutter/material.dart';

import '../theme/v_colors.dart';

class VProgressBar extends StatelessWidget {
  const VProgressBar({
    super.key,
    required this.progress,
    this.color = Vital30Colors.primary,
    this.trackColor = Vital30Colors.hairline,
    this.height = 6,
  });

  final double progress;
  final Color color;
  final Color trackColor;
  final double height;

  @override
  Widget build(BuildContext context) {
    final pct = progress.clamp(0.0, 1.0);
    return ClipRRect(
      borderRadius: BorderRadius.circular(999),
      child: Container(
        height: height,
        color: trackColor,
        child: FractionallySizedBox(
          alignment: Alignment.centerLeft,
          widthFactor: pct,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 400),
            curve: Curves.easeOut,
            color: color,
          ),
        ),
      ),
    );
  }
}
