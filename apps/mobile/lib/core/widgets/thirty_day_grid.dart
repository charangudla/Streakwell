import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/v_colors.dart';
import '../theme/v_spacing.dart';

enum DayState { done, missed, skipped, today, upcoming }

class ThirtyDayGrid extends StatelessWidget {
  const ThirtyDayGrid({
    super.key,
    required this.days,
    this.cellSize = 38,
    this.spacing = 6,
    this.darkTheme = false,
  });

  final List<DayState> days;
  final double cellSize;
  final double spacing;
  final bool darkTheme;

  @override
  Widget build(BuildContext context) {
    assert(days.length == 30, 'ThirtyDayGrid requires exactly 30 days');
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: 30,
      padding: EdgeInsets.zero,
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 6,
        mainAxisSpacing: spacing,
        crossAxisSpacing: spacing,
        childAspectRatio: 1,
      ),
      itemBuilder: (context, i) => _DayCell(
        day: i + 1,
        state: days[i],
        size: cellSize,
        darkTheme: darkTheme,
      ),
    );
  }
}

class _DayCell extends StatelessWidget {
  const _DayCell({
    required this.day,
    required this.state,
    required this.size,
    required this.darkTheme,
  });

  final int day;
  final DayState state;
  final double size;
  final bool darkTheme;

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      alignment: Alignment.center,
      children: [
        Container(
          width: size,
          height: size,
          decoration: _decoration(),
          alignment: Alignment.center,
          child: Text(
            '$day',
            style: GoogleFonts.jetBrainsMono(
              fontSize: size * 0.32,
              fontWeight:
                  state == DayState.today ? FontWeight.w800 : FontWeight.w600,
              color: _textColor(),
            ),
          ),
        ),
        if (state == DayState.today)
          Positioned(
            bottom: -3,
            child: Container(
              width: 4,
              height: 4,
              decoration: const BoxDecoration(
                color: Vital30Colors.accent,
                shape: BoxShape.circle,
              ),
            ),
          ),
      ],
    );
  }

  BoxDecoration _decoration() {
    final radius = BorderRadius.circular(Vital30Radius.sm);
    switch (state) {
      case DayState.done:
        return BoxDecoration(
            color: Vital30Colors.primary, borderRadius: radius);
      case DayState.missed:
        return BoxDecoration(
          color: Vital30Colors.berryTint,
          borderRadius: radius,
          border: Border.all(color: Vital30Colors.berryTint),
        );
      case DayState.skipped:
        return BoxDecoration(
          color: darkTheme
              ? Colors.white.withValues(alpha: 0.05)
              : Vital30Colors.card,
          borderRadius: radius,
          border: Border.all(
            color: Vital30Colors.hairline,
            style: BorderStyle.solid,
          ),
        );
      case DayState.today:
        return BoxDecoration(
          color: darkTheme
              ? Colors.white.withValues(alpha: 0.08)
              : Vital30Colors.card,
          borderRadius: radius,
          border: Border.all(
            color: darkTheme ? Vital30Colors.surface : Vital30Colors.ink,
            width: 2,
          ),
        );
      case DayState.upcoming:
        return BoxDecoration(
          color: Colors.transparent,
          borderRadius: radius,
          border: Border.all(
            color: darkTheme
                ? Colors.white.withValues(alpha: 0.12)
                : Vital30Colors.hairlineSoft,
          ),
        );
    }
  }

  Color _textColor() {
    switch (state) {
      case DayState.done:
        return Vital30Colors.onPrimary;
      case DayState.missed:
        return Vital30Colors.berryDeep;
      case DayState.skipped:
        return Vital30Colors.muted;
      case DayState.today:
        return darkTheme ? Vital30Colors.surface : Vital30Colors.ink;
      case DayState.upcoming:
        return darkTheme
            ? Colors.white.withValues(alpha: 0.45)
            : Vital30Colors.mutedSoft;
    }
  }
}
