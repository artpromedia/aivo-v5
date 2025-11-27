import 'package:flutter/material.dart';

/// AIVO Theme - Neurodiversity-affirming design system
/// Light, calming, and friendly design inspired by modern learning apps
class AivoTheme {
  // Primary colors - soft, calming palette
  static const Color primary = Color(0xFF7C3AED); // violet-600
  static const Color primaryLight = Color(0xFFA78BFA); // violet-400
  static const Color primarySoft = Color(0xFFEDE9FE); // violet-100
  
  // Accent colors - warm and friendly
  static const Color coral = Color(0xFFFF7B7B); // soft coral for highlights
  static const Color mint = Color(0xFF6EE7B7); // emerald-300 - success/positive
  static const Color sunshine = Color(0xFFFCD34D); // amber-300 - achievements
  static const Color sky = Color(0xFF7DD3FC); // sky-300 - info/calm
  
  // Background colors (light theme)
  static const Color background = Color(0xFFFAF5FF); // soft lavender tint
  static const Color cardBackground = Color(0xFFFFFFFF); // pure white cards
  static const Color surfaceBackground = Color(0xFFF3E8FF); // purple-100
  
  // Text colors
  static const Color textPrimary = Color(0xFF1E1B4B); // indigo-950
  static const Color textSecondary = Color(0xFF4C1D95); // violet-900
  static const Color textMuted = Color(0xFF6B7280); // gray-500
  
  // Status colors - softer versions
  static const Color success = Color(0xFF10B981); // emerald-500
  static const Color warning = Color(0xFFF59E0B); // amber-500
  static const Color error = Color(0xFFF87171); // red-400 (softer)
  
  // Gradient backgrounds
  static const LinearGradient backgroundGradient = LinearGradient(
    colors: [Color(0xFFFAF5FF), Color(0xFFEDE9FE), Color(0xFFF0FDFA)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient cardGradient = LinearGradient(
    colors: [Color(0xFFFFFFFF), Color(0xFFFDF4FF)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF8B5CF6), Color(0xFFA78BFA)],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: background,
      colorScheme: const ColorScheme.light(
        primary: primary,
        secondary: primaryLight,
        surface: cardBackground,
        error: error,
        onPrimary: Colors.white,
        onSurface: textPrimary,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: textPrimary,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: textPrimary,
        ),
      ),
      cardTheme: CardThemeData(
        color: cardBackground,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        shadowColor: primary.withValues(alpha: 0.1),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primary,
          side: const BorderSide(color: primaryLight, width: 1.5),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primary,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: surfaceBackground, width: 1.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: primary, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        hintStyle: TextStyle(color: textMuted.withValues(alpha: 0.7)),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        selectedItemColor: primary,
        unselectedItemColor: textMuted,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: textPrimary,
          letterSpacing: -0.5,
        ),
        headlineMedium: TextStyle(
          fontSize: 26,
          fontWeight: FontWeight.bold,
          color: textPrimary,
          letterSpacing: -0.5,
        ),
        headlineSmall: TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          color: textPrimary,
        ),
        titleLarge: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: textPrimary,
        ),
        titleMedium: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w500,
          color: textPrimary,
        ),
        bodyLarge: TextStyle(
          fontSize: 16,
          color: textSecondary,
          height: 1.5,
        ),
        bodyMedium: TextStyle(
          fontSize: 14,
          color: textSecondary,
          height: 1.5,
        ),
        bodySmall: TextStyle(
          fontSize: 12,
          color: textMuted,
          height: 1.4,
        ),
        labelSmall: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
          color: textMuted,
        ),
      ),
    );
  }
  
  // Keep dark theme as fallback
  static ThemeData get darkTheme => lightTheme;
}

/// Custom widgets that match AIVO's friendly design language
class AivoWidgets {
  /// Soft gradient card wrapper
  static Widget gradientCard({required Widget child, EdgeInsets? padding}) {
    return Container(
      padding: padding ?? const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AivoTheme.cardGradient,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AivoTheme.primary.withValues(alpha: 0.08),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: child,
    );
  }

  /// Pill-shaped badge with gradient background
  static Widget gradientBadge({required String text}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        gradient: AivoTheme.primaryGradient,
        borderRadius: BorderRadius.circular(50),
        boxShadow: [
          BoxShadow(
            color: AivoTheme.primary.withValues(alpha: 0.3),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: Colors.white,
        ),
      ),
    );
  }

  /// Soft colored badge
  static Widget softBadge({
    required String text,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(50),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  /// Status badge with predefined colors
  static Widget statusBadge({
    required String text,
    required Color backgroundColor,
    required Color textColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(50),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }

  /// Activity status badge with predefined colors
  static Widget activityStatusBadge(String status) {
    Color bgColor;
    Color textColor;
    String label;
    IconData icon;

    switch (status) {
      case 'completed':
        bgColor = AivoTheme.mint.withValues(alpha: 0.2);
        textColor = AivoTheme.success;
        label = '✓ Done';
        icon = Icons.check_circle_rounded;
        break;
      case 'in_progress':
        bgColor = AivoTheme.sunshine.withValues(alpha: 0.3);
        textColor = AivoTheme.warning;
        label = '● In progress';
        icon = Icons.play_circle_rounded;
        break;
      case 'skipped':
        bgColor = AivoTheme.surfaceBackground;
        textColor = AivoTheme.textMuted;
        label = 'Skipped';
        icon = Icons.skip_next_rounded;
        break;
      default:
        bgColor = AivoTheme.sky.withValues(alpha: 0.2);
        textColor = AivoTheme.textMuted;
        label = 'Ready';
        icon = Icons.circle_outlined;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(50),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }

  /// Friendly avatar with initial
  static Widget avatar({
    required String name,
    double size = 48,
    Color? backgroundColor,
  }) {
    final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            backgroundColor ?? AivoTheme.primaryLight,
            backgroundColor?.withValues(alpha: 0.7) ?? AivoTheme.primary,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(size / 2),
        boxShadow: [
          BoxShadow(
            color: (backgroundColor ?? AivoTheme.primary).withValues(alpha: 0.3),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Center(
        child: Text(
          initial,
          style: TextStyle(
            fontSize: size * 0.4,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
      ),
    );
  }

  /// Progress indicator with friendly styling
  static Widget progressRing({
    required double progress,
    double size = 60,
    Color? color,
  }) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        children: [
          CircularProgressIndicator(
            value: 1.0,
            strokeWidth: 6,
            backgroundColor: AivoTheme.surfaceBackground,
            valueColor: AlwaysStoppedAnimation<Color>(
              AivoTheme.surfaceBackground,
            ),
          ),
          CircularProgressIndicator(
            value: progress,
            strokeWidth: 6,
            backgroundColor: Colors.transparent,
            valueColor: AlwaysStoppedAnimation<Color>(
              color ?? AivoTheme.primary,
            ),
            strokeCap: StrokeCap.round,
          ),
          Center(
            child: Text(
              '${(progress * 100).round()}%',
              style: TextStyle(
                fontSize: size * 0.22,
                fontWeight: FontWeight.bold,
                color: AivoTheme.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Calm break message card
  static Widget breakMessageCard({
    required VoidCallback onDismiss,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AivoTheme.mint.withValues(alpha: 0.15),
        border: Border.all(color: AivoTheme.mint.withValues(alpha: 0.4)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AivoTheme.mint.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Text('🌿', style: TextStyle(fontSize: 20)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Time for a break!',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AivoTheme.success,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  "Take a breath, stretch, or get some water. Your progress is saved!",
                  style: TextStyle(
                    fontSize: 12,
                    color: AivoTheme.textMuted,
                  ),
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: onDismiss,
            child: Text(
              'Got it',
              style: TextStyle(
                color: AivoTheme.success,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Friendly stat card
  static Widget statCard({
    required String label,
    required String value,
    required IconData icon,
    Color? color,
  }) {
    final cardColor = color ?? AivoTheme.primary;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Icon(icon, color: cardColor, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: cardColor,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: AivoTheme.textMuted,
            ),
          ),
        ],
      ),
    );
  }
}
