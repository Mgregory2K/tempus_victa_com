import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'twin_event.dart';

class TwinEventLedger {
  final File? _file;
  final List<TwinEvent> _webMemory = [];

  TwinEventLedger._(this._file);

  static Future<TwinEventLedger> open() async {
    if (kIsWeb) return TwinEventLedger._(null);

    final dir = await getApplicationDocumentsDirectory();
    final tp = Directory(p.join(dir.path, 'twin_plus'));
    if (!tp.existsSync()) tp.createSync(recursive: true);
    final f = File(p.join(tp.path, 'events.jsonl'));
    if (!f.existsSync()) f.createSync(recursive: true);
    return TwinEventLedger._(f);
  }

  Future<void> append(TwinEvent e) async {
    if (kIsWeb) {
      _webMemory.add(e);
      if (_webMemory.length > 500) _webMemory.removeAt(0);
      return;
    }
    
    if (_file != null) {
      final line = jsonEncode(e.toJson());
      await _file!.writeAsString('$line\n', mode: FileMode.append, flush: true);
    }
  }

  List<TwinEvent> query({int limit = 50}) {
    if (kIsWeb) {
      return _webMemory.reversed.take(limit).toList().reversed.toList();
    }

    try {
      if (_file == null) return [];
      final lines = _file!.readAsLinesSync();
      final out = <TwinEvent>[];
      for (int i = lines.length - 1; i >= 0 && out.length < limit; i--) {
        final s = lines[i].trim();
        if (s.isEmpty) continue;
        final j = jsonDecode(s);
        if (j is Map<String, dynamic>) out.add(TwinEvent.fromJson(j));
      }
      return out.reversed.toList(growable: false);
    } catch (_) {
      return const <TwinEvent>[];
    }
  }
}
