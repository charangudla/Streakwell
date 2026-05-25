import 'package:flutter/material.dart';

import '../theme/v_categories.dart';

class CatTile extends StatelessWidget {
  const CatTile({
    super.key,
    required this.category,
    this.size = 44,
    this.radius,
  });

  final Vital30Category category;
  final double size;
  final double? radius;

  @override
  Widget build(BuildContext context) {
    final style = Vital30Categories.of(category);
    final r = radius ?? (size * 0.27);
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: style.tint,
        borderRadius: BorderRadius.circular(r),
      ),
      alignment: Alignment.center,
      child: Icon(
        style.glyph,
        size: (size * 0.52).roundToDouble(),
        color: style.ink,
      ),
    );
  }
}
