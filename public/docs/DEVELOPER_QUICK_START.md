# Developer Quick Start Guide

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create a `.env` file:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

---

## New Architecture Overview

### Core Services (Use These!)

```typescript
import { supabase } from './lib/supabase';
import { ServiceContainer } from './services-new';

// Create service container
const services = new ServiceContainer(supabase);

// Access services
services.auth          // Authentication
services.patient       // Patient management
services.medicalRecord // Medical records (medications, conditions, etc.)
services.document      // Document upload & extraction
services.graph         // Graph visualization
```

### Usage Examples

#### Authentication
```typescript
// Sign up
await services.auth.signUp('user@example.com', 'password');

// Sign in
await services.auth.signIn('user@example.com', 'password');

// Get current user
const user = await services.auth.getCurrentUser();

// Sign out
await services.auth.signOut();

// Listen to auth changes
services.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event);
});
```

#### Patient Management
```typescript
// Get user ID first
const user = await services.auth.getCurrentUser();
const userId = user.id;

// Get all patients
const patients = await services.patient.getPatients(userId);

// Create patient
const patient = await services.patient.createPatient(userId, {
  givenName: 'John',
  familyName: 'Doe',
  birthDate: '1990-01-01',
  gender: 'male',
  nhsNumber: '123 456 7890',
});

// Update patient
await services.patient.updatePatient(patient.id, userId, {
  familyName: 'Smith',
});

// Delete patient
await services.patient.deletePatient(patient.id, userId);
```

#### Medical Records
```typescript
const userId = (await services.auth.getCurrentUser()).id;

// Get all medications
const medications = await services.medicalRecord.getMedications(userId);

// Create medication
await services.medicalRecord.createMedication(userId, {
  patientId: patient.id,
  medicationText: 'Aspirin 100mg',
  dosage: '100mg',
  frequency: 'Once daily',
  status: 'active',
});

// Get all conditions
const conditions = await services.medicalRecord.getConditions(userId);

// Create condition
await services.medicalRecord.createCondition(userId, {
  patientId: patient.id,
  conditionText: 'Type 2 Diabetes',
  clinicalStatus: 'active',
});

// Get all observations
const observations = await services.medicalRecord.getObservations(userId);

// Get all allergies
const allergies = await services.medicalRecord.getAllergies(userId);

// Get everything at once
const allRecords = await services.medicalRecord.getAllMedicalRecords(userId);
// Returns: { medications, conditions, observations, allergies }
```

#### Document Management
```typescript
const userId = (await services.auth.getCurrentUser()).id;

// Get all documents
const documents = await services.document.getDocuments(userId);

// Create document record
const doc = await services.document.createDocument(userId, {
  filename: 'medical-report.pdf',
  storagePath: '/path/in/storage',
  mimeType: 'application/pdf',
  fileSize: 123456,
});

// Update extraction status
await services.document.updateDocumentStatus(
  doc.id,
  userId,
  'completed',
  { extractedData: {...} }
);

// Extract document (mock implementation)
const extracted = await services.document.extractDocument(doc.id, userId);
```

#### Graph Visualization
```typescript
const userId = (await services.auth.getCurrentUser()).id;

// Get graph
const { nodes, edges } = await services.graph.getGraph(userId);

// Create node
const node = await services.graph.createNode(userId, {
  label: 'John Doe',
  nodeType: 'Patient',
  properties: { age: 35 },
});

// Create edge
await services.graph.createEdge(userId, {
  source: nodeId1,
  target: nodeId2,
  relationship: 'takes',
});

// Rebuild graph from medical records
await services.graph.rebuildGraphFromMedicalRecords(userId);

// Clear graph
await services.graph.clearGraph(userId);
```

---

## Database Schema

### Tables Overview

1. **fhir_patient_protocols** - Patient demographics
2. **fhir_medication_protocols** - Medications
3. **fhir_condition_protocols** - Medical conditions
4. **fhir_observation_protocols** - Clinical observations
5. **fhir_allergy_protocols** - Allergies
6. **document_files** - Uploaded documents
7. **graph_nodes** - Graph visualization nodes
8. **graph_edges** - Graph relationships

### Key Principles

✅ **All tables require `user_id`** - NO NULL allowed
✅ **Authentication required** - NO anonymous access
✅ **User isolation** - Users can only access their own data
✅ **NOT NULL constraints** - Critical fields have defaults
✅ **Automatic timestamps** - `created_at` and `updated_at` maintained

---

## Error Handling

### Repository Errors
```typescript
import { RepositoryError } from './domain/repositories/BaseRepository';

try {
  const patients = await services.patient.getPatients(userId);
} catch (error) {
  if (error instanceof RepositoryError) {
    console.error('Database error:', error.message);
    console.error('Caused by:', error.cause);
  }
}
```

### React Error Boundaries
```typescript
import { ErrorBoundary } from './components/ErrorBoundary';

function MyComponent() {
  return (
    <ErrorBoundary>
      <YourComponentHere />
    </ErrorBoundary>
  );
}
```

---

## Null Safety

### Always Use Null Guards
```typescript
// ✅ GOOD - Null guard with default
const label = (node.label ?? 'Unknown').toString();

// ✅ GOOD - Optional chaining
const value = patient?.birthDate;

// ❌ BAD - No null guard
const label = node.label.toString(); // Will crash if label is null
```

### Repository Methods Handle Nulls
All repository methods map database nulls to safe defaults:
```typescript
// Database returns null, repository returns 'Unknown'
givenName: row.given_name ?? 'Unknown'
```

---

## Adding New Features

### Step 1: Add Migration (if needed)
```typescript
// Use Supabase migration tool
```

### Step 2: Update Repository
```typescript
// Add new methods to appropriate repository
class PatientRepository extends BaseRepository<Patient> {
  async findByNHSNumber(nhsNumber: string): Promise<Patient | null> {
    // Implementation with null guards
  }
}
```

### Step 3: Update Service
```typescript
// Add business logic to service
class PatientService {
  async findPatientByNHS(nhsNumber: string) {
    return this.repository.findByNHSNumber(nhsNumber);
  }
}
```

### Step 4: Use in Components
```typescript
function MyComponent() {
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    services.patient.findPatientByNHS('123456789')
      .then(setPatient)
      .catch(console.error);
  }, []);

  return <div>{patient?.givenName ?? 'Loading...'}</div>;
}
```

---

## Common Patterns

### Loading States
```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  setLoading(true);
  services.patient.getPatients(userId)
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false));
}, [userId]);

if (loading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;
if (!data) return <div>No data</div>;

return <div>{/* Render data */}</div>;
```

### Form Submission
```typescript
async function handleSubmit(e) {
  e.preventDefault();

  try {
    await services.patient.createPatient(userId, {
      givenName: form.givenName,
      familyName: form.familyName,
    });

    alert('Patient created!');
  } catch (error) {
    alert('Failed: ' + error.message);
  }
}
```

---

## Testing (Coming Soon)

### Unit Tests
```typescript
describe('PatientRepository', () => {
  it('should map null values to defaults', () => {
    // Test implementation
  });
});
```

### Integration Tests
```typescript
describe('PatientService', () => {
  it('should create and retrieve patient', async () => {
    // Test implementation
  });
});
```

---

## Deprecated (Do Not Use)

❌ **Old services directory** - Use `services-new` instead
❌ **Direct Supabase calls in components** - Use services
❌ **Global state without user context** - Always pass userId
❌ **Unprotected routes** - Check authentication first

---

## Getting Help

1. Check this guide first
2. Review `REFACTORING_COMPLETE.md` for architecture details
3. Look at existing service implementations
4. Check repository patterns for data access examples

---

## Build & Deploy

### Development
```bash
npm run dev
```

### Type Check
```bash
npm run typecheck
```

### Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

---

## Key Files

- `src/services-new/` - Core business logic
- `src/domain/repositories/` - Data access layer
- `src/components/ErrorBoundary.tsx` - Error handling
- `src/lib/supabase.ts` - Supabase client
- `src/App.tsx` - Main application

---

**Remember**: Stability first, features second!
