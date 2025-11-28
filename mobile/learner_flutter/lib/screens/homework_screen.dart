import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:aivo_shared/aivo_shared.dart';

/// 4-Step Scaffolded Homework Helper
/// Steps: Understand → Plan → Solve → Check
class HomeworkScreen extends StatefulWidget {
  final String? sessionId;
  
  const HomeworkScreen({super.key, this.sessionId});

  @override
  State<HomeworkScreen> createState() => _HomeworkScreenState();
}

class _HomeworkScreenState extends State<HomeworkScreen> {
  final AivoApiClient _client = AivoApiClient();
  final ImagePicker _imagePicker = ImagePicker();
  final TextRecognizer _textRecognizer = TextRecognizer();
  final TextEditingController _textController = TextEditingController();
  final TextEditingController _questionController = TextEditingController();

  HomeworkSession? _session;
  HomeworkStep _currentStep = HomeworkStep.understand;
  bool _isLoading = false;
  bool _isProcessingOcr = false;
  String? _errorMessage;
  String? _extractedText;
  File? _capturedImage;
  
  // Hint system
  List<String> _hints = [];
  int _hintsRemaining = 3;
  
  // Step-specific data
  Map<String, dynamic> _understandData = {};
  List<String> _planSteps = [];
  Map<int, bool> _planStepChecks = {};
  String _solutionWork = '';
  Map<String, dynamic> _checkData = {};

  // Demo learner ID
  static const String _learnerId = 'demo-learner';

  @override
  void initState() {
    super.initState();
    if (widget.sessionId != null) {
      _loadSession(widget.sessionId!);
    }
  }

  @override
  void dispose() {
    _textController.dispose();
    _questionController.dispose();
    _textRecognizer.close();
    super.dispose();
  }

  Future<void> _loadSession(String sessionId) async {
    setState(() => _isLoading = true);
    try {
      final session = await _client.getHomeworkSession(sessionId);
      setState(() {
        _session = session;
        _currentStep = session.currentStep;
        _hintsRemaining = 3 - session.hintsUsed;
        _loadWorkProducts(session);
      });
    } catch (e) {
      setState(() => _errorMessage = 'Failed to load session');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _loadWorkProducts(HomeworkSession session) {
    for (final wp in session.workProducts) {
      switch (wp.step) {
        case HomeworkStep.understand:
          _understandData = wp.outputData;
          _extractedText = session.primaryFile?.extractedText;
          break;
        case HomeworkStep.plan:
          _planSteps = wp.planSteps ?? [];
          break;
        case HomeworkStep.solve:
          _solutionWork = wp.solution ?? '';
          break;
        case HomeworkStep.check:
          _checkData = wp.outputData;
          break;
        case HomeworkStep.complete:
          break;
      }
    }
  }

  Future<void> _createSession() async {
    final title = _textController.text.isNotEmpty 
        ? _textController.text.substring(0, _textController.text.length.clamp(0, 50))
        : 'Homework Problem';
    
    setState(() => _isLoading = true);
    try {
      final session = await _client.createHomeworkSession(
        learnerId: _learnerId,
        title: title,
      );
      setState(() => _session = session);
    } catch (e) {
      // Use demo session for offline mode
      setState(() {
        _session = HomeworkSession(
          id: 'demo-${DateTime.now().millisecondsSinceEpoch}',
          learnerId: _learnerId,
          title: title,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _captureFromCamera() async {
    try {
      final XFile? image = await _imagePicker.pickImage(
        source: ImageSource.camera,
        imageQuality: 85,
      );
      if (image != null) {
        await _processImage(File(image.path));
      }
    } catch (e) {
      setState(() => _errorMessage = 'Failed to capture image');
    }
  }

  Future<void> _pickFromGallery() async {
    try {
      final XFile? image = await _imagePicker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 85,
      );
      if (image != null) {
        await _processImage(File(image.path));
      }
    } catch (e) {
      setState(() => _errorMessage = 'Failed to pick image');
    }
  }

  Future<void> _processImage(File imageFile) async {
    setState(() {
      _capturedImage = imageFile;
      _isProcessingOcr = true;
      _errorMessage = null;
    });

    try {
      // Use on-device OCR first
      final inputImage = InputImage.fromFile(imageFile);
      final recognizedText = await _textRecognizer.processImage(inputImage);
      
      setState(() {
        _extractedText = recognizedText.text;
        _textController.text = recognizedText.text;
      });

      // Also upload to server for better OCR if session exists
      if (_session != null) {
        final bytes = await imageFile.readAsBytes();
        try {
          await _client.uploadHomeworkFile(
            sessionId: _session!.id,
            fileBytes: bytes,
            filename: 'homework_${DateTime.now().millisecondsSinceEpoch}.jpg',
            mimeType: 'image/jpeg',
          );
        } catch (_) {
          // Server upload failed, but we have on-device OCR
        }
      }
    } catch (e) {
      setState(() => _errorMessage = 'Failed to process image');
    } finally {
      setState(() => _isProcessingOcr = false);
    }
  }

  Future<void> _advanceStep() async {
    if (_session == null) {
      await _createSession();
    }

    setState(() => _isLoading = true);

    try {
      Map<String, dynamic> inputData = {};
      
      switch (_currentStep) {
        case HomeworkStep.understand:
          inputData = {'problemText': _textController.text};
          break;
        case HomeworkStep.plan:
          inputData = {'confirmedPlan': _planSteps, 'questions': _questionController.text};
          break;
        case HomeworkStep.solve:
          inputData = {'solutionWork': _solutionWork};
          break;
        case HomeworkStep.check:
          inputData = {'verified': true};
          break;
        case HomeworkStep.complete:
          return;
      }

      final updatedSession = await _client.advanceHomeworkStep(
        sessionId: _session!.id,
        currentStep: _currentStep,
        inputType: 'text',
        inputData: inputData,
      );

      setState(() {
        _session = updatedSession;
        _loadWorkProducts(updatedSession);
        _currentStep = updatedSession.currentStep;
      });
    } catch (e) {
      // Demo mode - simulate AI response
      _simulateAiResponse();
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _simulateAiResponse() {
    switch (_currentStep) {
      case HomeworkStep.understand:
        setState(() {
          _understandData = {
            'whatWeKnow': 'Based on the problem, we know:\n• The given values and conditions\n• Any constraints mentioned',
            'whatWeNeedToFind': 'We need to find the answer to the question asked.',
            'keyConcepts': ['Problem solving', 'Analysis', 'Application'],
          };
          _currentStep = HomeworkStep.plan;
        });
        break;
      case HomeworkStep.plan:
        setState(() {
          _planSteps = [
            'Read and understand the problem carefully',
            'Identify what we know and what we need to find',
            'Choose the right approach or formula',
            'Work through the solution step by step',
            'Check our answer makes sense',
          ];
          _planStepChecks = {for (var i = 0; i < _planSteps.length; i++) i: false};
          _currentStep = HomeworkStep.solve;
        });
        break;
      case HomeworkStep.solve:
        setState(() {
          _checkData = {
            'doesItMakeSense': 'Let\'s verify the answer is reasonable.',
            'unitCheck': 'Units are consistent throughout.',
            'reasonablenessCheck': 'The answer is within expected range.',
          };
          _currentStep = HomeworkStep.check;
        });
        break;
      case HomeworkStep.check:
        setState(() {
          _checkData['isCorrect'] = true;
          _currentStep = HomeworkStep.complete;
        });
        break;
      case HomeworkStep.complete:
        break;
    }
  }

  Future<void> _requestHint() async {
    if (_hintsRemaining <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No hints remaining for this problem'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      if (_session != null) {
        final hintResponse = await _client.requestHomeworkHint(
          sessionId: _session!.id,
          step: _currentStep,
        );
        setState(() {
          _hints.add(hintResponse.hint);
          _hintsRemaining = hintResponse.hintsRemaining;
        });
      } else {
        _simulateHint();
      }
    } catch (e) {
      _simulateHint();
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _simulateHint() {
    final hintLevel = 3 - _hintsRemaining;
    String hint;
    
    switch (hintLevel) {
      case 0:
        hint = '💡 General hint: Think about what information is given and what you need to find.';
        break;
      case 1:
        hint = '💡 More specific: Try breaking down the problem into smaller parts.';
        break;
      default:
        hint = '💡 Detailed hint: Look at the key concepts and apply them step by step.';
    }
    
    setState(() {
      _hints.add(hint);
      _hintsRemaining--;
    });
  }

  void _goBack() {
    if (_currentStep == HomeworkStep.understand) {
      Navigator.pop(context);
      return;
    }

    setState(() {
      switch (_currentStep) {
        case HomeworkStep.plan:
          _currentStep = HomeworkStep.understand;
          break;
        case HomeworkStep.solve:
          _currentStep = HomeworkStep.plan;
          break;
        case HomeworkStep.check:
          _currentStep = HomeworkStep.solve;
          break;
        case HomeworkStep.complete:
          _currentStep = HomeworkStep.check;
          break;
        default:
          break;
      }
    });
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
              _buildHeader(),
              HomeworkStepIndicator(currentStep: _currentStep),
              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : _buildCurrentStepContent(),
              ),
              if (_currentStep != HomeworkStep.complete)
                _buildStepNavigation(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.pop(context),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Homework Helper',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  _getStepTitle(),
                  style: TextStyle(
                    fontSize: 14,
                    color: AivoTheme.textMuted,
                  ),
                ),
              ],
            ),
          ),
          HintButton(
            hintsRemaining: _hintsRemaining,
            onPressed: _requestHint,
            isEnabled: _currentStep != HomeworkStep.understand && 
                       _currentStep != HomeworkStep.complete &&
                       _hintsRemaining > 0,
          ),
        ],
      ),
    );
  }

  String _getStepTitle() {
    switch (_currentStep) {
      case HomeworkStep.understand:
        return 'Step 1: Understand the Problem 🔍';
      case HomeworkStep.plan:
        return 'Step 2: Make a Plan 📝';
      case HomeworkStep.solve:
        return 'Step 3: Solve It ✏️';
      case HomeworkStep.check:
        return 'Step 4: Check Your Work ✅';
      case HomeworkStep.complete:
        return 'All Done! 🎉';
    }
  }

  Widget _buildCurrentStepContent() {
    switch (_currentStep) {
      case HomeworkStep.understand:
        return _buildUnderstandStep();
      case HomeworkStep.plan:
        return _buildPlanStep();
      case HomeworkStep.solve:
        return _buildSolveStep();
      case HomeworkStep.check:
        return _buildCheckStep();
      case HomeworkStep.complete:
        return _buildCompleteStep();
    }
  }

  Widget _buildUnderstandStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Problem input card
          ProblemInputCard(
            textController: _textController,
            capturedImage: _capturedImage,
            isProcessingOcr: _isProcessingOcr,
            onCameraPressed: _captureFromCamera,
            onGalleryPressed: _pickFromGallery,
            errorMessage: _errorMessage,
          ),
          
          if (_hints.isNotEmpty) ...[
            const SizedBox(height: 16),
            ..._hints.map((hint) => _buildHintBubble(hint)),
          ],
          
          // AI Response if we have understanding data
          if (_understandData.isNotEmpty) ...[
            const SizedBox(height: 24),
            AIResponseBubble(
              title: 'What we know',
              content: _understandData['whatWeKnow'] ?? '',
              icon: Icons.lightbulb_outline,
            ),
            const SizedBox(height: 12),
            AIResponseBubble(
              title: 'What we need to find',
              content: _understandData['whatWeNeedToFind'] ?? '',
              icon: Icons.search,
            ),
            if (_understandData['keyConcepts'] != null) ...[
              const SizedBox(height: 12),
              AIResponseBubble(
                title: 'Key concepts',
                content: (_understandData['keyConcepts'] as List<dynamic>).join('\n• '),
                icon: Icons.category,
              ),
            ],
          ],
        ],
      ),
    );
  }

  Widget _buildPlanStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Problem summary
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.description, color: AivoTheme.primary, size: 20),
                      const SizedBox(width: 8),
                      const Text(
                        'Problem Summary',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _textController.text.isEmpty 
                        ? 'No problem text entered'
                        : _textController.text,
                    style: TextStyle(
                      color: AivoTheme.textSecondary,
                      fontSize: 14,
                    ),
                    maxLines: 4,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Plan steps
          if (_planSteps.isNotEmpty) ...[
            const Text(
              'Your Step-by-Step Plan',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
            const SizedBox(height: 12),
            ...List.generate(_planSteps.length, (index) {
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: CheckboxListTile(
                  value: _planStepChecks[index] ?? false,
                  onChanged: (value) {
                    setState(() {
                      _planStepChecks[index] = value ?? false;
                    });
                  },
                  title: Text(
                    '${index + 1}. ${_planSteps[index]}',
                    style: TextStyle(
                      decoration: _planStepChecks[index] == true
                          ? TextDecoration.lineThrough
                          : null,
                    ),
                  ),
                  controlAffinity: ListTileControlAffinity.leading,
                  activeColor: AivoTheme.success,
                ),
              );
            }),
          ],
          
          const SizedBox(height: 16),
          
          // Clarifying questions
          TextField(
            controller: _questionController,
            decoration: InputDecoration(
              hintText: 'Any questions about the plan?',
              prefixIcon: const Icon(Icons.help_outline),
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
            maxLines: 2,
          ),
          
          if (_hints.isNotEmpty) ...[
            const SizedBox(height: 16),
            ..._hints.map((hint) => _buildHintBubble(hint)),
          ],
        ],
      ),
    );
  }

  Widget _buildSolveStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Show plan reminder
          if (_planSteps.isNotEmpty)
            Card(
              color: AivoTheme.surfaceBackground,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '📋 Your Plan',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    ...List.generate(
                      _planSteps.length.clamp(0, 3),
                      (i) => Text(
                        '${i + 1}. ${_planSteps[i]}',
                        style: const TextStyle(fontSize: 12),
                      ),
                    ),
                    if (_planSteps.length > 3)
                      Text(
                        '... and ${_planSteps.length - 3} more steps',
                        style: TextStyle(
                          fontSize: 12,
                          color: AivoTheme.textMuted,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                  ],
                ),
              ),
            ),
          
          const SizedBox(height: 16),
          
          // Work area
          const Text(
            'Show Your Work',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 18,
            ),
          ),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: TextField(
                maxLines: 10,
                decoration: InputDecoration(
                  hintText: 'Write your solution here...\n\nShow each step of your work.',
                  border: InputBorder.none,
                  hintStyle: TextStyle(color: AivoTheme.textMuted),
                ),
                onChanged: (value) => _solutionWork = value,
              ),
            ),
          ),
          
          if (_hints.isNotEmpty) ...[
            const SizedBox(height: 16),
            ..._hints.map((hint) => _buildHintBubble(hint)),
          ],
          
          const SizedBox(height: 16),
          
          // AI guidance
          AIResponseBubble(
            title: 'Guidance',
            content: 'Take your time! Work through each step carefully.\n\nIf you get stuck, use the hint button (💡) for help.',
            icon: Icons.assistant,
          ),
        ],
      ),
    );
  }

  Widget _buildCheckStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Show solution
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.edit_note, color: AivoTheme.primary),
                      const SizedBox(width: 8),
                      const Text(
                        'Your Solution',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _solutionWork.isEmpty ? 'No work shown' : _solutionWork,
                    style: TextStyle(color: AivoTheme.textSecondary),
                  ),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Verification checks
          if (_checkData.isNotEmpty) ...[
            const Text(
              'Let\'s Check!',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
            const SizedBox(height: 12),
            
            _buildCheckItem(
              icon: Icons.psychology,
              title: 'Does it make sense?',
              content: _checkData['doesItMakeSense'] ?? '',
              isChecked: true,
            ),
            _buildCheckItem(
              icon: Icons.straighten,
              title: 'Unit Check',
              content: _checkData['unitCheck'] ?? '',
              isChecked: true,
            ),
            _buildCheckItem(
              icon: Icons.balance,
              title: 'Reasonableness Check',
              content: _checkData['reasonablenessCheck'] ?? '',
              isChecked: true,
            ),
          ],
          
          if (_hints.isNotEmpty) ...[
            const SizedBox(height: 16),
            ..._hints.map((hint) => _buildHintBubble(hint)),
          ],
        ],
      ),
    );
  }

  Widget _buildCheckItem({
    required IconData icon,
    required String title,
    required String content,
    required bool isChecked,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: isChecked 
                ? AivoTheme.success.withOpacity(0.15)
                : AivoTheme.surfaceBackground,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(
            isChecked ? Icons.check_circle : icon,
            color: isChecked ? AivoTheme.success : AivoTheme.primary,
          ),
        ),
        title: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Text(
          content,
          style: TextStyle(
            fontSize: 12,
            color: AivoTheme.textMuted,
          ),
        ),
      ),
    );
  }

  Widget _buildCompleteStep() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Celebration animation
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                gradient: AivoTheme.primaryGradient,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AivoTheme.primary.withOpacity(0.3),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: const Center(
                child: Text(
                  '🎉',
                  style: TextStyle(fontSize: 60),
                ),
              ),
            ),
            const SizedBox(height: 32),
            const Text(
              'Great Work!',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'You successfully solved this problem\nusing the 4-step method!',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                color: AivoTheme.textSecondary,
              ),
            ),
            const SizedBox(height: 32),
            
            // Stats
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _buildStatChip(
                  icon: Icons.lightbulb,
                  label: '${3 - _hintsRemaining} hints used',
                  color: AivoTheme.sunshine,
                ),
                const SizedBox(width: 16),
                _buildStatChip(
                  icon: Icons.check_circle,
                  label: '4 steps complete',
                  color: AivoTheme.success,
                ),
              ],
            ),
            
            const SizedBox(height: 48),
            
            // Action buttons
            ElevatedButton.icon(
              onPressed: () {
                setState(() {
                  _currentStep = HomeworkStep.understand;
                  _session = null;
                  _textController.clear();
                  _questionController.clear();
                  _extractedText = null;
                  _capturedImage = null;
                  _understandData = {};
                  _planSteps = [];
                  _planStepChecks = {};
                  _solutionWork = '';
                  _checkData = {};
                  _hints = [];
                  _hintsRemaining = 3;
                });
              },
              icon: const Icon(Icons.add),
              label: const Text('New Problem'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              ),
            ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Back to Home'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatChip({
    required IconData icon,
    required String label,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHintBubble(String hint) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AivoTheme.sunshine.withOpacity(0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AivoTheme.sunshine.withOpacity(0.3),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('💡', style: TextStyle(fontSize: 20)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              hint.replaceFirst('💡 ', ''),
              style: const TextStyle(fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepNavigation() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: StepNavigation(
        currentStep: _currentStep,
        canGoNext: _canAdvance(),
        isLoading: _isLoading,
        onBack: _goBack,
        onNext: _advanceStep,
      ),
    );
  }

  bool _canAdvance() {
    switch (_currentStep) {
      case HomeworkStep.understand:
        return _textController.text.isNotEmpty;
      case HomeworkStep.plan:
        return _planSteps.isNotEmpty;
      case HomeworkStep.solve:
        return _solutionWork.isNotEmpty;
      case HomeworkStep.check:
        return true;
      case HomeworkStep.complete:
        return false;
    }
  }
}

// ==================== UI Components ====================

/// Visual progress bar showing 4 steps
class HomeworkStepIndicator extends StatelessWidget {
  final HomeworkStep currentStep;

  const HomeworkStepIndicator({
    super.key,
    required this.currentStep,
  });

  @override
  Widget build(BuildContext context) {
    final steps = [
      ('🔍', 'Understand'),
      ('📝', 'Plan'),
      ('✏️', 'Solve'),
      ('✅', 'Check'),
    ];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: List.generate(steps.length * 2 - 1, (index) {
          if (index.isOdd) {
            // Connector line
            final stepIndex = index ~/ 2;
            final isActive = currentStep.index > stepIndex;
            return Expanded(
              child: Container(
                height: 3,
                margin: const EdgeInsets.symmetric(horizontal: 4),
                decoration: BoxDecoration(
                  color: isActive ? AivoTheme.primary : AivoTheme.surfaceBackground,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            );
          }

          // Step indicator
          final stepIndex = index ~/ 2;
          final isCurrent = currentStep.index == stepIndex;
          final isComplete = currentStep.index > stepIndex || 
                            currentStep == HomeworkStep.complete;
          final (emoji, label) = steps[stepIndex];

          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: isComplete 
                      ? AivoTheme.success
                      : isCurrent 
                          ? AivoTheme.primary
                          : AivoTheme.surfaceBackground,
                  shape: BoxShape.circle,
                  border: isCurrent
                      ? Border.all(color: AivoTheme.primary, width: 3)
                      : null,
                  boxShadow: isCurrent
                      ? [
                          BoxShadow(
                            color: AivoTheme.primary.withOpacity(0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ]
                      : null,
                ),
                child: Center(
                  child: isComplete
                      ? const Icon(Icons.check, color: Colors.white, size: 24)
                      : Text(
                          emoji,
                          style: const TextStyle(fontSize: 20),
                        ),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                  color: isCurrent ? AivoTheme.primary : AivoTheme.textMuted,
                ),
              ),
            ],
          );
        }),
      ),
    );
  }
}

/// Problem input card with camera, gallery, and text input
class ProblemInputCard extends StatelessWidget {
  final TextEditingController textController;
  final File? capturedImage;
  final bool isProcessingOcr;
  final VoidCallback onCameraPressed;
  final VoidCallback onGalleryPressed;
  final String? errorMessage;

  const ProblemInputCard({
    super.key,
    required this.textController,
    this.capturedImage,
    this.isProcessingOcr = false,
    required this.onCameraPressed,
    required this.onGalleryPressed,
    this.errorMessage,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Enter or capture your problem',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 16),
            
            // Image capture buttons
            Row(
              children: [
                Expanded(
                  child: _CaptureButton(
                    icon: Icons.camera_alt,
                    label: 'Camera',
                    onPressed: onCameraPressed,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _CaptureButton(
                    icon: Icons.photo_library,
                    label: 'Gallery',
                    onPressed: onGalleryPressed,
                  ),
                ),
              ],
            ),
            
            // Processing indicator
            if (isProcessingOcr) ...[
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'Processing image...',
                    style: TextStyle(color: AivoTheme.textMuted),
                  ),
                ],
              ),
            ],
            
            // Captured image preview
            if (capturedImage != null && !isProcessingOcr) ...[
              const SizedBox(height: 16),
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.file(
                  capturedImage!,
                  height: 150,
                  width: double.infinity,
                  fit: BoxFit.cover,
                ),
              ),
            ],
            
            // Error message
            if (errorMessage != null) ...[
              const SizedBox(height: 12),
              Text(
                errorMessage!,
                style: TextStyle(color: AivoTheme.error, fontSize: 12),
              ),
            ],
            
            const SizedBox(height: 16),
            
            // Divider with "or"
            Row(
              children: [
                Expanded(child: Divider(color: AivoTheme.surfaceBackground)),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Text(
                    'or type it',
                    style: TextStyle(color: AivoTheme.textMuted, fontSize: 12),
                  ),
                ),
                Expanded(child: Divider(color: AivoTheme.surfaceBackground)),
              ],
            ),
            
            const SizedBox(height: 16),
            
            // Text input
            TextField(
              controller: textController,
              maxLines: 5,
              decoration: InputDecoration(
                hintText: 'Type or paste your homework problem here...',
                filled: true,
                fillColor: AivoTheme.surfaceBackground.withOpacity(0.5),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CaptureButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onPressed;

  const _CaptureButton({
    required this.icon,
    required this.label,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon),
      label: Text(label),
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 14),
        side: BorderSide(color: AivoTheme.primaryLight),
      ),
    );
  }
}

/// AI response bubble with avatar
class AIResponseBubble extends StatelessWidget {
  final String title;
  final String content;
  final IconData icon;

  const AIResponseBubble({
    super.key,
    required this.title,
    required this.content,
    this.icon = Icons.smart_toy,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // AI Avatar
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            gradient: AivoTheme.primaryGradient,
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(
            Icons.smart_toy,
            color: Colors.white,
            size: 20,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: const BorderRadius.only(
                topRight: Radius.circular(16),
                bottomLeft: Radius.circular(16),
                bottomRight: Radius.circular(16),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(icon, size: 16, color: AivoTheme.primary),
                    const SizedBox(width: 6),
                    Text(
                      title,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AivoTheme.primary,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  content,
                  style: TextStyle(
                    color: AivoTheme.textSecondary,
                    fontSize: 14,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

/// Hint button with remaining count
class HintButton extends StatelessWidget {
  final int hintsRemaining;
  final VoidCallback onPressed;
  final bool isEnabled;

  const HintButton({
    super.key,
    required this.hintsRemaining,
    required this.onPressed,
    this.isEnabled = true,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        IconButton(
          onPressed: isEnabled ? onPressed : null,
          icon: Icon(
            Icons.lightbulb_outline,
            color: isEnabled ? AivoTheme.sunshine : AivoTheme.textMuted,
          ),
          tooltip: 'Get a hint ($hintsRemaining remaining)',
        ),
        if (hintsRemaining > 0)
          Positioned(
            right: 4,
            top: 4,
            child: Container(
              width: 18,
              height: 18,
              decoration: BoxDecoration(
                color: AivoTheme.sunshine,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  '$hintsRemaining',
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

/// Previous/Next navigation buttons
class StepNavigation extends StatelessWidget {
  final HomeworkStep currentStep;
  final bool canGoNext;
  final bool isLoading;
  final VoidCallback onBack;
  final VoidCallback onNext;

  const StepNavigation({
    super.key,
    required this.currentStep,
    required this.canGoNext,
    required this.isLoading,
    required this.onBack,
    required this.onNext,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // Back button
        OutlinedButton.icon(
          onPressed: onBack,
          icon: const Icon(Icons.arrow_back),
          label: Text(
            currentStep == HomeworkStep.understand ? 'Cancel' : 'Back',
          ),
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          ),
        ),
        const Spacer(),
        // Next button
        ElevatedButton.icon(
          onPressed: canGoNext && !isLoading ? onNext : null,
          icon: isLoading
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : Icon(_getNextIcon()),
          label: Text(_getNextLabel()),
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          ),
        ),
      ],
    );
  }

  String _getNextLabel() {
    switch (currentStep) {
      case HomeworkStep.understand:
        return 'Analyze';
      case HomeworkStep.plan:
        return 'Start Solving';
      case HomeworkStep.solve:
        return 'Check Work';
      case HomeworkStep.check:
        return 'Complete';
      case HomeworkStep.complete:
        return 'Done';
    }
  }

  IconData _getNextIcon() {
    switch (currentStep) {
      case HomeworkStep.understand:
        return Icons.search;
      case HomeworkStep.plan:
        return Icons.edit;
      case HomeworkStep.solve:
        return Icons.fact_check;
      case HomeworkStep.check:
        return Icons.celebration;
      case HomeworkStep.complete:
        return Icons.check;
    }
  }
}
