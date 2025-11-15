import { SupabaseClient } from '@supabase/supabase-js';
import { DocumentRepository, CreateDocumentData, UpdateDocumentData } from '../domain/repositories/DocumentRepository';

export class DocumentService {
  private repository: DocumentRepository;

  constructor(supabaseClient: SupabaseClient) {
    this.repository = new DocumentRepository(supabaseClient);
  }

  async getDocuments(userId: string) {
    return this.repository.findByUserId(userId);
  }

  async getDocument(id: string, userId: string) {
    return this.repository.findById(id, userId);
  }

  async createDocument(userId: string, documentData: CreateDocumentData) {
    return this.repository.create(userId, documentData);
  }

  async updateDocumentStatus(id: string, userId: string, status: 'pending' | 'processing' | 'completed' | 'failed', extractedData?: any) {
    const updateData: UpdateDocumentData = {
      extractionStatus: status,
    };

    if (extractedData !== undefined) {
      updateData.extractedData = extractedData;
    }

    return this.repository.update(id, userId, updateData);
  }

  async deleteDocument(id: string, userId: string) {
    return this.repository.delete(id, userId);
  }

  async extractDocument(documentId: string, userId: string): Promise<any> {
    await this.updateDocumentStatus(documentId, userId, 'processing');

    try {
      const document = await this.getDocument(documentId, userId);
      if (!document) {
        throw new Error('Document not found');
      }

      const extractedData = {
        text: 'Mock extraction - integration with actual OCR/extraction service needed',
        entities: [],
      };

      await this.updateDocumentStatus(documentId, userId, 'completed', extractedData);

      return extractedData;
    } catch (error) {
      await this.updateDocumentStatus(documentId, userId, 'failed');
      throw error;
    }
  }
}
