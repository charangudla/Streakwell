import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/widgets/v_button.dart';
import '../../../core/widgets/v_logomark.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment(0.6, -1),
            radius: 1.4,
            colors: [
              Vital30Colors.primaryTint,
              Vital30Colors.surface,
            ],
            stops: [0.0, 0.6],
          ),
        ),
        child: Stack(
          children: [
            Positioned(
              top: 80,
              right: -40,
              child: Text(
                '30',
                style: GoogleFonts.instrumentSerif(
                  fontSize: 340,
                  fontStyle: FontStyle.italic,
                  fontWeight: FontWeight.w400,
                  color: Vital30Colors.primary.withValues(alpha: 0.1),
                  height: 0.85,
                ),
              ),
            ),
            Positioned(
              top: 160,
              left: -60,
              child: Opacity(
                opacity: 0.18,
                child: CustomPaint(
                  size: const Size(280, 280),
                  painter: _DecorRingsPainter(),
                ),
              ),
            ),
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(28, 32, 28, 28),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const VLogomark(),
                    const Spacer(),
                    Text(
                      '30 DAYS · ONE HABIT',
                      style: Vital30Text.eyebrow.copyWith(
                        color: Vital30Colors.primary,
                        letterSpacing: 1.6,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 14),
                    RichText(
                      text: TextSpan(
                        style: Vital30Text.display,
                        children: [
                          const TextSpan(text: 'Better habits.\n'),
                          TextSpan(
                            text: 'Healthier',
                            style: Vital30Text.serifAccent(
                              size: 46,
                              color: Vital30Colors.ink,
                            ),
                          ),
                          const TextSpan(text: ' you.'),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),
                    SizedBox(
                      width: 300,
                      child: Text(
                        'Join simple 30-day wellness challenges, check in daily, watch your streak grow.',
                        style: Vital30Text.body.copyWith(fontSize: 15.5),
                      ),
                    ),
                    const SizedBox(height: 32),
                    VButton(
                      label: 'Get started',
                      fullWidth: true,
                      onPressed: () => context.push('/register'),
                    ),
                    const SizedBox(height: 10),
                    SizedBox(
                      width: double.infinity,
                      child: TextButton(
                        onPressed: () => context.push('/login'),
                        style: TextButton.styleFrom(
                          foregroundColor: Vital30Colors.inkSoft,
                          textStyle: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                          minimumSize: const Size.fromHeight(44),
                        ),
                        child: const Text('I already have an account'),
                      ),
                    ),
                    const SizedBox(height: 18),
                    Center(
                      child: Text(
                        'General wellness guidance only. Not medical advice.',
                        style: Vital30Text.caption.copyWith(
                          color: Vital30Colors.mutedSoft,
                          fontSize: 11,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DecorRingsPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final dashedPaint = Paint()
      ..color = Vital30Colors.primary
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    final solidPaint = Paint()
      ..color = Vital30Colors.primary
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;

    canvas.drawCircle(center, 100, solidPaint);
    _drawDashedCircle(canvas, center, 135, dashedPaint, dashLength: 2, gap: 6);
  }

  void _drawDashedCircle(
    Canvas canvas,
    Offset center,
    double radius,
    Paint paint, {
    required double dashLength,
    required double gap,
  }) {
    final circumference = 2 * 3.1415926 * radius;
    final dashes = (circumference / (dashLength + gap)).floor();
    final sweep = (dashLength / radius);
    final gapSweep = (gap / radius);
    var angle = -3.1415926 / 2;
    final rect = Rect.fromCircle(center: center, radius: radius);
    for (var i = 0; i < dashes; i++) {
      canvas.drawArc(rect, angle, sweep, false, paint);
      angle += sweep + gapSweep;
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
