import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/challenges/presentation/challenges_screen.dart';
import '../../features/home/presentation/home_screen.dart';
import '../../features/my_challenges/presentation/my_challenges_screen.dart';
import '../../features/profile/presentation/profile_screen.dart';
import '../widgets/v_tab_bar.dart';

final mainNavigationTabProvider = StateProvider<int>((ref) => 0);

const _tabs = <VTabItem>[
  VTabItem(icon: Icons.home_outlined, label: 'Home', route: '/home'),
  VTabItem(
      icon: Icons.grid_view_outlined,
      label: 'Challenges',
      route: '/challenges'),
  VTabItem(
      icon: Icons.bar_chart_outlined, label: 'Progress', route: '/progress'),
  VTabItem(icon: Icons.person_outline, label: 'Profile', route: '/profile'),
];

class MainNavigationShell extends ConsumerWidget {
  const MainNavigationShell({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activeTab = ref.watch(mainNavigationTabProvider);

    const screens = <Widget>[
      HomeScreen(),
      ChallengesScreen(),
      MyChallengesScreen(),
      ProfileScreen(),
    ];

    return Scaffold(
      extendBody: true,
      body: IndexedStack(index: activeTab, children: screens),
      bottomNavigationBar: VTabBar(
        items: _tabs,
        currentIndex: activeTab,
        onTap: (index) =>
            ref.read(mainNavigationTabProvider.notifier).state = index,
      ),
    );
  }
}
