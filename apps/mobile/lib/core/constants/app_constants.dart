import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConstants {
  const AppConstants._();

  static const appName = 'Vital30';
  static const defaultApiBaseUrl = 'http://localhost:3000';
  static const dartDefineApiBaseUrl = String.fromEnvironment('API_BASE_URL');

  static String get apiBaseUrl {
    if (dartDefineApiBaseUrl.isNotEmpty) {
      return dartDefineApiBaseUrl;
    }

    final envValue = dotenv.env['API_BASE_URL'];
    if (envValue != null && envValue.isNotEmpty) {
      return envValue;
    }

    return defaultApiBaseUrl;
  }
}
