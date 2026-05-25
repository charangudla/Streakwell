import 'package:flutter/material.dart';

class HealthDisclaimerScreen extends StatelessWidget {
  const HealthDisclaimerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final textTheme = theme.textTheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Health Disclaimer',
          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 20),
        ),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            // Top Medical Callout Warning Box
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF3C7), // Light amber/orange background
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFF59E0B), width: 1.5),
              ),
              child: const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.warning_amber_rounded,
                    color: Color(0xFFD97706),
                    size: 28,
                  ),
                  SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Important Safety Notice',
                          style: TextStyle(
                            color: Color(0xFF92400E),
                            fontWeight: FontWeight.w800,
                            fontSize: 15,
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Vital30 is a general wellness habit application and is NOT a medical device. It does not replace professional medical diagnosis, treatment, or advice.',
                          style: TextStyle(
                            color: Color(0xFFB45309),
                            fontSize: 13,
                            height: 1.4,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Section 1: Not a Medical Device
            _buildSectionHeader(context, '1. Scope of the Application'),
            _buildBodyText(
              'Vital30 is designed solely for self-motivation, general habit tracking, and educational lifestyle support. '
              'The application does not diagnose, treat, cure, manage, or prevent any illness, disease, physical condition, or mental health disorder.',
            ),
            const SizedBox(height: 20),

            // Section 2: Consult Your Doctor
            _buildSectionHeader(context, '2. Consult a Professional'),
            _buildBodyText(
              'We strongly advise consulting a qualified physician or healthcare professional before participating in any physical challenge, hydration target, or diet modification, especially if you possess pre-existing medical conditions, chronic pain, or are pregnant or nursing.',
            ),
            const SizedBox(height: 20),

            // Section 3: Severe Symptoms Warnings
            _buildSectionHeader(context, '3. Critical Physical Symptoms'),
            _buildBodyText(
              'Stop any challenge immediately and contact a healthcare professional if you experience symptoms including:',
            ),
            const SizedBox(height: 10),
            _buildBulletPoint('Severe dizziness, lightheadedness, or sudden fainting.'),
            _buildBulletPoint('Chest tightness, chest pain, or irregular/rapid heartbeats.'),
            _buildBulletPoint('Sudden shortness of breath or laboured breathing.'),
            _buildBulletPoint('Severe muscle pain, persistent joints discomfort, or nausea.'),
            const SizedBox(height: 20),

            // Section 4: Smoking, Alcohol & Substance Withdrawal
            _buildSectionHeader(context, '4. Substance & Alcohol Habit-breaking'),
            _buildBodyText(
              'Some challenges focus on reducing or eliminating smoking or alcohol. Please be warned: abrupt cessation of moderate-to-severe substance use can cause severe, dangerous physiological withdrawal symptoms. '
              'Vital30 challenges are not clinical rehabilitation programs. If you suffer from moderate or severe dependence, do not attempt withdrawal without certified medical guidance and clinical supervision.',
            ),
            const SizedBox(height: 20),

            // Section 5: Children & Teens
            _buildSectionHeader(context, '5. Age Restrictions & Guidance'),
            _buildBodyText(
              'Children and adolescents under the age of 18 must only use this application and participate in wellness challenges under the active guidance and supervision of a parent, legal guardian, or pediatrician.',
            ),
            const SizedBox(height: 20),

            // Section 6: Emergencies
            _buildSectionHeader(context, '6. Emergency Services'),
            _buildBodyText(
              'Vital30 is not monitored by medical personnel. If you are experiencing a life-threatening medical emergency, call your local emergency service (e.g., 911, 112, 999) or visit the nearest hospital emergency room immediately.',
            ),
            const SizedBox(height: 24),

            // Legal Template Advisory Note
            const Divider(color: Color(0xFFE1E8E4)),
            const SizedBox(height: 16),
            const Text(
              'Legal Note: This disclaimer represents the general safety terms for the Vital30 MVP launch and is recommended for complete legal review prior to full commercial release.',
              style: TextStyle(
                fontSize: 12,
                color: Color(0xFF8A9A92),
                fontStyle: FontStyle.italic,
                height: 1.4,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Text(
        title,
        style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w800,
              color: const Color(0xFF12211B),
              fontSize: 16,
            ),
      ),
    );
  }

  Widget _buildBodyText(String text) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 14,
        color: Color(0xFF4D5D55),
        height: 1.5,
      ),
    );
  }

  Widget _buildBulletPoint(String text) {
    return Padding(
      padding: const EdgeInsets.only(left: 12.0, bottom: 6.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 6.0),
            child: Icon(
              Icons.circle,
              size: 6,
              color: Color(0xFF10B981),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF4D5D55),
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
