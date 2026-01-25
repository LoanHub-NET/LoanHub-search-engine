import { useState, useCallback, type ChangeEvent } from 'react';
import type { FieldError } from '../types';

interface FormField {
  value: string;
  error: string | null;
  touched: boolean;
}

type FormValues = { [K: string]: string };

interface UseFormOptions<T extends FormValues> {
  initialValues: T;
  validate?: (values: T) => FieldError[];
  onSubmit: (values: T) => void | Promise<void>;
}

interface UseFormReturn<T extends FormValues> {
  values: T;
  errors: Record<keyof T, string | null>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleBlur: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  setValue: (field: keyof T, value: string) => void;
  setError: (field: keyof T, error: string | null) => void;
  handleSubmit: (e: React.FormEvent) => void;
  reset: () => void;
}

export function useForm<T extends FormValues>({
  initialValues,
  validate,
  onSubmit,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [fields, setFields] = useState<Record<keyof T, FormField>>(() => {
    const initial: Record<string, FormField> = {};
    for (const key of Object.keys(initialValues)) {
      initial[key] = {
        value: initialValues[key as keyof T],
        error: null,
        touched: false,
      };
    }
    return initial as Record<keyof T, FormField>;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const values = Object.keys(fields).reduce((acc, key) => {
    acc[key as keyof T] = fields[key as keyof T].value as T[keyof T];
    return acc;
  }, {} as T);

  const errors = Object.keys(fields).reduce((acc, key) => {
    acc[key as keyof T] = fields[key as keyof T].error;
    return acc;
  }, {} as Record<keyof T, string | null>);

  const touched = Object.keys(fields).reduce((acc, key) => {
    acc[key as keyof T] = fields[key as keyof T].touched;
    return acc;
  }, {} as Record<keyof T, boolean>);

  const isValid = Object.values(errors).every((e) => e === null);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFields((prev) => ({
      ...prev,
      [name]: {
        ...prev[name as keyof T],
        value,
        error: null, // Clear error on change
      },
    }));
  }, []);

  const handleBlur = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name } = e.target;
      setFields((prev) => ({
        ...prev,
        [name]: {
          ...prev[name as keyof T],
          touched: true,
        },
      }));

      // Validate on blur if validate function is provided
      if (validate) {
        const currentValues = Object.keys(fields).reduce((acc, key) => {
          acc[key as keyof T] = fields[key as keyof T].value as T[keyof T];
          return acc;
        }, {} as T);
        
        const validationErrors = validate(currentValues);
        const fieldError = validationErrors.find((err) => err.field === name);
        
        setFields((prev) => ({
          ...prev,
          [name]: {
            ...prev[name as keyof T],
            error: fieldError?.message ?? null,
          },
        }));
      }
    },
    [validate, fields]
  );

  const setValue = useCallback((field: keyof T, value: string) => {
    setFields((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        value,
        error: null,
      },
    }));
  }, []);

  const setError = useCallback((field: keyof T, error: string | null) => {
    setFields((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        error,
      },
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Mark all fields as touched
      setFields((prev) => {
        const updated = { ...prev };
        for (const key of Object.keys(updated)) {
          updated[key as keyof T] = {
            ...updated[key as keyof T],
            touched: true,
          };
        }
        return updated;
      });

      // Validate all fields
      if (validate) {
        const validationErrors = validate(values);
        
        if (validationErrors.length > 0) {
          setFields((prev) => {
            const updated = { ...prev };
            // Clear all errors first
            for (const key of Object.keys(updated)) {
              updated[key as keyof T] = {
                ...updated[key as keyof T],
                error: null,
              };
            }
            // Set new errors
            for (const err of validationErrors) {
              if (err.field in updated) {
                updated[err.field as keyof T] = {
                  ...updated[err.field as keyof T],
                  error: err.message,
                };
              }
            }
            return updated;
          });
          return;
        }
      }

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [validate, values, onSubmit]
  );

  const reset = useCallback(() => {
    setFields(() => {
      const initial: Record<string, FormField> = {};
      for (const key of Object.keys(initialValues)) {
        initial[key] = {
          value: initialValues[key as keyof T],
          error: null,
          touched: false,
        };
      }
      return initial as Record<keyof T, FormField>;
    });
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    setValue,
    setError,
    handleSubmit,
    reset,
  };
}
