import 'package:flutter/material.dart';
import '../../core/app_settings_store.dart';
import 'daily_brief_overlay.dart';

class TempusAppHeader extends StatelessWidget {
  final String roomTitle;
  final Widget? trailing;

  const TempusAppHeader({
    super.key,
    required this.roomTitle,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    // V1: Only show the "Brief" button on the Bridge
    final isBridge = roomTitle.toLowerCase().contains('bridge');

    return SafeArea(
      bottom: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
        child: Row(
          children: [
            Expanded(
              child: GestureDetector(
                onLongPress: () async {
                  final next = await AppSettingsStore().toggleDevMode();
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Dev Mode: ${next ? 'ON' : 'OFF'}')),
                  );
                },
                child: Text(
                  roomTitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    color: cs.onSurface,
                    fontSize: 22, // Slightly larger for "Badass" feel
                    letterSpacing: -0.5,
                  ),
                ),
              ),
            ),
            if (isBridge)
              IconButton(
                onPressed: () => DailyBriefOverlay.show(context),
                icon: const Icon(Icons.auto_awesome_rounded, color: Colors.blueAccent),
                tooltip: 'Intelligence Brief',
              ),
            if (trailing != null) ...[
              const SizedBox(width: 8),
              trailing!,
            ],
          ],
        ),
      ),
    );
  }
}
