import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/mock_data.dart';
import 'challenges_provider.dart';

class ChallengesScreen extends ConsumerWidget {
  const ChallengesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categoriesAsync = ref.watch(categoriesProvider);
    final filteredAsync = ref.watch(filteredChallengesProvider);
    final selectedCategoryId = ref.watch(challengeCategoryFilterProvider);
    final searchQuery = ref.watch(challengeSearchQueryProvider);

    final textTheme = Theme.of(context).textTheme;

    Color getDifficultyColor(String diff) {
      switch (diff.toUpperCase()) {
        case 'BEGINNER':
          return const Color(0xFF3B82F6); // Blue
        case 'EASY':
          return const Color(0xFF10B981); // Emerald
        case 'MEDIUM':
          return const Color(0xFFF59E0B); // Amber
        case 'HARD':
          return const Color(0xFFEF4444); // Red
        default:
          return const Color(0xFF64748B);
      }
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Wellness Pillars',
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 24, letterSpacing: -0.5),
        ),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Elegant Search Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: TextField(
              onChanged: (val) => ref.read(challengeSearchQueryProvider.notifier).state = val,
              decoration: InputDecoration(
                hintText: 'Search wellness habits...',
                prefixIcon: const Icon(Icons.search, color: Color(0xFF8A9A92)),
                suffixIcon: searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: Color(0xFF8A9A92)),
                        onPressed: () {
                          ref.read(challengeSearchQueryProvider.notifier).state = '';
                        },
                      )
                    : null,
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: const BorderSide(color: Color(0xFFE1E8E4)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: const BorderSide(color: Color(0xFFE1E8E4)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: const BorderSide(color: Color(0xFF10B981), width: 1.5),
                ),
              ),
            ),
          ),

          // Horizontal Categories Filter Row
          categoriesAsync.when(
            data: (categories) => Container(
              height: 54,
              margin: const EdgeInsets.symmetric(vertical: 8.0),
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12.0),
                itemCount: categories.length + 1,
                itemBuilder: (context, index) {
                  final isAll = index == 0;
                  final Category? cat = isAll ? null : categories[index - 1];

                  final isSelected = isAll ? selectedCategoryId == null : selectedCategoryId == cat?.id;

                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4.0),
                    child: ChoiceChip(
                      label: Text(isAll ? 'All Pillars' : cat!.name),
                      selected: isSelected,
                      onSelected: (_) {
                        ref.read(challengeCategoryFilterProvider.notifier).state = isAll ? null : cat!.id;
                      },
                      labelStyle: TextStyle(
                        fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                        color: isSelected ? Colors.white : const Color(0xFF475569),
                        fontSize: 13,
                      ),
                      selectedColor: const Color(0xFF10B981),
                      backgroundColor: Colors.white,
                      checkmarkColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(
                          color: isSelected ? const Color(0xFF10B981) : const Color(0xFFE2E8F0),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            loading: () => const SizedBox(height: 54),
            error: (err, _) => const SizedBox(height: 54),
          ),

          // Category Description Callout
          if (selectedCategoryId != null)
            categoriesAsync.when(
              data: (categories) {
                final cat = categories.firstWhere((c) => c.id == selectedCategoryId);
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFECFDF5),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFD1FAE5)),
                    ),
                    child: Text(
                      cat.description,
                      style: const TextStyle(
                        color: Color(0xFF065F46),
                        fontSize: 13,
                        height: 1.4,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                );
              },
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
            ),

          // Challenges List Area
          Expanded(
            child: filteredAsync.when(
              data: (challenges) {
                if (challenges.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.search_off, size: 56, color: Color(0xFF8A9A92)),
                        const SizedBox(height: 16),
                        Text(
                          'No wellness habits matched',
                          style: textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF1E293B),
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Try modifying your filter parameters.',
                          style: TextStyle(color: Color(0xFF64748B), fontSize: 14),
                        ),
                      ],
                    ),
                  );
                }

                return ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                  itemCount: challenges.length,
                  itemBuilder: (context, index) {
                    final challenge = challenges[index];
                    final diffColor = getDifficultyColor(challenge.difficulty);

                    return Container(
                      key: ValueKey(challenge.id), // For testing validation
                      margin: const EdgeInsets.only(bottom: 16),
                      child: Card(
                        clipBehavior: Clip.antiAlias,
                        child: InkWell(
                          onTap: () => context.push('/challenge/${challenge.id}'),
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: diffColor.withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        challenge.difficulty.toUpperCase(),
                                        style: TextStyle(
                                          color: diffColor,
                                          fontWeight: FontWeight.w800,
                                          fontSize: 10,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    const Icon(Icons.timer_outlined, size: 14, color: Color(0xFF8A9A92)),
                                    const SizedBox(width: 4),
                                    Text(
                                      '${challenge.durationDays} Days',
                                      style: const TextStyle(
                                        color: Color(0xFF64748B),
                                        fontWeight: FontWeight.w700,
                                        fontSize: 12,
                                      ),
                                    ),
                                    const Spacer(),
                                    if (challenge.isPopular) ...[
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFFFF7ED),
                                          border: Border.all(color: const Color(0xFFFFEDD5)),
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: const Text(
                                          'POPULAR',
                                          style: TextStyle(
                                            color: Color(0xFFC2410C),
                                            fontWeight: FontWeight.w800,
                                            fontSize: 9,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  challenge.title,
                                  style: textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.w900,
                                    color: const Color(0xFF12211B),
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  challenge.shortDescription,
                                  style: const TextStyle(
                                    color: Color(0xFF4D5D55),
                                    fontSize: 13,
                                    height: 1.4,
                                  ),
                                ),
                                const SizedBox(height: 14),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.end,
                                  children: [
                                    Text(
                                      'View Habit Details',
                                      style: TextStyle(
                                        color: Theme.of(context).colorScheme.primary,
                                        fontWeight: FontWeight.w800,
                                        fontSize: 13,
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    Icon(
                                      Icons.arrow_forward,
                                      size: 14,
                                      color: Theme.of(context).colorScheme.primary,
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                );
              },
              loading: () => const Center(
                child: CircularProgressIndicator(color: Color(0xFF10B981)),
              ),
              error: (err, _) => Center(
                child: Text('Error loading habits: $err'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
