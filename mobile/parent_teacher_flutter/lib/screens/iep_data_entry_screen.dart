import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:aivo_shared/aivo_shared.dart';
import 'package:aivo_shared/user_context.dart';

/// Screen for entering IEP goal data points
class IEPDataEntryScreen extends StatefulWidget {
  final IEPGoal goal;

  const IEPDataEntryScreen({
    super.key,
    required this.goal,
  });

  @override
  State<IEPDataEntryScreen> createState() => _IEPDataEntryScreenState();
}

class _IEPDataEntryScreenState extends State<IEPDataEntryScreen> {
  final AivoApiClient _client = AivoApiClient();
  final UserContextService _userContext = UserContextService.instance;
  final _valueController = TextEditingController();
  final _notesController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  
  DateTime _selectedDate = DateTime.now();
  IEPMeasurementContext _selectedContext = IEPMeasurementContext.classroom;
  String? _evidenceUrl;
  bool _saving = false;

  @override
  void dispose() {
    _valueController.dispose();
    _notesController.dispose();
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
              _buildAppBar(),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Goal summary card
                        _buildGoalSummary(),
                        const SizedBox(height: 24),
                        
                        // Value input
                        _buildValueInput(),
                        const SizedBox(height: 20),
                        
                        // Date picker
                        _buildDatePicker(),
                        const SizedBox(height: 20),
                        
                        // Context selection
                        _buildContextSelection(),
                        const SizedBox(height: 20),
                        
                        // Notes input
                        _buildNotesInput(),
                        const SizedBox(height: 20),
                        
                        // Evidence upload
                        _buildEvidenceUpload(),
                        const SizedBox(height: 32),
                        
                        // Save button
                        _buildSaveButton(),
                        
                        const SizedBox(height: 32),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
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
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Add Data Point',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AivoTheme.textPrimary,
                  ),
                ),
                Text(
                  'Record a measurement',
                  style: TextStyle(
                    fontSize: 13,
                    color: AivoTheme.textMuted,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGoalSummary() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Color(widget.goal.category.colorValue).withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Color(widget.goal.category.colorValue).withOpacity(0.3),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Text(
                widget.goal.category.emoji,
                style: const TextStyle(fontSize: 24),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.goal.goalName,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(
                      'Current: ${widget.goal.currentLevel.toStringAsFixed(1)}',
                      style: TextStyle(
                        fontSize: 12,
                        color: AivoTheme.textMuted,
                      ),
                    ),
                    const Text(' • '),
                    Text(
                      'Target: ${widget.goal.targetLevel.toStringAsFixed(1)}',
                      style: TextStyle(
                        fontSize: 12,
                        color: AivoTheme.textMuted,
                      ),
                    ),
                    const Text(' '),
                    Text(
                      widget.goal.measurementUnit,
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
        ],
      ),
    );
  }

  Widget _buildValueInput() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Value',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _valueController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                  decoration: InputDecoration(
                    hintText: '0.0',
                    hintStyle: TextStyle(
                      color: Colors.grey[300],
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.all(20),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter a value';
                    }
                    if (double.tryParse(value) == null) {
                      return 'Please enter a valid number';
                    }
                    return null;
                  },
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                decoration: BoxDecoration(
                  color: AivoTheme.primary.withOpacity(0.1),
                  borderRadius: const BorderRadius.horizontal(right: Radius.circular(12)),
                ),
                child: Text(
                  widget.goal.measurementUnit,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AivoTheme.primary,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        // Quick value buttons based on recent values
        if (widget.goal.dataPoints.isNotEmpty)
          _buildQuickValueButtons(),
      ],
    );
  }

  Widget _buildQuickValueButtons() {
    // Get unique recent values sorted by recency
    final dataPointsSorted = [...widget.goal.dataPoints]
      ..sort((a, b) => b.measurementDate.compareTo(a.measurementDate));
    
    final recentValues = dataPointsSorted
        .map((dp) => dp.value)
        .toSet()
        .take(5)
        .toList();

    // Calculate common reference values
    final values = widget.goal.dataPoints.map((dp) => dp.value).toList();
    double? avgValue;
    double? lastValue;
    
    if (values.isNotEmpty) {
      avgValue = values.reduce((a, b) => a + b) / values.length;
      lastValue = dataPointsSorted.first.value;
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AivoTheme.primary.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.history, size: 16, color: AivoTheme.textMuted),
              const SizedBox(width: 6),
              Text(
                'Quick Select',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AivoTheme.textMuted,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          
          // Reference values row
          if (lastValue != null || avgValue != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  if (lastValue != null)
                    _buildQuickValueChip(
                      label: 'Last',
                      value: lastValue,
                      color: AivoTheme.mint,
                      icon: Icons.schedule,
                    ),
                  if (lastValue != null && avgValue != null)
                    const SizedBox(width: 8),
                  if (avgValue != null)
                    _buildQuickValueChip(
                      label: 'Avg',
                      value: avgValue,
                      color: AivoTheme.sky,
                      icon: Icons.trending_flat,
                    ),
                  const SizedBox(width: 8),
                  _buildQuickValueChip(
                    label: 'Target',
                    value: widget.goal.targetLevel,
                    color: AivoTheme.primary,
                    icon: Icons.flag,
                  ),
                ],
              ),
            ),
          
          // Recent individual values
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: recentValues.map((value) {
              return GestureDetector(
                onTap: () {
                  _valueController.text = value.toStringAsFixed(1);
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.grey.withOpacity(0.2)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.03),
                        blurRadius: 4,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                  child: Text(
                    value.toStringAsFixed(1),
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
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

  Widget _buildQuickValueChip({
    required String label,
    required double value,
    required Color color,
    required IconData icon,
  }) {
    return GestureDetector(
      onTap: () {
        _valueController.text = value.toStringAsFixed(1);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 4),
            Text(
              '$label: ${value.toStringAsFixed(1)}',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDatePicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Date',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: _selectDate,
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AivoTheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.calendar_today_outlined,
                    color: AivoTheme.primary,
                  ),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _formatDate(_selectedDate),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    if (_isToday(_selectedDate))
                      Text(
                        'Today',
                        style: TextStyle(
                          fontSize: 12,
                          color: AivoTheme.mint,
                        ),
                      ),
                  ],
                ),
                const Spacer(),
                Icon(
                  Icons.chevron_right,
                  color: AivoTheme.textMuted,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildContextSelection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Context',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Where was this measurement taken?',
          style: TextStyle(
            fontSize: 12,
            color: AivoTheme.textMuted,
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: IEPMeasurementContext.values.map((context) {
            final isSelected = context == _selectedContext;
            return ChoiceChip(
              label: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    _getContextIcon(context),
                    size: 16,
                    color: isSelected ? Colors.white : AivoTheme.textMuted,
                  ),
                  const SizedBox(width: 6),
                  Text(context.displayName),
                ],
              ),
              selected: isSelected,
              selectedColor: AivoTheme.primary,
              labelStyle: TextStyle(
                color: isSelected ? Colors.white : AivoTheme.textPrimary,
              ),
              onSelected: (selected) {
                if (selected) setState(() => _selectedContext = context);
              },
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildNotesInput() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Notes',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Optional: Add any observations or context',
          style: TextStyle(
            fontSize: 12,
            color: AivoTheme.textMuted,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: TextField(
            controller: _notesController,
            maxLines: 3,
            decoration: InputDecoration(
              hintText: 'e.g., "Used visual supports", "After break time"',
              hintStyle: TextStyle(color: Colors.grey[400]),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.all(16),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildEvidenceUpload() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Evidence',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Optional: Attach a photo or document',
          style: TextStyle(
            fontSize: 12,
            color: AivoTheme.textMuted,
          ),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: _selectEvidence,
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: _evidenceUrl != null 
                    ? AivoTheme.mint 
                    : Colors.grey.withOpacity(0.2),
                width: _evidenceUrl != null ? 2 : 1,
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  _evidenceUrl != null ? Icons.check_circle : Icons.add_a_photo_outlined,
                  color: _evidenceUrl != null ? AivoTheme.mint : AivoTheme.textMuted,
                ),
                const SizedBox(width: 8),
                Text(
                  _evidenceUrl != null ? 'Evidence attached' : 'Add photo or document',
                  style: TextStyle(
                    color: _evidenceUrl != null ? AivoTheme.mint : AivoTheme.textMuted,
                    fontWeight: _evidenceUrl != null ? FontWeight.w600 : FontWeight.normal,
                  ),
                ),
                if (_evidenceUrl != null) ...[
                  const Spacer(),
                  GestureDetector(
                    onTap: () => setState(() => _evidenceUrl = null),
                    child: Icon(
                      Icons.close,
                      color: AivoTheme.textMuted,
                      size: 20,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSaveButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _saving ? null : _save,
        style: ElevatedButton.styleFrom(
          backgroundColor: AivoTheme.primary,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: _saving
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              )
            : const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.save_outlined),
                  SizedBox(width: 8),
                  Text(
                    'Save Data Point',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: widget.goal.startDate,
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AivoTheme.primary,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  Future<void> _selectEvidence() async {
    final picker = ImagePicker();
    
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt_outlined, color: AivoTheme.primary),
              title: const Text('Take a Photo'),
              onTap: () async {
                Navigator.pop(context);
                final image = await picker.pickImage(source: ImageSource.camera);
                if (image != null) {
                  setState(() => _evidenceUrl = image.path);
                }
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined, color: AivoTheme.primary),
              title: const Text('Choose from Gallery'),
              onTap: () async {
                Navigator.pop(context);
                final image = await picker.pickImage(source: ImageSource.gallery);
                if (image != null) {
                  setState(() => _evidenceUrl = image.path);
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  void _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _saving = true);

    // Get user info from auth context
    final authorInfo = _userContext.getAuthorInfo();

    // Create the data point
    final dataPoint = IEPDataPoint(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      goalId: widget.goal.id,
      value: double.parse(_valueController.text),
      measurementDate: _selectedDate,
      recordedById: authorInfo['authorId']!,
      recordedByRole: authorInfo['authorRole']!,
      recordedByName: authorInfo['authorName']!,
      context: _selectedContext,
      notes: _notesController.text.isNotEmpty ? _notesController.text : null,
      evidenceUrl: _evidenceUrl,
    );

    // Save to API
    try {
      await _client.addIEPDataPoint(
        goalId: widget.goal.id,
        value: dataPoint.value,
        measurementDate: dataPoint.measurementDate,
        recordedById: dataPoint.recordedById,
        recordedByRole: dataPoint.recordedByRole,
        context: dataPoint.context.name,
        notes: dataPoint.notes,
      );
      
      if (mounted) {
        Navigator.pop(context, dataPoint);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _saving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save: $e')),
        );
      }
    }
  }

  IconData _getContextIcon(IEPMeasurementContext context) {
    switch (context) {
      case IEPMeasurementContext.classroom:
        return Icons.school_outlined;
      case IEPMeasurementContext.home:
        return Icons.home_outlined;
      case IEPMeasurementContext.therapy:
        return Icons.psychology_outlined;
      case IEPMeasurementContext.community:
        return Icons.people_outline;
      case IEPMeasurementContext.assessment:
        return Icons.assignment_outlined;
      case IEPMeasurementContext.other:
        return Icons.more_horiz;
    }
  }

  String _formatDate(DateTime date) {
    final months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }

  bool _isToday(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year && 
           date.month == now.month && 
           date.day == now.day;
  }
}
