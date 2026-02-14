// Italian phone number validation
// Supports formats: +39 XXX XXXXXXX, 3XX XXXXXXX, +39XXXXXXXXXX, etc.

export const isValidItalianPhone = (phone: string): boolean => {
  // Remove all whitespace and common separators
  const cleaned = phone.replace(/[\s\-\.\/\(\)]/g, '');
  
  // Italian mobile: +39 3XX or 3XX (10 digits total without +39)
  // Italian landline: +39 0XX or 0XX (9-10 digits without +39)
  
  // Pattern for Italian numbers
  const patterns = [
    // Mobile with +39 prefix: +393XXXXXXXXX (12-13 chars)
    /^\+39[3][0-9]{8,9}$/,
    // Mobile without prefix: 3XXXXXXXXX (10 chars)
    /^[3][0-9]{8,9}$/,
    // Landline with +39 prefix: +390XXXXXXXXX (11-13 chars)
    /^\+39[0][0-9]{7,10}$/,
    // Landline without prefix: 0XXXXXXXXX (9-11 chars)
    /^[0][0-9]{7,10}$/,
    // With 0039 prefix (alternative international format)
    /^0039[0-9]{9,11}$/,
  ];
  
  return patterns.some(pattern => pattern.test(cleaned));
};

export const formatItalianPhone = (phone: string): string => {
  const cleaned = phone.replace(/[\s\-\.\/\(\)]/g, '');
  
  // If it starts with 3 (mobile without prefix), add +39
  if (/^[3][0-9]{8,9}$/.test(cleaned)) {
    return `+39 ${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  }
  
  // If it starts with +39
  if (cleaned.startsWith('+39')) {
    const number = cleaned.slice(3);
    if (number.startsWith('3')) {
      return `+39 ${number.slice(0, 3)} ${number.slice(3)}`;
    }
    return `+39 ${number}`;
  }
  
  return phone;
};

export const getPhoneValidationError = (phone: string): string | null => {
  if (!phone || phone.trim() === '') {
    return 'Il numero di telefono è obbligatorio';
  }
  
  if (!isValidItalianPhone(phone)) {
    return 'Inserisci un numero di telefono italiano valido (es. +39 333 1234567 o 333 1234567)';
  }
  
  return null;
};