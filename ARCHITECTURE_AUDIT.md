# Architecture Audit & Repository Inspection Report

**Project Title**: AI-Powered Unified Multi-Department Grievance Redressal and Tracking Platform  
**Audit Date**: September 1, 2026  
**Auditor**: Lead Full-Stack & AI Engineer  

---

## 1. Executive Summary & Repository State

An initial audit of the target workspace (`c:\Users\devanshu\Desktop\sih`) was conducted to inspect existing source files, database configurations, AI pipelines, and dashboard implementations.

* **Repository Status**: Workspace initialized as clean empty repository.
* **System Environment**:
  * Node.js: `v22.16.0`
  * NPM: `10.9.2`
  * Python: `3.13.5`
* **Target Architecture**: Production-grade full-stack architecture combining a React + Vite frontend, Express.js REST API backend, SQLite relational database (with full foreign key & indexing constraints), Gemini AI integration layer, and Python-backed FAISS vector duplicate detection engine.

---

## 2. Technical Stack & Architectural Decisions

### Frontend Framework
* **Vite + React (JavaScript)**: Fast SPA rendering, component modularity, interactive UI state management.
* **Design System**: Premium government tech platform aesthetic (deep slate/navy tones, clear contrast, accessible badges, responsive layout, interactive Leaflet GIS maps, zero generic templates).

### Backend Framework & Database
* **Node.js + Express.js**: RESTful API server with modular middleware (JWT authentication, RBAC authorization, Zod schema validation, file uploads).
* **SQLite Database (`better-sqlite3`)**: Lightweight, robust, embedded relational engine supporting foreign keys, indexing, and transactional operations—ensuring immediate, zero-dependency reproducibility for hackathon evaluators.

### AI & Machine Learning Pipeline
* **Conversational Grievance Assistant**: Gemini API integration with structured backend response validation.
* **Classification & Routing Engine**: Automatic extraction of Category, Subcategory, Department, Location, and Urgency with safety fallbacks.
* **Duplicate Detection & Vector Search**: Python FAISS micro-module evaluating semantic sentence embeddings (TF-IDF/Cosine/SentenceTransformers), spatial proximity (Haversine formula), and temporal window matching.
* **AI Admin Insights**: SQL-backed analytics queries feeding the LLM context to prevent hallucinated statistics.
* **Multimodal Vision & Speech**: Gemini Vision analysis for uploaded evidence images; Web Speech API + Whisper/Local fallback for voice inputs in English and Hindi.

---

## 3. SIH Key Features Alignment Matrix

| Feature # | Feature Name | Architecture Implementation Strategy | Status |
| :--- | :--- | :--- | :--- |
| **F1** | AI Grievance Lodging | Conversational AI assistant converting natural text to validated JSON | Planned |
| **F2** | Multi-Department Support | Dynamic database table for departments (Water, PWD, Electricity, etc.) | Planned |
| **F3** | Automatic Routing | Rule engine + AI recommendations mapped to active department officers | Planned |
| **F4** | Priority Detection | AI reasoning + deterministic keyword rules (LOW, MEDIUM, HIGH, CRITICAL) | Planned |
| **F5** | Grievance Tracking | Unique tracking numbers (`GRV-2026-XXXXXX`) and 8-stage status lifecycle | Planned |
| **F6** | SLA Management | Configurable SLA timers with background auto-breach detection | Planned |
| **F7** | Automatic Escalation | 4-tier officer escalation hierarchy triggered on SLA expiration | Planned |
| **F8** | Duplicate Detection | FAISS vector similarity + GIS distance + temporal clustering | Planned |
| **F9** | Incident Clustering | Groups duplicate complaints into unified `INCIDENT-XXXX` master tickets | Planned |
| **F10** | Semantic Search | Natural language query interface over grievance vector indexes | Planned |
| **F11** | AI Admin Assistant | Database-grounded query answering engine for officials | Planned |
| **F12** | Citizen Voice Input | Web Speech API integration supporting Hindi & English audio | Planned |
| **F13** | Multilingual Support | Hindi + English localization & internal normalization | Planned |
| **F14** | Image Complaints | Gemini Vision visual evidence extraction & file attachment storage | Planned |
| **F15** | GIS / Location Map | Interactive Leaflet map displaying heatmaps, status markers & hotspots | Planned |
| **F16** | Admin Dashboard | High-density civic intelligence dashboard with metrics & controls | Planned |
| **F17** | Department Dashboard | Role-Based Access Control (RBAC) views for Officers & Admins | Planned |
| **F18** | Citizen Verification | Resolution feedback loop (Reopen upon negative verification) | Planned |
| **F19** | Full Audit Timeline | Granular timestamped action log for complete transparency | Planned |

---

## 4. Immediate Roadmap

1. **Backend & Database Setup**: Initialize Node.js Express server, SQLite database schema, seeding realistic Indian civic data.
2. **AI & ML Engine**: Integrate Gemini API client with schema validators and Python FAISS duplicate detector.
3. **Frontend Platform**: Build React UI with Citizen Portal, AI Lodging Assistant, SLA Timeline, Officer Portal, GIS Map, and Admin Analytics.
4. **End-to-End Verification**: Test full workflow from complaint submission to AI routing, SLA escalation, duplicate clustering, and citizen resolution sign-off.
