import 'package:flutter/material.dart';

import '../theme/v_colors.dart';
import '../theme/v_spacing.dart';

enum VButtonKind { primary, secondary, ghost, dark, danger }

enum VButtonSize { sm, md, lg }

class VButton extends StatelessWidget {
  const VButton({
    super.key,
    required this.label,
    this.kind = VButtonKind.primary,
    this.size = VButtonSize.lg,
    this.fullWidth = false,
    this.icon,
    this.onPressed,
  });

  final String label;
  final VButtonKind kind;
  final VButtonSize size;
  final bool fullWidth;
  final IconData? icon;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final config = _sizeConfig(size);
    final colors = _colorConfig(kind);

    final child = Row(
      mainAxisSize: fullWidth ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (icon != null) ...[
          Icon(icon, size: config.iconSize, color: colors.fg),
          const SizedBox(width: 8),
        ],
        Flexible(
          child: Text(
            label,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: config.fontSize,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.1,
              color: colors.fg,
            ),
          ),
        ),
      ],
    );

    final button = Material(
      color: colors.bg,
      borderRadius: BorderRadius.circular(config.radius),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(config.radius),
        child: Container(
          height: config.height,
          padding: EdgeInsets.symmetric(horizontal: config.padX),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(config.radius),
            border: colors.border,
            boxShadow: kind == VButtonKind.primary
                ? Vital30Shadow.primaryGlow
                : kind == VButtonKind.dark
                    ? Vital30Shadow.pop
                    : kind == VButtonKind.secondary
                        ? Vital30Shadow.soft
                        : null,
          ),
          alignment: Alignment.center,
          child: child,
        ),
      ),
    );

    return SizedBox(width: fullWidth ? double.infinity : null, child: button);
  }

  _SizeConfig _sizeConfig(VButtonSize s) {
    switch (s) {
      case VButtonSize.sm:
        return const _SizeConfig(
            height: 36,
            padX: 14,
            fontSize: 13,
            iconSize: 16,
            radius: Vital30Radius.md);
      case VButtonSize.md:
        return const _SizeConfig(
            height: 44,
            padX: 18,
            fontSize: 14,
            iconSize: 18,
            radius: Vital30Radius.md);
      case VButtonSize.lg:
        return const _SizeConfig(
            height: 54,
            padX: 22,
            fontSize: 16,
            iconSize: 20,
            radius: Vital30Radius.lg);
    }
  }

  _ColorConfig _colorConfig(VButtonKind k) {
    switch (k) {
      case VButtonKind.primary:
        return const _ColorConfig(
            bg: Vital30Colors.primary, fg: Vital30Colors.onPrimary);
      case VButtonKind.secondary:
        return _ColorConfig(
          bg: Vital30Colors.card,
          fg: Vital30Colors.ink,
          border: Border.all(color: Vital30Colors.hairline),
        );
      case VButtonKind.ghost:
        return const _ColorConfig(
            bg: Colors.transparent, fg: Vital30Colors.primary);
      case VButtonKind.dark:
        return const _ColorConfig(
            bg: Vital30Colors.ink, fg: Vital30Colors.surface);
      case VButtonKind.danger:
        return _ColorConfig(
          bg: Colors.transparent,
          fg: Vital30Colors.berry,
          border: Border.all(color: Vital30Colors.berryTint),
        );
    }
  }
}

class _SizeConfig {
  const _SizeConfig({
    required this.height,
    required this.padX,
    required this.fontSize,
    required this.iconSize,
    required this.radius,
  });
  final double height;
  final double padX;
  final double fontSize;
  final double iconSize;
  final double radius;
}

class _ColorConfig {
  const _ColorConfig({required this.bg, required this.fg, this.border});
  final Color bg;
  final Color fg;
  final BoxBorder? border;
}
