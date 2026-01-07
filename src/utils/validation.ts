/**
 * Input validation and sanitization utilities
 */

// Maximum allowed search query length
const MAX_QUERY_LENGTH = 500;

// Maximum allowed date range in days
const MAX_DATE_RANGE_DAYS = 3650; // ~10 years

/**
 * Sanitize user input to prevent XSS attacks
 * Removes potentially harmful characters and tags
 */
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Limit length
    .slice(0, MAX_QUERY_LENGTH);
};

/**
 * Validate search query
 * Returns validated query or throws error
 */
export const validateSearchQuery = (query: string): { valid: boolean; sanitized: string; error?: string } => {
  if (!query || typeof query !== 'string') {
    return { valid: false, sanitized: '', error: 'Query must be a non-empty string' };
  }

  const sanitized = sanitizeInput(query);

  if (sanitized.length === 0) {
    return { valid: false, sanitized: '', error: 'Query cannot be empty' };
  }

  if (sanitized.length > MAX_QUERY_LENGTH) {
    return {
      valid: false,
      sanitized: sanitized.slice(0, MAX_QUERY_LENGTH),
      error: `Query too long. Maximum ${MAX_QUERY_LENGTH} characters allowed.`
    };
  }

  return { valid: true, sanitized };
};

/**
 * Validate date string
 */
export const validateDate = (dateString: string | null): { valid: boolean; error?: string } => {
  if (!dateString) {
    return { valid: true }; // null/empty is valid (optional field)
  }

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }

  // Check if date is not in the future
  const now = new Date();
  if (date > now) {
    return { valid: false, error: 'Date cannot be in the future' };
  }

  // Check if date is not too far in the past (e.g., before 1970)
  const minDate = new Date('1970-01-01');
  if (date < minDate) {
    return { valid: false, error: 'Date too far in the past' };
  }

  return { valid: true };
};

/**
 * Validate date range
 */
export const validateDateRange = (
  startDate: string | null,
  endDate: string | null
): { valid: boolean; error?: string } => {
  // Validate individual dates
  const startValidation = validateDate(startDate);
  if (!startValidation.valid) {
    return { valid: false, error: `Start date: ${startValidation.error}` };
  }

  const endValidation = validateDate(endDate);
  if (!endValidation.valid) {
    return { valid: false, error: `End date: ${endValidation.error}` };
  }

  // If both dates provided, validate range
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return { valid: false, error: 'Start date must be before end date' };
    }

    // Check max range
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > MAX_DATE_RANGE_DAYS) {
      return { valid: false, error: `Date range too large. Maximum ${MAX_DATE_RANGE_DAYS} days allowed.` };
    }
  }

  return { valid: true };
};

/**
 * Validate category selection
 */
export const validateCategory = (category: string, allowedCategories: string[]): { valid: boolean; error?: string } => {
  if (!category) {
    return { valid: true }; // Empty is valid (means "All")
  }

  if (!allowedCategories.includes(category)) {
    return { valid: false, error: 'Invalid category selected' };
  }

  return { valid: true };
};

/**
 * Escape special regex characters in user input
 * Used when user input is used in regex patterns
 */
export const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
