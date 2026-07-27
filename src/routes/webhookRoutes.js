const express = require('express');
const router = express.Router();
const { searchContactsForDedupe, updateContact } = require('../services/hubspotService');
const { evaluateDuplicateRisk } = require('../services/dedupeEngine');

/**
 * @route   POST /api/webhooks/lead-ingest
 * @desc    Ingests real-time webhooks from external forms, audits for duplicates, and auto-resolves
 * @access  Public
 */
router.post('/lead-ingest', async (req, res) => {
  try {
    // Standardize incoming webhook payload structure
    const payload = req.body.data || req.body;
    const email = payload.email || payload.email_address || '';

    if (!email || email.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Webhook payload rejected: missing required "email" property.',
      });
    }

    const incomingContact = {
      email: email.trim().toLowerCase(),
      firstname: (payload.firstname || payload.first_name || '').trim(),
      lastname: (payload.lastname || payload.last_name || '').trim(),
      company: (payload.company || payload.company_name || '').trim(),
      zip: payload.zip || payload.postal_code || payload['Postal code'] || '',
    };

    // 1. Check duplicate risk against HubSpot
    const existingRecords = await searchContactsForDedupe(incomingContact.email);
    const auditReport = evaluateDuplicateRisk(incomingContact, existingRecords);

    // 2. Automated Action Logic
    if (auditReport.status === 'DUPLICATE_EXACT') {
      const updatePayload = {};
      if (incomingContact.firstname) updatePayload.firstname = incomingContact.firstname;
      if (incomingContact.lastname) updatePayload.lastname = incomingContact.lastname;
      if (incomingContact.company) updatePayload.company = incomingContact.company;
      if (incomingContact.zip) updatePayload.zip = incomingContact.zip;

      await updateContact(auditReport.matchedRecordId, updatePayload);

      return res.status(200).json({
        success: true,
        event: 'WEBHOOK_PROCESSED',
        resolution: 'EXACT_DUPLICATE_ENRICHED',
        targetRecordId: auditReport.matchedRecordId,
        incoming: incomingContact,
      });
    }

    if (auditReport.status === 'DUPLICATE_SUSPECTED') {
      return res.status(200).json({
        success: true,
        event: 'WEBHOOK_PROCESSED',
        resolution: 'QUEUED_FOR_MANUAL_REVIEW',
        targetRecordId: auditReport.matchedRecordId,
        incoming: incomingContact,
      });
    }

    return res.status(200).json({
      success: true,
      event: 'WEBHOOK_PROCESSED',
      resolution: 'READY_FOR_NEW_CREATION',
      targetRecordId: null,
      incoming: incomingContact,
    });
  } catch (error) {
    console.error('❌ Webhook ingestion error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to process incoming webhook event.',
      error: error.message,
    });
  }
});

module.exports = router;