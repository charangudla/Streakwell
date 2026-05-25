import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/v_colors.dart';

class VLogomark extends StatelessWidget {
  const VLogomark({super.key, this.size = 36, this.showWordmark = true});

  final double size;
  final bool showWordmark;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            color: Vital30Colors.ink,
            borderRadius: BorderRadius.circular(size * 0.28),
          ),
          alignment: Alignment.center,
          child: Padding(
            padding: const EdgeInsets.only(bottom: 2),
            child: Text(
              '30',
              style: GoogleFonts.instrumentSerif(
                fontSize: size * 0.6,
                fontStyle: FontStyle.italic,
                fontWeight: FontWeight.w600,
                color: Vital30Colors.surface,
                height: 1,
              ),
            ),
          ),
        ),
        if (showWordmark) ...[
          const SizedBox(width: 10),
          RichText(
            text: TextSpan(
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.3,
                color: Vital30Colors.ink,
                fontFamily: GoogleFonts.manrope().fontFamily,
              ),
              children: const [
                TextSpan(text: 'Vital'),
                TextSpan(
                  text: '30',
                  style: TextStyle(color: Vital30Colors.primary),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}
