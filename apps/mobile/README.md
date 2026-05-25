# Vital30 Mobile

Flutter was not installed in this setup environment, so this starter includes the tracked Dart source, routing, theme, networking, package manifest, and env sample.

After installing Flutter and confirming `flutter doctor`, generate the native platform folders from this directory:

```bash
flutter create . --project-name vital30 --org com.vital30 --platforms=ios,android
flutter pub get
flutter run
```

Use `--dart-define=API_BASE_URL=http://10.0.2.2:3000` for the Android emulator when calling a backend running on the Mac.
