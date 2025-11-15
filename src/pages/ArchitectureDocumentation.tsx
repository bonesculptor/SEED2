import React, { useState, useEffect } from 'react';
import { FileText, Download, Shield, Users, Calendar, Eye, Search, Filter, RefreshCw, Upload } from 'lucide-react';
import { documentationService, Documentation, UserProfile } from '../services/documentationService';
import { populateDocumentation } from '../utils/populateDocumentation';
import { supabase } from '../lib/supabase';

export function ArchitectureDocumentation() {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Documentation[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const [populating, setPopulating] = useState(false);

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

      const profile = await documentationService.getUserProfile(currentUser.id);
      setUserProfile(profile);

      if (!profile) {
        await documentationService.createUserProfile(currentUser.id, {
          role: 'viewer',
          access_level: 1,
        });
      }

      const docs = await documentationService.listDocumentation(currentUser.id);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePopulateDocumentation() {
    if (!user || populating) return;

    if (!confirm('This will populate the documentation database with all available guides and specifications. Continue?')) {
      return;
    }

    try {
      setPopulating(true);
      const result = await populateDocumentation(user.id);

      alert(`Documentation populated!\n\nSuccess: ${result.success}\nErrors: ${result.errors}\nTotal: ${result.total}`);

      await loadData();
    } catch (error) {
      console.error('Error populating documentation:', error);
      alert('Error populating documentation. Check console for details.');
    } finally {
      setPopulating(false);
    }
  }

  async function handleDownload(document: Documentation, format: 'markdown' | 'docx') {
    if (!user) return;

    try {
      const content = await documentationService.downloadDocument(document.id, user.id);

      if (!content) {
        alert('Document content not available');
        return;
      }

      if (format === 'markdown') {
        documentationService.downloadAsFile(
          content,
          `${document.title.replace(/\s+/g, '_')}.md`,
          'text/markdown'
        );
      } else if (format === 'docx') {
        const docxBlob = documentationService.convertMarkdownToDocx(content, document.title);
        const url = window.URL.createObjectURL(docxBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${document.title.replace(/\s+/g, '_')}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      await loadData();
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Error downloading document');
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: 'all', label: 'All Documents', icon: FileText },
    { id: 'architecture', label: 'Architecture', icon: Shield },
    { id: 'technical', label: 'Technical', icon: FileText },
    { id: 'governance', label: 'Governance', icon: Users },
    { id: 'api', label: 'API', icon: FileText },
    { id: 'deployment', label: 'Deployment', icon: FileText },
  ];

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-900/30 text-red-400 border-red-800',
      developer: 'bg-blue-900/30 text-blue-400 border-blue-800',
      clinician: 'bg-green-900/30 text-green-400 border-green-800',
      researcher: 'bg-purple-900/30 text-purple-400 border-purple-800',
      viewer: 'bg-slate-700 text-slate-300 border-slate-600',
    };
    return colors[role] || colors.viewer;
  };

  const canAccessDocument = (doc: Documentation): boolean => {
    if (!userProfile) return false;
    if (doc.is_public) return true;

    const hasRole = doc.required_role.includes(userProfile.role) || doc.required_role.includes('viewer');
    const hasAccessLevel = userProfile.access_level >= doc.required_access_level;

    return hasRole && hasAccessLevel;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading documentation...</p>
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
              <h1 className="text-3xl font-bold text-white mb-2">Architecture Documentation</h1>
              <p className="text-slate-400">
                Access technical specifications, governance models, and implementation guides
              </p>
            </div>

            <div className="flex items-center gap-4">
              {userProfile && userProfile.role === 'admin' && (
                <>
                  <button
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Document
                  </button>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".md,.pdf,.docx"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) alert('Upload functionality coming soon');
                    }}
                  />
                  <button
                    onClick={handlePopulateDocumentation}
                    disabled={populating}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {populating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Populating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Populate Docs
                      </>
                    )}
                  </button>
                </>
              )}

              {userProfile && (
                <div className="text-right">
                  <div className="text-sm text-slate-500 mb-1">Your Profile</div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-lg border text-sm font-medium ${getRoleBadgeColor(
                        userProfile.role
                      )}`}
                    >
                      {userProfile.role.toUpperCase()}
                    </span>
                    <span className="px-3 py-1 rounded-lg border bg-slate-800 text-slate-300 border-slate-700 text-sm">
                      Level {userProfile.access_level}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search documentation..."
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
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
          {categories.map((category) => {
            const Icon = category.icon;
            const count = category.id === 'all'
              ? documents.length
              : documents.filter((d) => d.category === category.id).length;

            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-4 rounded-lg border transition-all ${
                  selectedCategory === category.id
                    ? 'bg-blue-900/30 border-blue-600 text-blue-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Icon className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-medium">{category.label}</div>
                <div className="text-xs opacity-70 mt-1">{count} docs</div>
              </button>
            );
          })}
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDocuments.map((doc) => {
            const hasAccess = canAccessDocument(doc);

            return (
              <div
                key={doc.id}
                className={`bg-slate-900 border rounded-lg p-6 ${
                  hasAccess ? 'border-slate-800' : 'border-slate-800 opacity-60'
                }`}
              >
                {/* Document Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-3 bg-blue-900/30 rounded-lg">
                      <FileText className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{doc.title}</h3>
                      <p className="text-sm text-slate-400 line-clamp-2">{doc.description}</p>
                    </div>
                  </div>

                  {!hasAccess && (
                    <div className="px-2 py-1 bg-red-900/30 text-red-400 text-xs rounded border border-red-800">
                      Restricted
                    </div>
                  )}
                </div>

                {/* Document Metadata */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Shield className="w-4 h-4" />
                      <span className="capitalize">{doc.category}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Eye className="w-4 h-4" />
                      <span>{doc.download_count} downloads</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Required Role:</span>
                    <div className="flex gap-1">
                      {doc.required_role.map((role) => (
                        <span
                          key={role}
                          className={`px-2 py-0.5 rounded text-xs ${getRoleBadgeColor(role)}`}
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-slate-500 ml-2">
                      Level {doc.required_access_level}+
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded">
                      v{doc.version}
                    </span>
                    <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded uppercase">
                      {doc.file_type}
                    </span>
                  </div>
                </div>

                {/* Download Buttons */}
                {hasAccess ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(doc, 'markdown')}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Markdown
                    </button>
                    <button
                      onClick={() => handleDownload(doc, 'docx')}
                      className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      HTML/Word
                    </button>
                  </div>
                ) : (
                  <div className="px-4 py-2 bg-red-900/20 border border-red-800 text-red-400 rounded-lg text-center text-sm">
                    Access Denied - Insufficient Permissions
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* No Results */}
        {filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Documents Found</h3>
            <p className="text-slate-400">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
