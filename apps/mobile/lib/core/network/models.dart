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
