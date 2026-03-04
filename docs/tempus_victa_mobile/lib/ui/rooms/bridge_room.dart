import 'package:flutter/material.dart';
import '../../core/app_state_scope.dart';
import '../room_frame.dart';
import '../theme/tempus_theme.dart';

class BridgeRoom extends StatelessWidget {
  final String roomName;
  const BridgeRoom({super.key, required this.roomName});

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final b = context.tv;

    return RoomFrame(
      title: roomName,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Welcome back.', style: tt.headlineMedium?.copyWith(fontWeight: FontWeight.w900)),
            const SizedBox(height: 8),
            Text('Your personalized assistant is observing and learning.', style: tt.bodyMedium?.copyWith(color: b.muted)),
            
            const SizedBox(height: 30),
            
            _DashboardCard(
              title: 'Intelligence Layer',
              subtitle: 'View Twin+ Learning Signal',
              icon: Icons.auto_awesome_rounded,
              color: Colors.blue,
              onTap: () => AppStateScope.of(context).setSelectedModule('signal_bay'),
            ),
            
            const SizedBox(height: 16),
            
            _DashboardCard(
              title: 'Voice Capture',
              subtitle: 'Active & Listening',
              icon: Icons.mic_none_rounded,
              color: b.accent,
              onTap: () {}, // Handled by Global FAB
            ),
            
            const SizedBox(height: 16),
            
            _DashboardCard(
              title: 'Ready Room',
              subtitle: 'Tactical overview of your day',
              icon: Icons.bolt_rounded,
              color: Colors.orange,
              onTap: () => AppStateScope.of(context).setSelectedModule('ready_room'),
            ),

            const Spacer(),
            
            Center(
              child: Opacity(
                opacity: 0.5,
                child: Text('V1.0.2 - Local First Cognitive OS', style: tt.labelSmall),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DashboardCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _DashboardCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final b = context.tv;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(b.radiusLg),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: b.surface1,
          borderRadius: BorderRadius.circular(b.radiusLg),
          border: Border.all(color: b.border),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                  Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: b.muted, size: 20),
          ],
        ),
      ),
    );
  }
}
