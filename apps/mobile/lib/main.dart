import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await dotenv.load(fileName: 'assets/env/development.env');
  } catch (_) {
    // Dart defines still provide a base URL if the bundled env file is absent.
  }

  runApp(const ProviderScope(child: Vital30App()));
}
