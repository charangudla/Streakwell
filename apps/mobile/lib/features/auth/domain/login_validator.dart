class LoginValidationResult {
  const LoginValidationResult({required this.errors});

  final Map<String, String> errors;

  bool get isValid => errors.isEmpty;
}

LoginValidationResult validateLoginInput({
  required String email,
  required String password,
}) {
  final errors = <String, String>{};

  if (email.trim().isEmpty) {
    errors['email'] = 'Email is required';
  } else if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email)) {
    errors['email'] = 'Enter a valid email address';
  }

  if (password.isEmpty) {
    errors['password'] = 'Password is required';
  } else if (password.length < 8) {
    errors['password'] = 'Password must be at least 8 characters';
  }

  return LoginValidationResult(errors: errors);
}
