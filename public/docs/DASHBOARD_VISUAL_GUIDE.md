# Digital Twin Dashboard - Visual Guide

## Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Digital Twin Dashboard                     [Import Data] user@email    │
│  Personal Health Record & Medical Graph Database                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐          │
│  │  👤  │  │  🏥  │  │  💊  │  │  📄  │  │  📈  │  │  📅  │          │
│  │   1  │  │   4  │  │   8  │  │   2  │  │   3  │  │   1  │          │
│  │Pts   │  │Conds │  │Meds  │  │Procs │  │Obs   │  │Plans │          │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘          │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  Selected Patient                                                        │
│  ┌───┐                                                                   │
│  │SG │  Dr. Simon Andre Welham Grange                                   │
│  └───┘  DOB: 7/6/1966  NHS: 450 437 4846  Hospital: 39776265          │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  Medical Graph Visualization                                            │
│  [🔲 Graph View] [📅 Timeline] [🌌 Galaxy View]                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │                    (Interactive Visualization Area)              │   │
│  │                                                                   │   │
│  │          • Nodes represent medical entities                      │   │
│  │          • Lines show relationships                              │   │
│  │          • Click to view details                                 │   │
│  │          • Drag to rearrange                                     │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Graph View Layout

```
                    ┌─────────────────────────────────────┐
                    │  PATIENT (Center)                   │
                    │  ┌────────┐                         │
                    │  │        │                         │
                    │  │   👤   │ Simon Grange           │
                    │  │        │                         │
                    │  └────────┘                         │
                    └──────────┬──────────────────────────┘
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
     ┌─────▼─────┐      ┌─────▼─────┐      ┌─────▼─────┐
     │CONDITIONS │      │PROCEDURES │      │MEDICATIONS│
     │  (Red)    │      │  (Amber)  │      │  (Green)  │
     ├───────────┤      ├───────────┤      ├───────────┤
     │ • CAD     │      │ • Angio   │      │ • Aspirin │
     │ • NSTEMI  │      │ • CABG x3 │      │ • Statin  │
     │ • Infect  │      └───────────┘      │ • Clopi   │
     │ • Pain    │                         │ • etc...  │
     └───────────┘                         └───────────┘
           │                                      │
           └──────────────┬──────────────────────┘
                          │
                   ┌──────▼──────┐
                   │OBSERVATIONS │
                   │   (Cyan)    │
                   ├─────────────┤
                   │ • Troponin  │
                   │ • ECG       │
                   │ • Pain Score│
                   └─────────────┘
```

## Timeline View Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ Timeline View                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ▼ 2025                                              4 records   │
│   ├─ ▼ March                                        1 record    │
│   │    └─ 💊 Follow-up Appointment - 24 Feb 2025              │
│   │        Post-CABG review, medications adjusted              │
│   │                                                             │
│   ├─ ▼ January                                      3 records   │
│   │    ├─ ⚕️ CABG x3 Surgery - 8 Jan 2025                     │
│   │    │   Triple bypass: LIMA→LAD, Radial→OM2, LSV→RCA       │
│   │    │                                                        │
│   │    ├─ 🔬 Coronary Angiography - 1 Jan 2025                │
│   │    │   Revealed triple vessel disease                      │
│   │    │                                                        │
│   │    └─ 📊 Troponin Test - 1 Jan 2025                       │
│   │        Value: 350 ng/L (Critical elevation)                │
│   │                                                             │
│ ▼ 2024                                              1 record    │
│   └─ ▼ December                                     1 record    │
│        └─ 🏥 NSTEMI Presentation - 31 Dec 2024                 │
│            Chest pain, troponin rise, ECG changes               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Node Details Panel

When you click a node, details appear on the right:

```
┌─────────────────────────────┐
│ 💊 Atorvastatin             │
│ medication                   │
├─────────────────────────────┤
│ Dose: 80 mg                 │
│ Frequency: OD               │
│ Status: active              │
│                             │
│ [Close Details]             │
└─────────────────────────────┘
```

```
┌─────────────────────────────┐
│ ⚕️ CABG x3                  │
│ procedure                    │
├─────────────────────────────┤
│ Date: 8 Jan 2025           │
│ Performer: Mr. Sabetai      │
│ Outcome: Successful         │
│                             │
│ Details:                    │
│ • LIMA → mid LAD            │
│ • Left Radial → OM2         │
│ • LSV → distal RCA          │
│                             │
│ [Close Details]             │
└─────────────────────────────┘
```

```
┌─────────────────────────────┐
│ 🏥 Triple Vessel CAD        │
│ condition                    │
├─────────────────────────────┤
│ Status: active              │
│ Severity: severe            │
│ Onset: 1 Jan 2025          │
│                             │
│ ICD-10: I25.1              │
│                             │
│ [Close Details]             │
└─────────────────────────────┘
```

## Color Legend

The dashboard uses consistent color coding:

```
┌─────────────────────────────────────────────────┐
│ Entity Types                                     │
├─────────────────────────────────────────────────┤
│ 🟦 Blue    → Patient                            │
│ 🟥 Red     → Conditions/Diagnoses               │
│ 🟧 Amber   → Procedures                         │
│ 🟩 Green   → Medications                        │
│ 🔷 Cyan    → Observations/Lab Results           │
│ 🟪 Purple  → Treatment Plans                    │
└─────────────────────────────────────────────────┘
```

## Import Flow Visualization

```
User clicks "Import Simon Grange Data"
         ↓
   [Processing...]
         ↓
┌─────────────────────────────┐
│ ✓ Patient Created           │
│ ✓ 4 Conditions Added        │
│ ✓ 2 Procedures Recorded     │
│ ✓ 8 Medications Set         │
│ ✓ 3 Observations Logged     │
│ ✓ 1 Treatment Plan Created  │
│ ✓ 15 Relationships Linked   │
│ ✓ 1 Baseline Established    │
└─────────────────────────────┘
         ↓
   Dashboard Refreshes
         ↓
   Statistics Update
         ↓
   Graph Visualization Appears
```

## Graph View - Entity Relationships

```
                    PATIENT
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   HAS_CONDITION  UNDERWENT_    TAKES_MEDICATION
        │         PROCEDURE          │
        ▼              │              ▼
   Conditions          │         Medications
        │              ▼              │
        │         Procedures          │
        │              │              │
        └──────────────┼──────────────┘
                       │
                  RELATED_TO
                       │
                       ▼
                 Observations
                       │
                  EVIDENCE_FOR
                       │
                       ▼
                Digital Twin Baseline
```

## Interactive Features Map

```
Dashboard Components:
┌──────────────────────────────────────────┐
│ 1. Stats Cards (Top)                     │
│    - Click: No action (display only)     │
│    - Auto-update: Yes                    │
│                                           │
│ 2. Patient Panel                         │
│    - Click: Future → patient selector    │
│    - Shows: Current patient info         │
│                                           │
│ 3. View Mode Buttons                     │
│    - Click: Switch visualization         │
│    - 3 modes available                   │
│                                           │
│ 4. Graph Canvas                          │
│    - Click node: Show details            │
│    - Drag node: Reposition               │
│    - Hover: Highlight                    │
│                                           │
│ 5. Timeline                              │
│    - Click year: Expand/collapse         │
│    - Click month: Expand/collapse        │
│    - Click record: Show details          │
│                                           │
│ 6. Import Button                         │
│    - Click: Import demo data             │
│    - Shows: Progress and result          │
└──────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────┐
│  Dashboard  │
└──────┬──────┘
       │
       ├─→ Load Statistics
       │   └─→ Count records in each table
       │
       ├─→ Load Patients
       │   └─→ Query patients table
       │
       ├─→ Load Patient Graph
       │   ├─→ Query conditions
       │   ├─→ Query procedures
       │   ├─→ Query medications
       │   ├─→ Query observations
       │   ├─→ Query encounters
       │   └─→ Query relationships
       │
       └─→ Render Visualization
           ├─→ Create nodes
           ├─→ Create edges
           ├─→ Apply physics
           └─→ Enable interaction
```

## Simon Grange Data Structure

After import, the graph looks like this:

```
                Simon Grange (Patient)
                        │
        ┌───────────────┼───────────────┐
        │               │               │
    Conditions      Procedures    Medications
        │               │               │
    ┌───┴───┐       ┌───┴───┐       ┌───┴───────┐
    │       │       │       │       │   │   │   │
  CAD   NSTEMI   Angio  CABG    Aspirin │ Clopi │
    │       │       │       │       │   │   │   │
    │   Infection  └───┬───┘    Statin  │ Ramip │
    │       │          │           │    │   │   │
  Pain      │          │        Amlodip  │  Biso │
    │       │          │           │    │   │   │
    └───────┴──────────┴───────────┴────┴───┴───┘
                       │
                  Observations
                       │
                ┌──────┼──────┐
                │      │      │
           Troponin  ECG   Pain Score
                │      │      │
                └──────┴──────┘
                       │
              Digital Twin Baseline
```

## Quick Reference

**View Modes:**
- 🔲 **Graph**: Force-directed network
- 📅 **Timeline**: Chronological history
- 🌌 **Galaxy**: Alternative network view

**Interactions:**
- **Click node**: View details
- **Drag node**: Reposition
- **Click timeline item**: Expand/view
- **Import button**: Load demo data

**Statistics Updated:**
- Patients
- Conditions (diagnoses)
- Active medications
- Procedures
- Observations (labs, vitals)
- Treatment plans

The dashboard provides a complete, interactive view of your medical graph database with multiple visualization options and real-time data updates.
