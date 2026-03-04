import 'package:flutter/material.dart';
import 'modules.dart';
import 'room_screen.dart';
import 'gear_carousel_nav.dart';
import 'module_order_store.dart';

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  // In-memory module order (restored from disk on launch)
  List<ModuleDef> _modules = List<ModuleDef>.from(kPrimaryModules);

  // Track selection by ID so reorder does not “change” your current room.
  String _selectedModuleId = kPrimaryModules.first.id;

  bool get _carouselEnabled => true;

  int get _selectedIndex {
    final idx = _modules.indexWhere((m) => m.id == _selectedModuleId);
    return idx >= 0 ? idx : 0;
  }

  @override
  void initState() {
    super.initState();
    _restoreModuleOrder();
  }

  Future<void> _restoreModuleOrder() async {
    final savedIds = await ModuleOrderStore.loadOrderIds();
    if (!mounted) return;

    if (savedIds == null) return;

    // Rebuild module list from saved IDs, ignoring unknown IDs,
    // and appending any new modules not yet saved.
    final byId = {for (final m in kPrimaryModules) m.id: m};

    final restored = <ModuleDef>[];
    for (final id in savedIds) {
      final m = byId[id];
      if (m != null) restored.add(m);
    }

    // Append any modules added in code since the last save.
    for (final m in kPrimaryModules) {
      if (!restored.any((x) => x.id == m.id)) {
        restored.add(m);
      }
    }

    // If the user previously had a selected module that no longer exists,
    // fall back to first.
    final selectedStillExists = restored.any((m) => m.id == _selectedModuleId);

    setState(() {
      _modules = restored;
      if (!selectedStillExists) {
        _selectedModuleId = restored.first.id;
      }
    });
  }

  Future<void> _persistModuleOrder() async {
    final ids = _modules.map((m) => m.id).toList(growable: false);
    await ModuleOrderStore.saveOrderIds(ids);
  }

  void _selectByIndex(int idx) {
    if (idx < 0 || idx >= _modules.length) return;
    setState(() {
      _selectedModuleId = _modules[idx].id;
    });
  }

  Future<void> _openReorderSheet() async {
    // Working copy for the modal
    var working = List<ModuleDef>.from(_modules);

    final result = await showModalBottomSheet<List<ModuleDef>>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) {
        return SafeArea(
          top: false,
          child: StatefulBuilder(
            builder: (context, setModalState) {
              return Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Edit Carousel',
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                  fontWeight: FontWeight.w700,
                                ),
                          ),
                        ),
                        TextButton(
                          onPressed: () {
                            setModalState(() {
                              working = List<ModuleDef>.from(kPrimaryModules);
                            });
                          },
                          child: const Text('Reset'),
                        ),
                        const SizedBox(width: 8),
                        FilledButton(
                          onPressed: () => Navigator.pop(context, working),
                          child: const Text('Done'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Drag to reorder. You must long-press the centered icon to enter this mode.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.white70,
                          ),
                    ),
                    const SizedBox(height: 12),
                    ConstrainedBox(
                      constraints: BoxConstraints(
                        maxHeight: MediaQuery.of(context).size.height * 0.65,
                      ),
                      child: ReorderableListView.builder(
                        itemCount: working.length,
                        onReorder: (oldIndex, newIndex) {
                          setModalState(() {
                            if (newIndex > oldIndex) newIndex -= 1;
                            final item = working.removeAt(oldIndex);
                            working.insert(newIndex, item);
                          });
                        },
                        itemBuilder: (context, i) {
                          final m = working[i];
                          return ListTile(
                            key: ValueKey(m.id),
                            leading: Icon(m.icon),
                            title: Text(m.name),
                            trailing: const Icon(Icons.drag_handle_rounded),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        );
      },
    );

    if (result == null) return;

    setState(() {
      _modules = result;

      // Keep same selected room by ID after reorder.
      if (_modules.indexWhere((m) => m.id == _selectedModuleId) < 0) {
        _selectedModuleId = _modules.first.id;
      }
    });

    await _persistModuleOrder();
  }

  @override
  Widget build(BuildContext context) {
    final rooms = _modules
        .map((m) => RoomScreen(roomName: m.name))
        .toList(growable: false);

    return Scaffold(
      body: SafeArea(
        child: IndexedStack(
          index: _selectedIndex,
          children: rooms,
        ),
      ),
      bottomNavigationBar: _carouselEnabled
          ? SafeArea(
              top: false,
              child: GearCarouselNav(
                key: ValueKey(_modules.map((m) => m.id).join('|')),
                modules: _modules,
                selectedIndex: _selectedIndex,
                onSelect: _selectByIndex,
                onRequestReorder: _openReorderSheet,
              ),
            )
          : null,
    );
  }
}