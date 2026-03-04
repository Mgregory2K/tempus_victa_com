import 'package:flutter/material.dart';

import '../../core/twin_plus/twin_event.dart';
import '../../core/twin_plus/twin_plus_kernel.dart';

/// Central defaults for all text input in Tempus, Victa.
class TvTextField extends StatefulWidget {
  final TextEditingController controller;
  final FocusNode? focusNode;
  final String? hintText;
  final int? maxLines;
  final bool autofocus;
  final IconData? prefixIcon;
  final Widget? suffixIcon;
  final bool enableVoice;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final TextCapitalization textCapitalization;

  final String? twinSurface;
  final String? twinFieldId;

  const TvTextField({
    super.key,
    required this.controller,
    this.focusNode,
    this.hintText,
    this.maxLines = 1,
    this.autofocus = false,
    this.prefixIcon,
    this.suffixIcon,
    this.enableVoice = false, 
    this.onChanged,
    this.onSubmitted,
    this.textCapitalization = TextCapitalization.sentences,
    this.twinSurface,
    this.twinFieldId,
  });

  @override
  State<TvTextField> createState() => _TvTextFieldState();
}

class _TvTextFieldState extends State<TvTextField> {
  DateTime _lastEditEmit = DateTime.fromMillisecondsSinceEpoch(0);

  void _emitEdit(String text) {
    final surface = widget.twinSurface;
    final fieldId = widget.twinFieldId;
    if (surface == null || fieldId == null) return;

    final now = DateTime.now();
    if (now.difference(_lastEditEmit).inMilliseconds < 800) return;
    _lastEditEmit = now;

    // Calculate required TwinEvent fields
    final chars = text.length;
    final words = text.trim().isEmpty ? 0 : text.trim().split(RegExp(r'\s+')).length;
    final hasCaps = text.contains(RegExp(r'[A-Z]'));
    final hasProfanity = text.toLowerCase().contains('fuck') || text.toLowerCase().contains('shit');
    final punctCount = RegExp(r'[\.,!\?]').allMatches(text).length;
    final density = chars == 0 ? 0.0 : punctCount / (chars.toDouble());

    TwinPlusKernel.instance.observe(
      TwinEvent.textEdited(
        surface: surface,
        fieldId: fieldId,
        chars: chars,
        words: words,
        hasCaps: hasCaps,
        hasProfanity: hasProfanity,
        punctuationDensity: density,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: widget.controller,
      focusNode: widget.focusNode,
      maxLines: widget.maxLines,
      autofocus: widget.autofocus,
      autocorrect: true,
      enableSuggestions: true,
      textCapitalization: widget.textCapitalization,
      onChanged: (v) {
        _emitEdit(v);
        widget.onChanged?.call(v);
      },
      onSubmitted: widget.onSubmitted,
      decoration: InputDecoration(
        hintText: widget.hintText,
        prefixIcon: widget.prefixIcon == null ? null : Icon(widget.prefixIcon),
        suffixIcon: widget.suffixIcon,
      ),
    );
  }
}
