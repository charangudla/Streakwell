import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'v_colors.dart';

class Vital30Text {
  const Vital30Text._();

  static TextStyle _ms(
    double size,
    FontWeight weight, {
    double ls = 0,
    double h = 1.3,
    Color? color,
  }) =>
      GoogleFonts.manrope(
        fontSize: size,
        fontWeight: weight,
        letterSpacing: ls,
        height: h,
        color: color ?? Vital30Colors.ink,
      );

  static TextStyle get display => _ms(46, FontWeight.w800, ls: -1.6, h: 1.02);
  static TextStyle get h1 => _ms(30, FontWeight.w800, ls: -0.8, h: 1.1);
  static TextStyle get h2 => _ms(24, FontWeight.w800, ls: -0.6, h: 1.15);
  static TextStyle get h3 => _ms(17, FontWeight.w800, ls: -0.3);
  static TextStyle get title => _ms(15.5, FontWeight.w800, ls: -0.3);
  static TextStyle get body =>
      _ms(14, FontWeight.w500, h: 1.5, color: Vital30Colors.inkSoft);
  static TextStyle get bodyStrong =>
      _ms(14, FontWeight.w700, h: 1.5, color: Vital30Colors.ink);
  static TextStyle get caption =>
      _ms(12.5, FontWeight.w500, h: 1.4, color: Vital30Colors.muted);
  static TextStyle get label =>
      _ms(11, FontWeight.w700, ls: 0.8, color: Vital30Colors.muted);
  static TextStyle get eyebrow => _ms(
        12,
        FontWeight.w700,
        ls: 1.2,
        color: Vital30Colors.muted,
      );

  static TextStyle get number => GoogleFonts.jetBrainsMono(
        fontSize: 26,
        fontWeight: FontWeight.w600,
        letterSpacing: -1,
        color: Vital30Colors.ink,
      );

  static TextStyle get numberSmall => GoogleFonts.jetBrainsMono(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: Vital30Colors.ink,
      );

  static TextStyle get numberHero => GoogleFonts.instrumentSerif(
        fontSize: 62,
        fontWeight: FontWeight.w400,
        fontStyle: FontStyle.italic,
        letterSpacing: -2,
        height: 1,
        color: Vital30Colors.ink,
      );

  static TextStyle serifAccent({
    double size = 30,
    Color color = Vital30Colors.primary,
    FontWeight weight = FontWeight.w400,
    double h = 1.1,
  }) =>
      GoogleFonts.instrumentSerif(
        fontSize: size,
        fontWeight: weight,
        fontStyle: FontStyle.italic,
        color: color,
        height: h,
      );
}
