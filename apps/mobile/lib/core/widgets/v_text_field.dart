import 'package:flutter/material.dart';

import '../theme/v_colors.dart';
import '../theme/v_spacing.dart';
import '../theme/v_typography.dart';

class VTextField extends StatelessWidget {
  const VTextField({
    super.key,
    this.label,
    this.hint,
    this.controller,
    this.obscureText = false,
    this.keyboardType,
    this.textInputAction,
    this.suffix,
    this.helper,
    this.validator,
    this.autofillHints,
    this.onChanged,
    this.onSubmitted,
    this.autofocus = false,
    this.enabled = true,
    this.maxLines = 1,
  });

  final String? label;
  final String? hint;
  final TextEditingController? controller;
  final bool obscureText;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final Widget? suffix;
  final String? helper;
  final String? Function(String?)? validator;
  final List<String>? autofillHints;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final bool autofocus;
  final bool enabled;
  final int maxLines;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null) ...[
          Text(
            label!,
            style: Vital30Text.label.copyWith(
              color: Vital30Colors.inkSoft,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 8),
        ],
        TextFormField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          textInputAction: textInputAction,
          autofillHints: autofillHints,
          autofocus: autofocus,
          enabled: enabled,
          onChanged: onChanged,
          onFieldSubmitted: onSubmitted,
          maxLines: maxLines,
          style: Vital30Text.body.copyWith(
            color: Vital30Colors.ink,
            fontWeight: FontWeight.w600,
            fontSize: 15,
          ),
          decoration: InputDecoration(
            hintText: hint,
            suffixIcon: suffix,
          ),
          validator: validator,
        ),
        if (helper != null) ...[
          const SizedBox(height: Vital30Space.s),
          Text(
            helper!,
            style: Vital30Text.caption,
          ),
        ],
      ],
    );
  }
}
