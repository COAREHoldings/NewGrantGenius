'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Aim } from './AIMEditor';

interface ParsedAim {
  number: number;
  title: string;
  content: string;
  hypothesis?: string;
}

interface ParsedDocument {
  fullText: string;
  aims: ParsedAim[];
  projectTitle?: string;
  significance?: string;
  innovation?: string;
  approach?: string;
}

interface PDFUploaderProps {
  onParsed: (aims: Aim[], fullText: string) => void;
  onProjectTitleFound?: (title: string) => void;
}

export default function PDFUploader({ onParsed, onProjectTitleFound }: PDFUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    parsed?: ParsedDocument;
    error?: string;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadResult({ success: false, error: 'Please upload a PDF file.' });
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse PDF');
      }

      setUploadResult({ success: true, parsed: data.parsed });
      setShowPreview(true);

      if (data.parsed.projectTitle && onProjectTitleFound) {
        onProjectTitleFound(data.parsed.projectTitle);
      }
    } catch (error) {
      setUploadResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to parse PDF' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const confirmImport = () => {
    if (!uploadResult?.parsed) return;

    const aims: Aim[] = uploadResult.parsed.aims.map((a, i) => ({
      id: Date.now().toString() + i,
      number: a.number,
      title: a.title,
      rationale: '',
      hypothesis: a.hypothesis || '',
      approach: ''
    }));

    if (aims.length === 0) {
      aims.push({
        id: Date.now().toString(),
        number: 1,
        title: '',
        rationale: '',
        hypothesis: '',
        approach: ''
      });
    }

    onParsed(aims, uploadResult.parsed.fullText);
    setShowPreview(false);
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
          isDragging 
            ? 'border-indigo-500 bg-indigo-50' 
            : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleInputChange}
          className="hidden"
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm text-gray-600">Parsing PDF...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className={`w-8 h-8 ${isDragging ? 'text-indigo-600' : 'text-gray-400'}`} />
            <p className="text-sm font-medium text-gray-700">
              Drop your Specific Aims PDF here, or click to browse
            </p>
            <p className="text-xs text-gray-500">
              We will extract your aims and auto-populate the fields
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {uploadResult && !uploadResult.success && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {uploadResult.error}
        </div>
      )}

      {/* Success Preview */}
      {uploadResult?.success && showPreview && uploadResult.parsed && (
        <div className="border rounded-lg overflow-hidden">
          <div 
            className="flex items-center justify-between p-3 bg-green-50 cursor-pointer"
            onClick={() => setShowPreview(!showPreview)}
          >
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">PDF Parsed Successfully</span>
              <span className="text-sm">({uploadResult.parsed.aims.length} aims found)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); setUploadResult(null); setShowPreview(false); }}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
              {showPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>

          {showPreview && (
            <div className="p-4 space-y-4">
              {uploadResult.parsed.projectTitle && (
                <div className="p-2 bg-blue-50 rounded text-sm">
                  <span className="font-medium text-blue-700">Project Title: </span>
                  <span className="text-blue-800">{uploadResult.parsed.projectTitle}</span>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">Extracted Aims:</h4>
                {uploadResult.parsed.aims.map((aim, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-800">Aim {aim.number}: {aim.title}</p>
                        {aim.hypothesis && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Hypothesis:</span> {aim.hypothesis}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {uploadResult.parsed.aims.length === 0 && (
                  <p className="text-sm text-amber-600 p-2 bg-amber-50 rounded">
                    No structured aims were detected. The full text will still be imported.
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={confirmImport}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Import & Populate Fields
                </button>
                <button
                  onClick={() => { setUploadResult(null); setShowPreview(false); }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
