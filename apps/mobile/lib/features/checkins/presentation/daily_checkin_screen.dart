import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../challenges/presentation/challenges_provider.dart';
import '../../my_challenges/presentation/my_challenges_provider.dart';
import '../../../core/network/mock_data.dart';

class DailyCheckinScreen extends ConsumerStatefulWidget {
  const DailyCheckinScreen({
    super.key,
    required this.userChallengeId,
  });

  final String userChallengeId;

  @override
  ConsumerState<DailyCheckinScreen> createState() => _DailyCheckinScreenState();
}

class _DailyCheckinScreenState extends ConsumerState<DailyCheckinScreen> {
  final _notesController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _handleCheckin(String status) async {
    setState(() {
      _isSubmitting = true;
    });

    final notes = _notesController.text.trim();
    final success = await ref
        .read(myChallengesNotifierProvider.notifier)
        .checkin(widget.userChallengeId, status, notes.isNotEmpty ? notes : null);

    if (mounted) {
      setState(() {
        _isSubmitting = false;
      });

      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Daily milestone logged as ${status.toLowerCase()}!'),
            backgroundColor: status == 'COMPLETED' ? const Color(0xFF10B981) : const Color(0xFF64748B),
            behavior: SnackBarBehavior.floating,
          ),
        );
        context.pop();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to save daily check-in. please try again.'),
            backgroundColor: Color(0xFFEF4444),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final myChallengesAsync = ref.watch(myChallengesNotifierProvider);
    final challengesAsync = ref.watch(challengesProvider);

    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Daily Habit Check-in'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.pop(),
        ),
      ),
      body: myChallengesAsync.when(
        data: (myChallenges) {
          final uc = myChallenges.firstWhere(
            (item) => item.id == widget.userChallengeId,
            orElse: () => UserChallenge(
              id: '',
              userId: '',
              challengeId: '',
              status: 'ACTIVE',
              startDate: DateTime.now(),
              progressPercent: 0.0,
            ),
          );

          if (uc.id.isEmpty) {
            return const Center(child: Text('Challenge progress logs not found.'));
          }

          final challenge = challengesAsync.maybeWhen(
            data: (chals) => chals.firstWhere((c) => c.id == uc.challengeId),
            orElse: () => const Challenge(
              id: '',
              title: 'Habit Blueprint',
              slug: 'unknown',
              shortDescription: '',
              description: '',
              durationDays: 30,
              difficulty: 'EASY',
              categoryId: '',
              dailyTask: '',
              benefits: [],
              safetyNote: '',
            ),
          );

          return SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top header card
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFE1E8E4)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        challenge.title,
                        style: textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w900,
                          color: const Color(0xFF12211B),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Day ${(uc.progressPercent / 100 * 30).toInt().clamp(1, 30)} of 30 Blueprint Milestone',
                        style: const TextStyle(
                          color: Color(0xFF8A9A92),
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 12),
                      const Divider(color: Color(0xFFE1E8E4)),
                      const SizedBox(height: 12),
                      const Text(
                        "Today's Guided Task:",
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF4D5D55),
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        challenge.dailyTask,
                        style: const TextStyle(
                          color: Color(0xFF1E293B),
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),

                // Central Question
                Center(
                  child: Text(
                    'Did you complete today’s task?',
                    style: textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w900,
                      color: const Color(0xFF12211B),
                      letterSpacing: -0.5,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 24),

                // Main checkin buttons
                if (_isSubmitting)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 20.0),
                      child: CircularProgressIndicator(color: Color(0xFF10B981)),
                    ),
                  )
                else ...[
                  // 1. Yes, Completed
                  FilledButton.icon(
                    onPressed: () => _handleCheckin('COMPLETED'),
                    icon: const Icon(Icons.check_circle_outline),
                    label: const Text('Yes, completed today'),
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      foregroundColor: Colors.white,
                      minimumSize: const Size.fromHeight(52),
                    ),
                  ),
                  const SizedBox(height: 12),

                  Row(
                    children: [
                      // 2. No, Missed
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _handleCheckin('MISSED'),
                          icon: const Icon(Icons.cancel_outlined, color: Color(0xFFEF4444)),
                          label: const Text('No, missed'),
                          style: OutlinedButton.styleFrom(
                            minimumSize: const Size.fromHeight(52),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                            side: const BorderSide(color: Color(0xFFFCA5A5)),
                            foregroundColor: const Color(0xFFB91C1C),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),

                      // 3. Skip Day
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _handleCheckin('SKIPPED'),
                          icon: const Icon(Icons.next_plan_outlined, color: Color(0xFFF59E0B)),
                          label: const Text('Skip day'),
                          style: OutlinedButton.styleFrom(
                            minimumSize: const Size.fromHeight(52),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                            side: const BorderSide(color: Color(0xFFFDE68A)),
                            foregroundColor: const Color(0xFFB45309),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 32),

                // Optional Journal Notes Box
                const Text(
                  'Journal Entry (Optional)',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1E293B),
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _notesController,
                  maxLines: 3,
                  decoration: InputDecoration(
                    hintText: 'Record physical sensations, hurdles overcome, or daily learnings...',
                    hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: const BorderSide(color: Color(0xFF10B981), width: 1.5),
                    ),
                    contentPadding: const EdgeInsets.all(16),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(color: Color(0xFF10B981)),
        ),
        error: (err, _) => Center(
          child: Text('Error loading daily task detail: $err'),
        ),
      ),
    );
  }
}
