import 'package:flutter/material.dart';
import 'package:aivo_shared/aivo_shared.dart';

/// Card component for displaying an IEP goal summary
class IEPGoalCard extends StatelessWidget {
  final IEPGoal goal;
  final VoidCallback? onTap;
  final bool showDetails;

  const IEPGoalCard({
    super.key,
    required this.goal,
    this.onTap,
    this.showDetails = true,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
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
            // Header with category and status
            _buildHeader(),
            
            // Goal name and description
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    goal.goalName,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AivoTheme.textPrimary,
                    ),
                  ),
                  if (showDetails) ...[
                    const SizedBox(height: 4),
                    Text(
                      goal.description,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 13,
                        color: AivoTheme.textMuted,
                        height: 1.4,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            
            const SizedBox(height: 12),
            
            // Progress bar
            _buildProgressBar(),
            
            const SizedBox(height: 12),
            
            // Footer with stats
            if (showDetails) _buildFooter(),
            
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Color(goal.category.colorValue).withOpacity(0.1),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
      ),
      child: Row(
        children: [
          // Category icon
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(
              child: Text(
                goal.category.emoji,
                style: const TextStyle(fontSize: 18),
              ),
            ),
          ),
          const SizedBox(width: 10),
          
          // Category name
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  goal.category.displayName,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Color(goal.category.colorValue),
                  ),
                ),
                if (goal.subject != null)
                  Text(
                    goal.subject!,
                    style: TextStyle(
                      fontSize: 11,
                      color: AivoTheme.textMuted,
                    ),
                  ),
              ],
            ),
          ),
          
          // Status badge
          _buildStatusBadge(),
        ],
      ),
    );
  }

  Widget _buildStatusBadge() {
    final color = Color(goal.status.colorValue);
    final needsAttention = goal.needsAttention && goal.status == IEPGoalStatus.inProgress;
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: needsAttention ? AivoTheme.sunshine.withOpacity(0.2) : color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(12),
        border: needsAttention 
            ? Border.all(color: AivoTheme.sunshine, width: 1)
            : null,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (goal.status == IEPGoalStatus.achieved)
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
            needsAttention ? 'Needs Attention' : goal.status.displayName,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: needsAttention ? Colors.orange[700] : color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressBar() {
    final progressColor = _getProgressColor();
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Progress',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: AivoTheme.textMuted,
                ),
              ),
              Text(
                '${goal.progressPercentage.toStringAsFixed(0)}%',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: progressColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Stack(
            children: [
              // Background track
              Container(
                height: 8,
                decoration: BoxDecoration(
                  color: Colors.grey[200],
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              // Progress fill
              FractionallySizedBox(
                widthFactor: goal.progressPercentage / 100,
                child: Container(
                  height: 8,
                  decoration: BoxDecoration(
                    color: progressColor,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
              // Target marker
              Positioned(
                left: 0,
                right: 0,
                child: Container(
                  height: 8,
                  alignment: Alignment.centerRight,
                  child: Container(
                    width: 2,
                    height: 12,
                    decoration: BoxDecoration(
                      color: AivoTheme.textPrimary,
                      borderRadius: BorderRadius.circular(1),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Current: ${goal.currentLevel.toStringAsFixed(1)} ${goal.measurementUnit}',
                style: TextStyle(
                  fontSize: 10,
                  color: AivoTheme.textMuted,
                ),
              ),
              Text(
                'Target: ${goal.targetLevel.toStringAsFixed(1)} ${goal.measurementUnit}',
                style: TextStyle(
                  fontSize: 10,
                  color: AivoTheme.textMuted,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFooter() {
    final daysUntil = goal.daysUntilTarget;
    final latestData = goal.latestDataPoint;
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          // Days until target
          _buildFooterItem(
            icon: Icons.calendar_today_outlined,
            label: daysUntil > 0 
                ? '$daysUntil days left'
                : daysUntil == 0 
                    ? 'Due today'
                    : '${-daysUntil} days overdue',
            color: daysUntil < 0 
                ? AivoTheme.coral 
                : daysUntil <= 7 
                    ? AivoTheme.sunshine 
                    : AivoTheme.textMuted,
          ),
          
          const SizedBox(width: 16),
          
          // Last data point
          _buildFooterItem(
            icon: Icons.edit_note_outlined,
            label: latestData != null 
                ? 'Updated ${_formatRelativeDate(latestData.measurementDate)}'
                : 'No data yet',
            color: AivoTheme.textMuted,
          ),
          
          const Spacer(),
          
          // Data points count
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: AivoTheme.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.show_chart,
                  size: 14,
                  color: AivoTheme.primary,
                ),
                const SizedBox(width: 4),
                Text(
                  '${goal.dataPoints.length}',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: AivoTheme.primary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFooterItem({
    required IconData icon,
    required String label,
    required Color color,
  }) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            color: color,
          ),
        ),
      ],
    );
  }

  Color _getProgressColor() {
    if (goal.status == IEPGoalStatus.achieved) return AivoTheme.mint;
    if (goal.needsAttention) return AivoTheme.sunshine;
    if (goal.isOnTrack) return AivoTheme.mint;
    if (goal.progressPercentage >= 50) return AivoTheme.sky;
    return AivoTheme.primary;
  }

  String _formatRelativeDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);
    
    if (diff.inDays == 0) return 'today';
    if (diff.inDays == 1) return 'yesterday';
    if (diff.inDays < 7) return '${diff.inDays} days ago';
    if (diff.inDays < 30) return '${(diff.inDays / 7).floor()} weeks ago';
    return '${(diff.inDays / 30).floor()} months ago';
  }
}

/// Extension to add color value to IEPCategory
extension IEPCategoryColor on IEPCategory {
  int get colorValue {
    switch (this) {
      case IEPCategory.academic:
        return 0xFF7C4DFF; // Purple
      case IEPCategory.behavioral:
        return 0xFF2196F3; // Blue
      case IEPCategory.socialEmotional:
        return 0xFFE91E63; // Pink
      case IEPCategory.communication:
        return 0xFF00BCD4; // Cyan
      case IEPCategory.motor:
        return 0xFFFF9800; // Orange
      case IEPCategory.selfCare:
        return 0xFF4CAF50; // Green
      case IEPCategory.transition:
        return 0xFF9C27B0; // Deep Purple
    }
  }
}

/// Compact version of the goal card for lists
class IEPGoalCardCompact extends StatelessWidget {
  final IEPGoal goal;
  final VoidCallback? onTap;

  const IEPGoalCardCompact({
    super.key,
    required this.goal,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        margin: const EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: Colors.grey.withOpacity(0.15),
          ),
        ),
        child: Row(
          children: [
            // Category emoji
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: Color(goal.category.colorValue).withOpacity(0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Center(
                child: Text(
                  goal.category.emoji,
                  style: const TextStyle(fontSize: 20),
                ),
              ),
            ),
            const SizedBox(width: 12),
            
            // Goal info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    goal.goalName,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      // Progress indicator
                      SizedBox(
                        width: 60,
                        child: LinearProgressIndicator(
                          value: goal.progressPercentage / 100,
                          backgroundColor: Colors.grey[200],
                          valueColor: AlwaysStoppedAnimation<Color>(
                            goal.isOnTrack ? AivoTheme.mint : AivoTheme.sunshine,
                          ),
                          minHeight: 4,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '${goal.progressPercentage.toStringAsFixed(0)}%',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: goal.isOnTrack ? AivoTheme.mint : AivoTheme.sunshine,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            
            // Arrow
            Icon(
              Icons.chevron_right,
              color: AivoTheme.textMuted,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }
}
