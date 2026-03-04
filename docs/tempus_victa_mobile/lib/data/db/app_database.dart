import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;

/// Minimal runtime wrapper returning a Drift [QueryExecutor].
/// V1 Web Pivot: Fixed "JS interop" errors by using conditional logic.
Future<QueryExecutor> openDriftDatabase({String? dbPath}) async {
  if (kIsWeb) {
    // For Web, we currently return a memory database to prevent JS interop errors.
    // In V2, we can implement persistent web storage via drift_wasm.
    return NativeDatabase.memory(); 
  }

  if (dbPath != null && dbPath == ':memory:') {
    return NativeDatabase.memory();
  }

  final dir = await getApplicationDocumentsDirectory();
  final file = File(dbPath ?? p.join(dir.path, 'tempus_victa.sqlite'));
  return NativeDatabase(file);
}
