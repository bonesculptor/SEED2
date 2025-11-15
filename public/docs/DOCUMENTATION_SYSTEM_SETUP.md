# Architecture Documentation System - Setup Guide

## Overview

The Architecture Documentation System provides role-based access to technical specifications, governance models, and implementation guides. Documents can be downloaded in Markdown or HTML/Word formats based on user permissions.

## Features

✅ **Role-Based Access Control** - Admin, Developer, Clinician, Researcher, Viewer roles
✅ **Access Level System** - 5 levels of clearance (1-5)
✅ **Document Categories** - Architecture, Technical, Governance, API, Deployment
✅ **Download Tracking** - Automatic tracking of all downloads
✅ **Multiple Formats** - Download as Markdown or HTML (convertible to Word)
✅ **Search & Filter** - Full-text search and category filtering
✅ **Profile Management** - User profiles with role and access level

## Database Schema

The system uses three main tables:

### 1. `user_profiles`
- Stores user role and access level
- Links to `auth.users` table
- Roles: admin, developer, clinician, researcher, viewer
- Access levels: 1-5

### 2. `documentation`
- Stores all documentation metadata and content
- Includes required role and access level
- Tracks download counts
- Supports public/private documents

### 3. `document_downloads`
- Tracks every document download
- Records user, timestamp, IP, user agent
- Automatically increments download count

## Setup Instructions

### Step 1: Run Database Migration

The database schema is already defined in:
```
supabase/migrations/20251115000000_create_documentation_system.sql
```

To apply the migration:

```bash
# If using Supabase CLI
supabase db push

# Or manually run the SQL in Supabase Studio
```

### Step 2: Initialize User Profiles

When a user first logs in, a profile is automatically created with:
- Role: `viewer`
- Access Level: `1`

To upgrade a user to admin:

```sql
UPDATE user_profiles
SET role = 'admin', access_level = 5
WHERE id = 'USER_ID_HERE';
```

### Step 3: Add Documentation

The AI Healthcare Governance Specification is automatically added during migration. To add more documents:

```sql
INSERT INTO documentation (
  title,
  description,
  category,
  file_type,
  content,
  required_role,
  required_access_level,
  version
) VALUES (
  'Your Document Title',
  'Document description',
  'architecture', -- or technical, governance, api, deployment
  'markdown',
  'Your markdown content here',
  ARRAY['admin', 'developer'], -- Roles that can access
  2, -- Minimum access level required
  '1.0.0'
);
```

## User Interface

### Accessing Documentation

1. **Log in** to the system
2. Click **"Documentation"** in the top navigation
3. Browse by category or search
4. Click download button for available documents

### Navigation

```
┌─────────────────────────────────────────────────────┐
│  Healthcare System    [Dashboard] [Documentation]   │
└─────────────────────────────────────────────────────┘

Architecture Documentation
├── Search Bar
├── Category Filter
├── Document Grid
│   ├── Document Card
│   │   ├── Title & Description
│   │   ├── Metadata (Category, Date, Downloads)
│   │   ├── Required Role & Access Level
│   │   └── Download Buttons (Markdown, HTML/Word)
│   └── ...
└── Legend (All, Architecture, Technical, etc.)
```

### User Profile Display

Your profile is shown in the top-right:
- **Role Badge** - Your current role
- **Access Level** - Your clearance level (1-5)

### Document Access

Documents show:
- ✅ **Green Download Buttons** - You have access
- 🔒 **Red "Access Denied"** - Insufficient permissions
- 📊 **Metadata** - Category, date, download count, required role/level

## Role Hierarchy

### Role Permissions

| Role       | Access Level | Can View               | Can Create | Can Edit | Can Delete |
|------------|--------------|------------------------|------------|----------|------------|
| **Admin**  | 5 (default)  | All documents          | ✅         | ✅       | ✅         |
| **Developer** | 3 (default) | Technical & architecture | ✅       | ✅       | ❌         |
| **Clinician** | 3 (default) | Clinical & user guides | ❌       | ❌       | ❌         |
| **Researcher** | 2 (default) | Research & governance | ❌        | ❌       | ❌         |
| **Viewer** | 1 (default)  | Public documents only  | ❌        | ❌       | ❌         |

### Access Level System

- **Level 1**: Public documentation only
- **Level 2**: General technical documentation
- **Level 3**: Detailed architecture and implementation guides
- **Level 4**: Sensitive governance and compliance documents
- **Level 5**: System administration and security documentation

## Document Categories

### Architecture
- System design specifications
- 9-level governance model
- Agent framework architecture
- Digital twin specifications

### Technical
- Python implementation guides
- API specifications
- Integration guides
- Code examples

### Governance
- Compliance requirements (GDPR, HIPAA, EU AI Act)
- Security policies
- Data governance frameworks
- Audit procedures

### API
- REST API documentation
- GraphQL schemas
- Authentication flows
- Rate limiting policies

### Deployment
- Docker configurations
- Kubernetes manifests
- CI/CD pipelines
- Environment setup

## Download Formats

### Markdown (.md)
- Raw markdown format
- Preserves all formatting
- Best for developers
- Can be edited in any text editor

### HTML/Word
- HTML format (viewable in Word)
- Preserves formatting
- Includes styles
- Ready for Microsoft Word import

**Note:** To convert HTML to proper DOCX, open in Microsoft Word and save as .docx

## API Usage

### Get User Profile

```typescript
import { documentationService } from './services/documentationService';

const profile = await documentationService.getUserProfile(userId);
console.log(profile.role, profile.access_level);
```

### List Available Documents

```typescript
const documents = await documentationService.listDocumentation(userId);
// Returns only documents user can access
```

### Download Document

```typescript
await documentationService.downloadDocument(documentId, userId);
// Automatically records download and increments count
```

### Check Access

```typescript
const doc = await documentationService.getDocumentById(documentId);
const profile = await documentationService.getUserProfile(userId);

const hasAccess =
  doc.is_public ||
  (doc.required_role.includes(profile.role) &&
   profile.access_level >= doc.required_access_level);
```

## Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access documents matching their role/level
- Admins have full access
- Public documents visible to all authenticated users

### Audit Trail
- Every download is logged with:
  - User ID
  - Document ID
  - Timestamp
  - IP address
  - User agent
- Download counts automatically updated

### Access Control
- Role-based permissions
- Hierarchical access levels
- Public/private document flags
- Fine-grained control per document

## Upgrading User Permissions

### Via SQL
```sql
-- Make user an admin
UPDATE user_profiles
SET role = 'admin', access_level = 5
WHERE id = 'USER_ID';

-- Make user a developer
UPDATE user_profiles
SET role = 'developer', access_level = 3
WHERE id = 'USER_ID';
```

### Via Admin Interface (Future Enhancement)
Admin users will be able to manage user roles through the UI.

## Troubleshooting

### Issue: User can't see any documents

**Solution:**
1. Check user profile exists:
   ```sql
   SELECT * FROM user_profiles WHERE id = 'USER_ID';
   ```

2. If missing, create profile:
   ```sql
   INSERT INTO user_profiles (id, role, access_level)
   VALUES ('USER_ID', 'viewer', 1);
   ```

### Issue: Document download fails

**Solution:**
1. Check document has content:
   ```sql
   SELECT id, title, content IS NOT NULL as has_content
   FROM documentation WHERE id = 'DOC_ID';
   ```

2. Verify user has access:
   ```sql
   SELECT up.role, up.access_level, d.required_role, d.required_access_level
   FROM user_profiles up, documentation d
   WHERE up.id = 'USER_ID' AND d.id = 'DOC_ID';
   ```

### Issue: "Access Denied" shown incorrectly

**Solution:**
Check if user's role is in required_role array:
```sql
SELECT
  up.role,
  d.required_role,
  up.role = ANY(d.required_role) as has_role_access,
  up.access_level >= d.required_access_level as has_level_access
FROM user_profiles up, documentation d
WHERE up.id = 'USER_ID' AND d.id = 'DOC_ID';
```

## Adding New Documents

### Method 1: SQL Insert

```sql
INSERT INTO documentation (
  title,
  description,
  category,
  file_type,
  content,
  required_role,
  required_access_level,
  version,
  is_public,
  created_by
) VALUES (
  'New Architecture Guide',
  'Detailed guide on system architecture',
  'architecture',
  'markdown',
  '# Architecture Guide\n\nYour content here...',
  ARRAY['admin', 'developer'],
  3,
  '1.0.0',
  false,
  'CREATOR_USER_ID'
);
```

### Method 2: Service API (Future)

```typescript
await documentationService.createDocumentation({
  title: 'New Architecture Guide',
  description: 'Detailed guide on system architecture',
  category: 'architecture',
  file_type: 'markdown',
  content: '# Architecture Guide\n\nYour content here...',
  required_role: ['admin', 'developer'],
  required_access_level: 3,
  version: '1.0.0',
  is_public: false,
  created_by: currentUser.id
});
```

## Best Practices

### Document Organization
1. Use clear, descriptive titles
2. Include comprehensive descriptions
3. Categorize appropriately
4. Version consistently (semantic versioning)
5. Mark public documents explicitly

### Access Control
1. Start with minimum required permissions
2. Use access levels for sensitivity (1=public, 5=highly sensitive)
3. Combine role and level requirements
4. Regular audit of permissions

### Content Management
1. Keep markdown content in database for quick access
2. Store large files externally if needed
3. Update version numbers when content changes
4. Archive old versions

## Future Enhancements

### Planned Features
- [ ] Document version history
- [ ] Comments and annotations
- [ ] Collaborative editing
- [ ] Document approval workflow
- [ ] Advanced search with filters
- [ ] Document tagging system
- [ ] Export to PDF
- [ ] Document templates
- [ ] Batch operations
- [ ] Admin UI for user management

## Summary

The Architecture Documentation System provides:

✅ **Secure access** to technical documentation
✅ **Role-based permissions** for different user types
✅ **Download tracking** for audit purposes
✅ **Multiple formats** for different use cases
✅ **Easy management** through SQL or API
✅ **Production-ready** with RLS and audit trails

Access the documentation through the **Documentation** tab in the navigation menu after logging in!
