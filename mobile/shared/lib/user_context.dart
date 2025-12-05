import 'dart:async';
import 'package:flutter/foundation.dart';

/// Represents the current user's identity and role
class UserContext {
  final String userId;
  final String email;
  final String name;
  final String role; // PARENT, TEACHER, LEARNER, ADMIN
  final String? learnerId; // If user has associated learner
  final List<String> permissions;
  
  const UserContext({
    required this.userId,
    required this.email,
    required this.name,
    required this.role,
    this.learnerId,
    this.permissions = const [],
  });
  
  /// Parse from JWT claims or API response
  factory UserContext.fromJson(Map<String, dynamic> json) {
    return UserContext(
      userId: json['userId'] as String? ?? json['sub'] as String? ?? '',
      email: json['email'] as String? ?? '',
      name: json['name'] as String? ?? json['displayName'] as String? ?? 'User',
      role: json['role'] as String? ?? 'PARENT',
      learnerId: json['learnerId'] as String?,
      permissions: (json['permissions'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList() ?? [],
    );
  }
  
  Map<String, dynamic> toJson() => {
    'userId': userId,
    'email': email,
    'name': name,
    'role': role,
    'learnerId': learnerId,
    'permissions': permissions,
  };
  
  bool get isParent => role == 'PARENT';
  bool get isTeacher => role == 'TEACHER';
  bool get isLearner => role == 'LEARNER';
  bool get isAdmin => role == 'ADMIN' || role == 'PLATFORM_ADMIN';
  
  bool hasPermission(String permission) => permissions.contains(permission);
}

/// Service to manage user authentication state
class UserContextService extends ChangeNotifier {
  static final UserContextService _instance = UserContextService._internal();
  static UserContextService get instance => _instance;
  
  factory UserContextService() => _instance;
  
  UserContextService._internal();
  
  UserContext? _currentUser;
  final StreamController<UserContext?> _userController = StreamController<UserContext?>.broadcast();
  
  /// Get current user context
  UserContext? get currentUser => _currentUser;
  
  /// Stream of user context changes
  Stream<UserContext?> get userStream => _userController.stream;
  
  /// Current user's ID (convenience getter)
  String get currentUserId => _currentUser?.userId ?? 'anonymous';
  
  /// Current user's role (convenience getter)  
  String get currentUserRole => _currentUser?.role ?? 'PARENT';
  
  /// Current user's name (convenience getter)
  String get currentUserName => _currentUser?.name ?? 'User';
  
  /// Check if user is authenticated
  bool get isAuthenticated => _currentUser != null;
  
  /// Set the current user context (called after login)
  void setUser(UserContext user) {
    _currentUser = user;
    _userController.add(user);
    notifyListeners();
  }
  
  /// Update user from API response
  void updateFromApiResponse(Map<String, dynamic> userData) {
    setUser(UserContext.fromJson(userData));
  }
  
  /// Clear user context (called on logout)
  void clearUser() {
    _currentUser = null;
    _userController.add(null);
    notifyListeners();
  }
  
  @override
  void dispose() {
    _userController.close();
    super.dispose();
  }
}

/// Extension to easily access user context from widgets
extension UserContextExtension on UserContextService {
  /// Get user info for IEP notes/data entries
  Map<String, String> getAuthorInfo() {
    return {
      'authorId': currentUserId,
      'authorRole': currentUserRole,
      'authorName': currentUserName,
    };
  }
}
