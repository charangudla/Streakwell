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
