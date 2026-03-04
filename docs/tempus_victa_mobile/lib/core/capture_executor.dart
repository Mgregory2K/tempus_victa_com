import 'package:flutter/foundation.dart';

import 'app_state.dart';
import 'corkboard_store.dart';
import 'doctrine/capture_decider.dart';
import 'doctrine/routing_counter_store.dart';
import 'list_store.dart';
import 'project_store.dart';
import 'signal_item.dart';
import 'signal_store.dart';
import 'task_item.dart';
import 'task_store.dart';
import 'twin_plus/twin_event.dart';

/// Hard Stabilization: single atomic boundary for capture execution.
class CaptureExecutionResult {
  final String signalId;
  final String nextModule;
  const CaptureExecutionResult({required this.signalId, required this.nextModule});
}

class CaptureExecutor {
  static final CaptureExecutor instance = CaptureExecutor._();
  CaptureExecutor._();

  // Reference to AppState to trigger UI refreshes
  AppState? _appState;
  void setAppState(AppState state) => _appState = state;
  AppState? getAppState() => _appState;

  Future<CaptureExecutionResult> executeVoiceCapture({
    required String surface,
    required String transcript,
    required int durationMs,
    String? audioPath,
    required void Function(TwinEvent e) observe,
    String? overrideRouteIntent,
  }) async {
    final text = transcript.trim();

    // 1) Persist signal FIRST (always).
    final signal = await _persistSignal(
      source: surface,
      title: TaskItem.titleFromTranscript(text.isEmpty ? 'Voice' : text, maxWords: 6),
      body: text,
    );

    // 2) Emit capture events.
    observe(TwinEvent.voiceCaptured(
      surface: surface,
      fieldId: 'global_capture',
      durationMs: durationMs,
      preview6: TaskItem.titleFromTranscript(text, maxWords: 6),
      chars: text.length,
      words: _wordCount(text),
    ));

    // 3) Decide plan.
    final plan = await CaptureDecider.instance.decide(
      surface: surface,
      transcript: text,
      overrideRouteIntent: overrideRouteIntent,
    );

    // 4) Apply plan (side effects).
    for (final op in plan.ops) {
      await _applyOp(
        op,
        surface: surface,
        observe: observe,
        audioPath: audioPath,
        durationMs: durationMs,
      );
    }

    return CaptureExecutionResult(signalId: signal.id, nextModule: plan.nextModule);
  }

  Future<void> _applyOp(
    CaptureOp op, {
    required String surface,
    required void Function(TwinEvent e) observe,
    required int durationMs,
    String? audioPath,
  }) async {
    switch (op.type) {
      case CaptureOpType.navModule:
        // Handled by returning nextModule to the UI
        return;

      case CaptureOpType.createTask:
        final transcript = (op.data['transcript'] as String?)?.trim() ?? '';
        if (transcript.isEmpty) return;
        final now = DateTime.now();
        final task = TaskItem(
          id: now.microsecondsSinceEpoch.toString(),
          createdAt: now,
          title: TaskItem.titleFromTranscript(transcript, maxWords: 6),
          transcript: transcript,
          audioPath: audioPath,
          audioDurationMs: durationMs,
          projectId: null,
        );
        final tasks = await TaskStore.load();
        await TaskStore.save([task, ...tasks]);
        _appState?.bumpTasksVersion();
        
        observe(TwinEvent.actionPerformed(
          surface: surface,
          action: 'task_created_capture',
          entityType: 'task',
          entityId: task.id,
        ));
        return;

      case CaptureOpType.listIntent:
        final action = (op.data['action'] as String?) ?? '';
        final listName = (op.data['listName'] as String?) ?? '';
        final items = (op.data['items'] as List?)?.whereType<String>().toList(growable: false) ?? const <String>[];
        if (listName.trim().isEmpty) return;

        if (action == 'add' || action == 'create') {
          await ListStore.addItems(listName, items);
          _appState?.bumpListsVersion();
          observe(TwinEvent.actionPerformed(
            surface: surface,
            action: 'list_items_added_capture',
            entityType: 'list',
            meta: {'name': listName, 'items': items.length},
          ));
        } else if (action == 'clear') {
          await ListStore.clear(listName);
          _appState?.bumpListsVersion();
        }
        return;

      case CaptureOpType.addCork:
        final text = (op.data['text'] as String?)?.trim() ?? '';
        if (text.isEmpty) return;
        await CorkboardStore.addText(text);
        observe(TwinEvent.actionPerformed(
          surface: surface,
          action: 'cork_created_capture',
          entityType: 'cork',
        ));
        return;

      case CaptureOpType.createProject:
        final name = (op.data['name'] as String?)?.trim() ?? '';
        if (name.isEmpty) return;
        final proj = await ProjectStore.addProject(name);
        observe(TwinEvent.actionPerformed(
          surface: surface,
          action: 'project_created_capture',
          entityType: 'project',
          entityId: proj.id,
        ));
        return;

      case CaptureOpType.recordRouteDecision:
        return;
    }
  }

  Future<SignalItem> _persistSignal({
    required String source,
    required String title,
    required String body,
  }) async {
    final now = DateTime.now();
    final id = now.microsecondsSinceEpoch.toString();
    final item = SignalItem(
      id: id,
      createdAt: now,
      source: source,
      title: title,
      body: body,
      fingerprint: '$source|$title|$body',
      lastSeenAt: now,
      count: 1,
      acknowledged: false,
    );
    final existing = await SignalStore.load();
    await SignalStore.save([item, ...existing]);
    return item;
  }

  int _wordCount(String s) {
    if (s.trim().isEmpty) return 0;
    return s.split(RegExp(r'\s+')).where((w) => w.trim().isNotEmpty).length;
  }
}
