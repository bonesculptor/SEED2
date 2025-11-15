# How to Access and Use the Dashboard

## Quick Start (3 Steps)

### Step 1: Start the Development Server
```bash
npm run dev
```

You'll see output like:
```
> personal-health-record@0.0.0 dev
> vite

  VITE v5.4.8  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Step 2: Open Your Browser
Navigate to: **http://localhost:5173/**

### Step 3: Use the Dashboard
The dashboard will load immediately!

## What You'll See

### First Load (No Data)
```
═══════════════════════════════════════════════════════════════
  Digital Twin Dashboard              [Import Data] user@email
  Personal Health Record & Medical Graph Database
═══════════════════════════════════════════════════════════════

  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
  │  👤  │  │  🏥  │  │  💊  │  │  📄  │  │  📈  │  │  📅  │
  │   0  │  │   0  │  │   0  │  │   0  │  │   0  │  │   0  │
  │Pts   │  │Conds │  │Meds  │  │Procs │  │Obs   │  │Plans │
  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘

───────────────────────────────────────────────────────────────
  No Patient Data Yet

  🔷 Import Simon Grange's medical letter to get started

               [Import Demo Data]
───────────────────────────────────────────────────────────────
```

### After Importing Data
```
═══════════════════════════════════════════════════════════════
  Digital Twin Dashboard              [Import Data] user@email
  Personal Health Record & Medical Graph Database
═══════════════════════════════════════════════════════════════

  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
  │  👤  │  │  🏥  │  │  💊  │  │  📄  │  │  📈  │  │  📅  │
  │   1  │  │   4  │  │   8  │  │   2  │  │   3  │  │   1  │
  │Pts   │  │Conds │  │Meds  │  │Procs │  │Obs   │  │Plans │
  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘

───────────────────────────────────────────────────────────────
  Selected Patient

  ┌───┐
  │SG │  Dr. Simon Andre Welham Grange
  └───┘  DOB: 7/6/1966 | NHS: 450 437 4846 | Hospital: 39776265

───────────────────────────────────────────────────────────────
  Medical Graph Visualization

  [🔲 Graph View] [📅 Timeline] [🌌 Galaxy View]

  ┌─────────────────────────────────────────────────────────┐
  │                                                           │
  │                    👤                                     │
  │                  Patient                                  │
  │          (Simon Grange - Center)                         │
  │                    │                                      │
  │      ┌─────────────┼─────────────┐                      │
  │      │             │             │                       │
  │    🏥 CAD       ⚕️ CABG      💊 Aspirin                 │
  │                    │                                      │
  │    🏥 NSTEMI    ⚕️ Angio     💊 Statin                  │
  │                    │                                      │
  │    🏥 Pain      📊 Troponin  💊 Clopidogrel             │
  │                                                           │
  │  (Interactive: Click nodes to see details,               │
  │   drag to rearrange, explore relationships)              │
  │                                                           │
  └─────────────────────────────────────────────────────────┘

───────────────────────────────────────────────────────────────
```

## Step-by-Step Usage Guide

### 1. Import the Demo Data

**Click the green "Import Simon Grange Data" button**

You'll see:
```
Importing...
```

Then after a few seconds:
```
Import Result:

Digital Twin Baseline Created Successfully

Patient: Simon Grange
NHS Number: 450 437 4846
Baseline Date: 2025-03-05

Entities Created:
- Patient Record: 1
- Conditions: 4
- Procedures: 2
- Medications: 8
- Observations: 3
- Treatment Plan: 1
- Baseline Snapshot: 1

Key Diagnoses:
  • Triple vessel coronary artery disease
  • NSTEMI (Non-ST elevation myocardial infarction)
  • Post-operative chest infection
  • Sternal discomfort and soreness

Key Procedures:
  • Coronary angiography (2025-01-01)
  • CABG x3 (2025-01-08)

Current Medications: 8
```

### 2. Explore the Graph View

**The graph view loads automatically after import**

**What you see:**
- Central blue node = Patient (Simon Grange)
- Red nodes around it = Conditions
- Amber nodes = Procedures
- Green nodes = Medications
- Cyan nodes = Observations
- Purple node = Treatment Plan

**Try this:**
1. **Click the patient node** (center)
   - Details panel appears on the right
   - Shows patient name, DOB, NHS number

2. **Click a red condition node** (e.g., "Triple vessel CAD")
   - Details panel shows:
     - Condition name
     - ICD-10 code (I25.1)
     - Status: active
     - Severity: severe
     - Onset date

3. **Click a green medication node** (e.g., "Atorvastatin")
   - Details panel shows:
     - Dose: 80 mg
     - Frequency: OD (once daily)
     - Status: active

4. **Drag a node**
   - Click and hold any node
   - Move your mouse
   - The node follows
   - Physics simulation adjusts other nodes

### 3. Switch to Timeline View

**Click the "Timeline View" button**

**What you see:**
```
▼ 2025                                              4 records
  ├─ ▶ March                                        1 record
  └─ ▼ January                                      3 records
      ├─ ⚕️ CABG x3 Surgery - 8 Jan 2025
      │   Triple bypass surgery performed
      │
      ├─ 🔬 Coronary Angiography - 1 Jan 2025
      │   Revealed triple vessel disease
      │
      └─ 📊 Troponin Test - 1 Jan 2025
          Critical elevation: 350 ng/L

▼ 2024                                              1 record
  └─ ▼ December                                     1 record
      └─ 🏥 NSTEMI Presentation - 31 Dec 2024
          Chest pain, troponin rise
```

**Try this:**
1. **Click "▼ 2025"** to collapse the year
2. **Click "▶ January"** to expand the month
3. **Click on "CABG x3 Surgery"** to see full details
4. Scroll through the timeline chronologically

### 4. Try Galaxy View

**Click the "Galaxy View" button**

**What you see:**
- Similar to graph view but with different physics
- Nodes orbit and cluster naturally
- More dynamic movement
- Same interaction (click, drag)

### 5. Examine the Statistics

**Look at the 6 cards at the top:**

```
👤 1 Patient     - Simon Grange imported
🏥 4 Conditions  - CAD, NSTEMI, Infection, Pain
💊 8 Active Meds - Complete cardiac regimen
📄 2 Procedures  - Angiography + CABG
📈 3 Observations- Troponin, ECG, Pain assessment
📅 1 Active Plan - Post-CABG rehabilitation
```

These update in real-time as you add more data!

## Common Actions

### View Node Details
```
1. Click any node in graph/galaxy view
2. Details panel appears on the right
3. Shows all relevant information
4. Click elsewhere to close
```

### Navigate Timeline
```
1. Switch to timeline view
2. Expand/collapse years
3. Expand/collapse months
4. Click records for details
```

### Re-import Data
```
1. Click "Import Simon Grange Data" again
2. Creates a new patient record
3. Dashboard refreshes
4. Statistics update
```

### Switch Views
```
1. Use the three view buttons
2. Graph View = network diagram
3. Timeline View = chronological
4. Galaxy View = alternative network
```

## What Makes This Powerful

### 1. Complete Medical History in One View
- All diagnoses visible
- All procedures tracked
- All medications listed
- All observations recorded

### 2. Relationship Visualization
- See how conditions relate to procedures
- Understand medication purpose
- Track treatment effectiveness
- Identify patterns

### 3. Interactive Exploration
- Click to drill down
- Drag to reorganize
- Switch views for different perspectives
- Real-time updates

### 4. Digital Twin Baseline
- Captures complete state at a point in time
- Enables comparison over time
- Tracks recovery progress
- Measures treatment outcomes

### 5. Standards-Based
- ICD-10 diagnosis codes
- LOINC lab codes
- SNOMED clinical terms
- FHIR resource structure

## Browser Requirements

**Recommended:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Features used:**
- Canvas 2D rendering
- ES6+ JavaScript
- CSS Grid/Flexbox
- Local storage (for auth)

## Performance Notes

**Optimized for:**
- Up to 100 nodes in graph view
- Unlimited timeline records
- Real-time physics simulation
- Smooth 60fps rendering

**If experiencing lag:**
- Reduce number of visible nodes
- Use timeline view for large datasets
- Close other browser tabs
- Clear browser cache

## Authentication Note

The dashboard checks for authentication. If you see:
```
Authentication Required
Please log in to access the Digital Twin Dashboard
```

This means you need to set up authentication first. The dashboard will work once you have a valid Supabase session.

## Next Steps After Viewing

1. **Explore the data** - Click every node, expand every timeline item
2. **Understand relationships** - See how entities connect
3. **Try all three views** - Each offers unique insights
4. **Import your own data** - Use the parser for new medical letters
5. **Build on the foundation** - Add new features, customize visualizations

## Getting Help

**Check these files for more info:**
- `DASHBOARD_QUICK_START.md` - Detailed feature guide
- `DASHBOARD_VISUAL_GUIDE.md` - Visual layouts and diagrams
- `DIGITAL_TWIN_SETUP_GUIDE.md` - Complete setup documentation
- `MEDICAL_LETTER_EXTRACTION_SUMMARY.md` - Data structure details

**Console logs:**
- Open browser developer tools (F12)
- Check Console tab for import progress
- Look for any error messages
- See data loading confirmations

## Summary

To see the dashboard:
1. Run `npm run dev`
2. Open http://localhost:5173/
3. Click "Import Simon Grange Data"
4. Explore the three visualization modes
5. Click nodes to see details
6. Examine the complete medical graph database

The dashboard is your window into the digital twin system, providing interactive visualization of medical records, relationships, and the complete patient graph database!
