import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;

/// Result of a single voice capture.
class VoiceResult {
  final String transcript;
  final String preview6;
  final int durationMs;
  final String? audioPath;

  const VoiceResult({
    required this.transcript,
    required this.preview6,
    required this.durationMs,
    required this.audioPath,
  });
}

class VoiceService {
  static final VoiceService instance = VoiceService._internal();
  VoiceService._internal();

  final stt.SpeechToText _stt = stt.SpeechToText();
  final AudioRecorder _recorder = AudioRecorder();

  bool _ready = false;
  bool _isStopping = false;
  bool _recorderStarted = false;

  DateTime? _started;
  String? _activeAudioPath;
  Timer? _watchdog;

  String _latestWords = '';
  String? _lastError;
  String? _lastStatus;

  bool get isReady => _ready;
  bool get isListening => _stt.isListening;
  String? get lastError => _lastError;
  String? get lastStatus => _lastStatus;

  Future<bool> init() async {
    if (_ready) return true;

    try {
      _ready = await _stt.initialize(
        onError: (e) {
          _lastError = e.errorMsg;
          debugPrint('STT Error: ${e.errorMsg}');
        },
        onStatus: (s) {
          _lastStatus = s;
          debugPrint('STT Status: $s');
        },
      );
    } catch (e) {
      debugPrint('STT Init Failed: $e');
      _ready = false;
    }

    return _ready;
  }

  Future<bool> start({required void Function(String partial) onPartial}) async {
    final ok = await init();
    if (!ok) return false;

    // Check permissions for both
    if (!await _recorder.hasPermission()) return false;

    _isStopping = false;
    _recorderStarted = false;
    _started = DateTime.now();
    _latestWords = '';
    _lastError = null;
    _lastStatus = null;

    // 1. Start Audio Recorder FIRST (WAV for stability on Samsung)
    try {
      final docDir = await getApplicationDocumentsDirectory();
      final dir = Directory('${docDir.path}/recordings');
      if (!await dir.exists()) await dir.create(recursive: true);
      
      final path = '${dir.path}/tv_${_started!.millisecondsSinceEpoch}.wav';
      _activeAudioPath = path;
      
      await _recorder.start(const RecordConfig(encoder: AudioEncoder.wav), path: path);
      _recorderStarted = true;
      debugPrint('VoiceService: WAV Recorder started at $path');
    } catch (e) {
      debugPrint('Recorder Start Fail: $e');
    }

    // 2. Start STT
    try {
      String? localeId;
      try {
        final sys = await _stt.systemLocale();
        localeId = sys?.localeId;
      } catch (_) {}

      await _stt.listen(
        localeId: localeId,
        listenMode: stt.ListenMode.dictation,
        partialResults: true,
        cancelOnError: false,
        onResult: (r) {
          if (_isStopping) return;
          _latestWords = r.recognizedWords;
          onPartial(_latestWords);
          _startWatchdog(onPartial);
        },
        listenFor: const Duration(seconds: 60),
        pauseFor: const Duration(seconds: 10),
      );
    } catch (e) {
      debugPrint('STT Listen Failed: $e');
    }

    _startWatchdog(onPartial);
    return true;
  }

  void _startWatchdog(void Function(String) onPartial) {
    _watchdog?.cancel();
    _watchdog = Timer(const Duration(seconds: 15), () {
      if (_stt.isListening || _started != null) {
        debugPrint('Voice watchdog fired - auto-stopping');
        stop(finalTranscript: _latestWords);
      }
    });
  }

  Future<VoiceResult> stop({required String finalTranscript}) async {
    if (_isStopping) return VoiceResult(transcript: '', preview6: '', durationMs: 0, audioPath: null);
    _isStopping = true;
    _watchdog?.cancel();

    debugPrint('VoiceService: Stopping capture...');

    // Small delay to ensure STT buffer flushes
    await Future.delayed(const Duration(milliseconds: 300));

    final end = DateTime.now();

    // Stop STT
    try {
      if (_stt.isListening) {
        await _stt.stop();
      }
    } catch (e) {
      debugPrint('STT Stop error: $e');
    }

    // Stop Recorder
    String? finalPath;
    try {
      if (_recorderStarted) {
        finalPath = await _recorder.stop();
        debugPrint('VoiceService: Recorder stopped. File: $finalPath');
      }
    } catch (e) {
      debugPrint('VoiceService: Recorder stop error: $e');
    }

    final duration = _started == null ? 0 : end.difference(_started!).inMilliseconds;
    var cleaned = (finalTranscript.trim().isNotEmpty ? finalTranscript.trim() : _latestWords.trim());

    // Safety Fallback for "Idea Capture"
    if (cleaned.isEmpty && duration > 500) {
        cleaned = "Voice Capture (${(duration/1000).toStringAsFixed(1)}s)";
    }

    if (cleaned.isNotEmpty && !cleaned.startsWith("Voice Capture")) {
      cleaned = cleaned[0].toUpperCase() + cleaned.substring(1);
      if (!cleaned.endsWith('.') && !cleaned.endsWith('?') && !cleaned.endsWith('!')) {
        cleaned += '.';
      }
    }

    final words = cleaned.isEmpty ? <String>[] : cleaned.split(RegExp(r'\s+'));
    final preview = words.take(6).join(' ');

    _started = null;
    debugPrint('VoiceService: Result Ready. Transcript length: ${cleaned.length}');

    return VoiceResult(
      transcript: cleaned,
      preview6: preview,
      durationMs: duration,
      audioPath: finalPath ?? _activeAudioPath,
    );
  }
}
