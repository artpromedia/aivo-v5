import 'package:flutter/material.dart';
import 'package:aivo_shared/aivo_shared.dart';

/// Data model for a resolved difficulty proposal
class ResolvedDifficultyProposal {
  final String id;
  final String subject;
  final String direction; // 'harder' or 'easier'
  final int fromAssessedGradeLevel;
  final int toAssessedGradeLevel;
  final String status; // 'approved' or 'rejected'
  final DateTime resolvedAt;
  final String? resolvedBy;

  ResolvedDifficultyProposal({
    required this.id,
    required this.subject,
    required this.direction,
    required this.fromAssessedGradeLevel,
    required this.toAssessedGradeLevel,
    required this.status,
    required this.resolvedAt,
    this.resolvedBy,
  });

  factory ResolvedDifficultyProposal.fromJson(Map<String, dynamic> json) {
    return ResolvedDifficultyProposal(
      id: json['id'] as String,
      subject: json['subject'] as String,
      direction: json['direction'] as String,
      fromAssessedGradeLevel: json['fromAssessedGradeLevel'] as int,
      toAssessedGradeLevel: json['toAssessedGradeLevel'] as int,
      status: json['status'] as String,
      resolvedAt: DateTime.parse(json['resolvedAt'] as String),
      resolvedBy: json['resolvedBy'] as String?,
    );
  }
}

/// Section displaying history of resolved AI difficulty proposals
/// 
/// Ported from Web: apps/parent-teacher-web/app/difficulty/page.tsx
class ResolvedProposalsSection extends StatelessWidget {
  final List<ResolvedDifficultyProposal> proposals;
  final bool showEmptyState;
  final VoidCallback? onViewAll;

  const ResolvedProposalsSection({
    super.key,
    required this.proposals,
    this.showEmptyState = false,
    this.onViewAll,
  });

  @override
  Widget build(BuildContext context) {
    if (proposals.isEmpty) {
      return showEmptyState ? _buildEmptyState() : const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.all(20),
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AivoTheme.lavender.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text('📋', style: TextStyle(fontSize: 20)),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'Previous Decisions',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AivoTheme.textPrimary,
                  ),
                ),
              ),
              if (onViewAll != null)
                GestureDetector(
                  onTap: onViewAll,
                  child: Text(
                    'View All',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AivoTheme.primary,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),

          // Proposals list
          ...proposals.map((proposal) => Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _ResolvedProposalTile(proposal: proposal),
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
              child: Text('🎉', style: TextStyle(fontSize: 32)),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'No Previous Decisions',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AivoTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Resolved difficulty proposals will appear here',
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

class _ResolvedProposalTile extends StatelessWidget {
  final ResolvedDifficultyProposal proposal;

  const _ResolvedProposalTile({required this.proposal});

  @override
  Widget build(BuildContext context) {
    final isApproved = proposal.status == 'approved';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AivoTheme.lavender.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AivoTheme.lavender.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          // Direction icon
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(
              child: Text(
                proposal.direction == 'harder' ? '📈' : '📉',
                style: const TextStyle(fontSize: 20),
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Subject and grade info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  proposal.subject.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: AivoTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Grade ${proposal.fromAssessedGradeLevel} → ${proposal.toAssessedGradeLevel}',
                  style: TextStyle(
                    fontSize: 12,
                    color: AivoTheme.textMuted,
                  ),
                ),
              ],
            ),
          ),
          // Status badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: isApproved
                  ? AivoTheme.success.withOpacity(0.15)
                  : AivoTheme.coral.withOpacity(0.15),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  isApproved ? '✓' : '✗',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: isApproved ? AivoTheme.success : AivoTheme.coral,
                  ),
                ),
                const SizedBox(width: 4),
                Text(
                  isApproved ? 'Approved' : 'Rejected',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: isApproved ? AivoTheme.success : AivoTheme.coral,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
