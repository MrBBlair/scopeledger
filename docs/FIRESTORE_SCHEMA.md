# Firestore Schema

## Collections

### `users/{uid}`

| Field | Type | Description |
|-------|------|-------------|
| `email` | string | User email |
| `displayName` | string | Display name |
| `photoURL` | string \| null | Avatar URL |
| `onboardingCompleted` | boolean | Onboarding finished |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

- **Security:** Read/write only when `request.auth.uid == uid`.

---

### `projects/{projectId}`

| Field | Type | Description |
|-------|------|-------------|
| `ownerId` | string | Firebase UID |
| `name` | string | |
| `description` | string | |
| `status` | `'active' \| 'archived'` | |
| `baselineBudget` | number | |
| `overheadPercent` | number | |
| `overheadAmount` | number | |
| `currency` | string | e.g. USD |
| `startDate` | string | ISO date |
| `endDate` | string \| null | |
| `baselineLockedAt` | timestamp \| null | Locked after creation |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

- **Indexes:** Composite on `(ownerId, updatedAt desc)`.
- **Security:** Read/write only when `ownerId == request.auth.uid`.

---

### `costs/{costId}`

| Field | Type | Description |
|-------|------|-------------|
| `projectId` | string | |
| `amount` | number | |
| `category` | string | |
| `vendor` | string | |
| `description` | string | |
| `date` | string | ISO date |
| `deductionType` | `'manual' \| 'automatic'` | |
| `createdBy` | string | UID |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

- **Indexes:** Composite on `(projectId, date desc)`.
- **Security:** Access only if user can access project.

---

### `changeOrders/{changeOrderId}`

| Field | Type | Description |
|-------|------|-------------|
| `projectId` | string | |
| `type` | `'positive' \| 'negative'` | |
| `amount` | number | |
| `description` | string | |
| `status` | `'pending' \| 'approved' \| 'rejected'` | |
| `approvedBy` | string \| null | UID |
| `approvedAt` | timestamp \| null | |
| `createdBy` | string | UID |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

- **Indexes:** Composite on `(projectId, createdAt desc)`.
- **Security:** Access only if user can access project.

---

### `forecasts/{forecastId}`

| Field | Type | Description |
|-------|------|-------------|
| `projectId` | string | |
| `version` | number | |
| `costToDate` | number | |
| `burnRate` | number | |
| `remainingBudget` | number | |
| `projectedTotal` | number | |
| `manualOverride` | number \| null | |
| `aiSummary` | string \| null | |
| `createdBy` | string | UID |
| `createdAt` | timestamp | |

- **Indexes:** Composite on `(projectId, createdAt desc)`.
- **Security:** Access only if user can access project.

---

### `auditLogs/{logId}`

| Field | Type | Description |
|-------|------|-------------|
| `projectId` | string | |
| `action` | string | See `AuditAction` in types |
| `userId` | string | UID |
| `metadata` | map | |
| `createdAt` | timestamp | |

- **Indexes:** Composite on `(projectId, createdAt desc)`.
- **Security:** Access only if user can access project.
