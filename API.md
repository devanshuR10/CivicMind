# REST API Documentation

## Authentication & User Accounts

### `POST /api/auth/login`
Authenticates a user and returns a Bearer JWT token.
- **Request Body**: `{ "email": "citizen@sih.gov.in", "password": "password123" }`
- **Response**: `{ "token": "...", "user": { "id": 1, "role": "CITIZEN" } }`

### `POST /api/auth/register`
Registers a new citizen account.
- **Request Body**: `{ "name": "Rahul", "email": "rahul@example.com", "password": "..." }`

### `GET /api/auth/me`
Returns current authenticated user session details.

---

## AI Grievance Assistant

### `POST /api/ai/parse-complaint`
Converts natural language input into validated structured grievance JSON.
- **Request Body**: `{ "text": "No water supply for 3 days", "location_text": "Model Town" }`
- **Response**:
  ```json
  {
    "category": "Water Supply",
    "subcategory": "No Water Supply",
    "department": "Water Department",
    "priority": "HIGH",
    "description": "...",
    "location_text": "Model Town",
    "missing_information": []
  }
  ```

---

## Grievances Lifecycle API

### `POST /api/grievances`
Registers a new complaint after citizen preview confirmation.
- **Request Body**: `{ "category": "Water Supply", "department": "Water Department", "priority": "HIGH", "description": "...", "location_text": "Model Town" }`
- **Response**: `{ "tracking_number": "GRV-2026-A8F412", "status": "SUBMITTED" }`

### `GET /api/grievances`
Lists grievances. Citizens view only their own complaints; Officers & Admins view departmental/all complaints.

### `PATCH /api/grievances/:id/status`
Updates status lifecycle (`ACKNOWLEDGED`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`).

### `POST /api/grievances/:id/verify`
Citizen resolution feedback verification. Reopens ticket if citizen reports issue persists.

---

## Analytics & Incidents API

### `POST /api/ai/admin-assistant`
Database-grounded analytical QA for administrators.

### `POST /api/incidents/cluster-duplicates`
Scans complaints and groups duplicates into `INCIDENT-XXXX` master tickets.
