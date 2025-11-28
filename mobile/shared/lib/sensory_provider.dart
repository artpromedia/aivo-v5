/// Sensory Provider - InheritedWidget for applying sensory accommodations throughout the app
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'sensory_profile.dart';
import 'presets.dart';

/// InheritedWidget that provides sensory settings throughout the app
class SensoryProvider extends InheritedWidget {
  final SensoryProfile profile;
  final Function(SensoryProfile) onUpdate;
  final bool isLoading;

  const SensoryProvider({
    super.key,
    required this.profile,
    required this.onUpdate,
    this.isLoading = false,
    required super.child,
  });

  static SensoryProvider? maybeOf(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<SensoryProvider>();
  }

  static SensoryProvider of(BuildContext context) {
    final provider = maybeOf(context);
    assert(provider != null, 'No SensoryProvider found in context');
    return provider!;
  }

  @override
  bool updateShouldNotify(SensoryProvider oldWidget) {
    return profile != oldWidget.profile || isLoading != oldWidget.isLoading;
  }

  // ==================== Text Style Helpers ====================

  /// Apply sensory accommodations to a text style
  TextStyle applyTextStyle(TextStyle base) {
    double fontSize = base.fontSize ?? 14;
    double letterSpacing = base.letterSpacing ?? 0;
    double height = base.height ?? 1.4;
    String? fontFamily = base.fontFamily;

    // Apply font size
    switch (profile.visual.fontSize) {
      case 'small':
        fontSize *= 0.9;
        break;
      case 'large':
        fontSize *= 1.2;
        break;
      case 'extra-large':
        fontSize *= 1.4;
        break;
      default: // medium
        break;
    }

    // Apply font family
    switch (profile.visual.fontFamily) {
      case 'dyslexic':
        fontFamily = 'OpenDyslexic';
        letterSpacing = 0.5;
        break;
      case 'sans-serif':
        fontFamily = 'Roboto';
        break;
      default:
        break;
    }

    // Apply line spacing
    switch (profile.visual.lineSpacing) {
      case 'wide':
        height = 1.8;
        break;
      case 'extra-wide':
        height = 2.2;
        break;
      default:
        break;
    }

    return base.copyWith(
      fontSize: fontSize,
      fontFamily: fontFamily,
      letterSpacing: letterSpacing,
      height: height,
    );
  }

  /// Get the font size multiplier
  double get fontSizeMultiplier {
    switch (profile.visual.fontSize) {
      case 'small':
        return 0.9;
      case 'large':
        return 1.2;
      case 'extra-large':
        return 1.4;
      default:
        return 1.0;
    }
  }

  // ==================== Animation Helpers ====================

  /// Get animation duration adjusted for sensory preferences
  Duration getAnimationDuration(Duration base) {
    if (profile.visual.reduceMotion || profile.visual.reduceAnimations) {
      return Duration.zero;
    }
    return base;
  }

  /// Get animation duration in milliseconds
  int getAnimationMs(int baseMs) {
    if (profile.visual.reduceMotion || profile.visual.reduceAnimations) {
      return 0;
    }
    return baseMs;
  }

  /// Check if animations should be shown
  bool get shouldAnimate => !profile.visual.reduceAnimations && !profile.visual.reduceMotion;

  /// Check if motion should be shown
  bool get shouldShowMotion => !profile.visual.reduceMotion;

  // ==================== Element Visibility Helpers ====================

  /// Check if a specific element type should be shown
  bool shouldShowElement(String elementType) {
    switch (elementType) {
      case 'animation':
        return shouldAnimate;
      case 'popup':
        return !profile.cognitive.noPopups;
      case 'autoplay':
        return !profile.cognitive.noAutoplay;
      case 'chat':
        return !profile.environment.hideChat;
      case 'notification':
        return !profile.environment.hideNotifications;
      case 'background-music':
        return !profile.auditory.noBackgroundMusic && !profile.auditory.muteAllSounds;
      case 'sound-effect':
        return !profile.auditory.noSoundEffects && !profile.auditory.muteAllSounds;
      case 'flashing':
        return profile.visual.flashingContent == 'allow';
      case 'pattern':
        return profile.triggers?.avoidPatterns != true;
      default:
        return true;
    }
  }

  // ==================== Spacing Helpers ====================

  /// Get adjusted spacing based on motor accommodations
  EdgeInsets getSpacing(EdgeInsets base) {
    if (profile.motor.increaseSpacing) {
      return EdgeInsets.only(
        left: base.left * 1.5,
        top: base.top * 1.5,
        right: base.right * 1.5,
        bottom: base.bottom * 1.5,
      );
    }
    return base;
  }

  /// Get spacing multiplier
  double get spacingMultiplier => profile.motor.increaseSpacing ? 1.5 : 1.0;

  // ==================== Touch Target Helpers ====================

  /// Get minimum touch target size
  double get minTouchTargetSize => profile.motor.largerClickTargets ? 56.0 : 48.0;

  /// Get button minimum height
  double get buttonMinHeight => profile.motor.largerClickTargets ? 56.0 : 48.0;

  // ==================== Time Helpers ====================

  /// Get time with multiplier applied
  Duration getAdjustedTime(Duration base) {
    if (profile.cognitive.extendedTime) {
      return Duration(
        milliseconds: (base.inMilliseconds * profile.cognitive.timeMultiplier).round(),
      );
    }
    return base;
  }

  /// Get time multiplier
  double get timeMultiplier =>
      profile.cognitive.extendedTime ? profile.cognitive.timeMultiplier : 1.0;

  // ==================== Audio Helpers ====================

  /// Get effective sound volume
  double get effectiveSoundVolume =>
      profile.auditory.muteAllSounds ? 0.0 : profile.auditory.soundVolume;

  /// Check if TTS is enabled
  bool get isTTSEnabled => profile.auditory.textToSpeechEnabled;

  /// Get TTS speed
  double get ttsSpeed => profile.auditory.textToSpeechSpeed;

  // ==================== Color Scheme Helpers ====================

  /// Get color scheme name
  String get colorScheme => profile.visual.colorScheme;

  /// Check if dark mode is enabled
  bool get isDarkMode => profile.visual.darkMode;

  /// Check if high contrast is enabled
  bool get isHighContrast => profile.visual.highContrast;

  // ==================== Break Reminder Helpers ====================

  /// Check if break reminders are enabled
  bool get breakRemindersEnabled => profile.cognitive.breakReminders;

  /// Get break frequency in minutes
  int get breakFrequencyMinutes => profile.cognitive.breakFrequencyMinutes;

  // ==================== Content Helpers ====================

  /// Check if content should be simplified
  bool get simplifyContent => profile.cognitive.simplifyInstructions;

  /// Get maximum number of choices (0 = unlimited)
  int get maxChoices => profile.cognitive.limitChoices;

  /// Check if progress indicator should be shown
  bool get showProgress => profile.cognitive.showProgressIndicator;

  /// Check if one-thing-at-a-time mode is enabled
  bool get oneAtATime => profile.cognitive.oneThingAtATime;
}

/// Stateful wrapper widget that manages sensory profile state
class SensoryProfileWrapper extends StatefulWidget {
  final String learnerId;
  final Widget child;
  final SensoryProfile? initialProfile;

  const SensoryProfileWrapper({
    super.key,
    required this.learnerId,
    required this.child,
    this.initialProfile,
  });

  @override
  State<SensoryProfileWrapper> createState() => _SensoryProfileWrapperState();
}

class _SensoryProfileWrapperState extends State<SensoryProfileWrapper> {
  late SensoryProfile _profile;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _profile = widget.initialProfile ?? SensoryProfile.defaultProfile(widget.learnerId);
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final json = prefs.getString('sensory_profile_${widget.learnerId}');
      if (json != null) {
        setState(() {
          _profile = SensoryProfile.fromJson(jsonDecode(json) as Map<String, dynamic>);
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _updateProfile(SensoryProfile profile) async {
    setState(() => _profile = profile);

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(
        'sensory_profile_${widget.learnerId}',
        jsonEncode(profile.toJson()),
      );
    } catch (e) {
      // Handle error silently for now
    }
  }

  @override
  Widget build(BuildContext context) {
    return SensoryProvider(
      profile: _profile,
      onUpdate: _updateProfile,
      isLoading: _isLoading,
      child: widget.child,
    );
  }
}

/// Extension methods for BuildContext to easily access sensory settings
extension SensoryContextExtension on BuildContext {
  /// Get the sensory provider
  SensoryProvider get sensory => SensoryProvider.of(this);

  /// Get the sensory profile
  SensoryProfile get sensoryProfile => SensoryProvider.of(this).profile;

  /// Check if animations should be shown
  bool get shouldAnimate => SensoryProvider.of(this).shouldAnimate;

  /// Apply sensory text style
  TextStyle applySensoryTextStyle(TextStyle base) =>
      SensoryProvider.of(this).applyTextStyle(base);

  /// Get adjusted spacing
  EdgeInsets getSensorySpacing(EdgeInsets base) =>
      SensoryProvider.of(this).getSpacing(base);

  /// Get adjusted animation duration
  Duration getSensoryAnimationDuration(Duration base) =>
      SensoryProvider.of(this).getAnimationDuration(base);
}

/// Widget that applies sensory text style to its child
class SensoryText extends StatelessWidget {
  final String text;
  final TextStyle? style;
  final TextAlign? textAlign;
  final int? maxLines;
  final TextOverflow? overflow;

  const SensoryText(
    this.text, {
    super.key,
    this.style,
    this.textAlign,
    this.maxLines,
    this.overflow,
  });

  @override
  Widget build(BuildContext context) {
    final sensory = SensoryProvider.of(context);
    final baseStyle = style ?? DefaultTextStyle.of(context).style;

    return Text(
      text,
      style: sensory.applyTextStyle(baseStyle),
      textAlign: textAlign,
      maxLines: maxLines,
      overflow: overflow,
    );
  }
}

/// Widget that respects reduced animation settings
class SensoryAnimatedContainer extends StatelessWidget {
  final Widget child;
  final Duration duration;
  final Curve curve;
  final double? width;
  final double? height;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final Decoration? decoration;
  final AlignmentGeometry? alignment;

  const SensoryAnimatedContainer({
    super.key,
    required this.child,
    this.duration = const Duration(milliseconds: 300),
    this.curve = Curves.easeInOut,
    this.width,
    this.height,
    this.padding,
    this.margin,
    this.decoration,
    this.alignment,
  });

  @override
  Widget build(BuildContext context) {
    final sensory = SensoryProvider.of(context);
    final effectiveDuration = sensory.getAnimationDuration(duration);

    return AnimatedContainer(
      duration: effectiveDuration,
      curve: curve,
      width: width,
      height: height,
      padding: padding,
      margin: margin,
      decoration: decoration,
      alignment: alignment,
      child: child,
    );
  }
}

/// Widget that provides larger touch targets when needed
class SensoryTouchTarget extends StatelessWidget {
  final Widget child;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;

  const SensoryTouchTarget({
    super.key,
    required this.child,
    this.onTap,
    this.onLongPress,
  });

  @override
  Widget build(BuildContext context) {
    final sensory = SensoryProvider.of(context);

    return GestureDetector(
      onTap: onTap,
      onLongPress: onLongPress,
      child: ConstrainedBox(
        constraints: BoxConstraints(
          minWidth: sensory.minTouchTargetSize,
          minHeight: sensory.minTouchTargetSize,
        ),
        child: child,
      ),
    );
  }
}
