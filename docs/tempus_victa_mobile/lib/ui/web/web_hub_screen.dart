import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/tempus_theme.dart';

class WebHubScreen extends StatefulWidget {
  const WebHubScreen({super.key});

  @override
  State<WebHubScreen> createState() => _WebHubScreenState();
}

class _WebHubScreenState extends State<WebHubScreen> {
  final TextEditingController _terminalController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final b = context.tv;

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          color: b.surface0,
          image: const DecorationImage(
            image: AssetImage('lib/assets/bridge_concepts/bridge_concept_dark.png'),
            fit: BoxFit.cover,
            opacity: 0.05,
          ),
        ),
        child: Column(
          children: [
            _buildWebHeader(context),
            Expanded(
              child: Row(
                children: [
                  _buildSidebar(context),
                  Expanded(
                    child: Column(
                      children: [
                        Expanded(child: _buildMainDashboard(context)),
                        _buildTerminalDock(context),
                      ],
                    ),
                  ),
                  _buildLiveSignalStream(context),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWebHeader(BuildContext context) {
    final b = context.tv;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
      decoration: BoxDecoration(
        color: b.surface1.withOpacity(0.8),
        border: Border(bottom: BorderSide(color: b.border)),
      ),
      child: Row(
        children: [
          Image.asset('lib/assets/tempus_victa.png', width: 28, height: 28),
          const SizedBox(width: 16),
          Text(
            'TEMPUS, VICTA',
            style: TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.w900, fontSize: 18, letterSpacing: 2, color: b.accent),
          ),
          const Spacer(),
          _HeaderLink(label: 'ORCHESTRATOR', active: true),
          _HeaderLink(label: 'COGNITIVE ASSETS'),
          _HeaderLink(label: 'TWIN+ LEDGER'),
          const SizedBox(width: 24),
          CircleAvatar(radius: 16, backgroundColor: b.accent.withOpacity(0.2), child: Icon(Icons.person_outline, size: 18, color: b.accent)),
        ],
      ),
    );
  }

  Widget _buildSidebar(BuildContext context) {
    final b = context.tv;
    return Container(
      width: 260,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(border: Border(right: BorderSide(color: b.border))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SidebarItem(icon: Icons.dashboard_rounded, label: 'Command Center', active: true),
          _SidebarItem(icon: Icons.account_tree_rounded, label: 'Action Chains'),
          _SidebarItem(icon: Icons.hub_outlined, label: 'Integration Dock'),
          const Divider(height: 40),
          Text('ACTIVE PROJECTS', style: TextStyle(color: b.muted, fontWeight: FontWeight.bold, fontSize: 11)),
          const SizedBox(height: 16),
          _SidebarProjectItem(label: 'Alien Book Concept', color: Colors.purpleAccent),
          _SidebarProjectItem(label: 'Web Deployment', color: b.accent),
        ],
      ),
    );
  }

  Widget _buildMainDashboard(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('SYSTEM OVERVIEW', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.5, color: Colors.blueAccent)),
          const SizedBox(height: 8),
          const Text('Master Intelligence Hub', style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900)),
          const SizedBox(height: 32),
          Row(
            children: [
              Expanded(child: _IntegrationCard(name: 'ChatGPT', status: 'Optimal', icon: Icons.bolt, color: Colors.greenAccent)),
              const SizedBox(width: 16),
              Expanded(child: _IntegrationCard(name: 'Notion', status: 'Synced', icon: Icons.menu_book_rounded, color: Colors.white)),
              const SizedBox(width: 16),
              Expanded(child: _IntegrationCard(name: 'Wrike', status: 'Active', icon: Icons.task_alt_rounded, color: Colors.blue)),
            ],
          ),
          const SizedBox(height: 32),
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: Colors.black26,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: context.tv.border),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
                  child: const Center(child: Text('Cognitive Mapping Engine [INACTIVE]')),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLiveSignalStream(BuildContext context) {
    final b = context.tv;
    return Container(
      width: 320,
      decoration: BoxDecoration(border: Border(left: BorderSide(color: b.border))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Text('LIVE SIGNALS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: b.accent)),
          ),
          Expanded(
            child: ListView(
              children: const [
                _SignalTile(title: 'Voice Capture', body: 'Added steak to grocery...', time: '2m ago'),
                _SignalTile(title: 'Notion Update', body: 'New page: Alien Research', time: '15m ago'),
                _SignalTile(title: 'Wrike Sync', body: 'Task moved to In Progress', time: '1h ago'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTerminalDock(BuildContext context) {
    final b = context.tv;
    return Container(
      height: 60,
      margin: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: b.accent.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          const Padding(padding: EdgeInsets.symmetric(horizontal: 16), child: Icon(Icons.terminal, color: Colors.greenAccent, size: 18)),
          Expanded(
            child: TextField(
              controller: _terminalController,
              style: const TextStyle(fontFamily: 'monospace', color: Colors.greenAccent, fontSize: 13),
              decoration: const InputDecoration(border: InputBorder.none, hintText: 'Enter Doctrine Command...', hintStyle: TextStyle(color: Colors.white24)),
            ),
          ),
          IconButton(onPressed: () {}, icon: Icon(Icons.arrow_forward, color: b.accent, size: 18)),
        ],
      ),
    );
  }
}

class _IntegrationCard extends StatelessWidget {
  final String name;
  final String status;
  final IconData icon;
  final Color color;
  const _IntegrationCard({required this.name, required this.status, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    final b = context.tv;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: b.surface1, borderRadius: BorderRadius.circular(16), border: Border.all(color: b.border)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 20),
              const Spacer(),
              Text(status, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 16),
          Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        ],
      ),
    );
  }
}

class _SignalTile extends StatelessWidget {
  final String title;
  final String body;
  final String time;
  const _SignalTile({required this.title, required this.body, required this.time});

  @override
  Widget build(BuildContext context) {
    final b = context.tv;
    return Container(
      padding: const EdgeInsets.all(16),
      border: Border(bottom: BorderSide(color: b.border)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
              const Spacer(),
              Text(time, style: TextStyle(color: b.muted, fontSize: 10)),
            ],
          ),
          const SizedBox(height: 4),
          Text(body, style: TextStyle(color: b.muted, fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis),
        ],
      ),
    );
  }
}

class _SidebarItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool active;
  const _SidebarItem({required this.icon, required this.label, this.active = false});

  @override
  Widget build(BuildContext context) {
    final b = context.tv;
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Icon(icon, color: active ? b.accent : b.muted, size: 20),
          const SizedBox(width: 16),
          Text(label, style: TextStyle(fontWeight: active ? FontWeight.bold : FontWeight.normal, color: active ? Colors.white : b.muted)),
        ],
      ),
    );
  }
}

class _SidebarProjectItem extends StatelessWidget {
  final String label;
  final Color color;
  const _SidebarProjectItem({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    final b = context.tv;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
          const SizedBox(width: 12),
          Text(label, style: TextStyle(color: b.muted, fontSize: 13)),
        ],
      ),
    );
  }
}

class _HeaderLink extends StatelessWidget {
  final String label;
  final bool active;
  const _HeaderLink({required this.label, this.active = false});

  @override
  Widget build(BuildContext context) {
    final b = context.tv;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Text(
        label,
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: active ? b.accent : b.muted, letterSpacing: 1),
      ),
    );
  }
}
