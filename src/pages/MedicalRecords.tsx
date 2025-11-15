import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Eye,
  Share2,
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Calendar,
  Tag,
  Users,
  Lock,
} from 'lucide-react';
import {
  medicalDocumentsService,
  MedicalDocumentCategory,
  PatientMedicalDocument,
  DocumentExtraction,
} from '../services/medicalDocumentsService';
import { supabase } from '../lib/supabase';

export function MedicalRecords() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<MedicalDocumentCategory[]>([]);
  const [documents, setDocuments] = useState<PatientMedicalDocument[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<PatientMedicalDocument | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        return;
      }

      setUser(currentUser);

      const [categoriesData, documentsData] = await Promise.all([
        medicalDocumentsService.getCategories(),
        medicalDocumentsService.getPatientDocuments(currentUser.id),
      ]);

      setCategories(categoriesData);
      setDocuments(documentsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(
    file: File,
    documentType: string,
    categoryId: string,
    title: string,
    description: string,
    documentDate: string,
    tags: string[]
  ) {
    if (!user) return;

    try {
      setUploadingFile(true);

      const document = await medicalDocumentsService.uploadDocument(file, {
        title,
        description,
        document_type: documentType,
        category_id: categoryId,
        document_date: documentDate,
        tags,
      });

      if (document) {
        if (documentType === 'lab_result' && file.type === 'text/plain') {
          const labData = await medicalDocumentsService.parseLabResults(file);
          if (labData) {
            await medicalDocumentsService.extractDocumentData(
              document.id,
              'lab_values',
              labData,
              0.85
            );
          }
        }

        await loadData();
        setShowUploadModal(false);
        alert('Document uploaded successfully!');
      } else {
        alert('Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file');
    } finally {
      setUploadingFile(false);
    }
  }

  async function handleDownload(document: PatientMedicalDocument) {
    const blob = await medicalDocumentsService.downloadDocument(document.id);

    if (blob) {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = document.file_name || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } else {
      alert('Failed to download document');
    }
  }

  async function handleDelete(documentId: string) {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    const success = await medicalDocumentsService.deleteDocument(documentId);

    if (success) {
      await loadData();
      setSelectedDocument(null);
    } else {
      alert('Failed to delete document');
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      categories.find((c) => c.id === doc.category_id)?.name === selectedCategory;

    const matchesSearch =
      searchQuery === '' ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const getExtractionStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-900/30 text-blue-400 border-blue-800',
      purple: 'bg-purple-900/30 text-purple-400 border-purple-800',
      green: 'bg-green-900/30 text-green-400 border-green-800',
      yellow: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
      orange: 'bg-orange-900/30 text-orange-400 border-orange-800',
      teal: 'bg-teal-900/30 text-teal-400 border-teal-800',
      red: 'bg-red-900/30 text-red-400 border-red-800',
      indigo: 'bg-indigo-900/30 text-indigo-400 border-indigo-800',
      slate: 'bg-slate-700 text-slate-300 border-slate-600',
      gray: 'bg-gray-700 text-gray-300 border-gray-600',
    };
    return colors[color] || colors.gray;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading medical records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">My Medical Records</h1>
              <p className="text-slate-400">
                Upload and manage your personal health documents securely
              </p>
            </div>

            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Upload Document
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{documents.length}</div>
              <div className="text-sm text-slate-400">Total Documents</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">
                {documents.filter((d) => d.extraction_status === 'completed').length}
              </div>
              <div className="text-sm text-slate-400">Processed</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-400">
                {documents.filter((d) => d.extraction_status === 'processing').length}
              </div>
              <div className="text-sm text-slate-400">Processing</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">{categories.length}</div>
              <div className="text-sm text-slate-400">Categories</div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search documents, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {medicalDocumentsService.getCategoryIcon(cat.name)} {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-5 gap-3 mb-8">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`p-4 rounded-lg border transition-all ${
              selectedCategory === 'all'
                ? 'bg-blue-900/30 border-blue-600 text-blue-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <FileText className="w-6 h-6 mx-auto mb-2" />
            <div className="text-sm font-medium">All</div>
            <div className="text-xs opacity-70 mt-1">{documents.length}</div>
          </button>

          {categories.slice(0, 4).map((category) => {
            const count = documents.filter((d) => d.category_id === category.id).length;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                className={`p-4 rounded-lg border transition-all ${
                  selectedCategory === category.name
                    ? `${getColorClass(category.color || 'gray')}`
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-2xl mx-auto mb-2">
                  {medicalDocumentsService.getCategoryIcon(category.name)}
                </div>
                <div className="text-sm font-medium">{category.name.split(' ')[0]}</div>
                <div className="text-xs opacity-70 mt-1">{count}</div>
              </button>
            );
          })}
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => {
            const category = categories.find((c) => c.id === doc.category_id);

            return (
              <div
                key={doc.id}
                className="bg-slate-900 border border-slate-800 rounded-lg p-6 hover:border-slate-700 transition-all"
              >
                {/* Document Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`p-3 rounded-lg ${
                        category ? getColorClass(category.color || 'gray') : 'bg-slate-800'
                      }`}
                    >
                      <div className="text-2xl">
                        {category
                          ? medicalDocumentsService.getCategoryIcon(category.name)
                          : '📄'}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white mb-1 truncate">
                        {doc.title}
                      </h3>
                      {doc.description && (
                        <p className="text-sm text-slate-400 line-clamp-2">{doc.description}</p>
                      )}
                    </div>
                  </div>

                  {getExtractionStatusIcon(doc.extraction_status)}
                </div>

                {/* Metadata */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {doc.document_date
                        ? new Date(doc.document_date).toLocaleDateString()
                        : 'No date'}
                    </span>
                  </div>

                  {category && (
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${getColorClass(
                          category.color || 'gray'
                        )}`}
                      >
                        {category.name}
                      </span>
                    </div>
                  )}

                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      {doc.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-slate-500">
                    {doc.file_type} • {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : 'N/A'}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedDocument(doc)}
                    className="flex-1 px-3 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="px-3 py-2 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* No Results */}
        {filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Documents Found</h3>
            <p className="text-slate-400 mb-4">
              {documents.length === 0
                ? 'Upload your first medical document to get started'
                : 'Try adjusting your search or filter'}
            </p>
            {documents.length === 0 && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upload Document
              </button>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          categories={categories}
          onClose={() => setShowUploadModal(false)}
          onUpload={handleFileUpload}
          uploading={uploadingFile}
        />
      )}

      {/* Document Detail Modal */}
      {selectedDocument && (
        <DocumentDetailModal
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onDownload={() => handleDownload(selectedDocument)}
          onDelete={() => handleDelete(selectedDocument.id)}
        />
      )}
    </div>
  );
}

function UploadModal({
  categories,
  onClose,
  onUpload,
  uploading,
}: {
  categories: MedicalDocumentCategory[];
  onClose: () => void;
  onUpload: (
    file: File,
    documentType: string,
    categoryId: string,
    title: string,
    description: string,
    documentDate: string,
    tags: string[]
  ) => void;
  uploading: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [documentType, setDocumentType] = useState('other');
  const [documentDate, setDocumentDate] = useState(new Date().toISOString().split('T')[0]);
  const [tags, setTags] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!file || !title || !categoryId) {
      alert('Please fill in all required fields');
      return;
    }

    const tagArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t);

    onUpload(file, documentType, categoryId, title, description, documentDate, tagArray);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Upload Medical Document</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select File *
              </label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              />
              {file && (
                <p className="text-sm text-slate-400 mt-2">
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Blood Test Results - Jan 2024"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description or notes..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">Select a category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {medicalDocumentsService.getCategoryIcon(cat.name)} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Document Type */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Document Type *
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              >
                <option value="lab_result">Lab Result</option>
                <option value="imaging">Imaging</option>
                <option value="prescription">Prescription</option>
                <option value="clinical_note">Clinical Note</option>
                <option value="discharge_summary">Discharge Summary</option>
                <option value="vaccination_record">Vaccination Record</option>
                <option value="allergy_info">Allergy Information</option>
                <option value="surgical_report">Surgical Report</option>
                <option value="pathology">Pathology</option>
                <option value="consent_form">Consent Form</option>
                <option value="insurance">Insurance</option>
                <option value="medical_history">Medical History</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Document Date */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Document Date
              </label>
              <input
                type="date"
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., annual checkup, routine, diabetes"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload Document
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function DocumentDetailModal({
  document,
  onClose,
  onDownload,
  onDelete,
}: {
  document: PatientMedicalDocument;
  onClose: () => void;
  onDownload: () => void;
  onDelete: () => void;
}) {
  const [extractions, setExtractions] = useState<DocumentExtraction[]>([]);

  useEffect(() => {
    loadExtractions();
  }, [document.id]);

  async function loadExtractions() {
    const data = await medicalDocumentsService.getDocumentExtractions(document.id);
    setExtractions(data);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">{document.title}</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-500 mb-1">Document Type</div>
                <div className="text-white">{document.document_type.replace('_', ' ')}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">Date</div>
                <div className="text-white">
                  {document.document_date
                    ? new Date(document.document_date).toLocaleDateString()
                    : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">File Type</div>
                <div className="text-white">{document.file_type}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">File Size</div>
                <div className="text-white">
                  {document.file_size ? `${(document.file_size / 1024).toFixed(1)} KB` : 'N/A'}
                </div>
              </div>
            </div>

            {/* Description */}
            {document.description && (
              <div>
                <div className="text-sm text-slate-500 mb-1">Description</div>
                <div className="text-white">{document.description}</div>
              </div>
            )}

            {/* Tags */}
            {document.tags && document.tags.length > 0 && (
              <div>
                <div className="text-sm text-slate-500 mb-2">Tags</div>
                <div className="flex gap-2 flex-wrap">
                  {document.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Extractions */}
            {extractions.length > 0 && (
              <div>
                <div className="text-sm text-slate-500 mb-2">Extracted Data</div>
                <div className="bg-slate-800 rounded-lg p-4">
                  {extractions.map((extraction) => (
                    <div key={extraction.id} className="mb-4 last:mb-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-white font-medium capitalize">
                          {extraction.extraction_type.replace('_', ' ')}
                        </span>
                        {extraction.verified && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        {extraction.confidence_score && (
                          <span className="text-xs text-slate-400">
                            {(extraction.confidence_score * 100).toFixed(0)}% confidence
                          </span>
                        )}
                      </div>
                      <pre className="text-sm text-slate-300 overflow-x-auto">
                        {JSON.stringify(extraction.extracted_data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={onDownload}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download
              </button>
              <button
                onClick={() => {
                  onDelete();
                  onClose();
                }}
                className="px-4 py-3 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
