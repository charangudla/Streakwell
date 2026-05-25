import 'main_common.dart';

void main() async {
  // Defaults to development environment for local testing and double-click runners.
  await runWithEnv('assets/env/development.env');
}
