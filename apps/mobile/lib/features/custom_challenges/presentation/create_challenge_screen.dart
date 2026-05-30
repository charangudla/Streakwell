import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';

import '../../../core/network/api_service.dart';
import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_spacing.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/widgets/v_button.dart';
import '../../../core/widgets/v_icon_button.dart';
import '../../challenges/presentation/challenges_provider.dart';

const _durationPresets = [7, 14, 21, 30, 60, 90];
const _difficulties = [
  ('BEGINNER', 'Beginner'),
  ('EASY', 'Easy'),
  ('MEDIUM', 'Medium'),
  ('HARD', 'Hard'),
];

class CreateChallengeScreen extends ConsumerStatefulWidget {
  const CreateChallengeScreen({super.key});
  @override
  ConsumerState<CreateChallengeScreen> createState() =>
      _CreateChallengeScreenState();
}

class _CreateChallengeScreenState extends ConsumerState<CreateChallengeScreen> {
  final _title = TextEditingController();
  final _short = TextEditingController();
  final _task = TextEditingController();
  final _desc = TextEditingController();
  int _duration = 30;
  String _difficulty = 'EASY';
  String _visibility = 'PRIVATE';
  String? _categoryId;
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _title.dispose();
    _short.dispose();
    _task.dispose();
    _desc.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_submitting) return;
    if (_title.text.trim().length < 3 ||
        _short.text.trim().length < 10 ||
        _task.text.trim().length < 3 ||
        _categoryId == null) {
      setState(
          () => _error = 'Fill in title, one-liner, daily task, category.');
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final created = await ref.read(apiServiceProvider).createCustomChallenge(
            title: _title.text.trim(),
            shortDescription: _short.text.trim(),
            description: _desc.text.trim(),
            dailyTask: _task.text.trim(),
            durationDays: _duration,
            difficulty: _difficulty,
            categoryId: _categoryId!,
            visibility: _visibility,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Created "${created.title}"')),
      );
      context.go('/my-created-challenges');
    } on DioException catch (e) {
      final msg = (e.response?.data is Map)
          ? (e.response!.data as Map)['message']?.toString()
          : null;
      setState(() => _error = msg ?? 'Could not create. Try again.');
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final categoriesAsync = ref.watch(categoriesProvider);

    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(0, 12, 0, 32),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
              child: Row(
                children: [
                  VIconButton(
                    icon: Icons.arrow_back_ios_new,
                    iconSize: 16,
                    onPressed: () => context.pop(),
                  ),
                  const SizedBox(width: 14),
                  Text('Create challenge',
                      style: Vital30Text.h3.copyWith(fontSize: 16)),
                ],
              ),
            ),
            const SizedBox(height: 18),
            Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: Vital30Space.screenH),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _label('Title'),
                  _input(_title, 'e.g. 14 Days No Coffee', maxLength: 80),
                  const SizedBox(height: 16),
                  _label('One-line description'),
                  _input(_short, 'Cut caffeine for two weeks with friends.',
                      maxLength: 300),
                  const SizedBox(height: 16),
                  _label('Daily task'),
                  _input(_task, 'No caffeinated drinks today.', maxLength: 200),
                  const SizedBox(height: 16),
                  _label('Duration'),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final d in _durationPresets)
                        _DurationChip(
                          value: d,
                          selected: _duration == d,
                          onTap: () => setState(() => _duration = d),
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _label('Difficulty'),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final d in _difficulties)
                        ChoiceChip(
                          label: Text(d.$2),
                          selected: _difficulty == d.$1,
                          onSelected: (_) => setState(() => _difficulty = d.$1),
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _label('Category'),
                  categoriesAsync.when(
                    loading: () => const LinearProgressIndicator(),
                    error: (_, __) => Text('Could not load categories.',
                        style: Vital30Text.body),
                    data: (cats) {
                      _categoryId ??= cats.isNotEmpty ? cats.first.id : null;
                      return DropdownButtonFormField<String>(
                        initialValue: _categoryId,
                        decoration: const InputDecoration(
                          border: OutlineInputBorder(),
                        ),
                        items: [
                          for (final c in cats)
                            DropdownMenuItem(value: c.id, child: Text(c.name)),
                        ],
                        onChanged: (v) => setState(() => _categoryId = v),
                      );
                    },
                  ),
                  const SizedBox(height: 16),
                  _label('More details (optional)'),
                  _input(_desc, 'Background, rules, motivation…',
                      maxLines: 4, maxLength: 2000),
                  const SizedBox(height: 16),
                  _label('Visibility'),
                  Column(
                    children: [
                      _VisibilityTile(
                        value: 'PRIVATE',
                        groupValue: _visibility,
                        title: 'Private (recommended)',
                        subtitle:
                            'Only people with your share link or an invite can join.',
                        onChanged: (v) => setState(() => _visibility = v),
                      ),
                      _VisibilityTile(
                        value: 'PUBLIC',
                        groupValue: _visibility,
                        title: 'Public',
                        subtitle:
                            'Anyone can find and join via Browse. Best for community-wide.',
                        onChanged: (v) => setState(() => _visibility = v),
                      ),
                    ],
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Vital30Colors.berryTint,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        _error!,
                        style: Vital30Text.body.copyWith(
                          color: Vital30Colors.berryDeep,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 18),
                  VButton(
                    label: _submitting ? 'Creating…' : 'Create challenge',
                    fullWidth: true,
                    icon: Icons.add,
                    onPressed: _submitting ? null : _submit,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _label(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 6, top: 2),
        child: Text(text, style: Vital30Text.label),
      );

  Widget _input(
    TextEditingController c,
    String hint, {
    int maxLines = 1,
    int? maxLength,
  }) {
    return TextField(
      controller: c,
      maxLines: maxLines,
      maxLength: maxLength,
      decoration: InputDecoration(
        hintText: hint,
        border: const OutlineInputBorder(),
        counterText: '',
      ),
    );
  }
}

class _DurationChip extends StatelessWidget {
  const _DurationChip(
      {required this.value, required this.selected, required this.onTap});
  final int value;
  final bool selected;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 36,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? Vital30Colors.primary : Vital30Colors.surfaceAlt,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          '$value days',
          style: TextStyle(
            color: selected ? Colors.white : Vital30Colors.inkSoft,
            fontWeight: FontWeight.w700,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}

class _VisibilityTile extends StatelessWidget {
  const _VisibilityTile({
    required this.value,
    required this.groupValue,
    required this.title,
    required this.subtitle,
    required this.onChanged,
  });
  final String value;
  final String groupValue;
  final String title;
  final String subtitle;
  final void Function(String) onChanged;

  @override
  Widget build(BuildContext context) {
    final selected = value == groupValue;
    return InkWell(
      onTap: () => onChanged(value),
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Simple dot indicator; avoids the Radio/RadioGroup migration
            // churn for now.
            Container(
              width: 20,
              height: 20,
              margin: const EdgeInsets.only(top: 4),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color:
                      selected ? Vital30Colors.primary : Vital30Colors.hairline,
                  width: 2,
                ),
              ),
              alignment: Alignment.center,
              child: selected
                  ? Container(
                      width: 10,
                      height: 10,
                      decoration: const BoxDecoration(
                        color: Vital30Colors.primary,
                        shape: BoxShape.circle,
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: 4),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: Vital30Text.title.copyWith(
                        fontSize: 14,
                        color: selected
                            ? Vital30Colors.ink
                            : Vital30Colors.inkSoft,
                      )),
                  const SizedBox(height: 2),
                  Text(subtitle,
                      style: Vital30Text.caption.copyWith(fontSize: 12)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
