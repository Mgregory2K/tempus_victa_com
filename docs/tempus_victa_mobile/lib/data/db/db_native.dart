import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;

Future<QueryExecutor> openConnection({String? dbPath}) async {
  if (dbPath == ':memory:') {
    return NativeDatabase.memory();
  }
  final dir = await getApplicationDocumentsDirectory();
  final file = File(dbPath ?? p.join(dir.path, 'tempus_victa.sqlite'));
  return NativeDatabase(file);
}
