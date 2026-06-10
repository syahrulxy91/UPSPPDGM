import { useState, useCallback } from "react";

export type ValidationRules<T> = {
  [K in keyof T]?: (value: T[K], allValues: T) => string | null;
};

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationRules: ValidationRules<T>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<keyof T, string>>({} as any);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((name: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);

  const handleInputChange = useCallback((name: keyof T) => (e: any) => {
    const val = e && e.target ? e.target.value : e;
    setValues((prev) => ({ ...prev, [name]: val }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);

  const handleBlur = useCallback((name: keyof T) => () => {
    const rule = validationRules[name];
    if (rule) {
      const errorMsg = rule(values[name], values);
      setErrors((prev) => ({ ...prev, [name]: errorMsg || "" }));
    }
  }, [values, validationRules]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {} as any;
    let isValid = true;

    for (const key in validationRules) {
      if (Object.prototype.hasOwnProperty.call(validationRules, key)) {
        const rule = validationRules[key];
        if (rule) {
          const errorMsg = rule(values[key], values);
          if (errorMsg) {
            newErrors[key] = errorMsg;
            isValid = false;
          } else {
            newErrors[key] = "";
          }
        }
      }
    }

    setErrors(newErrors as any);
    return isValid;
  }, [values, validationRules]);

  const reset = useCallback((newValues?: T) => {
    setValues(newValues || initialValues);
    setErrors({} as any);
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    setValues,
    errors,
    setErrors,
    handleChange,
    handleInputChange,
    handleBlur,
    validate,
    reset,
    isSubmitting,
    setIsSubmitting,
  };
}

export default useFormValidation;
