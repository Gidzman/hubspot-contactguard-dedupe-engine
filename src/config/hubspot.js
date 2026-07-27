// 📦 Import Client directly from the package
const { Client } = require('@hubspot/api-client');
require('dotenv').config();

// 🔐 Instantiate the client
const hubspotClient = new Client({
  accessToken: process.env.HUBSPOT_ACCESS_TOKEN,
});

module.exports = hubspotClient;
