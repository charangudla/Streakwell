# Vital30 App Store Submission Handbook

This guide outlines the complete procedure to build, package, and submit the **Vital30** mobile application to the Google Play Store and Apple App Store. It also includes compliance guidelines, common app rejection mitigations, and an MVP pre-release checklist.

---

## 🛠️ Build and Packaging Commands

Run the following commands in the root of `/apps/mobile` to generate release bundles:

### 🤖 Android App Bundle (AAB)
Compiles a release-ready Android App Bundle targeting the production environment:
```bash
flutter build appbundle --release -t lib/main_production.dart
```

### 🍏 iOS IPA Package
Compiles and bundles a release-ready archive for iOS targeting the production environment:
```bash
flutter build ipa --release -t lib/main_production.dart
```
*Note: This command generates a `.xcarchive` folder, which you can open and distribute inside Xcode Organizer or upload using Transporter / Xcode CLI.*

---

## 📋 Pre-Release Verification Checklist

Execute these verification drills before publishing any release candidate to production testing tracks (Google Play Internal/Beta or iOS TestFlight):

| Category | Check Item | Status | Verification Criteria |
| :--- | :--- | :---: | :--- |
| **Authentication** | Login works | `[ ]` | Can login cleanly with a registered user account. JWT token is stored securely. |
| **Authentication** | Logout works | `[ ]` | Logging out clears storage, deletes active credentials, and redirects to welcome screen. |
| **Challenges** | Challenge list works | `[ ]` | Active wellness categories and catalog blueprints render smoothly with zero errors. |
| **Challenges** | Join challenge works | `[ ]` | Pressing "Join Challenge" links the challenge to the user profile and starts day 1 tracking. |
| **Habits** | Daily check-in works | `[ ]` | Logging habit completions (Yes/No/Skip) and journals correctly increments streaks. |
| **Social** | Share works | `[ ]` | Pressing share exports a beautifully formatted habit progress text using share sheets. |
| **Legal** | Privacy Policy linked | `[ ]` | Privacy Policy tile in profile navigates to the policy or opens a clean standard privacy link. |
| **Legal** | Health Disclaimer visible | `[ ]` | Profile "Health Disclaimer" settings tile opens a detailed scrollable warning page. |
| **Legal** | No Medical Claims | `[ ]` | There are NO claims inside the app declaring that Vital30 diagnoses, treats, or cures disease. |

---

## 🤖 1. Android Release & Google Play Console Guide

### A. Release Build Settings & Keystore
To sign your release bundle in a production environment:
1. Generate a upload keystore using keytool:
   ```bash
   keytool -genkey -v -keystore ~/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
   ```
2. Create `apps/mobile/android/key.properties` (do NOT commit to git):
   ```properties
   storePassword=your_keystore_password
   keyPassword=your_key_password
   keyAlias=upload
   storeFile=/Users/your_user/upload-keystore.jks
   ```
3. Update `apps/mobile/android/app/build.gradle.kts` to load properties and define `release` signing config.

### B. Google Play Console Setup Steps
1. **Create Application**: Set type as **App**, category as **Free**, and default language.
2. **Data Safety Form**:
   * Vital30 collects Account details (Name, Email) and App Activity (Habit check-ins, challenge joins).
   * State that all data is encrypted in transit and users can request account deletion (deletion link: `https://challenge.charangudla.com/delete-account`).
   * Declare that **no data is shared with third parties** and **no data is sold**.
3. **Age Rating**:
   * Complete the questionnaire. Vital30 is classified as **3+ (PEGI)** or **Everyone (ESRB)** because it contains no offensive materials or adult content.
4. **App Content Declaration**: Declare that the app does not contain news, COVID-19 tracking, or government services.

---

## 🍏 2. iOS Release & Apple App Store Connect Guide

### A. iOS Release Build Settings & Provisioning
1. Set up your **Apple Developer Account** (`developer.apple.com`).
2. Generate an **iOS Distribution Certificate** and **App Store Provisioning Profile** tied to bundle ID `com.vital30.app`.
3. Open `ios/Runner.xcworkspace` in Xcode:
   * Select **Runner** -> **Signing & Capabilities**.
   * Enable **Automatically manage signing** or select your explicit App Store profile.
   * Verify **Deployment Target** is set to iOS 13.0 or higher.
4. Run `flutter build ipa --release -t lib/main_production.dart`. Open the generated bundle in Xcode Organizer and click **Distribute App** to upload to App Store Connect.

### B. App Store Connect Setup Steps
1. **App Metadata**:
   * **Title**: Vital30
   * **Subtitle**: 30-Day Wellness Habit Tracker (must not contain keywords that violate guidelines).
   * **Privacy Policy URL**: Link to a public host displaying the exact text of `docs/privacy-policy.md` (e.g., `https://challenge.charangudla.com/privacy`).
2. **Age Rating**:
   * Vital30 has no objectionable content, but because it tracks personal health habits and general fitness, select **4+**.
3. **App Privacy (Data Collection)**:
   * Disclose that the app collects **Contact Info** (Email, Name) and **Usage Data** (habits, check-ins) linked to the user's identity.

---

## ⚠️ Common App Store Rejection Risks for Wellness Apps

Wellness and habit-tracking apps face close scrutiny from Apple and Google review teams. Avoid these common pitfalls to ensure a smooth approval process:

### 1. Inaccurate Medical Claims (Critical)
> [!CAUTION]
> **MEDICAL DEVICE REJECTION RISK**: If your app store description, screenshots, or in-app text implies that Vital30 diagnoses, treats, prevents, or cures medical conditions (e.g., diabetes, hypertension, clinical depression, alcoholism withdrawal), it will be **REJECTED** under Apple Guideline 1.4.1 (Physical Harm) or Google's Health App Policies.
* **Mitigation**: Strictly define challenges around habit-building (e.g., "Drink water," "Walk 10,000 steps," "Write a gratitude log"). Always display the general medical disclaimer visible on the Challenge Detail view and Profile Screen.

### 2. Lack of Public Privacy Policy & Deletion Link
> [!WARNING]
> Both Apple (Guideline 5.1.1) and Google require a publicly accessible Privacy Policy URL. They also require an in-app option or web link allowing users to request complete account deletion.
* **Mitigation**: Publish the content of `docs/privacy-policy.md` to `https://challenge.charangudla.com/privacy` and support an "Account Deletion" option in the profile settings that deletes user records from PostgreSQL database.

### 3. Missing Test Accounts for App Reviewers
> [!IMPORTANT]
> If reviewers cannot log in to inspect the main app features because your sign-up or login requires an active server or invitation, the build will be rejected.
* **Mitigation**: Provide a pre-configured, valid test account (e.g., username: `tester@challenge.charangudla.com` / password: `Password123!`) in the App Store Connect and Google Play Console App Access Credentials fields.

---

## 📸 Required App Store Screenshot Specifications

You must supply high-quality marketing screenshots demonstrating active app features (Login, Challenge list, Progress chart, Check-in calendar).

### Apple App Store
* **6.5-inch iPhone** (iPhone 11 Pro Max/12 Pro Max/13 Pro Max/14 Pro Max): `1284 x 2778` or `1242 x 2688` px.
* **5.5-inch iPhone** (iPhone 8 Plus): `1242 x 2208` px.
* **12.9-inch iPad** (for universal apps): `2048 x 2732` px.

### Google Play Store
* Minimum **2 screenshots** for Phone, Tablet (7-inch and 10-inch).
* Max aspect ratio: `2:1` or `1:2`.
* Resolution: Between `320 x 320` and `3840 x 3840` px. Recommended format: PNG or JPEG.
