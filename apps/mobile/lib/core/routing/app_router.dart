import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/presentation/auth_provider.dart';
import '../../features/auth/presentation/welcome_screen.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
import '../../features/challenges/presentation/challenge_detail_screen.dart';
import '../../features/my_challenges/presentation/progress_screen.dart';
import '../../features/checkins/presentation/daily_checkin_screen.dart';
import '../../features/profile/presentation/health_disclaimer_screen.dart';
import 'main_navigation_shell.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/welcome',
    redirect: (context, state) {
      final isAuthScreen = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register' ||
          state.matchedLocation == '/welcome';

      // Keep showing checking/welcome during boot token check
      if (authState.status == AuthStatus.initial) {
        return null;
      }

      if (authState.status == AuthStatus.authenticated) {
        if (isAuthScreen) {
          return '/';
        }
        return null;
      }

      // Unauthenticated -> block protected screens
      if (!isAuthScreen) {
        return '/welcome';
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/welcome',
        builder: (context, state) => const WelcomeScreen(),
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
        path: '/',
        builder: (context, state) => const MainNavigationShell(),
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
        path: '/progress/:userChallengeId',
        builder: (context, state) {
          final id = state.pathParameters['userChallengeId'] ?? '';
          return ProgressScreen(userChallengeId: id);
        },
      ),
      GoRoute(
        path: '/health-disclaimer',
        builder: (context, state) => const HealthDisclaimerScreen(),
      ),
    ],
  );
});
