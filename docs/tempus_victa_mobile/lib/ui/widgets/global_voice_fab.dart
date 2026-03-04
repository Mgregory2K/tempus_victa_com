import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/app_state_scope.dart';
import '../../core/twin_plus/twin_plus_kernel.dart';
import '../../core/capture_executor.dart';
import '../../services/voice/voice_service.dart';

/// Universal voice capture button with "Hold-to-Talk" speed.
class GlobalVoiceFab extends StatefulWidget {
  const GlobalVoiceFab({super.key});

  @override
  State<GlobalVoiceFab> createState() => _GlobalVoiceFabState();
}

class _GlobalVoiceFabState extends State<GlobalVoiceFab> {
  bool _ready = false;
  bool _active = false;
  String _live = '';

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final ok = await VoiceService.instance.init();
    if (!mounted) return;
    setState(() => _ready = ok);
  }

  Future<void> _onPressedDown() async {
    if (!_ready || _active) return;
    
    HapticFeedback.mediumImpact();
    
    setState(() {
      _active = true;
      _live = '';
    });

    final started = await VoiceService.instance.start(
      onPartial: (p) {
        if (!mounted) return;
        setState(() => _live = p);
      },
    );

    if (!started && mounted) {
      setState(() => _active = false);
    }
  }

  Future<void> _onReleased() async {
    if (!_active) return;
    
    HapticFeedback.lightImpact();
    
    // Capture context before async gap
    final appState = AppStateScope.of(context);

    final res = await VoiceService.instance.stop(finalTranscript: _live);
    
    if (!mounted) return;
    setState(() => _active = false);

    final transcript = res.transcript.trim();
    if (transcript.isEmpty) return;

    try {
      final result = await CaptureExecutor.instance.executeVoiceCapture(
        surface: 'global_mic',
        transcript: transcript,
        durationMs: res.durationMs,
        audioPath: res.audioPath,
        observe: TwinPlusKernel.instance.observe,
      );

      final module = result.nextModule;
      if (module.isNotEmpty && module != 'tasks') {
        appState.setSelectedModule(module);
      }
    } catch (e) {
      debugPrint('Voice execution error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    // Removed Tooltip to prevent "multiple tickers" crash during rapid interaction
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Listener(
        onPointerDown: (_) => _onPressedDown(),
        onPointerUp: (_) => _onReleased(),
        child: FloatingActionButton(
          heroTag: 'global_mic_fab',
          onPressed: () {}, 
          backgroundColor: _active ? Colors.redAccent : null,
          elevation: _active ? 0 : 6,
          child: Icon(_active ? Icons.mic_rounded : Icons.mic_none_rounded),
        ),
      ),
    );
  }
}
