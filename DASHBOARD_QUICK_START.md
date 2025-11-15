# Dashboard Quick Start Guide

## Overview

The Digital Twin Dashboard is now your main interface for accessing all medical record features, visualizations, and the graph database system.

## Dashboard Location

The dashboard is the default view when you open the application. It's located at:
```
src/pages/Dashboard.tsx
```

## What's on the Dashboard

### 1. Header Section
- **Title**: Digital Twin Dashboard
- **Subtitle**: Personal Health Record & Medical Graph Database
- **User Info**: Shows your logged-in email
- **Import Button**: Quick access to import Simon Grange's demo data

### 2. Statistics Overview (6 Cards)
Real-time statistics displayed in a grid:

- **Patients** (👤 Blue) - Total number of patients in your database
- **Conditions** (🏥 Red) - Active medical conditions and diagnoses
- **Active Meds** (💊 Green) - Current active medications
- **Procedures** (📄 Amber) - Surgical and medical procedures recorded
- **Observations** (📈 Cyan) - Clinical findings and lab results
- **Active Plans** (📅 Purple) - Active treatment plans

### 3. Patient Selection Panel
When you have patient data:
- Shows patient avatar (initials in a circle)
- Patient full name
- Date of birth
- NHS Number
- Hospital Number

### 4. Visualization Controls
Three view modes to explore your medical data:

**Graph View** (Network Icon)
- Interactive force-directed graph
- Shows all medical entities as nodes
- Displays relationships as edges
- Color-coded by entity type
- Drag and drop nodes
- Click nodes for details

**Timeline View** (Calendar Icon)
- Chronological display of medical events
- Grouped by year and month
- Expandable/collapsible sections
- Category-specific icons and colors
- Full event details

**Galaxy View** (Activity Icon)
- Alternative visualization of medical relationships
- Physics-based node positioning
- Interactive exploration
- Relationship lines between connected records

## How to Use the Dashboard

### Step 1: Access the Dashboard

Simply run your development server:
```bash
npm run dev
```

The dashboard will load automatically when you open the application.

### Step 2: Authentication

The dashboard checks for authentication automatically:
- If you're logged in: Full dashboard access
- If not logged in: Prompt to authenticate

### Step 3: Import Demo Data

To see the dashboard in action with real medical data:

1. **Click "Import Simon Grange Data"** button in the top right
2. Wait for the import to complete (takes a few seconds)
3. The dashboard will automatically reload with:
   - 1 Patient (Simon Grange)
   - 4 Conditions (Triple vessel CAD, NSTEMI, etc.)
   - 8 Active Medications
   - 2 Procedures (Angiogram, CABG x3)
   - 3 Observations (Troponin, ECG, Pain assessment)
   - 1 Active Treatment Plan

4. **View the Import Result** - A detailed summary will appear showing:
   - Patient ID
   - Baseline ID
   - All entities created
   - Complete breakdown of imported data

### Step 4: Explore Visualizations

**Graph View**:
1. Click "Graph View" button
2. You'll see:
   - Patient node in the center (large blue circle)
   - Conditions as red nodes
   - Procedures as amber nodes
   - Medications as green nodes
   - Observations as cyan nodes
   - Treatment plans as purple nodes
3. Click any node to see details in the panel on the right
4. Drag nodes to rearrange the graph
5. Watch the physics simulation create natural groupings

**Timeline View**:
1. Click "Timeline View" button
2. You'll see medical events grouped by year (2024, 2025)
3. Expand years to see months
4. Expand months to see individual events
5. Each event shows:
   - Date
   - Type (diagnosis, procedure, observation)
   - Description
   - Category icon

**Galaxy View**:
1. Click "Galaxy View" button
2. Similar to graph view but with different physics
3. Records form clusters naturally
4. Interactive exploration

### Step 5: Interact with Nodes

**In Graph View or Galaxy View**:
- **Click a node** → Details appear in the right panel
- **Drag a node** → Move it around the canvas
- **Hover** → See the node highlight

**Details Panel Shows**:
- Entity type and icon
- Name/title
- Status information
- Dates
- Specific details based on type:
  - **Conditions**: Status, severity, onset date
  - **Procedures**: Date, performer, outcome
  - **Medications**: Dose, frequency, status
  - **Observations**: Value, unit, interpretation

## Dashboard Features Explained

### Real-Time Statistics
The stats update automatically when:
- New data is imported
- Patients are added
- Records are created or updated

### Smart Data Loading
- Automatically loads the first patient when you have data
- Fetches complete graph data including all relationships
- Efficient querying from Supabase

### Import Function
The import button runs `storeLetterDataInDigitalTwin()` which:
1. Parses Simon Grange's medical letter
2. Creates patient record with demographics
3. Creates all conditions with ICD-10 codes
4. Creates procedures with details
5. Creates medication orders
6. Creates clinical observations
7. Links everything with relationships
8. Creates digital twin baseline snapshot

### Visualization Engine
- **Canvas-based rendering** for smooth performance
- **Physics simulation** for natural node positioning
- **Force-directed layout** in graph view
- **Relationship tracking** shows medical connections
- **Color coding** for easy entity identification

## Keyboard Shortcuts & Tips

**Navigation**:
- Use the three view buttons to switch between visualizations
- Scroll in timeline view to see more history
- Click anywhere outside nodes to deselect

**Performance**:
- Graph renders at 60fps with physics simulation
- Timeline loads all events but displays them efficiently
- Galaxy view optimized for large datasets

**Data Refresh**:
- Import button can be clicked multiple times (creates new patient each time)
- Dashboard auto-refreshes after import
- Statistics update in real-time

## Dashboard Data Flow

```
1. User loads dashboard
   ↓
2. Dashboard checks authentication
   ↓
3. Loads statistics from all tables
   ↓
4. Loads patient list
   ↓
5. Selects first patient (if available)
   ↓
6. Loads complete patient graph:
   - Conditions
   - Procedures
   - Medications
   - Observations
   - Encounters
   - Relationships
   - Treatment Plans
   ↓
7. Displays visualizations
   ↓
8. User interacts with nodes/records
   ↓
9. Dashboard shows details
```

## What You Can Do Next

### 1. Create Additional Features
- Add patient creation form
- Add medication management
- Add document upload
- Add export functionality

### 2. Customize Visualizations
- Adjust colors in the code
- Change node sizes
- Modify physics parameters
- Add custom filters

### 3. Extend the Data Model
- Add more observation types
- Include imaging reports
- Add lab result trends
- Include family history

### 4. Build Analytics
- Create dashboard widgets
- Add trend analysis
- Generate health scores
- Track medication adherence

## Troubleshooting

**Dashboard shows "No authenticated user"**:
- Check your Supabase configuration
- Ensure you have an active session
- Refresh the page

**Import button doesn't work**:
- Check browser console for errors
- Verify database connection
- Ensure Supabase tables exist

**Visualizations don't load**:
- Check if patient data exists
- Verify graph data is loaded
- Look for console errors

**Performance issues**:
- Large datasets may slow rendering
- Consider pagination for many patients
- Optimize queries if needed

## Code Structure

```
src/
├── pages/
│   └── Dashboard.tsx          ← Main dashboard component
├── components/
│   └── visualizations/
│       ├── DigitalTwinGraphView.tsx
│       ├── TimelineView.tsx
│       └── GalaxyView.tsx
├── services/
│   ├── digitalTwinService.ts  ← Database operations
│   └── medicalLetterParser.ts ← Data import
└── App.tsx                    ← Entry point (shows Dashboard)
```

## Next Steps

1. **Start the dev server**: `npm run dev`
2. **Open the dashboard**: Navigate to http://localhost:5173
3. **Import demo data**: Click the green import button
4. **Explore**: Try all three visualization modes
5. **Experiment**: Click nodes, drag them, explore relationships

The dashboard is your central hub for managing medical records and exploring the digital twin graph database. All features are integrated and ready to use!
