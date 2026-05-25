# Mac Setup

This guide prepares a Mac for Vital30 development.

## Core Tools

Install Homebrew from https://brew.sh, then install the basics:

```bash
brew install git
brew install --cask visual-studio-code
brew install --cask docker
brew install nvm
```

Set up Node.js with nvm. Use an active LTS release such as Node 22:

```bash
mkdir -p ~/.nvm
nvm install 22
nvm use 22
npm install -g @nestjs/cli
```

## Docker Desktop

Open Docker Desktop once after installing it and wait until it reports that Docker is running.

Verify:

```bash
docker --version
docker compose version
```

## Flutter SDK

Install Flutter using the official macOS install flow, then verify:

```bash
flutter doctor
```

Follow every action item from `flutter doctor`.

## iOS Setup

- Install Xcode from the Mac App Store.
- Open Xcode once and install additional components when prompted.
- Install CocoaPods:

```bash
brew install cocoapods
```

- Create and boot an iOS simulator from Xcode.

## Android Setup

- Install Android Studio.
- Install Android SDK Platform Tools and a recent Android SDK.
- Create an Android emulator.
- Accept Android licenses:

```bash
flutter doctor --android-licenses
```

Run `flutter doctor` again and confirm iOS, Android, and connected devices are healthy enough for development.

## NestJS CLI

The API was scaffolded with the NestJS CLI. Install it globally for future generators:

```bash
npm install -g @nestjs/cli
```
