import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_spacing.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/widgets/v_button.dart';
import '../../../core/widgets/v_icon_button.dart';
import '../../../core/widgets/v_text_field.dart';
import '../domain/login_validator.dart';
import 'auth_provider.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _obscure = true;
  String? _errorMessage;
  Map<String, String> _validationErrors = {};

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    setState(() {
      _validationErrors = {};
      _errorMessage = null;
    });

    final name = _nameController.text;
    final email = _emailController.text;
    final password = _passwordController.text;
    final confirm = _confirmController.text;

    final errors = <String, String>{};
    if (name.trim().isEmpty) errors['name'] = 'Full name is required';
    final loginValidation =
        validateLoginInput(email: email, password: password);
    errors.addAll(loginValidation.errors);
    if (password != confirm) errors['confirm'] = 'Passwords do not match';

    if (errors.isNotEmpty) {
      setState(() => _validationErrors = errors);
      return;
    }

    final ok =
        await ref.read(authProvider.notifier).register(name, email, password);
    if (!ok && mounted) {
      setState(() {
        _errorMessage =
            ref.read(authProvider).errorMessage ?? 'Registration failed';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isSubmitting =
        ref.watch(authProvider).status == AuthStatus.authenticating;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                child: VIconButton(
                  icon: Icons.arrow_back_ios_new,
                  iconSize: 16,
                  onPressed: () => context.pop(),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 18, 24, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Create your\naccount', style: Vital30Text.h1),
                    const SizedBox(height: 10),
                    Text(
                      'Start your first 30-day challenge in under a minute.',
                      style: Vital30Text.body,
                    ),
                  ],
                ),
              ),
              if (_errorMessage != null)
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Vital30Colors.berryTint,
                      borderRadius: BorderRadius.circular(Vital30Radius.md),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.info_outline,
                          color: Vital30Colors.berryDeep,
                          size: 18,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            _errorMessage!,
                            style: Vital30Text.body.copyWith(
                              color: Vital30Colors.berryDeep,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 26, 24, 0),
                child: Column(
                  children: [
                    VTextField(
                      label: 'Name',
                      hint: 'Charan Reddy',
                      controller: _nameController,
                      textInputAction: TextInputAction.next,
                      autofillHints: const [AutofillHints.name],
                      validator: (_) => _validationErrors['name'],
                    ),
                    const SizedBox(height: 14),
                    VTextField(
                      label: 'Email',
                      hint: 'you@email.com',
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      autofillHints: const [AutofillHints.email],
                      validator: (_) => _validationErrors['email'],
                    ),
                    const SizedBox(height: 14),
                    VTextField(
                      label: 'Password',
                      hint: 'Min. 8 characters',
                      controller: _passwordController,
                      obscureText: _obscure,
                      textInputAction: TextInputAction.next,
                      autofillHints: const [AutofillHints.newPassword],
                      suffix: IconButton(
                        icon: Icon(
                          _obscure
                              ? Icons.visibility_outlined
                              : Icons.visibility_off_outlined,
                          size: 20,
                          color: Vital30Colors.muted,
                        ),
                        onPressed: () => setState(() => _obscure = !_obscure),
                      ),
                      validator: (_) => _validationErrors['password'],
                    ),
                    const SizedBox(height: 14),
                    VTextField(
                      label: 'Confirm password',
                      hint: 'Re-enter password',
                      controller: _confirmController,
                      obscureText: _obscure,
                      textInputAction: TextInputAction.done,
                      onSubmitted: (_) => _handleRegister(),
                      validator: (_) => _validationErrors['confirm'],
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 26, 24, 0),
                child: Column(
                  children: [
                    VButton(
                      label: isSubmitting ? 'Creating…' : 'Create account',
                      fullWidth: true,
                      onPressed: isSubmitting ? null : _handleRegister,
                    ),
                    const SizedBox(height: 14),
                    Text(
                      'By continuing you agree to our Terms and the wellness disclaimer.',
                      textAlign: TextAlign.center,
                      style: Vital30Text.caption.copyWith(fontSize: 12),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
                child: Row(
                  children: [
                    const Expanded(child: Divider(color: Vital30Colors.hairlineSoft)),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      child: Text(
                        'OR',
                        style: Vital30Text.label.copyWith(fontSize: 11),
                      ),
                    ),
                    const Expanded(child: Divider(color: Vital30Colors.hairlineSoft)),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 18, 24, 24),
                child: Center(
                  child: RichText(
                    text: TextSpan(
                      style: Vital30Text.body.copyWith(
                        fontSize: 13.5,
                        color: Vital30Colors.inkSoft,
                      ),
                      children: [
                        const TextSpan(text: 'Already on Vital30? '),
                        WidgetSpan(
                          child: GestureDetector(
                            onTap: () => context.go('/login'),
                            child: Text(
                              'Log in',
                              style: Vital30Text.body.copyWith(
                                color: Vital30Colors.primary,
                                fontWeight: FontWeight.w700,
                                fontSize: 13.5,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
