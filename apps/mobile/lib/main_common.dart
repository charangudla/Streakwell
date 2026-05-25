import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app.dart';
import 'core/storage/preferences_storage.dart';
import 'features/profile/application/notification_settings_provider.dart';

/// Centralized bootstrapping function for all environment entrypoints.
Future<void> runWithEnv(String envPath) async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await dotenv.load(fileName: envPath);
  } catch (e) {
    // Dart defines still provide a base URL if the bundled env file is absent.
    debugPrint('[main_common] Failed to load env file from $envPath: $e');
  }

  final sharedPreferences = await SharedPreferences.getInstance();
  final prefsStorage = PreferencesStorage(sharedPreferences);

  runApp(
    ProviderScope(
      overrides: [
        preferencesStorageProvider.overrideWithValue(prefsStorage),
      ],
      child: const _AppBootstrap(child: Vital30App()),
    ),
  );
}

/// Runs once-per-launch async setup that depends on Riverpod providers
/// (notification plugin init + reschedule of the saved daily reminder).
class _AppBootstrap extends ConsumerStatefulWidget {
  const _AppBootstrap({required this.child});
  final Widget child;

  @override
  ConsumerState<_AppBootstrap> createState() => _AppBootstrapState();
}

class _AppBootstrapState extends ConsumerState<_AppBootstrap> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(notificationSettingsProvider.notifier).bootstrap().catchError(
        (Object e, StackTrace s) {
          debugPrint('[main_common] Notification bootstrap failed: $e');
        },
      );
    });
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
