import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_spacing.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/widgets/v_button.dart';

class ReminderTimeScreen extends StatefulWidget {
  const ReminderTimeScreen({super.key});

  @override
  State<ReminderTimeScreen> createState() => _ReminderTimeScreenState();
}

class _ReminderTimeScreenState extends State<ReminderTimeScreen> {
  DateTime _time = DateTime(2026, 1, 1, 8, 0);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black.withValues(alpha: 0.5),
      body: GestureDetector(
        onTap: () => context.pop(),
        child: Align(
          alignment: Alignment.bottomCenter,
          child: GestureDetector(
            onTap: () {},
            child: Container(
              padding: EdgeInsets.fromLTRB(
                  20, 12, 20, MediaQuery.of(context).padding.bottom + 18),
              decoration: const BoxDecoration(
                color: Vital30Colors.surface,
                borderRadius: BorderRadius.vertical(
                  top: Radius.circular(Vital30Radius.xl),
                ),
              ),
              child: SafeArea(
                top: false,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 42,
                      height: 5,
                      decoration: BoxDecoration(
                        color: Vital30Colors.hairline,
                        borderRadius: BorderRadius.circular(99),
                      ),
                    ),
                    const SizedBox(height: 18),
                    Text('Daily reminder', style: Vital30Text.h2),
                    const SizedBox(height: 6),
                    Text(
                      "We'll nudge you once a day at this time.",
                      style: Vital30Text.body,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 18),
                    SizedBox(
                      height: 220,
                      child: CupertinoTheme(
                        data: const CupertinoThemeData(
                          textTheme: CupertinoTextThemeData(
                            dateTimePickerTextStyle: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        child: CupertinoDatePicker(
                          mode: CupertinoDatePickerMode.time,
                          initialDateTime: _time,
                          use24hFormat: false,
                          minuteInterval: 5,
                          onDateTimeChanged: (v) => setState(() => _time = v),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: VButton(
                            label: 'Cancel',
                            kind: VButtonKind.secondary,
                            fullWidth: true,
                            onPressed: () => context.pop(),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: VButton(
                            label: 'Save',
                            fullWidth: true,
                            onPressed: () => context.pop(_time),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
