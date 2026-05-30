import 'dart:convert';

import '../../features/auth/domain/user.dart';

class Category {
  const Category({
    required this.id,
    required this.name,
    required this.slug,
    required this.description,
    this.isActive = true,
  });

  final String id;
  final String name;
  final String slug;
  final String description;
  final bool isActive;

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id'] as String,
      name: json['name'] as String,
      slug: json['slug'] as String,
      description: json['description'] as String,
      isActive: json['isActive'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'slug': slug,
        'description': description,
        'isActive': isActive,
      };
}

class Challenge {
  const Challenge({
    required this.id,
    required this.title,
    required this.slug,
    required this.shortDescription,
    required this.description,
    required this.durationDays,
    required this.difficulty,
    required this.categoryId,
    required this.dailyTask,
    required this.benefits,
    required this.safetyNote,
    this.isPopular = false,
    this.isRecommended = false,
    this.isActive = true,
  });

  final String id;
  final String title;
  final String slug;
  final String shortDescription;
  final String description;
  final int durationDays;
  final String difficulty;
  final String categoryId;
  final String dailyTask;
  final List<String> benefits;
  final String safetyNote;
  final bool isPopular;
  final bool isRecommended;
  final bool isActive;

  factory Challenge.fromJson(Map<String, dynamic> json) {
    return Challenge(
      id: json['id'] as String,
      title: json['title'] as String,
      slug: json['slug'] as String,
      shortDescription: json['shortDescription'] as String,
      description: json['description'] as String,
      durationDays: json['durationDays'] as int? ?? 30,
      difficulty: json['difficulty'] as String? ?? 'EASY',
      categoryId: json['categoryId'] as String,
      dailyTask: json['dailyTask'] as String? ?? '',
      benefits: _parseBenefits(json['benefits']),
      safetyNote: json['safetyNote'] as String? ?? '',
      isPopular: json['isPopular'] as bool? ?? false,
      isRecommended: json['isRecommended'] as bool? ?? false,
      isActive: json['isActive'] as bool? ?? true,
    );
  }

  static List<String> _parseBenefits(Object? raw) {
    if (raw is List) {
      return raw.map((e) => e.toString()).toList();
    }
    if (raw is String) {
      try {
        return (jsonDecode(raw) as List).map((e) => e.toString()).toList();
      } catch (_) {}
    }
    return [];
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'slug': slug,
        'shortDescription': shortDescription,
        'description': description,
        'durationDays': durationDays,
        'difficulty': difficulty,
        'categoryId': categoryId,
        'dailyTask': dailyTask,
        'benefits': benefits,
        'safetyNote': safetyNote,
        'isPopular': isPopular,
        'isRecommended': isRecommended,
        'isActive': isActive,
      };
}

class UserChallenge {
  UserChallenge({
    required this.id,
    required this.userId,
    required this.challengeId,
    required this.status,
    required this.startDate,
    this.endDate,
    required this.progressPercent,
  });

  final String id;
  final String userId;
  final String challengeId;
  String status;
  final DateTime startDate;
  DateTime? endDate;
  double progressPercent;

  factory UserChallenge.fromJson(Map<String, dynamic> json) {
    return UserChallenge(
      id: json['id'] as String,
      userId: json['userId'] as String,
      challengeId: json['challengeId'] as String,
      status: json['status'] as String? ?? 'ACTIVE',
      startDate: DateTime.parse(json['startDate'] as String),
      endDate: json['endDate'] != null ? DateTime.parse(json['endDate'] as String) : null,
      progressPercent: (json['progressPercent'] as num? ?? 0.0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'userId': userId,
        'challengeId': challengeId,
        'status': status,
        'startDate': startDate.toIso8601String(),
        'endDate': endDate?.toIso8601String(),
        'progressPercent': progressPercent,
      };
}

class DailyCheckin {
  const DailyCheckin({
    required this.id,
    required this.userChallengeId,
    required this.checkinDate,
    required this.status,
    this.notes,
    required this.createdAt,
  });

  final String id;
  final String userChallengeId;
  final DateTime checkinDate;
  final String status;
  final String? notes;
  final DateTime createdAt;

  factory DailyCheckin.fromJson(Map<String, dynamic> json) {
    return DailyCheckin(
      id: json['id'] as String,
      userChallengeId: json['userChallengeId'] as String,
      checkinDate: DateTime.parse(json['checkinDate'] as String),
      status: json['status'] as String,
      notes: json['notes'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'userChallengeId': userChallengeId,
        'checkinDate': checkinDate.toIso8601String(),
        'status': status,
        'notes': notes,
        'createdAt': createdAt.toIso8601String(),
      };
}

class HealthResponse {
  const HealthResponse({
    required this.status,
    required this.service,
    required this.timestamp,
  });

  final String status;
  final String service;
  final String timestamp;

  factory HealthResponse.fromJson(Map<String, dynamic> json) {
    return HealthResponse(
      status: json['status'] as String? ?? 'unknown',
      service: json['service'] as String? ?? 'unknown',
      timestamp: json['timestamp'] as String? ?? '',
    );
  }
}

class AuthResponse {
  const AuthResponse({required this.token, required this.user});

  final String token;
  final User user;

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      token: json['token'] as String,
      user: User.fromJson(json['user'] as Map<String, dynamic>),
    );
  }
}

class AppNotification {
  const AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.createdAt,
    this.readAt,
    this.data,
  });

  final String id;
  final String type;
  final String title;
  final String body;
  final DateTime createdAt;
  final DateTime? readAt;
  final Map<String, dynamic>? data;

  bool get isUnread => readAt == null;

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] as String,
      type: json['type'] as String,
      title: json['title'] as String,
      body: json['body'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      readAt: json['readAt'] == null
          ? null
          : DateTime.parse(json['readAt'] as String),
      data: json['data'] as Map<String, dynamic>?,
    );
  }
}

class ReferralInfo {
  const ReferralInfo({
    required this.code,
    required this.referredCount,
    required this.shareText,
  });

  final String code;
  final int referredCount;
  final String shareText;

  factory ReferralInfo.fromJson(Map<String, dynamic> json) {
    return ReferralInfo(
      code: json['code'] as String,
      referredCount: json['referredCount'] as int? ?? 0,
      shareText: json['shareText'] as String? ?? '',
    );
  }
}

class FavoriteEntry {
  const FavoriteEntry({
    required this.id,
    required this.challengeId,
    required this.title,
    required this.shortDescription,
    required this.difficulty,
    required this.durationDays,
  });

  final String id;
  final String challengeId;
  final String title;
  final String shortDescription;
  final String difficulty;
  final int durationDays;

  factory FavoriteEntry.fromJson(Map<String, dynamic> json) {
    final challenge = json['challenge'] as Map<String, dynamic>? ?? {};
    return FavoriteEntry(
      id: json['id'] as String,
      challengeId: challenge['id'] as String? ?? json['challengeId'] as String,
      title: challenge['title'] as String? ?? '',
      shortDescription: challenge['shortDescription'] as String? ?? '',
      difficulty: challenge['difficulty'] as String? ?? 'EASY',
      durationDays: challenge['durationDays'] as int? ?? 30,
    );
  }
}

class CustomChallenge {
  const CustomChallenge({
    required this.id,
    required this.title,
    required this.shortDescription,
    required this.description,
    required this.dailyTask,
    required this.durationDays,
    required this.difficulty,
    required this.categoryId,
    required this.visibility,
    required this.inviteToken,
    required this.isActive,
    this.inviteCount = 0,
    this.joinedCount = 0,
  });

  final String id;
  final String title;
  final String shortDescription;
  final String description;
  final String dailyTask;
  final int durationDays;
  final String difficulty;
  final String categoryId;
  /// 'PRIVATE' | 'PUBLIC'
  final String visibility;
  final String? inviteToken;
  final bool isActive;
  final int inviteCount;
  final int joinedCount;

  factory CustomChallenge.fromJson(Map<String, dynamic> json) {
    return CustomChallenge(
      id: json['id'] as String,
      title: json['title'] as String,
      shortDescription: json['shortDescription'] as String? ?? '',
      description: json['description'] as String? ?? '',
      dailyTask: json['dailyTask'] as String? ?? '',
      durationDays: json['durationDays'] as int? ?? 30,
      difficulty: json['difficulty'] as String? ?? 'EASY',
      categoryId: json['categoryId'] as String? ?? '',
      visibility: json['visibility'] as String? ?? 'PRIVATE',
      inviteToken: json['inviteToken'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      inviteCount: json['inviteCount'] as int? ?? 0,
      joinedCount: json['joinedCount'] as int? ?? 0,
    );
  }
}

class IncomingInvite {
  const IncomingInvite({
    required this.id,
    required this.status,
    required this.invitedEmail,
    required this.invitedByName,
    required this.challengeId,
    required this.challengeTitle,
    required this.challengeShortDescription,
    required this.challengeDailyTask,
    required this.challengeDurationDays,
    this.challengeInviteToken,
    required this.createdAt,
  });

  final String id;
  /// 'PENDING' | 'ACCEPTED' | 'DECLINED'
  final String status;
  final String invitedEmail;
  final String invitedByName;
  final String challengeId;
  final String challengeTitle;
  final String challengeShortDescription;
  final String challengeDailyTask;
  final int challengeDurationDays;
  final String? challengeInviteToken;
  final DateTime createdAt;

  bool get isPending => status == 'PENDING';

  factory IncomingInvite.fromJson(Map<String, dynamic> json) {
    final challenge = json['challenge'] as Map<String, dynamic>? ?? {};
    final invitedBy = json['invitedBy'] as Map<String, dynamic>? ?? {};
    return IncomingInvite(
      id: json['id'] as String,
      status: json['status'] as String? ?? 'PENDING',
      invitedEmail: json['invitedEmail'] as String? ?? '',
      invitedByName: invitedBy['name'] as String? ?? 'A friend',
      challengeId: challenge['id'] as String? ?? '',
      challengeTitle: challenge['title'] as String? ?? '',
      challengeShortDescription:
          challenge['shortDescription'] as String? ?? '',
      challengeDailyTask: challenge['dailyTask'] as String? ?? '',
      challengeDurationDays: challenge['durationDays'] as int? ?? 30,
      challengeInviteToken: challenge['inviteToken'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}

class AchievementEntry {
  const AchievementEntry({
    required this.id,
    required this.kind,
    required this.earnedAt,
    this.data,
  });

  final String id;
  final String kind;
  final DateTime earnedAt;
  final Map<String, dynamic>? data;

  factory AchievementEntry.fromJson(Map<String, dynamic> json) {
    return AchievementEntry(
      id: json['id'] as String,
      kind: json['kind'] as String,
      earnedAt: DateTime.parse(json['earnedAt'] as String),
      data: json['data'] as Map<String, dynamic>?,
    );
  }
}

// ---------------------------------------------------------------------------
// Friends — the challenge-friends graph (parity with the web /friends page).
// ---------------------------------------------------------------------------

/// A minimal user reference embedded in friendship rows.
class FriendUser {
  const FriendUser({required this.id, required this.name});

  final String id;
  final String name;

  factory FriendUser.fromJson(Map<String, dynamic> json) {
    return FriendUser(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? 'Vital30 member',
    );
  }
}

/// One friendship row as the backend buckets it. `user` is always the
/// OTHER party — the API resolves who that is relative to the viewer, so
/// the client never has to compare ids.
class FriendSummary {
  const FriendSummary({
    required this.friendshipId,
    required this.user,
    required this.createdAt,
    this.respondedAt,
  });

  final String friendshipId;
  final FriendUser user;
  final DateTime createdAt;
  final DateTime? respondedAt;

  factory FriendSummary.fromJson(Map<String, dynamic> json) {
    return FriendSummary(
      friendshipId: json['friendshipId'] as String? ?? '',
      user: FriendUser.fromJson(
        json['user'] as Map<String, dynamic>? ?? const {},
      ),
      createdAt: DateTime.parse(json['createdAt'] as String),
      respondedAt: json['respondedAt'] == null
          ? null
          : DateTime.parse(json['respondedAt'] as String),
    );
  }
}

/// The full /friends payload split into its four buckets. `blocked`
/// defaults to empty so an older API build that predates the field still
/// renders the other three sections instead of crashing.
class FriendsList {
  const FriendsList({
    required this.accepted,
    required this.incoming,
    required this.outgoing,
    required this.blocked,
  });

  final List<FriendSummary> accepted;
  final List<FriendSummary> incoming;
  final List<FriendSummary> outgoing;
  final List<FriendSummary> blocked;

  bool get isEmpty =>
      accepted.isEmpty &&
      incoming.isEmpty &&
      outgoing.isEmpty &&
      blocked.isEmpty;

  static const empty = FriendsList(
    accepted: [],
    incoming: [],
    outgoing: [],
    blocked: [],
  );

  static List<FriendSummary> _bucket(dynamic raw) {
    return (raw as List<dynamic>? ?? const [])
        .map((j) => FriendSummary.fromJson(j as Map<String, dynamic>))
        .toList();
  }

  factory FriendsList.fromJson(Map<String, dynamic> json) {
    return FriendsList(
      accepted: _bucket(json['accepted']),
      incoming: _bucket(json['incoming']),
      outgoing: _bucket(json['outgoing']),
      blocked: _bucket(json['blocked']),
    );
  }
}

// ---------------------------------------------------------------------------
// User profile — the /users/:id surface (preview tier + friend-only tier).
// ---------------------------------------------------------------------------

/// A challenge summary on a friend's profile (active or completed).
class ProfileChallengeSummary {
  const ProfileChallengeSummary({
    required this.challengeId,
    required this.title,
    required this.durationDays,
    required this.startDate,
    this.endDate,
    required this.progressPercent,
  });

  final String challengeId;
  final String title;
  final int durationDays;
  final DateTime startDate;

  /// Set on COMPLETED challenges, null while ACTIVE.
  final DateTime? endDate;

  /// 0–100.
  final double progressPercent;

  factory ProfileChallengeSummary.fromJson(Map<String, dynamic> json) {
    return ProfileChallengeSummary(
      challengeId: json['challengeId'] as String? ?? '',
      title: json['title'] as String? ?? '',
      durationDays: json['durationDays'] as int? ?? 30,
      startDate: DateTime.parse(json['startDate'] as String),
      endDate: json['endDate'] == null
          ? null
          : DateTime.parse(json['endDate'] as String),
      progressPercent: (json['progressPercent'] as num?)?.toDouble() ?? 0,
    );
  }
}

/// A challenge both the viewer and the target are on.
class SharedChallenge {
  const SharedChallenge({required this.challengeId, required this.title});

  final String challengeId;
  final String title;

  factory SharedChallenge.fromJson(Map<String, dynamic> json) {
    return SharedChallenge(
      challengeId: json['challengeId'] as String? ?? '',
      title: json['title'] as String? ?? '',
    );
  }
}

/// An achievement badge on a friend's profile.
class ProfileAchievement {
  const ProfileAchievement({required this.kind, required this.earnedAt});

  final String kind;
  final DateTime earnedAt;

  factory ProfileAchievement.fromJson(Map<String, dynamic> json) {
    return ProfileAchievement(
      kind: json['kind'] as String? ?? '',
      earnedAt: DateTime.parse(json['earnedAt'] as String),
    );
  }
}

/// Public-facing profile for /users/:id. Preview-tier fields are always
/// present; the friend-only lists + counts arrive only when [isFriend] is
/// true — the API gates them at the source, so a tampered client never
/// sees more than the server chose to send.
class UserProfile {
  const UserProfile({
    required this.id,
    required this.name,
    required this.joinedAt,
    required this.activeChallengeCount,
    required this.completedChallengeCount,
    required this.isFriend,
    required this.isSelf,
    this.sharedChallengeCount,
    this.achievementsCount,
    this.activeChallenges,
    this.completedChallenges,
    this.sharedChallenges,
    this.achievements,
  });

  final String id;
  final String name;
  final DateTime joinedAt;
  final int activeChallengeCount;
  final int completedChallengeCount;

  /// Viewer-relative — true for an accepted friend OR self.
  final bool isFriend;

  /// True when the viewer is looking at their own profile.
  final bool isSelf;

  // Friend-tier — null (not just empty) when the viewer doesn't qualify.
  final int? sharedChallengeCount;
  final int? achievementsCount;
  final List<ProfileChallengeSummary>? activeChallenges;
  final List<ProfileChallengeSummary>? completedChallenges;
  final List<SharedChallenge>? sharedChallenges;
  final List<ProfileAchievement>? achievements;

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    List<ProfileChallengeSummary>? challenges(dynamic raw) {
      if (raw == null) return null;
      return (raw as List<dynamic>)
          .map((j) =>
              ProfileChallengeSummary.fromJson(j as Map<String, dynamic>))
          .toList();
    }

    return UserProfile(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? 'Vital30 member',
      joinedAt: DateTime.parse(json['joinedAt'] as String),
      activeChallengeCount: json['activeChallengeCount'] as int? ?? 0,
      completedChallengeCount: json['completedChallengeCount'] as int? ?? 0,
      isFriend: json['isFriend'] as bool? ?? false,
      isSelf: json['isSelf'] as bool? ?? false,
      sharedChallengeCount: json['sharedChallengeCount'] as int?,
      achievementsCount: json['achievementsCount'] as int?,
      activeChallenges: challenges(json['activeChallenges']),
      completedChallenges: challenges(json['completedChallenges']),
      sharedChallenges: (json['sharedChallenges'] as List<dynamic>?)
          ?.map((j) => SharedChallenge.fromJson(j as Map<String, dynamic>))
          .toList(),
      achievements: (json['achievements'] as List<dynamic>?)
          ?.map((j) => ProfileAchievement.fromJson(j as Map<String, dynamic>))
          .toList(),
    );
  }
}

// ===========================================================================
// Challenge chat — a preset-only community channel per challenge. There is
// no free text: users post from a closed catalog of canned status updates
// (`ChatPreset`) and react with one of six emoji (`ChatReactionEmoji`).
// CELEBRATION cards are system-authored milestone markers.
// ===========================================================================

/// A canned status update a member can post. The catalog is closed and
/// ships from the server with the channel payload — the client never
/// invents codes.
class ChatPreset {
  const ChatPreset({
    required this.code,
    required this.text,
    required this.tone,
  });

  final String code;
  final String text;

  /// success | milestone | support | neutral | humor | encourage — drives
  /// the bubble/chip tint client-side.
  final String tone;

  factory ChatPreset.fromJson(Map<String, dynamic> json) => ChatPreset(
        code: json['code'] as String? ?? '',
        text: json['text'] as String? ?? '',
        tone: json['tone'] as String? ?? 'neutral',
      );
}

/// One of the six reactions a message can carry.
class ChatReactionEmoji {
  const ChatReactionEmoji({
    required this.code,
    required this.char,
    required this.label,
  });

  final String code;
  final String char;
  final String label;

  factory ChatReactionEmoji.fromJson(Map<String, dynamic> json) =>
      ChatReactionEmoji(
        code: json['code'] as String? ?? '',
        char: json['char'] as String? ?? '',
        label: json['label'] as String? ?? '',
      );
}

/// Per-message reaction tallies plus which ones the viewer has toggled on.
/// Both maps are keyed by emoji `code`.
class ChatReactions {
  const ChatReactions({required this.counts, required this.mine});

  final Map<String, int> counts;
  final Map<String, bool> mine;

  static const empty = ChatReactions(counts: {}, mine: {});

  factory ChatReactions.fromJson(Map<String, dynamic>? json) {
    if (json == null) return empty;
    final rawCounts = json['counts'] as Map<String, dynamic>? ?? const {};
    final rawMine = json['mine'] as Map<String, dynamic>? ?? const {};
    return ChatReactions(
      counts: rawCounts.map((k, v) => MapEntry(k, (v as num).toInt())),
      mine: rawMine.map((k, v) => MapEntry(k, v as bool)),
    );
  }

  int countFor(String code) => counts[code] ?? 0;
  bool mineFor(String code) => mine[code] ?? false;
}

/// A single chat message. PRESET rows are authored by a member (`user` set,
/// `presetCode` resolves to a `ChatPreset`); CELEBRATION rows are
/// system-authored milestone cards (`user` null, `body` set).
class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.kind,
    this.presetCode,
    this.body,
    this.scheduledDate,
    required this.createdAt,
    this.user,
    required this.reactions,
  });

  final String id;

  /// 'PRESET' | 'CELEBRATION'.
  final String kind;
  final String? presetCode;
  final String? body;
  final DateTime? scheduledDate;
  final DateTime createdAt;

  /// Null for CELEBRATION cards (system-authored).
  final FriendUser? user;
  final ChatReactions reactions;

  bool get isCelebration => kind == 'CELEBRATION';

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    final rawUser = json['user'] as Map<String, dynamic>?;
    return ChatMessage(
      id: json['id'] as String,
      kind: json['kind'] as String? ?? 'PRESET',
      presetCode: json['presetCode'] as String?,
      body: json['body'] as String?,
      scheduledDate: json['scheduledDate'] == null
          ? null
          : DateTime.parse(json['scheduledDate'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
      user: rawUser == null ? null : FriendUser.fromJson(rawUser),
      reactions:
          ChatReactions.fromJson(json['reactions'] as Map<String, dynamic>?),
    );
  }

  /// Returns a copy with new reaction tallies — used to reconcile the
  /// optimistic toggle with the server's authoritative counts.
  ChatMessage withReactions(ChatReactions next) => ChatMessage(
        id: id,
        kind: kind,
        presetCode: presetCode,
        body: body,
        scheduledDate: scheduledDate,
        createdAt: createdAt,
        user: user,
        reactions: next,
      );
}

/// Today's live participation poll, derived server-side from check-ins.
class ChatPoll {
  const ChatPoll({
    required this.completed,
    required this.missed,
    required this.skipped,
    required this.pending,
    required this.total,
    this.yourStatus,
  });

  final int completed;
  final int missed;
  final int skipped;
  final int pending;
  final int total;

  /// The viewer's own check-in today: 'COMPLETED' | 'MISSED' | 'SKIPPED' |
  /// null (not checked in yet).
  final String? yourStatus;

  static const empty = ChatPoll(
    completed: 0,
    missed: 0,
    skipped: 0,
    pending: 0,
    total: 0,
  );

  factory ChatPoll.fromJson(Map<String, dynamic>? json) {
    if (json == null) return empty;
    return ChatPoll(
      completed: json['completed'] as int? ?? 0,
      missed: json['missed'] as int? ?? 0,
      skipped: json['skipped'] as int? ?? 0,
      pending: json['pending'] as int? ?? 0,
      total: json['total'] as int? ?? 0,
      yourStatus: json['yourStatus'] as String?,
    );
  }
}

/// The full channel payload — catalogs, the poll, and the message list
/// (server order is newest-first; the screen reverses for chronological
/// display).
class ChatChannel {
  const ChatChannel({
    required this.presets,
    required this.emoji,
    required this.poll,
    required this.messages,
  });

  final List<ChatPreset> presets;
  final List<ChatReactionEmoji> emoji;
  final ChatPoll poll;
  final List<ChatMessage> messages;

  /// Resolves a `presetCode` to its text via the catalog; falls back to the
  /// raw code so an unknown preset still renders something.
  String presetText(String? code) {
    if (code == null) return '';
    for (final p in presets) {
      if (p.code == code) return p.text;
    }
    return code;
  }

  String presetTone(String? code) {
    if (code == null) return 'neutral';
    for (final p in presets) {
      if (p.code == code) return p.tone;
    }
    return 'neutral';
  }

  factory ChatChannel.fromJson(Map<String, dynamic> json) => ChatChannel(
        presets: (json['presets'] as List<dynamic>? ?? const [])
            .map((j) => ChatPreset.fromJson(j as Map<String, dynamic>))
            .toList(),
        emoji: (json['emoji'] as List<dynamic>? ?? const [])
            .map((j) => ChatReactionEmoji.fromJson(j as Map<String, dynamic>))
            .toList(),
        poll: ChatPoll.fromJson(json['poll'] as Map<String, dynamic>?),
        messages: (json['messages'] as List<dynamic>? ?? const [])
            .map((j) => ChatMessage.fromJson(j as Map<String, dynamic>))
            .toList(),
      );
}

/// A member of a challenge's chat — every joiner, any status. Carries the
/// viewer's friendship state with that member so the Members sheet can
/// render the right friend-action button.
class ChatMember {
  const ChatMember({
    required this.userId,
    required this.name,
    required this.joinedAt,
    this.todayCheckinStatus,
    required this.isYou,
    required this.friendship,
    this.friendshipId,
  });

  final String userId;
  final String name;
  final DateTime joinedAt;

  /// 'COMPLETED' | 'MISSED' | 'SKIPPED' | null (not checked in today).
  final String? todayCheckinStatus;
  final bool isYou;

  /// 'none' | 'pending_sent' | 'pending_received' | 'accepted' |
  /// 'blocked_by_me'.
  final String friendship;
  final String? friendshipId;

  factory ChatMember.fromJson(Map<String, dynamic> json) => ChatMember(
        userId: json['userId'] as String? ?? '',
        name: json['name'] as String? ?? 'Vital30 member',
        joinedAt: DateTime.parse(json['joinedAt'] as String),
        todayCheckinStatus: json['todayCheckinStatus'] as String?,
        isYou: json['isYou'] as bool? ?? false,
        friendship: json['friendship'] as String? ?? 'none',
        friendshipId: json['friendshipId'] as String?,
      );
}

/// Result of toggling a reaction — whether it was added (vs removed) plus
/// the authoritative tallies for that message after the toggle.
class ToggleReactionResult {
  const ToggleReactionResult({required this.added, required this.reactions});

  final bool added;
  final ChatReactions reactions;

  factory ToggleReactionResult.fromJson(Map<String, dynamic> json) =>
      ToggleReactionResult(
        added: json['added'] as bool? ?? false,
        reactions: ChatReactions.fromJson(json),
      );
}
