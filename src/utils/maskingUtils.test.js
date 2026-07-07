import { describe, it, expect } from 'vitest';
import {
  maskSSN,
  maskTaxId,
  maskEmail,
  maskLast4SSN,
  isSensitiveField,
  maskFieldValue,
  maskObjectPII,
} from './maskingUtils';

describe('maskSSN', () => {
  it('masks a full SSN to ***-**-XXXX format', () => {
    expect(maskSSN('123-45-6789')).toBe('***-**-6789');
  });

  it('masks a full SSN without dashes', () => {
    expect(maskSSN('123456789')).toBe('***-**-6789');
  });

  it('returns the value as-is if already masked', () => {
    expect(maskSSN('***-**-6789')).toBe('***-**-6789');
  });

  it('returns default masked value for null input', () => {
    expect(maskSSN(null)).toBe('***-**-****');
  });

  it('returns default masked value for undefined input', () => {
    expect(maskSSN(undefined)).toBe('***-**-****');
  });

  it('returns default masked value for empty string', () => {
    expect(maskSSN('')).toBe('***-**-****');
  });

  it('returns default masked value for non-string input', () => {
    expect(maskSSN(123456789)).toBe('***-**-****');
  });

  it('handles SSN with spaces', () => {
    expect(maskSSN(' 123-45-6789 ')).toBe('***-**-6789');
  });

  it('handles partial SSN with fewer than 4 digits', () => {
    const result = maskSSN('12');
    expect(result).toBe('***-**-**12');
  });

  it('masks SSN with only 4 digits', () => {
    expect(maskSSN('6789')).toBe('***-**-6789');
  });
});

describe('maskTaxId', () => {
  it('masks a full Tax ID to ***-**-XXXX format', () => {
    expect(maskTaxId('123-45-6789')).toBe('***-**-6789');
  });

  it('masks a Tax ID without dashes', () => {
    expect(maskTaxId('987654321')).toBe('***-**-4321');
  });

  it('returns the value as-is if already masked', () => {
    expect(maskTaxId('***-**-1234')).toBe('***-**-1234');
  });

  it('returns default masked value for null input', () => {
    expect(maskTaxId(null)).toBe('***-**-****');
  });

  it('returns default masked value for undefined input', () => {
    expect(maskTaxId(undefined)).toBe('***-**-****');
  });

  it('returns default masked value for empty string', () => {
    expect(maskTaxId('')).toBe('***-**-****');
  });

  it('returns default masked value for non-string input', () => {
    expect(maskTaxId(123)).toBe('***-**-****');
  });

  it('handles Tax ID with spaces', () => {
    expect(maskTaxId(' 111-22-3333 ')).toBe('***-**-3333');
  });

  it('handles partial Tax ID with fewer than 4 digits', () => {
    const result = maskTaxId('99');
    expect(result).toBe('***-**-**99');
  });

  it('masks Tax ID with only 4 digits', () => {
    expect(maskTaxId('5678')).toBe('***-**-5678');
  });
});

describe('maskEmail', () => {
  it('masks an email showing only first character of local part', () => {
    expect(maskEmail('john.doe@kelly.com')).toBe('j***@kelly.com');
  });

  it('masks a short local part email', () => {
    expect(maskEmail('a@kelly.com')).toBe('a***@kelly.com');
  });

  it('returns the value as-is if already masked', () => {
    expect(maskEmail('j***@kelly.com')).toBe('j***@kelly.com');
  });

  it('returns default masked value for null input', () => {
    expect(maskEmail(null)).toBe('***@***.***');
  });

  it('returns default masked value for undefined input', () => {
    expect(maskEmail(undefined)).toBe('***@***.***');
  });

  it('returns default masked value for empty string', () => {
    expect(maskEmail('')).toBe('***@***.***');
  });

  it('returns default masked value for non-string input', () => {
    expect(maskEmail(12345)).toBe('***@***.***');
  });

  it('returns default masked value for email without @ symbol', () => {
    expect(maskEmail('nodomain')).toBe('***@***.***');
  });

  it('returns default masked value for email starting with @', () => {
    expect(maskEmail('@kelly.com')).toBe('***@***.***');
  });

  it('handles email with spaces by trimming', () => {
    expect(maskEmail(' test@example.com ')).toBe('t***@example.com');
  });

  it('preserves the full domain part', () => {
    const result = maskEmail('user@subdomain.example.com');
    expect(result).toBe('u***@subdomain.example.com');
  });
});

describe('maskLast4SSN', () => {
  it('returns the 4 digits unchanged for valid input', () => {
    expect(maskLast4SSN('6789')).toBe('6789');
  });

  it('returns **** for null input', () => {
    expect(maskLast4SSN(null)).toBe('****');
  });

  it('returns **** for undefined input', () => {
    expect(maskLast4SSN(undefined)).toBe('****');
  });

  it('returns **** for empty string', () => {
    expect(maskLast4SSN('')).toBe('****');
  });

  it('returns **** for non-string input', () => {
    expect(maskLast4SSN(1234)).toBe('****');
  });

  it('returns **** for string with fewer than 4 digits', () => {
    expect(maskLast4SSN('12')).toBe('****');
  });

  it('returns **** for string with more than 4 digits', () => {
    expect(maskLast4SSN('12345')).toBe('****');
  });

  it('returns **** for string with non-digit characters', () => {
    expect(maskLast4SSN('abcd')).toBe('****');
  });

  it('handles string with spaces around 4 digits', () => {
    expect(maskLast4SSN(' 1234 ')).toBe('1234');
  });
});

describe('isSensitiveField', () => {
  it('returns true for taxId', () => {
    expect(isSensitiveField('taxId')).toBe(true);
  });

  it('returns true for maskedTaxId', () => {
    expect(isSensitiveField('maskedTaxId')).toBe(true);
  });

  it('returns true for last4SSN', () => {
    expect(isSensitiveField('last4SSN')).toBe(true);
  });

  it('returns true for ssn', () => {
    expect(isSensitiveField('ssn')).toBe(true);
  });

  it('returns true for socialSecurityNumber', () => {
    expect(isSensitiveField('socialSecurityNumber')).toBe(true);
  });

  it('returns true for email', () => {
    expect(isSensitiveField('email')).toBe(true);
  });

  it('returns false for name', () => {
    expect(isSensitiveField('name')).toBe(false);
  });

  it('returns false for department', () => {
    expect(isSensitiveField('department')).toBe(false);
  });

  it('returns false for employeeId', () => {
    expect(isSensitiveField('employeeId')).toBe(false);
  });

  it('returns false for kellyId', () => {
    expect(isSensitiveField('kellyId')).toBe(false);
  });

  it('returns false for null input', () => {
    expect(isSensitiveField(null)).toBe(false);
  });

  it('returns false for undefined input', () => {
    expect(isSensitiveField(undefined)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isSensitiveField('')).toBe(false);
  });

  it('returns false for non-string input', () => {
    expect(isSensitiveField(123)).toBe(false);
  });
});

describe('maskFieldValue', () => {
  it('masks taxId field correctly', () => {
    expect(maskFieldValue('taxId', '123-45-6789')).toBe('***-**-6789');
  });

  it('masks maskedTaxId field correctly', () => {
    expect(maskFieldValue('maskedTaxId', '***-**-1234')).toBe('***-**-1234');
  });

  it('masks ssn field correctly', () => {
    expect(maskFieldValue('ssn', '111-22-3333')).toBe('***-**-3333');
  });

  it('masks socialSecurityNumber field correctly', () => {
    expect(maskFieldValue('socialSecurityNumber', '444-55-6666')).toBe('***-**-6666');
  });

  it('masks last4SSN field correctly', () => {
    expect(maskFieldValue('last4SSN', '7890')).toBe('7890');
  });

  it('masks email field correctly', () => {
    expect(maskFieldValue('email', 'john@kelly.com')).toBe('j***@kelly.com');
  });

  it('returns value unchanged for non-sensitive field', () => {
    expect(maskFieldValue('name', 'John Smith')).toBe('John Smith');
  });

  it('returns value unchanged for non-sensitive field like department', () => {
    expect(maskFieldValue('department', 'Engineering')).toBe('Engineering');
  });

  it('returns null/undefined value as-is for sensitive field', () => {
    expect(maskFieldValue('email', null)).toBe(null);
    expect(maskFieldValue('email', undefined)).toBe(undefined);
  });

  it('returns non-string value as-is for sensitive field', () => {
    expect(maskFieldValue('taxId', 12345)).toBe(12345);
  });
});

describe('maskObjectPII', () => {
  it('masks all sensitive fields in an employee object', () => {
    const employee = {
      employeeId: 'EMP001',
      name: 'John Smith',
      maskedTaxId: '***-**-6789',
      last4SSN: '6789',
      email: 'john@kelly.com',
      department: 'Engineering',
      location: 'Troy, MI',
      status: 'Active',
    };

    const masked = maskObjectPII(employee);

    expect(masked.employeeId).toBe('EMP001');
    expect(masked.name).toBe('John Smith');
    expect(masked.maskedTaxId).toBe('***-**-6789');
    expect(masked.last4SSN).toBe('6789');
    expect(masked.email).toBe('j***@kelly.com');
    expect(masked.department).toBe('Engineering');
    expect(masked.location).toBe('Troy, MI');
    expect(masked.status).toBe('Active');
  });

  it('returns null for null input', () => {
    expect(maskObjectPII(null)).toBe(null);
  });

  it('returns undefined for undefined input', () => {
    expect(maskObjectPII(undefined)).toBe(undefined);
  });

  it('returns array as-is (does not process arrays)', () => {
    const arr = [1, 2, 3];
    expect(maskObjectPII(arr)).toBe(arr);
  });

  it('returns non-object input as-is', () => {
    expect(maskObjectPII('string')).toBe('string');
    expect(maskObjectPII(42)).toBe(42);
  });

  it('does not modify the original object', () => {
    const original = {
      email: 'test@kelly.com',
      name: 'Test User',
    };

    const masked = maskObjectPII(original);

    expect(original.email).toBe('test@kelly.com');
    expect(masked.email).toBe('t***@kelly.com');
    expect(masked.name).toBe('Test User');
  });

  it('handles object with no sensitive fields', () => {
    const data = {
      name: 'John',
      department: 'Finance',
      location: 'Detroit, MI',
    };

    const masked = maskObjectPII(data);

    expect(masked.name).toBe('John');
    expect(masked.department).toBe('Finance');
    expect(masked.location).toBe('Detroit, MI');
  });

  it('handles object with only sensitive fields', () => {
    const data = {
      email: 'user@example.com',
      maskedTaxId: '***-**-9999',
      last4SSN: '9999',
    };

    const masked = maskObjectPII(data);

    expect(masked.email).toBe('u***@example.com');
    expect(masked.maskedTaxId).toBe('***-**-9999');
    expect(masked.last4SSN).toBe('9999');
  });

  it('preserves non-string values in sensitive fields without masking', () => {
    const data = {
      email: null,
      maskedTaxId: undefined,
      name: 'Test',
    };

    const masked = maskObjectPII(data);

    expect(masked.email).toBe(null);
    expect(masked.maskedTaxId).toBe(undefined);
    expect(masked.name).toBe('Test');
  });

  it('handles empty object', () => {
    const masked = maskObjectPII({});
    expect(masked).toEqual({});
  });
});