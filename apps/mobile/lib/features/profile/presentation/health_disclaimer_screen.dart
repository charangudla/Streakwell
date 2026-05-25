import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_spacing.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/widgets/v_icon_button.dart';

class HealthDisclaimerScreen extends StatelessWidget {
  const HealthDisclaimerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(0, 12, 0, 40),
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: Vital30Space.screenH),
              child: Row(
                children: [
                  VIconButton(
                    icon: Icons.arrow_back_ios_new,
                    iconSize: 16,
                    onPressed: () => context.pop(),
                  ),
                  const SizedBox(width: 14),
                  Text(
                    'Health disclaimer',
                    style: Vital30Text.h3.copyWith(fontSize: 16),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: Vital30Space.screenH),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Vital30Colors.skyTint,
                  borderRadius: BorderRadius.circular(Vital30Radius.lg),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: Vital30Colors.sky.withValues(alpha: 0.18),
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: const Icon(
                        Icons.info_outlined,
                        color: Vital30Colors.sky,
                        size: 18,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Wellness guidance only',
                            style: Vital30Text.title.copyWith(
                              color: Vital30Colors.skyDeep,
                              fontSize: 15,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Vital30 is not a medical device, does not provide medical advice, and is not a substitute for professional care.',
                            style: Vital30Text.body.copyWith(
                              color: Vital30Colors.skyDeep,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 22),
            for (final s in _sections) ...[
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: Vital30Space.screenH),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      s.title,
                      style: Vital30Text.h3.copyWith(fontSize: 16),
                    ),
                    const SizedBox(height: 8),
                    Text(s.body, style: Vital30Text.body.copyWith(fontSize: 14)),
                    if (s.bullets != null) ...[
                      const SizedBox(height: 8),
                      for (final b in s.bullets!)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Padding(
                                padding: EdgeInsets.only(top: 7),
                                child: Icon(
                                  Icons.circle,
                                  size: 5,
                                  color: Vital30Colors.primary,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  b,
                                  style: Vital30Text.body
                                      .copyWith(fontSize: 14, height: 1.45),
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 20),
            ],
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: Vital30Space.screenH),
              child: Divider(color: Vital30Colors.hairlineSoft),
            ),
            const SizedBox(height: 14),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 28),
              child: Text(
                'Legal note: this disclaimer represents general safety terms for the Vital30 MVP launch and is recommended for full legal review before commercial release.',
                style: Vital30Text.caption.copyWith(
                  fontStyle: FontStyle.italic,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Section {
  const _Section({required this.title, required this.body, this.bullets});
  final String title;
  final String body;
  final List<String>? bullets;
}

const _sections = <_Section>[
  _Section(
    title: '1. Scope of the application',
    body:
        'Vital30 is designed for self-motivation, general habit tracking, and educational lifestyle support. It does not diagnose, treat, cure, manage, or prevent any illness or condition.',
  ),
  _Section(
    title: '2. Consult a professional',
    body:
        'Consult a qualified physician before participating in any physical, hydration, or diet challenge — especially if you have a pre-existing condition or are pregnant or nursing.',
  ),
  _Section(
    title: '3. Critical symptoms',
    body:
        'Stop any challenge immediately and contact a healthcare professional if you experience:',
    bullets: [
      'Severe dizziness, lightheadedness, or fainting.',
      'Chest pain, tightness, or irregular heartbeat.',
      'Sudden shortness of breath or laboured breathing.',
      'Severe muscle pain, joint discomfort, or nausea.',
    ],
  ),
  _Section(
    title: '4. Substance & alcohol cessation',
    body:
        'Some challenges focus on reducing or eliminating smoking or alcohol. Abrupt cessation of moderate-to-severe substance use can cause dangerous withdrawal symptoms. Vital30 is not a clinical rehabilitation program. Seek certified medical guidance for dependence.',
  ),
  _Section(
    title: '5. Age guidance',
    body:
        'Users under 18 must use the app and participate in challenges only under the guidance of a parent, legal guardian, or pediatrician.',
  ),
  _Section(
    title: '6. Emergencies',
    body:
        'Vital30 is not monitored by medical personnel. In a life-threatening emergency, call your local emergency service immediately.',
  ),
];
