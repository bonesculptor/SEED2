import { supabase } from '../lib/supabase';

interface ProjectFile {
  id: string;
  file_path: string;
  file_name: string;
  file_extension: string;
  content: string;
  content_type: string;
  file_size: number;
  is_binary: boolean;
  directory_path: string;
  created_at: string;
  updated_at: string;
}

interface ProjectStructure {
  id: string;
  path: string;
  parent_path: string | null;
  depth: number;
  created_at: string;
}

interface ExportSnapshot {
  id: string;
  snapshot_name: string;
  file_count: number;
  total_size: number;
  created_at: string;
  metadata: any;
}

interface ProjectExportData {
  files: ProjectFile[];
  structure: ProjectStructure[];
  snapshot: ExportSnapshot | null;
  metadata: {
    exportDate: string;
    totalFiles: number;
    totalSize: number;
    totalDirectories: number;
  };
}

export class ProjectExportService {
  async getAllFiles(): Promise<ProjectFile[]> {
    const { data, error } = await supabase
      .from('project_files')
      .select('*')
      .order('file_path');

    if (error) {
      throw new Error(`Failed to fetch files: ${error.message}`);
    }

    return data || [];
  }

  async getProjectStructure(): Promise<ProjectStructure[]> {
    const { data, error } = await supabase
      .from('project_structure')
      .select('*')
      .order('depth', { ascending: true })
      .order('path');

    if (error) {
      throw new Error(`Failed to fetch project structure: ${error.message}`);
    }

    return data || [];
  }

  async getLatestSnapshot(): Promise<ExportSnapshot | null> {
    const { data, error } = await supabase
      .from('export_snapshots')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch snapshot: ${error.message}`);
    }

    return data;
  }

  async exportProjectData(): Promise<ProjectExportData> {
    const files = await this.getAllFiles();
    const structure = await this.getProjectStructure();
    const snapshot = await this.getLatestSnapshot();

    const totalSize = files.reduce((sum, file) => sum + (file.file_size || 0), 0);

    return {
      files,
      structure,
      snapshot,
      metadata: {
        exportDate: new Date().toISOString(),
        totalFiles: files.length,
        totalSize,
        totalDirectories: structure.length,
      },
    };
  }

  async exportToJSON(): Promise<string> {
    const data = await this.exportProjectData();
    return JSON.stringify(data, null, 2);
  }

  generateZipStructure(files: ProjectFile[]): Record<string, string> {
    const zipStructure: Record<string, string> = {};

    files.forEach(file => {
      if (!file.is_binary) {
        zipStructure[file.file_path] = file.content;
      } else {
        zipStructure[file.file_path] = `[Binary file: ${file.file_name}]`;
      }
    });

    return zipStructure;
  }

  async getFilesByDirectory(directory: string): Promise<ProjectFile[]> {
    const { data, error } = await supabase
      .from('project_files')
      .select('*')
      .eq('directory_path', directory)
      .order('file_name');

    if (error) {
      throw new Error(`Failed to fetch files for directory ${directory}: ${error.message}`);
    }

    return data || [];
  }

  async getFileByPath(filePath: string): Promise<ProjectFile | null> {
    const { data, error } = await supabase
      .from('project_files')
      .select('*')
      .eq('file_path', filePath)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch file ${filePath}: ${error.message}`);
    }

    return data;
  }

  async searchFiles(query: string): Promise<ProjectFile[]> {
    const { data, error } = await supabase
      .from('project_files')
      .select('*')
      .or(`file_name.ilike.%${query}%,file_path.ilike.%${query}%`)
      .order('file_path');

    if (error) {
      throw new Error(`Failed to search files: ${error.message}`);
    }

    return data || [];
  }

  async getFileStats() {
    const files = await this.getAllFiles();

    const stats = {
      totalFiles: files.length,
      totalSize: files.reduce((sum, f) => sum + (f.file_size || 0), 0),
      binaryFiles: files.filter(f => f.is_binary).length,
      textFiles: files.filter(f => !f.is_binary).length,
      byExtension: {} as Record<string, number>,
      largestFiles: files
        .sort((a, b) => (b.file_size || 0) - (a.file_size || 0))
        .slice(0, 10)
        .map(f => ({
          path: f.file_path,
          size: f.file_size,
          extension: f.file_extension,
        })),
    };

    files.forEach(file => {
      const ext = file.file_extension || 'no-extension';
      stats.byExtension[ext] = (stats.byExtension[ext] || 0) + 1;
    });

    return stats;
  }

  async downloadProjectAsJSON(): Promise<Blob> {
    const jsonString = await this.exportToJSON();
    return new Blob([jsonString], { type: 'application/json' });
  }

  createDownloadLink(blob: Blob, filename: string): string {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    return url;
  }

  async triggerDownload(filename: string = 'project-export.json') {
    const blob = await this.downloadProjectAsJSON();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const projectExportService = new ProjectExportService();
