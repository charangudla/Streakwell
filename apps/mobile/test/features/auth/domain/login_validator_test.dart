import 'package:flutter_test/flutter_test.dart';
import 'package:vital30/features/auth/domain/login_validator.dart';

void main() {
  test('validateLoginInput rejects blank values', () {
    final result = validateLoginInput(email: '', password: '');

    expect(result.isValid, false);
    expect(result.errors['email'], 'Email is required');
    expect(result.errors['password'], 'Password is required');
  });

  test('validateLoginInput rejects malformed email and short password', () {
    final result = validateLoginInput(email: 'bad-email', password: 'short');

    expect(result.isValid, false);
    expect(result.errors['email'], 'Enter a valid email address');
    expect(result.errors['password'], 'Password must be at least 8 characters');
  });
}
