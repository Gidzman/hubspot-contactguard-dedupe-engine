const express = require('express');
const cors = require('cors');
require('dotenv').config();

const contactRoutes = require('./routes/contactRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Base Route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'ContactGuard API - Real-Time HubSpot Deduplication Middleware',
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/contacts', contactRoutes);
app.use('/api/webhooks', webhookRoutes);

// Server Init
app.listen(PORT, () => {
  console.log(`🟢 ContactGuard Server running on http://localhost:${PORT}`);
});