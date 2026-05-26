import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_spacing.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/widgets/v_icon_button.dart';

class _FaqEntry {
  const _FaqEntry(this.question, this.answer);
  final String question;
  final String answer;
}

const _faqs = <_FaqEntry>[
  _FaqEntry(
    'What is Vital30?',
    'Vital30 is a free 30-day wellness challenge app. Pick a habit you want to build or break, check in each day for 30 days, and track your active days.',
  ),
  _FaqEntry(
    'What counts as a check-in?',
    'Each day, your active challenge offers three options: Yes, completed; No, missed today; or Skip today. One tap per day per challenge.',
  ),
  _FaqEntry(
    'What if I miss a day?',
    'A missed day breaks your current streak but never erases your active days. The goal is consistency, not perfection.',
  ),
  _FaqEntry(
    'Can I do more than one challenge at a time?',
    'Yes. Multiple active challenges are supported, each with its own daily check-in and progress.',
  ),
  _FaqEntry(
    'Can I check in for yesterday?',
    'No. Check-ins are for today only. If you missed a day, mark it as missed and pick the habit back up tomorrow.',
  ),
  _FaqEntry(
    'Is Vital30 medical advice?',
    'No. Vital30 is a general wellness app — habit tracking and motivation only. It does not diagnose, treat, or replace care from a qualified healthcare professional.',
  ),
  _FaqEntry(
    'Are challenges safe for everyone?',
    'Vital30 is wellness guidance, not a medical tool. If you have a medical condition, are pregnant, take medication, or experience concerning symptoms, consult a healthcare professional before joining any challenge.',
  ),
  _FaqEntry(
    'How do I delete my account?',
    'Profile → Edit profile → Delete account. This permanently removes your account, challenges, check-ins, share events, and achievements.',
  ),
  _FaqEntry(
    'How do referral codes work?',
    'You get a unique code at signup. Share it with friends; when they redeem it in their app, you both stay connected and they show up on your invite list.',
  ),
];

class FaqScreen extends StatelessWidget {
  const FaqScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: Row(
                children: [
                  VIconButton(
                    icon: Icons.arrow_back_ios_new,
                    iconSize: 16,
                    onPressed: () => context.pop(),
                  ),
                  const SizedBox(width: 14),
                  Text(
                    'Help & FAQ',
                    style: Vital30Text.h3.copyWith(fontSize: 16),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(
                    Vital30Space.screenH, 16, Vital30Space.screenH, 32),
                children: [
                  for (final faq in _faqs) _FaqTile(entry: faq),
                  const SizedBox(height: 12),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Text(
                      'Still stuck? Email hello@vital30.com — we read everything.',
                      style: Vital30Text.caption,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FaqTile extends StatefulWidget {
  const _FaqTile({required this.entry});
  final _FaqEntry entry;

  @override
  State<_FaqTile> createState() => _FaqTileState();
}

class _FaqTileState extends State<_FaqTile> {
  bool _open = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Vital30Colors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Vital30Colors.hairlineSoft),
      ),
      child: Column(
        children: [
          InkWell(
            borderRadius: BorderRadius.circular(14),
            onTap: () => setState(() => _open = !_open),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      widget.entry.question,
                      style: Vital30Text.title.copyWith(fontSize: 14),
                    ),
                  ),
                  AnimatedRotation(
                    duration: const Duration(milliseconds: 150),
                    turns: _open ? 0.125 : 0,
                    child: const Icon(Icons.add,
                        size: 18, color: Vital30Colors.inkSoft),
                  ),
                ],
              ),
            ),
          ),
          if (_open)
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
              child: SizedBox(
                width: double.infinity,
                child: Text(
                  widget.entry.answer,
                  style: Vital30Text.body.copyWith(fontSize: 13),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
