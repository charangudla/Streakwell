import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/v_categories.dart';
import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_spacing.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/widgets/cat_tile.dart';
import '../../../core/widgets/progress_ring.dart';
import '../../../core/widgets/thirty_day_grid.dart';
import '../../../core/widgets/v_button.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controller = PageController();
  int _index = 0;

  final _slides = <_OnboardSlide>[
    const _OnboardSlide(
      eyebrow: 'CATEGORIES',
      title: 'Pick a 30-day\nchallenge.',
      body:
          'Six wellness categories — from sleep to mental wellness. Pick one focus at a time.',
      tint: Vital30Colors.primaryTint,
      body2:
          'Build the habit before you stack the next one. Less is more.',
    ),
    const _OnboardSlide(
      eyebrow: 'CHECK IN',
      title: 'Check in once\na day.',
      body:
          'A single tap each day. Yes, no, or skip — no judgement, just data.',
      tint: Vital30Colors.accentTint,
      body2: "We won't make a big deal either way. Consistency adds up.",
    ),
    const _OnboardSlide(
      eyebrow: 'PROGRESS',
      title: 'Active days,\nnot perfect streaks.',
      body:
          'Life happens. We track the days you show up, not the days you missed.',
      tint: Vital30Colors.skyTint,
      body2: 'Your map fills in over thirty days. One cell at a time.',
    ),
  ];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _next() {
    if (_index < _slides.length - 1) {
      _controller.nextPage(
        duration: const Duration(milliseconds: 320),
        curve: Curves.easeOut,
      );
    } else {
      context.go('/register');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () => context.go('/welcome'),
                    style: TextButton.styleFrom(
                      foregroundColor: Vital30Colors.muted,
                    ),
                    child: const Text('Skip'),
                  ),
                ],
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _controller,
                itemCount: _slides.length,
                onPageChanged: (i) => setState(() => _index = i),
                itemBuilder: (context, i) => _OnboardPage(
                  slide: _slides[i],
                  index: i,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(
                  horizontal: Vital30Space.screenH, vertical: 20),
              child: Column(
                children: [
                  _Dots(count: _slides.length, active: _index),
                  const SizedBox(height: 18),
                  VButton(
                    label: _index == _slides.length - 1
                        ? 'Get started'
                        : 'Next',
                    fullWidth: true,
                    onPressed: _next,
                  ),
                ],
              ),
            ),
            SizedBox(height: MediaQuery.of(context).padding.bottom),
          ],
        ),
      ),
    );
  }
}

class _OnboardSlide {
  const _OnboardSlide({
    required this.eyebrow,
    required this.title,
    required this.body,
    required this.tint,
    required this.body2,
  });
  final String eyebrow;
  final String title;
  final String body;
  final String body2;
  final Color tint;
}

class _OnboardPage extends StatelessWidget {
  const _OnboardPage({required this.slide, required this.index});
  final _OnboardSlide slide;
  final int index;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Container(
              margin: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                color: slide.tint,
                borderRadius: BorderRadius.circular(Vital30Radius.xl),
              ),
              alignment: Alignment.center,
              child: _SlideVisual(index: index),
            ),
          ),
          const SizedBox(height: 18),
          Text(
            slide.eyebrow,
            style: Vital30Text.eyebrow.copyWith(
              color: Vital30Colors.primary,
              letterSpacing: 1.6,
              fontSize: 11,
            ),
          ),
          const SizedBox(height: 8),
          Text(slide.title, style: Vital30Text.h1),
          const SizedBox(height: 8),
          Text(slide.body, style: Vital30Text.body.copyWith(fontSize: 15)),
          const SizedBox(height: 4),
          Text(slide.body2, style: Vital30Text.body),
        ],
      ),
    );
  }
}

class _SlideVisual extends StatelessWidget {
  const _SlideVisual({required this.index});
  final int index;

  @override
  Widget build(BuildContext context) {
    switch (index) {
      case 0:
        return _CategoryTiles();
      case 1:
        return ProgressRing(
          progress: 0.6,
          size: 200,
          stroke: 14,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.check_circle,
                  size: 40, color: Vital30Colors.primary),
              const SizedBox(height: 6),
              Text(
                'YES',
                style: Vital30Text.label.copyWith(
                  fontSize: 12,
                  color: Vital30Colors.primary,
                  letterSpacing: 2,
                ),
              ),
            ],
          ),
        );
      case 2:
        final days = List<DayState>.generate(30, (i) {
          if (i < 8) return DayState.done;
          if (i == 8) return DayState.today;
          if (i == 4) return DayState.missed;
          return DayState.upcoming;
        });
        return ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 280),
          child: ThirtyDayGrid(days: days, cellSize: 30, spacing: 5),
        );
    }
    return const SizedBox.shrink();
  }
}

class _CategoryTiles extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      alignment: WrapAlignment.center,
      children: [
        for (final c in Vital30Category.values) CatTile(category: c, size: 60),
      ],
    );
  }
}

class _Dots extends StatelessWidget {
  const _Dots({required this.count, required this.active});
  final int count;
  final int active;
  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        for (var i = 0; i < count; i++)
          AnimatedContainer(
            duration: const Duration(milliseconds: 220),
            margin: const EdgeInsets.symmetric(horizontal: 4),
            height: 6,
            width: i == active ? 24 : 6,
            decoration: BoxDecoration(
              color:
                  i == active ? Vital30Colors.primary : Vital30Colors.hairline,
              borderRadius: BorderRadius.circular(99),
            ),
          ),
      ],
    );
  }
}
