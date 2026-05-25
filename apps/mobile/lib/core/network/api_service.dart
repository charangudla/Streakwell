import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart' show debugPrint;
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../constants/app_constants.dart';
import '../storage/secure_storage.dart';
import 'mock_data.dart' show MockData;
import 'models.dart';

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: AppConstants.apiBaseUrl,
      connectTimeout: const Duration(seconds: 4),
      receiveTimeout: const Duration(seconds: 4),
      headers: {'Accept': 'application/json'},
    ),
  );

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final secureStorage = ref.read(secureStorageProvider);
        final token = await secureStorage.getToken();
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
    ),
  );

  return dio;
});

final apiServiceProvider = Provider<ApiService>((ref) {
  return ApiService(ref.watch(dioProvider));
});

class ApiService {
  ApiService(this._dio);
  final Dio _dio;

  // In-memory collections used as offline fallback for non-auth endpoints.
  static final List<UserChallenge> _mockUserChallenges = [];
  static final List<DailyCheckin> _mockDailyCheckins = [];
  static final List<Map<String, dynamic>> _mockShareEvents = [];

  // Wraps a real API call with a lazy offline fallback.
  // Auth calls must NOT use this — they should propagate errors directly.
  Future<T> _apiCall<T>(
    Future<T> Function() apiFn,
    T Function() fallback,
  ) async {
    try {
      return await apiFn();
    } catch (e) {
      debugPrint('[ApiService] offline fallback: $e');
      return fallback();
    }
  }

  // 1. Health
  Future<HealthResponse> getHealth() async {
    return _apiCall(
      () async {
        final response = await _dio.get<Map<String, dynamic>>('/health');
        return HealthResponse.fromJson(response.data ?? {});
      },
      () => const HealthResponse(
        status: 'ok',
        service: 'vital30-offline',
        timestamp: '',
      ),
    );
  }

  // 2. Authentication — errors propagate; no offline fallback for auth.
  Future<AuthResponse> login(String email, String password) async {
    final response = await _dio.post<Map<String, dynamic>>('/auth/login', data: {
      'email': email,
      'password': password,
    });
    return AuthResponse.fromJson(response.data ?? {});
  }

  Future<AuthResponse> register(String name, String email, String password) async {
    final response = await _dio.post<Map<String, dynamic>>('/auth/register', data: {
      'name': name,
      'email': email,
      'password': password,
    });
    return AuthResponse.fromJson(response.data ?? {});
  }

  // 3. Challenge Catalog
  Future<List<Category>> getCategories() async {
    return _apiCall(
      () async {
        final response = await _dio.get<List<dynamic>>('/categories');
        return (response.data ?? [])
            .map((json) => Category.fromJson(json as Map<String, dynamic>))
            .toList();
      },
      () => MockData.categories,
    );
  }

  Future<List<Challenge>> getChallenges() async {
    return _apiCall(
      () async {
        final response = await _dio.get<List<dynamic>>('/challenges');
        return (response.data ?? [])
            .map((json) => Challenge.fromJson(json as Map<String, dynamic>))
            .toList();
      },
      () => MockData.challenges,
    );
  }

  // 4. User Challenges
  Future<UserChallenge> joinChallenge(String challengeId, String userId) async {
    return _apiCall(
      () async {
        final response = await _dio.post<Map<String, dynamic>>(
          '/user-challenges',
          data: {'challengeId': challengeId},
        );
        return UserChallenge.fromJson(response.data ?? {});
      },
      () {
        final existing = _mockUserChallenges.where(
          (uc) => uc.challengeId == challengeId && uc.userId == userId && uc.status == 'ACTIVE',
        );
        if (existing.isNotEmpty) return existing.first;
        final newUc = UserChallenge(
          id: 'uc-${_mockUserChallenges.length + 1}',
          userId: userId,
          challengeId: challengeId,
          status: 'ACTIVE',
          startDate: DateTime.now(),
          progressPercent: 0.0,
        );
        _mockUserChallenges.add(newUc);
        return newUc;
      },
    );
  }

  Future<List<UserChallenge>> getUserChallenges(String userId) async {
    return _apiCall(
      () async {
        final response = await _dio.get<List<dynamic>>('/user-challenges');
        return (response.data ?? [])
            .map((json) => UserChallenge.fromJson(json as Map<String, dynamic>))
            .toList();
      },
      () => _mockUserChallenges.where((uc) => uc.userId == userId).toList(),
    );
  }

  // 5. Daily Check-in
  Future<DailyCheckin> checkin(
    String userChallengeId,
    String status,
    String? notes,
  ) async {
    return _apiCall(
      () async {
        final response = await _dio.post<Map<String, dynamic>>('/checkins', data: {
          'userChallengeId': userChallengeId,
          'status': status,
          'notes': notes,
        });
        return DailyCheckin.fromJson(response.data ?? {});
      },
      () {
        final now = DateTime.now();
        _mockDailyCheckins.removeWhere(
          (c) =>
              c.userChallengeId == userChallengeId &&
              c.checkinDate.year == now.year &&
              c.checkinDate.month == now.month &&
              c.checkinDate.day == now.day,
        );
        final newCheckin = DailyCheckin(
          id: 'ck-${_mockDailyCheckins.length + 1}',
          userChallengeId: userChallengeId,
          checkinDate: now,
          status: status,
          notes: notes,
          createdAt: now,
        );
        _mockDailyCheckins.add(newCheckin);

        final idx = _mockUserChallenges.indexWhere((uc) => uc.id == userChallengeId);
        if (idx != -1) {
          final uc = _mockUserChallenges[idx];
          final completed = _mockDailyCheckins
              .where((c) => c.userChallengeId == userChallengeId && c.status == 'COMPLETED')
              .length;
          uc.progressPercent = (completed / 30.0 * 100.0).clamp(0.0, 100.0);
          if (uc.progressPercent >= 100.0) {
            uc.status = 'COMPLETED';
            uc.endDate = now;
          }
        }
        return newCheckin;
      },
    );
  }

  Future<List<DailyCheckin>> getDailyCheckins(String userChallengeId) async {
    return _apiCall(
      () async {
        final response =
            await _dio.get<List<dynamic>>('/checkins/challenge/$userChallengeId');
        return (response.data ?? [])
            .map((json) => DailyCheckin.fromJson(json as Map<String, dynamic>))
            .toList();
      },
      () => _mockDailyCheckins.where((c) => c.userChallengeId == userChallengeId).toList(),
    );
  }

  // 6. Share Event
  Future<void> createShareEvent(
    String type,
    String platform,
    Map<String, dynamic>? payload,
  ) async {
    await _apiCall(
      () async {
        await _dio.post('/share-events', data: {
          'type': type,
          'platform': platform,
          'payload': payload,
        });
      },
      () {
        _mockShareEvents.add({
          'id': 'se-${_mockShareEvents.length + 1}',
          'type': type,
          'platform': platform,
          'payload': payload,
          'createdAt': DateTime.now().toIso8601String(),
        });
      },
    );
  }
}
