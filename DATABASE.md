# Database Schema Documentation

The system uses an embedded SQLite database (`better-sqlite3`) configured with Write-Ahead Logging (WAL) and foreign key constraints.

---

## Entity Relationship Overview

```
users (id, role, department_id)
  │
  ├── grievances (tracking_number, citizen_id, department, priority, status)
  │     ├── locations (grievance_id, latitude, longitude)
  │     ├── ai_analysis (grievance_id, extracted_json)
  │     ├── grievance_status_history (grievance_id, previous_status, new_status)
  │     └── escalations (grievance_id, escalated_from_officer_id, escalated_to_officer_id)
  │
  └── incidents (incident_number, affected_citizens_count)
        └── incident_grievances (incident_id, grievance_id)
```

---

## Primary Tables

### `grievances`
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `tracking_number` TEXT UNIQUE (Format: `GRV-2026-XXXXXX`)
- `citizen_id` INTEGER (FK -> `users.id`)
- `category` TEXT NOT NULL
- `department` TEXT NOT NULL
- `priority` TEXT CHECK ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
- `status` TEXT CHECK ('SUBMITTED', 'ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CITIZEN_VERIFIED', 'CLOSED', 'ESCALATED', 'REOPENED', 'REJECTED')
- `assigned_officer_id` INTEGER (FK -> `users.id`)
- `sla_deadline` DATETIME
- `is_escalated` INTEGER (0/1)
- `incident_id` INTEGER (FK -> `incidents.id`)

### `incidents`
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `incident_number` TEXT UNIQUE (Format: `INCIDENT-XXXX`)
- `title` TEXT NOT NULL
- `affected_citizens_count` INTEGER DEFAULT 1

### `escalations`
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `grievance_id` INTEGER (FK -> `grievances.id`)
- `level` INTEGER DEFAULT 1
- `reason` TEXT NOT NULL
