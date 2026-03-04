import 'package:drift/drift.dart';

Future<QueryExecutor> openConnection({String? dbPath}) {
  throw UnsupportedError('Cannot open a database without dart:html or dart:io');
}
