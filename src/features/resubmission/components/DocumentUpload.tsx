'use client';

import { useRef, useState } from 'react';
import { Upload, FileText, AlertTriangle, Check } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

interface Props {
  onGrantUpload: (file: File, text: string) => void;
  onSummaryUpload: (file: File, text: string) => void;
  onSubmissionTypeChange: (type: 'A0-A1' | 'A1-new') => void;
  onPreviousScoreChange: (score: number | null) => void;
  grantFile: File | null;
  summaryFile: File | null;
  submissionType: 'A0-A1' | 'A1-new' | null;
  previousScore: number | null;
}

async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  const data = new Uint8Array(buffer);
  const doc = await pdfjs.getDocument({ data, verbosity: 0 }).promise;
  let text = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .filter((item): item is TextItem => 'str' in item)
      .map((item) => item.str)
      .join(' ');
    text += pageText + '\n';
  }
  await doc.destroy();
  return text;
}

export default function DocumentUpload({
  onGrantUpload,
  onSummaryUpload,
  onSubmissionTypeChange,
  onPreviousScoreChange,
  grantFile,
  summaryFile,
  submissionType,
  previousScore,
}: Props) {
  const grantInputRef = useRef<HTMLInputElement>(null);
  const summaryInputRef = useRef<HTMLInputElement>(null);
  const [extracting, setExtracting] = useState<'grant' | 'summary' | null>(null);

  const handleFileUpload = async (
    file: File,
    type: 'grant' | 'summary'
  ) => {
    setExtracting(type);
    try {
      const buffer = await file.arrayBuffer();
      let text = '';
      if (file.name.toLowerCase().endsWith('.pdf')) {
        text = await extractPdfText(buffer);
      } else {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        text = result.value;
      }
      if (type === 'grant') {
        onGrantUpload(file, text);
      } else {
        onSummaryUpload(file, text);
      }
    } catch (error) {
      console.error('File extraction error:', error);
    } finally {
      setExtracting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Upload Documents</h3>
        <p className="text-sm text-slate-600 mb-6">
          Upload your original grant application and the Summary Statement from NIH.
        </p>
      </div>

      {/* Submission Type */}
      <div className="bg-slate-50 rounded-lg p-4">
        <label className="block text-sm font-medium text-slate-700 mb-3">Submission Type</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="submissionType"
              value="A0-A1"
              checked={submissionType === 'A0-A1'}
              onChange={() => onSubmissionTypeChange('A0-A1')}
              className="w-4 h-4 text-indigo-600"
            />
            <span className="text-sm">A0 to A1 (First Resubmission)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="submissionType"
              value="A1-new"
              checked={submissionType === 'A1-new'}
              onChange={() => onSubmissionTypeChange('A1-new')}
              className="w-4 h-4 text-indigo-600"
            />
            <span className="text-sm">A1 to New Submission</span>
          </label>
        </div>
        {submissionType === 'A1-new' && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <strong>Important:</strong> A1 is your final resubmission attempt. If not funded, you must 
              submit as a substantially revised new application with a different specific aims page.
            </p>
          </div>
        )}
      </div>

      {/* Previous Score */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Previous Impact Score (optional)
        </label>
        <input
          type="number"
          min="10"
          max="90"
          step="1"
          value={previousScore || ''}
          onChange={(e) => onPreviousScoreChange(e.target.value ? parseInt(e.target.value) : null)}
          placeholder="e.g., 35"
          className="w-32 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        <p className="text-xs text-slate-500 mt-1">Enter if known (10-90 scale)</p>
      </div>

      {/* File Uploads */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Grant Upload */}
        <div
          onClick={() => grantInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            grantFile
              ? 'border-green-300 bg-green-50'
              : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50'
          }`}
        >
          {extracting === 'grant' ? (
            <div className="animate-pulse">
              <FileText className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-slate-600">Extracting text...</p>
            </div>
          ) : grantFile ? (
            <>
              <Check className="w-10 h-10 mx-auto text-green-600 mb-2" />
              <p className="text-sm font-medium text-green-700">{grantFile.name}</p>
              <p className="text-xs text-green-600 mt-1">Click to replace</p>
            </>
          ) : (
            <>
              <Upload className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-medium text-slate-700">Original Grant Application</p>
              <p className="text-xs text-slate-500 mt-1">PDF or DOCX</p>
            </>
          )}
          <input
            ref={grantInputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'grant')}
            className="hidden"
          />
        </div>

        {/* Summary Statement Upload */}
        <div
          onClick={() => summaryInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            summaryFile
              ? 'border-green-300 bg-green-50'
              : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50'
          }`}
        >
          {extracting === 'summary' ? (
            <div className="animate-pulse">
              <FileText className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-slate-600">Extracting text...</p>
            </div>
          ) : summaryFile ? (
            <>
              <Check className="w-10 h-10 mx-auto text-green-600 mb-2" />
              <p className="text-sm font-medium text-green-700">{summaryFile.name}</p>
              <p className="text-xs text-green-600 mt-1">Click to replace</p>
            </>
          ) : (
            <>
              <Upload className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-medium text-slate-700">Summary Statement</p>
              <p className="text-xs text-slate-500 mt-1">PDF from eRA Commons</p>
            </>
          )}
          <input
            ref={summaryInputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'summary')}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
