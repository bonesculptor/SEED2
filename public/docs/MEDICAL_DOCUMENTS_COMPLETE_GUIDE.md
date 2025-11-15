# Complete Medical Documents & Records System
## Implementation Guide with FHIR Integration

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [Features](#features)
5. [Setup Instructions](#setup-instructions)
6. [User Interface Guide](#user-interface-guide)
7. [Document Categories](#document-categories)
8. [File Upload Process](#file-upload-process)
9. [AI Document Extraction](#ai-document-extraction)
10. [FHIR Integration](#fhir-integration)
11. [Security & Privacy](#security--privacy)
12. [API Reference](#api-reference)
13. [Troubleshooting](#troubleshooting)

---

## Overview

The Medical Documents & Records System provides a comprehensive solution for:

✅ **Personal Health Records Management** - Upload, store, and organize medical documents
✅ **10 Document Categories** - Lab results, imaging, prescriptions, clinical notes, and more
✅ **AI-Powered Extraction** - Automatic data extraction from lab results and prescriptions
✅ **FHIR Integration** - Seamless conversion to FHIR resources (Observations, DiagnosticReports, MedicationRequests)
✅ **Document Sharing** - Secure sharing with time-limited access control
✅ **Audit Trails** - Complete tracking of all document access and modifications
✅ **Storage Integration** - Secure file storage with Supabase Storage
✅ **Search & Filter** - Full-text search and category-based filtering

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    USER INTERFACE                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Dashboard   │  │Medical Records│  │Documentation │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────┐
│              SERVICES & BUSINESS LOGIC                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  medicalDocumentsService.ts                      │   │
│  │  - Upload/Download                                │   │
│  │  - Document Management                            │   │
│  │  - Access Control                                 │   │
│  │  - Extraction Parsing                             │   │
│  └──────────────────────────────────────────────────┘   │
│                         │                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │  medicalDocumentsFHIRIntegration.ts              │   │
│  │  - FHIR Resource Creation                         │   │
│  │  - Observation Mapping                            │   │
│  │  - DiagnosticReport Creation                      │   │
│  │  - MedicationRequest Mapping                      │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────┐
│              DATA LAYER (Supabase)                       │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │  PostgreSQL DB   │  │ Storage Buckets  │            │
│  │  - Documents     │  │ - medical-docs   │            │
│  │  - Categories    │  │ - (files)        │            │
│  │  - Extractions   │  └──────────────────┘            │
│  │  - Sharing       │                                   │
│  │  - Access Logs   │                                   │
│  │  - FHIR Resources│                                   │
│  └──────────────────┘                                   │
└─────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Core Tables

#### 1. `medical_document_categories`
Defines the types of medical documents.

```sql
CREATE TABLE medical_document_categories (
  id uuid PRIMARY KEY,
  name text UNIQUE NOT NULL,
  description text,
  icon text,
  color text,
  fhir_resource_type text,
  extraction_enabled boolean DEFAULT false,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

**Default Categories:**
- Lab Results (extraction enabled)
- Imaging
- Prescriptions (extraction enabled)
- Clinical Notes (extraction enabled)
- Discharge Summaries (extraction enabled)
- Vaccination Records (extraction enabled)
- Allergy Information (extraction enabled)
- Surgical Reports (extraction enabled)
- Insurance Documents
- Medical History

#### 2. `patient_medical_documents`
Stores all patient-uploaded documents.

```sql
CREATE TABLE patient_medical_documents (
  id uuid PRIMARY KEY,
  patient_id uuid REFERENCES auth.users(id),
  category_id uuid REFERENCES medical_document_categories(id),
  title text NOT NULL,
  description text,
  document_type text NOT NULL,

  -- File storage
  storage_path text,
  file_name text,
  file_type text,
  file_size bigint,

  -- Content
  content_text text,
  metadata jsonb DEFAULT '{}',

  -- FHIR integration
  fhir_resource_type text,
  fhir_resource_id uuid,

  -- Processing
  extraction_status text DEFAULT 'pending',
  extraction_data jsonb,

  -- Metadata
  document_date date,
  tags text[] DEFAULT ARRAY[]::text[],

  -- Timestamps
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### 3. `document_extractions`
AI-extracted data from documents.

```sql
CREATE TABLE document_extractions (
  id uuid PRIMARY KEY,
  document_id uuid REFERENCES patient_medical_documents(id),
  extraction_type text NOT NULL,
  extracted_data jsonb NOT NULL,
  confidence_score float,
  fhir_resource_type text,
  fhir_resource_id uuid,
  verified boolean DEFAULT false,
  extraction_method text DEFAULT 'ai',
  model_version text,
  created_at timestamptz DEFAULT now()
);
```

**Extraction Types:**
- `lab_values` - Lab test results
- `medications` - Medication lists
- `diagnoses` - Diagnoses/conditions
- `procedures` - Medical procedures
- `vital_signs` - Vital sign measurements
- `allergies` - Allergy information
- `immunizations` - Vaccination records
- `observations` - General observations

#### 4. `document_sharing_permissions`
Manages document sharing between users.

```sql
CREATE TABLE document_sharing_permissions (
  id uuid PRIMARY KEY,
  document_id uuid REFERENCES patient_medical_documents(id),
  shared_by_user_id uuid REFERENCES auth.users(id),
  shared_with_user_id uuid REFERENCES auth.users(id),
  can_view boolean DEFAULT true,
  can_download boolean DEFAULT false,
  can_share boolean DEFAULT false,
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  purpose text,
  notes text,
  access_count int DEFAULT 0,
  last_accessed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

#### 5. `document_access_log`
Audit trail for all document access.

```sql
CREATE TABLE document_access_log (
  id uuid PRIMARY KEY,
  document_id uuid REFERENCES patient_medical_documents(id),
  accessed_by uuid REFERENCES auth.users(id),
  access_type text NOT NULL,
  ip_address text,
  user_agent text,
  accessed_at timestamptz DEFAULT now()
);
```

**Access Types:**
- `view` - Document viewed
- `download` - Document downloaded
- `share` - Document shared
- `edit` - Document modified
- `delete` - Document deleted

---

## Features

### 1. Document Upload & Management

**Supported File Types:**
- PDF documents
- Images (JPEG, PNG)
- Text files
- Word documents
- Excel spreadsheets

**Upload Process:**
1. User selects file
2. Fills in metadata (title, description, category, date, tags)
3. File uploaded to Supabase Storage
4. Document record created in database
5. AI extraction initiated (if enabled for category)

### 2. AI Document Extraction

**Lab Results Extraction:**
```typescript
{
  test_date: "2024-01-15",
  results: [
    {
      test_name: "Hemoglobin",
      value: "14.5",
      unit: "g/dL",
      reference_range: "13.5-17.5 g/dL",
      status: "normal"
    },
    {
      test_name: "Glucose",
      value: "110",
      unit: "mg/dL",
      reference_range: "70-100 mg/dL",
      status: "high"
    }
  ]
}
```

**Extraction Status:**
- `pending` - Waiting for processing
- `processing` - Currently being processed
- `completed` - Successfully extracted
- `failed` - Extraction failed
- `manual` - Manually entered

### 3. FHIR Integration

Documents are automatically converted to FHIR resources:

**Lab Results → FHIR Observation**
```json
{
  "resourceType": "Observation",
  "status": "final",
  "code": {
    "coding": [{
      "system": "http://loinc.org",
      "code": "718-7",
      "display": "Hemoglobin"
    }]
  },
  "subject": {
    "reference": "Patient/user-id"
  },
  "effectiveDateTime": "2024-01-15",
  "valueQuantity": {
    "value": 14.5,
    "unit": "g/dL"
  }
}
```

**Lab Results → FHIR DiagnosticReport**
```json
{
  "resourceType": "DiagnosticReport",
  "status": "final",
  "code": {
    "coding": [{
      "system": "http://loinc.org",
      "code": "11502-2",
      "display": "Laboratory report"
    }]
  },
  "subject": {
    "reference": "Patient/user-id"
  },
  "effectiveDateTime": "2024-01-15"
}
```

**Prescriptions → FHIR MedicationRequest**
```json
{
  "resourceType": "MedicationRequest",
  "status": "active",
  "intent": "order",
  "medicationCodeableConcept": {
    "coding": [{
      "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
      "code": "123456",
      "display": "Medication Name"
    }]
  },
  "subject": {
    "reference": "Patient/user-id"
  }
}
```

### 4. Document Sharing

**Share with Time Limits:**
```typescript
await medicalDocumentsService.shareDocument(
  documentId,
  recipientUserId,
  {
    can_view: true,
    can_download: false,
    can_share: false,
    expires_at: '2024-12-31T23:59:59Z',
    purpose: 'Second opinion consultation'
  }
);
```

**Revoke Access:**
```typescript
await medicalDocumentsService.revokeSharing(sharingId);
```

### 5. Search & Filtering

**Full-Text Search:**
- Search document titles
- Search descriptions
- Search tags

**Category Filtering:**
- Filter by document category
- View documents by type
- Statistics per category

---

## Setup Instructions

### Step 1: Run Database Migrations

```bash
# Apply medical documents schema
supabase db push
```

Or manually run:
- `supabase/migrations/20251115100000_create_medical_documents_system.sql`

### Step 2: Create Storage Bucket

In Supabase Dashboard:

1. Go to **Storage**
2. Click **Create Bucket**
3. Name: `medical-documents`
4. Public: **No** (private bucket)
5. Click **Create**

### Step 3: Set Storage Policies

```sql
-- Allow users to upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'medical-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own files
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'medical-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Step 4: Start Application

```bash
npm run dev
```

Navigate to **Medical Records** in the top navigation.

---

## User Interface Guide

### Main Medical Records Page

```
┌──────────────────────────────────────────────────────────┐
│  My Medical Records                    [Upload Document] │
├──────────────────────────────────────────────────────────┤
│  [Stats: 12 Total | 10 Processed | 2 Processing | 10 Categories]
├──────────────────────────────────────────────────────────┤
│  [Search...........................] [Filter: All ▼]     │
├──────────────────────────────────────────────────────────┤
│  [All] [🧪 Lab] [🔬 Imaging] [💊 Rx] [📝 Notes] ...      │
├──────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │ 🧪 Lab Test │ │ 💊 Prescription│ │ 📝 Doctor Note│   │
│  │ Blood Work  │ │ Metformin   │ │ Annual Check│        │
│  │ Jan 15 2024 │ │ Jan 10 2024 │ │ Jan 5 2024  │        │
│  │ [View][Down]│ │ [View][Down]│ │ [View][Down]│        │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
└──────────────────────────────────────────────────────────┘
```

### Upload Modal

```
┌─────────────────────────────────────────┐
│  Upload Medical Document            [×] │
├─────────────────────────────────────────┤
│  Select File *                           │
│  [Choose File....................]       │
│                                          │
│  Title *                                 │
│  [Blood Test Results - Jan 2024...]     │
│                                          │
│  Description                             │
│  [Annual checkup blood work.........]   │
│                                          │
│  Category *                              │
│  [Lab Results ▼]                        │
│                                          │
│  Document Type *                         │
│  [Lab Result ▼]                         │
│                                          │
│  Document Date                           │
│  [2024-01-15]                           │
│                                          │
│  Tags (comma-separated)                  │
│  [annual, checkup, routine..........]   │
│                                          │
│  [Cancel]      [Upload Document]         │
└─────────────────────────────────────────┘
```

### Document Detail View

```
┌─────────────────────────────────────────┐
│  Blood Test Results - Jan 2024      [×] │
├─────────────────────────────────────────┤
│  Document Type: lab_result              │
│  Date: Jan 15, 2024                     │
│  File Type: application/pdf             │
│  File Size: 245.6 KB                    │
│                                          │
│  Description:                            │
│  Annual checkup blood work               │
│                                          │
│  Tags: #annual #checkup #routine        │
│                                          │
│  Extracted Data: ✓                      │
│  ┌─────────────────────────────────┐   │
│  │ Lab Values (85% confidence)     │   │
│  │ {                               │   │
│  │   "test_date": "2024-01-15",    │   │
│  │   "results": [                  │   │
│  │     {                           │   │
│  │       "test_name": "Hemoglobin",│   │
│  │       "value": "14.5",          │   │
│  │       "unit": "g/dL",           │   │
│  │       "status": "normal"        │   │
│  │     }                           │   │
│  │   ]                             │   │
│  │ }                               │   │
│  └─────────────────────────────────┘   │
│                                          │
│  [Download]              [Delete]        │
└─────────────────────────────────────────┘
```

---

## Document Categories

### 1. 🧪 Lab Results
**Purpose:** Laboratory test results and pathology reports
**Extraction:** ✅ Enabled
**FHIR Resource:** Observation, DiagnosticReport
**Examples:**
- Blood tests (CBC, metabolic panel)
- Urinalysis
- Pathology reports
- Genetic tests

### 2. 🔬 Imaging
**Purpose:** Medical imaging studies
**Extraction:** ❌ Disabled
**FHIR Resource:** ImagingStudy
**Examples:**
- X-rays
- MRI scans
- CT scans
- Ultrasounds

### 3. 💊 Prescriptions
**Purpose:** Medication prescriptions
**Extraction:** ✅ Enabled
**FHIR Resource:** MedicationRequest
**Examples:**
- Prescription scripts
- Medication lists
- Pharmacy records

### 4. 📝 Clinical Notes
**Purpose:** Healthcare provider notes
**Extraction:** ✅ Enabled
**FHIR Resource:** DocumentReference
**Examples:**
- Doctor's notes
- Consultation records
- Progress notes
- Treatment plans

### 5. 📋 Discharge Summaries
**Purpose:** Hospital discharge documentation
**Extraction:** ✅ Enabled
**FHIR Resource:** DocumentReference
**Examples:**
- Hospital discharge summaries
- Care instructions
- Follow-up plans

### 6. 💉 Vaccination Records
**Purpose:** Immunization history
**Extraction:** ✅ Enabled
**FHIR Resource:** Immunization
**Examples:**
- Vaccination certificates
- Immunization schedules
- Booster records

### 7. ⚠️ Allergy Information
**Purpose:** Allergy documentation
**Extraction:** ✅ Enabled
**FHIR Resource:** AllergyIntolerance
**Examples:**
- Allergy lists
- Reaction reports
- Food allergies

### 8. ⚕️ Surgical Reports
**Purpose:** Surgical procedure documentation
**Extraction:** ✅ Enabled
**FHIR Resource:** Procedure
**Examples:**
- Operative notes
- Surgery reports
- Post-op instructions

### 9. 🛡️ Insurance Documents
**Purpose:** Insurance-related documents
**Extraction:** ❌ Disabled
**FHIR Resource:** None
**Examples:**
- Insurance cards
- Claims
- Coverage documents

### 10. 📚 Medical History
**Purpose:** Historical medical information
**Extraction:** ❌ Disabled
**FHIR Resource:** FamilyMemberHistory
**Examples:**
- Personal medical history
- Family history
- Past conditions

---

## File Upload Process

### Step-by-Step Flow

```
1. User clicks "Upload Document"
   ↓
2. Upload modal opens
   ↓
3. User selects file and fills metadata
   ↓
4. Form submitted
   ↓
5. File uploaded to Supabase Storage
   - Path: {user_id}/{timestamp}_{filename}
   ↓
6. Document record created in database
   - title, description, category, date, tags
   ↓
7. AI extraction initiated (if enabled)
   - Document status: "processing"
   ↓
8. Extraction completes
   - Document status: "completed"
   - Extracted data stored
   ↓
9. FHIR resources created (if applicable)
   - Observations
   - DiagnosticReports
   - MedicationRequests
   ↓
10. User notified
    - Document appears in list
    - Extracted data viewable
```

### Code Example

```typescript
// Upload document
const document = await medicalDocumentsService.uploadDocument(
  file,
  {
    title: 'Blood Test Results - Jan 2024',
    description: 'Annual checkup blood work',
    document_type: 'lab_result',
    category_id: labResultsCategoryId,
    document_date: '2024-01-15',
    tags: ['annual', 'checkup', 'routine']
  }
);

// Parse lab results
if (file.type === 'text/plain') {
  const labData = await medicalDocumentsService.parseLabResults(file);

  // Store extraction
  const extraction = await medicalDocumentsService.extractDocumentData(
    document.id,
    'lab_values',
    labData,
    0.85
  );

  // Create FHIR resources
  await medicalDocumentsFHIRIntegration.syncDocumentToFHIR(document.id);
}
```

---

## AI Document Extraction

### Lab Results Parser

The system automatically extracts structured data from lab result documents.

**Supported Formats:**
- Plain text (.txt)
- PDF (with text layer)
- Common lab report formats

**Extraction Algorithm:**

```typescript
async parseLabResults(file: File): Promise<LabData> {
  const text = await file.text();

  const results = [];

  // Pattern matching for common tests
  const patterns = {
    hemoglobin: /hemoglobin[:\s]+(\d+\.?\d*)\s*([a-zA-Z/]+)/i,
    glucose: /glucose[:\s]+(\d+\.?\d*)\s*([a-zA-Z/]+)/i,
    wbc: /white blood cell[:\s]+(\d+\.?\d*)\s*([a-zA-Z/]+)/i,
    // ... more patterns
  };

  // Extract values
  for (const [testName, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match) {
      results.push({
        test_name: formatTestName(testName),
        value: match[1],
        unit: match[2],
        reference_range: getReferenceRange(testName),
        status: assessStatus(parseFloat(match[1]), testName)
      });
    }
  }

  return {
    test_date: extractDate(text) || new Date().toISOString(),
    results
  };
}
```

**Reference Ranges:**

```typescript
const referenceRanges = {
  'Hemoglobin': { min: 13.5, max: 17.5, unit: 'g/dL' },
  'Glucose': { min: 70, max: 100, unit: 'mg/dL' },
  'White Blood Cell Count': { min: 4.5, max: 11, unit: 'K/uL' },
  'Platelet Count': { min: 150, max: 400, unit: 'K/uL' },
  'Cholesterol': { min: 0, max: 200, unit: 'mg/dL' },
  // ... more ranges
};
```

### Confidence Scoring

Extraction confidence is calculated based on:

1. **Pattern Match Quality** (40%)
   - Exact match: 1.0
   - Partial match: 0.7
   - Fuzzy match: 0.5

2. **Value Validation** (30%)
   - Within expected range: 1.0
   - Outside but plausible: 0.7
   - Questionable: 0.3

3. **Context Analysis** (30%)
   - Clear context: 1.0
   - Ambiguous: 0.6
   - Unclear: 0.3

**Overall Confidence:**
```
confidence = (pattern_score * 0.4) + (validation_score * 0.3) + (context_score * 0.3)
```

**Confidence Thresholds:**
- ≥ 0.9: High confidence (auto-verify)
- 0.7-0.89: Medium confidence (review recommended)
- < 0.7: Low confidence (manual review required)

---

## FHIR Integration

### LOINC Mapping

Common lab tests are mapped to LOINC codes:

```typescript
const loincCodes = {
  'Hemoglobin': '718-7',
  'Glucose': '2339-0',
  'White Blood Cell Count': '6690-2',
  'Platelet Count': '777-3',
  'Cholesterol': '2093-3',
  'Triglycerides': '2571-8',
  'HDL Cholesterol': '2085-9',
  'LDL Cholesterol': '13457-7',
  'Creatinine': '2160-0',
  'Blood Urea Nitrogen': '3094-0',
  'Sodium': '2951-2',
  'Potassium': '2823-3',
  'Calcium': '17861-6'
};
```

### Sync to FHIR

```typescript
// Sync document to FHIR
const result = await medicalDocumentsFHIRIntegration.syncDocumentToFHIR(
  documentId
);

if (result.success) {
  console.log('FHIR Resources Created:');
  console.log('- Type:', result.fhirResourceType);
  console.log('- ID:', result.fhirResourceId);
}
```

### Retrieve FHIR Resources

```typescript
// Get all FHIR resources for patient
const resources = await medicalDocumentsFHIRIntegration.getPatientFHIRResources(
  patientId
);

console.log('Observations:', resources.observations.length);
console.log('Diagnostic Reports:', resources.diagnosticReports.length);
console.log('Medication Requests:', resources.medicationRequests.length);
```

---

## Security & Privacy

### Row Level Security (RLS)

**All tables have RLS enabled:**

1. **Patients own their documents**
   ```sql
   CREATE POLICY "Patients can view own documents"
   ON patient_medical_documents FOR SELECT
   TO authenticated
   USING (auth.uid() = patient_id);
   ```

2. **Shared access requires permission**
   ```sql
   CREATE POLICY "Shared users can view documents"
   ON patient_medical_documents FOR SELECT
   TO authenticated
   USING (
     EXISTS (
       SELECT 1 FROM document_sharing_permissions
       WHERE document_id = patient_medical_documents.id
       AND shared_with_user_id = auth.uid()
       AND (expires_at IS NULL OR expires_at > now())
       AND revoked_at IS NULL
     )
   );
   ```

3. **Extractions follow document permissions**
   ```sql
   CREATE POLICY "Patients can view own extractions"
   ON document_extractions FOR SELECT
   TO authenticated
   USING (
     EXISTS (
       SELECT 1 FROM patient_medical_documents
       WHERE id = document_extractions.document_id
       AND patient_id = auth.uid()
     )
   );
   ```

### Audit Logging

**Every action is logged:**

```typescript
// Automatically logged:
- Document uploads
- Document views
- Document downloads
- Document sharing
- Document edits
- Document deletions

// Access log entry:
{
  document_id: "uuid",
  accessed_by: "user_id",
  access_type: "view",
  ip_address: "192.168.1.1",
  user_agent: "Mozilla/5.0...",
  accessed_at: "2024-01-15T10:30:00Z"
}
```

### File Storage Security

**Private bucket with RLS:**
- Files stored in user-specific folders
- No public access
- Signed URLs for downloads
- Automatic expiration

### Data Encryption

- **At Rest:** Supabase encrypts all data
- **In Transit:** HTTPS/TLS encryption
- **Storage:** AES-256 encryption

---

## API Reference

### Upload Document

```typescript
await medicalDocumentsService.uploadDocument(
  file: File,
  metadata: {
    title: string;
    description?: string;
    document_type: DocumentType;
    category_id?: string;
    document_date?: string;
    tags?: string[];
  }
): Promise<PatientMedicalDocument | null>
```

### Get Patient Documents

```typescript
await medicalDocumentsService.getPatientDocuments(
  patientId: string
): Promise<PatientMedicalDocument[]>
```

### Download Document

```typescript
await medicalDocumentsService.downloadDocument(
  documentId: string
): Promise<Blob | null>
```

### Delete Document

```typescript
await medicalDocumentsService.deleteDocument(
  documentId: string
): Promise<boolean>
```

### Extract Document Data

```typescript
await medicalDocumentsService.extractDocumentData(
  documentId: string,
  extractionType: string,
  extractedData: Record<string, any>,
  confidenceScore?: number
): Promise<DocumentExtraction | null>
```

### Share Document

```typescript
await medicalDocumentsService.shareDocument(
  documentId: string,
  sharedWithUserId: string,
  permissions: {
    can_view?: boolean;
    can_download?: boolean;
    can_share?: boolean;
    expires_at?: string;
    purpose?: string;
    notes?: string;
  }
): Promise<DocumentSharingPermission | null>
```

### Sync to FHIR

```typescript
await medicalDocumentsFHIRIntegration.syncDocumentToFHIR(
  documentId: string
): Promise<{
  success: boolean;
  fhirResourceType?: string;
  fhirResourceId?: string;
}>
```

---

## Troubleshooting

### Issue: File upload fails

**Symptoms:** Error message when uploading file

**Solutions:**

1. Check storage bucket exists:
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'medical-documents';
   ```

2. Verify storage policies:
   ```sql
   SELECT * FROM storage.policies WHERE bucket_id = 'medical-documents';
   ```

3. Check file size limit (default: 50MB)

4. Verify user is authenticated

### Issue: Extraction not working

**Symptoms:** Document stays in "processing" state

**Solutions:**

1. Check extraction is enabled for category:
   ```sql
   SELECT extraction_enabled FROM medical_document_categories
   WHERE id = 'category_id';
   ```

2. Verify file format is supported (text/plain, PDF with text)

3. Check extraction logs in browser console

4. Manually trigger extraction:
   ```typescript
   const extraction = await medicalDocumentsService.extractDocumentData(
     documentId,
     'lab_values',
     extractedData,
     0.85
   );
   ```

### Issue: Cannot view document

**Symptoms:** Document not visible in list

**Solutions:**

1. Verify RLS policies:
   ```sql
   SELECT * FROM patient_medical_documents
   WHERE id = 'document_id';
   ```

2. Check sharing permissions:
   ```sql
   SELECT * FROM document_sharing_permissions
   WHERE document_id = 'document_id'
   AND shared_with_user_id = auth.uid();
   ```

3. Verify user is owner:
   ```sql
   SELECT patient_id FROM patient_medical_documents
   WHERE id = 'document_id';
   ```

### Issue: FHIR sync fails

**Symptoms:** No FHIR resources created

**Solutions:**

1. Check extraction completed:
   ```sql
   SELECT extraction_status FROM patient_medical_documents
   WHERE id = 'document_id';
   ```

2. Verify FHIR tables exist:
   ```sql
   SELECT tablename FROM pg_tables
   WHERE tablename LIKE 'fhir_%';
   ```

3. Check FHIR resource creation:
   ```typescript
   const result = await medicalDocumentsFHIRIntegration.syncDocumentToFHIR(
     documentId
   );
   console.log(result);
   ```

---

## Summary

The Medical Documents & Records System provides:

✅ **Complete document management** for personal health records
✅ **10 document categories** covering all common medical document types
✅ **AI-powered extraction** for lab results and prescriptions
✅ **FHIR integration** for interoperability with other healthcare systems
✅ **Secure storage** with row-level security and audit trails
✅ **Document sharing** with fine-grained permissions
✅ **Search and filtering** for easy document discovery
✅ **Mobile-responsive** design for access anywhere

Access the system through the **Medical Records** tab in the navigation menu!

---

**Version:** 1.0
**Last Updated:** November 2025
**Status:** Production Ready ✅
