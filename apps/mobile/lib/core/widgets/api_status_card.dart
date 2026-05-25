import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../constants/app_constants.dart';
import '../network/api_service.dart';
import '../network/models.dart' show HealthResponse;

final healthProvider = FutureProvider<HealthResponse>((ref) {
  return ref.watch(apiServiceProvider).getHealth();
});

class ApiStatusCard extends ConsumerWidget {
  const ApiStatusCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final health = ref.watch(healthProvider);
    final textTheme = Theme.of(context).textTheme;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: health.when(
          loading: () => _StatusContent(
            icon: Icons.sync,
            color: Colors.blueGrey,
            title: 'Backend API: checking',
            subtitle: AppConstants.apiBaseUrl,
          ),
          error: (_, __) => _StatusContent(
            icon: Icons.error_outline,
            color: Colors.redAccent,
            title: 'Backend API: not connected',
            subtitle: AppConstants.apiBaseUrl,
          ),
          data: (data) => Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _StatusContent(
                icon: Icons.check_circle_outline,
                color: const Color(0xFF0F8B65),
                title: 'Backend API: connected',
                subtitle: data.service,
              ),
              const SizedBox(height: 12),
              Text(
                data.timestamp,
                style: textTheme.bodySmall?.copyWith(
                  color: const Color(0xFF647067),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusContent extends StatelessWidget {
  const _StatusContent({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Row(
      children: [
        Icon(icon, color: color, size: 28),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: textTheme.bodySmall?.copyWith(
                  color: const Color(0xFF647067),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
