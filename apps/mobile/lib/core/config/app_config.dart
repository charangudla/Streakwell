import '../constants/app_constants.dart';

// Build-time and runtime configuration surface for the app.
// All environment-sensitive values are resolved via AppConstants.
class AppConfig {
  const AppConfig._();

  static String get apiBaseUrl => AppConstants.apiBaseUrl;

  static const int apiTimeoutSeconds = 4;
  static const int challengeDurationDays = 30;
}
