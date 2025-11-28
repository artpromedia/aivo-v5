import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:aivo_shared/aivo_shared.dart';

/// Line chart showing IEP goal progress over time
class IEPProgressChart extends StatelessWidget {
  final IEPGoal goal;
  final double height;
  final bool showLegend;
  final bool interactive;

  const IEPProgressChart({
    super.key,
    required this.goal,
    this.height = 200,
    this.showLegend = true,
    this.interactive = true,
  });

  @override
  Widget build(BuildContext context) {
    if (goal.dataPoints.isEmpty) {
      return _buildEmptyState();
    }

    final sortedDataPoints = List<IEPDataPoint>.from(goal.dataPoints)
      ..sort((a, b) => a.measurementDate.compareTo(b.measurementDate));

    return Container(
      height: height,
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
          if (showLegend) ...[
            _buildLegend(),
            const SizedBox(height: 12),
          ],
          Expanded(
            child: LineChart(
              _buildChartData(sortedDataPoints),
              duration: const Duration(milliseconds: 250),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      height: height,
      padding: const EdgeInsets.all(24),
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
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.show_chart,
            size: 48,
            color: Colors.grey[300],
          ),
          const SizedBox(height: 12),
          Text(
            'No data points yet',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AivoTheme.textMuted,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Add measurements to track progress',
            style: TextStyle(
              fontSize: 13,
              color: AivoTheme.textMuted,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLegend() {
    return Row(
      children: [
        _buildLegendItem(
          color: AivoTheme.primary,
          label: 'Progress',
        ),
        const SizedBox(width: 16),
        _buildLegendItem(
          color: AivoTheme.mint,
          label: 'Target (${goal.targetLevel.toStringAsFixed(0)})',
          isDashed: true,
        ),
        const SizedBox(width: 16),
        _buildLegendItem(
          color: AivoTheme.sky.withOpacity(0.5),
          label: 'Trend',
          isDashed: true,
        ),
      ],
    );
  }

  Widget _buildLegendItem({
    required Color color,
    required String label,
    bool isDashed = false,
  }) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 16,
          height: 3,
          decoration: BoxDecoration(
            color: isDashed ? Colors.transparent : color,
            border: isDashed 
                ? Border(
                    bottom: BorderSide(
                      color: color,
                      width: 2,
                      style: BorderStyle.solid,
                    ),
                  )
                : null,
            borderRadius: BorderRadius.circular(2),
          ),
          child: isDashed 
              ? CustomPaint(
                  painter: DashedLinePainter(color: color),
                )
              : null,
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            color: AivoTheme.textMuted,
          ),
        ),
      ],
    );
  }

  LineChartData _buildChartData(List<IEPDataPoint> dataPoints) {
    // Calculate min/max dates for X axis
    final startDate = goal.startDate;
    final endDate = goal.targetDate;
    final totalDays = endDate.difference(startDate).inDays.toDouble();

    // Convert data points to spots
    final spots = dataPoints.map((dp) {
      final daysSinceStart = dp.measurementDate.difference(startDate).inDays.toDouble();
      return FlSpot(daysSinceStart, dp.value);
    }).toList();

    // Calculate min/max values for Y axis
    final values = dataPoints.map((dp) => dp.value).toList();
    values.add(goal.targetLevel);
    values.add(goal.currentLevel);
    final minY = (values.reduce((a, b) => a < b ? a : b) * 0.8).clamp(0.0, double.infinity);
    final maxY = values.reduce((a, b) => a > b ? a : b) * 1.2;

    // Calculate trend line (simple linear regression)
    final trendSpots = _calculateTrendLine(spots, totalDays);

    return LineChartData(
      minX: 0,
      maxX: totalDays,
      minY: minY,
      maxY: maxY,
      gridData: FlGridData(
        show: true,
        drawVerticalLine: false,
        horizontalInterval: (maxY - minY) / 4,
        getDrawingHorizontalLine: (value) {
          return FlLine(
            color: Colors.grey.withOpacity(0.1),
            strokeWidth: 1,
          );
        },
      ),
      titlesData: FlTitlesData(
        leftTitles: AxisTitles(
          sideTitles: SideTitles(
            showTitles: true,
            reservedSize: 40,
            interval: (maxY - minY) / 4,
            getTitlesWidget: (value, meta) {
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: Text(
                  value.toStringAsFixed(0),
                  style: TextStyle(
                    fontSize: 10,
                    color: AivoTheme.textMuted,
                  ),
                ),
              );
            },
          ),
        ),
        bottomTitles: AxisTitles(
          sideTitles: SideTitles(
            showTitles: true,
            reservedSize: 24,
            interval: totalDays / 4,
            getTitlesWidget: (value, meta) {
              final date = startDate.add(Duration(days: value.toInt()));
              return Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  '${date.month}/${date.day}',
                  style: TextStyle(
                    fontSize: 10,
                    color: AivoTheme.textMuted,
                  ),
                ),
              );
            },
          ),
        ),
        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
      ),
      borderData: FlBorderData(show: false),
      lineBarsData: [
        // Target line (horizontal)
        LineChartBarData(
          spots: [
            FlSpot(0, goal.targetLevel),
            FlSpot(totalDays, goal.targetLevel),
          ],
          isCurved: false,
          color: AivoTheme.mint,
          barWidth: 2,
          isStrokeCapRound: true,
          dotData: const FlDotData(show: false),
          dashArray: [8, 4],
        ),
        // Trend line
        if (trendSpots.length >= 2)
          LineChartBarData(
            spots: trendSpots,
            isCurved: false,
            color: AivoTheme.sky.withOpacity(0.5),
            barWidth: 2,
            isStrokeCapRound: true,
            dotData: const FlDotData(show: false),
            dashArray: [4, 4],
          ),
        // Actual data line
        LineChartBarData(
          spots: spots,
          isCurved: true,
          curveSmoothness: 0.3,
          color: AivoTheme.primary,
          barWidth: 3,
          isStrokeCapRound: true,
          dotData: FlDotData(
            show: true,
            getDotPainter: (spot, percent, barData, index) {
              return FlDotCirclePainter(
                radius: 5,
                color: Colors.white,
                strokeWidth: 2,
                strokeColor: AivoTheme.primary,
              );
            },
          ),
          belowBarData: BarAreaData(
            show: true,
            color: AivoTheme.primary.withOpacity(0.1),
          ),
        ),
      ],
      lineTouchData: interactive 
          ? LineTouchData(
              enabled: true,
              touchTooltipData: LineTouchTooltipData(
                getTooltipColor: (touchedSpot) => AivoTheme.textPrimary,
                tooltipRoundedRadius: 8,
                getTooltipItems: (touchedSpots) {
                  return touchedSpots.map((touchedSpot) {
                    if (touchedSpot.barIndex != 2) return null; // Only show for data line
                    final date = startDate.add(Duration(days: touchedSpot.x.toInt()));
                    return LineTooltipItem(
                      '${touchedSpot.y.toStringAsFixed(1)} ${goal.measurementUnit}\n${date.month}/${date.day}',
                      const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    );
                  }).toList();
                },
              ),
            )
          : const LineTouchData(enabled: false),
    );
  }

  List<FlSpot> _calculateTrendLine(List<FlSpot> spots, double totalDays) {
    if (spots.length < 2) return [];

    // Simple linear regression
    final n = spots.length;
    var sumX = 0.0;
    var sumY = 0.0;
    var sumXY = 0.0;
    var sumX2 = 0.0;

    for (final spot in spots) {
      sumX += spot.x;
      sumY += spot.y;
      sumXY += spot.x * spot.y;
      sumX2 += spot.x * spot.x;
    }

    final slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    final intercept = (sumY - slope * sumX) / n;

    // Create trend line from first data point to end
    final startX = spots.first.x;
    final endX = totalDays;

    return [
      FlSpot(startX, slope * startX + intercept),
      FlSpot(endX, slope * endX + intercept),
    ];
  }
}

/// Custom painter for dashed lines in legend
class DashedLinePainter extends CustomPainter {
  final Color color;

  DashedLinePainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    var startX = 0.0;
    const dashWidth = 4.0;
    const dashSpace = 2.0;

    while (startX < size.width) {
      canvas.drawLine(
        Offset(startX, size.height / 2),
        Offset(startX + dashWidth, size.height / 2),
        paint,
      );
      startX += dashWidth + dashSpace;
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Mini progress chart for dashboard cards
class IEPMiniProgressChart extends StatelessWidget {
  final IEPGoal goal;
  final double height;
  final double width;

  const IEPMiniProgressChart({
    super.key,
    required this.goal,
    this.height = 60,
    this.width = 100,
  });

  @override
  Widget build(BuildContext context) {
    if (goal.dataPoints.isEmpty) {
      return SizedBox(
        height: height,
        width: width,
        child: Center(
          child: Icon(
            Icons.show_chart,
            color: Colors.grey[300],
            size: 24,
          ),
        ),
      );
    }

    final sortedDataPoints = List<IEPDataPoint>.from(goal.dataPoints)
      ..sort((a, b) => a.measurementDate.compareTo(b.measurementDate));

    // Take last 10 data points
    final recentPoints = sortedDataPoints.length > 10 
        ? sortedDataPoints.sublist(sortedDataPoints.length - 10)
        : sortedDataPoints;

    final spots = recentPoints.asMap().entries.map((entry) {
      return FlSpot(entry.key.toDouble(), entry.value.value);
    }).toList();

    final values = recentPoints.map((dp) => dp.value).toList();
    values.add(goal.targetLevel);
    final minY = values.reduce((a, b) => a < b ? a : b) * 0.9;
    final maxY = values.reduce((a, b) => a > b ? a : b) * 1.1;

    return SizedBox(
      height: height,
      width: width,
      child: LineChart(
        LineChartData(
          minY: minY,
          maxY: maxY,
          gridData: const FlGridData(show: false),
          titlesData: const FlTitlesData(show: false),
          borderData: FlBorderData(show: false),
          lineBarsData: [
            // Target line
            LineChartBarData(
              spots: [
                FlSpot(0, goal.targetLevel),
                FlSpot(spots.length.toDouble() - 1, goal.targetLevel),
              ],
              isCurved: false,
              color: AivoTheme.mint.withOpacity(0.5),
              barWidth: 1,
              dotData: const FlDotData(show: false),
              dashArray: [4, 2],
            ),
            // Data line
            LineChartBarData(
              spots: spots,
              isCurved: true,
              curveSmoothness: 0.3,
              color: goal.isOnTrack ? AivoTheme.mint : AivoTheme.sunshine,
              barWidth: 2,
              isStrokeCapRound: true,
              dotData: const FlDotData(show: false),
              belowBarData: BarAreaData(
                show: true,
                color: (goal.isOnTrack ? AivoTheme.mint : AivoTheme.sunshine).withOpacity(0.1),
              ),
            ),
          ],
          lineTouchData: const LineTouchData(enabled: false),
        ),
        duration: const Duration(milliseconds: 250),
      ),
    );
  }
}

/// Pie chart showing goal status distribution
class IEPStatusPieChart extends StatelessWidget {
  final List<IEPGoal> goals;
  final double size;

  const IEPStatusPieChart({
    super.key,
    required this.goals,
    this.size = 150,
  });

  @override
  Widget build(BuildContext context) {
    if (goals.isEmpty) {
      return SizedBox(
        width: size,
        height: size,
        child: Center(
          child: Text(
            'No goals',
            style: TextStyle(color: AivoTheme.textMuted),
          ),
        ),
      );
    }

    // Count goals by status
    final statusCounts = <IEPGoalStatus, int>{};
    for (final goal in goals) {
      statusCounts[goal.status] = (statusCounts[goal.status] ?? 0) + 1;
    }

    final sections = statusCounts.entries.map((entry) {
      return PieChartSectionData(
        value: entry.value.toDouble(),
        color: Color(entry.key.colorValue),
        radius: size / 3,
        title: '${entry.value}',
        titleStyle: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      );
    }).toList();

    return SizedBox(
      width: size,
      height: size,
      child: PieChart(
        PieChartData(
          sections: sections,
          centerSpaceRadius: size / 6,
          sectionsSpace: 2,
        ),
      ),
    );
  }
}
