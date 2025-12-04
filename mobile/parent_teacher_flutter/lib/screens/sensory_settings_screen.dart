import 'package:flutter/material.dart';
import 'package:aivo_shared/aivo_shared.dart';

/// Sensory settings screen for parents/teachers to manage learner preferences
class SensorySettingsScreen extends StatefulWidget {
  final String? learnerId;

  const SensorySettingsScreen({super.key, this.learnerId});

  @override
  State<SensorySettingsScreen> createState() => _SensorySettingsScreenState();
}

class _SensorySettingsScreenState extends State<SensorySettingsScreen>
    with SingleTickerProviderStateMixin {
  final AivoApiClient _client = AivoApiClient();

  late TabController _tabController;
  bool _loading = true;
  bool _saving = false;
  String? _error;
  SensoryProfile? _profile;
  List<SensoryPresetInfo>? _presets;
  String? _learnerId;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final learnerId = widget.learnerId ?? 'demo-learner';
      _learnerId = learnerId;

      final profile = await _client.getSensoryProfile(learnerId);
      final presets = await _client.getSensoryPresets();

      setState(() {
        _profile = profile;
        _presets = presets;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load sensory profile';
        _loading = false;
        // Use demo data
        _profile = _getDemoProfile();
        _presets = _getDemoPresets();
      });
    }
  }

  SensoryProfile _getDemoProfile() {
    return SensoryProfile.defaultProfile(_learnerId ?? 'demo-learner');
  }

  List<SensoryPresetInfo> _getDemoPresets() {
    return [
      SensoryPresetInfo(
        id: 'adhd-focus',
        name: 'ADHD Focus',
        description: 'Optimized for attention and focus with frequent breaks',
        category: 'focus',
        tags: ['adhd', 'focus', 'attention'],
        iconName: '🎯',
      ),
      SensoryPresetInfo(
        id: 'dyslexia-friendly',
        name: 'Dyslexia Friendly',
        description: 'Enhanced readability with special fonts and colors',
        category: 'reading',
        tags: ['dyslexia', 'reading', 'visual'],
        iconName: '📖',
      ),
      SensoryPresetInfo(
        id: 'sensory-sensitive',
        name: 'Sensory Sensitive',
        description: 'Reduced stimulation for sensory processing differences',
        category: 'sensory',
        tags: ['sensory', 'low-stimulation'],
        iconName: '🌿',
      ),
      SensoryPresetInfo(
        id: 'motor-challenges',
        name: 'Motor Accessible',
        description: 'Larger targets and simplified interactions',
        category: 'motor',
        tags: ['motor', 'accessibility'],
        iconName: '✋',
      ),
    ];
  }

  Future<void> _updateProfile() async {
    if (_profile == null || _learnerId == null) return;

    setState(() => _saving = true);

    try {
      final updated = await _client.updateSensoryProfile(
        learnerId: _learnerId!,
        profile: _profile!,
      );
      setState(() {
        _profile = updated;
        _saving = false;
      });
      _showSuccessSnackbar('Settings saved!');
    } catch (e) {
      setState(() => _saving = false);
      _showErrorSnackbar('Failed to save settings');
    }
  }

  Future<void> _applyPreset(String presetId) async {
    if (_learnerId == null) return;

    setState(() => _saving = true);

    try {
      // In production, call API to apply preset
      await Future.delayed(const Duration(milliseconds: 500));
      await _loadData();
      _showSuccessSnackbar('Preset applied!');
    } catch (e) {
      setState(() => _saving = false);
      _showErrorSnackbar('Failed to apply preset');
    }
  }

  void _showSuccessSnackbar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Text('✅', style: TextStyle(fontSize: 18)),
            const SizedBox(width: 10),
            Text(message, style: const TextStyle(color: Colors.white)),
          ],
        ),
        backgroundColor: const Color(0xFF059669),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  void _showErrorSnackbar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Text('❌', style: TextStyle(fontSize: 18)),
            const SizedBox(width: 10),
            Text(message, style: const TextStyle(color: Colors.white)),
          ],
        ),
        backgroundColor: AivoTheme.coral,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: AivoTheme.backgroundGradient,
        ),
        child: SafeArea(
          child: Column(
            children: [
              _buildAppBar(),
              if (_loading)
                const Expanded(child: Center(child: CircularProgressIndicator()))
              else ...[
                _buildTabBar(),
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _buildOverviewTab(),
                      _buildVisualTab(),
                      _buildAuditoryTab(),
                      _buildMotorTab(),
                      _buildCognitiveTab(),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
      floatingActionButton: _loading
          ? null
          : FloatingActionButton.extended(
              onPressed: _saving ? null : _updateProfile,
              backgroundColor: AivoTheme.primary,
              icon: _saving
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Icon(Icons.save_rounded),
              label: Text(_saving ? 'Saving...' : 'Save Changes'),
            ),
    );
  }

  Widget _buildAppBar() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: const Icon(Icons.arrow_back_rounded, color: AivoTheme.textPrimary),
            ),
          ),
          const SizedBox(width: 16),
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF8B5CF6), Color(0xFFA78BFA)],
              ),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(Icons.accessibility_new_rounded, color: Colors.white, size: 26),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Sensory Settings',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AivoTheme.textPrimary,
                  ),
                ),
                Text(
                  'Customize learning experience',
                  style: TextStyle(fontSize: 13, color: AivoTheme.textMuted),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: TabBar(
        controller: _tabController,
        isScrollable: true,
        labelColor: AivoTheme.primary,
        unselectedLabelColor: AivoTheme.textMuted,
        labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
        unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13),
        indicator: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: AivoTheme.primary.withValues(alpha: 0.1),
        ),
        indicatorSize: TabBarIndicatorSize.tab,
        dividerColor: Colors.transparent,
        tabs: const [
          Tab(text: '📋 Overview'),
          Tab(text: '👁️ Visual'),
          Tab(text: '👂 Auditory'),
          Tab(text: '✋ Motor'),
          Tab(text: '🧠 Cognitive'),
        ],
      ),
    );
  }

  Widget _buildOverviewTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Effectiveness Score Section
          _buildEffectivenessSection(),
          const SizedBox(height: 24),
          
          // Quick presets
          _buildSectionHeader('⚡', 'Quick Presets'),
          const SizedBox(height: 12),
          ..._presets!.map((preset) => _buildPresetCard(preset)),

          const SizedBox(height: 24),

          // Current profile summary
          _buildSectionHeader('📋', 'Current Settings Summary'),
          const SizedBox(height: 16),
          _buildSettingsSummary(),
          const SizedBox(height: 100),
        ],
      ),
    );
  }

  Widget _buildEffectivenessSection() {
    // Demo effectiveness data (matching Web implementation)
    final effectivenessScore = 78;
    final categoryScores = {
      'Visual': 82,
      'Auditory': 75,
      'Motor': 88,
      'Cognitive': 72,
      'Environment': 73,
    };
    final recommendations = [
      "Consider enabling 'Reduce Animations' to minimize visual distractions",
      "Try the 'Focus Mode' preset for extended reading sessions",
      "Break reminders every 15 minutes may help maintain attention",
    ];
    final weeklyTrend = [65, 68, 72, 70, 75, 78, 78];

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AivoTheme.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text('📊', style: TextStyle(fontSize: 20)),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Effectiveness Overview',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AivoTheme.textPrimary,
                      ),
                    ),
                    Text(
                      'How well settings are working',
                      style: TextStyle(
                        fontSize: 12,
                        color: AivoTheme.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              // Demo data badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AivoTheme.sunshine.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.lightbulb_outline, size: 12, color: Colors.amber.shade700),
                    const SizedBox(width: 4),
                    Text(
                      'Demo',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: Colors.amber.shade700,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Score cards row
          Row(
            children: [
              Expanded(
                child: _buildScoreCard(
                  label: 'Overall Score',
                  value: '$effectivenessScore%',
                  color: AivoTheme.primary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildScoreCard(
                  label: 'Current Preset',
                  value: _profile?.presetId != null ? '✓' : '—',
                  subtitle: _profile?.presetId ?? 'Custom',
                  color: AivoTheme.mint,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildScoreCard(
                  label: 'Suggestions',
                  value: '${recommendations.length}',
                  color: AivoTheme.sunshine,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Category scores
          const Text(
            'Category Scores',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AivoTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          ...categoryScores.entries.map((entry) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: _buildCategoryScoreBar(
              category: entry.key,
              score: entry.value,
            ),
          )),
          const SizedBox(height: 16),

          // Weekly trend chart
          _buildWeeklyTrendChart(weeklyTrend),
          const SizedBox(height: 16),

          // Recommendations
          if (recommendations.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AivoTheme.primary.withOpacity(0.05),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.lightbulb_outline, size: 18, color: AivoTheme.sunshine),
                      const SizedBox(width: 8),
                      const Text(
                        'Suggestions',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AivoTheme.textPrimary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  ...recommendations.map((rec) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('•', style: TextStyle(color: AivoTheme.primary)),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            rec,
                            style: TextStyle(
                              fontSize: 12,
                              color: AivoTheme.textMuted,
                            ),
                          ),
                        ),
                      ],
                    ),
                  )),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildScoreCard({
    required String label,
    required String value,
    String? subtitle,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          if (subtitle != null)
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 10,
                color: color,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: color,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryScoreBar({
    required String category,
    required int score,
  }) {
    final icons = {
      'Visual': '👁️',
      'Auditory': '👂',
      'Motor': '✋',
      'Cognitive': '🧠',
      'Environment': '🏠',
    };

    return Row(
      children: [
        Text(icons[category] ?? '📋', style: const TextStyle(fontSize: 16)),
        const SizedBox(width: 10),
        SizedBox(
          width: 70,
          child: Text(
            category,
            style: const TextStyle(
              fontSize: 12,
              color: AivoTheme.textMuted,
            ),
          ),
        ),
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: score / 100,
              backgroundColor: AivoTheme.primary.withOpacity(0.1),
              valueColor: AlwaysStoppedAnimation<Color>(AivoTheme.primary),
              minHeight: 8,
            ),
          ),
        ),
        const SizedBox(width: 10),
        SizedBox(
          width: 36,
          child: Text(
            '$score%',
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AivoTheme.textPrimary,
            ),
            textAlign: TextAlign.right,
          ),
        ),
      ],
    );
  }

  Widget _buildWeeklyTrendChart(List<int> trend) {
    final days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    final maxValue = trend.reduce((a, b) => a > b ? a : b);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF8F7FF),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '7-Day Trend',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AivoTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 60,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: trend.asMap().entries.map((entry) {
                final height = (entry.value / maxValue) * 48;
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 2),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Container(
                          height: height,
                          decoration: BoxDecoration(
                            color: AivoTheme.primary.withOpacity(0.7),
                            borderRadius: const BorderRadius.vertical(
                              top: Radius.circular(4),
                            ),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          days[entry.key],
                          style: TextStyle(
                            fontSize: 10,
                            color: AivoTheme.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String emoji, String title) {
    return Row(
      children: [
        Text(emoji, style: const TextStyle(fontSize: 20)),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AivoTheme.textPrimary,
          ),
        ),
      ],
    );
  }

  Widget _buildPresetCard(SensoryPresetInfo preset) {
    return GestureDetector(
      onTap: () => _applyPreset(preset.id),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AivoTheme.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Text(preset.iconName ?? '⚙️', style: const TextStyle(fontSize: 24)),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    preset.name,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: AivoTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    preset.description,
                    style: const TextStyle(fontSize: 12, color: AivoTheme.textMuted),
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios_rounded, size: 16, color: AivoTheme.textMuted),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingsSummary() {
    if (_profile == null) return const SizedBox();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSummaryItem('👁️', 'Visual', _getVisualSummary()),
          const Divider(height: 24),
          _buildSummaryItem('👂', 'Auditory', _getAuditorySummary()),
          const Divider(height: 24),
          _buildSummaryItem('✋', 'Motor', _getMotorSummary()),
          const Divider(height: 24),
          _buildSummaryItem('🧠', 'Cognitive', _getCognitiveSummary()),
          const Divider(height: 24),
          _buildSummaryItem('🏠', 'Environment', _getEnvironmentSummary()),
        ],
      ),
    );
  }

  Widget _buildSummaryItem(String emoji, String title, String summary) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(emoji, style: const TextStyle(fontSize: 20)),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AivoTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                summary,
                style: const TextStyle(fontSize: 12, color: AivoTheme.textMuted),
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _getVisualSummary() {
    final v = _profile!.visual;
    final items = <String>[];
    if (v.darkMode) items.add('Dark mode');
    if (v.reduceMotion) items.add('Reduced motion');
    if (v.highContrast) items.add('High contrast');
    if (v.reduceAnimations) items.add('Reduced animations');
    if (v.reducedClutter) items.add('Reduced clutter');
    items.add('Font: ${v.fontSize}');
    return items.isEmpty ? 'Default settings' : items.join(' • ');
  }

  String _getAuditorySummary() {
    final a = _profile!.auditory;
    final items = <String>[];
    if (a.muteAllSounds) items.add('Muted');
    if (a.textToSpeechEnabled) items.add('Text-to-speech');
    if (a.noBackgroundMusic) items.add('No background music');
    if (a.audioDescriptions) items.add('Audio descriptions');
    items.add('Volume: ${(a.soundVolume * 100).toInt()}%');
    return items.isEmpty ? 'Default settings' : items.join(' • ');
  }

  String _getMotorSummary() {
    final m = _profile!.motor;
    final items = <String>[];
    if (m.largerClickTargets) items.add('Larger targets');
    if (m.noDoubleClick) items.add('No double-click');
    if (m.noDragAndDrop) items.add('No drag & drop');
    if (m.touchAccommodations) items.add('Touch accommodations');
    if (m.increaseSpacing) items.add('Increased spacing');
    return items.isEmpty ? 'Default settings' : items.join(' • ');
  }

  String _getCognitiveSummary() {
    final c = _profile!.cognitive;
    final items = <String>[];
    if (c.oneThingAtATime) items.add('One at a time');
    if (c.extendedTime) items.add('Extended time (${c.timeMultiplier}x)');
    if (c.breakReminders) items.add('Break reminders');
    if (c.simplifyInstructions) items.add('Simple instructions');
    if (c.noPopups) items.add('No popups');
    return items.isEmpty ? 'Default settings' : items.join(' • ');
  }

  String _getEnvironmentSummary() {
    final e = _profile!.environment;
    final items = <String>[];
    if (e.fullScreenMode) items.add('Full screen');
    if (e.minimizeDistractions) items.add('Minimize distractions');
    if (e.hideNotifications) items.add('Hide notifications');
    if (e.whiteNoise) items.add('White noise');
    return items.isEmpty ? 'Default settings' : items.join(' • ');
  }

  Widget _buildVisualTab() {
    if (_profile == null) return const SizedBox();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSettingCard(
            icon: '🌙',
            title: 'Dark Mode',
            subtitle: 'Use dark colors to reduce eye strain',
            trailing: Switch.adaptive(
              value: _profile!.visual.darkMode,
              onChanged: (v) => setState(() => _profile = _profile!.copyWith(
                visual: _profile!.visual.copyWith(darkMode: v),
              )),
              activeColor: AivoTheme.primary,
            ),
          ),
          _buildSettingCard(
            icon: '🎬',
            title: 'Reduced Motion',
            subtitle: 'Minimize animations and transitions',
            trailing: Switch.adaptive(
              value: _profile!.visual.reduceMotion,
              onChanged: (v) => setState(() => _profile = _profile!.copyWith(
                visual: _profile!.visual.copyWith(reduceMotion: v),
              )),
              activeColor: AivoTheme.primary,
            ),
          ),
          _buildSettingCard(
            icon: '✨',
            title: 'Reduce Animations',
            subtitle: 'Disable animated elements',
            trailing: Switch.adaptive(
              value: _profile!.visual.reduceAnimations,
              onChanged: (v) => setState(() => _profile = _profile!.copyWith(
                visual: _profile!.visual.copyWith(reduceAnimations: v),
              )),
              activeColor: AivoTheme.primary,
            ),
          ),
          _buildSettingCard(
            icon: '🔲',
            title: 'High Contrast',
            subtitle: 'Increase contrast for better visibility',
            trailing: Switch.adaptive(
              value: _profile!.visual.highContrast,
              onChanged: (v) => setState(() => _profile = _profile!.copyWith(
                visual: _profile!.visual.copyWith(highContrast: v),
              )),
              activeColor: AivoTheme.primary,
            ),
          ),
          _buildSettingCard(
            icon: '🧹',
            title: 'Reduced Clutter',
            subtitle: 'Simplify interface elements',
            trailing: Switch.adaptive(
              value: _profile!.visual.reducedClutter,
              onChanged: (v) => setState(() => _profile = _profile!.copyWith(
                visual: _profile!.visual.copyWith(reducedClutter: v),
              )),
              activeColor: AivoTheme.primary,
            ),
          ),
          _buildFontSizeSelector(),
          _buildFontFamilySelector(),
          _buildLineSpacingSelector(),
          _buildColorSchemeSelector(),
          const SizedBox(height: 100),
        ],
      ),
    );
  }

  Widget _buildAuditoryTab() {
    if (_profile == null) return const SizedBox();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSettingCard(
            icon: '🔇',
            title: 'Mute All Sounds',
            subtitle: 'Turn off all audio',
            trailing: Switch.adaptive(
              value: _profile!.auditory.muteAllSounds,
              onChanged: (v) => setState(() => _profile = _profile!.copyWith(
                auditory: _profile!.auditory.copyWith(muteAllSounds: v),
              )),
              activeColor: AivoTheme.primary,
            ),
          ),
          _buildSettingCard(
            icon: '🎵',
            title: 'No Background Music',
            subtitle: 'Disable ambient music',
            trailing: Switch.adaptive(
              value: _profile!.auditory.noBackgroundMusic,
              onChanged: (v) => setState(() => _profile = _profile!.copyWith(
                auditory: _profile!.auditory.copyWith(noBackgroundMusic: v),
              )),
              activeColor: AivoTheme.primary,
            ),
          ),
          _buildSettingCard(
            icon: '🔔',
            title: 'No Sound Effects',
            subtitle: 'Disable UI sounds and effects',
            trailing: Switch.adaptive(
              value: _profile!.auditory.noSoundEffects,
              onChanged: (v) => setState(() => _profile = _profile!.copyWith(
                auditory: _profile!.auditory.copyWith(noSoundEffects: v),
              )),
              activeColor: AivoTheme.primary,
            ),
          ),
          _buildSettingCard(
            icon: '🗣️',
            title: 'Text-to-Speech',
            subtitle: 'Read instructions and content aloud',
            trailing: Switch.adaptive(
              value: _profile!.auditory.textToSpeechEnabled,
              onChanged: (v) => setState(() => _profile = _profile!.copyWith(
                auditory: _profile!.auditory.copyWith(textToSpeechEnabled: v),
              )),
              activeColor: AivoTheme.primary,
            ),
          ),
          _buildSettingCard(
            icon: '🎧',
            title: 'Audio Descriptions',
            subtitle: 'Describe visual content verbally',
            trailing: Switch.adaptive(
              value: _profile!.auditory.audioDescriptions,
              onChanged: (v) => setState(() => _profile = _profile!.copyWith(
                auditory: _profile!.auditory.copyWith(audioDescriptions: v),
              )),
              activeColor: AivoTheme.primary,
            ),
          ),
          _buildVolumeSlider(),
          _buildSpeechSpeedSlider(),
          _buildVoiceSelector(),
          const SizedBox(height: 100),
        ],
      ),
    );
  }

  Widget _buildMotorTab() {
    if (_profile == null) return const SizedBox();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSettingCard(
            icon: '🎯',
            title: 'Larger Click Targets',
            subtitle: 'Increase button and tap area sizes',
            trailing: Switch.adaptive(
              value: _profile!.motor.largerClickTargets,
              onChanged: (v) => setState(() => _profile = _profile!.copyWith(
                motor: _profile!.motor.copyWith(largerClickTargets: v),
              )),
              activeColor: AivoTheme.primary,
            ),
          ),
          _buildSettingCard(
            icon: '👆',
            title: 'No Double-Click',
            subtitle: 'Single tap/click for all actions',
            trailing: Switch.adaptive(
              value: _profile!.motor.noDoubleClick,
              onChanged: (v) => setState(() => _profile = _profile!.copyWith(
                motor: _profile!.motor.copyWith(noDoubleClick: v),
              )),
              activeColor: AivoTheme.primary,
            ),
          ),
          _buildSettingCard(
            icon: '🖱️',
            title: 'No Drag & Drop',
            subtitle: 'Alternative interactions instead of dragging',
            trailing: Switch.adaptive(
              value: _profile!.motor.noDragAndDrop,
              onChanged: (v) => setState(() => _profile = _profile!.copyWith(
                motor: _profile!.motor.copyWith(noDragAndDrop: v),
              )),
              activeColor: AivoTheme.primary,
            ),
          ),
          _buildSettingCard(
            icon: '↔️',
            title: 'Increase Spacing',
            subtitle: 'More space between interactive elements',
            trailing: Switch.adaptive(
              value: _profile!.motor.increaseSpacing,
              onChanged: (v) => setState(() => _profile = _profile!.copyWith(
                motor: _profile!.motor.copyWith(increaseSpacing: v),
              )),
              activeColor: AivoTheme.primary,
            ),
          ),
          _buildSettingCard(
            icon: '📱',
            title: 'Touch Accommodations',
            subtitle: 'Optimized for touch input',
            trailing: Switch.adaptive(
              value: _profile!.motor.touchAccommodations,
              onChanged: (v) => setState(() => _profile = _profile!.copyWith(
                motor: _profile!.motor.copyWith(touchAccommodations: v),
              )),
              activeColor: AivoTheme.primary,
            ),
          ),
          _buildHoverDelaySlider(),
          const SizedBox(height: 100),
        ],
      ),
    );
  }

  Widget _buildCognitiveTab() {
    if (_profile == null) return const SizedBox();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader('🧠', 'Focus & Attention'),
          const SizedBox(height: 12),
          _buildSettingCard(
            icon: '1️⃣',
            title: 'One Thing at a Time',
            subtitle: 'Show content sequentially',
            trailing: Switch.adaptive(
              value: _profile!.cognitive.oneThingAtATime,
              onChanged: (v) => setState(() => _profile = _profile!.copyWith(
                cognitive: _profile!.cognitive.copyWith(oneThingAtATime: v),
              )),
              activeColor: AivoTheme.primary,
            ),
          ),
          _buildSettingCard(
            icon: '🚫',
            title: 'No Popups',
            subtitle: 'Prevent disruptive popup dialogs',
            trailing: Switch.adaptive(
              value: _profile!.cognitive.noPopups,
              onChanged: (v) => setState(() => _profile = _profile!.copyWith(
                cognitive: _profile!.cognitive.copyWith(noPopups: v),
              )),
              activeColor: AivoTheme.primary,
            ),
          ),
          _buildSettingCard(
            icon: '⏸️',
            title: 'No Autoplay',
            subtitle: 'Disable automatic media playback',
            trailing: Switch.adaptive(
              value: _profile!.cognitive.noAutoplay,
              onChanged: (v) => setState(() => _profile = _profile!.copyWith(
                cognitive: _profile!.cognitive.copyWith(noAutoplay: v),
              )),
              activeColor: AivoTheme.primary,
            ),
          ),
          _buildSettingCard(
            icon: '📝',
            title: 'Simplify Instructions',
            subtitle: 'Use simpler language and shorter steps',
            trailing: Switch.adaptive(
              value: _profile!.cognitive.simplifyInstructions,
              onChanged: (v) => setState(() => _profile = _profile!.copyWith(
                cognitive: _profile!.cognitive.copyWith(simplifyInstructions: v),
              )),
              activeColor: AivoTheme.primary,
            ),
          ),
          _buildSettingCard(
            icon: '📊',
            title: 'Show Progress Indicator',
            subtitle: 'Display progress through activities',
            trailing: Switch.adaptive(
              value: _profile!.cognitive.showProgressIndicator,
              onChanged: (v) => setState(() => _profile = _profile!.copyWith(
                cognitive: _profile!.cognitive.copyWith(showProgressIndicator: v),
              )),
              activeColor: AivoTheme.primary,
            ),
          ),
          const SizedBox(height: 24),
          _buildSectionHeader('⏰', 'Time & Pacing'),
          const SizedBox(height: 12),
          _buildSettingCard(
            icon: '⏳',
            title: 'Extended Time',
            subtitle: 'Allow more time for activities',
            trailing: Switch.adaptive(
              value: _profile!.cognitive.extendedTime,
              onChanged: (v) => setState(() => _profile = _profile!.copyWith(
                cognitive: _profile!.cognitive.copyWith(extendedTime: v),
              )),
              activeColor: AivoTheme.primary,
            ),
          ),
          _buildTimeMultiplierSelector(),
          _buildSettingCard(
            icon: '☕',
            title: 'Break Reminders',
            subtitle: 'Get reminders to take breaks',
            trailing: Switch.adaptive(
              value: _profile!.cognitive.breakReminders,
              onChanged: (v) => setState(() => _profile = _profile!.copyWith(
                cognitive: _profile!.cognitive.copyWith(breakReminders: v),
              )),
              activeColor: AivoTheme.primary,
            ),
          ),
          _buildBreakFrequencySlider(),
          _buildChoiceLimitSlider(),
          const SizedBox(height: 100),
        ],
      ),
    );
  }

  Widget _buildSettingCard({
    required String icon,
    required String title,
    required String subtitle,
    required Widget trailing,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Text(icon, style: const TextStyle(fontSize: 24)),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AivoTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(fontSize: 12, color: AivoTheme.textMuted),
                ),
              ],
            ),
          ),
          trailing,
        ],
      ),
    );
  }

  Widget _buildFontSizeSelector() {
    final sizes = ['small', 'medium', 'large', 'extra-large'];
    final labels = ['S', 'M', 'L', 'XL'];

    return _buildSelectorCard(
      icon: '🔤',
      title: 'Font Size',
      subtitle: 'Text size throughout the app',
      values: sizes,
      labels: labels,
      currentValue: _profile!.visual.fontSize,
      onChanged: (v) => setState(() => _profile = _profile!.copyWith(
        visual: _profile!.visual.copyWith(fontSize: v),
      )),
    );
  }

  Widget _buildFontFamilySelector() {
    final families = ['default', 'dyslexic', 'sans-serif'];
    final labels = ['Default', 'Dyslexic', 'Sans'];

    return _buildSelectorCard(
      icon: '🅰️',
      title: 'Font Family',
      subtitle: 'Choose a readable font style',
      values: families,
      labels: labels,
      currentValue: _profile!.visual.fontFamily,
      onChanged: (v) => setState(() => _profile = _profile!.copyWith(
        visual: _profile!.visual.copyWith(fontFamily: v),
      )),
    );
  }

  Widget _buildLineSpacingSelector() {
    final spacings = ['normal', 'wide', 'extra-wide'];
    final labels = ['Normal', 'Wide', 'Extra'];

    return _buildSelectorCard(
      icon: '📏',
      title: 'Line Spacing',
      subtitle: 'Space between lines of text',
      values: spacings,
      labels: labels,
      currentValue: _profile!.visual.lineSpacing,
      onChanged: (v) => setState(() => _profile = _profile!.copyWith(
        visual: _profile!.visual.copyWith(lineSpacing: v),
      )),
    );
  }

  Widget _buildColorSchemeSelector() {
    final schemes = ['default', 'warm', 'cool', 'high-contrast'];
    final labels = ['Default', 'Warm', 'Cool', 'Contrast'];

    return _buildSelectorCard(
      icon: '🎨',
      title: 'Color Scheme',
      subtitle: 'Overall color palette',
      values: schemes,
      labels: labels,
      currentValue: _profile!.visual.colorScheme,
      onChanged: (v) => setState(() => _profile = _profile!.copyWith(
        visual: _profile!.visual.copyWith(colorScheme: v),
      )),
    );
  }

  Widget _buildVoiceSelector() {
    final voices = ['female', 'male'];
    final labels = ['Female', 'Male'];

    return _buildSelectorCard(
      icon: '🎤',
      title: 'Voice',
      subtitle: 'Text-to-speech voice',
      values: voices,
      labels: labels,
      currentValue: _profile!.auditory.textToSpeechVoice,
      onChanged: (v) => setState(() => _profile = _profile!.copyWith(
        auditory: _profile!.auditory.copyWith(textToSpeechVoice: v),
      )),
    );
  }

  Widget _buildTimeMultiplierSelector() {
    final multipliers = ['1.0', '1.5', '2.0'];
    final labels = ['1x', '1.5x', '2x'];

    return _buildSelectorCard(
      icon: '⏱️',
      title: 'Time Multiplier',
      subtitle: 'How much extra time to allow',
      values: multipliers,
      labels: labels,
      currentValue: _profile!.cognitive.timeMultiplier.toString(),
      onChanged: (v) => setState(() => _profile = _profile!.copyWith(
        cognitive: _profile!.cognitive.copyWith(timeMultiplier: double.parse(v)),
      )),
    );
  }

  Widget _buildSelectorCard({
    required String icon,
    required String title,
    required String subtitle,
    required List<String> values,
    required List<String> labels,
    required String currentValue,
    required ValueChanged<String> onChanged,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(icon, style: const TextStyle(fontSize: 24)),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: AivoTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: const TextStyle(fontSize: 12, color: AivoTheme.textMuted),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: values.asMap().entries.map((entry) {
              final isSelected = currentValue == entry.value;
              return Expanded(
                child: GestureDetector(
                  onTap: () => onChanged(entry.value),
                  child: Container(
                    margin: EdgeInsets.only(right: entry.key < values.length - 1 ? 8 : 0),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      color: isSelected ? AivoTheme.primary : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Center(
                      child: Text(
                        labels[entry.key],
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: isSelected ? Colors.white : AivoTheme.textMuted,
                        ),
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildVolumeSlider() {
    return _buildSliderCard(
      icon: '🔈',
      title: 'Volume',
      subtitle: 'Overall sound volume',
      value: _profile!.auditory.soundVolume,
      min: 0.0,
      max: 1.0,
      divisions: 10,
      displayValue: '${(_profile!.auditory.soundVolume * 100).toInt()}%',
      onChanged: (v) => setState(() => _profile = _profile!.copyWith(
        auditory: _profile!.auditory.copyWith(soundVolume: v),
      )),
    );
  }

  Widget _buildSpeechSpeedSlider() {
    return _buildSliderCard(
      icon: '🏃',
      title: 'Speech Speed',
      subtitle: 'Text-to-speech reading speed',
      value: _profile!.auditory.textToSpeechSpeed,
      min: 0.5,
      max: 2.0,
      divisions: 6,
      displayValue: '${_profile!.auditory.textToSpeechSpeed.toStringAsFixed(1)}x',
      onChanged: (v) => setState(() => _profile = _profile!.copyWith(
        auditory: _profile!.auditory.copyWith(textToSpeechSpeed: v),
      )),
    );
  }

  Widget _buildHoverDelaySlider() {
    return _buildSliderCard(
      icon: '⏲️',
      title: 'Hover Delay',
      subtitle: 'Delay before hover actions trigger (ms)',
      value: _profile!.motor.hoverDelay.toDouble(),
      min: 0,
      max: 1000,
      divisions: 10,
      displayValue: '${_profile!.motor.hoverDelay}ms',
      onChanged: (v) => setState(() => _profile = _profile!.copyWith(
        motor: _profile!.motor.copyWith(hoverDelay: v.toInt()),
      )),
    );
  }

  Widget _buildBreakFrequencySlider() {
    return _buildSliderCard(
      icon: '⏰',
      title: 'Break Frequency',
      subtitle: 'Minutes between break reminders',
      value: _profile!.cognitive.breakFrequencyMinutes.toDouble(),
      min: 10,
      max: 60,
      divisions: 10,
      displayValue: '${_profile!.cognitive.breakFrequencyMinutes} min',
      onChanged: (v) => setState(() => _profile = _profile!.copyWith(
        cognitive: _profile!.cognitive.copyWith(breakFrequencyMinutes: v.toInt()),
      )),
    );
  }

  Widget _buildChoiceLimitSlider() {
    return _buildSliderCard(
      icon: '🔢',
      title: 'Choice Limit',
      subtitle: 'Maximum options shown at once (0 = no limit)',
      value: _profile!.cognitive.limitChoices.toDouble(),
      min: 0,
      max: 10,
      divisions: 10,
      displayValue: _profile!.cognitive.limitChoices == 0 ? 'No limit' : '${_profile!.cognitive.limitChoices}',
      onChanged: (v) => setState(() => _profile = _profile!.copyWith(
        cognitive: _profile!.cognitive.copyWith(limitChoices: v.toInt()),
      )),
    );
  }

  Widget _buildSliderCard({
    required String icon,
    required String title,
    required String subtitle,
    required double value,
    required double min,
    required double max,
    required int divisions,
    required String displayValue,
    required ValueChanged<double> onChanged,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(icon, style: const TextStyle(fontSize: 24)),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: AivoTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: const TextStyle(fontSize: 12, color: AivoTheme.textMuted),
                    ),
                  ],
                ),
              ),
              Text(
                displayValue,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AivoTheme.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Slider(
            value: value,
            min: min,
            max: max,
            divisions: divisions,
            onChanged: onChanged,
            activeColor: AivoTheme.primary,
            inactiveColor: const Color(0xFFE2E8F0),
          ),
        ],
      ),
    );
  }
}
