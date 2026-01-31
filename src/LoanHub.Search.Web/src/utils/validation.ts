import type { ValidationRule, ValidationResult, FieldError } from '../types';

/**
 * Loan amount validation constants
 */
export const LOAN_AMOUNT = {
  MIN: 100,
  MAX: 1000000,
  DEFAULT: 10000,
} as const;

/**
 * Loan duration validation constants (in months)
 */
export const LOAN_DURATION = {
  MIN: 1,
  MAX: 360,
  DEFAULT: 12,
} as const;

/**
 * Income validation constants
 */
export const INCOME = {
  MIN: 0,
  MAX: 10000000,
} as const;

/**
 * Check if value is required (not empty)
 */
export const required: ValidationRule = (value, fieldName) => {
  if (!value || value.trim() === '') {
    return `${fieldName} is required`;
  }
  return null;
};

/**
 * Check if value is a valid number
 */
export const isNumber: ValidationRule = (value, fieldName) => {
  if (value && isNaN(Number(value))) {
    return `${fieldName} must be a valid number`;
  }
  return null;
};

/**
 * Check if value is a positive number
 */
export const isPositive: ValidationRule = (value, fieldName) => {
  const num = Number(value);
  if (value && num <= 0) {
    return `${fieldName} must be greater than 0`;
  }
  return null;
};

/**
 * Check if value is an integer
 */
export const isInteger: ValidationRule = (value, fieldName) => {
  const num = Number(value);
  if (value && !Number.isInteger(num)) {
    return `${fieldName} must be a whole number`;
  }
  return null;
};

/**
 * Create a min value validator
 */
export const minValue = (min: number): ValidationRule => (value, fieldName) => {
  const num = Number(value);
  if (value && num < min) {
    return `${fieldName} must be at least ${min.toLocaleString()}`;
  }
  return null;
};

/**
 * Create a max value validator
 */
export const maxValue = (max: number): ValidationRule => (value, fieldName) => {
  const num = Number(value);
  if (value && num > max) {
    return `${fieldName} cannot exceed ${max.toLocaleString()}`;
  }
  return null;
};

/**
 * Validate loan amount
 */
export const validateLoanAmount = (value: string): string | null => {
  const rules: ValidationRule[] = [
    required,
    isNumber,
    isPositive,
    minValue(LOAN_AMOUNT.MIN),
    maxValue(LOAN_AMOUNT.MAX),
  ];

  for (const rule of rules) {
    const error = rule(value, 'Loan amount');
    if (error) return error;
  }
  return null;
};

/**
 * Validate loan duration
 */
export const validateLoanDuration = (value: string): string | null => {
  const rules: ValidationRule[] = [
    required,
    isNumber,
    isPositive,
    isInteger,
    minValue(LOAN_DURATION.MIN),
    maxValue(LOAN_DURATION.MAX),
  ];

  for (const rule of rules) {
    const error = rule(value, 'Duration');
    if (error) return error;
  }
  return null;
};

/**
 * Validate monthly income
 */
export const validateMonthlyIncome = (value: string): string | null => {
  if (!value || value.trim() === '') return null; // Optional field

  const rules: ValidationRule[] = [
    isNumber,
    isPositive,
    minValue(INCOME.MIN),
    maxValue(INCOME.MAX),
  ];

  for (const rule of rules) {
    const error = rule(value, 'Monthly income');
    if (error) return error;
  }
  return null;
};

/**
 * Validate living costs
 */
export const validateLivingCosts = (value: string): string | null => {
  if (!value || value.trim() === '') return null; // Optional field

  const rules: ValidationRule[] = [
    isNumber,
    isPositive,
    minValue(0),
    maxValue(INCOME.MAX),
  ];

  for (const rule of rules) {
    const error = rule(value, 'Living costs');
    if (error) return error;
  }
  return null;
};

/**
 * Validate dependents count
 */
export const validateDependents = (value: string): string | null => {
  if (!value || value.trim() === '') return null; // Optional field

  const rules: ValidationRule[] = [
    isNumber,
    isInteger,
    minValue(0),
    maxValue(20),
  ];

  for (const rule of rules) {
    const error = rule(value, 'Number of dependents');
    if (error) return error;
  }
  return null;
};

/**
 * Quick search form validation
 */
export interface QuickSearchInput {
  amount: string;
  duration: string;
}

export interface QuickSearchValidated {
  amount: number;
  duration: number;
}

export const validateQuickSearch = (input: QuickSearchInput): ValidationResult<QuickSearchValidated> => {
  const errors: FieldError[] = [];

  const amountError = validateLoanAmount(input.amount);
  if (amountError) {
    errors.push({ field: 'amount', message: amountError });
  }

  const durationError = validateLoanDuration(input.duration);
  if (durationError) {
    errors.push({ field: 'duration', message: durationError });
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    data: {
      amount: Number(input.amount),
      duration: Number(input.duration),
    },
  };
};

/**
 * Extended search form validation
 */
export interface ExtendedSearchInput extends QuickSearchInput {
  monthlyIncome: string;
  livingCosts: string;
  dependents: string;
}

export interface ExtendedSearchValidated extends QuickSearchValidated {
  monthlyIncome?: number;
  livingCosts?: number;
  dependents?: number;
}

export const validateExtendedSearch = (input: ExtendedSearchInput): ValidationResult<ExtendedSearchValidated> => {
  const errors: FieldError[] = [];

  // Validate required fields
  const amountError = validateLoanAmount(input.amount);
  if (amountError) {
    errors.push({ field: 'amount', message: amountError });
  }

  const durationError = validateLoanDuration(input.duration);
  if (durationError) {
    errors.push({ field: 'duration', message: durationError });
  }

  // Validate optional fields
  const incomeError = validateMonthlyIncome(input.monthlyIncome);
  if (incomeError) {
    errors.push({ field: 'monthlyIncome', message: incomeError });
  }

  const costsError = validateLivingCosts(input.livingCosts);
  if (costsError) {
    errors.push({ field: 'livingCosts', message: costsError });
  }

  const dependentsError = validateDependents(input.dependents);
  if (dependentsError) {
    errors.push({ field: 'dependents', message: dependentsError });
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    data: {
      amount: Number(input.amount),
      duration: Number(input.duration),
      monthlyIncome: input.monthlyIncome ? Number(input.monthlyIncome) : undefined,
      livingCosts: input.livingCosts ? Number(input.livingCosts) : undefined,
      dependents: input.dependents ? Number(input.dependents) : undefined,
    },
  };
};
