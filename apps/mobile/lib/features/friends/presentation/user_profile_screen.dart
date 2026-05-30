import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/network/api_service.dart';
import '../../../core/network/models.dart';
import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_spacing.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/widgets/v_button.dart';
import '../../../core/widgets/v_icon_button.dart';
import '../application/friends_provider.dart';

/// Full profile surface for a Vital30 user — addressable at /users/:id.
///
///   Friend view  →  stats row, active + completed challenges with progress
///                   bars, shared-with-you list, badges earned, and
///                   Unfriend / Block actions at the bottom.
///   Non-friend   →  minimal preview (name + join date + active/completed
///                   counts) + an Add-friend CTA, plus a hint about what
///                   unlocks once they accept.
///   Self view    →  full data (everyone counts as their own friend on the
///                   server) + an Edit-profile link.
///
/// The friend gate is enforced server-side: the friend-tier lists arrive
/// only when [UserProfile.isFriend] is true, so a tampered client can't
/// surface anything the API didn't choose to send.
class UserProfileScreen extends ConsumerStatefulWidget {
  const UserProfileScreen({super.key, required this.userId});

  final String userId;

  @override
  ConsumerState<UserProfileScreen> createState() => _UserProfileScreenState();
}

class _UserProfileScreenState extends ConsumerState<UserProfileScreen> {
  /// True while a friend mutation is in flight — disables the action
  /// buttons so a double-tap can't fire two requests.
  bool _busy = false;
  String? _actionError;

  String get _userId => widget.userId;

  /// Re-fetch the profile and wait for it to settle, so the buttons stay
  /// disabled until the screen reflects the new relationship.
  Future<void> _reload() async {
    ref.invalidate(userProfileProvider(_userId));
    await ref.read(userProfileProvider(_userId).future);
  }

  Future<void> _addFriend(UserProfile profile) async {
    if (_busy) return;
    setState(() {
      _busy = true;
      _actionError = null;
    });
    try {
      await ref.read(apiServiceProvider).sendFriendRequest(profile.id);
      // The request may auto-accept (if they'd already requested us), so
      // refresh the friends graph + badge alongside this profile.
      ref.invalidate(friendsProvider);
      ref.invalidate(incomingFriendCountProvider);
      await _reload();
    } catch (e) {
      if (mounted) setState(() => _actionError = _friendlyError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _unfriend(UserProfile profile) async {
    if (_busy) return;
    final ok = await _confirm(
      'Remove friend',
      'Remove ${profile.name} from your friends?',
      'Remove',
    );
    if (!ok) return;
    setState(() {
      _busy = true;
      _actionError = null;
    });
    try {
      // This surface doesn't carry the friendshipId — the friends list is
      // the authoritative source, so fetch it and match by user id.
      final friends = await ref.read(apiServiceProvider).getFriends();
      FriendSummary? match;
      for (final f in friends.accepted) {
        if (f.user.id == profile.id) {
          match = f;
          break;
        }
      }
      if (match == null) {
        if (mounted) {
          setState(() => _actionError = "This friendship wasn't found.");
        }
        return;
      }
      await ref.read(apiServiceProvider).unfriend(match.friendshipId);
      ref.invalidate(friendsProvider);
      await _reload();
    } catch (e) {
      if (mounted) setState(() => _actionError = _friendlyError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _block(UserProfile profile) async {
    if (_busy) return;
    final ok = await _confirm(
      'Block ${profile.name}',
      "They won't be able to send you friend requests.",
      'Block',
    );
    if (!ok) return;
    setState(() {
      _busy = true;
      _actionError = null;
    });
    try {
      await ref.read(apiServiceProvider).blockUser(profile.id);
      ref.invalidate(friendsProvider);
      ref.invalidate(incomingFriendCountProvider);
      if (!mounted) return;
      // Blocking removes any relationship — drop back to the list rather
      // than sit on a now-stale profile.
      if (context.canPop()) {
        context.pop();
      } else {
        context.go('/friends');
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _actionError = _friendlyError(e);
          _busy = false;
        });
      }
    }
  }

  Future<bool> _confirm(String title, String message, String confirmLabel) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title, style: Vital30Text.h3),
        content: Text(message, style: Vital30Text.body),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text('Cancel',
                style: Vital30Text.body.copyWith(color: Vital30Colors.muted)),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(confirmLabel,
                style: Vital30Text.body.copyWith(
                  color: Vital30Colors.berry,
                  fontWeight: FontWeight.w800,
                )),
          ),
        ],
      ),
    );
    return ok ?? false;
  }

  void _goBack() {
    if (context.canPop()) {
      context.pop();
    } else {
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(userProfileProvider(_userId));

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
                    onPressed: _goBack,
                  ),
                  const SizedBox(width: 14),
                  Text('Profile', style: Vital30Text.h3.copyWith(fontSize: 16)),
                ],
              ),
            ),
            Expanded(
              child: async.when(
                loading: () => const Center(
                  child: CircularProgressIndicator(color: Vital30Colors.primary),
                ),
                error: (e, _) => _ErrorState(
                  message: _friendlyError(e),
                  onBack: _goBack,
                ),
                data: (profile) => RefreshIndicator(
                  color: Vital30Colors.primary,
                  onRefresh: _reload,
                  child: _content(profile),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _content(UserProfile profile) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(
          Vital30Space.screenH, 12, Vital30Space.screenH, 40),
      children: [
        _HeaderCard(profile: profile),
        const SizedBox(height: 14),
        _StatsRow(profile: profile),
        if (_actionError != null) ...[
          const SizedBox(height: 14),
          _ErrorBanner(message: _actionError!),
        ],
        if (!profile.isFriend) ...[
          const SizedBox(height: 18),
          _AddFriendCard(
            name: _firstName(profile.name),
            busy: _busy,
            onAdd: () => _addFriend(profile),
          ),
        ],
        if (profile.isFriend) ...[
          _ActiveChallengesSection(items: profile.activeChallenges ?? const []),
          _SharedChallengesSection(items: profile.sharedChallenges ?? const []),
          _CompletedChallengesSection(
              items: profile.completedChallenges ?? const []),
          _AchievementsSection(items: profile.achievements ?? const []),
        ],
        if (profile.isFriend && !profile.isSelf) ...[
          const SizedBox(height: 32),
          _ManageFooter(
            firstName: _firstName(profile.name),
            busy: _busy,
            onBlock: () => _block(profile),
            onUnfriend: () => _unfriend(profile),
          ),
        ],
        if (profile.isSelf) ...[
          const SizedBox(height: 32),
          const _SelfFooter(),
        ],
      ],
    );
  }
}

// ===========================================================================
// Header + stats
// ===========================================================================

class _HeaderCard extends StatelessWidget {
  const _HeaderCard({required this.profile});
  final UserProfile profile;

  @override
  Widget build(BuildContext context) {
    final showFriendPill = profile.isFriend && !profile.isSelf;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Vital30Colors.card,
        borderRadius: BorderRadius.circular(Vital30Radius.lg),
        border: Border.all(color: Vital30Colors.hairlineSoft),
      ),
      child: Row(
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: const BoxDecoration(
              color: Vital30Colors.primaryDeep,
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Text(
              _initials(profile.name),
              style: const TextStyle(
                color: Vital30Colors.onPrimary,
                fontSize: 24,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(profile.name, style: Vital30Text.h2.copyWith(fontSize: 22)),
                const SizedBox(height: 3),
                Text('Vital30 member since ${_formatMonth(profile.joinedAt)}',
                    style: Vital30Text.caption),
                if (showFriendPill) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Vital30Colors.primaryTint,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      '✓ Friends',
                      style: Vital30Text.label.copyWith(
                        color: Vital30Colors.primaryDeep,
                        letterSpacing: 0.2,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  const _StatsRow({required this.profile});
  final UserProfile profile;

  @override
  Widget build(BuildContext context) {
    final tiles = <Widget>[
      _StatTile(label: 'Active', value: profile.activeChallengeCount),
      _StatTile(label: 'Completed', value: profile.completedChallengeCount),
      if (profile.isFriend)
        _StatTile(label: 'Shared', value: profile.sharedChallengeCount ?? 0),
      if (profile.isFriend)
        _StatTile(label: 'Badges', value: profile.achievementsCount ?? 0),
    ];

    // Two tiles per row — 2-up for the preview tier, 2×2 for friends.
    final rows = <Widget>[];
    for (var i = 0; i < tiles.length; i += 2) {
      rows.add(Padding(
        padding: EdgeInsets.only(top: i == 0 ? 0 : 10),
        child: Row(
          children: [
            Expanded(child: tiles[i]),
            const SizedBox(width: 10),
            Expanded(
              child: i + 1 < tiles.length ? tiles[i + 1] : const SizedBox(),
            ),
          ],
        ),
      ));
    }
    return Column(children: rows);
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({required this.label, required this.value});
  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
        color: Vital30Colors.card,
        borderRadius: BorderRadius.circular(Vital30Radius.lg),
        border: Border.all(color: Vital30Colors.hairlineSoft),
      ),
      child: Column(
        children: [
          Text(label.toUpperCase(),
              style: Vital30Text.label.copyWith(fontSize: 10)),
          const SizedBox(height: 4),
          Text(
            '$value',
            style: GoogleFonts.jetBrainsMono(
              fontSize: 22,
              fontWeight: FontWeight.w600,
              letterSpacing: -1,
              color: Vital30Colors.ink,
            ),
          ),
        ],
      ),
    );
  }
}

// ===========================================================================
// Non-friend CTA
// ===========================================================================

class _AddFriendCard extends StatelessWidget {
  const _AddFriendCard({
    required this.name,
    required this.busy,
    required this.onAdd,
  });
  final String name;
  final bool busy;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Vital30Colors.surfaceAlt,
        borderRadius: BorderRadius.circular(Vital30Radius.lg),
        border: Border.all(color: Vital30Colors.hairline),
      ),
      child: Column(
        children: [
          Text(
            "Want to see $name's challenges and badges?",
            style: Vital30Text.bodyStrong,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          Text(
            'Send a friend request — once they accept, you’ll see what '
            'they’re working on and the achievements they’ve earned.',
            style: Vital30Text.caption,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          VButton(
            label: busy ? 'Adding…' : 'Add friend',
            icon: Icons.person_add_alt_1,
            size: VButtonSize.md,
            onPressed: busy ? null : onAdd,
          ),
        ],
      ),
    );
  }
}

// ===========================================================================
// Friend-only sections
// ===========================================================================

class _ActiveChallengesSection extends StatelessWidget {
  const _ActiveChallengesSection({required this.items});
  final List<ProfileChallengeSummary> items;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionHeader(title: 'Active challenges', count: items.length),
        if (items.isEmpty)
          const _EmptyHint('Nothing in progress right now.')
        else
          for (final c in items) ...[
            const SizedBox(height: 10),
            _ChallengeProgressCard(summary: c),
          ],
      ],
    );
  }
}

class _SharedChallengesSection extends StatelessWidget {
  const _SharedChallengesSection({required this.items});
  final List<SharedChallenge> items;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionHeader(
          title: 'Challenges you share',
          count: items.length,
          hint: "You're both on these",
        ),
        if (items.isEmpty)
          const _EmptyHint('Nothing in common yet — join one together.')
        else
          for (final c in items) ...[
            const SizedBox(height: 8),
            _RowCard(
              leading: '✓',
              title: c.title,
            ),
          ],
      ],
    );
  }
}

class _CompletedChallengesSection extends StatelessWidget {
  const _CompletedChallengesSection({required this.items});
  final List<ProfileChallengeSummary> items;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionHeader(title: 'Completed challenges', count: items.length),
        if (items.isEmpty)
          const _EmptyHint('No finished challenges yet.')
        else
          for (final c in items) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Vital30Colors.card,
                borderRadius: BorderRadius.circular(Vital30Radius.md),
                border: Border.all(color: Vital30Colors.hairlineSoft),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(c.title, style: Vital30Text.title.copyWith(fontSize: 14)),
                  const SizedBox(height: 2),
                  Text('Finished ${_formatMonth(c.endDate ?? c.startDate)}',
                      style: Vital30Text.caption.copyWith(fontSize: 12)),
                ],
              ),
            ),
          ],
      ],
    );
  }
}

class _AchievementsSection extends StatelessWidget {
  const _AchievementsSection({required this.items});
  final List<ProfileAchievement> items;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionHeader(title: 'Achievements earned', count: items.length),
        if (items.isEmpty)
          const _EmptyHint("No badges yet — they're just getting started.")
        else
          Padding(
            padding: const EdgeInsets.only(top: 10),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final a in items) _AchievementChip(achievement: a),
              ],
            ),
          ),
      ],
    );
  }
}

// ===========================================================================
// Footers
// ===========================================================================

class _ManageFooter extends StatelessWidget {
  const _ManageFooter({
    required this.firstName,
    required this.busy,
    required this.onBlock,
    required this.onUnfriend,
  });
  final String firstName;
  final bool busy;
  final VoidCallback onBlock;
  final VoidCallback onUnfriend;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Divider(height: 1, color: Vital30Colors.hairline),
        const SizedBox(height: 16),
        Text('Manage your relationship with $firstName',
            style: Vital30Text.caption),
        const SizedBox(height: 12),
        Row(
          children: [
            VButton(
              label: 'Block',
              kind: VButtonKind.danger,
              size: VButtonSize.sm,
              onPressed: busy ? null : onBlock,
            ),
            const SizedBox(width: 10),
            VButton(
              label: 'Unfriend',
              kind: VButtonKind.secondary,
              size: VButtonSize.sm,
              onPressed: busy ? null : onUnfriend,
            ),
          ],
        ),
      ],
    );
  }
}

class _SelfFooter extends StatelessWidget {
  const _SelfFooter();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const Divider(height: 1, color: Vital30Colors.hairline),
        const SizedBox(height: 16),
        Text('This is how your profile looks to friends.',
            style: Vital30Text.caption, textAlign: TextAlign.center),
        const SizedBox(height: 12),
        VButton(
          label: 'Edit your profile',
          kind: VButtonKind.secondary,
          size: VButtonSize.md,
          onPressed: () => context.push('/edit-profile'),
        ),
      ],
    );
  }
}

// ===========================================================================
// Shared pieces
// ===========================================================================

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.count, this.hint});
  final String title;
  final int count;
  final String? hint;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 24, bottom: 2),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: RichText(
              text: TextSpan(
                style: Vital30Text.h3.copyWith(fontSize: 16),
                children: [
                  TextSpan(text: title),
                  TextSpan(
                    text: '  · $count',
                    style: Vital30Text.caption.copyWith(fontSize: 13),
                  ),
                ],
              ),
            ),
          ),
          if (hint != null)
            Text(hint!, style: Vital30Text.caption.copyWith(fontSize: 11)),
        ],
      ),
    );
  }
}

class _RowCard extends StatelessWidget {
  const _RowCard({required this.leading, required this.title});
  final String leading;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Vital30Colors.card,
        borderRadius: BorderRadius.circular(Vital30Radius.md),
        border: Border.all(color: Vital30Colors.hairlineSoft),
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: Vital30Colors.primaryTint,
              borderRadius: BorderRadius.circular(8),
            ),
            alignment: Alignment.center,
            child: Text(leading,
                style: const TextStyle(
                  color: Vital30Colors.primaryDeep,
                  fontWeight: FontWeight.w800,
                )),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(title, style: Vital30Text.title.copyWith(fontSize: 14)),
          ),
        ],
      ),
    );
  }
}

class _ChallengeProgressCard extends StatelessWidget {
  const _ChallengeProgressCard({required this.summary});
  final ProfileChallengeSummary summary;

  @override
  Widget build(BuildContext context) {
    final day = _dayNumber(summary.startDate, summary.durationDays);
    final pct = summary.progressPercent.clamp(0, 100).toDouble();
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Vital30Colors.card,
        borderRadius: BorderRadius.circular(Vital30Radius.lg),
        border: Border.all(color: Vital30Colors.hairlineSoft),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('DAY $day OF ${summary.durationDays}',
              style: Vital30Text.label.copyWith(color: Vital30Colors.primaryDeep)),
          const SizedBox(height: 4),
          Text(summary.title,
              style: Vital30Text.title.copyWith(fontSize: 15),
              maxLines: 1,
              overflow: TextOverflow.ellipsis),
          const SizedBox(height: 12),
          SizedBox(
            height: 8,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(999),
              child: Stack(
                children: [
                  Positioned.fill(
                    child: Container(color: Vital30Colors.surfaceAlt),
                  ),
                  FractionallySizedBox(
                    alignment: Alignment.centerLeft,
                    widthFactor: (pct / 100).clamp(0.0, 1.0),
                    child: Container(color: Vital30Colors.primary),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 6),
          Text('${pct.round()}% complete',
              style: Vital30Text.caption.copyWith(fontSize: 12)),
        ],
      ),
    );
  }
}

class _AchievementChip extends StatelessWidget {
  const _AchievementChip({required this.achievement});
  final ProfileAchievement achievement;

  /// Friendly labels per kind. An unknown kind falls through to its raw
  /// enum string — visible but unstyled, which is the "we forgot to map
  /// this" signal we want.
  static const _labels = <String, ({String label, String glyph})>{
    'FIRST_CHECKIN': (label: 'First check-in', glyph: '✓'),
    'SEVEN_DAY_STREAK': (label: '7-day streak', glyph: '🔥'),
    'TWENTY_ONE_DAY_STREAK': (label: '21-day streak', glyph: '💪'),
    'CHALLENGE_COMPLETED': (label: 'Challenge complete', glyph: '🏆'),
    'THREE_CHALLENGES_COMPLETED': (label: '3 challenges done', glyph: '⭐'),
  };

  @override
  Widget build(BuildContext context) {
    final meta = _labels[achievement.kind] ??
        (label: achievement.kind, glyph: '✦');
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Vital30Colors.accentTint,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(meta.glyph, style: const TextStyle(fontSize: 13)),
          const SizedBox(width: 6),
          Text(meta.label,
              style: Vital30Text.caption.copyWith(
                color: Vital30Colors.accentDeep,
                fontWeight: FontWeight.w700,
                fontSize: 12.5,
              )),
        ],
      ),
    );
  }
}

class _EmptyHint extends StatelessWidget {
  const _EmptyHint(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Vital30Colors.surfaceAlt,
        borderRadius: BorderRadius.circular(Vital30Radius.md),
        border: Border.all(color: Vital30Colors.hairline),
      ),
      child: Text(text, style: Vital30Text.caption.copyWith(fontSize: 12)),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Vital30Colors.berryTint,
        borderRadius: BorderRadius.circular(Vital30Radius.md),
      ),
      child: Text(message,
          style: Vital30Text.body
              .copyWith(fontSize: 13, color: Vital30Colors.berryDeep)),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onBack});
  final String message;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.person_off_outlined,
                size: 48, color: Vital30Colors.inkSoft),
            const SizedBox(height: 12),
            Text(message, style: Vital30Text.body, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            TextButton(onPressed: onBack, child: const Text('Go back')),
          ],
        ),
      ),
    );
  }
}

// ===========================================================================
// Helpers
// ===========================================================================

String _friendlyError(Object e) {
  if (e is DioException) {
    final code = e.response?.statusCode;
    if (code == 401) return 'Your session expired. Please sign in again.';
    if (code == 403) return "You don't have access to this profile.";
    if (code == 404) {
      return 'Profile not found — the user may have deleted their account.';
    }
    if (code != null && code >= 500) {
      return 'The server hit an error. Try again shortly.';
    }
  }
  return 'Something went wrong. Please try again.';
}

String _initials(String name) {
  final parts = name.trim().split(RegExp(r'\s+'));
  if (parts.isEmpty || parts.first.isEmpty) return '·';
  if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
  return (parts.first.substring(0, 1) + parts.last.substring(0, 1))
      .toUpperCase();
}

String _firstName(String name) {
  final parts = name.trim().split(RegExp(r'\s+'));
  if (parts.isEmpty || parts.first.isEmpty) return 'they';
  return parts.first;
}

String _formatMonth(DateTime d) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June', //
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  final local = d.toLocal();
  return '${months[local.month - 1]} ${local.year}';
}

int _dayNumber(DateTime start, int totalDays) {
  final diff = DateTime.now().difference(start.toLocal()).inDays;
  final day = diff + 1;
  if (day < 1) return 1;
  if (day > totalDays) return totalDays;
  return day;
}
