import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:logging/logging.dart';
import 'package:http/http.dart' as http;

/// Structured logging for AIVO Flutter applications
/// 
/// Usage:
/// ```dart
/// import 'package:shared/logger.dart';
/// 
/// void main() {
///   AppLogger.init();
///   AppLogger.info('App started');
/// }
/// ```
class AppLogger {
  static final Logger _logger = Logger('AIVO');
  static bool _initialized = false;
  
  /// Initialize the logger
  /// Call this in main() before using any logging methods
  static void init({Level level = Level.ALL}) {
    if (_initialized) return;
    
    Logger.root.level = level;
    Logger.root.onRecord.listen(_handleLogRecord);
    _initialized = true;
    
    info('Logger initialized', {'level': level.name});
  }
  
  /// Handle log records
  static void _handleLogRecord(LogRecord record) {
    final output = _formatLogRecord(record);
    
    // In debug mode, print to console with colors
    if (kDebugMode) {
      _printColored(record.level, output);
    }
    
    // In release mode, send to remote logging service
    if (kReleaseMode) {
      _sendToRemote(record);
    }
  }
  
  /// Format log record as structured JSON
  static String _formatLogRecord(LogRecord record) {
    final data = {
      'timestamp': record.time.toIso8601String(),
      'level': record.level.name,
      'logger': record.loggerName,
      'message': record.message,
      if (record.error != null) 'error': record.error.toString(),
      if (record.stackTrace != null) 'stackTrace': record.stackTrace.toString(),
    };
    
    return jsonEncode(data);
  }
  
  /// Print with ANSI colors for debug console
  static void _printColored(Level level, String message) {
    String prefix;
    switch (level.name) {
      case 'FINE':
      case 'FINER':
      case 'FINEST':
        prefix = '\x1B[37m[DEBUG]\x1B[0m'; // White
        break;
      case 'INFO':
        prefix = '\x1B[34m[INFO]\x1B[0m';  // Blue
        break;
      case 'WARNING':
        prefix = '\x1B[33m[WARN]\x1B[0m';  // Yellow
        break;
      case 'SEVERE':
      case 'SHOUT':
        prefix = '\x1B[31m[ERROR]\x1B[0m'; // Red
        break;
      default:
        prefix = '[${level.name}]';
    }
    
    // ignore: avoid_print
    print('$prefix $message');
  }
  
  /// Send log to remote logging service
  static Future<void> _sendToRemote(LogRecord record) async {
    // Remote logging implementation
    // Sends logs to configured endpoint for centralized monitoring
    
    final logEndpoint = const String.fromEnvironment(
      'LOG_ENDPOINT',
      defaultValue: '',
    );
    
    // Only send if endpoint is configured and for severe/warning logs
    if (logEndpoint.isEmpty) return;
    if (record.level.value < Level.WARNING.value) return;
    
    try {
      final logData = {
        'timestamp': record.time.toIso8601String(),
        'level': record.level.name,
        'logger': record.loggerName,
        'message': record.message,
        'platform': 'flutter',
        'error': record.error?.toString(),
        'stackTrace': record.stackTrace?.toString(),
      };
      
      // Non-blocking fire-and-forget
      // Using compute or isolate would be better for production
      http.post(
        Uri.parse(logEndpoint),
        body: jsonEncode(logData),
        headers: {'Content-Type': 'application/json'},
      ).catchError((_) {
        // Silently ignore remote logging failures
        return http.Response('', 500);
      });
    } catch (_) {
      // Silently ignore any encoding/parsing errors
    }
  }
  
  /// Log debug message (only in development)
  static void debug(String message, [Map<String, dynamic>? context]) {
    if (!_initialized) init();
    final contextStr = context != null ? ' ${jsonEncode(context)}' : '';
    _logger.fine('$message$contextStr');
  }
  
  /// Log info message
  static void info(String message, [Map<String, dynamic>? context]) {
    if (!_initialized) init();
    final contextStr = context != null ? ' ${jsonEncode(context)}' : '';
    _logger.info('$message$contextStr');
  }
  
  /// Log warning message
  static void warn(String message, [Map<String, dynamic>? context]) {
    if (!_initialized) init();
    final contextStr = context != null ? ' ${jsonEncode(context)}' : '';
    _logger.warning('$message$contextStr');
  }
  
  /// Log error message with optional error and stack trace
  static void error(String message, [dynamic error, StackTrace? stackTrace, Map<String, dynamic>? context]) {
    if (!_initialized) init();
    final contextStr = context != null ? ' ${jsonEncode(context)}' : '';
    _logger.severe('$message$contextStr', error, stackTrace);
  }
  
  /// Create a child logger with a specific name
  static ChildLogger child(String name) {
    if (!_initialized) init();
    return ChildLogger(Logger('AIVO.$name'));
  }
}

/// Child logger for scoped logging
class ChildLogger {
  final Logger _logger;
  
  ChildLogger(this._logger);
  
  void debug(String message, [Map<String, dynamic>? context]) {
    final contextStr = context != null ? ' ${jsonEncode(context)}' : '';
    _logger.fine('$message$contextStr');
  }
  
  void info(String message, [Map<String, dynamic>? context]) {
    final contextStr = context != null ? ' ${jsonEncode(context)}' : '';
    _logger.info('$message$contextStr');
  }
  
  void warn(String message, [Map<String, dynamic>? context]) {
    final contextStr = context != null ? ' ${jsonEncode(context)}' : '';
    _logger.warning('$message$contextStr');
  }
  
  void error(String message, [dynamic error, StackTrace? stackTrace, Map<String, dynamic>? context]) {
    final contextStr = context != null ? ' ${jsonEncode(context)}' : '';
    _logger.severe('$message$contextStr', error, stackTrace);
  }
}

/// Log context that can be attached to log messages
class LogContext {
  final Map<String, dynamic> _data = {};
  
  LogContext();
  
  LogContext.from(Map<String, dynamic> data) {
    _data.addAll(data);
  }
  
  /// Add user context
  LogContext withUser(String userId, {String? learnerId}) {
    _data['userId'] = userId;
    if (learnerId != null) _data['learnerId'] = learnerId;
    return this;
  }
  
  /// Add request context
  LogContext withRequest(String requestId, {String? sessionId}) {
    _data['requestId'] = requestId;
    if (sessionId != null) _data['sessionId'] = sessionId;
    return this;
  }
  
  /// Add custom key-value pair
  LogContext with_(String key, dynamic value) {
    _data[key] = value;
    return this;
  }
  
  Map<String, dynamic> toMap() => Map.unmodifiable(_data);
}
