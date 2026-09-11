# System Architecture Documentation

## JanSeva AI — Unified Multi-Department Grievance Redressal Platform

---

## 1. High-Level Architecture Overview

```
[ Citizen (Web / Mobile) ]       [ Officer (Department Portal) ]       [ Executive Super Admin ]
          │                                   │                                    │
          ▼                                   ▼                                    ▼
─────────────────────────────────────────────────────────────────────────────────────────────────
                               REST API Gateway (Node.js + Express.js)
─────────────────────────────────────────────────────────────────────────────────────────────────
     │                      │                          │                         │
     ▼                      ▼                          ▼                         ▼
[ Gemini AI Client ]   [ Routing Engine ]    [ SLA & Escalation Worker ]   [ FAISS Vector Engine ]
(NLP & Schema Validation) (Workload Allocator)    (30s Background Cron)       (Duplicate Clustering)
     │                      │                          │                         │
     └──────────────────────┴─────────────┬────────────┴─────────────────────────┘
                                          ▼
                         SQLite Database (`better-sqlite3`)
                   (Relational Schema, Indexes, Foreign Keys)
```

---

## 2. Component Design

### 2.1 Backend Gateway (Node.js + Express.js)
- RESTful micro-architecture with modular middleware (`auth.js`, `errorHandler.js`).
- Role-Based Access Control (RBAC): `CITIZEN`, `OFFICER`, `DEPARTMENT_ADMIN`, `SUPER_ADMIN`.
- Secure JWT authentication with bcrypt password hashing.

### 2.2 AI & Machine Learning Pipeline
- **Gemini API Integration**: Uses `@google/generative-ai` (`gemini-1.5-flash`) to analyze natural language complaint descriptions.
- **Zod Schema Validation**: Enforces strict backend validation over LLM outputs.
- **Heuristic NLP Fallback**: Rule-based fallback classifier guarantees 100% test & execution uptime if API keys are absent.

### 2.3 Duplicate Detection & Clustering Microservice
- **Python FAISS Engine**: `backend/ml/duplicate_detector.py` evaluates TF-IDF vector sentence similarity, Haversine geographic distance, category matching, and temporal windows.
- **Incident Aggregation**: Automatically clusters related complaints into master `INCIDENT-XXXX` tickets.

### 2.4 SLA Countdown & Auto-Escalation Worker
- Background job running every 30 seconds evaluating `sla_deadline`.
- 4-Tier Escalation Hierarchy: Officer → Zone Officer → Department Officer → Department Head.

---

## 3. Deployment Topology
- **Production Bundle**: SPA served via Vite / static express host.
- **Data Layer**: SQLite with Write-Ahead Logging (WAL) for zero-dependency execution.
