import 'package:flutter_test/flutter_test.dart';
import 'package:dio/dio';
import 'package:vital30/core/network/api_service.dart';

void main() {
  test('ApiService falls back to mock data on DioException error', () async {
    final dio = Dio(); // Raw unconfigured dio that will fail network calls instantly
    final apiService = ApiService(dio);

    // Should not crash, but print fallback warning and return seeded categories list
    final categories = await apiService.getCategories();
    expect(categories, isNotEmpty);
    expect(categories.first.name, 'Diet & Nutrition');

    // Should return seeded challenges list
    final challenges = await apiService.getChallenges();
    expect(challenges, isNotEmpty);
    expect(challenges.first.title, 'No Refined Sugar');
  });
}
