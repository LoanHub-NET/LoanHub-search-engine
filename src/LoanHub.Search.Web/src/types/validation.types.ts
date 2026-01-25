/**
 * Validation error for a single field
 */
export interface FieldError {
  field: string;
  message: string;
}

/**
 * Validation result
 */
export interface ValidationResult<T = unknown> {
  isValid: boolean;
  errors: FieldError[];
  data?: T;
}

/**
 * Form field state
 */
export interface FieldState {
  value: string;
  error: string | null;
  touched: boolean;
}

/**
 * Generic form state
 */
export type FormState<T extends string> = Record<T, FieldState>;

/**
 * Validation rule function
 */
export type ValidationRule<T = string> = (value: T, fieldName: string) => string | null;

/**
 * Validation schema - maps field names to validation rules
 */
export type ValidationSchema<T extends string> = Record<T, ValidationRule[]>;
