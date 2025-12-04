import 'package:flutter/material.dart';
import 'package:aivo_shared/aivo_shared.dart';

/// Data model for subject difficulty recommendation
class SubjectDifficultyRecommendation {
  final String subject;
  final int enrolledGrade;
  final int assessedGradeLevel;
  final double masteryScore;
  final String? difficultyRecommendation; // 'harder', 'easier', or null for 'maintain'

  SubjectDifficultyRecommendation({
    required this.subject,
    required this.enrolledGrade,
    required this.assessedGradeLevel,
    required this.masteryScore,
    this.difficultyRecommendation,
  });

  factory SubjectDifficultyRecommendation.fromJson(Map<String, dynamic> json) {
    return SubjectDifficultyRecommendation(
      subject: json['subject'] as String,
      enrolledGrade: json['enrolledGrade'] as int,
      assessedGradeLevel: json['assessedGradeLevel'] as int,
      masteryScore: (json['masteryScore'] as num).toDouble(),
      difficultyRecommendation: json['difficultyRecommendation'] as String?,
    );
  }
}

/// Card displaying AI-driven difficulty recommendations for each subject
/// 
/// Ported from Web: apps/parent-teacher-web/app/learner/page.tsx
class DifficultyRecommendationsCard extends StatelessWidget {
  final List<SubjectDifficultyRecommendation> recommendations;
  final VoidCallback? onViewDetails;

  const DifficultyRecommendationsCard({
    super.key,
    required this.recommendations,
    this.onViewDetails,
  });

  @override
  Widget build(BuildContext context) {
    if (recommendations.isEmpty) {
      return _buildEmptyState();
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AivoTheme.primary.withOpacity(0.08),
            blurRadius: 24,
            offset: const Offset(0, 8),
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
                child: const Text('🎯', style: TextStyle(fontSize: 20)),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'AIVO Recommendations',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AivoTheme.textPrimary,
                      ),
                    ),
                    Text(
                      'AI-powered difficulty suggestions',
                      style: TextStyle(
                        fontSize: 12,
                        color: AivoTheme.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              if (onViewDetails != null)
                GestureDetector(
                  onTap: onViewDetails,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AivoTheme.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'View All',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AivoTheme.primary,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),

          // Recommendations list
          ...recommendations.map((rec) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _SubjectRecommendationTile(recommendation: rec),
          )),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: AivoTheme.mint.withOpacity(0.2),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Center(
              child: Text('📊', style: TextStyle(fontSize: 32)),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'No Recommendations Yet',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AivoTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Complete more activities to get personalized difficulty suggestions',
            style: TextStyle(
              fontSize: 13,
              color: AivoTheme.textMuted,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _SubjectRecommendationTile extends StatelessWidget {
  final SubjectDifficultyRecommendation recommendation;

  const _SubjectRecommendationTile({required this.recommendation});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AivoTheme.surfaceBackground,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: _getBorderColor(),
          width: 1.5,
        ),
      ),
      child: Column(
        children: [
          // Subject info row
          Row(
            children: [
              // Subject emoji
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: _getSubjectColor().withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(
                    _getSubjectEmoji(),
                    style: const TextStyle(fontSize: 22),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Subject details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      recommendation.subject.toUpperCase(),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: AivoTheme.primary,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Enrolled: Grade ${recommendation.enrolledGrade} • Working at: Grade ${recommendation.assessedGradeLevel}',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AivoTheme.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              // Mastery score
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    'Mastery',
                    style: TextStyle(
                      fontSize: 10,
                      color: AivoTheme.textMuted,
                    ),
                  ),
                  Text(
                    '${(recommendation.masteryScore * 100).toStringAsFixed(0)}%',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AivoTheme.primary,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Recommendation row
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: _getRecommendationBgColor(),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'AIVO suggests:',
                  style: TextStyle(
                    fontSize: 11,
                    color: AivoTheme.textMuted,
                  ),
                ),
                Row(
                  children: [
                    Text(
                      _getRecommendationEmoji(),
                      style: const TextStyle(fontSize: 14),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      _getRecommendationText(),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: _getRecommendationTextColor(),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Color _getSubjectColor() {
    switch (recommendation.subject.toLowerCase()) {
      case 'math':
        return AivoTheme.primary;
      case 'reading':
        return AivoTheme.mint;
      case 'science':
        return AivoTheme.sky;
      case 'writing':
        return AivoTheme.coral;
      default:
        return AivoTheme.lavender;
    }
  }

  String _getSubjectEmoji() {
    switch (recommendation.subject.toLowerCase()) {
      case 'math':
        return '🔢';
      case 'reading':
        return '📖';
      case 'science':
        return '🔬';
      case 'writing':
        return '✏️';
      case 'social studies':
        return '🌍';
      default:
        return '📚';
    }
  }

  Color _getBorderColor() {
    if (recommendation.difficultyRecommendation == 'harder') {
      return AivoTheme.success.withOpacity(0.3);
    } else if (recommendation.difficultyRecommendation == 'easier') {
      return AivoTheme.sunshine.withOpacity(0.3);
    }
    return Colors.grey.shade200;
  }

  Color _getRecommendationBgColor() {
    if (recommendation.difficultyRecommendation == 'harder') {
      return AivoTheme.success.withOpacity(0.1);
    } else if (recommendation.difficultyRecommendation == 'easier') {
      return AivoTheme.sunshine.withOpacity(0.15);
    }
    return Colors.grey.shade100;
  }

  String _getRecommendationEmoji() {
    if (recommendation.difficultyRecommendation == 'harder') {
      return '⬆️';
    } else if (recommendation.difficultyRecommendation == 'easier') {
      return '⬇️';
    }
    return '➡️';
  }

  String _getRecommendationText() {
    final rec = recommendation.difficultyRecommendation;
    if (rec == null || rec.isEmpty) {
      return 'Maintain';
    }
    return rec[0].toUpperCase() + rec.substring(1);
  }

  Color _getRecommendationTextColor() {
    if (recommendation.difficultyRecommendation == 'harder') {
      return AivoTheme.success;
    } else if (recommendation.difficultyRecommendation == 'easier') {
      return Colors.amber.shade700;
    }
    return AivoTheme.textMuted;
  }
}
