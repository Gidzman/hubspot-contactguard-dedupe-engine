/**
 * ContactGuard Core Deduplication & Data Quality Engine (V1)
 */

/**
 * Extracts domain name from an email address.
 * @param {string} email 
 * @returns {string} domain
 */
const extractDomain = (email) => {
  if (!email || !email.includes('@')) return '';
  return email.split('@')[1].toLowerCase().trim();
};

/**
 * Evaluates incoming contact payload against existing CRM records.
 * @param {Object} incomingContact - { email, firstname, lastname, company }
 * @param {Array} existingRecords - Array of contacts returned from HubSpot API
 * @returns {Object} Deduplication Audit Report
 */
const evaluateDuplicateRisk = (incomingContact, existingRecords = []) => {
  const normalizedIncomingEmail = (incomingContact.email || '').trim().toLowerCase();
  const incomingDomain = extractDomain(normalizedIncomingEmail);

  // Default audit output state
  let auditResult = {
    status: 'UNIQUE', // Options: 'UNIQUE', 'DUPLICATE_EXACT', 'DUPLICATE_SUSPECTED'
    confidenceScore: 0, // Percentage
    matchedRecordId: null,
    riskFactors: [],
    recommendedAction: 'ALLOW_CREATION',
  };

  if (!existingRecords || existingRecords.length === 0) {
    return auditResult;
  }

  // 1. Check for Exact Email Match (Primary Identifier)
  const exactMatch = existingRecords.find(
    (record) => (record.properties?.email || '').toLowerCase() === normalizedIncomingEmail
  );

  if (exactMatch) {
    return {
      status: 'DUPLICATE_EXACT',
      confidenceScore: 100,
      matchedRecordId: exactMatch.id,
      riskFactors: ['EXACT_EMAIL_MATCH'],
      recommendedAction: 'BLOCK_CREATION_UPDATE_EXISTING',
    };
  }

  // 2. Check for Domain Match + First Name Match (Suspected Duplicate)
  const incomingFirstName = (incomingContact.firstname || '').trim().toLowerCase();

  const domainMatch = existingRecords.find((record) => {
    const recordEmail = record.properties?.email || '';
    const recordDomain = extractDomain(recordEmail);
    const recordFirstName = (record.properties?.firstname || '').trim().toLowerCase();

    const isSameDomain = recordDomain && recordDomain === incomingDomain;
    const isSameFirstName = recordFirstName && recordFirstName === incomingFirstName;

    return isSameDomain && isSameFirstName;
  });

  if (domainMatch) {
    return {
      status: 'DUPLICATE_SUSPECTED',
      confidenceScore: 75,
      matchedRecordId: domainMatch.id,
      riskFactors: ['DOMAIN_MATCH', 'FIRSTNAME_MATCH'],
      recommendedAction: 'FLAG_FOR_MANUAL_REVIEW',
    };
  }

  return auditResult;
};

module.exports = {
  evaluateDuplicateRisk,
};