import 'package:flutter/material.dart';

import '../theme/v_colors.dart';
import '../theme/v_spacing.dart';

enum VPillTone { neutral, primary, accent, berry, outline, dark, sky }

enum VPillSize { sm, md }

class VPill extends StatelessWidget {
  const VPill({
    super.key,
    required this.label,
    this.tone = VPillTone.neutral,
    this.size = VPillSize.md,
    this.icon,
    this.backgroundOverride,
    this.foregroundOverride,
  });

  final String label;
  final VPillTone tone;
  final VPillSize size;
  final IconData? icon;
  final Color? backgroundOverride;
  final Color? foregroundOverride;

  @override
  Widget build(BuildContext context) {
    final palette = _palette(tone);
    final bg = backgroundOverride ?? palette.bg;
    final fg = foregroundOverride ?? palette.fg;
    final isSm = size == VPillSize.sm;

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isSm ? 8 : 10,
        vertical: isSm ? 3 : 5,
      ),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(Vital30Radius.pill),
        border: palette.border,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: isSm ? 11 : 13, color: fg),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: isSm ? 11 : 12,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.1,
              color: fg,
              height: 1.2,
            ),
          ),
        ],
      ),
    );
  }

  _Palette _palette(VPillTone t) {
    switch (t) {
      case VPillTone.neutral:
        return _Palette(
            bg: Vital30Colors.ink.withValues(alpha: 0.05),
            fg: Vital30Colors.inkSoft);
      case VPillTone.primary:
        return const _Palette(
            bg: Vital30Colors.primaryTint, fg: Vital30Colors.primaryDeep);
      case VPillTone.accent:
        return const _Palette(
            bg: Vital30Colors.accentTint, fg: Vital30Colors.accentDeep);
      case VPillTone.berry:
        return const _Palette(
            bg: Vital30Colors.berryTint, fg: Vital30Colors.berryDeep);
      case VPillTone.outline:
        return _Palette(
          bg: Colors.transparent,
          fg: Vital30Colors.inkSoft,
          border: Border.all(color: Vital30Colors.hairline),
        );
      case VPillTone.dark:
        return const _Palette(bg: Vital30Colors.ink, fg: Vital30Colors.surface);
      case VPillTone.sky:
        return const _Palette(
            bg: Vital30Colors.skyTint, fg: Vital30Colors.skyDeep);
    }
  }
}

class _Palette {
  const _Palette({required this.bg, required this.fg, this.border});
  final Color bg;
  final Color fg;
  final BoxBorder? border;
}
