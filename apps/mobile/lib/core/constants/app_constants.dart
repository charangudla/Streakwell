import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConstants {
  const AppConstants._();

  static const appName = 'Vital30';
  static const defaultApiBaseUrl = 'http://localhost:3000';
  static const dartDefineApiBaseUrl = String.fromEnvironment('API_BASE_URL');

  /// Enable the in-app Developer section on Profile (milestone modal +
  /// Day-30 screen triggers). Off by default — pass
  /// `--dart-define=DEBUG_MENU=true` at build time to enable.
  static const debugMenuEnabled = bool.fromEnvironment('DEBUG_MENU');

  static String get apiBaseUrl {
    if (dartDefineApiBaseUrl.isNotEmpty) {
      return dartDefineApiBaseUrl;
    }

    try {
      final envValue = dotenv.env['API_BASE_URL'];
      if (envValue != null && envValue.isNotEmpty) {
        return envValue;
      }
    } catch (_) {
      // dotenv not initialized (e.g. tests). Fall through to default.
    }

    return defaultApiBaseUrl;
  }
}
