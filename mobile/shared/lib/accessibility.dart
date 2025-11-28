import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';

/// Accessibility utilities and widgets for AIVO mobile apps.
/// Provides WCAG 2.1 AA compliance helpers for Flutter.

// =============================================================================
// Constants
// =============================================================================

/// Text scale factors for accessibility
class AivoTextScale {
  static const double normal = 1.0;
  static const double large = 1.3;
  static const double extraLarge = 1.5;
  static const double huge = 2.0;
}

/// Minimum touch target sizes (per WCAG 2.5.5)
class AivoTouchTarget {
  static const double minimum = 44.0;
  static const double recommended = 48.0;
}

// =============================================================================
// Accessibility Helper Class
// =============================================================================

/// Helper class for creating accessible widgets
class AivoAccessibility {
  /// Create a semantic button wrapper
  static Widget semanticButton({
    required Widget child,
    required String label,
    required VoidCallback onPressed,
    String? hint,
    bool enabled = true,
  }) {
    return Semantics(
      button: true,
      enabled: enabled,
      label: label,
      hint: hint,
      child: child,
    );
  }

  /// Create a semantic image wrapper
  static Widget semanticImage({
    required Widget child,
    required String description,
    bool excludeFromSemantics = false,
  }) {
    if (excludeFromSemantics) {
      return ExcludeSemantics(child: child);
    }
    return Semantics(
      image: true,
      label: description,
      child: child,
    );
  }

  /// Create a semantic header wrapper
  static Widget semanticHeader({
    required Widget child,
    required String label,
    bool isHeader = true,
  }) {
    return Semantics(
      header: isHeader,
      label: label,
      child: child,
    );
  }

  /// Create a semantic link wrapper
  static Widget semanticLink({
    required Widget child,
    required String label,
    String? hint,
  }) {
    return Semantics(
      link: true,
      label: label,
      hint: hint ?? 'Double tap to open',
      child: child,
    );
  }

  /// Create a semantic live region for announcements
  static Widget liveRegion({
    required Widget child,
    required String announcement,
    bool assertive = false,
  }) {
    return Semantics(
      liveRegion: true,
      label: announcement,
      child: child,
    );
  }

  /// Announce a message to screen readers
  static void announce(String message, {bool assertive = false}) {
    SemanticsService.announce(
      message,
      TextDirection.ltr,
      assertiveness: assertive 
        ? Assertiveness.assertive 
        : Assertiveness.polite,
    );
  }
}

// =============================================================================
// Accessible Button Widget
// =============================================================================

/// An accessible button that meets WCAG touch target requirements
class AccessibleButton extends StatelessWidget {
  final String label;
  final String? hint;
  final VoidCallback onPressed;
  final Widget? child;
  final IconData? icon;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final bool enabled;
  final double minSize;

  const AccessibleButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.hint,
    this.child,
    this.icon,
    this.backgroundColor,
    this.foregroundColor,
    this.enabled = true,
    this.minSize = AivoTouchTarget.minimum,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      enabled: enabled,
      label: label,
      hint: hint,
      child: ConstrainedBox(
        constraints: BoxConstraints(
          minWidth: minSize,
          minHeight: minSize,
        ),
        child: ElevatedButton(
          onPressed: enabled ? onPressed : null,
          style: ElevatedButton.styleFrom(
            backgroundColor: backgroundColor,
            foregroundColor: foregroundColor,
            minimumSize: Size(minSize, minSize),
          ),
          child: child ?? (icon != null ? Icon(icon) : Text(label)),
        ),
      ),
    );
  }
}

// =============================================================================
// Accessible Emotion Picker
// =============================================================================

/// Emotion data class
class EmotionData {
  final String id;
  final String label;
  final String description;
  final IconData icon;
  final Color color;

  const EmotionData({
    required this.id,
    required this.label,
    required this.description,
    required this.icon,
    required this.color,
  });
}

/// Accessible emotion picker for learners
class AccessibleEmotionPicker extends StatelessWidget {
  final Function(String) onSelect;
  final String? selectedEmotion;
  final List<EmotionData> emotions;

  const AccessibleEmotionPicker({
    super.key,
    required this.onSelect,
    this.selectedEmotion,
    this.emotions = const [
      EmotionData(
        id: 'happy',
        label: 'Happy',
        description: 'I feel good and positive',
        icon: Icons.sentiment_very_satisfied,
        color: Colors.amber,
      ),
      EmotionData(
        id: 'calm',
        label: 'Calm',
        description: 'I feel peaceful and relaxed',
        icon: Icons.spa,
        color: Colors.teal,
      ),
      EmotionData(
        id: 'sad',
        label: 'Sad',
        description: 'I feel down or unhappy',
        icon: Icons.sentiment_dissatisfied,
        color: Colors.blue,
      ),
      EmotionData(
        id: 'angry',
        label: 'Angry',
        description: 'I feel frustrated or mad',
        icon: Icons.sentiment_very_dissatisfied,
        color: Colors.red,
      ),
      EmotionData(
        id: 'anxious',
        label: 'Anxious',
        description: 'I feel worried or nervous',
        icon: Icons.psychology,
        color: Colors.purple,
      ),
    ],
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Select your current emotion',
      hint: 'Choose how you are feeling right now',
      child: Wrap(
        spacing: 12,
        runSpacing: 12,
        children: emotions.map((emotion) => _buildEmotionButton(emotion)).toList(),
      ),
    );
  }

  Widget _buildEmotionButton(EmotionData emotion) {
    final isSelected = selectedEmotion == emotion.id;
    
    return Semantics(
      button: true,
      selected: isSelected,
      label: '${emotion.label} - ${emotion.description}',
      hint: isSelected ? 'Currently selected' : 'Double tap to select',
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            onSelect(emotion.id);
            AivoAccessibility.announce(
              '${emotion.label} selected',
              assertive: true,
            );
          },
          borderRadius: BorderRadius.circular(16),
          child: Container(
            width: AivoTouchTarget.minimum,
            height: AivoTouchTarget.minimum,
            decoration: BoxDecoration(
              color: isSelected ? emotion.color : emotion.color.withOpacity(0.2),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: emotion.color,
                width: isSelected ? 3 : 1,
              ),
            ),
            child: Center(
              child: Icon(
                emotion.icon,
                color: isSelected ? Colors.white : emotion.color,
                size: 28,
                semanticLabel: emotion.label,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// =============================================================================
// Accessible Form Field
// =============================================================================

/// Accessible text form field
class AccessibleTextField extends StatelessWidget {
  final String label;
  final String? hint;
  final String? errorText;
  final TextEditingController? controller;
  final TextInputType? keyboardType;
  final bool obscureText;
  final bool required;
  final ValueChanged<String>? onChanged;
  final FormFieldValidator<String>? validator;

  const AccessibleTextField({
    super.key,
    required this.label,
    this.hint,
    this.errorText,
    this.controller,
    this.keyboardType,
    this.obscureText = false,
    this.required = false,
    this.onChanged,
    this.validator,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      textField: true,
      label: '$label${required ? ', required' : ''}',
      hint: hint,
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        obscureText: obscureText,
        onChanged: onChanged,
        validator: validator,
        decoration: InputDecoration(
          labelText: '$label${required ? ' *' : ''}',
          hintText: hint,
          errorText: errorText,
          // Ensure sufficient contrast
          labelStyle: const TextStyle(
            color: Colors.black87,
            fontSize: 16,
          ),
          errorStyle: const TextStyle(
            color: Colors.red,
            fontSize: 14,
          ),
          // Visible focus indicator
          focusedBorder: OutlineInputBorder(
            borderSide: BorderSide(
              color: Theme.of(context).primaryColor,
              width: 2,
            ),
          ),
          enabledBorder: const OutlineInputBorder(
            borderSide: BorderSide(
              color: Colors.grey,
              width: 1,
            ),
          ),
          errorBorder: const OutlineInputBorder(
            borderSide: BorderSide(
              color: Colors.red,
              width: 2,
            ),
          ),
        ),
      ),
    );
  }
}

// =============================================================================
// Focus Visible Wrapper
// =============================================================================

/// Widget that shows a visible focus indicator when focused via keyboard
class FocusVisible extends StatefulWidget {
  final Widget child;
  final Color? focusColor;
  final double borderRadius;

  const FocusVisible({
    super.key,
    required this.child,
    this.focusColor,
    this.borderRadius = 8,
  });

  @override
  State<FocusVisible> createState() => _FocusVisibleState();
}

class _FocusVisibleState extends State<FocusVisible> {
  bool _isFocused = false;

  @override
  Widget build(BuildContext context) {
    return Focus(
      onFocusChange: (focused) {
        setState(() => _isFocused = focused);
      },
      child: Container(
        decoration: _isFocused
            ? BoxDecoration(
                borderRadius: BorderRadius.circular(widget.borderRadius),
                boxShadow: [
                  BoxShadow(
                    color: widget.focusColor ?? Theme.of(context).primaryColor,
                    spreadRadius: 2,
                    blurRadius: 0,
                  ),
                ],
              )
            : null,
        child: widget.child,
      ),
    );
  }
}

// =============================================================================
// Screen Reader Announcer
// =============================================================================

/// Widget that announces its child's text to screen readers when it changes
class ScreenReaderAnnouncer extends StatefulWidget {
  final String message;
  final Widget child;
  final bool assertive;

  const ScreenReaderAnnouncer({
    super.key,
    required this.message,
    required this.child,
    this.assertive = false,
  });

  @override
  State<ScreenReaderAnnouncer> createState() => _ScreenReaderAnnouncerState();
}

class _ScreenReaderAnnouncerState extends State<ScreenReaderAnnouncer> {
  String? _lastMessage;

  @override
  void didUpdateWidget(ScreenReaderAnnouncer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.message != _lastMessage && widget.message.isNotEmpty) {
      _lastMessage = widget.message;
      AivoAccessibility.announce(widget.message, assertive: widget.assertive);
    }
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}

// =============================================================================
// High Contrast Theme
// =============================================================================

/// Generate a high contrast theme variant
ThemeData createHighContrastTheme(ThemeData baseTheme) {
  return baseTheme.copyWith(
    // Increase contrast for text
    textTheme: baseTheme.textTheme.apply(
      bodyColor: Colors.black,
      displayColor: Colors.black,
    ),
    // High contrast borders
    inputDecorationTheme: baseTheme.inputDecorationTheme.copyWith(
      border: const OutlineInputBorder(
        borderSide: BorderSide(color: Colors.black, width: 2),
      ),
      enabledBorder: const OutlineInputBorder(
        borderSide: BorderSide(color: Colors.black, width: 2),
      ),
      focusedBorder: const OutlineInputBorder(
        borderSide: BorderSide(color: Colors.blue, width: 3),
      ),
    ),
    // High contrast buttons
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
      ),
    ),
    // High contrast outlined buttons
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: Colors.black,
        side: const BorderSide(color: Colors.black, width: 2),
      ),
    ),
  );
}
