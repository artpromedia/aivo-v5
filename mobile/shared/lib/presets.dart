/// Sensory Profile Presets for AIVO v5
/// Pre-configured profiles for common neurodivergent needs

import 'sensory_profile.dart';

/// Preset profiles for common accommodation needs
class SensoryPresets {
  SensoryPresets._();

  /// Low sensory profile for autism spectrum - reduces visual/auditory stimulation
  static SensoryProfile asdLowSensory(String learnerId) => SensoryProfile(
        id: 'preset-asd-low-sensory',
        learnerId: learnerId,
        name: 'Low Sensory (ASD)',
        presetId: 'asd-low-sensory',
        visual: const VisualAccommodations(
          reduceAnimations: true,
          reduceMotion: true,
          reducedClutter: true,
          flashingContent: 'remove',
          colorScheme: 'cool',
        ),
        auditory: const AuditoryAccommodations(
          noBackgroundMusic: true,
          soundVolume: 0.5,
          noSoundEffects: false,
        ),
        motor: MotorAccommodations.defaults(),
        cognitive: const CognitiveAccommodations(
          oneThingAtATime: true,
          noPopups: true,
          breakReminders: true,
          breakFrequencyMinutes: 20,
          showProgressIndicator: true,
        ),
        environment: const EnvironmentAccommodations(
          minimizeDistractions: true,
          hideNotifications: true,
        ),
        triggers: const SensoryTriggers(
          avoidFlashing: true,
          avoidPatterns: true,
        ),
      );

  /// Focus-optimized profile for ADHD - maximizes concentration
  static SensoryProfile adhdFocus(String learnerId) => SensoryProfile(
        id: 'preset-adhd-focus',
        learnerId: learnerId,
        name: 'Focus Mode (ADHD)',
        presetId: 'adhd-focus',
        visual: const VisualAccommodations(
          reducedClutter: true,
          reduceAnimations: false, // Some animation can help engagement
        ),
        auditory: const AuditoryAccommodations(
          noBackgroundMusic: false, // Background music can help some with ADHD
          soundVolume: 0.7,
        ),
        motor: MotorAccommodations.defaults(),
        cognitive: const CognitiveAccommodations(
          breakReminders: true,
          breakFrequencyMinutes: 15,
          showProgressIndicator: true,
          oneThingAtATime: true,
          noPopups: true,
          limitChoices: 4, // Reduce decision fatigue
        ),
        environment: const EnvironmentAccommodations(
          minimizeDistractions: true,
          hideChat: true,
          hideNotifications: true,
          fullScreenMode: true,
        ),
      );

  /// Dyslexia-friendly profile - optimized for reading accessibility
  static SensoryProfile dyslexiaFriendly(String learnerId) => SensoryProfile(
        id: 'preset-dyslexia-friendly',
        learnerId: learnerId,
        name: 'Dyslexia Friendly',
        presetId: 'dyslexia-friendly',
        visual: const VisualAccommodations(
          fontFamily: 'dyslexic',
          lineSpacing: 'wide',
          fontSize: 'large',
          colorScheme: 'warm', // Warm colors reduce visual stress
        ),
        auditory: const AuditoryAccommodations(
          textToSpeechEnabled: true,
          textToSpeechSpeed: 0.9,
          audioDescriptions: true,
        ),
        motor: MotorAccommodations.defaults(),
        cognitive: const CognitiveAccommodations(
          extendedTime: true,
          timeMultiplier: 1.5,
          simplifyInstructions: true,
          showProgressIndicator: true,
        ),
        environment: EnvironmentAccommodations.defaults(),
      );

  /// High contrast profile for visual impairments
  static SensoryProfile highContrast(String learnerId) => SensoryProfile(
        id: 'preset-high-contrast',
        learnerId: learnerId,
        name: 'High Contrast',
        presetId: 'high-contrast',
        visual: const VisualAccommodations(
          highContrast: true,
          colorScheme: 'high-contrast',
          fontSize: 'large',
          lineSpacing: 'wide',
        ),
        auditory: const AuditoryAccommodations(
          textToSpeechEnabled: true,
          audioDescriptions: true,
        ),
        motor: const MotorAccommodations(
          largerClickTargets: true,
          increaseSpacing: true,
        ),
        cognitive: CognitiveAccommodations.defaults(),
        environment: EnvironmentAccommodations.defaults(),
      );

  /// Motor accessibility profile - for fine motor difficulties
  static SensoryProfile motorAccessibility(String learnerId) => SensoryProfile(
        id: 'preset-motor-accessibility',
        learnerId: learnerId,
        name: 'Motor Accessibility',
        presetId: 'motor-accessibility',
        visual: const VisualAccommodations(
          fontSize: 'large',
        ),
        auditory: AuditoryAccommodations.defaults(),
        motor: const MotorAccommodations(
          largerClickTargets: true,
          noDoubleClick: true,
          noDragAndDrop: true,
          increaseSpacing: true,
          touchAccommodations: true,
          hoverDelay: 500,
        ),
        cognitive: const CognitiveAccommodations(
          extendedTime: true,
          timeMultiplier: 1.5,
        ),
        environment: EnvironmentAccommodations.defaults(),
      );

  /// Anxiety-friendly profile - reduces overwhelming content
  static SensoryProfile anxietyFriendly(String learnerId) => SensoryProfile(
        id: 'preset-anxiety-friendly',
        learnerId: learnerId,
        name: 'Calm & Gentle',
        presetId: 'anxiety-friendly',
        visual: const VisualAccommodations(
          reduceAnimations: true,
          reducedClutter: true,
          colorScheme: 'cool',
          flashingContent: 'remove',
        ),
        auditory: const AuditoryAccommodations(
          soundVolume: 0.6,
          noSoundEffects: true,
        ),
        motor: MotorAccommodations.defaults(),
        cognitive: const CognitiveAccommodations(
          oneThingAtATime: true,
          noPopups: true,
          noAutoplay: true,
          breakReminders: true,
          breakFrequencyMinutes: 20,
          extendedTime: true,
          timeMultiplier: 1.25,
        ),
        environment: const EnvironmentAccommodations(
          minimizeDistractions: true,
          hideNotifications: true,
          whiteNoise: true,
        ),
      );

  /// Processing support profile - for slower processing speed
  static SensoryProfile processingSupport(String learnerId) => SensoryProfile(
        id: 'preset-processing-support',
        learnerId: learnerId,
        name: 'Processing Support',
        presetId: 'processing-support',
        visual: const VisualAccommodations(
          reducedClutter: true,
          fontSize: 'large',
          lineSpacing: 'wide',
        ),
        auditory: const AuditoryAccommodations(
          textToSpeechEnabled: true,
          textToSpeechSpeed: 0.8,
        ),
        motor: MotorAccommodations.defaults(),
        cognitive: const CognitiveAccommodations(
          oneThingAtATime: true,
          simplifyInstructions: true,
          extendedTime: true,
          timeMultiplier: 2.0,
          showProgressIndicator: true,
          limitChoices: 3,
          noAutoplay: true,
        ),
        environment: const EnvironmentAccommodations(
          minimizeDistractions: true,
        ),
      );

  /// Get all available presets
  static List<SensoryPresetInfo> getAllPresets() => [
        const SensoryPresetInfo(
          id: 'asd-low-sensory',
          name: 'Low Sensory (ASD)',
          description: 'Reduces visual and auditory stimulation for sensory-sensitive learners',
          emoji: '🧘',
          tags: ['autism', 'sensory', 'calm'],
        ),
        const SensoryPresetInfo(
          id: 'adhd-focus',
          name: 'Focus Mode (ADHD)',
          description: 'Minimizes distractions and includes regular break reminders',
          emoji: '🎯',
          tags: ['adhd', 'focus', 'breaks'],
        ),
        const SensoryPresetInfo(
          id: 'dyslexia-friendly',
          name: 'Dyslexia Friendly',
          description: 'Optimized fonts, spacing, and text-to-speech support',
          emoji: '📖',
          tags: ['dyslexia', 'reading', 'tts'],
        ),
        const SensoryPresetInfo(
          id: 'high-contrast',
          name: 'High Contrast',
          description: 'Enhanced visibility with high contrast colors and large text',
          emoji: '👁️',
          tags: ['visual', 'contrast', 'accessibility'],
        ),
        const SensoryPresetInfo(
          id: 'motor-accessibility',
          name: 'Motor Accessibility',
          description: 'Larger targets and no drag-and-drop for motor difficulties',
          emoji: '🤚',
          tags: ['motor', 'physical', 'accessibility'],
        ),
        const SensoryPresetInfo(
          id: 'anxiety-friendly',
          name: 'Calm & Gentle',
          description: 'Soothing experience with reduced stimulation for anxiety',
          emoji: '💜',
          tags: ['anxiety', 'calm', 'gentle'],
        ),
        const SensoryPresetInfo(
          id: 'processing-support',
          name: 'Processing Support',
          description: 'Extended time and simplified content for processing needs',
          emoji: '⏰',
          tags: ['processing', 'time', 'support'],
        ),
      ];

  /// Get preset profile by ID
  static SensoryProfile? getPreset(String presetId, String learnerId) {
    switch (presetId) {
      case 'asd-low-sensory':
        return asdLowSensory(learnerId);
      case 'adhd-focus':
        return adhdFocus(learnerId);
      case 'dyslexia-friendly':
        return dyslexiaFriendly(learnerId);
      case 'high-contrast':
        return highContrast(learnerId);
      case 'motor-accessibility':
        return motorAccessibility(learnerId);
      case 'anxiety-friendly':
        return anxietyFriendly(learnerId);
      case 'processing-support':
        return processingSupport(learnerId);
      default:
        return null;
    }
  }
}

/// Information about a sensory preset (for display in UI)
class SensoryPresetInfo {
  final String id;
  final String name;
  final String description;
  final String emoji;
  final List<String> tags;

  const SensoryPresetInfo({
    required this.id,
    required this.name,
    required this.description,
    required this.emoji,
    required this.tags,
  });

  factory SensoryPresetInfo.fromJson(Map<String, dynamic> json) {
    return SensoryPresetInfo(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      emoji: json['emoji'] as String? ?? '⚙️',
      tags: (json['tags'] as List<dynamic>?)?.cast<String>() ?? [],
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'description': description,
        'emoji': emoji,
        'tags': tags,
      };
}
