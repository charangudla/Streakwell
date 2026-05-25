import 'package:flutter/material.dart';

class Vital30Space {
  const Vital30Space._();

  static const double xs = 4;
  static const double s = 8;
  static const double m = 12;
  static const double l = 16;
  static const double xl = 20;
  static const double xxl = 24;
  static const double xxxl = 32;
  static const double huge = 40;

  static const double screenH = 20;
}

class Vital30Radius {
  const Vital30Radius._();

  static const double sm = 10;
  static const double md = 14;
  static const double lg = 20;
  static const double xl = 28;
  static const double pill = 999;
}

class Vital30Shadow {
  const Vital30Shadow._();

  static const List<BoxShadow> card = [
    BoxShadow(
      color: Color(0x0A0B1410),
      offset: Offset(0, 1),
    ),
    BoxShadow(
      color: Color(0x1A0B1410),
      offset: Offset(0, 8),
      blurRadius: 24,
      spreadRadius: -10,
    ),
  ];

  static const List<BoxShadow> soft = [
    BoxShadow(
      color: Color(0x0A0B1410),
      offset: Offset(0, 1),
      blurRadius: 2,
    ),
  ];

  static const List<BoxShadow> pop = [
    BoxShadow(
      color: Color(0x330B1410),
      offset: Offset(0, 10),
      blurRadius: 30,
      spreadRadius: -8,
    ),
    BoxShadow(
      color: Color(0x0F0B1410),
      offset: Offset(0, 2),
      blurRadius: 6,
    ),
  ];

  static const List<BoxShadow> primaryGlow = [
    BoxShadow(
      color: Color(0x8C0B7B6D),
      offset: Offset(0, 6),
      blurRadius: 16,
      spreadRadius: -6,
    ),
  ];
}
