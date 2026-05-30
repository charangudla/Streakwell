import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_spacing.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/widgets/challenge_card.dart';
import '../../../core/widgets/screen_header.dart';
import 'challenges_provider.dart';

class ChallengesScreen extends ConsumerWidget {
  const ChallengesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categoriesAsync = ref.watch(categoriesProvider);
    final filteredAsync = ref.watch(filteredChallengesProvider);
    final selectedId = ref.watch(challengeCategoryFilterProvider);
    final query = ref.watch(challengeSearchQueryProvider);

    return SafeArea(
      bottom: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 14),
          const ScreenHeader(
            title: 'Challenges',
            subtitle: 'Browse all 30-day challenges.',
          ),
          const SizedBox(height: 18),
          Padding(
            padding:
                const EdgeInsets.symmetric(horizontal: Vital30Space.screenH),
            child: _SearchBar(initialQuery: query),
          ),
          const SizedBox(height: 14),
          SizedBox(
            height: 38,
            child: categoriesAsync.when(
              data: (cats) => ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(
                    horizontal: Vital30Space.screenH),
                itemCount: cats.length + 1,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, i) {
                  if (i == 0) {
                    return _FilterChip(
                      label: 'All',
                      active: selectedId == null,
                      onTap: () => ref
                          .read(challengeCategoryFilterProvider.notifier)
                          .state = null,
                    );
                  }
                  final cat = cats[i - 1];
                  return _FilterChip(
                    label: cat.name,
                    active: selectedId == cat.id,
                    onTap: () => ref
                        .read(challengeCategoryFilterProvider.notifier)
                        .state = selectedId == cat.id ? null : cat.id,
                  );
                },
              ),
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
            ),
          ),
          const SizedBox(height: 18),
          Expanded(
            child: filteredAsync.when(
              data: (list) {
                if (list.isEmpty) return const _EmptyResults();
                return ListView.separated(
                  padding: const EdgeInsets.fromLTRB(
                      Vital30Space.screenH, 0, Vital30Space.screenH, 140),
                  itemCount: list.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    final c = list[i];
                    return ChallengeCard(
                      challenge: c,
                      badge: c.isPopular ? 'Popular' : null,
                      onTap: () => context.push('/challenge/${c.id}'),
                    );
                  },
                );
              },
              loading: () => const Center(
                child: CircularProgressIndicator(color: Vital30Colors.primary),
              ),
              error: (e, _) => Center(
                child: Text('Error loading challenges: $e',
                    style: Vital30Text.body),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SearchBar extends ConsumerStatefulWidget {
  const _SearchBar({required this.initialQuery});
  final String initialQuery;

  @override
  ConsumerState<_SearchBar> createState() => _SearchBarState();
}

class _SearchBarState extends ConsumerState<_SearchBar> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialQuery);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 46,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Vital30Colors.card,
        borderRadius: BorderRadius.circular(Vital30Radius.md),
        border: Border.all(color: Vital30Colors.hairline),
        boxShadow: Vital30Shadow.soft,
      ),
      child: Row(
        children: [
          const Icon(Icons.search, size: 18, color: Vital30Colors.muted),
          const SizedBox(width: 10),
          Expanded(
            child: TextField(
              controller: _controller,
              decoration: InputDecoration(
                hintText: 'Search challenges',
                hintStyle:
                    Vital30Text.body.copyWith(color: Vital30Colors.mutedSoft),
                isCollapsed: true,
                border: InputBorder.none,
                contentPadding: EdgeInsets.zero,
              ),
              style: Vital30Text.body
                  .copyWith(fontSize: 14, color: Vital30Colors.ink),
              onChanged: (v) =>
                  ref.read(challengeSearchQueryProvider.notifier).state = v,
            ),
          ),
          if (_controller.text.isNotEmpty)
            GestureDetector(
              onTap: () {
                _controller.clear();
                ref.read(challengeSearchQueryProvider.notifier).state = '';
                setState(() {});
              },
              child:
                  const Icon(Icons.close, size: 18, color: Vital30Colors.muted),
            ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.active,
    required this.onTap,
  });
  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        alignment: Alignment.center,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: active ? Vital30Colors.ink : Vital30Colors.card,
          borderRadius: BorderRadius.circular(Vital30Radius.pill),
          border: active ? null : Border.all(color: Vital30Colors.hairline),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: active ? Vital30Colors.surface : Vital30Colors.inkSoft,
          ),
        ),
      ),
    );
  }
}

class _EmptyResults extends StatelessWidget {
  const _EmptyResults();
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 84,
              height: 84,
              decoration: const BoxDecoration(
                color: Vital30Colors.primaryTint,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.search_off,
                size: 36,
                color: Vital30Colors.primaryDeep,
              ),
            ),
            const SizedBox(height: 16),
            Text('No challenges found',
                style: Vital30Text.h2, textAlign: TextAlign.center),
            const SizedBox(height: 8),
            Text(
              'Try a different search or filter.',
              style: Vital30Text.body,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
