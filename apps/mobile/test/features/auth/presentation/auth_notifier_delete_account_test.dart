import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:vital30/core/network/api_service.dart';
import 'package:vital30/core/storage/secure_storage.dart';
import 'package:vital30/features/auth/presentation/auth_provider.dart';

Dio _buildDio({
  required Response<dynamic> Function(RequestOptions options)? onSuccess,
  DioException Function(RequestOptions options)? onError,
}) {
  final dio = Dio(BaseOptions(baseUrl: 'http://test.local'));
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, h) {
        if (onError != null) {
          h.reject(onError(options));
          return;
        }
        h.resolve(onSuccess!(options));
      },
    ),
  );
  return dio;
}

class _InMemorySecureStorage implements SecureStorage {
  String? _token;
  Map<String, dynamic>? _user;
  int deleteTokenCount = 0;
  int deleteUserCount = 0;

  _InMemorySecureStorage({String? token, Map<String, dynamic>? user})
      : _token = token,
        _user = user;

  @override
  Future<void> saveToken(String token) async => _token = token;
  @override
  Future<String?> getToken() async => _token;
  @override
  Future<void> deleteToken() async {
    deleteTokenCount++;
    _token = null;
  }

  @override
  Future<void> saveUser(Map<String, dynamic> userJson) async => _user = userJson;
  @override
  Future<Map<String, dynamic>?> getUser() async => _user;
  @override
  Future<void> deleteUser() async {
    deleteUserCount++;
    _user = null;
  }
}

void main() {
  final seededUser = {
    'id': '11111111-1111-1111-1111-111111111111',
    'email': 'me@example.com',
    'name': 'Original',
    'role': 'USER',
  };

  group('AuthNotifier.deleteAccount', () {
    test('on 204 clears local storage and flips state to unauthenticated',
        () async {
      RequestOptions? captured;
      final dio = _buildDio(
        onSuccess: (options) {
          captured = options;
          return Response<void>(
            requestOptions: options,
            statusCode: 204,
          );
        },
      );
      final api = ApiService(dio);
      final storage = _InMemorySecureStorage(
        token: 'real-token',
        user: Map<String, dynamic>.from(seededUser),
      );

      final notifier = AuthNotifier(api, storage);
      await notifier.checkAuth();
      expect(notifier.state.status, AuthStatus.authenticated);

      final error = await notifier.deleteAccount();

      expect(error, isNull);
      expect(notifier.state.status, AuthStatus.unauthenticated);
      expect(notifier.state.user, isNull);
      expect(storage.deleteTokenCount, 1);
      expect(storage.deleteUserCount, 1);
      expect(await storage.getToken(), isNull);
      expect(await storage.getUser(), isNull);
      expect(captured?.method, 'DELETE');
      expect(captured?.path, '/users/me');
    });

    test('on server error keeps the user signed in and returns a message',
        () async {
      final dio = _buildDio(
        onSuccess: null,
        onError: (options) => DioException(
          requestOptions: options,
          response: Response<Map<String, dynamic>>(
            requestOptions: options,
            statusCode: 500,
            data: const {'message': 'Database is on fire'},
          ),
          type: DioExceptionType.badResponse,
        ),
      );
      final api = ApiService(dio);
      final storage = _InMemorySecureStorage(
        token: 'real-token',
        user: Map<String, dynamic>.from(seededUser),
      );

      final notifier = AuthNotifier(api, storage);
      await notifier.checkAuth();

      final error = await notifier.deleteAccount();

      expect(error, isNotNull);
      expect(notifier.state.status, AuthStatus.authenticated);
      expect(notifier.state.user?.email, 'me@example.com');
      // Critical: don't half-delete — if the backend failed, local creds stay
      // intact so the user can retry.
      expect(storage.deleteTokenCount, 0);
      expect(storage.deleteUserCount, 0);
    });

    test('refuses when no user is signed in', () async {
      final dio = _buildDio(
        onSuccess: (options) => Response<void>(
          requestOptions: options,
          statusCode: 204,
        ),
      );
      final api = ApiService(dio);
      final storage = _InMemorySecureStorage();

      final notifier = AuthNotifier(api, storage);
      await notifier.checkAuth();

      final error = await notifier.deleteAccount();
      expect(error, contains('signed in'));
      expect(storage.deleteTokenCount, 0);
    });
  });
}
