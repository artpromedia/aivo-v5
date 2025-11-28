import 'package:flutter/material.dart';
import 'package:aivo_shared/aivo_shared.dart';
import '../widgets/iep_goal_card.dart';
import '../widgets/iep_progress_chart.dart';
import 'iep_goal_detail_screen.dart';

/// Dashboard screen showing all IEP goals for a learner
class IEPDashboardScreen extends StatefulWidget {
  final String? learnerId;
  final String? learnerName;

  const IEPDashboardScreen({
    super.key,
    this.learnerId,
    this.learnerName,
  });

  @override
  State<IEPDashboardScreen> createState() => _IEPDashboardScreenState();
}

class _IEPDashboardScreenState extends State<IEPDashboardScreen> {
  List<IEPGoal> _goals = [];
  bool _loading = true;
  String? _error;
  IEPCategory? _selectedCategory;
  IEPGoalStatus? _selectedStatus;

  @override
  void initState() {
    super.initState();
    _loadGoals();
  }

  Future<void> _loadGoals() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      // TODO: Replace with actual API call
      await Future.delayed(const Duration(milliseconds: 500));
      
      // Mock data for demonstration
      _goals = _generateMockGoals();
      
      if (mounted) {
        setState(() => _loading = false);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  List<IEPGoal> get _filteredGoals {
    return _goals.where((goal) {
      if (_selectedCategory != null && goal.category != _selectedCategory) {
        return false;
      }
      if (_selectedStatus != null && goal.status != _selectedStatus) {
        return false;
      }
      return true;
    }).toList();
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
              Expanded(
                child: _loading
                    ? _buildLoadingState()
                    : _error != null
                        ? _buildErrorState()
                        : _buildContent(),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddGoalSheet,
        backgroundColor: AivoTheme.primary,
        icon: const Icon(Icons.add),
        label: const Text('Add Goal'),
      ),
    );
  }

  Widget _buildAppBar() {
    return Container(
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
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: const Icon(Icons.arrow_back_rounded, color: AivoTheme.textPrimary),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'IEP Goals',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AivoTheme.textPrimary,
                  ),
                ),
                if (widget.learnerName != null)
                  Text(
                    widget.learnerName!,
                    style: TextStyle(
                      fontSize: 13,
                      color: AivoTheme.textMuted,
                    ),
                  ),
              ],
            ),
          ),
          IconButton(
            onPressed: _loadGoals,
            icon: const Icon(Icons.refresh_rounded),
            color: AivoTheme.textMuted,
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return const Center(
      child: CircularProgressIndicator(),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('😅', style: TextStyle(fontSize: 48)),
            const SizedBox(height: 16),
            const Text(
              'Something went wrong',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: TextStyle(color: AivoTheme.textMuted),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loadGoals,
              child: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent() {
    return RefreshIndicator(
      onRefresh: _loadGoals,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Summary section
            _buildSummarySection(),
            const SizedBox(height: 24),
            
            // Upcoming reviews
            if (_getUpcomingReviews().isNotEmpty) ...[
              _buildUpcomingReviews(),
              const SizedBox(height: 24),
            ],
            
            // Filters
            _buildFilters(),
            const SizedBox(height: 16),
            
            // Goals list
            _buildGoalsList(),
            
            const SizedBox(height: 100), // Space for FAB
          ],
        ),
      ),
    );
  }

  Widget _buildSummarySection() {
    final total = _goals.length;
    final achieved = _goals.where((g) => g.status == IEPGoalStatus.achieved).length;
    final inProgress = _goals.where((g) => g.status == IEPGoalStatus.inProgress).length;
    final needsAttention = _goals.where((g) => g.needsAttention).length;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
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
              const Text(
                '📊',
                style: TextStyle(fontSize: 24),
              ),
              const SizedBox(width: 12),
              const Text(
                'Progress Overview',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              // Pie chart
              Expanded(
                flex: 2,
                child: IEPStatusPieChart(goals: _goals, size: 120),
              ),
              // Stats
              Expanded(
                flex: 3,
                child: Column(
                  children: [
                    _buildStatRow('Total Goals', total.toString(), AivoTheme.textPrimary),
                    _buildStatRow('Achieved', achieved.toString(), AivoTheme.mint),
                    _buildStatRow('In Progress', inProgress.toString(), AivoTheme.sky),
                    if (needsAttention > 0)
                      _buildStatRow('Needs Attention', needsAttention.toString(), AivoTheme.sunshine),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatRow(String label, String value, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13,
                color: AivoTheme.textMuted,
              ),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  List<IEPGoal> _getUpcomingReviews() {
    final now = DateTime.now();
    final twoWeeksFromNow = now.add(const Duration(days: 14));
    
    return _goals.where((goal) {
      if (goal.reviewDate == null) return false;
      return goal.reviewDate!.isAfter(now) && goal.reviewDate!.isBefore(twoWeeksFromNow);
    }).toList()
      ..sort((a, b) => a.reviewDate!.compareTo(b.reviewDate!));
  }

  Widget _buildUpcomingReviews() {
    final reviews = _getUpcomingReviews();
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AivoTheme.sunshine.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AivoTheme.sunshine.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.event, color: AivoTheme.sunshine, size: 20),
              const SizedBox(width: 8),
              const Text(
                'Upcoming Reviews',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...reviews.map((goal) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              children: [
                Text(goal.category.emoji),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    goal.goalName,
                    style: const TextStyle(fontSize: 13),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Text(
                  _formatDate(goal.reviewDate!),
                  style: TextStyle(
                    fontSize: 12,
                    color: AivoTheme.textMuted,
                  ),
                ),
              ],
            ),
          )),
        ],
      ),
    );
  }

  Widget _buildFilters() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          // Category filter
          _buildFilterDropdown<IEPCategory>(
            label: 'Category',
            value: _selectedCategory,
            items: IEPCategory.values,
            displayName: (c) => c.displayName,
            onChanged: (c) => setState(() => _selectedCategory = c),
          ),
          const SizedBox(width: 8),
          // Status filter
          _buildFilterDropdown<IEPGoalStatus>(
            label: 'Status',
            value: _selectedStatus,
            items: IEPGoalStatus.values,
            displayName: (s) => s.displayName,
            onChanged: (s) => setState(() => _selectedStatus = s),
          ),
          const SizedBox(width: 8),
          // Clear filters
          if (_selectedCategory != null || _selectedStatus != null)
            TextButton.icon(
              onPressed: () {
                setState(() {
                  _selectedCategory = null;
                  _selectedStatus = null;
                });
              },
              icon: const Icon(Icons.clear, size: 16),
              label: const Text('Clear'),
              style: TextButton.styleFrom(
                foregroundColor: AivoTheme.textMuted,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildFilterDropdown<T>({
    required String label,
    required T? value,
    required List<T> items,
    required String Function(T) displayName,
    required void Function(T?) onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: value != null ? AivoTheme.primary.withOpacity(0.1) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: value != null ? AivoTheme.primary : Colors.grey.withOpacity(0.2),
        ),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<T>(
          value: value,
          hint: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              color: AivoTheme.textMuted,
            ),
          ),
          isDense: true,
          items: [
            DropdownMenuItem<T>(
              value: null,
              child: Text('All $label'),
            ),
            ...items.map((item) => DropdownMenuItem<T>(
              value: item,
              child: Text(displayName(item)),
            )),
          ],
          onChanged: onChanged,
          style: TextStyle(
            fontSize: 13,
            color: AivoTheme.textPrimary,
          ),
        ),
      ),
    );
  }

  Widget _buildGoalsList() {
    final filtered = _filteredGoals;
    
    if (filtered.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            children: [
              const Text('🎯', style: TextStyle(fontSize: 48)),
              const SizedBox(height: 16),
              Text(
                _goals.isEmpty ? 'No IEP goals yet' : 'No goals match filters',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _goals.isEmpty 
                    ? 'Add a goal to start tracking progress'
                    : 'Try adjusting your filters',
                style: TextStyle(color: AivoTheme.textMuted),
              ),
            ],
          ),
        ),
      );
    }

    // Group by category
    final grouped = <IEPCategory, List<IEPGoal>>{};
    for (final goal in filtered) {
      grouped.putIfAbsent(goal.category, () => []).add(goal);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: grouped.entries.map((entry) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Row(
                children: [
                  Text(entry.key.emoji, style: const TextStyle(fontSize: 16)),
                  const SizedBox(width: 8),
                  Text(
                    entry.key.displayName,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.grey.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      '${entry.value.length}',
                      style: TextStyle(
                        fontSize: 11,
                        color: AivoTheme.textMuted,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            ...entry.value.map((goal) => IEPGoalCard(
              goal: goal,
              onTap: () => _openGoalDetail(goal),
            )),
            const SizedBox(height: 8),
          ],
        );
      }).toList(),
    );
  }

  void _openGoalDetail(IEPGoal goal) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => IEPGoalDetailScreen(goal: goal),
      ),
    ).then((_) => _loadGoals()); // Refresh on return
  }

  void _showAddGoalSheet() {
    // TODO: Implement add goal sheet (teachers only)
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Goal creation coming soon!'),
        backgroundColor: AivoTheme.primary,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = date.difference(now);
    
    if (diff.inDays == 0) return 'Today';
    if (diff.inDays == 1) return 'Tomorrow';
    if (diff.inDays < 7) return 'In ${diff.inDays} days';
    return '${date.month}/${date.day}';
  }

  // Mock data generator
  List<IEPGoal> _generateMockGoals() {
    final now = DateTime.now();
    return [
      IEPGoal(
        id: '1',
        learnerId: widget.learnerId ?? 'demo',
        goalName: 'Reading Comprehension',
        category: IEPCategory.academic,
        subject: 'ELA',
        description: 'Student will answer inferential questions about grade-level text with 80% accuracy.',
        currentLevel: 55,
        targetLevel: 80,
        measurementUnit: 'accuracy %',
        status: IEPGoalStatus.inProgress,
        startDate: now.subtract(const Duration(days: 60)),
        targetDate: now.add(const Duration(days: 120)),
        reviewDate: now.add(const Duration(days: 10)),
        dataPoints: [
          IEPDataPoint(id: 'd1', goalId: '1', value: 45, measurementDate: now.subtract(const Duration(days: 50)), context: IEPMeasurementContext.classroom),
          IEPDataPoint(id: 'd2', goalId: '1', value: 48, measurementDate: now.subtract(const Duration(days: 40)), context: IEPMeasurementContext.classroom),
          IEPDataPoint(id: 'd3', goalId: '1', value: 52, measurementDate: now.subtract(const Duration(days: 30)), context: IEPMeasurementContext.classroom),
          IEPDataPoint(id: 'd4', goalId: '1', value: 50, measurementDate: now.subtract(const Duration(days: 20)), context: IEPMeasurementContext.classroom),
          IEPDataPoint(id: 'd5', goalId: '1', value: 55, measurementDate: now.subtract(const Duration(days: 10)), context: IEPMeasurementContext.classroom),
        ],
      ),
      IEPGoal(
        id: '2',
        learnerId: widget.learnerId ?? 'demo',
        goalName: 'Math Problem Solving',
        category: IEPCategory.academic,
        subject: 'Math',
        description: 'Student will solve multi-step word problems using appropriate strategies with 75% accuracy.',
        currentLevel: 70,
        targetLevel: 75,
        measurementUnit: 'accuracy %',
        status: IEPGoalStatus.inProgress,
        startDate: now.subtract(const Duration(days: 90)),
        targetDate: now.add(const Duration(days: 30)),
        dataPoints: [
          IEPDataPoint(id: 'd6', goalId: '2', value: 50, measurementDate: now.subtract(const Duration(days: 80)), context: IEPMeasurementContext.classroom),
          IEPDataPoint(id: 'd7', goalId: '2', value: 55, measurementDate: now.subtract(const Duration(days: 60)), context: IEPMeasurementContext.classroom),
          IEPDataPoint(id: 'd8', goalId: '2', value: 62, measurementDate: now.subtract(const Duration(days: 40)), context: IEPMeasurementContext.classroom),
          IEPDataPoint(id: 'd9', goalId: '2', value: 68, measurementDate: now.subtract(const Duration(days: 20)), context: IEPMeasurementContext.classroom),
          IEPDataPoint(id: 'd10', goalId: '2', value: 70, measurementDate: now.subtract(const Duration(days: 5)), context: IEPMeasurementContext.classroom),
        ],
      ),
      IEPGoal(
        id: '3',
        learnerId: widget.learnerId ?? 'demo',
        goalName: 'Turn-Taking in Conversation',
        category: IEPCategory.socialEmotional,
        description: 'Student will wait for their turn and respond appropriately in 4 out of 5 peer conversations.',
        currentLevel: 3.2,
        targetLevel: 4,
        measurementUnit: 'out of 5',
        status: IEPGoalStatus.inProgress,
        startDate: now.subtract(const Duration(days: 45)),
        targetDate: now.add(const Duration(days: 90)),
        dataPoints: [
          IEPDataPoint(id: 'd11', goalId: '3', value: 2.0, measurementDate: now.subtract(const Duration(days: 40)), context: IEPMeasurementContext.classroom),
          IEPDataPoint(id: 'd12', goalId: '3', value: 2.5, measurementDate: now.subtract(const Duration(days: 30)), context: IEPMeasurementContext.classroom),
          IEPDataPoint(id: 'd13', goalId: '3', value: 3.0, measurementDate: now.subtract(const Duration(days: 20)), context: IEPMeasurementContext.classroom),
          IEPDataPoint(id: 'd14', goalId: '3', value: 3.2, measurementDate: now.subtract(const Duration(days: 7)), context: IEPMeasurementContext.classroom),
        ],
      ),
      IEPGoal(
        id: '4',
        learnerId: widget.learnerId ?? 'demo',
        goalName: 'Expressing Needs Verbally',
        category: IEPCategory.communication,
        description: 'Student will use complete sentences to express needs and wants in 8 out of 10 opportunities.',
        currentLevel: 8,
        targetLevel: 8,
        measurementUnit: 'out of 10',
        status: IEPGoalStatus.achieved,
        startDate: now.subtract(const Duration(days: 120)),
        targetDate: now.subtract(const Duration(days: 10)),
        dataPoints: [
          IEPDataPoint(id: 'd15', goalId: '4', value: 5, measurementDate: now.subtract(const Duration(days: 100)), context: IEPMeasurementContext.therapy),
          IEPDataPoint(id: 'd16', goalId: '4', value: 6, measurementDate: now.subtract(const Duration(days: 80)), context: IEPMeasurementContext.therapy),
          IEPDataPoint(id: 'd17', goalId: '4', value: 7, measurementDate: now.subtract(const Duration(days: 50)), context: IEPMeasurementContext.therapy),
          IEPDataPoint(id: 'd18', goalId: '4', value: 8, measurementDate: now.subtract(const Duration(days: 15)), context: IEPMeasurementContext.therapy),
        ],
      ),
      IEPGoal(
        id: '5',
        learnerId: widget.learnerId ?? 'demo',
        goalName: 'Self-Regulation During Transitions',
        category: IEPCategory.behavioral,
        description: 'Student will independently transition between activities with 2 or fewer prompts.',
        currentLevel: 3,
        targetLevel: 2,
        measurementUnit: 'prompts',
        status: IEPGoalStatus.inProgress,
        startDate: now.subtract(const Duration(days: 30)),
        targetDate: now.add(const Duration(days: 150)),
        dataPoints: [
          IEPDataPoint(id: 'd19', goalId: '5', value: 5, measurementDate: now.subtract(const Duration(days: 25)), context: IEPMeasurementContext.classroom),
          IEPDataPoint(id: 'd20', goalId: '5', value: 4, measurementDate: now.subtract(const Duration(days: 15)), context: IEPMeasurementContext.classroom),
          IEPDataPoint(id: 'd21', goalId: '5', value: 3, measurementDate: now.subtract(const Duration(days: 5)), context: IEPMeasurementContext.classroom),
        ],
      ),
      IEPGoal(
        id: '6',
        learnerId: widget.learnerId ?? 'demo',
        goalName: 'Fine Motor - Handwriting',
        category: IEPCategory.motor,
        description: 'Student will write legibly on lined paper with proper letter formation.',
        currentLevel: 0,
        targetLevel: 80,
        measurementUnit: 'accuracy %',
        status: IEPGoalStatus.notStarted,
        startDate: now.add(const Duration(days: 14)),
        targetDate: now.add(const Duration(days: 180)),
        dataPoints: [],
      ),
    ];
  }
}
