# Project Export System Guide

## Overview

The project has been configured with a comprehensive export system that imports all project files and structure into the Supabase database, enabling you to export the entire project as a JSON file that can be converted to a zip file.

## What Was Done

### 1. Database Schema Creation

Created three tables in Supabase:

- **project_files**: Stores all project files with their content, metadata, and file information
- **project_structure**: Stores the directory hierarchy of the project
- **export_snapshots**: Tracks export operations and maintains snapshot metadata

### 2. Data Import

Successfully imported **237 files** and **38 directories** from the project into the database:

- Total size: **2.59 MB**
- All file contents stored (except binary files which are marked)
- Complete directory structure preserved
- File metadata including size, type, extension tracked

### 3. Export Service

Created a comprehensive export service (`src/services/projectExportService.ts`) with features:

- Export all files and structure as JSON
- Search files by name or path
- Get file statistics and analytics
- Preview individual files
- Download project data

### 4. User Interface

Created a web interface (`src/components/ProjectExport.tsx`) with:

- One-click JSON export
- Project statistics dashboard
- File search functionality
- File preview capability
- Visual analytics

## How to Use

### Access the Export Interface

1. Start the application
2. Log in to your account
3. Click the **"Export"** button in the navigation menu

### Export Project Data

1. Click **"Export Project as JSON"** button
2. The browser will download a JSON file containing:
   - All 237 project files with their content
   - Complete directory structure
   - File metadata (size, type, path, etc.)
   - Export timestamp and statistics

### View Statistics

1. Click **"Load Statistics"** to see:
   - Total file count
   - Total project size
   - Files by extension breakdown
   - Largest files in the project

### Search Files

1. Enter a search term in the search box
2. Click **"Search"** or press Enter
3. View matching files
4. Click any file to preview its content

## Converting JSON to ZIP

The exported JSON file contains all the data needed to reconstruct the project. To convert it to a zip file:

### Option 1: Using Node.js Script

```javascript
const fs = require('fs');
const archiver = require('archiver');

const exportData = JSON.parse(fs.readFileSync('project-export.json', 'utf-8'));

const output = fs.createWriteStream('project.zip');
const archive = archiver('zip', { zlib: { level: 9 } });

archive.pipe(output);

exportData.files.forEach(file => {
  if (!file.is_binary) {
    archive.append(file.content, { name: file.file_path });
  }
});

archive.finalize();
```

### Option 2: Using Python Script

```python
import json
import zipfile

with open('project-export.json', 'r') as f:
    export_data = json.load(f)

with zipfile.ZipFile('project.zip', 'w', zipfile.ZIP_DEFLATED) as zipf:
    for file in export_data['files']:
        if not file['is_binary']:
            zipf.writestr(file['file_path'], file['content'])
```

## Re-importing Data

To import the project files again (if needed):

```bash
npx tsx src/scripts/importProjectFiles.ts
```

This will:
- Clear existing data in the database
- Re-scan the project directory
- Import all files and structure
- Create a new snapshot

## Database Access

You can also query the data directly using SQL:

```sql
-- Get all files
SELECT * FROM project_files ORDER BY file_path;

-- Get files by extension
SELECT file_name, file_path, file_size
FROM project_files
WHERE file_extension = '.ts';

-- Get directory structure
SELECT * FROM project_structure ORDER BY depth, path;

-- Get latest snapshot
SELECT * FROM export_snapshots ORDER BY created_at DESC LIMIT 1;
```

## API Usage

You can also use the export service programmatically:

```typescript
import { projectExportService } from './services/projectExportService';

// Export all data
const data = await projectExportService.exportProjectData();

// Get statistics
const stats = await projectExportService.getFileStats();

// Search files
const results = await projectExportService.searchFiles('component');

// Get specific file
const file = await projectExportService.getFileByPath('src/App.tsx');

// Trigger download
await projectExportService.triggerDownload('my-export.json');
```

## Files Created

### Database Migrations
- `supabase/migrations/create_file_storage_system.sql` - Initial schema
- `supabase/migrations/update_file_storage_policies.sql` - RLS policies

### Scripts
- `src/scripts/importProjectFiles.ts` - Import script

### Services
- `src/services/projectExportService.ts` - Export service

### Components
- `src/components/ProjectExport.tsx` - UI component

### Documentation
- `PROJECT_EXPORT_GUIDE.md` - This guide

## Benefits

1. **Complete Backup**: All project files safely stored in database
2. **Version Control**: Track changes over time with snapshots
3. **Easy Distribution**: Export as JSON for sharing or archiving
4. **Searchable**: Find files quickly across the entire project
5. **Analytics**: Understand project composition and size
6. **Platform Independent**: JSON format works everywhere

## Next Steps

Consider implementing:

- Automated scheduled exports
- Differential exports (only changed files)
- Compression for large files
- Direct zip generation in the browser
- Multi-version comparison
- Restore from export functionality

## Support

For issues or questions, refer to the main project documentation or check the database tables directly using the Supabase dashboard.
