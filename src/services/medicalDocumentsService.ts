import { supabase } from '../lib/supabase';

export interface MedicalDocumentCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  fhir_resource_type?: string;
  extraction_enabled: boolean;
  display_order: number;
  created_at: string;
}

export interface PatientMedicalDocument {
  id: string;
  patient_id: string;
  category_id?: string;
  title: string;
  description?: string;
  document_type: string;
  storage_path?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  content_text?: string;
  metadata?: Record<string, any>;
  fhir_resource_type?: string;
  fhir_resource_id?: string;
  document_date?: string;
  uploaded_at: string;
  extraction_status: 'pending' | 'processing' | 'completed' | 'failed' | 'manual';
  extraction_data?: Record<string, any>;
  tags?: string[];
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentExtraction {
  id: string;
  document_id: string;
  extraction_type: string;
  extracted_data: Record<string, any>;
  confidence_score?: number;
  fhir_resource_type?: string;
  fhir_resource_id?: string;
  verified: boolean;
  verified_by?: string;
  verified_at?: string;
  extraction_method: 'ai' | 'manual' | 'api';
  model_version?: string;
  created_at: string;
}

export interface DocumentSharingPermission {
  id: string;
  document_id: string;
  shared_by_user_id: string;
  shared_with_user_id: string;
  can_view: boolean;
  can_download: boolean;
  can_share: boolean;
  granted_at: string;
  expires_at?: string;
  revoked_at?: string;
  purpose?: string;
  notes?: string;
  access_count: number;
  last_accessed_at?: string;
  created_at: string;
}

export interface DocumentAccessLog {
  id: string;
  document_id: string;
  accessed_by: string;
  access_type: 'view' | 'download' | 'share' | 'edit' | 'delete';
  ip_address?: string;
  user_agent?: string;
  accessed_at: string;
}

class MedicalDocumentsService {
  private BUCKET_NAME = 'medical-documents';

  async getCategories(): Promise<MedicalDocumentCategory[]> {
    const { data, error } = await supabase
      .from('medical_document_categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    return data || [];
  }

  async getPatientDocuments(patientId: string): Promise<PatientMedicalDocument[]> {
    const { data, error } = await supabase
      .from('patient_medical_documents')
      .select('*')
      .eq('patient_id', patientId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching patient documents:', error);
      return [];
    }

    return data || [];
  }

  async getDocumentById(documentId: string): Promise<PatientMedicalDocument | null> {
    const { data, error } = await supabase
      .from('patient_medical_documents')
      .select('*')
      .eq('id', documentId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching document:', error);
      return null;
    }

    return data;
  }

  async uploadDocument(
    file: File,
    metadata: Partial<PatientMedicalDocument>
  ): Promise<PatientMedicalDocument | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const fileName = `${user.id}/${Date.now()}_${file.name}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return null;
      }

      const { data, error } = await supabase
        .from('patient_medical_documents')
        .insert({
          patient_id: user.id,
          title: metadata.title || file.name,
          description: metadata.description,
          document_type: metadata.document_type || 'other',
          category_id: metadata.category_id,
          storage_path: uploadData.path,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          document_date: metadata.document_date,
          tags: metadata.tags || [],
          metadata: metadata.metadata || {},
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating document record:', error);
        await supabase.storage.from(this.BUCKET_NAME).remove([fileName]);
        return null;
      }

      await this.logAccess(data.id, user.id, 'view');

      return data;
    } catch (error) {
      console.error('Error in uploadDocument:', error);
      return null;
    }
  }

  async downloadDocument(documentId: string): Promise<Blob | null> {
    try {
      const document = await this.getDocumentById(documentId);

      if (!document || !document.storage_path) {
        return null;
      }

      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .download(document.storage_path);

      if (error) {
        console.error('Error downloading document:', error);
        return null;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await this.logAccess(documentId, user.id, 'download');
      }

      return data;
    } catch (error) {
      console.error('Error in downloadDocument:', error);
      return null;
    }
  }

  async updateDocument(
    documentId: string,
    updates: Partial<PatientMedicalDocument>
  ): Promise<PatientMedicalDocument | null> {
    const { data, error } = await supabase
      .from('patient_medical_documents')
      .update(updates)
      .eq('id', documentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating document:', error);
      return null;
    }

    return data;
  }

  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      const document = await this.getDocumentById(documentId);

      if (!document) {
        return false;
      }

      if (document.storage_path) {
        await supabase.storage.from(this.BUCKET_NAME).remove([document.storage_path]);
      }

      const { error } = await supabase
        .from('patient_medical_documents')
        .delete()
        .eq('id', documentId);

      if (error) {
        console.error('Error deleting document:', error);
        return false;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await this.logAccess(documentId, user.id, 'delete');
      }

      return true;
    } catch (error) {
      console.error('Error in deleteDocument:', error);
      return false;
    }
  }

  async extractDocumentData(
    documentId: string,
    extractionType: string,
    extractedData: Record<string, any>,
    confidenceScore?: number
  ): Promise<DocumentExtraction | null> {
    const { data, error } = await supabase
      .from('document_extractions')
      .insert({
        document_id: documentId,
        extraction_type: extractionType,
        extracted_data: extractedData,
        confidence_score: confidenceScore,
        extraction_method: 'ai',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating extraction:', error);
      return null;
    }

    return data;
  }

  async getDocumentExtractions(documentId: string): Promise<DocumentExtraction[]> {
    const { data, error } = await supabase
      .from('document_extractions')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching extractions:', error);
      return [];
    }

    return data || [];
  }

  async verifyExtraction(
    extractionId: string,
    userId: string
  ): Promise<DocumentExtraction | null> {
    const { data, error } = await supabase
      .from('document_extractions')
      .update({
        verified: true,
        verified_by: userId,
        verified_at: new Date().toISOString(),
      })
      .eq('id', extractionId)
      .select()
      .single();

    if (error) {
      console.error('Error verifying extraction:', error);
      return null;
    }

    return data;
  }

  async shareDocument(
    documentId: string,
    sharedWithUserId: string,
    permissions: {
      can_view?: boolean;
      can_download?: boolean;
      can_share?: boolean;
      expires_at?: string;
      purpose?: string;
      notes?: string;
    }
  ): Promise<DocumentSharingPermission | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('document_sharing_permissions')
      .insert({
        document_id: documentId,
        shared_by_user_id: user.id,
        shared_with_user_id: sharedWithUserId,
        can_view: permissions.can_view ?? true,
        can_download: permissions.can_download ?? false,
        can_share: permissions.can_share ?? false,
        expires_at: permissions.expires_at,
        purpose: permissions.purpose,
        notes: permissions.notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sharing document:', error);
      return null;
    }

    await this.logAccess(documentId, user.id, 'share');

    return data;
  }

  async revokeSharing(sharingId: string): Promise<boolean> {
    const { error } = await supabase
      .from('document_sharing_permissions')
      .update({
        revoked_at: new Date().toISOString(),
      })
      .eq('id', sharingId);

    if (error) {
      console.error('Error revoking sharing:', error);
      return false;
    }

    return true;
  }

  async getDocumentSharing(documentId: string): Promise<DocumentSharingPermission[]> {
    const { data, error } = await supabase
      .from('document_sharing_permissions')
      .select('*')
      .eq('document_id', documentId)
      .is('revoked_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sharing permissions:', error);
      return [];
    }

    return data || [];
  }

  async logAccess(
    documentId: string,
    userId: string,
    accessType: 'view' | 'download' | 'share' | 'edit' | 'delete'
  ): Promise<void> {
    await supabase.from('document_access_log').insert({
      document_id: documentId,
      accessed_by: userId,
      access_type: accessType,
      user_agent: navigator.userAgent,
    });
  }

  async getAccessLog(documentId: string): Promise<DocumentAccessLog[]> {
    const { data, error } = await supabase
      .from('document_access_log')
      .select('*')
      .eq('document_id', documentId)
      .order('accessed_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching access log:', error);
      return [];
    }

    return data || [];
  }

  async parseLabResults(file: File): Promise<Record<string, any> | null> {
    try {
      const text = await file.text();

      const labResults = {
        test_date: new Date().toISOString().split('T')[0],
        results: [] as Array<{
          test_name: string;
          value: string;
          unit: string;
          reference_range: string;
          status: 'normal' | 'high' | 'low' | 'critical';
        }>,
      };

      const lines = text.split('\n');
      for (const line of lines) {
        const hemoglobinMatch = line.match(/hemoglobin[:\s]+(\d+\.?\d*)\s*([a-zA-Z/]+)/i);
        if (hemoglobinMatch) {
          labResults.results.push({
            test_name: 'Hemoglobin',
            value: hemoglobinMatch[1],
            unit: hemoglobinMatch[2] || 'g/dL',
            reference_range: '13.5-17.5 g/dL',
            status: parseFloat(hemoglobinMatch[1]) >= 13.5 && parseFloat(hemoglobinMatch[1]) <= 17.5 ? 'normal' : 'low',
          });
        }

        const glucoseMatch = line.match(/glucose[:\s]+(\d+\.?\d*)\s*([a-zA-Z/]+)/i);
        if (glucoseMatch) {
          labResults.results.push({
            test_name: 'Glucose',
            value: glucoseMatch[1],
            unit: glucoseMatch[2] || 'mg/dL',
            reference_range: '70-100 mg/dL',
            status: parseFloat(glucoseMatch[1]) >= 70 && parseFloat(glucoseMatch[1]) <= 100 ? 'normal' : 'high',
          });
        }
      }

      if (labResults.results.length === 0) {
        labResults.results.push({
          test_name: 'Manual Review Required',
          value: 'N/A',
          unit: '',
          reference_range: '',
          status: 'normal',
        });
      }

      return labResults;
    } catch (error) {
      console.error('Error parsing lab results:', error);
      return null;
    }
  }

  getCategoryIcon(categoryName: string): string {
    const icons: Record<string, string> = {
      'Lab Results': '🧪',
      'Imaging': '🔬',
      'Prescriptions': '💊',
      'Clinical Notes': '📝',
      'Discharge Summaries': '📋',
      'Vaccination Records': '💉',
      'Allergy Information': '⚠️',
      'Surgical Reports': '⚕️',
      'Insurance Documents': '🛡️',
      'Medical History': '📚',
    };
    return icons[categoryName] || '📄';
  }

  getCategoryColor(categoryName: string): string {
    const colors: Record<string, string> = {
      'Lab Results': 'blue',
      'Imaging': 'purple',
      'Prescriptions': 'green',
      'Clinical Notes': 'yellow',
      'Discharge Summaries': 'orange',
      'Vaccination Records': 'teal',
      'Allergy Information': 'red',
      'Surgical Reports': 'indigo',
      'Insurance Documents': 'slate',
      'Medical History': 'gray',
    };
    return colors[categoryName] || 'gray';
  }
}

export const medicalDocumentsService = new MedicalDocumentsService();
