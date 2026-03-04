import 'dart:async';
import 'package:flutter/material.dart';

import '../../core/list_item.dart';
import '../../core/list_store.dart';
import '../../core/twin_plus/twin_event.dart';
import '../../core/twin_plus/twin_plus_scope.dart';
import '../room_frame.dart';
import '../theme/tv_textfield.dart';

class ListsRoom extends StatefulWidget {
  final String roomName;
  const ListsRoom({super.key, required this.roomName});

  @override
  State<ListsRoom> createState() => _ListsRoomState();
}

class _ListsRoomState extends State<ListsRoom> {
  List<ListItem> _lists = <ListItem>[];
  ListItem? _selected;
  final _newListCtrl = TextEditingController();
  final _addItemCtrl = TextEditingController();
  
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    _load();
    _refreshTimer = Timer.periodic(const Duration(seconds: 15), (_) => _load(silent: true));
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    _newListCtrl.dispose();
    _addItemCtrl.dispose();
    super.dispose();
  }

  Future<void> _load({bool silent = false}) async {
    final all = await ListStore.load();
    if (!mounted) return;
    setState(() {
      _lists = all;
      if (all.isEmpty) {
        _selected = null;
      } else {
        if (_selected == null) {
          _selected = all.first;
        } else {
          // Re-find the selected list in the new list to keep data fresh
          final match = all.cast<ListItem?>().firstWhere(
            (e) => e?.id == _selected?.id, 
            orElse: () => all.first
          );
          _selected = match;
        }
      }
    });
  }

  Future<void> _createList() async {
    final name = _newListCtrl.text.trim();
    if (name.isEmpty) return;
    
    final formatted = name[0].toUpperCase() + name.substring(1);
    
    await ListStore.createIfMissing(formatted);
    TwinPlusScope.of(context).observe(
      TwinEvent.actionPerformed(surface: 'lists', action: 'list_created', entityType: 'list', meta: {'name': formatted}),
    );
    _newListCtrl.clear();
    await _load();
  }

  Future<void> _addItems() async {
    final sel = _selected;
    if (sel == null) return;
    final raw = _addItemCtrl.text.trim();
    if (raw.isEmpty) return;

    final items = raw.contains(',') ? raw.split(',') : [raw];
    final cleaned = items.map((i) {
        var s = i.trim();
        if (s.isEmpty) return '';
        return s[0].toUpperCase() + s.substring(1);
    }).where((s) => s.isNotEmpty).toList();

    await ListStore.addItems(sel.name, cleaned);
    TwinPlusScope.of(context).observe(
      TwinEvent.actionPerformed(surface: 'lists', action: 'list_items_added', entityType: 'list', entityId: sel.id, meta: {'count': cleaned.length}),
    );
    _addItemCtrl.clear();
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    return RoomFrame(
      title: widget.roomName,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _newListCtrl,
                    decoration: InputDecoration(
                      hintText: 'New List Name...',
                      prefixIcon: const Icon(Icons.playlist_add_rounded),
                      filled: true,
                      fillColor: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.3),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    ),
                    onSubmitted: (_) => _createList(),
                  ),
                ),
                const SizedBox(width: 10),
                IconButton.filled(onPressed: _createList, icon: const Icon(Icons.add)),
              ],
            ),
          ),
          Expanded(
            child: Row(
              children: [
                Container(
                  width: 120,
                  decoration: BoxDecoration(border: Border(right: BorderSide(color: Theme.of(context).dividerColor))),
                  child: ListView.builder(
                    itemCount: _lists.length,
                    itemBuilder: (ctx, i) {
                      final l = _lists[i];
                      final isSel = _selected?.id == l.id;
                      return ListTile(
                        title: Text(l.name, style: TextStyle(fontSize: 13, fontWeight: isSel ? FontWeight.bold : FontWeight.normal)),
                        selected: isSel,
                        onTap: () => setState(() => _selected = l),
                      );
                    },
                  ),
                ),
                Expanded(
                  child: _selected == null
                      ? const Center(child: Text('Select or create a list'))
                      : Column(
                          children: [
                            Padding(
                              padding: const EdgeInsets.all(12),
                              child: TextField(
                                controller: _addItemCtrl,
                                decoration: InputDecoration(
                                  hintText: 'Add to ${_selected!.name}...',
                                  suffixIcon: IconButton(onPressed: _addItems, icon: const Icon(Icons.send_rounded)),
                                  border: const UnderlineInputBorder(),
                                ),
                                onSubmitted: (_) => _addItems(),
                              ),
                            ),
                            Expanded(
                              child: RefreshIndicator(
                                onRefresh: _load,
                                child: ListView.builder(
                                  itemCount: _selected!.entries.length,
                                  itemBuilder: (ctx, i) {
                                    final e = _selected!.entries[i];
                                    return CheckboxListTile(
                                      value: e.checked,
                                      title: Text(e.text, style: TextStyle(decoration: e.checked ? TextDecoration.lineThrough : null)),
                                      onChanged: (val) async {
                                        await ListStore.toggle(_selected!.id, e.id);
                                        await _load(silent: true);
                                      },
                                      controlAffinity: ListTileControlAffinity.leading,
                                    );
                                  },
                                ),
                              ),
                            ),
                          ],
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
