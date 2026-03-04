import 'package:flutter/material.dart';
import '../core/module_def.dart';

class GearCarouselNav extends StatefulWidget {
  final List<ModuleDef> modules;
  final int selectedIndex;
  final ValueChanged<int> onSelect;
  final VoidCallback onRequestReorder;

  const GearCarouselNav({
    super.key,
    required this.modules,
    required this.selectedIndex,
    required this.onSelect,
    required this.onRequestReorder,
  });

  @override
  State<GearCarouselNav> createState() => _GearCarouselNavState();
}

class _GearCarouselNavState extends State<GearCarouselNav> {
  static const double _height = 86;
  static const double _viewportFraction = 0.28;
  static const int _loopMultiplier = 2000;

  late PageController _controller;

  int get _n => widget.modules.length;
  int get _initialPage => (_n * _loopMultiplier) + widget.selectedIndex;

  @override
  void initState() {
    super.initState();
    _controller = PageController(
      viewportFraction: _viewportFraction,
      initialPage: _initialPage,
    );
  }

  @override
  void didUpdateWidget(GearCarouselNav oldWidget) {
    super.didUpdateWidget(oldWidget);
    // V1 NAVIGATION SYNC: If the index changed from the outside (voice/bridge),
    // we must animate the carousel to match.
    if (oldWidget.selectedIndex != widget.selectedIndex) {
      _jumpToSync(widget.selectedIndex);
    }
  }

  void _jumpToSync(int targetIndex) {
    if (!_controller.hasClients) return;
    
    final currentFullPage = _controller.page ?? _initialPage.toDouble();
    final currentModuleIndex = ((currentFullPage.round() % _n) + _n) % _n;
    
    if (currentModuleIndex == targetIndex) return;

    // Calculate shortest path in the infinite loop
    int diff = targetIndex - currentModuleIndex;
    if (diff > _n / 2) diff -= _n;
    if (diff < -_n / 2) diff += _n;
    
    final targetPage = currentFullPage.round() + diff;
    
    _controller.animateToPage(
      targetPage.toInt(),
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeInOutCubic,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  int _moduleIndexForPage(int page) => ((page % _n) + _n) % _n;

  @override
  Widget build(BuildContext context) {
    final surface = Theme.of(context).colorScheme.surface;

    return Material(
      elevation: 8,
      color: surface.withOpacity(0.92),
      child: SizedBox(
        height: _height,
        child: Stack(
          children: [
            Positioned(
              left: 0,
              right: 0,
              top: 0,
              child: Container(height: 1, color: Colors.white12),
            ),
            PageView.builder(
              controller: _controller,
              pageSnapping: true,
              physics: const BouncingScrollPhysics(),
              onPageChanged: (page) {
                final idx = _moduleIndexForPage(page);
                if (idx != widget.selectedIndex) {
                  widget.onSelect(idx);
                }
              },
              itemBuilder: (context, pageIndex) {
                final moduleIndex = _moduleIndexForPage(pageIndex);
                final mod = widget.modules[moduleIndex];

                return AnimatedBuilder(
                  animation: _controller,
                  builder: (context, _) {
                    double page = _initialPage.toDouble();
                    if (_controller.hasClients) page = _controller.page!;
                    final distance = (pageIndex - page).abs();

                    final t = (1.0 - (distance * 0.9)).clamp(0.0, 1.0);
                    final scale = 0.80 + (0.35 * t);
                    final opacity = 0.40 + (0.60 * t);

                    return Center(
                      child: Opacity(
                        opacity: opacity,
                        child: Transform.scale(
                          scale: scale,
                          child: _NavItem(
                            icon: mod.icon,
                            label: mod.name,
                            onTap: () => _jumpToSync(moduleIndex),
                            onLongPress: distance < 0.5 ? widget.onRequestReorder : null,
                          ),
                        ),
                      ),
                    );
                  },
                );
              },
            ),
            Align(
              alignment: Alignment.bottomCenter,
              child: Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Container(
                  width: 44,
                  height: 3,
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(99),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final VoidCallback? onLongPress;

  const _NavItem({
    required this.icon,
    required this.label,
    required this.onTap,
    required this.onLongPress,
  });

  @override
  Widget build(BuildContext context) {
    return InkResponse(
      onTap: onTap,
      onLongPress: onLongPress,
      radius: 44,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 26),
            const SizedBox(height: 6),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
