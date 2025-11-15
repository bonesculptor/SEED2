import { supabase } from '../lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

interface DocumentMetadata {
  title: string;
  description: string;
  category: 'architecture' | 'technical' | 'user_guide' | 'governance' | 'api' | 'deployment';
  required_role: string[];
  required_access_level: number;
  version: string;
  is_public: boolean;
}

const documentMappings: Record<string, DocumentMetadata> = {
  'AI_HEALTHCARE_GOVERNANCE_SPECIFICATION.md': {
    title: 'AI Healthcare Governance System - Technical Specification',
    description: 'Complete technical specification for implementing an AI-driven healthcare governance system based on the 9-level hierarchical model. Includes Python implementation, DevSecOps practices, digital twin integration, and security compliance.',
    category: 'architecture',
    required_role: ['admin', 'developer', 'researcher'],
    required_access_level: 2,
    version: '1.0.0',
    is_public: false,
  },
  'HIPAA_PMR_SPECIFICATION.md': {
    title: 'HIPAA-Compliant Personal Medical Record Specification',
    description: 'Comprehensive specification for HIPAA-compliant Personal Medical Record (PMR) system with security, privacy, and compliance requirements.',
    category: 'governance',
    required_role: ['admin', 'developer', 'clinician'],
    required_access_level: 3,
    version: '1.0.0',
    is_public: false,
  },
  'SEED_ARCHITECTURE_IMPLEMENTATION.md': {
    title: 'SEED Framework Architecture Implementation',
    description: 'Complete architecture documentation for the SEED (Secure Enterprise Ecosystem Design) framework with agent governance, protocol hierarchy, and digital twin integration.',
    category: 'architecture',
    required_role: ['admin', 'developer'],
    required_access_level: 2,
    version: '1.0.0',
    is_public: false,
  },
  'PROTOCOLS.md': {
    title: 'Healthcare Protocol Hierarchy Documentation',
    description: 'Documentation of the 9-level protocol hierarchy including HCP, MCP, TCP, BCP, DCP, ACP, GCP, ECP, and GeoCP protocols for healthcare governance.',
    category: 'technical',
    required_role: ['admin', 'developer', 'researcher'],
    required_access_level: 2,
    version: '1.0.0',
    is_public: false,
  },
  'ARCHITECTURE_REVIEW.md': {
    title: 'System Architecture Review',
    description: 'Comprehensive review of system architecture including database design, service layer, component structure, and integration patterns.',
    category: 'architecture',
    required_role: ['admin', 'developer'],
    required_access_level: 2,
    version: '1.0.0',
    is_public: false,
  },
  'DOCUMENTATION_SYSTEM_SETUP.md': {
    title: 'Documentation Management System - Setup Guide',
    description: 'Complete setup and usage guide for the role-based documentation management system with download capabilities and access control.',
    category: 'technical',
    required_role: ['admin', 'developer'],
    required_access_level: 2,
    version: '1.0.0',
    is_public: false,
  },
  'MEDICAL_DOCUMENTS_COMPLETE_GUIDE.md': {
    title: 'Medical Documents & Records System - Complete Guide',
    description: 'Comprehensive guide for the medical documents management system including upload, AI extraction, FHIR integration, and security features.',
    category: 'technical',
    required_role: ['admin', 'developer', 'clinician'],
    required_access_level: 2,
    version: '1.0.0',
    is_public: false,
  },
  'PREDICTIVE_DIGITAL_TWIN_GUIDE.md': {
    title: 'Predictive Digital Twin Implementation Guide',
    description: 'Guide for implementing and using the predictive digital twin system with AI-powered health analytics and predictive modeling.',
    category: 'technical',
    required_role: ['admin', 'developer', 'researcher'],
    required_access_level: 2,
    version: '1.0.0',
    is_public: false,
  },
  'DIGITAL_TWIN_SETUP_GUIDE.md': {
    title: 'Digital Twin Setup and Configuration',
    description: 'Step-by-step guide for setting up and configuring the digital twin system with graph database integration.',
    category: 'deployment',
    required_role: ['admin', 'developer'],
    required_access_level: 2,
    version: '1.0.0',
    is_public: false,
  },
  'LLM_INTEGRATION_GUIDE.md': {
    title: 'Large Language Model Integration Guide',
    description: 'Guide for integrating LLMs into the healthcare system for document analysis, clinical decision support, and patient communication.',
    category: 'technical',
    required_role: ['admin', 'developer'],
    required_access_level: 2,
    version: '1.0.0',
    is_public: false,
  },
  'ENTERPRISE_DEPLOYMENT_GUIDE.md': {
    title: 'Enterprise Deployment Guide',
    description: 'Complete guide for deploying the system in enterprise environments with scaling, security, and compliance considerations.',
    category: 'deployment',
    required_role: ['admin', 'developer'],
    required_access_level: 3,
    version: '1.0.0',
    is_public: false,
  },
  'DEVELOPER_QUICK_START.md': {
    title: 'Developer Quick Start Guide',
    description: 'Quick start guide for developers to get up and running with the codebase, including setup, architecture overview, and key concepts.',
    category: 'technical',
    required_role: ['admin', 'developer'],
    required_access_level: 1,
    version: '1.0.0',
    is_public: false,
  },
  'COMPLETE_USER_GUIDE.md': {
    title: 'Complete User Guide',
    description: 'Comprehensive user guide covering all features of the Personal Medical Record system from a patient perspective.',
    category: 'user_guide',
    required_role: ['viewer', 'clinician', 'researcher', 'developer', 'admin'],
    required_access_level: 1,
    version: '1.0.0',
    is_public: true,
  },
  'USER_GUIDE.md': {
    title: 'User Guide - Getting Started',
    description: 'Getting started guide for new users of the Personal Medical Record system.',
    category: 'user_guide',
    required_role: ['viewer', 'clinician', 'researcher', 'developer', 'admin'],
    required_access_level: 1,
    version: '1.0.0',
    is_public: true,
  },
  'HOW_TO_USE_SYSTEM.md': {
    title: 'How to Use the System',
    description: 'Step-by-step instructions for using the main features of the Personal Medical Record system.',
    category: 'user_guide',
    required_role: ['viewer', 'clinician', 'researcher', 'developer', 'admin'],
    required_access_level: 1,
    version: '1.0.0',
    is_public: true,
  },
  'HOW_TO_LOGIN.md': {
    title: 'How to Login',
    description: 'Instructions for logging into the Personal Medical Record system.',
    category: 'user_guide',
    required_role: ['viewer', 'clinician', 'researcher', 'developer', 'admin'],
    required_access_level: 1,
    version: '1.0.0',
    is_public: true,
  },
  'DASHBOARD_QUICK_START.md': {
    title: 'Dashboard Quick Start',
    description: 'Quick start guide for navigating and using the dashboard interface.',
    category: 'user_guide',
    required_role: ['viewer', 'clinician', 'researcher', 'developer', 'admin'],
    required_access_level: 1,
    version: '1.0.0',
    is_public: true,
  },
  'README.md': {
    title: 'Project Overview and README',
    description: 'Main project overview, installation instructions, and getting started information.',
    category: 'technical',
    required_role: ['admin', 'developer'],
    required_access_level: 1,
    version: '1.0.0',
    is_public: false,
  },
  'EXECUTIVE_SUMMARY.md': {
    title: 'Executive Summary',
    description: 'High-level executive summary of the Personal Medical Record system, its capabilities, and business value.',
    category: 'governance',
    required_role: ['admin', 'researcher'],
    required_access_level: 1,
    version: '1.0.0',
    is_public: false,
  },
  'CASE_STUDIES.md': {
    title: 'Case Studies and Use Cases',
    description: 'Real-world case studies and use cases demonstrating the system in action.',
    category: 'governance',
    required_role: ['admin', 'developer', 'researcher'],
    required_access_level: 1,
    version: '1.0.0',
    is_public: false,
  },
  'PHASE1_DOCUMENTATION.md': {
    title: 'Phase 1 Implementation Documentation',
    description: 'Documentation of Phase 1 implementation including core features and initial deployment.',
    category: 'technical',
    required_role: ['admin', 'developer'],
    required_access_level: 2,
    version: '1.0.0',
    is_public: false,
  },
  'PHASE3_DOCUMENTATION.md': {
    title: 'Phase 3 Implementation Documentation',
    description: 'Documentation of Phase 3 implementation including advanced features and enterprise capabilities.',
    category: 'technical',
    required_role: ['admin', 'developer'],
    required_access_level: 2,
    version: '1.0.0',
    is_public: false,
  },
  'SEED_FRAMEWORK_BUNDLE_GUIDE.md': {
    title: 'SEED Framework Bundle Guide',
    description: 'Guide for using the SEED framework as a bundled, reusable component across projects.',
    category: 'technical',
    required_role: ['admin', 'developer'],
    required_access_level: 2,
    version: '1.0.0',
    is_public: false,
  },
};

async function populateDocumentation() {
  console.log('Starting documentation population...');

  const projectRoot = path.resolve(__dirname, '../../');
  let successCount = 0;
  let errorCount = 0;

  for (const [filename, metadata] of Object.entries(documentMappings)) {
    try {
      const filePath = path.join(projectRoot, filename);

      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filename}`);
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf-8');

      const { data: existing } = await supabase
        .from('documentation')
        .select('id')
        .eq('title', metadata.title)
        .maybeSingle();

      if (existing) {
        const { error: updateError } = await supabase
          .from('documentation')
          .update({
            content,
            description: metadata.description,
            category: metadata.category,
            required_role: metadata.required_role,
            required_access_level: metadata.required_access_level,
            version: metadata.version,
            is_public: metadata.is_public,
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error(`❌ Error updating ${filename}:`, updateError.message);
          errorCount++;
        } else {
          console.log(`✅ Updated: ${metadata.title}`);
          successCount++;
        }
      } else {
        const { error: insertError } = await supabase.from('documentation').insert({
          title: metadata.title,
          description: metadata.description,
          category: metadata.category,
          file_path: `/${filename}`,
          file_type: 'markdown',
          content,
          required_role: metadata.required_role,
          required_access_level: metadata.required_access_level,
          version: metadata.version,
          is_public: metadata.is_public,
        });

        if (insertError) {
          console.error(`❌ Error inserting ${filename}:`, insertError.message);
          errorCount++;
        } else {
          console.log(`✅ Inserted: ${metadata.title}`);
          successCount++;
        }
      }
    } catch (error) {
      console.error(`❌ Error processing ${filename}:`, error);
      errorCount++;
    }
  }

  console.log('\n📊 Population Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📄 Total: ${Object.keys(documentMappings).length}`);
}

populateDocumentation()
  .then(() => {
    console.log('\n✨ Documentation population complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
