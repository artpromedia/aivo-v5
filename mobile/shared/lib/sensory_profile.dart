/// Sensory Profile System for AIVO v5
/// Provides comprehensive accommodation settings for neurodiverse learners

// ==================== Visual Accommodations ====================

class VisualAccommodations {
  final bool reduceAnimations;
  final bool reduceMotion;
  final bool highContrast;
  final bool darkMode;
  final bool reducedClutter;
  final String fontSize; // small, medium, large, extra-large
  final String fontFamily; // default, dyslexic, sans-serif
  final String lineSpacing; // normal, wide, extra-wide
  final String colorScheme; // default, warm, cool, high-contrast
  final String flashingContent; // allow, reduce, remove

  const VisualAccommodations({
    this.reduceAnimations = false,
    this.reduceMotion = false,
    this.highContrast = false,
    this.darkMode = false,
    this.reducedClutter = false,
    this.fontSize = 'medium',
    this.fontFamily = 'default',
    this.lineSpacing = 'normal',
    this.colorScheme = 'default',
    this.flashingContent = 'allow',
  });

  factory VisualAccommodations.defaults() => const VisualAccommodations();

  factory VisualAccommodations.fromJson(Map<String, dynamic> json) {
    return VisualAccommodations(
      reduceAnimations: json['reduceAnimations'] as bool? ?? false,
      reduceMotion: json['reduceMotion'] as bool? ?? false,
      highContrast: json['highContrast'] as bool? ?? false,
      darkMode: json['darkMode'] as bool? ?? false,
      reducedClutter: json['reducedClutter'] as bool? ?? false,
      fontSize: json['fontSize'] as String? ?? 'medium',
      fontFamily: json['fontFamily'] as String? ?? 'default',
      lineSpacing: json['lineSpacing'] as String? ?? 'normal',
      colorScheme: json['colorScheme'] as String? ?? 'default',
      flashingContent: json['flashingContent'] as String? ?? 'allow',
    );
  }

  Map<String, dynamic> toJson() => {
        'reduceAnimations': reduceAnimations,
        'reduceMotion': reduceMotion,
        'highContrast': highContrast,
        'darkMode': darkMode,
        'reducedClutter': reducedClutter,
        'fontSize': fontSize,
        'fontFamily': fontFamily,
        'lineSpacing': lineSpacing,
        'colorScheme': colorScheme,
        'flashingContent': flashingContent,
      };

  VisualAccommodations copyWith({
    bool? reduceAnimations,
    bool? reduceMotion,
    bool? highContrast,
    bool? darkMode,
    bool? reducedClutter,
    String? fontSize,
    String? fontFamily,
    String? lineSpacing,
    String? colorScheme,
    String? flashingContent,
  }) {
    return VisualAccommodations(
      reduceAnimations: reduceAnimations ?? this.reduceAnimations,
      reduceMotion: reduceMotion ?? this.reduceMotion,
      highContrast: highContrast ?? this.highContrast,
      darkMode: darkMode ?? this.darkMode,
      reducedClutter: reducedClutter ?? this.reducedClutter,
      fontSize: fontSize ?? this.fontSize,
      fontFamily: fontFamily ?? this.fontFamily,
      lineSpacing: lineSpacing ?? this.lineSpacing,
      colorScheme: colorScheme ?? this.colorScheme,
      flashingContent: flashingContent ?? this.flashingContent,
    );
  }
}

// ==================== Auditory Accommodations ====================

class AuditoryAccommodations {
  final bool muteAllSounds;
  final double soundVolume; // 0.0 - 1.0
  final bool noBackgroundMusic;
  final bool noSoundEffects;
  final bool textToSpeechEnabled;
  final double textToSpeechSpeed; // 0.5 - 2.0
  final String textToSpeechVoice; // male, female
  final bool audioDescriptions;

  const AuditoryAccommodations({
    this.muteAllSounds = false,
    this.soundVolume = 1.0,
    this.noBackgroundMusic = false,
    this.noSoundEffects = false,
    this.textToSpeechEnabled = false,
    this.textToSpeechSpeed = 1.0,
    this.textToSpeechVoice = 'female',
    this.audioDescriptions = false,
  });

  factory AuditoryAccommodations.defaults() => const AuditoryAccommodations();

  factory AuditoryAccommodations.fromJson(Map<String, dynamic> json) {
    return AuditoryAccommodations(
      muteAllSounds: json['muteAllSounds'] as bool? ?? false,
      soundVolume: (json['soundVolume'] as num?)?.toDouble() ?? 1.0,
      noBackgroundMusic: json['noBackgroundMusic'] as bool? ?? false,
      noSoundEffects: json['noSoundEffects'] as bool? ?? false,
      textToSpeechEnabled: json['textToSpeechEnabled'] as bool? ?? false,
      textToSpeechSpeed: (json['textToSpeechSpeed'] as num?)?.toDouble() ?? 1.0,
      textToSpeechVoice: json['textToSpeechVoice'] as String? ?? 'female',
      audioDescriptions: json['audioDescriptions'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'muteAllSounds': muteAllSounds,
        'soundVolume': soundVolume,
        'noBackgroundMusic': noBackgroundMusic,
        'noSoundEffects': noSoundEffects,
        'textToSpeechEnabled': textToSpeechEnabled,
        'textToSpeechSpeed': textToSpeechSpeed,
        'textToSpeechVoice': textToSpeechVoice,
        'audioDescriptions': audioDescriptions,
      };

  AuditoryAccommodations copyWith({
    bool? muteAllSounds,
    double? soundVolume,
    bool? noBackgroundMusic,
    bool? noSoundEffects,
    bool? textToSpeechEnabled,
    double? textToSpeechSpeed,
    String? textToSpeechVoice,
    bool? audioDescriptions,
  }) {
    return AuditoryAccommodations(
      muteAllSounds: muteAllSounds ?? this.muteAllSounds,
      soundVolume: soundVolume ?? this.soundVolume,
      noBackgroundMusic: noBackgroundMusic ?? this.noBackgroundMusic,
      noSoundEffects: noSoundEffects ?? this.noSoundEffects,
      textToSpeechEnabled: textToSpeechEnabled ?? this.textToSpeechEnabled,
      textToSpeechSpeed: textToSpeechSpeed ?? this.textToSpeechSpeed,
      textToSpeechVoice: textToSpeechVoice ?? this.textToSpeechVoice,
      audioDescriptions: audioDescriptions ?? this.audioDescriptions,
    );
  }
}

// ==================== Motor Accommodations ====================

class MotorAccommodations {
  final bool largerClickTargets;
  final bool noDoubleClick;
  final bool noDragAndDrop;
  final bool increaseSpacing;
  final bool touchAccommodations;
  final int hoverDelay; // milliseconds

  const MotorAccommodations({
    this.largerClickTargets = false,
    this.noDoubleClick = false,
    this.noDragAndDrop = false,
    this.increaseSpacing = false,
    this.touchAccommodations = false,
    this.hoverDelay = 0,
  });

  factory MotorAccommodations.defaults() => const MotorAccommodations();

  factory MotorAccommodations.fromJson(Map<String, dynamic> json) {
    return MotorAccommodations(
      largerClickTargets: json['largerClickTargets'] as bool? ?? false,
      noDoubleClick: json['noDoubleClick'] as bool? ?? false,
      noDragAndDrop: json['noDragAndDrop'] as bool? ?? false,
      increaseSpacing: json['increaseSpacing'] as bool? ?? false,
      touchAccommodations: json['touchAccommodations'] as bool? ?? false,
      hoverDelay: json['hoverDelay'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'largerClickTargets': largerClickTargets,
        'noDoubleClick': noDoubleClick,
        'noDragAndDrop': noDragAndDrop,
        'increaseSpacing': increaseSpacing,
        'touchAccommodations': touchAccommodations,
        'hoverDelay': hoverDelay,
      };

  MotorAccommodations copyWith({
    bool? largerClickTargets,
    bool? noDoubleClick,
    bool? noDragAndDrop,
    bool? increaseSpacing,
    bool? touchAccommodations,
    int? hoverDelay,
  }) {
    return MotorAccommodations(
      largerClickTargets: largerClickTargets ?? this.largerClickTargets,
      noDoubleClick: noDoubleClick ?? this.noDoubleClick,
      noDragAndDrop: noDragAndDrop ?? this.noDragAndDrop,
      increaseSpacing: increaseSpacing ?? this.increaseSpacing,
      touchAccommodations: touchAccommodations ?? this.touchAccommodations,
      hoverDelay: hoverDelay ?? this.hoverDelay,
    );
  }
}

// ==================== Cognitive Accommodations ====================

class CognitiveAccommodations {
  final bool oneThingAtATime;
  final bool noPopups;
  final bool noAutoplay;
  final bool simplifyInstructions;
  final bool showProgressIndicator;
  final int limitChoices; // 0 = no limit
  final bool extendedTime;
  final double timeMultiplier; // 1.0, 1.5, 2.0
  final bool breakReminders;
  final int breakFrequencyMinutes;

  const CognitiveAccommodations({
    this.oneThingAtATime = false,
    this.noPopups = false,
    this.noAutoplay = false,
    this.simplifyInstructions = false,
    this.showProgressIndicator = true,
    this.limitChoices = 0,
    this.extendedTime = false,
    this.timeMultiplier = 1.0,
    this.breakReminders = false,
    this.breakFrequencyMinutes = 25,
  });

  factory CognitiveAccommodations.defaults() => const CognitiveAccommodations();

  factory CognitiveAccommodations.fromJson(Map<String, dynamic> json) {
    return CognitiveAccommodations(
      oneThingAtATime: json['oneThingAtATime'] as bool? ?? false,
      noPopups: json['noPopups'] as bool? ?? false,
      noAutoplay: json['noAutoplay'] as bool? ?? false,
      simplifyInstructions: json['simplifyInstructions'] as bool? ?? false,
      showProgressIndicator: json['showProgressIndicator'] as bool? ?? true,
      limitChoices: json['limitChoices'] as int? ?? 0,
      extendedTime: json['extendedTime'] as bool? ?? false,
      timeMultiplier: (json['timeMultiplier'] as num?)?.toDouble() ?? 1.0,
      breakReminders: json['breakReminders'] as bool? ?? false,
      breakFrequencyMinutes: json['breakFrequencyMinutes'] as int? ?? 25,
    );
  }

  Map<String, dynamic> toJson() => {
        'oneThingAtATime': oneThingAtATime,
        'noPopups': noPopups,
        'noAutoplay': noAutoplay,
        'simplifyInstructions': simplifyInstructions,
        'showProgressIndicator': showProgressIndicator,
        'limitChoices': limitChoices,
        'extendedTime': extendedTime,
        'timeMultiplier': timeMultiplier,
        'breakReminders': breakReminders,
        'breakFrequencyMinutes': breakFrequencyMinutes,
      };

  CognitiveAccommodations copyWith({
    bool? oneThingAtATime,
    bool? noPopups,
    bool? noAutoplay,
    bool? simplifyInstructions,
    bool? showProgressIndicator,
    int? limitChoices,
    bool? extendedTime,
    double? timeMultiplier,
    bool? breakReminders,
    int? breakFrequencyMinutes,
  }) {
    return CognitiveAccommodations(
      oneThingAtATime: oneThingAtATime ?? this.oneThingAtATime,
      noPopups: noPopups ?? this.noPopups,
      noAutoplay: noAutoplay ?? this.noAutoplay,
      simplifyInstructions: simplifyInstructions ?? this.simplifyInstructions,
      showProgressIndicator: showProgressIndicator ?? this.showProgressIndicator,
      limitChoices: limitChoices ?? this.limitChoices,
      extendedTime: extendedTime ?? this.extendedTime,
      timeMultiplier: timeMultiplier ?? this.timeMultiplier,
      breakReminders: breakReminders ?? this.breakReminders,
      breakFrequencyMinutes: breakFrequencyMinutes ?? this.breakFrequencyMinutes,
    );
  }
}

// ==================== Environment Accommodations ====================

class EnvironmentAccommodations {
  final bool fullScreenMode;
  final bool minimizeDistractions;
  final bool hideChat;
  final bool hideNotifications;
  final bool whiteNoise;

  const EnvironmentAccommodations({
    this.fullScreenMode = false,
    this.minimizeDistractions = false,
    this.hideChat = false,
    this.hideNotifications = false,
    this.whiteNoise = false,
  });

  factory EnvironmentAccommodations.defaults() => const EnvironmentAccommodations();

  factory EnvironmentAccommodations.fromJson(Map<String, dynamic> json) {
    return EnvironmentAccommodations(
      fullScreenMode: json['fullScreenMode'] as bool? ?? false,
      minimizeDistractions: json['minimizeDistractions'] as bool? ?? false,
      hideChat: json['hideChat'] as bool? ?? false,
      hideNotifications: json['hideNotifications'] as bool? ?? false,
      whiteNoise: json['whiteNoise'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'fullScreenMode': fullScreenMode,
        'minimizeDistractions': minimizeDistractions,
        'hideChat': hideChat,
        'hideNotifications': hideNotifications,
        'whiteNoise': whiteNoise,
      };

  EnvironmentAccommodations copyWith({
    bool? fullScreenMode,
    bool? minimizeDistractions,
    bool? hideChat,
    bool? hideNotifications,
    bool? whiteNoise,
  }) {
    return EnvironmentAccommodations(
      fullScreenMode: fullScreenMode ?? this.fullScreenMode,
      minimizeDistractions: minimizeDistractions ?? this.minimizeDistractions,
      hideChat: hideChat ?? this.hideChat,
      hideNotifications: hideNotifications ?? this.hideNotifications,
      whiteNoise: whiteNoise ?? this.whiteNoise,
    );
  }
}

// ==================== Sensory Triggers ====================

class SensoryTriggers {
  final List<String> avoidColors;
  final bool avoidPatterns;
  final bool avoidFlashing;
  final List<String> contentWarnings;

  const SensoryTriggers({
    this.avoidColors = const [],
    this.avoidPatterns = false,
    this.avoidFlashing = false,
    this.contentWarnings = const [],
  });

  factory SensoryTriggers.defaults() => const SensoryTriggers();

  factory SensoryTriggers.fromJson(Map<String, dynamic> json) {
    return SensoryTriggers(
      avoidColors: (json['avoidColors'] as List<dynamic>?)?.cast<String>() ?? [],
      avoidPatterns: json['avoidPatterns'] as bool? ?? false,
      avoidFlashing: json['avoidFlashing'] as bool? ?? false,
      contentWarnings: (json['contentWarnings'] as List<dynamic>?)?.cast<String>() ?? [],
    );
  }

  Map<String, dynamic> toJson() => {
        'avoidColors': avoidColors,
        'avoidPatterns': avoidPatterns,
        'avoidFlashing': avoidFlashing,
        'contentWarnings': contentWarnings,
      };

  SensoryTriggers copyWith({
    List<String>? avoidColors,
    bool? avoidPatterns,
    bool? avoidFlashing,
    List<String>? contentWarnings,
  }) {
    return SensoryTriggers(
      avoidColors: avoidColors ?? this.avoidColors,
      avoidPatterns: avoidPatterns ?? this.avoidPatterns,
      avoidFlashing: avoidFlashing ?? this.avoidFlashing,
      contentWarnings: contentWarnings ?? this.contentWarnings,
    );
  }
}

// ==================== Main Sensory Profile ====================

class SensoryProfile {
  final String id;
  final String learnerId;
  final String? name;
  final String? presetId; // e.g., "asd-low-sensory", "adhd-focus"
  final VisualAccommodations visual;
  final AuditoryAccommodations auditory;
  final MotorAccommodations motor;
  final CognitiveAccommodations cognitive;
  final EnvironmentAccommodations environment;
  final SensoryTriggers? triggers;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const SensoryProfile({
    required this.id,
    required this.learnerId,
    this.name,
    this.presetId,
    required this.visual,
    required this.auditory,
    required this.motor,
    required this.cognitive,
    required this.environment,
    this.triggers,
    this.createdAt,
    this.updatedAt,
  });

  factory SensoryProfile.defaultProfile(String learnerId) {
    return SensoryProfile(
      id: 'default',
      learnerId: learnerId,
      name: 'Default',
      visual: VisualAccommodations.defaults(),
      auditory: AuditoryAccommodations.defaults(),
      motor: MotorAccommodations.defaults(),
      cognitive: CognitiveAccommodations.defaults(),
      environment: EnvironmentAccommodations.defaults(),
      triggers: SensoryTriggers.defaults(),
    );
  }

  factory SensoryProfile.fromJson(Map<String, dynamic> json) {
    return SensoryProfile(
      id: json['id'] as String,
      learnerId: json['learnerId'] as String,
      name: json['name'] as String?,
      presetId: json['presetId'] as String?,
      visual: json['visual'] != null
          ? VisualAccommodations.fromJson(json['visual'] as Map<String, dynamic>)
          : VisualAccommodations.defaults(),
      auditory: json['auditory'] != null
          ? AuditoryAccommodations.fromJson(json['auditory'] as Map<String, dynamic>)
          : AuditoryAccommodations.defaults(),
      motor: json['motor'] != null
          ? MotorAccommodations.fromJson(json['motor'] as Map<String, dynamic>)
          : MotorAccommodations.defaults(),
      cognitive: json['cognitive'] != null
          ? CognitiveAccommodations.fromJson(json['cognitive'] as Map<String, dynamic>)
          : CognitiveAccommodations.defaults(),
      environment: json['environment'] != null
          ? EnvironmentAccommodations.fromJson(json['environment'] as Map<String, dynamic>)
          : EnvironmentAccommodations.defaults(),
      triggers: json['triggers'] != null
          ? SensoryTriggers.fromJson(json['triggers'] as Map<String, dynamic>)
          : null,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt'] as String) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt'] as String) : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'learnerId': learnerId,
        if (name != null) 'name': name,
        if (presetId != null) 'presetId': presetId,
        'visual': visual.toJson(),
        'auditory': auditory.toJson(),
        'motor': motor.toJson(),
        'cognitive': cognitive.toJson(),
        'environment': environment.toJson(),
        if (triggers != null) 'triggers': triggers!.toJson(),
        if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
        if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
      };

  SensoryProfile copyWith({
    String? id,
    String? learnerId,
    String? name,
    String? presetId,
    VisualAccommodations? visual,
    AuditoryAccommodations? auditory,
    MotorAccommodations? motor,
    CognitiveAccommodations? cognitive,
    EnvironmentAccommodations? environment,
    SensoryTriggers? triggers,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return SensoryProfile(
      id: id ?? this.id,
      learnerId: learnerId ?? this.learnerId,
      name: name ?? this.name,
      presetId: presetId ?? this.presetId,
      visual: visual ?? this.visual,
      auditory: auditory ?? this.auditory,
      motor: motor ?? this.motor,
      cognitive: cognitive ?? this.cognitive,
      environment: environment ?? this.environment,
      triggers: triggers ?? this.triggers,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

// ==================== Sensory Preset ====================

class SensoryPreset {
  final String id;
  final String name;
  final String description;
  final String emoji;
  final List<String> tags;
  final SensoryProfile profile;

  const SensoryPreset({
    required this.id,
    required this.name,
    required this.description,
    required this.emoji,
    required this.tags,
    required this.profile,
  });

  factory SensoryPreset.fromJson(Map<String, dynamic> json) {
    return SensoryPreset(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      emoji: json['emoji'] as String? ?? '⚙️',
      tags: (json['tags'] as List<dynamic>?)?.cast<String>() ?? [],
      profile: SensoryProfile.fromJson(json['profile'] as Map<String, dynamic>),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'description': description,
        'emoji': emoji,
        'tags': tags,
        'profile': profile.toJson(),
      };
}
