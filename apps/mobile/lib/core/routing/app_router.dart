import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/auth_provider.dart';
import '../../features/auth/presentation/forgot_password_screen.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/new_password_screen.dart';
import '../../features/auth/presentation/otp_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
import '../../features/auth/presentation/reset_success_screen.dart';
import '../../features/auth/presentation/welcome_screen.dart';
import '../../features/celebrations/presentation/challenge_complete_screen.dart';
import '../../features/celebrations/presentation/day_complete_screen.dart';
import '../../features/challenges/presentation/challenge_detail_screen.dart';
import '../../features/checkins/presentation/daily_checkin_screen.dart';
import '../../features/my_challenges/presentation/progress_screen.dart';
import '../../features/notifications/presentation/notifications_screen.dart';
import '../../features/onboarding/application/onboarding_provider.dart';
import '../../features/onboarding/presentation/onboarding_screen.dart';
import '../../features/profile/presentation/edit_profile_screen.dart';
import '../../features/profile/presentation/health_disclaimer_screen.dart';
import '../../features/profile/presentation/invite_friends_screen.dart';
import '../../features/profile/presentation/notification_settings_screen.dart';
import '../../features/profile/presentation/reminder_time_screen.dart';
import '../../features/splash/presentation/splash_screen.dart';
import 'main_navigation_shell.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);
  final onboardingSeen = ref.watch(onboardingProvider);

  const publicPaths = <String>{
    '/splash',
    '/welcome',
    '/onboarding',
    '/login',
    '/register',
    '/forgot-password',
    '/otp',
    '/new-password',
    '/reset-success',
  };

  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      final loc = state.matchedLocation;

      if (authState.status == AuthStatus.initial) {
        return loc == '/splash' ? null : '/splash';
      }

      final isPublic = publicPaths.contains(loc);

      if (authState.status == AuthStatus.authenticated) {
        if (loc == '/splash' || isPublic) return '/home';
        return null;
      }

      // Unauthenticated first-launch users see the onboarding carousel
      // before any auth surface.
      final landingPath = onboardingSeen ? '/welcome' : '/onboarding';
      if (loc == '/splash') return landingPath;
      if (!onboardingSeen && loc != '/onboarding') return '/onboarding';
      if (!isPublic) return landingPath;
      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/welcome',
        builder: (context, state) => const WelcomeScreen(),
      ),
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/otp',
        builder: (context, state) =>
            OtpScreen(email: state.uri.queryParameters['email']),
      ),
      GoRoute(
        path: '/new-password',
        builder: (context, state) => NewPasswordScreen(
          resetToken: state.uri.queryParameters['token'] ?? '',
        ),
      ),
      GoRoute(
        path: '/reset-success',
        builder: (context, state) => const ResetSuccessScreen(),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const MainNavigationShell(),
      ),
      GoRoute(
        path: '/challenges',
        redirect: (_, __) => '/home',
      ),
      GoRoute(
        path: '/progress',
        redirect: (_, __) => '/home',
      ),
      GoRoute(
        path: '/profile',
        redirect: (_, __) => '/home',
      ),
      GoRoute(
        path: '/challenge/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return ChallengeDetailScreen(challengeId: id);
        },
      ),
      GoRoute(
        path: '/checkin/:userChallengeId',
        builder: (context, state) {
          final id = state.pathParameters['userChallengeId'] ?? '';
          return DailyCheckinScreen(userChallengeId: id);
        },
      ),
      GoRoute(
        path: '/celebrate/:userChallengeId',
        builder: (context, state) {
          final id = state.pathParameters['userChallengeId'] ?? '';
          return DayCompleteScreen(userChallengeId: id);
        },
      ),
      GoRoute(
        path: '/complete/:userChallengeId',
        builder: (context, state) {
          final id = state.pathParameters['userChallengeId'] ?? '';
          return ChallengeCompleteScreen(userChallengeId: id);
        },
      ),
      GoRoute(
        path: '/progress/:userChallengeId',
        builder: (context, state) {
          final id = state.pathParameters['userChallengeId'] ?? '';
          return ProgressScreen(userChallengeId: id);
        },
      ),
      GoRoute(
        path: '/share/:userChallengeId',
        builder: (context, state) {
          final id = state.pathParameters['userChallengeId'] ?? '';
          return ProgressScreen(userChallengeId: id);
        },
      ),
      GoRoute(
        path: '/notifications',
        builder: (context, state) => const NotificationsScreen(),
      ),
      GoRoute(
        path: '/edit-profile',
        builder: (context, state) => const EditProfileScreen(),
      ),
      GoRoute(
        path: '/notification-settings',
        builder: (context, state) => const NotificationSettingsScreen(),
      ),
      GoRoute(
        path: '/reminder-time',
        builder: (context, state) => const ReminderTimeScreen(),
      ),
      GoRoute(
        path: '/invite',
        builder: (context, state) => const InviteFriendsScreen(),
      ),
      GoRoute(
        path: '/health-disclaimer',
        builder: (context, state) => const HealthDisclaimerScreen(),
      ),
    ],
  );
});
