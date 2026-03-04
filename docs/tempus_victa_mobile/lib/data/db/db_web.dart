import 'package:drift/drift.dart';
// We use a memory database for the web orchestrator hub in V1.
// In V2, we can switch to drift_wasm for persistence.
import 'package:drift/wasm.dart';

Future<QueryExecutor> openConnection({String? dbPath}) async {
  return DatabaseConnection(
    WebDatabase.withStorage(InMemoryStorage()),
  );
}
