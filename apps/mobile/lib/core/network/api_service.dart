import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart' show debugPrint;
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/domain/user.dart';
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

  // 2. Authentication — Better Auth backend, errors propagate, no offline
  // fallback for any mutation. Endpoints live under /api/auth/* and return
  // `{ token, user }` for sign-in / sign-up.
  Future<AuthResponse> login(String email, String password) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/auth/sign-in/email',
      data: {'email': email, 'password': password},
    );
    return AuthResponse.fromJson(response.data ?? {});
  }

  Future<AuthResponse> register(String name, String email, String password) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/auth/sign-up/email',
      data: {'name': name, 'email': email, 'password': password},
    );
    return AuthResponse.fromJson(response.data ?? {});
  }

  /// Updates the authenticated user's name. Better Auth's update-user
  /// endpoint also accepts `image`; we only expose name in MVP.
  Future<User> updateProfile({String? name}) async {
    final body = <String, dynamic>{};
    if (name != null) body['name'] = name;
    await _dio.post<Map<String, dynamic>>('/api/auth/update-user', data: body);
    // Better Auth's update-user returns `{ status: true }`. Re-fetch the
    // session to get the updated user record.
    final session = await _dio.get<Map<String, dynamic>>(
      '/api/auth/get-session',
    );
    final userJson =
        session.data?['user'] as Map<String, dynamic>? ?? const {};
    return User.fromJson(userJson);
  }

  /// Hard-deletes the authenticated user and all owned data. Cascade in
  /// Prisma removes the user's challenges, check-ins, and share events.
  Future<void> deleteAccount() async {
    await _dio.post<void>('/api/auth/delete-user', data: const {});
  }

  /// Kicks off the password-reset flow — backend emails a reset code via
  /// Mailpit (dev) or Resend (prod). Always returns 204 even for unknown
  /// emails so attackers can't probe whether an account exists.
  Future<void> requestPasswordReset(String email) async {
    await _dio.post<void>(
      '/api/auth/request-password-reset',
      data: {'email': email},
    );
  }

  /// Consumes the reset token (the code from the email) and sets the new
  /// password. Errors propagate (invalid/expired token, weak password).
  Future<void> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    await _dio.post<void>(
      '/api/auth/reset-password',
      data: {'token': token, 'newPassword': newPassword},
    );
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

  // 7. Notifications inbox
  Future<List<AppNotification>> getNotifications() async {
    return _apiCall(
      () async {
        final response = await _dio.get<List<dynamic>>('/notifications');
        return (response.data ?? [])
            .map((j) => AppNotification.fromJson(j as Map<String, dynamic>))
            .toList();
      },
      () => const <AppNotification>[],
    );
  }

  Future<int> getUnreadNotificationCount() async {
    return _apiCall(
      () async {
        final response =
            await _dio.get<Map<String, dynamic>>('/notifications/unread-count');
        return (response.data?['count'] as int?) ?? 0;
      },
      () => 0,
    );
  }

  Future<void> markNotificationRead(String id) async {
    await _apiCall(
      () => _dio.post('/notifications/$id/read'),
      () {},
    );
  }

  Future<void> markAllNotificationsRead() async {
    await _apiCall(
      () => _dio.post('/notifications/read-all'),
      () {},
    );
  }

  // 8. Referrals
  Future<ReferralInfo> getMyReferral() async {
    return _apiCall(
      () async {
        final response = await _dio.get<Map<String, dynamic>>('/referrals/me');
        return ReferralInfo.fromJson(response.data ?? {});
      },
      () => const ReferralInfo(
        code: 'OFFLINE',
        referredCount: 0,
        shareText:
            'Try Vital30 with me — 30-day wellness challenges. https://vital30.com/download',
      ),
    );
  }

  Future<void> redeemReferralCode(String code) async {
    // Mutation — propagate errors so the UI can show "Invalid code" etc.
    await _dio.post('/referrals/redeem', data: {'code': code});
  }

  // 9. Favorites
  Future<List<FavoriteEntry>> getFavorites() async {
    return _apiCall(
      () async {
        final response = await _dio.get<List<dynamic>>('/favorites');
        return (response.data ?? [])
            .map((j) => FavoriteEntry.fromJson(j as Map<String, dynamic>))
            .toList();
      },
      () => const <FavoriteEntry>[],
    );
  }

  Future<void> addFavorite(String challengeId) async {
    await _dio.post('/favorites', data: {'challengeId': challengeId});
  }

  Future<void> removeFavorite(String challengeId) async {
    await _dio.delete('/favorites/$challengeId');
  }

  // 10. Achievements
  Future<List<AchievementEntry>> getAchievements() async {
    return _apiCall(
      () async {
        final response = await _dio.get<List<dynamic>>('/achievements');
        return (response.data ?? [])
            .map((j) => AchievementEntry.fromJson(j as Map<String, dynamic>))
            .toList();
      },
      () => const <AchievementEntry>[],
    );
  }

  // 11. Custom challenges + invites
  Future<CustomChallenge> createCustomChallenge({
    required String title,
    required String shortDescription,
    String? description,
    required String dailyTask,
    required int durationDays,
    required String difficulty,
    required String categoryId,
    String visibility = 'PRIVATE',
  }) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/custom-challenges',
      data: {
        'title': title,
        'shortDescription': shortDescription,
        if (description != null && description.isNotEmpty)
          'description': description,
        'dailyTask': dailyTask,
        'durationDays': durationDays,
        'difficulty': difficulty,
        'categoryId': categoryId,
        'visibility': visibility,
      },
    );
    return CustomChallenge.fromJson(res.data ?? {});
  }

  Future<List<CustomChallenge>> getMyCreatedChallenges() async {
    return _apiCall(
      () async {
        final res = await _dio.get<List<dynamic>>('/custom-challenges/mine');
        return (res.data ?? [])
            .map((j) => CustomChallenge.fromJson(j as Map<String, dynamic>))
            .toList();
      },
      () => const <CustomChallenge>[],
    );
  }

  Future<void> inviteToChallenge(String challengeId, String email) async {
    await _dio.post(
      '/custom-challenges/$challengeId/invites',
      data: {'email': email},
    );
  }

  Future<List<IncomingInvite>> getMyInvites() async {
    return _apiCall(
      () async {
        final res = await _dio.get<List<dynamic>>('/invites');
        return (res.data ?? [])
            .map((j) => IncomingInvite.fromJson(j as Map<String, dynamic>))
            .toList();
      },
      () => const <IncomingInvite>[],
    );
  }

  /// Returns the userChallengeId when the decision is ACCEPTED, null on
  /// DECLINED.
  Future<String?> respondToInvite(String inviteId, String decision) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/invites/$inviteId/respond',
      data: {'decision': decision},
    );
    return res.data?['userChallengeId'] as String?;
  }
}
