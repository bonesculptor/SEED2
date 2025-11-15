# Medical Letter Extraction - Simon Grange Case Summary

## Document Analyzed

**Source**: Follow-up Letter from Guy's and St Thomas' NHS Foundation Trust
**Date**: 5 March 2025
**Appointment Date**: 24 February 2025
**Clinician**: Dr Mohammad Salman, SpR in Cardiac Surgery

## Complete Clinical Picture Extracted

### Patient Profile
- **Full Name**: Dr. Simon Andre Welham Grange
- **Age**: 58 years (DOB: 7/6/1966)
- **Profession**: Orthopaedic Surgeon
- **NHS Number**: 450 437 4846
- **Hospital Number**: 39776265

### Clinical Timeline

#### 31 December 2024 - Initial Presentation (NSTEMI)
**Presenting Complaint**:
- Crushing chest pain radiating to arms, shoulders, and jaw
- Transferred from Conquest Hospital to NSTEMI pathway at St Thomas'

**Initial Investigations**:
- **Troponin**: Rose from 66 to 350 ng/L (critical elevation indicating MI)
- **ECG**: T-wave inversion laterally
- **Diagnosis**: NSTEMI (Non-ST Elevation Myocardial Infarction)

#### 1 January 2025 - Diagnostic Angiography
**Procedure**: Coronary angiography
**Finding**: Triple vessel coronary artery disease
**Outcome**: Urgent surgical revascularization recommended

#### 8 January 2025 - Surgical Intervention (CABG x3)
**Surgeon**: Mr. Sabetai
**Procedure**: Coronary Artery Bypass Graft (Triple bypass)

**Grafts Performed**:
1. **LIMA → mid LAD**
   - Target vessel: 2.5mm
   - Quality: Excellent target

2. **Left Radial → OM2**
   - Target vessel: 2.5mm
   - Quality: Excellent target

3. **Left Long Saphenous Vein → distal RCA**
   - Target vessel: 1.5mm (very small)
   - Run-off: Excellent

**Immediate Post-operative Course**:
- Complication: Chest infection
- Treatment: Antibiotics
- Outcome: Recovery uneventful, stable at discharge

#### 24 February 2025 - Follow-up Consultation
**Current Status**:
- Wounds: Healed
- Sternum: Stable
- Ongoing Issues: Discomfort and soreness in sternum
- Functional Limitation: Range and power still limited by pain

**Occupational Impact**:
- Unable to return to work as orthopaedic surgeon
- Recommendation: Refrain from work until full rehabilitation
- Alternative: Explore alternative roles or consider retirement

### Complete Medication Regimen

| Medication | Dose | Timing | Duration | Purpose |
|------------|------|--------|----------|---------|
| Amlodipine | 10 mg | OD | 6 months | Vein graft protection |
| Asprin | 75 mg | OD | Ongoing | Antiplatelet |
| Atorvastatin | 80 mg | OD | Ongoing | Lipid management |
| Bisoprolol | 3.75 mg | AM | Ongoing | Beta-blocker |
| Bisoprolol | 2.5 mg | PM | Ongoing | Beta-blocker |
| Clopidogrel | 75 mg | OD | 1 year | Antiplatelet (vein graft) |
| Pantoprazole | 40 mg | OD | Until Clopidogrel stops | GI protection |
| Ramipril | 1.25 mg | OD | Ongoing | ACE inhibitor |

**Planned Medication Changes**:
- **6 months**: Stop Amlodipine
- **1 year**: Stop Clopidogrel, then stop Pantoprazole
- **Ongoing**: May up-titrate Ramipril accordingly

### Structured Diagnoses (with ICD-10 Codes)

1. **Triple Vessel Coronary Artery Disease** (I25.1)
   - Severity: Severe
   - Status: Active, requires ongoing management
   - Treatment: CABG x3 completed

2. **NSTEMI** (I21.4)
   - Severity: Severe
   - Status: Resolved with surgical intervention
   - Biomarker: Troponin 66→350 ng/L

3. **Post-operative Chest Infection** (J95.851)
   - Severity: Moderate
   - Status: Resolved with antibiotics
   - Complication of: CABG surgery

4. **Sternal Discomfort/Pain** (R07.2)
   - Severity: Mild to moderate
   - Status: Active, improving
   - Impact: Limiting function and work capacity

### Graph Database Structure Created

The following interconnected entities have been created:

```
Patient (Simon Grange)
├── Conditions (4)
│   ├── Triple vessel CAD (I25.1)
│   ├── NSTEMI (I21.4)
│   ├── Post-op infection (J95.851)
│   └── Sternal pain (R07.2)
│
├── Procedures (2)
│   ├── Coronary angiography (01/01/2025)
│   └── CABG x3 (08/01/2025)
│       ├── LIMA → LAD
│       ├── Radial → OM2
│       └── LSV → RCA
│
├── Observations (3)
│   ├── Troponin T: 350 ng/L (LOINC: 6598-7)
│   ├── ECG: T-wave inversion
│   └── Sternal pain assessment
│
├── Medications (8)
│   ├── Amlodipine 10mg OD
│   ├── Asprin 75mg OD
│   ├── Atorvastatin 80mg OD
│   ├── Bisoprolol 3.75mg AM / 2.5mg PM
│   ├── Clopidogrel 75mg OD
│   ├── Pantoprazole 40mg OD
│   └── Ramipril 1.25mg OD
│
├── Encounters (1)
│   └── Post-CABG follow-up (24/02/2025)
│
├── Treatment Plan (1)
│   ├── Goal: Complete rehabilitation
│   ├── Goal: Medication optimization
│   └── Goal: Work capability assessment
│
└── Digital Twin Baseline (1)
    ├── Type: Post-treatment baseline
    ├── Date: 05/03/2025
    ├── Clinical State: Post-CABG with complications
    ├── Functional Status: Limited
    └── Source: FollowUpLetter20250224.pdf
```

### Relationships Captured

1. **Patient → Conditions**: Has diagnosis of each condition
2. **Patient → Procedures**: Underwent angiography and CABG
3. **Procedures → Conditions**: CABG treats triple vessel disease
4. **Patient → Medications**: Takes each medication
5. **Medications → Conditions**: Treats underlying cardiac disease
6. **Patient → Observations**: Has clinical findings
7. **Observations → Conditions**: Evidence for diagnoses
8. **Patient → Treatment Plan**: Follows rehabilitation plan
9. **Treatment Plan → Goals**: Addresses recovery objectives

### Clinical Coding Applied

**ICD-10 Diagnosis Codes**:
- I25.1 - Atherosclerotic heart disease of native coronary artery
- I21.4 - Non-ST elevation myocardial infarction
- J95.851 - Postprocedural pneumonia
- R07.2 - Precordial pain

**LOINC Observation Codes**:
- 6598-7 - Troponin T cardiac

**SNOMED CT Codes**:
- 22253000 - Pain

### Digital Twin Baseline Snapshot

The baseline captures:

**Vital Signs State**:
- Pain Level: Moderate
- Functional Capacity: Limited
- Sternum Stability: Stable
- Wound Healing: Complete

**Laboratory Results**:
- Troponin T: Peak 350 ng/L (from 66)

**Functional Status**:
- Range of Motion: Limited
- Power/Strength: Limited
- Pain Restriction: Significant
- Work Capacity: Unfit for orthopaedic surgery

**Treatment Goals**:
1. Complete cardiac rehabilitation
2. Achieve medication adherence
3. Assess work capability

**Timeline Projections**:
- 6 months: Stop Amlodipine
- 1 year: Stop Clopidogrel and Pantoprazole
- Ongoing: Monitor functional recovery

## How This Enables Digital Twin Capabilities

### 1. Baseline Tracking
The initial post-treatment baseline is established, enabling:
- Comparison of future states against this baseline
- Measurement of recovery trajectory
- Detection of deviations from expected progression

### 2. Predictive Modeling
With structured data, you can:
- Predict recovery timeline
- Identify risk factors for complications
- Model medication effectiveness
- Forecast functional capacity improvements

### 3. Personalized Care
The graph structure enables:
- Medication interaction analysis
- Treatment plan optimization
- Risk-adjusted recommendations
- Outcome prediction for decision support

### 4. Longitudinal Tracking
As new data arrives:
- Create follow-up baselines
- Compare functional status over time
- Track medication changes and effects
- Measure adherence to treatment plan
- Document milestone achievements

### 5. Evidence-Based Adjustments
The structured data supports:
- Protocol compliance checking
- Guideline adherence monitoring
- Outcome measurement
- Quality improvement analysis

## Data Access Summary

**All data is now available in Supabase tables**:
- `patients` - Patient demographics
- `conditions` - 4 diagnoses with ICD-10 codes
- `procedures` - 2 procedures (angiography, CABG)
- `medications` - 8 active medications
- `observations` - 3 clinical findings
- `encounters` - 1 follow-up visit
- `treatment_plans` - 1 active care plan
- `medical_relationships` - 15+ graph edges
- `digital_twin_baselines` - 1 post-treatment baseline

**Services Available**:
- `digitalTwinService` - CRUD operations for all entities
- `medicalLetterParser` - Extract data from clinical letters
- `fhirRDFService` - Convert to FHIR and RDF formats
- `llmWorkflowService` - Generate workflows from clinical data

**Visualizations Ready**:
- `DigitalTwinGraphView` - Interactive force-directed graph
- `TimelineView` - Chronological medical history
- `GalaxyView` - Relationship visualization

## Next Actions

1. **Import the data**: Run the import script to populate your database
2. **Explore the graph**: Use visualizations to understand relationships
3. **Add follow-up data**: Create new baselines as patient recovers
4. **Compare states**: Track progress against initial baseline
5. **Generate insights**: Use structured data for decision support
6. **Predict outcomes**: Build models for recovery trajectory

The digital twin baseline is now ready to serve as the foundation for tracking Simon Grange's post-CABG recovery and optimizing his treatment plan.
