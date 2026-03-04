import 'package:flutter/material.dart';

import 'core/app_settings_store.dart';
import 'core/app_theme_controller.dart';
import 'core/twin_plus/twin_plus_kernel.dart';
import 'services/device/device_ingest_service.dart';
import 'services/router/router_service.dart';
import 'core/twin_plus/twin_plus_scope.dart';
import 'ui/root_shell.dart';
import 'ui/theme/tempus_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Kernel
  try {
    await TwinPlusKernel.instance.init();
  } catch (e) {
    debugPrint('TwinPlusKernel.init failure: $e');
  }

  runApp(const TempusApp());

  // Background services
  DeviceIngestService.instance.init().catchError((e, st) {
    debugPrint('DeviceIngestService.init error: $e');
  });

  RouterService.instance.init().catchError((e, st) {
    debugPrint('RouterService.init error: $e');
  });
}

class TempusApp extends StatefulWidget {
  const TempusApp({super.key});

  @override
  State<TempusApp> createState() => _TempusAppState();
}

class _TempusAppState extends State<TempusApp> {
  final _settings = AppSettingsStore();
  ThemeMode _themeMode = ThemeMode.dark; 
  bool _loaded = false;

  @override
  void initState() {
    super.initState();
    _loadThemeMode();
  }

  Future<void> _loadThemeMode() async {
    final mode = await _settings.loadThemeMode();
    if (!mounted) return;
    setState(() {
      _themeMode = mode;
      _loaded = true;
    });
  }

  Future<void> _setThemeMode(ThemeMode mode) async {
    await _settings.setThemeMode(mode);
    if (!mounted) return;
    setState(() => _themeMode = mode);
  }

  @override
  Widget build(BuildContext context) {
    if (!_loaded) {
      return const MaterialApp(home: Scaffold(body: Center(child: CircularProgressIndicator())));
    }

    return MaterialApp(
      builder: (context, child) {
        return GestureDetector(
          behavior: HitTestBehavior.translucent,
          onTap: () => FocusManager.instance.primaryFocus?.unfocus(),
          child: child,
        );
      },
      title: 'Tempus, Victa',
      debugShowCheckedModeBanner: false,
      theme: TempusTheme.light(),
      darkTheme: TempusTheme.dark(),
      themeMode: _themeMode,
      home: AppThemeController(
        themeMode: _themeMode,
        setThemeMode: _setThemeMode,
        child: TwinPlusScope(
            kernel: TwinPlusKernel.instance, child: const RootShell()),
      ),
    );
  }
}
