import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_service.dart';
import '../../../core/network/mock_data.dart';

final categoriesProvider = FutureProvider<List<Category>>((ref) async {
  return ref.watch(apiServiceProvider).getCategories();
});

final challengesProvider = FutureProvider<List<Challenge>>((ref) async {
  return ref.watch(apiServiceProvider).getChallenges();
});

final challengeSearchQueryProvider = StateProvider<String>((ref) => '');
final challengeCategoryFilterProvider = StateProvider<String?>((ref) => null);

// Derived state to get filtered challenges automatically
final filteredChallengesProvider = Provider<AsyncValue<List<Challenge>>>((ref) {
  final challengesAsync = ref.watch(challengesProvider);
  final query = ref.watch(challengeSearchQueryProvider).toLowerCase();
  final selectedCategoryId = ref.watch(challengeCategoryFilterProvider);

  return challengesAsync.whenData((list) {
    return list.where((c) {
      final matchesSearch = c.title.toLowerCase().contains(query) ||
          c.shortDescription.toLowerCase().contains(query);
      final matchesCategory =
          selectedCategoryId == null || c.categoryId == selectedCategoryId;
      return matchesSearch && matchesCategory;
    }).toList();
  });
});
