export type ValidationResult = {
  isValid: boolean;
  errors: Record<string, string>;
};

export type LoginFormValues = {
  email: string;
  password: string;
};

export type ChallengeFormValues = {
  title: string;
  description: string;
  durationDays: number;
};

export type CategoryFormValues = {
  name: string;
};

export function validateLoginForm(values: LoginFormValues): ValidationResult {
  const errors: Record<string, string> = {};

  if (!values.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Enter a valid email address';
  }

  if (!values.password) {
    errors.password = 'Password is required';
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateChallengeForm(
  values: ChallengeFormValues,
): ValidationResult {
  const errors: Record<string, string> = {};

  if (!values.title.trim()) {
    errors.title = 'Challenge title is required';
  }

  if (!values.description.trim()) {
    errors.description = 'Challenge description is required';
  }

  if (!Number.isInteger(values.durationDays) || values.durationDays < 1) {
    errors.durationDays = 'Duration must be at least 1 day';
  }

  if (values.durationDays > 90) {
    errors.durationDays = 'Duration must be 90 days or less';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateCategoryForm(
  values: CategoryFormValues,
): ValidationResult {
  const errors: Record<string, string> = {};

  if (!values.name.trim()) {
    errors.name = 'Category name is required';
  }

  if (values.name.trim().length > 80) {
    errors.name = 'Category name must be 80 characters or less';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}
