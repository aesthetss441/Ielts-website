/**
 * Strict Bangladeshi WhatsApp Phone Number Validator & Normalizer
 *
 * Enforces Method 1:
 * 1. Exclusively accepts valid Bangladeshi mobile operators (013, 014, 015, 016, 017, 018, 019).
 * 2. Blocks non-Bangladeshi numbers (e.g. 9876543211).
 * 3. Rejects fake/dummy sequences (e.g. +8801700000000, 01712345678, repeated digits, low-entropy entries).
 * 4. Normalizes inputs into clean standard E.164 (+8801XXXXXXXXX) and national (01XXXXXXXXX) formats.
 */

export interface BdPhoneValidationResult {
  valid: boolean;
  normalized: string;       // E.164 format: +8801XXXXXXXXX
  display: string;          // Standard national format: 01XXXXXXXXX
  formatted: string;        // Readable format: 01XXX-XXXXXX
  operator?: string;        // e.g. Grameenphone, Banglalink, Robi, Teletalk
  error?: string;
}

const BD_OPERATOR_MAP: Record<string, string> = {
  '013': 'Grameenphone (013)',
  '014': 'Banglalink (014)',
  '015': 'Teletalk (015)',
  '016': 'Robi / Airtel (016)',
  '017': 'Grameenphone (017)',
  '018': 'Robi (018)',
  '019': 'Banglalink (019)',
};

const COMMON_DUMMY_SEQUENCES = new Set([
  '01234567',
  '12345678',
  '23456789',
  '34567890',
  '98765432',
  '87654321',
  '76543210',
  '65432109',
  '11223344',
  '22334455',
  '00112233',
  '12121212',
  '21212121',
  '01010101',
  '10101010',
  '12341234',
  '00001111',
  '11110000',
  '11112222',
  '22221111',
]);

/**
 * Validates and sanitizes a WhatsApp number, restricting it strictly to real Bangladeshi numbers.
 */
export function validateBdWhatsappPhone(raw: string): BdPhoneValidationResult {
  const trimmed = String(raw || '').trim();

  if (!trimmed) {
    return {
      valid: false,
      normalized: '',
      display: '',
      formatted: '',
      error: 'Please enter your WhatsApp number.',
    };
  }

  // Must only contain digits, +, spaces, -, (, )
  if (!/^[+\d\s\-()]+$/.test(trimmed)) {
    return {
      valid: false,
      normalized: '',
      display: '',
      formatted: '',
      error: 'Please enter a valid phone number (digits only).',
    };
  }

  // Extract digits
  let digits = trimmed.replace(/\D/g, '');

  // Strip international prefix '88' if user typed 8801...
  if (digits.startsWith('8801')) {
    digits = digits.slice(2); // leaves '01...'
  } else if (digits.startsWith('88') && digits.length >= 12) {
    digits = digits.slice(2);
  }

  // If user typed 1XXXXXXXXX (10 digits, omitted leading 0)
  if (digits.length === 10 && /^[3-9]/.test(digits)) {
    digits = '0' + digits;
  } else if (digits.length === 10 && digits.startsWith('1')) {
    digits = '0' + digits;
  }

  // Check if it starts with '01'
  if (!digits.startsWith('01')) {
    return {
      valid: false,
      normalized: '',
      display: '',
      formatted: '',
      error:
        'Only Bangladeshi WhatsApp numbers are accepted. Please enter an 11-digit number starting with 013–019 (e.g. 017XXXXXXXX).',
    };
  }

  // Must be exactly 11 digits in national format (01XXXXXXXXX)
  if (digits.length !== 11) {
    return {
      valid: false,
      normalized: '',
      display: '',
      formatted: '',
      error: `Bangladeshi phone numbers must be exactly 11 digits. You entered ${digits.length} digits.`,
    };
  }

  // Check operator prefix (013 - 019)
  const operatorPrefix = digits.slice(0, 3);
  const operatorName = BD_OPERATOR_MAP[operatorPrefix];

  if (!operatorName) {
    return {
      valid: false,
      normalized: '',
      display: '',
      formatted: '',
      error: `Invalid operator prefix "${operatorPrefix}". Valid Bangladeshi operators are 013, 014, 015, 016, 017, 018, or 019.`,
    };
  }

  // Extract subscriber part (the 8 digits following 01X)
  const subscriber = digits.slice(3);

  // 1. All identical digits in subscriber part (e.g. 01700000000, 01811111111)
  if (/^(\d)\1{7}$/.test(subscriber)) {
    return {
      valid: false,
      normalized: '',
      display: '',
      formatted: '',
      error: 'Dummy or repeated number detected. Please enter your real active WhatsApp number.',
    };
  }

  // 2. Six or more consecutive identical digits (e.g. 01700000012, 01812999999)
  if (/(\d)\1{5,}/.test(subscriber)) {
    return {
      valid: false,
      normalized: '',
      display: '',
      formatted: '',
      error: 'Invalid number (too many repeated digits). Please enter your real WhatsApp number.',
    };
  }

  // 3. Known sequential dummy runs
  if (COMMON_DUMMY_SEQUENCES.has(subscriber)) {
    return {
      valid: false,
      normalized: '',
      display: '',
      formatted: '',
      error: 'Dummy sequential number detected (e.g. 12345678). Please enter your real WhatsApp number.',
    };
  }

  // 4. Low entropy / diversity check: subscriber portion must have at least 3 distinct unique digits
  const uniqueSubscriberDigits = new Set(subscriber.split('')).size;
  if (uniqueSubscriberDigits < 3) {
    return {
      valid: false,
      normalized: '',
      display: '',
      formatted: '',
      error: 'Please enter a genuine, active WhatsApp number (dummy numbers are rejected).',
    };
  }

  // 5. Total number entropy check: entire 11-digit number must have at least 4 unique digits
  const uniqueTotalDigits = new Set(digits.split('')).size;
  if (uniqueTotalDigits < 4) {
    return {
      valid: false,
      normalized: '',
      display: '',
      formatted: '',
      error: 'Please enter a valid active WhatsApp number.',
    };
  }

  const normalized = `+88${digits}`;
  const formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;

  return {
    valid: true,
    normalized,
    display: digits,
    formatted,
    operator: operatorName,
  };
}

/**
 * Backward compatibility alias for existing code
 */
export const validateWhatsappPhone = validateBdWhatsappPhone;
