import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart'; // For professional timestamps
import 'package:just_audio/just_audio.dart';

import '../../core/app_state_scope.dart';
import '../../core/project_item.dart';
import '../../core/project_store.dart';
import '../../core/recycle_bin_store.dart';
import '../../core/task_item.dart';
import '../../core/task_store.dart';
import '../../core/metrics_store.dart';
import '../../core/twin_plus/twin_plus_scope.dart';
import '../../core/twin_plus/twin_event.dart';
import '../../core/capture_executor.dart';
import '../room_frame.dart';
import '../theme/tv_textfield.dart';
import '../../services/voice/voice_service.dart';
import '../../core/app_settings_store.dart';
import '../widgets/dev_trace_panel.dart';

class TasksRoom extends StatefulWidget {
  final String roomName;
  const TasksRoom({super.key, required this.roomName});

  @override
  State<TasksRoom> createState() => _TasksRoomState();
}

class _TasksRoomState extends State<TasksRoom> {
  Timer? _refreshTimer;
  bool _devMode = false;
  final List<String> _devTrace = const [];

  @override
  void initState() {
    super.initState();
    _loadDevMode();
    _refreshTimer = Timer.periodic(const Duration(seconds: 5), (_) => _refresh(silent: true));
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadDevMode() async {
    final v = await AppSettingsStore().loadDevMode();
    if (!mounted) return;
    setState(() => _devMode = v);
  }

  Future<void> _refresh({bool silent = false}) async {
    if (!mounted) return;
    if (!silent) {
       AppStateScope.of(context).bumpTasksVersion();
    } else {
       setState(() {});
    }
  }

  Future<void> _createManualTask() async {
    final controller = TextEditingController();
    final text = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('New task'),
        content: TvTextField(
          controller: controller,
          autofocus: true,
          hintText: 'Type a task...',
          textCapitalization: TextCapitalization.sentences,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, controller.text.trim()), child: const Text('Create')),
        ],
      ),
    );

    if (text == null || text.isEmpty) return;

    final now = DateTime.now();
    final t = TaskItem(
      id: now.microsecondsSinceEpoch.toString(),
      createdAt: now,
      title: text,
      transcript: null,
      audioPath: null,
      projectId: null,
    );

    final tasks = await TaskStore.load();
    await TaskStore.save([t, ...tasks]);
    await MetricsStore.inc(TvMetrics.tasksCreatedManual);

    if (!mounted) return;
    TwinPlusScope.of(context).observe(TwinEvent.actionPerformed(surface: 'tasks', action: 'task_created', entityType: 'task', entityId: t.id));
    AppStateScope.of(context).bumpTasksVersion();
  }

  Future<void> _trashTask(TaskItem task) async {
    final tasks = await TaskStore.load();
    final updatedTasks = List<TaskItem>.of(tasks)..removeWhere((t) => t.id == task.id);
    await TaskStore.save(updatedTasks);

    final bin = await RecycleBinStore.loadTasks();
    await RecycleBinStore.saveTasks([task, ...bin]);

    if (!mounted) return;
    AppStateScope.of(context).bumpTasksVersion();
  }

  @override
  Widget build(BuildContext context) {
    final _ = AppStateScope.of(context).tasksVersion;

    return RoomFrame(
      title: widget.roomName,
      child: Column(
        children: [
          if (_devMode) DevTracePanel(lines: _devTrace),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => _refresh(),
              child: FutureBuilder<List<TaskItem>>(
                future: TaskStore.load(),
                builder: (context, snap) {
                  final tasks = snap.data ?? const <TaskItem>[];
                  if (snap.connectionState != ConnectionState.done && tasks.isEmpty) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  
                  return ListView.separated(
                    padding: const EdgeInsets.only(bottom: 100, top: 8),
                    itemCount: tasks.length,
                    separatorBuilder: (_, __) => const Divider(height: 1, indent: 64),
                    itemBuilder: (context, i) {
                      final t = tasks[i];
                      final hasAudio = t.audioPath != null && t.audioPath!.isNotEmpty;
                      // V1 Auditability: Show precise time
                      final timeStr = DateFormat('HH:mm:ss').format(t.createdAt);
                      
                      return Dismissible(
                        key: ValueKey('task_item_${t.id}'),
                        direction: DismissDirection.endToStart,
                        onDismissed: (_) => _trashTask(t),
                        background: Container(color: Colors.red, alignment: Alignment.centerRight, padding: const EdgeInsets.only(right: 20), child: const Icon(Icons.delete, color: Colors.white)),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: hasAudio ? Colors.blue.withOpacity(0.1) : Colors.grey.withOpacity(0.1),
                            child: Icon(hasAudio ? Icons.mic_rounded : Icons.check_circle_outline, color: hasAudio ? Colors.blue : Colors.grey),
                          ),
                          title: Text(t.title),
                          subtitle: Text('Captured at $timeStr ${hasAudio ? "• Voice" : "• Manual"}'),
                          onTap: () => _showTaskDetail(t),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showTaskDetail(TaskItem task) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => _TaskDetailSheet(task: task),
    );
  }
}

class _TaskDetailSheet extends StatefulWidget {
  final TaskItem task;
  const _TaskDetailSheet({required this.task});

  @override
  State<_TaskDetailSheet> createState() => _TaskDetailSheetState();
}

class _TaskDetailSheetState extends State<_TaskDetailSheet> {
  final _player = AudioPlayer();
  bool _audioReady = false;

  @override
  void initState() {
    super.initState();
    _initAudio();
  }

  Future<void> _initAudio() async {
    final p = widget.task.audioPath;
    if (p != null && p.isNotEmpty && await File(p).exists()) {
      await _player.setFilePath(p);
      if (mounted) setState(() => _audioReady = true);
    }
  }

  @override
  void dispose() {
    _player.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 20, 20, 40 + MediaQuery.of(context).viewInsets.bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(widget.task.title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          Text('Audit ID: ${widget.task.id}', style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 24),
          if (_audioReady) _playerWidget() else const Text('No audio data found for this entry.', textAlign: TextAlign.center),
          if (widget.task.transcript != null) ...[
            const SizedBox(height: 20),
            const Text('Full Transcript:', style: TextStyle(fontWeight: FontWeight.bold)),
            Text(widget.task.transcript!),
          ]
        ],
      ),
    );
  }

  Widget _playerWidget() {
    return StreamBuilder<PlayerState>(
      stream: _player.playerStateStream,
      builder: (context, snap) {
        final playing = snap.data?.playing ?? false;
        return Row(
          children: [
            IconButton.filled(
              onPressed: () => playing ? _player.pause() : _player.play(),
              icon: Icon(playing ? Icons.pause : Icons.play_arrow),
            ),
            const Expanded(child: Text('Play Voice Capture')),
            StreamBuilder<Duration>(
              stream: _player.positionStream,
              builder: (context, pSnap) => Text('${pSnap.data?.inSeconds ?? 0}s'),
            ),
          ],
        );
      },
    );
  }
}
