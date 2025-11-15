# Documentation Population Guide

## Overview

The Architecture Documentation system now includes 22+ technical documents covering all aspects of the Personal Medical Record system. This guide explains how to populate and manage the documentation database.

---

## Quick Start

### Step 1: Ensure User Has Admin Access

To populate documentation, your user needs admin privileges:

```sql
-- Check current role
SELECT role, access_level FROM user_profiles WHERE id = auth.uid();

-- Upgrade to admin (run in Supabase SQL Editor)
UPDATE user_profiles
SET role = 'admin', access_level = 5
WHERE id = 'YOUR_USER_ID';
```

### Step 2: Navigate to Documentation Page

1. Log into the Personal Medical Record system
2. Click the **"Documentation"** tab in the navigation

### Step 3: Populate Documentation

1. Look for the green **"Populate Docs"** button (visible to admins only)
2. Click the button
3. Confirm the operation
4. Wait for the process to complete (usually 10-30 seconds)
5. You'll see a summary: Success/Errors/Total

### Step 4: Browse Documentation

After population, you'll see all available documents organized by category:
- Architecture (5 docs)
- Technical (11 docs)
- User Guide (5 docs)
- Governance (3 docs)
- Deployment (3 docs)

---

## Available Documents

### Architecture Category (Level 2+ Required)

1. **AI Healthcare Governance System - Technical Specification**
   - 100+ page comprehensive specification
   - 9-level protocol hierarchy
   - Python implementation guide
   - Roles: admin, developer, researcher

2. **SEED Framework Architecture Implementation**
   - SEED framework documentation
   - Agent governance model
   - Protocol hierarchy
   - Roles: admin, developer

3. **System Architecture Review**
   - Database design
   - Service layer architecture
   - Component structure
   - Roles: admin, developer

### Technical Category

4. **Healthcare Protocol Hierarchy Documentation**
   - HCP, MCP, TCP, BCP, DCP, ACP, GCP, ECP, GeoCP
   - Protocol relationships
   - Implementation patterns
   - Roles: admin, developer, researcher

5. **Documentation Management System - Setup Guide**
   - Role-based access control
   - Download capabilities
   - Security features
   - Roles: admin, developer

6. **Medical Documents & Records System - Complete Guide**
   - Upload and management
   - AI extraction
   - FHIR integration
   - Roles: admin, developer, clinician

7. **Predictive Digital Twin Implementation Guide**
   - AI-powered analytics
   - Predictive modeling
   - Health trends
   - Roles: admin, developer, researcher

8. **Large Language Model Integration Guide**
   - LLM integration
   - Document analysis
   - Clinical decision support
   - Roles: admin, developer

9. **Developer Quick Start Guide**
   - Setup instructions
   - Architecture overview
   - Key concepts
   - Roles: admin, developer

10. **SEED Framework Bundle Guide**
    - Reusable components
    - Bundle configuration
    - Integration
    - Roles: admin, developer

11. **Workflow Builder Guide**
    - Custom workflows
    - Healthcare automation
    - Process design
    - Roles: admin, developer, clinician

12. **RDF Export and Semantic Web Integration**
    - RDF export
    - Semantic web
    - Knowledge graphs
    - Roles: admin, developer

### Governance Category

13. **HIPAA-Compliant Personal Medical Record Specification**
    - HIPAA compliance
    - Security requirements
    - Privacy controls
    - Roles: admin, developer, clinician
    - Level 3+ required

14. **Executive Summary**
    - Business value
    - System capabilities
    - Strategic overview
    - Roles: admin, researcher

15. **Case Studies and Use Cases**
    - Real-world examples
    - Implementation stories
    - Best practices
    - Roles: admin, developer, researcher

### User Guide Category (Public - Level 1)

16. **Complete User Guide**
    - Full system walkthrough
    - Patient perspective
    - All features
    - Roles: ALL (public)

17. **User Guide - Getting Started**
    - Quick start for new users
    - Basic features
    - Navigation
    - Roles: ALL (public)

18. **How to Use the System**
    - Step-by-step instructions
    - Feature guides
    - Tips and tricks
    - Roles: ALL (public)

19. **Dashboard Quick Start**
    - Dashboard navigation
    - Interface overview
    - Quick actions
    - Roles: ALL (public)

### Deployment Category

20. **Digital Twin Setup and Configuration**
    - Setup instructions
    - Configuration options
    - Graph database
    - Roles: admin, developer

21. **Enterprise Deployment Guide**
    - Enterprise scaling
    - Security hardening
    - Compliance
    - Roles: admin, developer
    - Level 3+ required

22. **Ecosystem Configuration Guide**
    - Agent configuration
    - Protocol setup
    - Integration points
    - Roles: admin, developer

---

## Document Access Control

### Role-Based Access

Documents are restricted based on user role:

| Role | Access Description |
|------|-------------------|
| **Admin** | Full access to all documents |
| **Developer** | Technical and architecture docs |
| **Clinician** | Medical and user guides |
| **Researcher** | Research and governance docs |
| **Viewer** | Public documents only |

### Access Levels

Additional security through access levels (1-5):

| Level | Description |
|-------|-------------|
| **1** | Public documents |
| **2** | General technical documentation |
| **3** | Sensitive governance and compliance |
| **4** | Advanced security documentation |
| **5** | System administration |

### Example Access

**Scenario 1: Viewer (Level 1)**
- ✅ Can access: User guides
- ❌ Cannot access: Technical docs, architecture docs

**Scenario 2: Developer (Level 2)**
- ✅ Can access: Technical docs, architecture docs, user guides
- ❌ Cannot access: Level 3 governance docs

**Scenario 3: Admin (Level 5)**
- ✅ Can access: Everything

---

## Features

### 1. Search & Filter

**Search Bar:**
- Search document titles
- Search descriptions
- Search tags
- Real-time filtering

**Category Filter:**
- Filter by category
- View document counts
- Quick navigation

### 2. Download Options

Each accessible document offers:

**Markdown Format (.md):**
- Raw markdown
- Preserves formatting
- Developer-friendly
- Can be edited in any text editor

**HTML/Word Format:**
- Styled HTML
- Opens in Microsoft Word
- Professional formatting
- Save as .docx in Word

### 3. Document Metadata

Each document shows:
- Title and description
- Category and type
- Required role and access level
- Version number
- Upload date
- Download count
- Access statistics

### 4. Admin Features

**Populate Documentation:**
- One-click population
- Updates existing docs
- Inserts new docs
- Progress reporting

**Access Control:**
- Set required roles
- Set access levels
- Mark documents public/private
- Manage permissions

---

## Population Process

### What Happens When You Click "Populate Docs"

1. **Fetch Documents**
   - Reads 22+ markdown files from project
   - Validates file availability
   - Extracts content

2. **Check Existing**
   - Queries database for existing documents
   - Matches by title
   - Determines update vs. insert

3. **Update or Insert**
   - Updates content if document exists
   - Inserts new document if not found
   - Preserves download counts and stats

4. **Report Results**
   - Counts successes
   - Reports errors
   - Shows summary

### Population is Idempotent

Running "Populate Docs" multiple times is safe:
- Existing documents are updated
- New documents are inserted
- No duplicates created
- Download stats preserved

---

## Manual Document Management

### Add Custom Document

```typescript
import { documentationService } from './services/documentationService';

await documentationService.createDocumentation({
  title: 'Custom Implementation Guide',
  description: 'Guide for custom features',
  category: 'technical',
  file_type: 'markdown',
  content: '# Custom Guide\n\nYour content here...',
  required_role: ['admin', 'developer'],
  required_access_level: 2,
  version: '1.0.0',
  is_public: false,
  created_by: currentUser.id
});
```

### Update Document

```typescript
await documentationService.updateDocumentation(documentId, {
  content: updatedContent,
  version: '1.1.0',
  required_access_level: 3
});
```

### Delete Document

```typescript
await documentationService.deleteDocumentation(documentId);
```

---

## Troubleshooting

### Issue: "Populate Docs" button not visible

**Solution:**
Ensure user has admin role:
```sql
UPDATE user_profiles
SET role = 'admin', access_level = 5
WHERE id = 'YOUR_USER_ID';
```

### Issue: Population fails with errors

**Possible Causes:**
1. Files not accessible (check public folder)
2. Database connection issues
3. Insufficient permissions

**Solution:**
1. Check browser console for error details
2. Verify all .md files exist in project root
3. Check Supabase connection
4. Verify RLS policies are active

### Issue: Documents not appearing after population

**Solution:**
1. Refresh the page
2. Check user role and access level
3. Verify RLS policies:
   ```sql
   SELECT * FROM documentation WHERE id = 'DOC_ID';
   ```

### Issue: "Access Denied" for documents

**Solution:**
Check user's role and access level match document requirements:
```sql
SELECT
  d.title,
  d.required_role,
  d.required_access_level,
  up.role,
  up.access_level,
  up.role = ANY(d.required_role) as has_role,
  up.access_level >= d.required_access_level as has_level
FROM documentation d, user_profiles up
WHERE up.id = auth.uid() AND d.id = 'DOC_ID';
```

---

## Best Practices

### For Administrators

1. **Initial Setup:**
   - Populate documentation immediately after deployment
   - Verify all documents loaded successfully
   - Test access control with different roles

2. **Regular Updates:**
   - Re-populate when documentation changes
   - Update version numbers
   - Archive old versions if needed

3. **Access Management:**
   - Review user roles regularly
   - Adjust access levels as needed
   - Monitor download statistics

### For Developers

1. **Adding New Docs:**
   - Add to `populateDocumentation.ts`
   - Follow naming conventions
   - Set appropriate access levels

2. **Content Updates:**
   - Update markdown files in project root
   - Re-run population
   - Increment version numbers

3. **Custom Categories:**
   - Stick to existing categories
   - If new category needed, update schema

---

## Statistics and Monitoring

### View Download Statistics

```sql
-- Most popular documents
SELECT
  title,
  download_count,
  category
FROM documentation
ORDER BY download_count DESC
LIMIT 10;

-- Downloads by category
SELECT
  category,
  COUNT(*) as doc_count,
  SUM(download_count) as total_downloads
FROM documentation
GROUP BY category;
```

### View Access Logs

```sql
-- Recent document access
SELECT
  d.title,
  dl.access_type,
  dl.accessed_at
FROM document_downloads dl
JOIN documentation d ON d.id = dl.document_id
WHERE dl.user_id = auth.uid()
ORDER BY dl.accessed_at DESC
LIMIT 20;
```

---

## Summary

The Architecture Documentation system provides:

✅ **22+ comprehensive documents** covering all system aspects
✅ **One-click population** for easy setup
✅ **Role-based access control** for security
✅ **Multiple download formats** (Markdown, HTML/Word)
✅ **Search and filtering** for easy discovery
✅ **Access tracking** for audit compliance
✅ **Admin management** for document control

To get started:
1. Ensure admin access
2. Navigate to Documentation page
3. Click "Populate Docs"
4. Browse and download!

---

**Last Updated:** November 2025
**Version:** 1.0.0
**Status:** Production Ready ✅
