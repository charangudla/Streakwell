# App Store Notes

These notes are for later mobile release work. The current repository only contains a Flutter starter app.

## Android

Build an Android App Bundle:

```bash
cd apps/mobile
flutter build appbundle --release
```

Then upload the generated `.aab` file to Google Play Console.

Before release:

- Configure package name
- Configure app signing
- Add launcher icons and splash screen
- Complete privacy, data safety, and store listing details

## iOS

Open the iOS project in Xcode:

```bash
cd apps/mobile
open ios/Runner.xcworkspace
```

Configure:

- Bundle ID
- Signing team
- App icons and launch screen
- Privacy descriptions as needed

An Apple Developer account is required.

Build:

```bash
cd apps/mobile
flutter build ipa --release
```

Upload through Xcode, Transporter, or App Store Connect.
