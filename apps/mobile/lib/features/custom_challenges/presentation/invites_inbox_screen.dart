import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_service.dart';
import '../../../core/network/models.dart';
import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_spacing.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/widgets/v_icon_button.dart';

final myInvitesProvider =
    FutureProvider<List<IncomingInvite>>((ref) async {
  return ref.read(apiServiceProvider).getMyInvites();
});

class InvitesInboxScreen extends ConsumerStatefulWidget {
  const InvitesInboxScreen({super.key});
  @override
  ConsumerState<InvitesInboxScreen> createState() =>
      _InvitesInboxScreenState();
}

class _InvitesInboxScreenState extends ConsumerState<InvitesInboxScreen> {
  String? _busyId;

  Future<void> _respond(IncomingInvite inv, String decision) async {
    if (_busyId != null) return;
    setState(() => _busyId = inv.id);
    try {
      final ucId =
          await ref.read(apiServiceProvider).respondToInvite(inv.id, decision);
      if (!mounted) return;
      if (decision == 'ACCEPTED' && ucId != null) {
        context.go('/checkin/$ucId');
        return;
      }
      ref.invalidate(myInvitesProvider);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not respond: $e')),
      );
    } finally {
      if (mounted) setState(() => _busyId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final list = ref.watch(myInvitesProvider);
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: Row(
                children: [
                  VIconButton(
                    icon: Icons.arrow_back_ios_new,
                    iconSize: 16,
                    onPressed: () => context.pop(),
                  ),
                  const SizedBox(width: 14),
                  Text('Challenge invites',
                      style: Vital30Text.h3.copyWith(fontSize: 16)),
                ],
              ),
            ),
            Expanded(
              child: list.when(
                loading: () =>
                    const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Text('Could not load: $e',
                        style: Vital30Text.body,
                        textAlign: TextAlign.center),
                  ),
                ),
                data: (items) {
                  if (items.isEmpty) {
                    return Center(
                      child: Padding(
                        padding: const EdgeInsets.all(32),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.mail_outline,
                                size: 48, color: Vital30Colors.inkSoft),
                            const SizedBox(height: 12),
                            Text('No invites yet', style: Vital30Text.h3),
                            const SizedBox(height: 6),
                            Text(
                              'When a friend invites you to a custom challenge, it will appear here.',
                              style: Vital30Text.body,
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                    );
                  }
                  return RefreshIndicator(
                    onRefresh: () => ref.refresh(myInvitesProvider.future),
                    child: ListView.separated(
                      padding: const EdgeInsets.fromLTRB(
                          Vital30Space.screenH, 16, Vital30Space.screenH, 32),
                      itemCount: items.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (_, i) => _InviteCard(
                        invite: items[i],
                        busy: _busyId == items[i].id,
                        onAccept: () => _respond(items[i], 'ACCEPTED'),
                        onDecline: () => _respond(items[i], 'DECLINED'),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InviteCard extends StatelessWidget {
  const _InviteCard({
    required this.invite,
    required this.busy,
    required this.onAccept,
    required this.onDecline,
  });
  final IncomingInvite invite;
  final bool busy;
  final VoidCallback onAccept;
  final VoidCallback onDecline;

  @override
  Widget build(BuildContext context) {
    final pending = invite.isPending;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: pending ? Vital30Colors.primaryTint : Vital30Colors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
            color: pending
                ? Vital30Colors.primarySoft
                : Vital30Colors.hairlineSoft),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('${invite.invitedByName} invited you',
              style: Vital30Text.label.copyWith(
                color: Vital30Colors.primaryDeep,
                fontSize: 11.5,
              )),
          const SizedBox(height: 4),
          Text(invite.challengeTitle,
              style: Vital30Text.title.copyWith(fontSize: 15)),
          const SizedBox(height: 4),
          Text(invite.challengeShortDescription,
              style: Vital30Text.body.copyWith(fontSize: 13)),
          const SizedBox(height: 6),
          Text(
            '${invite.challengeDurationDays} days · daily task: ${invite.challengeDailyTask}',
            style: Vital30Text.caption.copyWith(fontSize: 12),
          ),
          const SizedBox(height: 12),
          if (pending)
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: busy ? null : onAccept,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Vital30Colors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(999),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: Text(busy ? 'Joining…' : 'Accept & join'),
                  ),
                ),
                const SizedBox(width: 8),
                OutlinedButton(
                  onPressed: busy ? null : onDecline,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Vital30Colors.inkSoft,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(999),
                    ),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 12),
                  ),
                  child: const Text('Decline'),
                ),
              ],
            )
          else
            Text(
              invite.status == 'ACCEPTED' ? 'Accepted.' : 'Declined.',
              style: Vital30Text.caption.copyWith(
                fontWeight: FontWeight.w700,
                color: invite.status == 'ACCEPTED'
                    ? Vital30Colors.primary
                    : Vital30Colors.inkSoft,
              ),
            ),
        ],
      ),
    );
  }
}
