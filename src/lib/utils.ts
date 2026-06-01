import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export interface ValidationResult {
  isValid: boolean;
  sanitized: string;
  errorMessage?: string;
}

/**
 * Validates and sanitizes user input, rejecting oversized or malformed inputs.
 */
export function validateAndSanitize(
  value: string,
  maxLength: number = 200,
  fieldName: string = "Input"
): ValidationResult {
  if (typeof value !== 'string') {
    return {
      isValid: false,
      sanitized: "",
      errorMessage: `${fieldName} must be a text value.`
    };
  }

  if (value.trim().length === 0) {
    return {
      isValid: true,
      sanitized: ""
    };
  }

  if (value.length > maxLength) {
    return {
      isValid: false,
      sanitized: value.slice(0, maxLength),
      errorMessage: `${fieldName} is too long (Max: ${maxLength} characters).`
    };
  }

  // Detect XSS references, HTML tags, script attempts, javascript expressions
  const hasHtmlTag = /<[^>]*>/g.test(value);
  const hasScriptAttempt = /<[\s\S]*?script[\s\S]*?>/gi.test(value);
  const hasJsUri = /javascript\s*:/gi.test(value);
  const hasDataUri = /data\s*:/gi.test(value);

  if (hasHtmlTag || hasScriptAttempt || hasJsUri || hasDataUri) {
    return {
      isValid: false,
      sanitized: "",
      errorMessage: `Prohibited characters/actions detected in ${fieldName}.`
    };
  }

  // Clean characters safely
  let clean = value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim();

  return {
    isValid: true,
    sanitized: clean
  };
}
