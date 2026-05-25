import 'package:flutter/material.dart';

enum Vital30Category { diet, fitness, mental, sleep, habit, family }

class CategoryStyle {
  const CategoryStyle({
    required this.key,
    required this.label,
    required this.short,
    required this.tint,
    required this.ink,
    required this.glyph,
  });

  final Vital30Category key;
  final String label;
  final String short;
  final Color tint;
  final Color ink;
  final IconData glyph;
}

class Vital30Categories {
  const Vital30Categories._();

  static const Map<Vital30Category, CategoryStyle> all = {
    Vital30Category.diet: CategoryStyle(
      key: Vital30Category.diet,
      label: 'Diet & Nutrition',
      short: 'Diet',
      tint: Color(0xFFDCE9D2),
      ink: Color(0xFF2C4A29),
      glyph: Icons.eco_outlined,
    ),
    Vital30Category.fitness: CategoryStyle(
      key: Vital30Category.fitness,
      label: 'Fitness & Movement',
      short: 'Fitness',
      tint: Color(0xFFF1E4CC),
      ink: Color(0xFF5C4220),
      glyph: Icons.bolt_outlined,
    ),
    Vital30Category.mental: CategoryStyle(
      key: Vital30Category.mental,
      label: 'Mental Wellness',
      short: 'Mental',
      tint: Color(0xFFE1D7EC),
      ink: Color(0xFF3D2E5E),
      glyph: Icons.self_improvement_outlined,
    ),
    Vital30Category.sleep: CategoryStyle(
      key: Vital30Category.sleep,
      label: 'Sleep & Recovery',
      short: 'Sleep',
      tint: Color(0xFFD6E3EF),
      ink: Color(0xFF1F3E5C),
      glyph: Icons.nightlight_outlined,
    ),
    Vital30Category.habit: CategoryStyle(
      key: Vital30Category.habit,
      label: 'Break Bad Habits',
      short: 'Habits',
      tint: Color(0xFFEDD7D6),
      ink: Color(0xFF6B2C2C),
      glyph: Icons.shield_outlined,
    ),
    Vital30Category.family: CategoryStyle(
      key: Vital30Category.family,
      label: 'Family Wellness',
      short: 'Family',
      tint: Color(0xFFF7DCC4),
      ink: Color(0xFF6B3A1F),
      glyph: Icons.home_outlined,
    ),
  };

  static CategoryStyle of(Vital30Category cat) => all[cat]!;

  static Vital30Category fromString(String? value) {
    if (value == null) return Vital30Category.diet;
    final key = value.toLowerCase().trim();
    return Vital30Category.values.firstWhere(
      (c) => c.name == key,
      orElse: () => Vital30Category.diet,
    );
  }

  static Vital30Category fromCategoryId(String? categoryId) {
    switch (categoryId) {
      case 'cat-1':
        return Vital30Category.diet;
      case 'cat-2':
        return Vital30Category.fitness;
      case 'cat-3':
        return Vital30Category.mental;
      case 'cat-4':
        return Vital30Category.sleep;
      case 'cat-5':
        return Vital30Category.habit;
      case 'cat-6':
        return Vital30Category.family;
      default:
        return fromSlug(categoryId);
    }
  }

  static Vital30Category fromSlug(String? slug) {
    switch (slug) {
      case 'diet-nutrition':
        return Vital30Category.diet;
      case 'fitness-movement':
        return Vital30Category.fitness;
      case 'mental-wellness':
        return Vital30Category.mental;
      case 'sleep-recovery':
        return Vital30Category.sleep;
      case 'break-bad-habits':
        return Vital30Category.habit;
      case 'family-wellness':
        return Vital30Category.family;
      default:
        return Vital30Category.diet;
    }
  }
}
