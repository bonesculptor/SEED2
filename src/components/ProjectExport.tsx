import { useState } from 'react';
import { projectExportService } from '../services/projectExportService';
import { Download, FileArchive, Database, Search } from 'lucide-react';

export function ProjectExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await projectExportService.triggerDownload(`project-export-${Date.now()}.json`);
      alert('Project exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleLoadStats = async () => {
    try {
      const fileStats = await projectExportService.getFileStats();
      setStats(fileStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
      alert('Failed to load statistics.');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await projectExportService.searchFiles(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      alert('Search failed. Please try again.');
    }
  };

  const handleFileSelect = async (filePath: string) => {
    try {
      const file = await projectExportService.getFileByPath(filePath);
      setSelectedFile(file);
    } catch (error) {
      console.error('Failed to load file:', error);
      alert('Failed to load file.');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileArchive className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Project Export</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-5 h-5" />
            {isExporting ? 'Exporting...' : 'Export Project as JSON'}
          </button>

          <button
            onClick={handleLoadStats}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Database className="w-5 h-5" />
            Load Statistics
          </button>
        </div>

        <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
          <p className="font-medium mb-2">Export Information:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Downloads all project files and structure as a JSON file</li>
            <li>Includes file metadata, content, and directory structure</li>
            <li>JSON can be processed to create a zip file</li>
            <li>Binary files are marked but not included in export</li>
          </ul>
        </div>
      </div>

      {stats && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Project Statistics</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.totalFiles}</div>
              <div className="text-sm text-gray-600">Total Files</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{formatBytes(stats.totalSize)}</div>
              <div className="text-sm text-gray-600">Total Size</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.textFiles}</div>
              <div className="text-sm text-gray-600">Text Files</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.binaryFiles}</div>
              <div className="text-sm text-gray-600">Binary Files</div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Files by Extension</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(stats.byExtension).map(([ext, count]: [string, any]) => (
                <div key={ext} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded">
                  <span className="text-sm text-gray-600">{ext || 'no ext'}</span>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Largest Files</h3>
            <div className="space-y-2">
              {stats.largestFiles.map((file: any, index: number) => (
                <div key={index} className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded">
                  <span className="text-sm text-gray-700 truncate flex-1">{file.path}</span>
                  <span className="text-sm font-medium text-gray-900 ml-4">{formatBytes(file.size)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Search Files</h2>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by filename or path..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Search className="w-5 h-5" />
            Search
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-2">
              Found {searchResults.length} file{searchResults.length !== 1 ? 's' : ''}
            </p>
            {searchResults.map((file) => (
              <div
                key={file.id}
                onClick={() => handleFileSelect(file.file_path)}
                className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{file.file_name}</div>
                  <div className="text-xs text-gray-500">{file.file_path}</div>
                </div>
                <div className="text-xs text-gray-500">{formatBytes(file.file_size)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedFile && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">File Preview</h2>

          <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Path:</span>
              <span className="ml-2 text-gray-600">{selectedFile.file_path}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Size:</span>
              <span className="ml-2 text-gray-600">{formatBytes(selectedFile.file_size)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Type:</span>
              <span className="ml-2 text-gray-600">{selectedFile.content_type}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Extension:</span>
              <span className="ml-2 text-gray-600">{selectedFile.file_extension || 'none'}</span>
            </div>
          </div>

          {!selectedFile.is_binary ? (
            <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-gray-800 whitespace-pre-wrap break-words">
                {selectedFile.content.length > 5000
                  ? selectedFile.content.substring(0, 5000) + '\n\n... (truncated)'
                  : selectedFile.content
                }
              </pre>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
              Binary file - preview not available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
