const hubspotClient = require('../config/hubspot');

/**
 * Searches contacts in HubSpot by exact email OR domain contains.
 */
const searchContactsForDedupe = async (email) => {
  try {
    const domain = email.includes('@') ? email.split('@')[1] : '';

    const filterGroups = [
      {
        filters: [
          {
            propertyName: 'email',
            operator: 'EQ',
            value: email,
          },
        ],
      },
    ];

    if (domain) {
      filterGroups.push({
        filters: [
          {
            propertyName: 'email',
            operator: 'CONTAINS_TOKEN',
            value: domain,
          },
        ],
      });
    }

    const PublicObjectSearchRequest = {
      filterGroups,
      properties: [
        'firstname',
        'lastname',
        'email',
        'phone',
        'company',
        'zip',
        'lifecyclestage',
        'createdate',
      ],
      limit: 20,
    };

    const response = await hubspotClient.crm.contacts.searchApi.doSearch(
      PublicObjectSearchRequest
    );

    return response.results || [];
  } catch (error) {
    console.error('❌ Error executing HubSpot Search:', error.message);
    throw error;
  }
};

/**
 * Updates an existing contact record in HubSpot.
 */
const updateContact = async (contactId, properties) => {
  try {
    const response = await hubspotClient.crm.contacts.basicApi.update(contactId, {
      properties,
    });
    return response;
  } catch (error) {
    console.error('❌ Error updating HubSpot Contact:', error.message);
    throw error;
  }
};

/**
 * Merges a secondary contact into a primary contact in HubSpot.
 */
const mergeContacts = async (primaryObjectId, secondaryObjectId) => {
  try {
    const PublicMergeInput = {
      primaryObjectId,
      objectIdToMerge: secondaryObjectId,
    };

    const response = await hubspotClient.crm.contacts.coreApi.merge(PublicMergeInput);
    return response;
  } catch (error) {
    console.error('❌ Error executing HubSpot Contact Merge:', error.message);
    throw error;
  }
};

module.exports = {
  searchContactsForDedupe,
  updateContact,
  mergeContacts,
};