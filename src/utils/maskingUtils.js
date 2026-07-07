import { PII_FIELDS } from './constants';

/**
 * Masks a full SSN string to the format '***-**-XXXX' where XXXX is the last 4 digits.
 * If the input is already masked or invalid, returns it as-is or a default masked value.
 * @param {string} ssn - The SSN string to mask (can be full or partial)
 * @returns {string} The masked SSN string
 */
export function maskSSN(ssn) {
  if (!ssn || typeof ssn !== 'string') {
    return '***-**-****';
  }

  const trimmed = ssn.trim();

  if (trimmed.startsWith('***')) {
    return trimmed;
  }

  const digitsOnly = trimmed.replace(/\D/g, '');

  if (digitsOnly.length >= 4) {
    return '***-**-' + digitsOnly.slice(-4);
  }

  if (digitsOnly.length > 0) {
    return '***-**-' + digitsOnly.padStart(4, '*');
  }

  return '***-**-****';
}

/**
 * Masks a Tax ID to the format '***-**-XXXX' where XXXX is the last 4 digits.
 * Handles both full Tax IDs and already-masked values.
 * @param {string} taxId - The Tax ID string to mask
 * @returns {string} The masked Tax ID string
 */
export function maskTaxId(taxId) {
  if (!taxId || typeof taxId !== 'string') {
    return '***-**-****';
  }

  const trimmed = taxId.trim();

  if (trimmed.startsWith('***')) {
    return trimmed;
  }

  const digitsOnly = trimmed.replace(/\D/g, '');

  if (digitsOnly.length >= 4) {
    return '***-**-' + digitsOnly.slice(-4);
  }

  if (digitsOnly.length > 0) {
    return '***-**-' + digitsOnly.padStart(4, '*');
  }

  return '***-**-****';
}

/**
 * Partially masks an email address, showing only the first character of the local part.
 * For example, 'john.doe@kelly.com' becomes 'j***@kelly.com'.
 * If the email is already masked, returns it as-is.
 * @param {string} email - The email address to mask
 * @returns {string} The masked email address
 */
export function maskEmail(email) {
  if (!email || typeof email !== 'string') {
    return '***@***.***';
  }

  const trimmed = email.trim();

  if (trimmed.includes('***@')) {
    return trimmed;
  }

  const atIndex = trimmed.indexOf('@');

  if (atIndex <= 0) {
    return '***@***.***';
  }

  const localPart = trimmed.substring(0, atIndex);
  const domainPart = trimmed.substring(atIndex + 1);

  if (!domainPart) {
    return '***@***.***';
  }

  return localPart[0] + '***@' + domainPart;
}

/**
 * Checks if a given field name is a sensitive PII field that requires masking.
 * Compares against the PII_FIELDS constant list.
 * @param {string} fieldName - The field name to check
 * @returns {boolean} True if the field is sensitive and requires masking
 */
export function isSensitiveField(fieldName) {
  if (!fieldName || typeof fieldName !== 'string') {
    return false;
  }

  return PII_FIELDS.includes(fieldName);
}

/**
 * Masks the last4SSN value by returning it as-is (it is already a partial value).
 * This is provided for consistency when masking all PII fields uniformly.
 * @param {string} last4 - The last 4 digits of an SSN
 * @returns {string} The last 4 digits unchanged, or '****' if invalid
 */
export function maskLast4SSN(last4) {
  if (!last4 || typeof last4 !== 'string') {
    return '****';
  }

  const trimmed = last4.trim();
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (digitsOnly.length === 4) {
    return digitsOnly;
  }

  return '****';
}

/**
 * Applies the appropriate masking function to a value based on its field name.
 * Automatically detects the field type and applies the correct masking strategy.
 * @param {string} fieldName - The name of the field
 * @param {string} value - The value to mask
 * @returns {string} The masked value, or the original value if the field is not sensitive
 */
export function maskFieldValue(fieldName, value) {
  if (!isSensitiveField(fieldName)) {
    return value;
  }

  if (!value || typeof value !== 'string') {
    return value;
  }

  switch (fieldName) {
    case 'taxId':
      return maskTaxId(value);
    case 'maskedTaxId':
      return maskTaxId(value);
    case 'ssn':
      return maskSSN(value);
    case 'socialSecurityNumber':
      return maskSSN(value);
    case 'last4SSN':
      return maskLast4SSN(value);
    case 'email':
      return maskEmail(value);
    default:
      return value;
  }
}

/**
 * Masks all sensitive PII fields in a plain object.
 * Returns a new object with masked values for any recognized PII fields.
 * Non-sensitive fields are passed through unchanged.
 * @param {Object} data - The data object containing potential PII fields
 * @returns {Object} A new object with PII fields masked
 */
export function maskObjectPII(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return data;
  }

  const masked = {};

  for (const key of Object.keys(data)) {
    if (isSensitiveField(key) && typeof data[key] === 'string') {
      masked[key] = maskFieldValue(key, data[key]);
    } else {
      masked[key] = data[key];
    }
  }

  return masked;
}