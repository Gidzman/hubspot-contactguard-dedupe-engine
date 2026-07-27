# 🛡️ ContactGuard: Real-Time HubSpot Contact Deduplication & Sync Middleware

> **An automated Node.js middleware engine built to eliminate CRM duplicate record rot, standardize third-party form webhooks, and perform risk-evaluated data enrichment in HubSpot.**

---

## 🎯 Overview

Duplicate contacts cost B2B organizations thousands in wasted marketing spend, broken attribution, and inaccurate pipeline reporting. Standard CRM rules often fail when handling third-party form submissions, webhook variations, or cross-domain leads.

**ContactGuard** sits between lead capture channels (Typeform, Webflow, custom landing pages, webhooks) and the **HubSpot CRM API**. It intercepts incoming leads in real time, executes a multi-factor confidence scoring algorithm, and determines whether to **enrich existing records** or **flag low-confidence duplicates for RevOps audit**.

---

## ⚙️ Architectural Core Features

* **Multi-Criteria Risk Scoring Engine:** Evaluates exact email matches, domain-level fuzzy matches, name similarity, and company parameters to assign a $0-100\%$ confidence score.
* **Automated Lead Ingestion Endpoint:** Standardizes non-uniform JSON payloads from third-party form builders (`first_name`, `email_address`, `company_name`) into normalized CRM properties.
* **Property Enrichment without Duplication:** Updates empty or existing fields (such as `zip` / `Postal code`) directly on matched CRM records without creating duplicate contact rows.
* **Audit vs. Resolve Pipeline:** Includes dedicated `/audit` endpoints for dry-run inspection and `/resolve` endpoints for active execution.

---

## 🛠️ Tech Stack

* **Language/Runtime:** Node.js, Express.js
* **API Integration:** Official `@hubspot/api-client`
* **HTTP & Middleware:** Axios, CORS, Dotenv
* **Environment:** Postman, Git/GitHub, Nodemon

---

## 📡 API Reference & Endpoints

### 1. Execute Live Audit (Dry Run)
`POST /api/contacts/audit`
> Returns risk factor analysis and confidence scoring without altering CRM state.

### 2. Auto-Resolve & Direct Sync
`POST /api/contacts/resolve`
> Audits incoming lead payload. Updates primary record if exact match exists; queues lead if suspected.

### 3. Real-Time Webhook Lead Ingest
`POST /api/webhooks/lead-ingest`
> Handles third-party webhooks, normalizes parameter structures, and executes real-time deduplication.

---

## 📁 Repository Structure

```text
contactguard/
├── src/
│   ├── config/
│   │   └── hubspot.js       # HubSpot Client Authentication Initialization
│   ├── services/
│   │   ├── hubspotService.js# API Search, Update, and Merge Methods
│   │   └── dedupeEngine.js  # Risk Scoring & Match Logic
│   ├── routes/
│   │   ├── contactRoutes.js # Core Contact Sync & Audit Endpoints
│   │   └── webhookRoutes.js # Real-Time Webhook Ingestion Engine
│   └── app.js               # Express Application Master Entry Point
├── .env.example             # Environment Variable Template
├── package.json
└── README.md

👨‍💻 Author
Gideon Okoh — HubSpot & Marketing Automation Specialist / RevOps Systems Architect
LinkedIn Profile - https://www.linkedin.com/in/gideonokoh-hubspot/