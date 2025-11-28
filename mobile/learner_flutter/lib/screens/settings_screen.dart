import 'package:flutter/material.dart';
import 'package:aivo_shared/aivo_shared.dart';

/// Comprehensive settings screen with tabbed sections for sensory accommodations
class SettingsScreen extends StatefulWidget {
  final String learnerId;
  final SensoryProfile? initialProfile;

  const SettingsScreen({
    super.key,
    required this.learnerId,
    this.initialProfile,
  });

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late SensoryProfile _profile;
  bool _isLoading = false;
  bool _hasChanges = false;
  String? _errorMessage;

  final List<_SettingsTab> _tabs = [
    _SettingsTab(
      label: 'Visual',
      icon: Icons.visibility,
      description: 'Colors, animations, fonts',
    ),
    _SettingsTab(
      label: 'Auditory',
      icon: Icons.hearing,
      description: 'Sounds, volume, speech',
    ),
    _SettingsTab(
      label: 'Motor',
      icon: Icons.touch_app,
      description: 'Touch targets, gestures',
    ),
    _SettingsTab(
      label: 'Cognitive',
      icon: Icons.psychology,
      description: 'Pacing, focus, breaks',
    ),
    _SettingsTab(
      label: 'Environment',
      icon: Icons.landscape,
      description: 'Distractions, fullscreen',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _profile = widget.initialProfile ?? SensoryProfile.defaults(widget.learnerId);
    _loadProfile();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadProfile() async {
    // Try to load from provider first
    final provider = SensoryProvider.maybeOf(context);
    if (provider != null) {
      setState(() {
        _profile = provider.profile;
      });
      return;
    }

    // Otherwise load from storage
    setState(() => _isLoading = true);
    try {
      final loaded = await SensoryProfileWrapper.loadProfile(widget.learnerId);
      if (loaded != null) {
        setState(() => _profile = loaded);
      }
    } catch (e) {
      setState(() => _errorMessage = 'Failed to load settings');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _updateProfile(SensoryProfile newProfile) {
    setState(() {
      _profile = newProfile;
      _hasChanges = true;
    });
  }

  Future<void> _saveProfile() async {
    setState(() => _isLoading = true);
    try {
      // Save locally
      await SensoryProfileWrapper.saveProfile(_profile);
      
      // Update provider if available
      final wrapper = context.findAncestorStateOfType<SensoryProfileWrapperState>();
      wrapper?.updateProfile(_profile);
      
      setState(() => _hasChanges = false);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Settings saved'),
            backgroundColor: AivoTheme.calmGreen,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      setState(() => _errorMessage = 'Failed to save settings');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _applyPreset(SensoryPreset preset) async {
    final profile = preset.toProfile(widget.learnerId);
    _updateProfile(profile);
    
    // Show confirmation
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Applied "${preset.name}" preset'),
          backgroundColor: AivoTheme.primaryPurple,
          behavior: SnackBarBehavior.floating,
          action: SnackBarAction(
            label: 'Save',
            textColor: Colors.white,
            onPressed: _saveProfile,
          ),
        ),
      );
    }
  }

  void _showPresetPicker() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _PresetPickerSheet(
        onPresetSelected: _applyPreset,
      ),
    );
  }

  Future<bool> _onWillPop() async {
    if (!_hasChanges) return true;

    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Unsaved Changes'),
        content: const Text(
          'You have unsaved changes. Would you like to save them before leaving?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Discard'),
          ),
          TextButton(
            onPressed: () async {
              await _saveProfile();
              if (context.mounted) Navigator.pop(context, true);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );

    return result ?? false;
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Accessibility Settings'),
          backgroundColor: AivoTheme.primaryPurple,
          foregroundColor: Colors.white,
          actions: [
            IconButton(
              icon: const Icon(Icons.auto_awesome),
              tooltip: 'Apply Preset',
              onPressed: _showPresetPicker,
            ),
            if (_hasChanges)
              TextButton(
                onPressed: _isLoading ? null : _saveProfile,
                child: _isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text(
                        'Save',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
              ),
          ],
          bottom: TabBar(
            controller: _tabController,
            isScrollable: true,
            indicatorColor: Colors.white,
            tabs: _tabs.map((tab) => Tab(
              icon: Icon(tab.icon),
              text: tab.label,
            )).toList(),
          ),
        ),
        body: _isLoading && _profile.learnerId.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : TabBarView(
                controller: _tabController,
                children: [
                  _VisualSettingsTab(
                    accommodations: _profile.visual,
                    onChanged: (visual) => _updateProfile(
                      _profile.copyWith(visual: visual),
                    ),
                  ),
                  _AuditorySettingsTab(
                    accommodations: _profile.auditory,
                    onChanged: (auditory) => _updateProfile(
                      _profile.copyWith(auditory: auditory),
                    ),
                  ),
                  _MotorSettingsTab(
                    accommodations: _profile.motor,
                    onChanged: (motor) => _updateProfile(
                      _profile.copyWith(motor: motor),
                    ),
                  ),
                  _CognitiveSettingsTab(
                    accommodations: _profile.cognitive,
                    onChanged: (cognitive) => _updateProfile(
                      _profile.copyWith(cognitive: cognitive),
                    ),
                  ),
                  _EnvironmentSettingsTab(
                    accommodations: _profile.environment,
                    onChanged: (environment) => _updateProfile(
                      _profile.copyWith(environment: environment),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

// ==================== Tab Data ====================

class _SettingsTab {
  final String label;
  final IconData icon;
  final String description;

  const _SettingsTab({
    required this.label,
    required this.icon,
    required this.description,
  });
}

// ==================== Visual Settings Tab ====================

class _VisualSettingsTab extends StatelessWidget {
  final VisualAccommodations accommodations;
  final ValueChanged<VisualAccommodations> onChanged;

  const _VisualSettingsTab({
    required this.accommodations,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _SectionHeader(
          title: 'Display',
          icon: Icons.monitor,
        ),
        _SettingsTile(
          title: 'Reduce Animations',
          subtitle: 'Minimize motion and transitions',
          icon: Icons.animation,
          trailing: Switch(
            value: accommodations.reduceAnimations,
            onChanged: (value) => onChanged(
              accommodations.copyWith(reduceAnimations: value),
            ),
          ),
        ),
        _SettingsTile(
          title: 'High Contrast Mode',
          subtitle: 'Increase color contrast for better visibility',
          icon: Icons.contrast,
          trailing: Switch(
            value: accommodations.highContrast,
            onChanged: (value) => onChanged(
              accommodations.copyWith(highContrast: value),
            ),
          ),
        ),
        _SettingsTile(
          title: 'Dark Mode',
          subtitle: 'Use dark colors to reduce eye strain',
          icon: Icons.dark_mode,
          trailing: Switch(
            value: accommodations.preferDarkMode,
            onChanged: (value) => onChanged(
              accommodations.copyWith(preferDarkMode: value),
            ),
          ),
        ),
        const Divider(height: 32),
        _SectionHeader(
          title: 'Text',
          icon: Icons.text_fields,
        ),
        _SettingsTile(
          title: 'Font Size',
          subtitle: 'Adjust text size: ${(accommodations.fontSizeMultiplier * 100).round()}%',
          icon: Icons.format_size,
          trailing: SizedBox(
            width: 160,
            child: Slider(
              value: accommodations.fontSizeMultiplier,
              min: 0.75,
              max: 2.0,
              divisions: 25,
              label: '${(accommodations.fontSizeMultiplier * 100).round()}%',
              onChanged: (value) => onChanged(
                accommodations.copyWith(fontSizeMultiplier: value),
              ),
            ),
          ),
        ),
        _SettingsTile(
          title: 'Font Family',
          subtitle: accommodations.preferredFontFamily ?? 'System default',
          icon: Icons.font_download,
          trailing: DropdownButton<String?>(
            value: accommodations.preferredFontFamily,
            underline: const SizedBox(),
            items: const [
              DropdownMenuItem(value: null, child: Text('Default')),
              DropdownMenuItem(value: 'OpenDyslexic', child: Text('OpenDyslexic')),
              DropdownMenuItem(value: 'Lexie Readable', child: Text('Lexie Readable')),
              DropdownMenuItem(value: 'Comic Sans MS', child: Text('Comic Sans')),
              DropdownMenuItem(value: 'Arial', child: Text('Arial')),
            ],
            onChanged: (value) => onChanged(
              accommodations.copyWith(preferredFontFamily: value),
            ),
          ),
        ),
        _SettingsTile(
          title: 'Line Spacing',
          subtitle: 'Space between lines: ${accommodations.lineSpacing.toStringAsFixed(1)}x',
          icon: Icons.format_line_spacing,
          trailing: SizedBox(
            width: 160,
            child: Slider(
              value: accommodations.lineSpacing,
              min: 1.0,
              max: 2.5,
              divisions: 15,
              label: '${accommodations.lineSpacing.toStringAsFixed(1)}x',
              onChanged: (value) => onChanged(
                accommodations.copyWith(lineSpacing: value),
              ),
            ),
          ),
        ),
        const Divider(height: 32),
        _SectionHeader(
          title: 'Colors',
          icon: Icons.palette,
        ),
        _SettingsTile(
          title: 'Color Blind Mode',
          subtitle: 'Adjust colors for color vision deficiency',
          icon: Icons.colorize,
          trailing: DropdownButton<String?>(
            value: accommodations.colorBlindMode,
            underline: const SizedBox(),
            items: const [
              DropdownMenuItem(value: null, child: Text('None')),
              DropdownMenuItem(value: 'protanopia', child: Text('Protanopia')),
              DropdownMenuItem(value: 'deuteranopia', child: Text('Deuteranopia')),
              DropdownMenuItem(value: 'tritanopia', child: Text('Tritanopia')),
            ],
            onChanged: (value) => onChanged(
              accommodations.copyWith(colorBlindMode: value),
            ),
          ),
        ),
        _SettingsTile(
          title: 'Reduce Visual Clutter',
          subtitle: 'Hide decorative elements',
          icon: Icons.remove_circle_outline,
          trailing: Switch(
            value: accommodations.reduceVisualClutter,
            onChanged: (value) => onChanged(
              accommodations.copyWith(reduceVisualClutter: value),
            ),
          ),
        ),
      ],
    );
  }
}

// ==================== Auditory Settings Tab ====================

class _AuditorySettingsTab extends StatelessWidget {
  final AuditoryAccommodations accommodations;
  final ValueChanged<AuditoryAccommodations> onChanged;

  const _AuditorySettingsTab({
    required this.accommodations,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _SectionHeader(
          title: 'Sound',
          icon: Icons.volume_up,
        ),
        _SettingsTile(
          title: 'Mute All Sounds',
          subtitle: 'Turn off all audio',
          icon: Icons.volume_off,
          trailing: Switch(
            value: accommodations.muteSounds,
            onChanged: (value) => onChanged(
              accommodations.copyWith(muteSounds: value),
            ),
          ),
        ),
        _SettingsTile(
          title: 'Sound Volume',
          subtitle: '${(accommodations.soundVolume * 100).round()}%',
          icon: Icons.volume_down,
          trailing: SizedBox(
            width: 160,
            child: Slider(
              value: accommodations.soundVolume,
              min: 0.0,
              max: 1.0,
              divisions: 20,
              label: '${(accommodations.soundVolume * 100).round()}%',
              onChanged: accommodations.muteSounds
                  ? null
                  : (value) => onChanged(
                        accommodations.copyWith(soundVolume: value),
                      ),
            ),
          ),
        ),
        const Divider(height: 32),
        _SectionHeader(
          title: 'Text-to-Speech',
          icon: Icons.record_voice_over,
        ),
        _SettingsTile(
          title: 'Enable Text-to-Speech',
          subtitle: 'Have content read aloud',
          icon: Icons.speaker_notes,
          trailing: Switch(
            value: accommodations.preferTextToSpeech,
            onChanged: (value) => onChanged(
              accommodations.copyWith(preferTextToSpeech: value),
            ),
          ),
        ),
        _SettingsTile(
          title: 'Speech Rate',
          subtitle: '${(accommodations.speechRate * 100).round()}%',
          icon: Icons.speed,
          trailing: SizedBox(
            width: 160,
            child: Slider(
              value: accommodations.speechRate,
              min: 0.5,
              max: 2.0,
              divisions: 15,
              label: '${(accommodations.speechRate * 100).round()}%',
              onChanged: accommodations.preferTextToSpeech
                  ? (value) => onChanged(
                        accommodations.copyWith(speechRate: value),
                      )
                  : null,
            ),
          ),
        ),
        const Divider(height: 32),
        _SectionHeader(
          title: 'Captions',
          icon: Icons.closed_caption,
        ),
        _SettingsTile(
          title: 'Auto-Play Captions',
          subtitle: 'Show captions on videos automatically',
          icon: Icons.subtitles,
          trailing: Switch(
            value: accommodations.autoPlayCaptions,
            onChanged: (value) => onChanged(
              accommodations.copyWith(autoPlayCaptions: value),
            ),
          ),
        ),
        _SettingsTile(
          title: 'Visual Sound Indicators',
          subtitle: 'Show visual cues for audio events',
          icon: Icons.notifications_active,
          trailing: Switch(
            value: accommodations.visualSoundIndicators,
            onChanged: (value) => onChanged(
              accommodations.copyWith(visualSoundIndicators: value),
            ),
          ),
        ),
      ],
    );
  }
}

// ==================== Motor Settings Tab ====================

class _MotorSettingsTab extends StatelessWidget {
  final MotorAccommodations accommodations;
  final ValueChanged<MotorAccommodations> onChanged;

  const _MotorSettingsTab({
    required this.accommodations,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _SectionHeader(
          title: 'Touch Targets',
          icon: Icons.touch_app,
        ),
        _SettingsTile(
          title: 'Larger Touch Targets',
          subtitle: 'Make buttons and controls bigger',
          icon: Icons.zoom_out_map,
          trailing: Switch(
            value: accommodations.largerTouchTargets,
            onChanged: (value) => onChanged(
              accommodations.copyWith(largerTouchTargets: value),
            ),
          ),
        ),
        _SettingsTile(
          title: 'Minimum Touch Size',
          subtitle: '${accommodations.minTouchTargetSize.round()} pixels',
          icon: Icons.aspect_ratio,
          trailing: SizedBox(
            width: 160,
            child: Slider(
              value: accommodations.minTouchTargetSize,
              min: 44,
              max: 88,
              divisions: 11,
              label: '${accommodations.minTouchTargetSize.round()}px',
              onChanged: (value) => onChanged(
                accommodations.copyWith(minTouchTargetSize: value),
              ),
            ),
          ),
        ),
        _SettingsTile(
          title: 'Extra Spacing',
          subtitle: 'More space between interactive elements',
          icon: Icons.space_bar,
          trailing: Switch(
            value: accommodations.extraSpacing,
            onChanged: (value) => onChanged(
              accommodations.copyWith(extraSpacing: value),
            ),
          ),
        ),
        const Divider(height: 32),
        _SectionHeader(
          title: 'Gestures',
          icon: Icons.swipe,
        ),
        _SettingsTile(
          title: 'Avoid Drag & Drop',
          subtitle: 'Use tap-based alternatives',
          icon: Icons.pan_tool,
          trailing: Switch(
            value: accommodations.avoidDragAndDrop,
            onChanged: (value) => onChanged(
              accommodations.copyWith(avoidDragAndDrop: value),
            ),
          ),
        ),
        _SettingsTile(
          title: 'Extended Touch Duration',
          subtitle: 'Allow more time for touch gestures',
          icon: Icons.timer,
          trailing: Switch(
            value: accommodations.extendedTouchDuration,
            onChanged: (value) => onChanged(
              accommodations.copyWith(extendedTouchDuration: value),
            ),
          ),
        ),
        const Divider(height: 32),
        _SectionHeader(
          title: 'Input',
          icon: Icons.keyboard,
        ),
        _SettingsTile(
          title: 'Sticky Keys',
          subtitle: 'Hold modifier keys without pressing',
          icon: Icons.keyboard_alt,
          trailing: Switch(
            value: accommodations.stickyKeys,
            onChanged: (value) => onChanged(
              accommodations.copyWith(stickyKeys: value),
            ),
          ),
        ),
        _SettingsTile(
          title: 'Switch Access Support',
          subtitle: 'Enable switch device navigation',
          icon: Icons.accessibility_new,
          trailing: Switch(
            value: accommodations.switchAccessSupport,
            onChanged: (value) => onChanged(
              accommodations.copyWith(switchAccessSupport: value),
            ),
          ),
        ),
      ],
    );
  }
}

// ==================== Cognitive Settings Tab ====================

class _CognitiveSettingsTab extends StatelessWidget {
  final CognitiveAccommodations accommodations;
  final ValueChanged<CognitiveAccommodations> onChanged;

  const _CognitiveSettingsTab({
    required this.accommodations,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _SectionHeader(
          title: 'Pacing',
          icon: Icons.speed,
        ),
        _SettingsTile(
          title: 'One Thing at a Time',
          subtitle: 'Show content progressively',
          icon: Icons.looks_one,
          trailing: Switch(
            value: accommodations.oneThingAtATime,
            onChanged: (value) => onChanged(
              accommodations.copyWith(oneThingAtATime: value),
            ),
          ),
        ),
        _SettingsTile(
          title: 'Extended Time',
          subtitle: 'More time for activities and responses',
          icon: Icons.more_time,
          trailing: Switch(
            value: accommodations.extendedTime,
            onChanged: (value) => onChanged(
              accommodations.copyWith(extendedTime: value),
            ),
          ),
        ),
        _SettingsTile(
          title: 'Time Multiplier',
          subtitle: '${accommodations.timeMultiplier.toStringAsFixed(1)}x more time',
          icon: Icons.timer,
          trailing: SizedBox(
            width: 160,
            child: Slider(
              value: accommodations.timeMultiplier,
              min: 1.0,
              max: 3.0,
              divisions: 20,
              label: '${accommodations.timeMultiplier.toStringAsFixed(1)}x',
              onChanged: accommodations.extendedTime
                  ? (value) => onChanged(
                        accommodations.copyWith(timeMultiplier: value),
                      )
                  : null,
            ),
          ),
        ),
        const Divider(height: 32),
        _SectionHeader(
          title: 'Focus',
          icon: Icons.center_focus_strong,
        ),
        _SettingsTile(
          title: 'No Pop-ups',
          subtitle: 'Avoid surprise notifications',
          icon: Icons.block,
          trailing: Switch(
            value: accommodations.avoidPopups,
            onChanged: (value) => onChanged(
              accommodations.copyWith(avoidPopups: value),
            ),
          ),
        ),
        _SettingsTile(
          title: 'Clear Navigation',
          subtitle: 'Simplified, consistent navigation',
          icon: Icons.navigation,
          trailing: Switch(
            value: accommodations.clearNavigation,
            onChanged: (value) => onChanged(
              accommodations.copyWith(clearNavigation: value),
            ),
          ),
        ),
        _SettingsTile(
          title: 'Consistent Layout',
          subtitle: 'Keep elements in the same place',
          icon: Icons.grid_on,
          trailing: Switch(
            value: accommodations.consistentLayout,
            onChanged: (value) => onChanged(
              accommodations.copyWith(consistentLayout: value),
            ),
          ),
        ),
        const Divider(height: 32),
        _SectionHeader(
          title: 'Breaks',
          icon: Icons.free_breakfast,
        ),
        _SettingsTile(
          title: 'Break Reminders',
          subtitle: 'Get reminded to take breaks',
          icon: Icons.alarm,
          trailing: Switch(
            value: accommodations.breakReminders,
            onChanged: (value) => onChanged(
              accommodations.copyWith(breakReminders: value),
            ),
          ),
        ),
        _SettingsTile(
          title: 'Break Interval',
          subtitle: 'Every ${accommodations.breakIntervalMinutes} minutes',
          icon: Icons.schedule,
          trailing: SizedBox(
            width: 160,
            child: Slider(
              value: accommodations.breakIntervalMinutes.toDouble(),
              min: 5,
              max: 60,
              divisions: 11,
              label: '${accommodations.breakIntervalMinutes} min',
              onChanged: accommodations.breakReminders
                  ? (value) => onChanged(
                        accommodations.copyWith(
                          breakIntervalMinutes: value.round(),
                        ),
                      )
                  : null,
            ),
          ),
        ),
        const Divider(height: 32),
        _SectionHeader(
          title: 'Reading Support',
          icon: Icons.menu_book,
        ),
        _SettingsTile(
          title: 'Simplified Language',
          subtitle: 'Use clearer, simpler words',
          icon: Icons.text_snippet,
          trailing: Switch(
            value: accommodations.simplifiedLanguage,
            onChanged: (value) => onChanged(
              accommodations.copyWith(simplifiedLanguage: value),
            ),
          ),
        ),
        _SettingsTile(
          title: 'Reading Guide',
          subtitle: 'Show line-by-line reading helper',
          icon: Icons.linear_scale,
          trailing: Switch(
            value: accommodations.readingGuide,
            onChanged: (value) => onChanged(
              accommodations.copyWith(readingGuide: value),
            ),
          ),
        ),
      ],
    );
  }
}

// ==================== Environment Settings Tab ====================

class _EnvironmentSettingsTab extends StatelessWidget {
  final EnvironmentAccommodations accommodations;
  final ValueChanged<EnvironmentAccommodations> onChanged;

  const _EnvironmentSettingsTab({
    required this.accommodations,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _SectionHeader(
          title: 'Display Mode',
          icon: Icons.fullscreen,
        ),
        _SettingsTile(
          title: 'Prefer Fullscreen',
          subtitle: 'Hide system UI when learning',
          icon: Icons.fullscreen,
          trailing: Switch(
            value: accommodations.preferFullscreen,
            onChanged: (value) => onChanged(
              accommodations.copyWith(preferFullscreen: value),
            ),
          ),
        ),
        _SettingsTile(
          title: 'Minimize Distractions',
          subtitle: 'Hide non-essential elements',
          icon: Icons.visibility_off,
          trailing: Switch(
            value: accommodations.minimizeDistractions,
            onChanged: (value) => onChanged(
              accommodations.copyWith(minimizeDistractions: value),
            ),
          ),
        ),
        const Divider(height: 32),
        _SectionHeader(
          title: 'Timing',
          icon: Icons.access_time,
        ),
        _SettingsTile(
          title: 'Hide Timer',
          subtitle: 'Remove visible countdown timers',
          icon: Icons.timer_off,
          trailing: Switch(
            value: accommodations.hideTimer,
            onChanged: (value) => onChanged(
              accommodations.copyWith(hideTimer: value),
            ),
          ),
        ),
        _SettingsTile(
          title: 'Show Progress',
          subtitle: 'Display overall progress indicator',
          icon: Icons.trending_up,
          trailing: Switch(
            value: accommodations.showProgress,
            onChanged: (value) => onChanged(
              accommodations.copyWith(showProgress: value),
            ),
          ),
        ),
        const Divider(height: 32),
        _SectionHeader(
          title: 'Notifications',
          icon: Icons.notifications,
        ),
        _SettingsTile(
          title: 'Quiet Mode',
          subtitle: 'Reduce notification frequency',
          icon: Icons.do_not_disturb,
          trailing: Switch(
            value: accommodations.quietMode,
            onChanged: (value) => onChanged(
              accommodations.copyWith(quietMode: value),
            ),
          ),
        ),
        _SettingsTile(
          title: 'Safe Exit',
          subtitle: 'Confirm before closing activities',
          icon: Icons.exit_to_app,
          trailing: Switch(
            value: accommodations.safeExit,
            onChanged: (value) => onChanged(
              accommodations.copyWith(safeExit: value),
            ),
          ),
        ),
      ],
    );
  }
}

// ==================== Helper Widgets ====================

class _SectionHeader extends StatelessWidget {
  final String title;
  final IconData icon;

  const _SectionHeader({
    required this.title,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AivoTheme.primaryPurple),
          const SizedBox(width: 8),
          Text(
            title,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: AivoTheme.primaryPurple,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Widget trailing;

  const _SettingsTile({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AivoTheme.primaryPurple.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 20, color: AivoTheme.primaryPurple),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          trailing,
        ],
      ),
    );
  }
}

// ==================== Preset Picker Sheet ====================

class _PresetPickerSheet extends StatelessWidget {
  final ValueChanged<SensoryPreset> onPresetSelected;

  const _PresetPickerSheet({
    required this.onPresetSelected,
  });

  @override
  Widget build(BuildContext context) {
    final presets = SensoryPresets.getAllPresets();

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Icon(Icons.auto_awesome, color: AivoTheme.primaryPurple),
                const SizedBox(width: 8),
                const Text(
                  'Quick Presets',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          // Presets list
          Flexible(
            child: ListView.builder(
              shrinkWrap: true,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: presets.length,
              itemBuilder: (context, index) {
                final preset = presets[index];
                return _PresetCard(
                  preset: preset,
                  onTap: () {
                    Navigator.pop(context);
                    onPresetSelected(preset);
                  },
                );
              },
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

class _PresetCard extends StatelessWidget {
  final SensoryPreset preset;
  final VoidCallback onTap;

  const _PresetCard({
    required this.preset,
    required this.onTap,
  });

  IconData _getIconForPreset(String id) {
    switch (id) {
      case 'asd-low-sensory':
        return Icons.spa;
      case 'adhd-focus':
        return Icons.center_focus_strong;
      case 'dyslexia-friendly':
        return Icons.menu_book;
      case 'high-contrast':
        return Icons.contrast;
      case 'motor-accessibility':
        return Icons.accessibility_new;
      case 'anxiety-friendly':
        return Icons.self_improvement;
      case 'processing-support':
        return Icons.psychology;
      default:
        return Icons.settings_accessibility;
    }
  }

  Color _getColorForPreset(String id) {
    switch (id) {
      case 'asd-low-sensory':
        return AivoTheme.calmBlue;
      case 'adhd-focus':
        return AivoTheme.focusOrange;
      case 'dyslexia-friendly':
        return AivoTheme.calmGreen;
      case 'high-contrast':
        return Colors.black87;
      case 'motor-accessibility':
        return AivoTheme.primaryPurple;
      case 'anxiety-friendly':
        return AivoTheme.calmBlue;
      case 'processing-support':
        return AivoTheme.creativePink;
      default:
        return AivoTheme.primaryPurple;
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _getColorForPreset(preset.id);
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  _getIconForPreset(preset.id),
                  color: color,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      preset.name,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: color,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      preset.description,
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.arrow_forward_ios,
                size: 16,
                color: Colors.grey[400],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
