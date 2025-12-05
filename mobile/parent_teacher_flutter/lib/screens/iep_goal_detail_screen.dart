import 'package:flutter/material.dart';
import 'package:aivo_shared/aivo_shared.dart';
import 'package:aivo_shared/user_context.dart';
import '../widgets/iep_progress_chart.dart';
import '../widgets/iep_goal_card.dart';
import 'iep_data_entry_screen.dart';

/// Detailed view of a single IEP goal
class IEPGoalDetailScreen extends StatefulWidget {
  final IEPGoal goal;

  const IEPGoalDetailScreen({
    super.key,
    required this.goal,
  });

  @override
  State<IEPGoalDetailScreen> createState() => _IEPGoalDetailScreenState();
}

class _IEPGoalDetailScreenState extends State<IEPGoalDetailScreen> 
    with SingleTickerProviderStateMixin {
  final AivoApiClient _client = AivoApiClient();
  final UserContextService _userContext = UserContextService.instance;
  late TabController _tabController;
  late IEPGoal _goal;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _goal = widget.goal;
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _refreshGoal() async {
    setState(() => _loading = true);
    
    try {
      // Fetch updated goal from API
      final updatedGoal = await _client.getIEPGoal(_goal.id);
      
      if (mounted) {
        setState(() {
          _goal = updatedGoal;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to refresh: $e')),
        );
      }
    }
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
                child: RefreshIndicator(
                  onRefresh: _refreshGoal,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: Column(
                      children: [
                        // Goal header card
                        _buildGoalHeader(),
                        
                        // Tab bar
                        _buildTabBar(),
                        
                        // Tab content
                        SizedBox(
                          height: MediaQuery.of(context).size.height * 0.6,
                          child: TabBarView(
                            controller: _tabController,
                            children: [
                              _buildProgressTab(),
                              _buildDataPointsTab(),
                              _buildNotesTab(),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _addDataPoint,
        backgroundColor: AivoTheme.primary,
        icon: const Icon(Icons.add),
        label: const Text('Add Data'),
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
                  'Goal Details',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AivoTheme.textPrimary,
                  ),
                ),
                Text(
                  _goal.category.displayName,
                  style: TextStyle(
                    fontSize: 13,
                    color: AivoTheme.textMuted,
                  ),
                ),
              ],
            ),
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert, color: AivoTheme.textPrimary),
            onSelected: _handleMenuAction,
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'edit',
                child: Row(
                  children: [
                    Icon(Icons.edit_outlined, size: 20),
                    SizedBox(width: 8),
                    Text('Edit Goal'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'status',
                child: Row(
                  children: [
                    Icon(Icons.flag_outlined, size: 20),
                    SizedBox(width: 8),
                    Text('Update Status'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'share',
                child: Row(
                  children: [
                    Icon(Icons.share_outlined, size: 20),
                    SizedBox(width: 8),
                    Text('Share Progress'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildGoalHeader() {
    return Container(
      margin: const EdgeInsets.all(16),
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
          // Category and status row
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Color(_goal.category.colorValue).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(_goal.category.emoji, style: const TextStyle(fontSize: 14)),
                    const SizedBox(width: 6),
                    Text(
                      _goal.category.displayName,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Color(_goal.category.colorValue),
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              _buildStatusBadge(),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Goal name
          Text(
            _goal.goalName,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: AivoTheme.textPrimary,
            ),
          ),
          
          const SizedBox(height: 8),
          
          // Description
          Text(
            _goal.description,
            style: TextStyle(
              fontSize: 14,
              color: AivoTheme.textMuted,
              height: 1.5,
            ),
          ),
          
          const SizedBox(height: 20),
          
          // Progress summary
          _buildProgressSummary(),
          
          const SizedBox(height: 16),
          
          // Timeline
          _buildTimeline(),
        ],
      ),
    );
  }

  Widget _buildStatusBadge() {
    final color = Color(_goal.status.colorValue);
    final needsAttention = _goal.needsAttention && _goal.status == IEPGoalStatus.inProgress;
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: needsAttention ? AivoTheme.sunshine.withOpacity(0.2) : color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (_goal.status == IEPGoalStatus.achieved)
            const Padding(
              padding: EdgeInsets.only(right: 4),
              child: Icon(Icons.check_circle, size: 14, color: Colors.green),
            ),
          if (needsAttention)
            const Padding(
              padding: EdgeInsets.only(right: 4),
              child: Icon(Icons.warning_rounded, size: 14, color: Colors.orange),
            ),
          Text(
            needsAttention ? 'Needs Attention' : _goal.status.displayName,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: needsAttention ? Colors.orange[700] : color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressSummary() {
    final progressColor = _goal.isOnTrack ? AivoTheme.mint : 
                          _goal.needsAttention ? AivoTheme.sunshine : AivoTheme.primary;
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: progressColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Current',
                    style: TextStyle(
                      fontSize: 11,
                      color: AivoTheme.textMuted,
                    ),
                  ),
                  Text(
                    '${_goal.currentLevel.toStringAsFixed(1)}',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    _goal.measurementUnit,
                    style: TextStyle(
                      fontSize: 11,
                      color: AivoTheme.textMuted,
                    ),
                  ),
                ],
              ),
              Column(
                children: [
                  Text(
                    '${_goal.progressPercentage.toStringAsFixed(0)}%',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: progressColor,
                    ),
                  ),
                  Text(
                    'Progress',
                    style: TextStyle(
                      fontSize: 11,
                      color: AivoTheme.textMuted,
                    ),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    'Target',
                    style: TextStyle(
                      fontSize: 11,
                      color: AivoTheme.textMuted,
                    ),
                  ),
                  Text(
                    '${_goal.targetLevel.toStringAsFixed(1)}',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    _goal.measurementUnit,
                    style: TextStyle(
                      fontSize: 11,
                      color: AivoTheme.textMuted,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: _goal.progressPercentage / 100,
              backgroundColor: Colors.white,
              valueColor: AlwaysStoppedAnimation<Color>(progressColor),
              minHeight: 8,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimeline() {
    return Row(
      children: [
        Expanded(
          child: _buildTimelineItem(
            icon: Icons.play_arrow_rounded,
            label: 'Start',
            date: _goal.startDate,
            color: AivoTheme.sky,
          ),
        ),
        Expanded(
          child: Container(
            height: 2,
            color: Colors.grey[200],
          ),
        ),
        if (_goal.reviewDate != null) ...[
          Expanded(
            child: _buildTimelineItem(
              icon: Icons.rate_review_outlined,
              label: 'Review',
              date: _goal.reviewDate!,
              color: AivoTheme.sunshine,
            ),
          ),
          Expanded(
            child: Container(
              height: 2,
              color: Colors.grey[200],
            ),
          ),
        ],
        Expanded(
          child: _buildTimelineItem(
            icon: Icons.flag_rounded,
            label: 'Target',
            date: _goal.targetDate,
            color: AivoTheme.mint,
          ),
        ),
      ],
    );
  }

  Widget _buildTimelineItem({
    required IconData icon,
    required String label,
    required DateTime date,
    required Color color,
  }) {
    return Column(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: color.withOpacity(0.2),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, size: 16, color: color),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            color: AivoTheme.textMuted,
          ),
        ),
        Text(
          '${date.month}/${date.day}',
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildTabBar() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: TabBar(
        controller: _tabController,
        indicator: BoxDecoration(
          color: AivoTheme.primary.withOpacity(0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        indicatorSize: TabBarIndicatorSize.tab,
        labelColor: AivoTheme.primary,
        unselectedLabelColor: AivoTheme.textMuted,
        labelStyle: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
        ),
        tabs: const [
          Tab(text: 'Progress'),
          Tab(text: 'Data Points'),
          Tab(text: 'Notes'),
        ],
      ),
    );
  }

  Widget _buildProgressTab() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Progress Over Time',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          IEPProgressChart(
            goal: _goal,
            height: 250,
          ),
          const SizedBox(height: 24),
          // Statistics
          _buildStatisticsSection(),
        ],
      ),
    );
  }

  Widget _buildStatisticsSection() {
    final dataPoints = _goal.dataPoints;
    if (dataPoints.isEmpty) {
      return const SizedBox.shrink();
    }

    final values = dataPoints.map((dp) => dp.value).toList();
    final avg = values.reduce((a, b) => a + b) / values.length;
    final min = values.reduce((a, b) => a < b ? a : b);
    final max = values.reduce((a, b) => a > b ? a : b);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
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
          const Text(
            'Statistics',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _buildStatItem('Average', avg.toStringAsFixed(1), AivoTheme.primary),
              _buildStatItem('Min', min.toStringAsFixed(1), AivoTheme.coral),
              _buildStatItem('Max', max.toStringAsFixed(1), AivoTheme.mint),
              _buildStatItem('Points', dataPoints.length.toString(), AivoTheme.sky),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, Color color) {
    return Expanded(
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: AivoTheme.textMuted,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDataPointsTab() {
    final sortedDataPoints = List<IEPDataPoint>.from(_goal.dataPoints)
      ..sort((a, b) => b.measurementDate.compareTo(a.measurementDate));

    if (sortedDataPoints.isEmpty) {
      return _buildEmptyState(
        emoji: '📊',
        title: 'No data points yet',
        subtitle: 'Add measurements to track progress',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: sortedDataPoints.length,
      itemBuilder: (context, index) {
        return _buildDataPointItem(sortedDataPoints[index]);
      },
    );
  }

  Widget _buildDataPointItem(IEPDataPoint dataPoint) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withOpacity(0.1)),
      ),
      child: Row(
        children: [
          // Value
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: AivoTheme.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  dataPoint.value.toStringAsFixed(1),
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AivoTheme.primary,
                  ),
                ),
                Text(
                  _goal.measurementUnit.split(' ').first,
                  style: TextStyle(
                    fontSize: 9,
                    color: AivoTheme.textMuted,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          
          // Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.calendar_today_outlined,
                      size: 14,
                      color: AivoTheme.textMuted,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      _formatDate(dataPoint.measurementDate),
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AivoTheme.textPrimary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: _getContextColor(dataPoint.context).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        dataPoint.context.displayName,
                        style: TextStyle(
                          fontSize: 10,
                          color: _getContextColor(dataPoint.context),
                        ),
                      ),
                    ),
                    if (dataPoint.recordedByName != null) ...[
                      const SizedBox(width: 8),
                      Text(
                        'by ${dataPoint.recordedByName}',
                        style: TextStyle(
                          fontSize: 11,
                          color: AivoTheme.textMuted,
                        ),
                      ),
                    ],
                  ],
                ),
                if (dataPoint.notes != null && dataPoint.notes!.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    dataPoint.notes!,
                    style: TextStyle(
                      fontSize: 12,
                      color: AivoTheme.textMuted,
                      fontStyle: FontStyle.italic,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ],
            ),
          ),
          
          // Evidence indicator
          if (dataPoint.evidenceUrl != null)
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AivoTheme.sky.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.attach_file,
                size: 16,
                color: AivoTheme.sky,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildNotesTab() {
    final sortedNotes = List<IEPNote>.from(_goal.notes)
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));

    if (sortedNotes.isEmpty) {
      return _buildEmptyState(
        emoji: '📝',
        title: 'No notes yet',
        subtitle: 'Add observations, strategies, or celebrations',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: sortedNotes.length + 1, // +1 for add note button
      itemBuilder: (context, index) {
        if (index == 0) {
          return _buildAddNoteButton();
        }
        return _buildNoteItem(sortedNotes[index - 1]);
      },
    );
  }

  Widget _buildAddNoteButton() {
    return GestureDetector(
      onTap: _addNote,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: AivoTheme.primary.withOpacity(0.3),
            style: BorderStyle.solid,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.add_circle_outline, color: AivoTheme.primary, size: 20),
            const SizedBox(width: 8),
            Text(
              'Add a Note',
              style: TextStyle(
                color: AivoTheme.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoteItem(IEPNote note) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                note.noteType.emoji,
                style: const TextStyle(fontSize: 16),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: _getNoteTypeColor(note.noteType).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  note.noteType.displayName,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: _getNoteTypeColor(note.noteType),
                  ),
                ),
              ),
              const Spacer(),
              if (note.isPrivate)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.grey.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.lock, size: 10, color: AivoTheme.textMuted),
                      const SizedBox(width: 2),
                      Text(
                        'Private',
                        style: TextStyle(
                          fontSize: 9,
                          color: AivoTheme.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            note.content,
            style: const TextStyle(
              fontSize: 14,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Text(
                note.authorName ?? note.authorRole,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: AivoTheme.textMuted,
                ),
              ),
              Text(
                ' • ${_formatDate(note.createdAt)}',
                style: TextStyle(
                  fontSize: 11,
                  color: AivoTheme.textMuted,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState({
    required String emoji,
    required String title,
    required String subtitle,
  }) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 48)),
            const SizedBox(height: 16),
            Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: TextStyle(color: AivoTheme.textMuted),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  void _handleMenuAction(String action) {
    switch (action) {
      case 'edit':
        _editGoal();
        break;
      case 'status':
        _updateStatus();
        break;
      case 'share':
        _shareProgress();
        break;
    }
  }

  void _editGoal() {
    // TODO: Navigate to edit goal screen (teachers only)
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Goal editing coming soon!'),
        backgroundColor: AivoTheme.primary,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  void _updateStatus() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Update Status',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            ...IEPGoalStatus.values.map((status) => ListTile(
              leading: Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  color: Color(status.colorValue),
                  shape: BoxShape.circle,
                ),
              ),
              title: Text(status.displayName),
              trailing: _goal.status == status 
                  ? const Icon(Icons.check, color: AivoTheme.primary)
                  : null,
              onTap: () {
                Navigator.pop(context);
                _setStatus(status);
              },
            )),
          ],
        ),
      ),
    );
  }

  Future<void> _setStatus(IEPGoalStatus status) async {
    final previousGoal = _goal;
    
    // Optimistic update
    setState(() {
      _goal = _goal.copyWith(status: status);
    });
    
    try {
      // Update via API
      final updatedGoal = await _client.updateIEPGoal(
        goalId: _goal.id,
        status: status.name,
      );
      
      if (mounted) {
        setState(() {
          _goal = updatedGoal;
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Status updated to ${status.displayName}'),
            backgroundColor: AivoTheme.mint,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    } catch (e) {
      // Rollback on error
      if (mounted) {
        setState(() {
          _goal = previousGoal;
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update status: $e'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    }
  }

  void _shareProgress() {
    // TODO: Implement share functionality
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Sharing coming soon!'),
        backgroundColor: AivoTheme.primary,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  void _addDataPoint() async {
    final result = await Navigator.push<IEPDataPoint>(
      context,
      MaterialPageRoute(
        builder: (context) => IEPDataEntryScreen(goal: _goal),
      ),
    );

    if (result != null) {
      setState(() {
        _goal = _goal.copyWith(
          dataPoints: [..._goal.dataPoints, result],
          currentLevel: result.value,
        );
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Data point added! 🎉'),
          backgroundColor: AivoTheme.mint,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    }
  }

  void _addNote() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => _AddNoteSheet(
        onSave: (note) {
          setState(() {
            _goal = _goal.copyWith(
              notes: [..._goal.notes, note],
            );
          });
          Navigator.pop(context);
          ScaffoldMessenger.of(this.context).showSnackBar(
            SnackBar(
              content: const Text('Note added! 📝'),
              backgroundColor: AivoTheme.mint,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          );
        },
        goalId: _goal.id,
      ),
    );
  }

  Color _getContextColor(IEPMeasurementContext context) {
    switch (context) {
      case IEPMeasurementContext.classroom:
        return AivoTheme.primary;
      case IEPMeasurementContext.home:
        return AivoTheme.mint;
      case IEPMeasurementContext.therapy:
        return AivoTheme.sky;
      case IEPMeasurementContext.community:
        return AivoTheme.sunshine;
      case IEPMeasurementContext.assessment:
        return AivoTheme.coral;
      case IEPMeasurementContext.other:
        return AivoTheme.textMuted;
    }
  }

  Color _getNoteTypeColor(IEPNoteType type) {
    switch (type) {
      case IEPNoteType.observation:
        return AivoTheme.sky;
      case IEPNoteType.strategy:
        return AivoTheme.primary;
      case IEPNoteType.concern:
        return AivoTheme.sunshine;
      case IEPNoteType.celebration:
        return AivoTheme.mint;
    }
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);
    
    if (diff.inDays == 0) return 'Today';
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) return '${diff.inDays} days ago';
    return '${date.month}/${date.day}/${date.year}';
  }
}

// Add note bottom sheet
class _AddNoteSheet extends StatefulWidget {
  final Function(IEPNote) onSave;
  final String goalId;

  const _AddNoteSheet({
    required this.onSave,
    required this.goalId,
  });

  @override
  State<_AddNoteSheet> createState() => _AddNoteSheetState();
}

class _AddNoteSheetState extends State<_AddNoteSheet> {
  final _contentController = TextEditingController();
  final _userContext = UserContextService.instance;
  IEPNoteType _selectedType = IEPNoteType.observation;
  bool _isPrivate = false;

  @override
  void dispose() {
    _contentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 20,
        right: 20,
        top: 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Add Note',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          
          // Note type selection
          const Text(
            'Note Type',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: IEPNoteType.values.map((type) {
              final isSelected = type == _selectedType;
              return ChoiceChip(
                label: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(type.emoji),
                    const SizedBox(width: 4),
                    Text(type.displayName),
                  ],
                ),
                selected: isSelected,
                onSelected: (selected) {
                  if (selected) setState(() => _selectedType = type);
                },
              );
            }).toList(),
          ),
          const SizedBox(height: 16),
          
          // Content
          TextField(
            controller: _contentController,
            maxLines: 4,
            decoration: InputDecoration(
              hintText: 'Write your note...',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          const SizedBox(height: 12),
          
          // Private toggle
          Row(
            children: [
              Switch(
                value: _isPrivate,
                onChanged: (value) => setState(() => _isPrivate = value),
              ),
              const SizedBox(width: 8),
              Text(
                'Private (visible to educators only)',
                style: TextStyle(
                  fontSize: 13,
                  color: AivoTheme.textMuted,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Save button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _contentController.text.isNotEmpty ? _save : null,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: const Text('Save Note'),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  void _save() {
    final authorInfo = _userContext.getAuthorInfo();
    final note = IEPNote(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      goalId: widget.goalId,
      authorId: authorInfo['authorId']!,
      authorRole: authorInfo['authorRole']!,
      authorName: authorInfo['authorName']!,
      content: _contentController.text,
      noteType: _selectedType,
      isPrivate: _isPrivate,
    );
    widget.onSave(note);
  }
}
