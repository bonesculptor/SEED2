import { BaseRepository } from './BaseRepository';

export interface DocumentFile {
  id: string;
  userId: string;
  filename: string;
  storagePath: string;
  mimeType: string;
  fileSize?: number;
  extractionStatus: 'pending' | 'processing' | 'completed' | 'failed';
  extractedData?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentData {
  filename: string;
  storagePath: string;
  mimeType: string;
  fileSize?: number;
}

export interface UpdateDocumentData {
  extractionStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  extractedData?: any;
}

export class DocumentRepository extends BaseRepository<DocumentFile> {
  private readonly tableName = 'document_files';

  async findByUserId(userId: string): Promise<DocumentFile[]> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      this.handleError(error, 'fetch documents');
    }

    return (data || []).map(this.toDomain);
  }

  async findById(id: string, userId: string): Promise<DocumentFile | null> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      this.handleError(error, 'fetch document');
    }

    return data ? this.toDomain(data) : null;
  }

  async create(userId: string, documentData: CreateDocumentData): Promise<DocumentFile> {
    const { data, error } = await this.db
      .from(this.tableName)
      .insert({
        user_id: userId,
        filename: documentData.filename,
        storage_path: documentData.storagePath,
        mime_type: documentData.mimeType,
        file_size: documentData.fileSize,
        extraction_status: 'pending',
      })
      .select()
      .single();

    if (error) {
      this.handleError(error, 'create document');
    }

    return this.toDomain(data);
  }

  async update(id: string, userId: string, documentData: UpdateDocumentData): Promise<DocumentFile> {
    const updateData: Record<string, unknown> = {};

    if (documentData.extractionStatus !== undefined) {
      updateData.extraction_status = documentData.extractionStatus;
    }
    if (documentData.extractedData !== undefined) {
      updateData.extracted_data = documentData.extractedData;
    }

    const { data, error } = await this.db
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      this.handleError(error, 'update document');
    }

    return this.toDomain(data);
  }

  async delete(id: string, userId: string): Promise<void> {
    const { error } = await this.db
      .from(this.tableName)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      this.handleError(error, 'delete document');
    }
  }

  private toDomain(row: any): DocumentFile {
    return {
      id: row.id,
      userId: row.user_id,
      filename: row.filename ?? '',
      storagePath: row.storage_path ?? '',
      mimeType: row.mime_type ?? 'application/pdf',
      fileSize: row.file_size,
      extractionStatus: row.extraction_status ?? 'pending',
      extractedData: row.extracted_data,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
