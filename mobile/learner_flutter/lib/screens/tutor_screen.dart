import 'package:flutter/material.dart';
import 'package:aivo_shared/aivo_shared.dart';

class ChatMessage {
  final String id;
  final String role; // 'learner' or 'tutor'
  final String content;
  final DateTime timestamp;

  ChatMessage({
    required this.id,
    required this.role,
    required this.content,
    required this.timestamp,
  });
}

class TutorScreen extends StatefulWidget {
  const TutorScreen({super.key});

  @override
  State<TutorScreen> createState() => _TutorScreenState();
}

class _TutorScreenState extends State<TutorScreen> {
  final AivoApiClient _client = AivoApiClient();
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _focusNode = FocusNode();
  final Set<String> _feedbackGiven = {};
  bool _isTyping = false;

  final List<ChatMessage> _messages = [
    ChatMessage(
      id: '1',
      role: 'tutor',
      content: "Hi there! 👋 I'm AIVO, your friendly learning companion. I'm here to help you learn at your own pace. What would you like to explore today?",
      timestamp: DateTime.now(),
    ),
  ];

  void _sendMessage() {
    final text = _inputController.text.trim();
    if (text.isEmpty) return;

    setState(() {
      // Add learner message
      _messages.add(ChatMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        role: 'learner',
        content: text,
        timestamp: DateTime.now(),
      ));
      _inputController.clear();
      _isTyping = true;
    });

    _scrollToBottom();

    // Simulate tutor "typing" delay
    Future.delayed(const Duration(milliseconds: 1500), () {
      if (mounted) {
        setState(() {
          _isTyping = false;
          _messages.add(ChatMessage(
            id: (DateTime.now().millisecondsSinceEpoch + 1).toString(),
            role: 'tutor',
            content: "That's a wonderful question! 🌟 Let me help you think through this step by step. Remember, there's no rush - we'll go at whatever pace feels comfortable for you.",
            timestamp: DateTime.now(),
          ));
        });
        _scrollToBottom();
      }
    });
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _handleFeedback(String messageId, int rating, String label) async {
    try {
      await _client.recordFeedback(
        targetType: 'tutor_turn',
        targetId: messageId,
        rating: rating,
        label: label,
      );
      setState(() {
        _feedbackGiven.add(messageId);
      });
    } catch (e) {
      // Silent fail
    }
  }

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    super.dispose();
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
              // Custom App Bar
              _buildAppBar(),
              
              // Messages list
              Expanded(
                child: ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  itemCount: _messages.length + (_isTyping ? 1 : 0),
                  itemBuilder: (context, index) {
                    if (_isTyping && index == _messages.length) {
                      return _buildTypingIndicator();
                    }
                    final message = _messages[index];
                    return _buildMessageBubble(message);
                  },
                ),
              ),

              // Quick suggestions
              _buildQuickSuggestions(),

              // Input area
              _buildInputArea(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAppBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
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
          const SizedBox(width: 14),
          // Tutor avatar
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              gradient: AivoTheme.primaryGradient,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: AivoTheme.primary.withValues(alpha: 0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: const Center(
              child: Text('🤖', style: TextStyle(fontSize: 24)),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'AIVO Tutor',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AivoTheme.textPrimary,
                  ),
                ),
                Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: AivoTheme.mint,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      _isTyping ? 'typing...' : 'Online • Here to help',
                      style: TextStyle(
                        fontSize: 12,
                        color: AivoTheme.textMuted,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Info button
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: const Icon(Icons.info_outline, color: AivoTheme.textMuted, size: 20),
          ),
        ],
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildTypingDot(0),
                const SizedBox(width: 4),
                _buildTypingDot(200),
                const SizedBox(width: 4),
                _buildTypingDot(400),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTypingDot(int delayMs) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: Duration(milliseconds: 600 + delayMs),
      builder: (context, value, child) {
        return Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: AivoTheme.primary.withValues(alpha: 0.3 + (0.7 * (1 - value).abs())),
            borderRadius: BorderRadius.circular(4),
          ),
        );
      },
    );
  }

  Widget _buildMessageBubble(ChatMessage message) {
    final isLearner = message.role == 'learner';

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment: isLearner ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isLearner) ...[
            // Tutor avatar
            Container(
              width: 32,
              height: 32,
              margin: const EdgeInsets.only(right: 8),
              decoration: BoxDecoration(
                gradient: AivoTheme.primaryGradient,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Center(
                child: Text('🤖', style: TextStyle(fontSize: 16)),
              ),
            ),
          ],
          Flexible(
            child: Container(
              constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.75,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isLearner ? AivoTheme.primary : Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(20),
                  topRight: const Radius.circular(20),
                  bottomLeft: Radius.circular(isLearner ? 20 : 6),
                  bottomRight: Radius.circular(isLearner ? 6 : 20),
                ),
                boxShadow: [
                  BoxShadow(
                    color: isLearner 
                        ? AivoTheme.primary.withValues(alpha: 0.3)
                        : Colors.black.withValues(alpha: 0.05),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    message.content,
                    style: TextStyle(
                      fontSize: 15,
                      color: isLearner ? Colors.white : AivoTheme.textPrimary,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${message.timestamp.hour.toString().padLeft(2, '0')}:${message.timestamp.minute.toString().padLeft(2, '0')}',
                    style: TextStyle(
                      fontSize: 11,
                      color: isLearner 
                          ? Colors.white.withValues(alpha: 0.7)
                          : AivoTheme.textMuted,
                    ),
                  ),

                  // Feedback buttons for tutor messages
                  if (!isLearner && !_feedbackGiven.contains(message.id)) ...[
                    const SizedBox(height: 12),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _buildFeedbackChip(message.id, '👍', 'Helpful', 5, 'helpful'),
                        const SizedBox(width: 8),
                        _buildFeedbackChip(message.id, '👎', 'Not quite', 2, 'not_helpful'),
                      ],
                    ),
                  ],

                  if (_feedbackGiven.contains(message.id)) ...[
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AivoTheme.mint.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '✓ Thanks! 💜',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: const Color(0xFF059669),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          if (isLearner) ...[
            // Learner avatar
            Container(
              width: 32,
              height: 32,
              margin: const EdgeInsets.only(left: 8),
              decoration: BoxDecoration(
                color: AivoTheme.sky.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Center(
                child: Text('😊', style: TextStyle(fontSize: 16)),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildFeedbackChip(String messageId, String emoji, String label, int rating, String feedbackLabel) {
    return GestureDetector(
      onTap: () => _handleFeedback(messageId, rating, feedbackLabel),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: AivoTheme.surfaceBackground,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 12)),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                color: AivoTheme.textMuted,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickSuggestions() {
    final suggestions = [
      '💡 Help me with math',
      '📖 Practice reading',
      '🎯 Today\'s goals',
    ];

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Row(
          children: suggestions.map((suggestion) {
            return GestureDetector(
              onTap: () {
                _inputController.text = suggestion.substring(2).trim();
                _sendMessage();
              },
              child: Container(
                margin: const EdgeInsets.only(right: 10),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AivoTheme.primary.withValues(alpha: 0.2)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Text(
                  suggestion,
                  style: TextStyle(
                    fontSize: 13,
                    color: AivoTheme.primary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              // Attachment button
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AivoTheme.surfaceBackground,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(Icons.add_rounded, color: AivoTheme.textMuted),
              ),
              const SizedBox(width: 12),
              // Input field
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    color: AivoTheme.surfaceBackground,
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: TextField(
                    controller: _inputController,
                    focusNode: _focusNode,
                    decoration: InputDecoration(
                      hintText: 'Ask me anything...',
                      hintStyle: TextStyle(color: AivoTheme.textMuted),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                    style: const TextStyle(fontSize: 15),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Send button
              GestureDetector(
                onTap: _sendMessage,
                child: Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: AivoTheme.primaryGradient,
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [
                      BoxShadow(
                        color: AivoTheme.primary.withValues(alpha: 0.4),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: const Icon(Icons.send_rounded, color: Colors.white, size: 22),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          // Demo notice
          Text(
            '💜 Demo mode • Your feedback helps AIVO learn!',
            style: TextStyle(
              fontSize: 11,
              color: AivoTheme.textMuted,
            ),
          ),
        ],
      ),
    );
  }
}
