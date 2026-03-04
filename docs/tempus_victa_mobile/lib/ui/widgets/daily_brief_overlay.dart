import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/tempus_theme.dart';

class DailyBriefOverlay extends StatelessWidget {
  const DailyBriefOverlay({super.key});

  static Future<void> show(BuildContext context) {
    return showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Daily Brief',
      barrierColor: Colors.black.withOpacity(0.6),
      transitionDuration: const Duration(milliseconds: 400),
      pageBuilder: (ctx, anim1, anim2) => const DailyBriefOverlay(),
      transitionBuilder: (ctx, anim1, anim2, child) {
        final curve = CurvedAnimation(parent: anim1, curve: Curves.easeOutBack);
        return SlideTransition(
          position: Tween<Offset>(begin: const Offset(0, -1), end: Offset.zero).animate(curve),
          child: child,
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final b = context.tv;
    
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        // Added top/bottom padding to ensure it doesn't hit notification/nav bars
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 80), 
          child: GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              clipBehavior: Clip.antiAlias,
              decoration: BoxDecoration(
                color: b.surface1.withOpacity(0.88),
                borderRadius: BorderRadius.circular(b.radiusLg),
                border: Border.all(color: b.accent.withOpacity(0.4), width: 1.5),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 20, spreadRadius: 5),
                ],
              ),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _buildHeader(context),
                    Expanded(
                      child: ListView(
                        padding: const EdgeInsets.all(20),
                        children: [
                          _buildSection(
                            context,
                            title: '🧠 Top of Mind',
                            children: [
                              const _BriefItem(
                                time: '5m',
                                text: 'Review Liam\'s school meal account balance of \$25.00 on PaySchools.',
                              ),
                              const _BriefItem(
                                time: '15m',
                                text: 'Evaluate new Senior Network Engineer roles in Cape Coral, FL.',
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),
                          _buildSection(
                            context,
                            title: '🔔 FYI',
                            children: [
                              const _BriefItem(
                                text: 'Credit Karma: Two accounts reported closed. Check impact on scores.',
                              ),
                              const _BriefItem(
                                text: 'Steak added to Grocery List. 🥩',
                              ),
                            ],
                          ),
                          const SizedBox(height: 30),
                          _buildFeedbackSection(context),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    final b = context.tv;
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
      decoration: BoxDecoration(
        color: b.accent.withOpacity(0.12),
        border: Border(bottom: BorderSide(color: b.border)),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: b.accent,
            radius: 18,
            child: const Icon(Icons.auto_awesome, color: Colors.black, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Happy Sunday, Michael!', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900)),
                Text('Intelligence Briefing Active', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: b.accent)),
              ],
            ),
          ),
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.close_rounded),
          ),
        ],
      ),
    );
  }

  Widget _buildSection(BuildContext context, {required String title, required List<Widget> children}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold, letterSpacing: -0.5)),
        const SizedBox(height: 12),
        ...children,
      ],
    );
  }

  Widget _buildFeedbackSection(BuildContext context) {
    final b = context.tv;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          const Text('Was this brief helpful for your day?', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _FeedbackBtn(icon: Icons.thumb_up_alt_rounded, color: Colors.green, label: 'Helpful'),
              const SizedBox(width: 30),
              _FeedbackBtn(icon: Icons.thumb_down_alt_rounded, color: Colors.red, label: 'Not really'),
            ],
          ),
        ],
      ),
    );
  }
}

class _BriefItem extends StatelessWidget {
  final String? time;
  final String text;

  const _BriefItem({this.time, required this.text});

  @override
  Widget build(BuildContext context) {
    final b = context.tv;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (time != null) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(color: b.accent.withOpacity(0.15), borderRadius: BorderRadius.circular(4)),
              child: Text(time!, style: TextStyle(fontSize: 10, color: b.accent, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(width: 10),
          ],
          Expanded(
            child: Text(text, style: const TextStyle(fontSize: 14, height: 1.4)),
          ),
        ],
      ),
    );
  }
}

class _FeedbackBtn extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String label;

  const _FeedbackBtn({required this.icon, required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        IconButton.filledTonal(
          onPressed: () {},
          icon: Icon(icon, color: color),
        ),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
      ],
    );
  }
}
