/**
 * Sentry Configuration for Flutter Apps
 * 
 * This library provides Sentry initialization and utilities for AIVO mobile apps.
 * It handles error tracking, performance monitoring, and user context management.
 */

library sentry_config;

import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

/// Sentry configuration options
class AivoSentryConfig {
  /// Sentry DSN (Data Source Name)
  final String dsn;
  
  /// Environment name (development, staging, production)
  final String environment;
  
  /// App release version
  final String? release;
  
  /// Percentage of transactions to sample (0.0 to 1.0)
  final double tracesSampleRate;
  
  /// Whether to enable debug mode
  final bool debug;

  const AivoSentryConfig({
    required this.dsn,
    this.environment = 'development',
    this.release,
    this.tracesSampleRate = 0.1,
    this.debug = false,
  });

  /// Create config from environment variables
  factory AivoSentryConfig.fromEnvironment() {
    return AivoSentryConfig(
      dsn: const String.fromEnvironment('SENTRY_DSN', defaultValue: ''),
      environment: const String.fromEnvironment('ENV', defaultValue: 'development'),
      release: const String.fromEnvironment('APP_VERSION', defaultValue: ''),
      tracesSampleRate: kDebugMode ? 1.0 : 0.1,
      debug: kDebugMode,
    );
  }
}

/// Initialize Sentry for the Flutter app
/// 
/// Usage:
/// ```dart
/// void main() async {
///   await initSentry(
///     () => runApp(const MyApp()),
///     config: AivoSentryConfig.fromEnvironment(),
///   );
/// }
/// ```
Future<void> initSentry(
  FutureOr<void> Function() appRunner, {
  AivoSentryConfig? config,
}) async {
  final sentryConfig = config ?? AivoSentryConfig.fromEnvironment();
  
  // Skip Sentry initialization if DSN is not configured
  if (sentryConfig.dsn.isEmpty) {
    if (kDebugMode) {
      print('[Sentry] DSN not configured, skipping initialization');
    }
    await appRunner();
    return;
  }

  await SentryFlutter.init(
    (options) {
      options.dsn = sentryConfig.dsn;
      options.environment = sentryConfig.environment;
      
      if (sentryConfig.release != null && sentryConfig.release!.isNotEmpty) {
        options.release = sentryConfig.release;
      }
      
      // Performance monitoring
      options.tracesSampleRate = sentryConfig.tracesSampleRate;
      
      // Enable auto performance tracking
      options.enableAutoPerformanceTracing = true;
      
      // Debug mode
      options.debug = sentryConfig.debug;
      
      // Scrub PII before sending events
      options.beforeSend = _scrubPii;
      
      // Scrub PII from breadcrumbs
      options.beforeBreadcrumb = _scrubBreadcrumb;
      
      // Filter transactions
      options.beforeSendTransaction = _filterTransaction;
      
      // Attachments configuration
      options.attachScreenshot = true;
      options.attachViewHierarchy = true;
      
      // Max breadcrumbs to keep
      options.maxBreadcrumbs = 100;
      
      // Sample rate for screenshots
      options.screenshotQuality = SentryScreenshotQuality.low;
    },
    appRunner: appRunner,
  );
}

/// Scrub PII from events before sending
FutureOr<SentryEvent?> _scrubPii(SentryEvent event, Hint hint) {
  // Remove user PII
  if (event.user != null) {
    event = event.copyWith(
      user: SentryUser(
        id: event.user!.id,
        // Remove email, username, ipAddress
        data: event.user!.data != null
            ? _scrubSensitiveData(Map<String, dynamic>.from(event.user!.data!))
            : null,
      ),
    );
  }

  // Scrub sensitive data from contexts
  if (event.contexts != null) {
    final contexts = Map<String, dynamic>.from(event.contexts!);
    
    // Remove device identifiers that could be PII
    if (contexts.containsKey('device')) {
      final device = Map<String, dynamic>.from(contexts['device'] as Map);
      device.remove('name');
      contexts['device'] = device;
    }
    
    event = event.copyWith(contexts: Contexts.fromJson(contexts));
  }

  // Don't send events in debug mode unless explicitly configured
  if (kDebugMode && !const bool.fromEnvironment('SENTRY_DEBUG', defaultValue: false)) {
    return null;
  }

  return event;
}

/// Scrub sensitive data from breadcrumbs
Breadcrumb? _scrubBreadcrumb(Breadcrumb? breadcrumb, Hint hint) {
  if (breadcrumb == null) return null;
  
  // Scrub sensitive data from breadcrumb data
  if (breadcrumb.data != null) {
    final scrubbedData = _scrubSensitiveData(
      Map<String, dynamic>.from(breadcrumb.data!),
    );
    return breadcrumb.copyWith(data: scrubbedData);
  }
  
  return breadcrumb;
}

/// Filter transactions before sending
FutureOr<SentryTransaction?> _filterTransaction(
  SentryTransaction transaction,
  Hint hint,
) {
  // Filter out health check and internal transactions
  final name = transaction.transaction ?? '';
  if (name.contains('health') || name.contains('_internal')) {
    return null;
  }
  
  return transaction;
}

/// Scrub sensitive data from a map
Map<String, dynamic> _scrubSensitiveData(Map<String, dynamic> data) {
  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'api_key',
    'apiKey',
    'auth',
    'authorization',
    'credential',
    'ssn',
    'email',
  ];
  
  final scrubbed = <String, dynamic>{};
  
  for (final entry in data.entries) {
    final lowerKey = entry.key.toLowerCase();
    
    if (sensitiveKeys.any((key) => lowerKey.contains(key))) {
      scrubbed[entry.key] = '[FILTERED]';
    } else if (entry.value is Map) {
      scrubbed[entry.key] = _scrubSensitiveData(
        Map<String, dynamic>.from(entry.value as Map),
      );
    } else {
      scrubbed[entry.key] = entry.value;
    }
  }
  
  return scrubbed;
}

/// Set user context for error tracking
/// 
/// Call this after successful authentication
void setAivoUser({
  required String userId,
  String? role,
  String? tenantId,
}) {
  Sentry.configureScope((scope) {
    scope.setUser(SentryUser(
      id: userId,
      data: {
        if (role != null) 'role': role,
        if (tenantId != null) 'tenantId': tenantId,
      },
    ));
  });
}

/// Clear user context (call on logout)
void clearAivoUser() {
  Sentry.configureScope((scope) {
    scope.setUser(null);
  });
}

/// Add a breadcrumb for tracking user actions
void addAivoBreadcrumb({
  required String category,
  required String message,
  SentryLevel level = SentryLevel.info,
  Map<String, dynamic>? data,
}) {
  Sentry.addBreadcrumb(Breadcrumb(
    category: category,
    message: message,
    level: level,
    data: data,
    timestamp: DateTime.now().toUtc(),
  ));
}

/// Capture an exception with optional context
Future<void> captureAivoException(
  dynamic exception, {
  dynamic stackTrace,
  Map<String, dynamic>? extra,
}) async {
  await Sentry.captureException(
    exception,
    stackTrace: stackTrace,
    withScope: extra != null
        ? (scope) {
            for (final entry in extra.entries) {
              scope.setExtra(entry.key, entry.value);
            }
          }
        : null,
  );
}

/// Capture a message/event
Future<void> captureAivoMessage(
  String message, {
  SentryLevel level = SentryLevel.info,
  Map<String, dynamic>? extra,
}) async {
  await Sentry.captureMessage(
    message,
    level: level,
    withScope: extra != null
        ? (scope) {
            for (final entry in extra.entries) {
              scope.setExtra(entry.key, entry.value);
            }
          }
        : null,
  );
}

/// Wrap an async operation with transaction tracking
Future<T> withAivoTransaction<T>({
  required String name,
  required String operation,
  required Future<T> Function() task,
  Map<String, String>? tags,
}) async {
  final transaction = Sentry.startTransaction(
    name,
    operation,
    bindToScope: true,
  );
  
  if (tags != null) {
    for (final entry in tags.entries) {
      transaction.setTag(entry.key, entry.value);
    }
  }
  
  try {
    final result = await task();
    transaction.status = const SpanStatus.ok();
    return result;
  } catch (e) {
    transaction.status = const SpanStatus.internalError();
    transaction.throwable = e;
    rethrow;
  } finally {
    await transaction.finish();
  }
}

/// Create a child span for a transaction
ISentrySpan? startAivoSpan({
  required String operation,
  String? description,
}) {
  return Sentry.getSpan()?.startChild(
    operation,
    description: description,
  );
}
