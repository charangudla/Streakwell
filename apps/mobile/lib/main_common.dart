import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';

/// Centralized bootstrapping function for all environment entrypoints.
Future<void> runWithEnv(String envPath) async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await dotenv.load(fileName: envPath);
  } catch (e) {
    // Dart defines still provide a base URL if the bundled env file is absent.
    debugPrint('[main_common] Failed to load env file from $envPath: $e');
  }

  runApp(
    const ProviderScope(
      child: Vital30App(),
    ),
  );
}
