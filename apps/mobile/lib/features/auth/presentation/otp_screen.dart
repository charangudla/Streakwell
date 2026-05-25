import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_spacing.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/widgets/v_button.dart';
import '../../../core/widgets/v_icon_button.dart';
import 'widgets/recovery_step_pips.dart';

class OtpScreen extends StatefulWidget {
  const OtpScreen({super.key, this.email});
  final String? email;

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final _controllers =
      List.generate(6, (_) => TextEditingController());
  final _focusNodes = List.generate(6, (_) => FocusNode());
  int _seconds = 32;
  Timer? _resend;

  @override
  void initState() {
    super.initState();
    _resend = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted && _seconds > 0) setState(() => _seconds--);
    });
  }

  @override
  void dispose() {
    for (final c in _controllers) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    _resend?.cancel();
    super.dispose();
  }

  String get _code => _controllers.map((c) => c.text).join();

  void _onChanged(int i, String v) {
    if (v.length > 1) {
      // Pasted code
      final digits = v.replaceAll(RegExp(r'\D'), '');
      for (var k = 0; k < 6 && k < digits.length; k++) {
        _controllers[k].text = digits[k];
      }
      FocusScope.of(context).unfocus();
      return;
    }
    if (v.isNotEmpty && i < 5) {
      _focusNodes[i + 1].requestFocus();
    }
    if (v.isEmpty && i > 0) {
      _focusNodes[i - 1].requestFocus();
    }
    setState(() {});
  }

  void _submit() {
    if (_code.length == 6) {
      context.push('/new-password');
    }
  }

  @override
  Widget build(BuildContext context) {
    final canSubmit = _code.length == 6;
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                VIconButton(
                  icon: Icons.arrow_back_ios_new,
                  iconSize: 16,
                  onPressed: () => context.pop(),
                ),
                const SizedBox(height: 16),
                const RecoveryStepPips(active: 2),
                const SizedBox(height: 20),
                Text('Enter the\n6-digit code', style: Vital30Text.h1),
                const SizedBox(height: 10),
                Text(
                  widget.email == null || widget.email!.isEmpty
                      ? 'We sent a code to your email. Enter it below.'
                      : 'Sent to ${widget.email}.',
                  style: Vital30Text.body,
                ),
                const SizedBox(height: 26),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    for (var i = 0; i < 6; i++)
                      _OtpBox(
                        controller: _controllers[i],
                        focusNode: _focusNodes[i],
                        onChanged: (v) => _onChanged(i, v),
                      ),
                  ],
                ),
                const SizedBox(height: 18),
                Center(
                  child: _seconds > 0
                      ? Text(
                          'Resend in 0:${_seconds.toString().padLeft(2, '0')}',
                          style: Vital30Text.caption,
                        )
                      : TextButton(
                          onPressed: () => setState(() => _seconds = 32),
                          child: const Text('Resend code'),
                        ),
                ),
                const SizedBox(height: 18),
                VButton(
                  label: 'Verify',
                  fullWidth: true,
                  onPressed: canSubmit ? _submit : null,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _OtpBox extends StatelessWidget {
  const _OtpBox({
    required this.controller,
    required this.focusNode,
    required this.onChanged,
  });
  final TextEditingController controller;
  final FocusNode focusNode;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final hasValue = controller.text.isNotEmpty;
    return SizedBox(
      width: 46,
      height: 56,
      child: TextField(
        controller: controller,
        focusNode: focusNode,
        textAlign: TextAlign.center,
        keyboardType: TextInputType.number,
        inputFormatters: [
          FilteringTextInputFormatter.digitsOnly,
        ],
        maxLength: 1,
        onChanged: onChanged,
        style: GoogleFonts.jetBrainsMono(
          fontSize: 22,
          fontWeight: FontWeight.w700,
          color: Vital30Colors.ink,
        ),
        decoration: InputDecoration(
          counter: const SizedBox.shrink(),
          isCollapsed: true,
          filled: true,
          fillColor: Vital30Colors.card,
          contentPadding: EdgeInsets.zero,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(Vital30Radius.md),
            borderSide: BorderSide(
              color: hasValue
                  ? Vital30Colors.ink
                  : Vital30Colors.hairline,
            ),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(Vital30Radius.md),
            borderSide: BorderSide(
              color: hasValue
                  ? Vital30Colors.ink
                  : Vital30Colors.hairline,
            ),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(Vital30Radius.md),
            borderSide: const BorderSide(
              color: Vital30Colors.primary,
              width: 2,
            ),
          ),
        ),
      ),
    );
  }
}
