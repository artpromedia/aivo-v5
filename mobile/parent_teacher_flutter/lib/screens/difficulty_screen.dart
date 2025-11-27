import 'package:flutter/material.dart';
import 'package:aivo_shared/aivo_shared.dart';

class DifficultyScreen extends StatefulWidget {
  const DifficultyScreen({super.key});

  @override
  State<DifficultyScreen> createState() => _DifficultyScreenState();
}

class _DifficultyScreenState extends State<DifficultyScreen> {
  final AivoApiClient _client = AivoApiClient();

  bool _loading = true;
  String? _error;
  List<DifficultyChangeProposal> _proposals = [];
  String? _learnerId;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final me = await _client.me();
      if (me.learner != null) {
        _learnerId = me.learner!.id;
        final response = await _client.listDifficultyProposals(_learnerId!);
        setState(() {
          _proposals = response.proposals;
          _loading = false;
        });
      } else {
        setState(() {
          _error = 'No learner found';
          _loading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to load proposals';
        _loading = false;
      });
    }
  }

  Future<void> _handleDecision(String proposalId, bool approve) async {
    try {
      await _client.decideOnDifficultyProposal(
        proposalId: proposalId,
        approve: approve,
      );
      await _loadData();

      if (mounted) {
        final message = approve 
            ? '🎉 Great! Difficulty change approved!' 
            : '👍 Difficulty change declined';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message, style: const TextStyle(color: Colors.white)),
            backgroundColor: approve ? const Color(0xFF059669) : AivoTheme.textMuted,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('😅 Oops! Something went wrong', style: TextStyle(color: Colors.white)),
            backgroundColor: AivoTheme.coral,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
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
                child: _loading
                    ? _buildLoadingState()
                    : _buildContent(),
              ),
            ],
          ),
        ),
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
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Difficulty Changes',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: AivoTheme.textPrimary,
                  ),
                ),
                Text(
                  'Review and approve',
                  style: TextStyle(
                    fontSize: 13,
                    color: AivoTheme.textMuted,
                  ),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: _loadData,
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
              child: Icon(Icons.refresh_rounded, color: AivoTheme.textMuted),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 50,
            height: 50,
            child: CircularProgressIndicator(
              strokeWidth: 4,
              valueColor: AlwaysStoppedAnimation<Color>(AivoTheme.primary),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Loading proposals...',
            style: TextStyle(
              color: AivoTheme.textMuted,
              fontSize: 15,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    return RefreshIndicator(
      onRefresh: _loadData,
      color: AivoTheme.primary,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Error card
            if (_error != null) _buildErrorCard(),

            // Header info card
            _buildInfoCard(),
            const SizedBox(height: 24),

            // Proposals section
            _buildProposalsList(),
            const SizedBox(height: 100),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: AivoTheme.coral.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AivoTheme.coral.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          const Text('😅', style: TextStyle(fontSize: 24)),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Using demo data. Connect to see real proposals.',
              style: TextStyle(fontSize: 13, color: AivoTheme.coral),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AivoTheme.primaryGradient,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AivoTheme.primary.withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Center(
              child: Text('📊', style: TextStyle(fontSize: 28)),
            ),
          ),
          const SizedBox(width: 16),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'How it works',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  "AIVO suggests difficulty adjustments based on your learner's progress.",
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.white70,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProposalsList() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text(
              'Pending Approvals',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AivoTheme.textPrimary,
              ),
            ),
            const SizedBox(width: 10),
            if (_proposals.isNotEmpty)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AivoTheme.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${_proposals.length}',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AivoTheme.primary,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 16),
        
        if (_proposals.isEmpty && _error == null)
          _buildEmptyState()
        else if (_proposals.isEmpty && _error != null)
          _buildDemoProposals()
        else
          ..._proposals.map((proposal) => _buildProposalCard(proposal)),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AivoTheme.mint.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(24),
            ),
            child: const Center(
              child: Text('✨', style: TextStyle(fontSize: 40)),
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'All caught up!',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: AivoTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'No difficulty changes need your approval right now.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: AivoTheme.textMuted,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDemoProposals() {
    return Column(
      children: [
        _buildDemoProposalCard(
          subject: 'Math',
          currentLevel: 3,
          proposedLevel: 4,
          reason: 'Alex has been doing really well and is ready for more challenging problems! 🌟',
          direction: 'up',
          emoji: '🔢',
        ),
        _buildDemoProposalCard(
          subject: 'Reading',
          currentLevel: 5,
          proposedLevel: 4,
          reason: "Let's slow down a bit to build stronger foundations. 📚",
          direction: 'down',
          emoji: '📖',
        ),
      ],
    );
  }

  Widget _buildDemoProposalCard({
    required String subject,
    required int currentLevel,
    required int proposedLevel,
    required String reason,
    required String direction,
    required String emoji,
  }) {
    final isIncrease = direction == 'up';
    final badgeColor = isIncrease ? AivoTheme.mint : AivoTheme.sunshine;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: AivoTheme.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Center(
                        child: Text(emoji, style: const TextStyle(fontSize: 26)),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            subject,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AivoTheme.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: badgeColor.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              isIncrease ? '⬆️ Level Up' : '⬇️ Adjust Down',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: isIncrease ? const Color(0xFF059669) : const Color(0xFFD97706),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AivoTheme.surfaceBackground,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          children: [
                            Text(
                              'Current',
                              style: TextStyle(fontSize: 11, color: AivoTheme.textMuted),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Level $currentLevel',
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: AivoTheme.textPrimary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          gradient: AivoTheme.primaryGradient,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 22),
                      ),
                      Expanded(
                        child: Column(
                          children: [
                            Text(
                              'Proposed',
                              style: TextStyle(fontSize: 11, color: AivoTheme.textMuted),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Level $proposedLevel',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: AivoTheme.primary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AivoTheme.primary.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AivoTheme.primary.withValues(alpha: 0.1)),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('💡', style: TextStyle(fontSize: 16)),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          reason,
                          style: TextStyle(fontSize: 13, color: AivoTheme.textSecondary, height: 1.4),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AivoTheme.surfaceBackground,
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(20),
                bottomRight: Radius.circular(20),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextButton(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: const Text('👍 Declined (demo)', style: TextStyle(color: Colors.white)),
                          backgroundColor: AivoTheme.textMuted,
                          behavior: SnackBarBehavior.floating,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      );
                    },
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(color: AivoTheme.textMuted.withValues(alpha: 0.3)),
                      ),
                    ),
                    child: const Text(
                      'Not Now',
                      style: TextStyle(fontWeight: FontWeight.w600, color: AivoTheme.textSecondary),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: const Text('🎉 Approved! (demo)', style: TextStyle(color: Colors.white)),
                          backgroundColor: const Color(0xFF059669),
                          behavior: SnackBarBehavior.floating,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AivoTheme.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('✅ Approve', style: TextStyle(fontWeight: FontWeight.w600)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProposalCard(DifficultyChangeProposal proposal) {
    final isIncrease = proposal.direction == 'up';
    final badgeColor = isIncrease ? AivoTheme.mint : AivoTheme.sunshine;
    final emoji = _getSubjectEmoji(proposal.subject);
    
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: AivoTheme.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Center(
                        child: Text(emoji, style: const TextStyle(fontSize: 26)),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            proposal.subject,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AivoTheme.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: badgeColor.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              isIncrease ? '⬆️ Level Up' : '⬇️ Adjust Down',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: isIncrease ? const Color(0xFF059669) : const Color(0xFFD97706),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AivoTheme.surfaceBackground,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          children: [
                            Text(
                              'Current',
                              style: TextStyle(fontSize: 11, color: AivoTheme.textMuted),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Level ${proposal.fromAssessedGradeLevel}',
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: AivoTheme.textPrimary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          gradient: AivoTheme.primaryGradient,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 22),
                      ),
                      Expanded(
                        child: Column(
                          children: [
                            Text(
                              'Proposed',
                              style: TextStyle(fontSize: 11, color: AivoTheme.textMuted),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Level ${proposal.toAssessedGradeLevel}',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: AivoTheme.primary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AivoTheme.primary.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AivoTheme.primary.withValues(alpha: 0.1)),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('💡', style: TextStyle(fontSize: 16)),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          proposal.rationale,
                          style: TextStyle(fontSize: 13, color: AivoTheme.textSecondary, height: 1.4),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AivoTheme.surfaceBackground,
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(20),
                bottomRight: Radius.circular(20),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextButton(
                    onPressed: () => _handleDecision(proposal.id, false),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(color: AivoTheme.textMuted.withValues(alpha: 0.3)),
                      ),
                    ),
                    child: const Text(
                      'Not Now',
                      style: TextStyle(fontWeight: FontWeight.w600, color: AivoTheme.textSecondary),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: () => _handleDecision(proposal.id, true),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AivoTheme.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('✅ Approve', style: TextStyle(fontWeight: FontWeight.w600)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _getSubjectEmoji(String subject) {
    final lower = subject.toLowerCase();
    if (lower.contains('math')) return '🔢';
    if (lower.contains('read')) return '📖';
    if (lower.contains('science')) return '🔬';
    if (lower.contains('writ')) return '✏️';
    if (lower.contains('history')) return '🏛️';
    if (lower.contains('art')) return '🎨';
    if (lower.contains('music')) return '🎵';
    return '📚';
  }
}
