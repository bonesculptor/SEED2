# Complete User Guide - Digital Twin Medical Records System

## Quick Start (5 Minutes)

### 1. Start the Application
```bash
npm run dev
```

### 2. Create Your Account
- Open http://localhost:5173/
- Click "Sign up"
- Enter email and password (6+ characters)
- Click "Create Account"

### 3. Sign In
- Enter your email and password
- Click "Sign In"

### 4. Import Demo Data
- Click the green "Import Simon Grange Data" button
- Wait a few seconds for import to complete

### 5. Explore!
- View statistics (6 cards at top)
- Try the three visualization modes
- Click nodes to see details
- Examine the medical graph

You're done! The complete system is now ready to use.

## Detailed User Journey

### Part 1: Authentication

#### Creating an Account

**What you need:**
- Valid email address
- Password (minimum 6 characters)

**Steps:**
1. Open the application
2. You'll see the login screen with a blue circle icon
3. Click the "Don't have an account? Sign up" link
4. The form switches to Sign Up mode
5. Enter your email address
6. Enter a password (at least 6 characters)
7. Re-enter the password in "Confirm Password"
8. Click "Create Account"
9. Wait for the green success message
10. Form automatically switches to Sign In after 2 seconds

**What happens:**
- Your account is created in Supabase
- Password is encrypted (never stored as plain text)
- A user record is created
- You're ready to sign in

#### Signing In

**Steps:**
1. Enter your email address
2. Enter your password
3. Click "Sign In"
4. Wait for authentication
5. Dashboard loads automatically

**What happens:**
- Credentials verified by Supabase
- Secure session created (JWT token)
- User data loaded
- Dashboard displays

### Part 2: The Dashboard

#### Understanding the Layout

**Header (Top Bar):**
```
┌──────────────────────────────────────────────────────────┐
│ Digital Twin Dashboard    [Import] [user@...] [Sign Out]│
│ Personal Health Record & Medical Graph Database          │
└──────────────────────────────────────────────────────────┘
```

**Statistics Cards:**
```
[👤 1 Patients] [🏥 4 Conditions] [💊 8 Meds]
[📄 2 Procedures] [📈 3 Observations] [📅 1 Plans]
```

**Patient Panel:**
```
┌────────────────────────────────────────┐
│  [SG]  Dr. Simon Grange               │
│  DOB: 7/6/1966 | NHS: 450 437 4846    │
└────────────────────────────────────────┘
```

**Visualization Area:**
```
[🔲 Graph View] [📅 Timeline] [🌌 Galaxy View]

┌──────────────────────────────────────────┐
│                                          │
│     (Interactive Canvas)                 │
│                                          │
└──────────────────────────────────────────┘
```

#### Importing Demo Data

**Button location:** Top right corner (green button)

**What it does:**
1. Parses Simon Grange's medical letter
2. Creates patient record
3. Adds 4 conditions (diagnoses)
4. Records 2 procedures
5. Lists 8 medications
6. Logs 3 observations
7. Creates treatment plan
8. Establishes digital twin baseline
9. Links everything with relationships

**What you'll see:**
- Import button shows "Importing..."
- After a few seconds, success message appears
- Statistics update automatically
- Patient panel shows Simon Grange
- Graph visualization appears

**The imported data includes:**

**Patient:**
- Name: Dr. Simon Andre Welham Grange
- Age: 58 years old
- Profession: Orthopaedic Surgeon
- NHS Number: 450 437 4846

**Conditions:**
1. Triple vessel coronary artery disease (Severe)
2. NSTEMI - Heart attack (Severe)
3. Post-operative chest infection (Moderate)
4. Sternal pain and soreness (Mild)

**Procedures:**
1. Coronary angiography (Jan 1, 2025)
2. CABG x3 - Triple bypass surgery (Jan 8, 2025)

**Medications:**
1. Amlodipine 10mg once daily
2. Aspirin 75mg once daily
3. Atorvastatin 80mg once daily
4. Bisoprolol 3.75mg morning / 2.5mg evening
5. Clopidogrel 75mg once daily
6. Pantoprazole 40mg once daily
7. Ramipril 1.25mg once daily

**Observations:**
1. Troponin T: 350 ng/L (Critical - indicates heart attack)
2. ECG: T-wave inversion (Abnormal)
3. Sternal pain assessment (Limiting function)

### Part 3: Visualizations

#### Graph View (Default)

**What it shows:**
- Patient node in the center (large blue circle)
- Medical entities arranged around patient
- Lines connecting related items
- Color-coded by entity type

**How to use it:**
1. **Click any node** to see details
   - Details panel appears on the right
   - Shows all relevant information

2. **Drag nodes** to rearrange
   - Click and hold any node
   - Move your mouse
   - Other nodes adjust automatically

3. **Watch the physics**
   - Nodes push away from each other
   - Connections pull related nodes together
   - Natural clustering occurs

**Node colors:**
- 🟦 Blue = Patient (center)
- 🟥 Red = Conditions
- 🟧 Amber = Procedures
- 🟩 Green = Medications
- 🔷 Cyan = Observations
- 🟪 Purple = Treatment Plans

**Example interaction:**
1. Click the red "Triple vessel CAD" node
2. Details panel shows:
   - Condition name
   - ICD-10 code: I25.1
   - Status: Active
   - Severity: Severe
   - Onset date: Jan 1, 2025

#### Timeline View

**What it shows:**
- All medical events in chronological order
- Grouped by year and month
- Expandable/collapsible sections

**Structure:**
```
▼ 2025
  ├─ ▶ March (1 record)
  └─ ▼ January (3 records)
      ├─ CABG x3 Surgery
      ├─ Coronary Angiography
      └─ Troponin Test

▼ 2024
  └─ ▼ December (1 record)
      └─ NSTEMI Presentation
```

**How to use it:**
1. **Click year headers** (▼ 2025) to expand/collapse
2. **Click month headers** (▶ January) to expand/collapse
3. **Click individual events** to see full details
4. **Scroll** to see earlier history

**Event icons:**
- 🏥 = Diagnoses/Conditions
- ⚕️ = Procedures/Surgery
- 💊 = Medications
- 📊 = Observations/Lab Results
- 📅 = Appointments/Encounters

#### Galaxy View

**What it shows:**
- Alternative network visualization
- Physics-based node positioning
- Dynamic movement and clustering

**How to use it:**
- Same as Graph View
- Click nodes for details
- Drag to rearrange
- Different physics creates different patterns

**When to use it:**
- Alternative perspective on data
- Large datasets with many relationships
- Exploring clusters and patterns

### Part 4: Understanding the Data

#### Patient Record

**What's stored:**
- Full name and demographics
- Date of birth (calculates age)
- NHS number (UK health system ID)
- Hospital number
- Address and contact info

**Where to see it:**
- Patient panel in dashboard
- Center node in graph view
- Patient details when clicked

#### Conditions (Diagnoses)

**What's stored:**
- Condition name
- ICD-10 diagnosis code
- Clinical status (active, resolved)
- Severity (mild, moderate, severe)
- Onset date
- Notes and evidence

**Example:**
```
Condition: Triple vessel coronary artery disease
Code: I25.1 (ICD-10)
Status: Active
Severity: Severe
Onset: 1 January 2025
```

#### Procedures

**What's stored:**
- Procedure name
- Date performed
- Operator/surgeon name
- Detailed steps and techniques
- Outcome and complications
- Location

**Example:**
```
Procedure: CABG x3 (Triple bypass)
Date: 8 January 2025
Surgeon: Mr. Sabetai
Details:
  • LIMA → mid LAD (2.5mm)
  • Left Radial → OM2 (2.5mm)
  • LSV → distal RCA (1.5mm)
Outcome: Successful revascularization
Complication: Post-op chest infection (treated)
```

#### Medications

**What's stored:**
- Medication name
- Dose and unit
- Frequency (OD = once daily, etc.)
- Route (oral, IV, etc.)
- Start and end dates
- Duration
- Indication (why prescribed)
- Special instructions

**Example:**
```
Medication: Atorvastatin
Dose: 80 mg
Frequency: OD (once daily)
Route: Oral
Status: Active
Indication: Post-CABG management
Prescriber: Dr. Mohammad Salman
```

#### Observations

**What's stored:**
- Observation type
- Date/time measured
- Value and unit
- Interpretation (normal, high, low, critical)
- Reference ranges
- LOINC/SNOMED codes

**Example:**
```
Observation: Troponin T
Code: 6598-7 (LOINC)
Date: 31 December 2024
Value: 350 ng/L
Interpretation: Critical
Note: Rose from 66 to 350
```

#### Treatment Plans

**What's stored:**
- Plan title and description
- Goals and objectives
- Activities and recommendations
- Start and end dates
- Care team
- Status

**Example:**
```
Plan: Post-CABG Rehabilitation
Status: Active
Goals:
  1. Complete cardiac rehabilitation
  2. Medication adherence
  3. Work capability assessment
Activities:
  • Continue rehabilitation
  • Monitor medications
  • Assess return to work options
```

#### Digital Twin Baseline

**What's stored:**
- Snapshot date
- Complete clinical state
- All linked entities (conditions, meds, etc.)
- Vital signs
- Lab results
- Functional status
- Source documents

**Purpose:**
- Track progress over time
- Compare states (baseline vs. current)
- Measure treatment effectiveness
- Enable predictive modeling

### Part 5: Relationships

**How entities connect:**

```
Patient
  ├─ has_condition → Condition
  │                    └─ evidence_from → Observation
  │
  ├─ underwent_procedure → Procedure
  │                          └─ treats_condition → Condition
  │
  ├─ takes_medication → Medication
  │                       └─ for_condition → Condition
  │
  └─ has_treatment_plan → Treatment Plan
                            └─ addresses_condition → Condition
```

**Examples:**
- Patient "has" Triple vessel CAD
- CABG procedure "treats" Triple vessel CAD
- Troponin observation is "evidence for" NSTEMI
- Atorvastatin "prescribed for" cardiovascular disease

### Part 6: Common Tasks

#### View All Conditions
1. Look at statistics card (🏥 shows count)
2. Switch to Graph View
3. Red nodes are conditions
4. Click each for details

#### Check Medication List
1. Look at statistics card (💊 shows active count)
2. Switch to Graph View
3. Green nodes are medications
4. Click each for dose, frequency, instructions

#### Review Medical History
1. Switch to Timeline View
2. Expand years and months
3. See chronological progression
4. From initial symptoms → diagnosis → treatment

#### Understand Treatment Journey
1. Start with presenting complaint (Dec 31, 2024)
2. Follow to diagnostic tests (Jan 1, 2025)
3. See surgical intervention (Jan 8, 2025)
4. Track post-op progress (Mar 5, 2025)

#### Export Data (Future feature)
Currently data is in Supabase. Future features:
- Export to PDF
- Generate reports
- Download as CSV
- Create FHIR bundles

### Part 7: Sign Out

**When to sign out:**
- End of session
- Switching users
- Security precaution

**How to sign out:**
1. Click "Sign Out" button (top right)
2. Session cleared
3. Return to login screen
4. Data removed from memory

**What happens:**
- JWT token invalidated
- Local storage cleared
- Must sign in again to access

## Advanced Features

### Clinical Coding

**ICD-10 Diagnosis Codes:**
- I25.1 = Atherosclerotic heart disease
- I21.4 = NSTEMI
- J95.851 = Postprocedural pneumonia

**LOINC Observation Codes:**
- 6598-7 = Troponin T cardiac

**SNOMED CT Codes:**
- 22253000 = Pain

### FHIR Compatibility

All data structures map to FHIR resources:
- Patient → FHIR Patient
- Condition → FHIR Condition
- Procedure → FHIR Procedure
- Medication → FHIR MedicationRequest
- Observation → FHIR Observation

### Row Level Security

**What it means:**
- Each user sees only their own data
- Database enforces access control
- Even with direct database access, users can't see others' records

**How it works:**
- Every table checks user_id
- Supabase auth provides user identity
- Queries automatically filtered

## Troubleshooting

### Can't Sign In
- Check email and password
- Ensure account exists (sign up first)
- Check browser console for errors
- Verify Supabase connection

### Dashboard Empty After Login
- Click "Import Simon Grange Data"
- Check that import completed successfully
- Verify user_id matches in database

### Visualization Not Loading
- Check that patient data exists
- Verify relationships were created
- Try refreshing the page
- Check browser console

### Slow Performance
- Large datasets may take time
- Close other browser tabs
- Clear browser cache
- Check internet connection

## Security & Privacy

**Your data is protected by:**
- ✅ Encrypted passwords
- ✅ Secure JWT tokens
- ✅ Row Level Security
- ✅ HTTPS in production
- ✅ Supabase enterprise security
- ✅ No data shared between users

**HIPAA Compliance Ready:**
- Audit logging available
- Access controls enforced
- Data encryption at rest and in transit
- User authentication required
- Session timeout configurable

## What's Next

### Features You Can Add
1. Multiple patients per user
2. Document upload (PDFs, images)
3. Custom forms for data entry
4. Reports and analytics
5. Medication reminders
6. Appointment scheduling
7. Family history tracking
8. Sharing with healthcare providers

### Customization Options
1. Change color scheme
2. Adjust node sizes in graphs
3. Modify physics parameters
4. Add custom entity types
5. Create custom views
6. Build dashboards

## Support Documentation

**Files to reference:**
- `HOW_TO_LOGIN.md` - Login instructions
- `LOGIN_VISUAL_GUIDE.md` - Login screen visuals
- `DASHBOARD_QUICK_START.md` - Dashboard features
- `DASHBOARD_VISUAL_GUIDE.md` - Dashboard layouts
- `DIGITAL_TWIN_SETUP_GUIDE.md` - Technical setup
- `MEDICAL_LETTER_EXTRACTION_SUMMARY.md` - Data structure
- `ACCESSING_THE_DASHBOARD.md` - Access guide

## Summary

You now have a complete digital twin medical records system that:
- ✅ Securely stores patient data
- ✅ Visualizes medical relationships
- ✅ Tracks treatment history
- ✅ Uses standard medical codes
- ✅ Protects privacy with RLS
- ✅ Provides three view modes
- ✅ Enables digital twin baselines
- ✅ Supports FHIR standards

**To get started right now:**
1. `npm run dev`
2. Create account
3. Sign in
4. Import data
5. Explore!

Welcome to your digital twin medical records system! 🎉
