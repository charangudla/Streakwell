import { describe, expect, it } from 'vitest';
import {
  validateCategoryForm,
  validateChallengeForm,
  validateLoginForm,
} from './adminForms';

describe('admin form validation', () => {
  it('validates login form values', () => {
    expect(validateLoginForm({ email: '', password: '' }).errors).toMatchObject({
      email: 'Email is required',
      password: 'Password is required',
    });
  });

  it('validates challenge form values', () => {
    expect(
      validateChallengeForm({
        title: '',
        description: '',
        durationDays: 0,
      }).errors,
    ).toMatchObject({
      title: 'Challenge title is required',
      description: 'Challenge description is required',
      durationDays: 'Duration must be at least 1 day',
    });
  });

  it('validates category form values', () => {
    expect(validateCategoryForm({ name: '' }).errors).toMatchObject({
      name: 'Category name is required',
    });
  });
});
