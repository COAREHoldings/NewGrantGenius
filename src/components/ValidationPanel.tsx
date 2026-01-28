'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Download, Shield, FileArchive } from 'lucide-react';

interface Props {
  applicationId: number;
  onExportPDF: () => void;
  onExportZip: () => void;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  canExport: boolean;
}

export default function ValidationPanel({ applicationId, onExportPDF, onExportZip }: Props) {
  const { token } = useAuth();
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const runValidation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ applicationId })
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await onExportPDF();
    } finally {
      setExporting(false);
    }
  };

  const handleExportZip = async () => {
    setExporting(true);
    try {
      await onExportZip();
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-slate-400" />
            <div>
              <h3 className="font-medium text-slate-900">Validation & Export</h3>
              <p className="text-sm text-slate-500">Check compliance before export</p>
            </div>
          </div>
          <button
            onClick={runValidation}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Validate
          </button>
        </div>
      </div>

      <div className="p-4">
        {!result && !loading && (
          <p className="text-sm text-slate-500 text-center py-4">
            Click &quot;Validate&quot; to check your application for compliance issues
          </p>
        )}

        {result && (
          <div className="space-y-4">
            <div className={`flex items-center gap-3 p-3 rounded-lg ${
              result.isValid ? 'bg-green-50' : 'bg-red-50'
            }`}>
              {result.isValid ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <div>
                <p className={`font-medium ${result.isValid ? 'text-green-800' : 'text-red-800'}`}>
                  {result.isValid ? 'Validation Passed' : 'Validation Failed'}
                </p>
                <p className={`text-sm ${result.isValid ? 'text-green-700' : 'text-red-700'}`}>
                  {result.isValid
                    ? 'Your application is ready for export'
                    : `${result.errors.length} error(s) must be fixed before export`}
                </p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-red-700 mb-2 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Errors ({result.errors.length})
                </h4>
                <ul className="space-y-1">
                  {result.errors.map((err, i) => (
                    <li key={i} className="text-sm text-red-600 pl-6">
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.warnings.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-amber-700 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Warnings ({result.warnings.length})
                </h4>
                <ul className="space-y-1">
                  {result.warnings.map((warn, i) => (
                    <li key={i} className="text-sm text-amber-600 pl-6">
                      {warn}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                onClick={handleExportPDF}
                disabled={!result.canExport || exporting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Download className="w-5 h-5" />
                {exporting ? 'Generating...' : 'Export PDF (NIH Format)'}
              </button>
              <button
                onClick={handleExportZip}
                disabled={!result.canExport || exporting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <FileArchive className="w-5 h-5" />
                {exporting ? 'Generating...' : 'Export Complete ZIP Package'}
              </button>
            </div>

            <p className="text-xs text-slate-500 text-center">
              PDF: NIH-compliant format (0.5&quot; margins, 11pt Arial)
              <br />
              ZIP: PDF + sections + attachment checklist
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
