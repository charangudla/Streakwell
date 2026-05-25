import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:vital30/core/network/api_service.dart';
import 'package:vital30/core/storage/secure_storage.dart';
import 'package:vital30/features/auth/domain/user.dart';
import 'package:vital30/features/auth/presentation/auth_provider.dart';

/// Wires Dio through an interceptor so we can return canned `/users/me`
/// responses without touching the real network.
Dio _buildDio({
  required Response<dynamic> Function(RequestOptions options) handler,
}) {
  final dio = Dio(BaseOptions(baseUrl: 'http://test.local'));
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, h) => h.resolve(handler(options)),
    ),
  );
  return dio;
}

class _InMemorySecureStorage implements SecureStorage {
  String? _token;
  Map<String, dynamic>? _user;
  int saveUserCount = 0;

  _InMemorySecureStorage({String? token, Map<String, dynamic>? user})
      : _token = token,
        _user = user;

  @override
  Future<void> saveToken(String token) async => _token = token;
  @override
  Future<String?> getToken() async => _token;
  @override
  Future<void> deleteToken() async => _token = null;

  @override
  Future<void> saveUser(Map<String, dynamic> userJson) async {
    saveUserCount++;
    _user = userJson;
  }

  @override
  Future<Map<String, dynamic>?> getUser() async => _user;
  @override
  Future<void> deleteUser() async => _user = null;
}

void main() {
  group('AuthNotifier.updateProfile', () {
    final seededUser = {
      'id': '11111111-1111-1111-1111-111111111111',
      'email': 'me@example.com',
      'name': 'Original',
      'role': 'USER',
    };

    test('persists the updated user and flips state on success', () async {
      RequestOptions? captured;
      final dio = _buildDio(handler: (options) {
        captured = options;
        return Response<Map<String, dynamic>>(
          requestOptions: options,
          statusCode: 200,
          data: {
            'id': '11111111-1111-1111-1111-111111111111',
            'email': 'me@example.com',
            'name': 'Renamed Person',
            'role': 'USER',
          },
        );
      });
      final api = ApiService(dio);
      final storage = _InMemorySecureStorage(
        token: 'fake-token',
        user: Map<String, dynamic>.from(seededUser),
      );

      final notifier = AuthNotifier(api, storage);
      await notifier.checkAuth();

      final error = await notifier.updateProfile(name: 'Renamed Person');

      expect(error, isNull);
      expect(notifier.state.user?.name, 'Renamed Person');
      expect(storage.saveUserCount, 1);
      expect(await storage.getUser(),
          containsPair('name', 'Renamed Person'));
      expect(captured?.path, '/users/me');
      expect(captured?.method, 'PATCH');
      expect(captured?.data, {'name': 'Renamed Person'});
    });

    test('returns the server error and keeps the prior user on failure',
        () async {
      final dio = _buildDio(handler: (options) {
        // Synthesise a 400 with a server-shaped message.
        throw DioException(
          requestOptions: options,
          response: Response<Map<String, dynamic>>(
            requestOptions: options,
            statusCode: 400,
            data: {'message': 'name must be longer than or equal to 1'},
          ),
          type: DioExceptionType.badResponse,
        );
      });
      final api = ApiService(dio);
      final storage = _InMemorySecureStorage(
        token: 'fake-token',
        user: Map<String, dynamic>.from(seededUser),
      );

      final notifier = AuthNotifier(api, storage);
      await notifier.checkAuth();

      final error = await notifier.updateProfile(name: '');

      expect(error, isNotNull);
      expect(error, contains('name must be longer'));
      // Original user is still in memory.
      expect(notifier.state.user?.name, 'Original');
      // And nothing was persisted.
      expect(storage.saveUserCount, 0);
      final stored = await storage.getUser();
      expect(stored?['name'], 'Original');
    });

    test('refuses to call the API when no user is signed in', () async {
      final dio = _buildDio(handler: (options) {
        // Should never be reached.
        return Response<Map<String, dynamic>>(
          requestOptions: options,
          statusCode: 200,
          data: {},
        );
      });
      final api = ApiService(dio);
      final storage = _InMemorySecureStorage();

      final notifier = AuthNotifier(api, storage);
      await notifier.checkAuth();

      final error = await notifier.updateProfile(name: 'Whoever');
      expect(error, contains('signed in'));
      expect(storage.saveUserCount, 0);
    });
  });

  group('ApiService.updateProfile', () {
    test('parses a partial user payload from the PATCH response', () async {
      final dio = _buildDio(handler: (options) {
        return Response<Map<String, dynamic>>(
          requestOptions: options,
          statusCode: 200,
          data: {
            'id': 'u1',
            'email': 'a@b.c',
            'name': 'Patched',
            'role': 'USER',
            'createdAt': '2026-01-01T00:00:00Z',
            'updatedAt': '2026-01-02T00:00:00Z',
          },
        );
      });
      final api = ApiService(dio);

      final user = await api.updateProfile(name: 'Patched');
      expect(user, isA<User>());
      expect(user.name, 'Patched');
      expect(user.email, 'a@b.c');
    });
  });
}
