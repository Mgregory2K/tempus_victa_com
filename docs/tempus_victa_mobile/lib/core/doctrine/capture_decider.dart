import '../list_intent_parser.dart';
import 'routing_counter_store.dart';
import 'routing_decision_store.dart';

class CapturePlan {
  final String nextModule;
  final List<CaptureOp> ops;
  const CapturePlan({required this.nextModule, required this.ops});
}

enum CaptureOpType {
  navModule,
  createTask,
  listIntent,
  addCork,
  createProject,
  recordRouteDecision,
}

class CaptureOp {
  final CaptureOpType type;
  final Map<String, dynamic> data;
  const CaptureOp({required this.type, required this.data});
}

class CaptureDecider {
  static final CaptureDecider instance = CaptureDecider._();
  CaptureDecider._();

  Future<CapturePlan> decide({
    required String surface,
    required String transcript,
    String? overrideRouteIntent,
  }) async {
    final text = transcript.trim();
    if (text.isEmpty) {
      return const CapturePlan(nextModule: 'tasks', ops: <CaptureOp>[]);
    }

    final parts = text
        .split(RegExp(r'(?:\s+and\s+then\s+|\s+then\s+|;)', caseSensitive: false))
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty)
        .toList(growable: false);

    final ops = <CaptureOp>[];
    String lastModule = 'tasks';

    for (var p in parts) {
      final lower = p.toLowerCase();

      // --- 1. Global Navigation ---
      final navMatch = RegExp(r'^(?:take\s+me\s+to|go\s+to|open|switch\s+to|show\s+me)\s+(.+)$', caseSensitive: false).firstMatch(p);
      if (navMatch != null) {
        final target = (navMatch.group(1) ?? '').trim().toLowerCase();
        final m = _moduleFromSpokenTarget(target);
        if (m != null) {
          ops.add(CaptureOp(type: CaptureOpType.navModule, data: {'module': m}));
          lastModule = m;
          continue;
        }
      }

      // --- 2. Lists ---
      final listIntent = ListIntentParser.parse(p);
      if (listIntent != null) {
        ops.add(CaptureOp(
          type: CaptureOpType.listIntent,
          data: {
            'action': listIntent.action,
            'listName': listIntent.listName,
            'items': listIntent.items,
          },
        ));
        lastModule = 'lists';
        continue;
      }

      // --- 3. Corkboard ---
      if (lower.contains('cork it') || lower.contains('corkboard')) {
        final cleaned = p
            .replaceAll(RegExp(r'\bcork\s*it\b', caseSensitive: false), '')
            .replaceAll(RegExp(r'\bcorkboard\b', caseSensitive: false), '')
            .replaceAll(RegExp(r'^[:\s,]+|[:\s,]+$'), '')
            .trim();
        final ct = cleaned.isEmpty ? p : cleaned;
        ops.add(CaptureOp(type: CaptureOpType.addCork, data: {'text': ct}));
        lastModule = 'corkboard';
        continue;
      }

      // --- 4. Default Task Routing ---
      final routeIntent = overrideRouteIntent ?? await _learnedDefaultRouteForSurface(surface);
      if (routeIntent == RoutingCounterStore.intentRouteToCorkboard) {
        ops.add(CaptureOp(type: CaptureOpType.addCork, data: {'text': p, 'learnedDefault': true}));
        lastModule = 'corkboard';
      } else {
        // Explicit Task Command or Fallback
        final taskMatch = RegExp(r'^(?:create\s+)?task\s*:?\s*(.+)$', caseSensitive: false).firstMatch(p);
        final transcript = taskMatch != null ? taskMatch.group(1)! : p;
        ops.add(CaptureOp(type: CaptureOpType.createTask, data: {'transcript': transcript, 'learnedDefault': routeIntent == null}));
        lastModule = 'tasks';
      }
    }

    return CapturePlan(nextModule: lastModule, ops: ops);
  }

  Future<String> _learnedDefaultRouteForSurface(String surface) async {
    await RoutingCounterStore.instance.initialize();
    await RoutingDecisionStore.instance.refresh();
    return RoutingCounterStore.instance.learnedDefaultRoute(surface);
  }

  String? _moduleFromSpokenTarget(String target) {
    final t = target.replaceAll(RegExp(r'[^a-z\s]'), '').trim();
    if (t.contains('bridge')) return 'bridge';
    if (t.contains('ready') || t.contains('room')) return 'ready_room';
    if (t.contains('signal') || t.contains('bay')) return 'signal_bay';
    if (t.contains('cork') || t.contains('board')) return 'corkboard';
    if (t.contains('task')) return 'tasks';
    if (t.contains('project')) return 'projects';
    if (t.contains('quote')) return 'quote_board';
    if (t.contains('list')) return 'lists';
    return null;
  }
}
