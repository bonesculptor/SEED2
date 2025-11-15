import { supabase } from '../lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../..');

const docFiles = [
  { title: 'Complete System Specification', file: 'COMPLETE_SYSTEM_SPECIFICATION.md' },
  { title: 'System Architecture Review', file: 'ARCHITECTURE_REVIEW.md' },
  { title: 'Executive Summary', file: 'EXECUTIVE_SUMMARY.md' },
  { title: 'Complete User Guide', file: 'COMPLETE_USER_GUIDE.md' },
  { title: 'How to Use the System', file: 'HOW_TO_USE_SYSTEM.md' },
  { title: 'Dashboard Quick Start', file: 'DASHBOARD_QUICK_START.md' },
  { title: 'Developer Quick Start Guide', file: 'DEVELOPER_QUICK_START.md' },
  { title: 'AI Healthcare Governance System - Technical Specification', file: 'AI_HEALTHCARE_GOVERNANCE_SPECIFICATION.md' },
  { title: 'HIPAA-Compliant Personal Medical Record Specification', file: 'HIPAA_PMR_SPECIFICATION.md' },
  { title: 'Healthcare Protocol Hierarchy Documentation', file: 'PROTOCOLS.md' },
];

async function loadDocumentContent() {
  console.log('Loading document content from markdown files...\n');

  let updated = 0;
  let errors = 0;

  for (const doc of docFiles) {
    try {
      const filePath = path.join(PROJECT_ROOT, doc.file);

      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${doc.file}`);
        errors++;
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf-8');

      const { error } = await supabase
        .from('documentation')
        .update({ content })
        .eq('title', doc.title);

      if (error) {
        console.error(`❌ Error updating "${doc.title}":`, error.message);
        errors++;
      } else {
        console.log(`✅ Updated: ${doc.title} (${(content.length / 1024).toFixed(1)}KB)`);
        updated++;
      }
    } catch (err) {
      console.error(`❌ Error processing "${doc.title}":`, err);
      errors++;
    }
  }

  console.log(`\n📊 Summary: ${updated} updated, ${errors} errors`);
}

loadDocumentContent().catch(console.error);
