const express = require('express');
const router = express.Router();
const { searchContactsForDedupe, updateContact } = require('../services/hubspotService');
const { evaluateDuplicateRisk } = require('../services/dedupeEngine');

/**
 * @route   GET /api/contacts/search
 */
router.get('/search', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email || email.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Email search query parameter is required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const contacts = await searchContactsForDedupe(normalizedEmail);

    return res.status(200).json({
      success: true,
      query: normalizedEmail,
      count: contacts.length,
      data: contacts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while communicating with HubSpot.',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/contacts/audit
 */
router.post('/audit', async (req, res) => {
  try {
    const { email, firstname, lastname, company } = req.body;

    if (!email || email.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Payload error: "email" field is required for audit.',
      });
    }

    const incomingContact = {
      email: email.trim().toLowerCase(),
      firstname: firstname ? firstname.trim() : '',
      lastname: lastname ? lastname.trim() : '',
      company: company ? company.trim() : '',
    };

    const existingRecords = await searchContactsForDedupe(incomingContact.email);
    const auditReport = evaluateDuplicateRisk(incomingContact, existingRecords);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      incoming: incomingContact,
      audit: auditReport,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error executing duplicate audit.',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/contacts/resolve
 * @desc    Audits incoming lead data and automatically updates existing duplicate record
 */
router.post('/resolve', async (req, res) => {
  try {
    const { email, firstname, lastname, company, zip, postal_code } = req.body;

    if (!email || email.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Payload error: "email" field is required for resolution.',
      });
    }

    const incomingContact = {
      email: email.trim().toLowerCase(),
      firstname: firstname ? firstname.trim() : '',
      lastname: lastname ? lastname.trim() : '',
      company: company ? company.trim() : '',
      zip: zip || postal_code || req.body['Postal code'] || '',
    };

    // 1. Audit duplicate risk against CRM
    const existingRecords = await searchContactsForDedupe(incomingContact.email);
    const auditReport = evaluateDuplicateRisk(incomingContact, existingRecords);

    // 2. If EXACT MATCH, update the primary record with non-empty incoming fields
    if (auditReport.status === 'DUPLICATE_EXACT') {
      const updatePayload = {};
      if (incomingContact.firstname) updatePayload.firstname = incomingContact.firstname;
      if (incomingContact.lastname) updatePayload.lastname = incomingContact.lastname;
      if (incomingContact.company) updatePayload.company = incomingContact.company;
      if (incomingContact.zip) updatePayload.zip = incomingContact.zip;

      const updatedRecord = await updateContact(auditReport.matchedRecordId, updatePayload);

      return res.status(200).json({
        success: true,
        actionTaken: 'EXACT_DUPLICATE_BLOCKED_AND_UPDATED',
        message: `Exact match found on HubSpot Record ID ${auditReport.matchedRecordId}. Record enriched with incoming details without creating a duplicate.`,
        incoming: incomingContact,
        updatedFields: updatePayload,
        audit: auditReport,
      });
    }

    if (auditReport.status === 'DUPLICATE_SUSPECTED') {
      return res.status(200).json({
        success: true,
        actionTaken: 'FLAGGED_FOR_REVIEW',
        message: `Suspected duplicate detected. Lead queued for RevOps manual audit.`,
        incoming: incomingContact,
        audit: auditReport,
      });
    }

    return res.status(200).json({
      success: true,
      actionTaken: 'NEW_RECORD_CREATED',
      message: 'No duplicates found. Safe for CRM insertion.',
      incoming: incomingContact,
      audit: auditReport,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error executing auto-resolution engine.',
      error: error.message,
    });
  }
});

module.exports = router;