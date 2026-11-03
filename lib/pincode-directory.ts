/**
 * PIN Code Geographic Lookup & Validation Directory
 *
 * Provides deterministic mapping of postal index numbers (PIN codes)
 * to State and District, focusing on Kerala and Grama Panchayat jurisdictions
 * while supporting Indian postal validation.
 */

export interface PinCodeResult {
  pin: string;
  state: string;
  district: string;
  area?: string;
  isValid: boolean;
  error?: string;
}

// Local PIN mapping for Kerala Grama Panchayats and surrounding districts
const LOCAL_PIN_MAP: Record<string, { state: string; district: string; area: string }> = {
  // Kozhikode District (Thekkumpuram / Cheruvannur region)
  '673014': { state: 'Kerala', district: 'Kozhikode', area: 'Cheruvannur / Feroke' },
  '673001': { state: 'Kerala', district: 'Kozhikode', area: 'Kozhikode City HPO' },
  '673002': { state: 'Kerala', district: 'Kozhikode', area: 'Chalappuram' },
  '673003': { state: 'Kerala', district: 'Kozhikode', area: 'Kallai' },
  '673004': { state: 'Kerala', district: 'Kozhikode', area: 'Calicut Civil Station' },
  '673008': { state: 'Kerala', district: 'Kozhikode', area: 'Meenchanda' },
  '673019': { state: 'Kerala', district: 'Kozhikode', area: 'Pantheeramkavu' },
  '673027': { state: 'Kerala', district: 'Kozhikode', area: 'Beypore' },
  '673028': { state: 'Kerala', district: 'Kozhikode', area: 'Nallalam' },
  '673571': { state: 'Kerala', district: 'Kozhikode', area: 'Kunnamangalam (Constituency)' },
  '673572': { state: 'Kerala', district: 'Kozhikode', area: 'Koduvally' },
  '673573': { state: 'Kerala', district: 'Kozhikode', area: 'Thamarassery' },
  '673574': { state: 'Kerala', district: 'Kozhikode', area: 'Mavoor' },

  // Surrounding Kerala District Sample Centres
  '676505': { state: 'Kerala', district: 'Malappuram', area: 'Manjeri' },
  '676517': { state: 'Kerala', district: 'Malappuram', area: 'Kondotty' },
  '670001': { state: 'Kerala', district: 'Kannur', area: 'Kannur HPO' },
  '673121': { state: 'Kerala', district: 'Wayanad', area: 'Kalpetta' },
  '678001': { state: 'Kerala', district: 'Palakkad', area: 'Palakkad HPO' },
  '680001': { state: 'Kerala', district: 'Thrissur', area: 'Thrissur HPO' },
  '682001': { state: 'Kerala', district: 'Ernakulam', area: 'Kochi HPO' },
  '686001': { state: 'Kerala', district: 'Kottayam', area: 'Kottayam HPO' },
  '695001': { state: 'Kerala', district: 'Thiruvananthapuram', area: 'Thiruvananthapuram GPO' },
};

// Kerala District 3-digit prefix mapping per India Post standard
const KERALA_PREFIX_MAP: Record<string, string> = {
  '670': 'Kannur',
  '671': 'Kasaragod',
  '673': 'Kozhikode',
  '676': 'Malappuram',
  '678': 'Palakkad',
  '679': 'Malappuram / Palakkad',
  '680': 'Thrissur',
  '682': 'Ernakulam',
  '683': 'Ernakulam',
  '685': 'Idukki',
  '686': 'Kottayam',
  '688': 'Alappuzha',
  '689': 'Pathanamthitta',
  '690': 'Alappuzha / Kollam',
  '691': 'Kollam',
  '695': 'Thiruvananthapuram',
};

// National 2-digit Postal Circle prefix mapping
const CIRCLE_MAP: Record<string, string> = {
  '11': 'Delhi',
  '12': 'Haryana',
  '13': 'Haryana',
  '14': 'Punjab',
  '16': 'Chandigarh',
  '17': 'Himachal Pradesh',
  '18': 'Jammu & Kashmir',
  '20': 'Uttar Pradesh',
  '30': 'Rajasthan',
  '36': 'Gujarat',
  '38': 'Gujarat',
  '40': 'Maharashtra',
  '41': 'Maharashtra',
  '50': 'Telangana',
  '51': 'Andhra Pradesh',
  '56': 'Karnataka',
  '57': 'Karnataka',
  '60': 'Tamil Nadu',
  '62': 'Tamil Nadu',
  '64': 'Tamil Nadu',
  '67': 'Kerala',
  '68': 'Kerala',
  '69': 'Kerala',
  '70': 'West Bengal',
  '80': 'Bihar',
};

/**
 * Validates PIN code format and performs geographic resolution
 */
export function lookupPinCode(pin: string): PinCodeResult {
  const cleaned = pin.trim();

  // Validate standard 6-digit Indian PIN format
  if (!/^\d{6}$/.test(cleaned)) {
    return {
      pin: cleaned,
      state: '',
      district: '',
      isValid: false,
      error: 'PIN code must be exactly 6 digits without letters or symbols.',
    };
  }

  if (cleaned.startsWith('0')) {
    return {
      pin: cleaned,
      state: '',
      district: '',
      isValid: false,
      error: 'Invalid PIN code: Indian PIN codes cannot start with 0.',
    };
  }

  // Exact match
  if (LOCAL_PIN_MAP[cleaned]) {
    const entry = LOCAL_PIN_MAP[cleaned];
    return {
      pin: cleaned,
      state: entry.state,
      district: entry.district,
      area: entry.area,
      isValid: true,
    };
  }

  // Kerala prefix matching (67x, 68x, 69x)
  const prefix3 = cleaned.substring(0, 3);
  if (KERALA_PREFIX_MAP[prefix3]) {
    return {
      pin: cleaned,
      state: 'Kerala',
      district: KERALA_PREFIX_MAP[prefix3],
      isValid: true,
    };
  }

  // Other postal circles
  const prefix2 = cleaned.substring(0, 2);
  if (CIRCLE_MAP[prefix2]) {
    return {
      pin: cleaned,
      state: CIRCLE_MAP[prefix2],
      district: 'Other District',
      isValid: true,
    };
  }

  return {
    pin: cleaned,
    state: 'Other State',
    district: 'Other District',
    isValid: true,
  };
}
