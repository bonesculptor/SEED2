import { supabase } from '../lib/supabase';

interface DocumentMetadata {
  title: string;
  description: string;
  category: 'architecture' | 'technical' | 'user_guide' | 'governance' | 'api' | 'deployment';
  required_role: string[];
  required_access_level: number;
  version: string;
  is_public: boolean;
  file_path: string;
}

const documents: DocumentMetadata[] = [
  {
    title: 'AI Healthcare Governance System - Technical Specification',
    description: 'Complete technical specification for implementing an AI-driven healthcare governance system based on the 9-level hierarchical model. Includes Python implementation, DevSecOps practices, digital twin integration, and security compliance.',
    category: 'architecture',
    required_role: ['admin', 'developer', 'researcher'],
    required_access_level: 2,
    version: '1.0.0',
    is_public: false,
    file_path: '/AI_HEALTHCARE_GOVERNANCE_SPECIFICATION.md',
  },
  {
    title: 'HIPAA-Compliant Personal Medical Record Specification',
    description: 'Comprehensive specification for HIPAA-compliant Personal Medical Record (PMR) system with security, privacy, and compliance requirements.',
    category: 'governance',
    required_role: ['admin', 'developer', 'clinician'],
    required_access_level: 3,
    version: '1.0.0',
    is_public: false,
    file_path: '/HIPAA_PMR_SPECIFICATION.md',
  },
  {
    title: 'SEED Framework Architecture Implementation',
    description: 'Complete architecture documentation for the SEED (Secure Enterprise Ecosystem Design) framework with agent governance, protocol hierarchy, and digital twin integration.',
    category: 'architecture',
    required_role: ['admin', 'developer'],
    required_access_level: 2,
    version: '1.0.0',
    is_public: false,
    file_path: '/SEED_ARCHITECTURE_IMPLEMENTATION.md',
  },
  {
    title: 'Healthcare Protocol Hierarchy Documentation',
    description: 'Documentation of the 9-level protocol hierarchy including HCP, MCP, TCP, BCP, DCP, ACP, GCP, ECP, and GeoCP protocols for healthcare governance.',
    category: 'technical',
    required_role: ['admin', 'developer', 'researcher'],
    required_access_level: 2,
    version: '1.0.0',
    is_public: false,
    file_path: '/PROTOCOLS.md',
  },
  {
    title: 'System Architecture Review',
    description: 'Comprehensive review of system architecture including database design, service layer, component structure, and integration patterns.',
    category: 'architecture',
    required_role: ['admin', 'developer'],
    required_access_level: 2,
    version: '1.0.0',
    is_public: false,
    file_path: '/ARCHITECTURE_REVIEW.md',
  },
  {
    title: 'Documentation Management System - Setup Guide',
    description: 'Complete setup and usage guide for the role-based documentation management system with download capabilities and access control.',
    category: 'technical',
    required_role: ['admin', 'developer'],
    required_access_level: 2,
    version: '1.0.0',
    is_public: false,
    file_path: '/DOCUMENTATION_SYSTEM_SETUP.md',
  },
  {
    title: 'Medical Documents & Records System - Complete Guide',
    description: 'Comprehensive guide for the medical documents management system including upload, AI extraction, FHIR integration, and security features.',
    category: 'technical',
    required_role: ['admin', 'developer', 'clinician'],
    required_access_level: 2,
    version: '1.0.0',
    is_public: false,
    file_path: '/MEDICAL_DOCUMENTS_COMPLETE_GUIDE.md',
  },
  {
    title: 'Predictive Digital Twin Implementation Guide',
    description: 'Guide for implementing and using the predictive digital twin system with AI-powered health analytics and predictive modeling.',
    category: 'technical',
    required_role: ['admin', 'developer', 'researcher'],
    required_access_level: 2,
    version: '1.0.0',
    is_public: false,
    file_path: '/PREDICTIVE_DIGITAL_TWIN_GUIDE.md',
  },
  {
    title: 'Digital Twin Setup and Configuration',
    description: 'Step-by-step guide for setting up and configuring the digital twin system with graph database integration.',
    category: 'deployment',
    required_role: ['admin', 'developer'],
    required_access_level: 2,
    version: '1.0.0',
    is_public: false,
    file_path: '/DIGITAL_TWIN_SETUP_GUIDE.md',
  },
  {
    title: 'Large Language Model Integration Guide',
    description: 'Guide for integrating LLMs into the healthcare system for document analysis, clinical decision support, and patient communication.',
    category: 'technical',
    required_role: ['admin', 'developer'],
    required_access_level: 2,
    version: '1.0.0',
    is_public: false,
    file_path: '/LLM_INTEGRATION_GUIDE.md',
  },
  {
    title: 'Enterprise Deployment Guide',
    description: 'Complete guide for deploying the system in enterprise environments with scaling, security, and compliance considerations.',
    category: 'deployment',
    required_role: ['admin', 'developer'],
    required_access_level: 3,
    version: '1.0.0',
    is_public: false,
    file_path: '/ENTERPRISE_DEPLOYMENT_GUIDE.md',
  },
  {
    title: 'Developer Quick Start Guide',
    description: 'Quick start guide for developers to get up and running with the codebase, including setup, architecture overview, and key concepts.',
    category: 'technical',
    required_role: ['admin', 'developer'],
    required_access_level: 1,
    version: '1.0.0',
    is_public: false,
    file_path: '/DEVELOPER_QUICK_START.md',
  },
  {
    title: 'Complete User Guide',
    description: 'Comprehensive user guide covering all features of the Personal Medical Record system from a patient perspective.',
    category: 'user_guide',
    required_role: ['viewer', 'clinician', 'researcher', 'developer', 'admin'],
    required_access_level: 1,
    version: '1.0.0',
    is_public: true,
    file_path: '/COMPLETE_USER_GUIDE.md',
  },
  {
    title: 'User Guide - Getting Started',
    description: 'Getting started guide for new users of the Personal Medical Record system.',
    category: 'user_guide',
    required_role: ['viewer', 'clinician', 'researcher', 'developer', 'admin'],
    required_access_level: 1,
    version: '1.0.0',
    is_public: true,
    file_path: '/USER_GUIDE.md',
  },
  {
    title: 'How to Use the System',
    description: 'Step-by-step instructions for using the main features of the Personal Medical Record system.',
    category: 'user_guide',
    required_role: ['viewer', 'clinician', 'researcher', 'developer', 'admin'],
    required_access_level: 1,
    version: '1.0.0',
    is_public: true,
    file_path: '/HOW_TO_USE_SYSTEM.md',
  },
  {
    title: 'Dashboard Quick Start',
    description: 'Quick start guide for navigating and using the dashboard interface.',
    category: 'user_guide',
    required_role: ['viewer', 'clinician', 'researcher', 'developer', 'admin'],
    required_access_level: 1,
    version: '1.0.0',
    is_public: true,
    file_path: '/DASHBOARD_QUICK_START.md',
  },
  {
    title: 'Executive Summary',
    description: 'High-level executive summary of the Personal Medical Record system, its capabilities, and business value.',
    category: 'governance',
    required_role: ['admin', 'researcher'],
    required_access_level: 1,
    version: '1.0.0',
    is_public: false,
    file_path: '/EXECUTIVE_SUMMARY.md',
  },
  {
    title: 'Case Studies and Use Cases',
    description: 'Real-world case studies and use cases demonstrating the system in action.',
    category: 'governance',
    required_role: ['admin', 'developer', 'researcher'],
    required_access_level: 1,
    version: '1.0.0',
    is_public: false,
    file_path: '/CASE_STUDIES.md',
  },
  {
    title: 'SEED Framework Bundle Guide',
    description: 'Guide for using the SEED framework as a bundled, reusable component across projects.',
    category: 'technical',
    required_role: ['admin', 'developer'],
    required_access_level: 2,
    version: '1.0.0',
    is_public: false,
    file_path: '/SEED_FRAMEWORK_BUNDLE_GUIDE.md',
  },
  {
    title: 'Workflow Builder Guide',
    description: 'Guide for using the workflow builder to create custom healthcare workflows and automation.',
    category: 'technical',
    required_role: ['admin', 'developer', 'clinician'],
    required_access_level: 2,
    version: '1.0.0',
    is_public: false,
    file_path: '/WORKFLOW_BUILDER_GUIDE.md',
  },
  {
    title: 'RDF Export and Semantic Web Integration',
    description: 'Guide for exporting healthcare data to RDF format and integrating with semantic web technologies.',
    category: 'technical',
    required_role: ['admin', 'developer'],
    required_access_level: 2,
    version: '1.0.0',
    is_public: false,
    file_path: '/RDF_EXPORT_GUIDE.md',
  },
  {
    title: 'Ecosystem Configuration Guide',
    description: 'Guide for configuring the healthcare ecosystem including agents, protocols, and integration points.',
    category: 'deployment',
    required_role: ['admin', 'developer'],
    required_access_level: 2,
    version: '1.0.0',
    is_public: false,
    file_path: '/ECOSYSTEM_CONFIGURATION_GUIDE.md',
  },
];

export async function populateDocumentation(currentUserId?: string): Promise<{
  success: number;
  errors: number;
  total: number;
}> {
  let successCount = 0;
  let errorCount = 0;

  console.log('📚 Starting documentation population...');

  for (const doc of documents) {
    try {
      const filePath = `/docs${doc.file_path}`;
      const response = await fetch(filePath);

      if (!response.ok) {
        console.warn(`⚠️  Could not fetch ${doc.file_path}: ${response.status}`);
        errorCount++;
        continue;
      }

      const content = await response.text();

      const { data: existing } = await supabase
        .from('documentation')
        .select('id')
        .eq('title', doc.title)
        .maybeSingle();

      if (existing) {
        const { error: updateError } = await supabase
          .from('documentation')
          .update({
            content,
            description: doc.description,
            category: doc.category,
            required_role: doc.required_role,
            required_access_level: doc.required_access_level,
            version: doc.version,
            is_public: doc.is_public,
            file_path: doc.file_path,
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error(`❌ Error updating ${doc.title}:`, updateError.message);
          errorCount++;
        } else {
          console.log(`✅ Updated: ${doc.title}`);
          successCount++;
        }
      } else {
        const { error: insertError } = await supabase.from('documentation').insert({
          title: doc.title,
          description: doc.description,
          category: doc.category,
          file_path: doc.file_path,
          file_type: 'markdown',
          content,
          required_role: doc.required_role,
          required_access_level: doc.required_access_level,
          version: doc.version,
          is_public: doc.is_public,
          created_by: currentUserId,
        });

        if (insertError) {
          console.error(`❌ Error inserting ${doc.title}:`, insertError.message);
          errorCount++;
        } else {
          console.log(`✅ Inserted: ${doc.title}`);
          successCount++;
        }
      }
    } catch (error) {
      console.error(`❌ Error processing ${doc.title}:`, error);
      errorCount++;
    }
  }

  console.log('\n📊 Population Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📄 Total: ${documents.length}`);

  return {
    success: successCount,
    errors: errorCount,
    total: documents.length,
  };
}
