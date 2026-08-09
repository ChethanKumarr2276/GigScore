/**
 * GigScore JSON Contract Validator (Roadmap v1.0 Schema)
 * Validates incoming backend API payloads against locked contract keys.
 */

export function validateGigScoreContract(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Payload must be a valid non-null object.'] };
  }

  // Required field type definitions according to locked v1.0 contract
  const requiredFields = [
    { key: 'gigtrust_id', type: 'string' },
    { key: 'grs', type: 'number' },
    { key: 'grs_band', type: 'string' },
    { key: 'financial_assessment', type: 'string' },
    { key: 'pd', type: 'number' },
    { key: 'p_approve', type: 'number' },
    { key: 'max_amount', type: 'number' },
    { key: 'interest_rate', type: 'number' },
    { key: 'evidence_quality', type: 'string' },
    { key: 'top_5_reasons', type: 'array' },
    { key: 'fraud_flag', type: 'boolean' },
  ];

  requiredFields.forEach(({ key, type }) => {
    if (!(key in data)) {
      errors.push(`Missing required contract key: "${key}"`);
      return;
    }

    const val = data[key];
    if (type === 'array') {
      if (!Array.isArray(val)) {
        errors.push(`Key "${key}" must be an Array, received ${typeof val}`);
      }
    } else if (typeof val !== type) {
      errors.push(`Key "${key}" must be of type ${type}, received ${typeof val}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export default validateGigScoreContract;
