import 'package:flutter/material.dart';

import '../theme/v_colors.dart';

class VIconButton extends StatelessWidget {
  const VIconButton({
    super.key,
    required this.icon,
    this.onPressed,
    this.size = 38,
    this.iconSize = 18,
    this.background = Vital30Colors.card,
    this.borderColor = Vital30Colors.hairline,
    this.iconColor = Vital30Colors.ink,
    this.badge = false,
  });

  final IconData icon;
  final VoidCallback? onPressed;
  final double size;
  final double iconSize;
  final Color background;
  final Color borderColor;
  final Color iconColor;
  final bool badge;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: background,
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onPressed,
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: borderColor),
          ),
          child: Stack(
            alignment: Alignment.center,
            clipBehavior: Clip.none,
            children: [
              Icon(icon, size: iconSize, color: iconColor),
              if (badge)
                Positioned(
                  top: size * 0.18,
                  right: size * 0.22,
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: Vital30Colors.accent,
                      shape: BoxShape.circle,
                      border: Border.all(color: background, width: 2),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
