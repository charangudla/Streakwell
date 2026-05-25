import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_service.dart';
import '../../../core/storage/secure_storage.dart';
import '../domain/user.dart';

enum AuthStatus { initial, authenticated, unauthenticated, authenticating }

class AuthState {
  const AuthState({
    required this.status,
    this.user,
    this.errorMessage,
  });

  final AuthStatus status;
  final User? user;
  final String? errorMessage;

  factory AuthState.initial() => const AuthState(status: AuthStatus.initial);
  factory AuthState.authenticated(User user) =>
      AuthState(status: AuthStatus.authenticated, user: user);
  factory AuthState.unauthenticated({String? error}) =>
      AuthState(status: AuthStatus.unauthenticated, errorMessage: error);
  factory AuthState.authenticating() => const AuthState(status: AuthStatus.authenticating);

  bool get isAuthenticated => status == AuthStatus.authenticated;
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  final secureStorage = ref.watch(secureStorageProvider);
  return AuthNotifier(apiService, secureStorage);
});

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._apiService, this._secureStorage) : super(AuthState.initial()) {
    checkAuth();
  }

  final ApiService _apiService;
  final SecureStorage _secureStorage;

  Future<void> checkAuth() async {
    final token = await _secureStorage.getToken();
    if (token == null || token.isEmpty) {
      state = AuthState.unauthenticated();
      return;
    }

    final userJson = await _secureStorage.getUser();
    if (userJson == null) {
      await _secureStorage.deleteToken();
      state = AuthState.unauthenticated();
      return;
    }

    state = AuthState.authenticated(User.fromJson(userJson));
  }

  Future<bool> login(String email, String password) async {
    state = AuthState.authenticating();
    try {
      final response = await _apiService.login(email, password);
      await _secureStorage.saveToken(response.token);
      await _secureStorage.saveUser(response.user.toJson());
      state = AuthState.authenticated(response.user);
      return true;
    } catch (e) {
      state = AuthState.unauthenticated(error: _friendlyError(e));
      return false;
    }
  }

  Future<bool> register(String name, String email, String password) async {
    state = AuthState.authenticating();
    try {
      final response = await _apiService.register(name, email, password);
      await _secureStorage.saveToken(response.token);
      await _secureStorage.saveUser(response.user.toJson());
      state = AuthState.authenticated(response.user);
      return true;
    } catch (e) {
      state = AuthState.unauthenticated(error: _friendlyError(e));
      return false;
    }
  }

  Future<void> logout() async {
    await _secureStorage.deleteToken();
    await _secureStorage.deleteUser();
    state = AuthState.unauthenticated();
  }

  String _friendlyError(Object e) {
    if (e is DioException) {
      if (e.response?.data is Map) {
        final msg = (e.response!.data as Map)['message'];
        if (msg is String && msg.isNotEmpty) return msg;
      }
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.connectionError ||
          e.type == DioExceptionType.receiveTimeout) {
        return 'Unable to connect. Check your internet connection.';
      }
      return 'Server error. Please try again.';
    }
    return e.toString().replaceAll('Exception: ', '');
  }
}
