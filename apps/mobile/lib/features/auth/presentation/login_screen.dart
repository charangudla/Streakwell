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

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _obscure = true;
  String? _errorMessage;
  Map<String, String> _validationErrors = {};

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    setState(() {
      _validationErrors = {};
      _errorMessage = null;
    });

    final email = _emailController.text;
    final password = _passwordController.text;
    final validation = validateLoginInput(email: email, password: password);
    if (!validation.isValid) {
      setState(() => _validationErrors = validation.errors);
      return;
    }

    final ok = await ref.read(authProvider.notifier).login(email, password);
    if (!ok && mounted) {
      setState(() {
        _errorMessage =
            ref.read(authProvider).errorMessage ?? 'Login failed';
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
          padding: EdgeInsets.zero,
          child: Form(
            key: _formKey,
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
                      Text('Welcome back.', style: Vital30Text.h1),
                      const SizedBox(height: 10),
                      Text(
                        'Pick up where you left off — your streak is waiting.',
                        style: Vital30Text.body,
                      ),
                    ],
                  ),
                ),
                if (_errorMessage != null) ...[
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
                ],
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 26, 24, 0),
                  child: Column(
                    children: [
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
                        hint: 'Enter password',
                        controller: _passwordController,
                        obscureText: _obscure,
                        textInputAction: TextInputAction.done,
                        autofillHints: const [AutofillHints.password],
                        onSubmitted: (_) => _handleLogin(),
                        suffix: IconButton(
                          icon: Icon(
                            _obscure
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                            size: 20,
                            color: Vital30Colors.muted,
                          ),
                          onPressed: () =>
                              setState(() => _obscure = !_obscure),
                        ),
                        validator: (_) => _validationErrors['password'],
                      ),
                      const SizedBox(height: 8),
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          onPressed: () => context.push('/forgot-password'),
                          child: const Text('Forgot password?'),
                        ),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 10, 24, 0),
                  child: VButton(
                    label: isSubmitting ? 'Signing in…' : 'Log in',
                    fullWidth: true,
                    onPressed: isSubmitting ? null : _handleLogin,
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 34, 24, 24),
                  child: Center(
                    child: RichText(
                      text: TextSpan(
                        style: Vital30Text.body.copyWith(
                          fontSize: 13.5,
                          color: Vital30Colors.inkSoft,
                        ),
                        children: [
                          const TextSpan(text: 'New to Vital30? '),
                          WidgetSpan(
                            child: GestureDetector(
                              onTap: () => context.go('/register'),
                              child: Text(
                                'Create account',
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
      ),
    );
  }
}
