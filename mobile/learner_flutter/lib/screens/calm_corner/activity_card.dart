import 'package:flutter/material.dart';
import 'package:aivo_shared/aivo_shared.dart';

/// Reusable card for displaying regulation activities
class ActivityCard extends StatelessWidget {
  final RegulationActivity activity;
  final VoidCallback onTap;
  final bool showType;

  const ActivityCard({
    super.key,
    required this.activity,
    required this.onTap,
    this.showType = true,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
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
        child: Row(
          children: [
            // Activity type icon
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: _getTypeColor(activity.type).withOpacity(0.15),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Center(
                child: Text(
                  activity.type.emoji,
                  style: const TextStyle(fontSize: 24),
                ),
              ),
            ),
            const SizedBox(width: 14),
            // Activity info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    activity.name,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AivoTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    activity.description,
                    style: TextStyle(
                      fontSize: 13,
                      color: AivoTheme.textMuted,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (showType) ...[
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        _buildTag(
                          activity.type.displayName,
                          _getTypeColor(activity.type),
                        ),
                        const SizedBox(width: 8),
                        _buildTag(
                          activity.durationDisplay,
                          AivoTheme.textMuted,
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            // Arrow
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: _getTypeColor(activity.type).withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                Icons.play_arrow_rounded,
                color: _getTypeColor(activity.type),
                size: 20,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTag(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w500,
          color: color,
        ),
      ),
    );
  }

  Color _getTypeColor(RegulationActivityType type) {
    switch (type) {
      case RegulationActivityType.breathing:
        return const Color(0xFF7DD3FC); // sky
      case RegulationActivityType.movement:
        return const Color(0xFFFCD34D); // amber
      case RegulationActivityType.grounding:
        return const Color(0xFF6EE7B7); // emerald
      case RegulationActivityType.sensory:
        return const Color(0xFFA78BFA); // violet
    }
  }
}
