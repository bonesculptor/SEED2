import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  role: 'admin' | 'developer' | 'clinician' | 'researcher' | 'viewer';
  organization?: string;
  department?: string;
  access_level: number;
  created_at: string;
  updated_at: string;
}

export interface Documentation {
  id: string;
  title: string;
  description?: string;
  category: 'architecture' | 'technical' | 'user_guide' | 'governance' | 'api' | 'deployment';
  file_path?: string;
  file_type: 'markdown' | 'pdf' | 'docx';
  content?: string;
  required_role: string[];
  required_access_level: number;
  version: string;
  is_public: boolean;
  download_count: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentDownload {
  id: string;
  document_id: string;
  user_id: string;
  ip_address?: string;
  user_agent?: string;
  downloaded_at: string;
}

class DocumentationService {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  }

  async createUserProfile(
    userId: string,
    profile: Partial<UserProfile>
  ): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        role: profile.role || 'viewer',
        organization: profile.organization,
        department: profile.department,
        access_level: profile.access_level || 1,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
      return null;
    }

    return data;
  }

  async updateUserProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return null;
    }

    return data;
  }

  async listDocumentation(userId: string): Promise<Documentation[]> {
    const { data, error } = await supabase
      .from('documentation')
      .select('*')
      .order('category', { ascending: true })
      .order('title', { ascending: true });

    if (error) {
      console.error('Error listing documentation:', error);
      console.error('Full error:', JSON.stringify(error, null, 2));
      return [];
    }

    console.log(`Fetched ${data?.length || 0} documents`);
    return data || [];
  }

  async getDocumentById(documentId: string): Promise<Documentation | null> {
    const { data, error } = await supabase
      .from('documentation')
      .select('*')
      .eq('id', documentId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching document:', error);
      return null;
    }

    return data;
  }

  async createDocumentation(
    doc: Omit<Documentation, 'id' | 'created_at' | 'updated_at' | 'download_count'>
  ): Promise<Documentation | null> {
    const { data, error } = await supabase
      .from('documentation')
      .insert(doc)
      .select()
      .single();

    if (error) {
      console.error('Error creating documentation:', error);
      return null;
    }

    return data;
  }

  async updateDocumentation(
    documentId: string,
    updates: Partial<Documentation>
  ): Promise<Documentation | null> {
    const { data, error } = await supabase
      .from('documentation')
      .update(updates)
      .eq('id', documentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating documentation:', error);
      return null;
    }

    return data;
  }

  async deleteDocumentation(documentId: string): Promise<boolean> {
    const { error } = await supabase
      .from('documentation')
      .delete()
      .eq('id', documentId);

    if (error) {
      console.error('Error deleting documentation:', error);
      return false;
    }

    return true;
  }

  async recordDownload(
    documentId: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('document_downloads')
      .insert({
        document_id: documentId,
        user_id: userId,
        ip_address: ipAddress,
        user_agent: userAgent,
      });

    if (error) {
      console.error('Error recording download:', error);
      return false;
    }

    return true;
  }

  async getDownloadHistory(userId: string): Promise<DocumentDownload[]> {
    const { data, error } = await supabase
      .from('document_downloads')
      .select('*')
      .eq('user_id', userId)
      .order('downloaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching download history:', error);
      return [];
    }

    return data || [];
  }

  async downloadDocument(documentId: string, userId: string): Promise<string | null> {
    const document = await this.getDocumentById(documentId);

    if (!document) {
      console.error('Document not found');
      return null;
    }

    await this.recordDownload(documentId, userId, undefined, navigator.userAgent);

    if (document.file_type === 'markdown' && document.content) {
      return document.content;
    }

    return null;
  }

  convertMarkdownToDocx(markdown: string, title: string): Blob {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 { font-size: 24pt; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    h2 { font-size: 20pt; color: #34495e; margin-top: 30px; }
    h3 { font-size: 16pt; color: #555; margin-top: 20px; }
    code { background-color: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace; }
    pre { background-color: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
    blockquote { border-left: 4px solid #3498db; margin-left: 0; padding-left: 20px; color: #555; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #3498db; color: white; }
  </style>
</head>
<body>
${this.simpleMarkdownToHtml(markdown)}
</body>
</html>
    `;

    return new Blob([htmlContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  private simpleMarkdownToHtml(markdown: string): string {
    let html = markdown;

    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');

    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');

    html = html.replace(/^\> (.+)$/gim, '<blockquote>$1</blockquote>');

    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    html = html.replace(/^\* (.+)$/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    html = html.replace(/^\d+\. (.+)$/gim, '<li>$1</li>');

    html = html.replace(/\n/g, '<br>');

    return html;
  }

  downloadAsFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const documentationService = new DocumentationService();
