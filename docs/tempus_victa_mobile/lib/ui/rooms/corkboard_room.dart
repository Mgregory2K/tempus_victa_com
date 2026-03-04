import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/corkboard_store.dart';
import '../room_frame.dart';
import '../theme/tempus_theme.dart';
import '../theme/tv_textfield.dart';

class CorkboardRoom extends StatefulWidget {
  final String roomName;
  const CorkboardRoom({super.key, required this.roomName});

  @override
  State<CorkboardRoom> createState() => _CorkboardRoomState();
}

class _CorkboardRoomState extends State<CorkboardRoom> {
  final GlobalKey _boardKey = GlobalKey();
  List<CorkNoteModel> _notes = const [];
  bool _loading = true;

  String? _activeDragId;
  Offset _dragOffset = Offset.zero;

  Timer? _persistThrottle;
  Timer? _autoRefreshTimer;

  @override
  void initState() {
    super.initState();
    _load();
    _autoRefreshTimer = Timer.periodic(const Duration(seconds: 15), (_) => _load(silent: true));
  }

  @override
  void dispose() {
    _persistThrottle?.cancel();
    _autoRefreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _load({bool silent = false}) async {
    if (!silent) setState(() => _loading = true);
    final notes = await CorkboardStore.list();
    if (!mounted) return;
    setState(() {
      _notes = notes;
      _loading = false;
    });
  }

  Future<void> _createAt(Offset local) async {
    await CorkboardStore.addText('', x: local.dx, y: local.dy);
    await _load(silent: true);
    final created = _notes.isNotEmpty ? _notes.last : null;
    if (created != null && mounted) {
      _edit(created);
    }
  }

  Future<void> _edit(CorkNoteModel n) async {
    final ctrl = TextEditingController(text: n.text);
    final res = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (ctx) {
        final bottom = MediaQuery.of(ctx).viewInsets.bottom;
        return Padding(
          padding: EdgeInsets.fromLTRB(16, 12, 16, bottom + 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Edit note', style: Theme.of(ctx).textTheme.titleLarge),
              const SizedBox(height: 10),
              TvTextField(
                controller: ctrl,
                autofocus: true,
                maxLines: 6,
                textCapitalization: TextCapitalization.sentences,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: FilledButton(
                      onPressed: () => Navigator.of(ctx).pop(ctrl.text.trim()),
                      child: const Text('Save'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );

    final v = (res ?? '').trim();
    if (v.isEmpty && n.text.isEmpty) {
        await _delete(n); 
        return;
    }
    if (v == n.text) return;
    
    await CorkboardStore.updateText(n.id, v);
    await _load(silent: true);
  }

  Future<void> _delete(CorkNoteModel n) async {
    await CorkboardStore.delete(n.id);
    await _load(silent: true);
  }

  RenderBox? _boardBox() => _boardKey.currentContext?.findRenderObject() as RenderBox?;

  Offset _toBoardLocal(Offset global) {
    final box = _boardBox();
    if (box == null) return Offset.zero;
    return box.globalToLocal(global);
  }

  void _persistPositionThrottled(String id, Offset pos) {
    _persistThrottle?.cancel();
    _persistThrottle = Timer(const Duration(milliseconds: 200), () {
      CorkboardStore.updatePosition(id, pos.dx, pos.dy);
    });
  }

  @override
  Widget build(BuildContext context) {
    final body = _loading
        ? const Center(child: CircularProgressIndicator())
        : GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => FocusScope.of(context).unfocus(),
            onDoubleTapDown: (d) async {
              final local = _toBoardLocal(d.globalPosition);
              await _createAt(local);
            },
            child: Stack(
              key: _boardKey,
              children: [
                Positioned.fill(child: CustomPaint(painter: _CorkPainter(isDark: Theme.of(context).brightness == Brightness.dark))),
                ..._notes.map((n) => _noteWidget(context, n)),
                Positioned(
                  left: 0, right: 0, bottom: 20,
                  child: IgnorePointer(
                    child: Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.black12,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          'Double-tap to pin a new note',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white70),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );

    return RoomFrame(
      title: 'Corkboard',
      headerTrailing: IconButton(
        tooltip: 'Refresh',
        onPressed: _load,
        icon: const Icon(Icons.refresh),
      ),
      fab: FloatingActionButton(
        onPressed: () async {
          await CorkboardStore.addText('', x: 50, y: 100);
          await _load(silent: true);
          if (_notes.isNotEmpty) _edit(_notes.last);
        },
        child: const Icon(Icons.push_pin_outlined),
      ),
      child: RefreshIndicator(
        onRefresh: _load,
        child: body,
      ),
    );
  }

  Widget _noteWidget(BuildContext ctx, CorkNoteModel n) {
    final isDark = Theme.of(ctx).brightness == Brightness.dark;
    final ink = isDark ? const Color(0xFFE2E8F0) : const Color(0xFF1E293B);

    final colors = [
      const Color(0xFFFFF9C4), 
      const Color(0xFFE0F7FA), 
      const Color(0xFFFFEBEE), 
      const Color(0xFFF3E5F5), 
      const Color(0xFFE8F5E9), 
    ];
    final paper = colors[n.colorIndex % colors.length].withOpacity(isDark ? 0.9 : 1.0);

    final size = 130.0;
    final pos = Offset(n.x, n.y);

    return Positioned(
      left: pos.dx,
      top: pos.dy,
      child: GestureDetector(
        onPanStart: (details) {
          setState(() {
            _activeDragId = n.id;
            _dragOffset = details.localPosition;
          });
          CorkboardStore.bringToFront(n.id);
        },
        onPanUpdate: (details) {
          if (_activeDragId != n.id) return;
          
          final boardLocal = _toBoardLocal(details.globalPosition);
          final next = boardLocal - _dragOffset;

          setState(() {
            final idx = _notes.indexWhere((x) => x.id == n.id);
            if (idx != -1) {
              _notes[idx] = CorkNoteModel(
                id: n.id,
                text: n.text,
                x: next.dx,
                y: next.dy,
                z: 999, 
                colorIndex: n.colorIndex,
                createdAtEpochMs: n.createdAtEpochMs,
                updatedAtEpochMs: n.updatedAtEpochMs,
              );
            }
          });
          _persistPositionThrottled(n.id, next);
        },
        onPanEnd: (_) => setState(() => _activeDragId = null),
        onTap: () => _edit(n),
        onLongPress: () {
            HapticFeedback.heavyImpact();
            _delete(n);
        },
        child: Transform.rotate(
          angle: (n.id.hashCode % 10 - 5) * (math.pi / 180) * 0.5,
          child: Container(
            width: size,
            height: size,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: paper,
              borderRadius: const BorderRadius.only(bottomRight: Radius.circular(20)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(isDark ? 0.4 : 0.2),
                  blurRadius: 8,
                  offset: const Offset(2, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Center(
                  child: Icon(Icons.brightness_1, size: 8, color: Colors.red),
                ),
                const SizedBox(height: 4),
                Expanded(
                  child: Text(
                    n.text.isEmpty ? 'Tap to edit...' : n.text,
                    style: TextStyle(
                      color: ink,
                      fontFamily: 'monospace',
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 5,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _CorkPainter extends CustomPainter {
  final bool isDark;
  _CorkPainter({required this.isDark});

  @override
  void paint(Canvas canvas, Size size) {
    final base = isDark ? const Color(0xFF634D3A) : const Color(0xFFE6CCB2);
    final grainColor = isDark ? const Color(0xFF4A3A2B) : const Color(0xFFDDB892);

    final paint = Paint()..color = base;
    canvas.drawRect(Offset.zero & size, paint);

    final r = math.Random(42);
    final dot = Paint()..style = PaintingStyle.fill;
    
    for (var i = 0; i < 2000; i++) {
      final x = r.nextDouble() * size.width;
      final y = r.nextDouble() * size.height;
      final s = r.nextDouble() * 1.5;
      dot.color = Color.lerp(grainColor, base, r.nextDouble())!.withOpacity(0.4);
      canvas.drawCircle(Offset(x, y), s, dot);
    }
  }

  @override
  bool shouldRepaint(covariant _CorkPainter oldDelegate) => false;
}
