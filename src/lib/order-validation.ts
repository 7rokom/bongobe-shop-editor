// Shared phone/name validation for checkout, admin, and reseller order forms

/**
 * Normalize phone: strip country code (+88, 88), dashes, spaces
 * Returns digits-only string
 */
export const normalizePhone = (phone: string): string => {
  // Remove spaces
  let cleaned = phone.trim().replace(/\s/g, '');
  // Remove dashes
  cleaned = cleaned.replace(/-/g, '');
  // Remove country code prefixes
  if (cleaned.startsWith('+88')) cleaned = cleaned.slice(3);
  else if (cleaned.startsWith('88') && cleaned.length > 11) cleaned = cleaned.slice(2);
  return cleaned;
};

/**
 * Validate phone number input.
 * Allows: digits, +, -, spaces (for country code and formatting)
 * Returns null if valid, or error message string if invalid
 */
export const validatePhone = (phone: string): string | null => {
  if (!phone.trim()) return null; // empty is handled by required check

  // Check if contains anything other than digits, +, -, spaces
  const allowedPattern = /^[\d\s+\-]+$/;
  if (!allowedPattern.test(phone.trim())) {
    return 'স্যার/ম্যাম আপনি ফোন নাম্বার ঘরে ১১ ডিজিটের ফোন নাম্বার ছাড়া অন্যকিছু লিখতে পারবেন না। দয়া করে আপনার ১১ ডিজিটের সচল ফোন নাম্বারটি লিখুন। ধন্যবাদ!';
  }

  // Normalize and check digit count
  const normalized = normalizePhone(phone);
  if (normalized.length > 11) {
    return 'স্যার/ম্যাম আপনি ফোন নাম্বারটি ১১ ডিজিটের বেশি হয়েছে। দয়া করে শুধু মাত্র ১১ ডিজিটের নাম্বারটি লিখুন। ধন্যবাদ!';
  }

  return null;
};

/**
 * Validate name - no numbers allowed
 * Returns null if valid, or error message string
 */
export const validateName = (name: string): string | null => {
  if (!name.trim()) return null;
  if (/\d/.test(name)) {
    return 'নামের ঘরে সংখ্যা লেখা যাবে না। দয়া করে সঠিক নাম লিখুন।';
  }
  return null;
};
