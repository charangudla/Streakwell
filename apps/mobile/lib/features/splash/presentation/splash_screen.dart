import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_typography.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  // Routing is handled by the router's redirect logic, which reacts to
  // AuthStatus transitions. No timer needed here.

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment(0, -0.1),
            radius: 1.0,
            colors: [
              Vital30Colors.primary,
              Vital30Colors.primaryDeep,
              Color(0xFF032E27),
            ],
            stops: [0.0, 0.65, 1.0],
          ),
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _SplashBadge(),
                  const SizedBox(height: 24),
                  RichText(
                    text: TextSpan(
                      style: const TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.6,
                        color: Vital30Colors.surface,
                      ),
                      children: [
                        const TextSpan(text: 'Vital'),
                        TextSpan(
                          text: '30',
                          style: TextStyle(color: Vital30Colors.accent),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Positioned(
              left: 0,
              right: 0,
              bottom: 46,
              child: Column(
                children: [
                  _DotLoader(),
                  const SizedBox(height: 14),
                  Text(
                    'Small daily actions. Lifelong health.',
                    style: Vital30Text.serifAccent(
                      size: 13,
                      color: Vital30Colors.surface.withValues(alpha: 0.65),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SplashBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 124,
      height: 124,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(124 * 0.224),
        border: Border.all(color: Colors.white.withValues(alpha: 0.10)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x66000000),
            offset: Offset(0, 30),
            blurRadius: 60,
            spreadRadius: -10,
          ),
        ],
      ),
      alignment: Alignment.center,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Positioned(
            right: -10,
            bottom: -10,
            child: Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: Vital30Colors.accent.withValues(alpha: 0.85),
                  width: 4,
                ),
              ),
            ),
          ),
          Text(
            '30',
            style: Vital30Text.serifAccent(
              size: 104,
              color: Vital30Colors.surface,
            ).copyWith(letterSpacing: -3),
          ),
        ],
      ),
    );
  }
}

class _DotLoader extends StatefulWidget {
  @override
  State<_DotLoader> createState() => _DotLoaderState();
}

class _DotLoaderState extends State<_DotLoader>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c =
      AnimationController(vsync: this, duration: const Duration(seconds: 1))
        ..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _c,
      builder: (context, _) {
        return Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(3, (i) {
            final phase = ((_c.value * 3) - i).clamp(0.0, 1.0);
            final opacity = (1 - (phase - 0.5).abs() * 2).clamp(0.35, 1.0);
            return Padding(
              padding: EdgeInsets.only(right: i < 2 ? 6 : 0),
              child: Container(
                width: 7,
                height: 7,
                decoration: BoxDecoration(
                  color: Vital30Colors.surface.withValues(alpha: opacity),
                  shape: BoxShape.circle,
                ),
              ),
            );
          }),
        );
      },
    );
  }
}
