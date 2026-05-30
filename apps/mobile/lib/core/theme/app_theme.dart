import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'v_colors.dart';
import 'v_spacing.dart';
import 'v_typography.dart';

class AppTheme {
  const AppTheme._();

  static ThemeData get light {
    final colorScheme = ColorScheme(
      brightness: Brightness.light,
      primary: Vital30Colors.primary,
      onPrimary: Vital30Colors.onPrimary,
      primaryContainer: Vital30Colors.primaryTint,
      onPrimaryContainer: Vital30Colors.primaryDeep,
      secondary: Vital30Colors.accent,
      onSecondary: Vital30Colors.onPrimary,
      secondaryContainer: Vital30Colors.accentTint,
      onSecondaryContainer: Vital30Colors.accentDeep,
      tertiary: Vital30Colors.sky,
      onTertiary: Vital30Colors.onPrimary,
      tertiaryContainer: Vital30Colors.skyTint,
      onTertiaryContainer: Vital30Colors.skyDeep,
      error: Vital30Colors.berry,
      onError: Vital30Colors.onPrimary,
      errorContainer: Vital30Colors.berryTint,
      onErrorContainer: Vital30Colors.berryDeep,
      surface: Vital30Colors.surface,
      onSurface: Vital30Colors.ink,
      surfaceContainerHighest: Vital30Colors.surfaceAlt,
      onSurfaceVariant: Vital30Colors.inkSoft,
      outline: Vital30Colors.hairline,
      outlineVariant: Vital30Colors.hairlineSoft,
      shadow: Vital30Colors.ink,
      scrim: Vital30Colors.ink,
      inverseSurface: Vital30Colors.ink,
      onInverseSurface: Vital30Colors.surface,
      inversePrimary: Vital30Colors.primaryTint,
    );

    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: Vital30Colors.surface,
      textTheme: GoogleFonts.manropeTextTheme().apply(
        bodyColor: Vital30Colors.ink,
        displayColor: Vital30Colors.ink,
      ),
      appBarTheme: const AppBarTheme(
        centerTitle: false,
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: Vital30Colors.surface,
        foregroundColor: Vital30Colors.ink,
        surfaceTintColor: Colors.transparent,
      ),
      iconTheme: const IconThemeData(color: Vital30Colors.ink, size: 22),
      cardTheme: CardThemeData(
        elevation: 0,
        color: Vital30Colors.card,
        surfaceTintColor: Colors.transparent,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Vital30Radius.lg),
          side: const BorderSide(color: Vital30Colors.hairlineSoft),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: Vital30Colors.hairlineSoft,
        thickness: 1,
        space: 1,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: Vital30Colors.primary,
          foregroundColor: Vital30Colors.onPrimary,
          minimumSize: const Size.fromHeight(54),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(Vital30Radius.lg),
          ),
          textStyle: Vital30Text.title.copyWith(
            color: Vital30Colors.onPrimary,
            letterSpacing: -0.1,
            fontSize: 16,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          backgroundColor: Vital30Colors.card,
          foregroundColor: Vital30Colors.ink,
          minimumSize: const Size.fromHeight(54),
          side: const BorderSide(color: Vital30Colors.hairline),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(Vital30Radius.md),
          ),
          textStyle: Vital30Text.title.copyWith(fontSize: 15),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: Vital30Colors.primary,
          textStyle: Vital30Text.title.copyWith(fontSize: 15),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Vital30Colors.card,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Vital30Radius.md),
          borderSide: const BorderSide(color: Vital30Colors.hairline),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Vital30Radius.md),
          borderSide: const BorderSide(color: Vital30Colors.hairline),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Vital30Radius.md),
          borderSide:
              const BorderSide(color: Vital30Colors.primary, width: 1.8),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Vital30Radius.md),
          borderSide: const BorderSide(color: Vital30Colors.berry),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Vital30Radius.md),
          borderSide: const BorderSide(color: Vital30Colors.berry, width: 1.8),
        ),
        labelStyle: Vital30Text.body.copyWith(color: Vital30Colors.muted),
        hintStyle: Vital30Text.body.copyWith(color: Vital30Colors.mutedSoft),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: Vital30Colors.surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(Vital30Radius.xl),
          ),
        ),
      ),
      snackBarTheme: const SnackBarThemeData(
        backgroundColor: Vital30Colors.ink,
        contentTextStyle: TextStyle(color: Vital30Colors.surface),
        behavior: SnackBarBehavior.floating,
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: Vital30Colors.primary,
        linearTrackColor: Vital30Colors.hairline,
        circularTrackColor: Vital30Colors.hairline,
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((states) =>
            states.contains(WidgetState.selected)
                ? Vital30Colors.onPrimary
                : Colors.white),
        trackColor: WidgetStateProperty.resolveWith((states) =>
            states.contains(WidgetState.selected)
                ? Vital30Colors.primary
                : Vital30Colors.hairline),
        trackOutlineColor: const WidgetStatePropertyAll(Colors.transparent),
      ),
    );

    return base;
  }
}
