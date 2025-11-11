/**
 * Validation utilities and patterns
 */

// Password: min 8 chars, uppercase, lowercase, number, special char
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const VALIDATION_MESSAGES = {
  password: {
    min: 'Password must be at least 8 characters long',
    pattern: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
    required: 'Password is required',
  },
  email: {
    invalid: 'Email must be a valid email address',
    required: 'Email is required',
  },
  username: {
    min: 'Username must be at least 3 characters long',
    max: 'Username must not exceed 50 characters',
    required: 'Username is required',
  },
};

export function validatePassword(password) {
  return PASSWORD_REGEX.test(password);
}

export function getPasswordRequirements() {
  return [
    'At least 8 characters long',
    'One uppercase letter (A-Z)',
    'One lowercase letter (a-z)',
    'One number (0-9)',
    'One special character (@$!%*?&)',
  ];
}
