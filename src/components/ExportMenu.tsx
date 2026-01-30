'use client';

import { useState } from 'react';
import { Download, FileText, File, ExternalLink, Loader2, ChevronDown, Lock } from 'lucide-react';
import { useAuth, DEMO_RESTRICTED_FEATURES } from '@/lib/auth-context';

export interface ExportSection {
  heading: string;
  content: string;
}

interface ExportMenuProps {
  title: string;
  sections: ExportSection[];
  metadata?: {
    author?: string;
    date?: string;
    type?: string;
  };
  buttonClassName?: string;
}

type ExportFormat = 'pdf' | 'docx' | 'gdocs';

export default function ExportMenu({ title, sections, metadata, buttonClassName }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const { isDemo, checkDemoFeature } = useAuth();

  const handleExport = async (format: ExportFormat) => {
    // Check demo restriction
    const feature = format === 'pdf' ? DEMO_RESTRICTED_FEATURES.EXPORT_PDF : DEMO_RESTRICTED_FEATURES.EXPORT_WORD;
    if (!checkDemoFeature(feature)) {
      setIsOpen(false);
      return;
    }

    setExporting(format);
    setIsOpen(false);

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          content: { title, sections, metadata },
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      if (format === 'gdocs') {
        // Download the file first
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
        a.click();
        
        // Then open Google Docs upload page
        setTimeout(() => {
          window.open('https://docs.google.com/document/create', '_blank');
        }, 500);
      } else {
        // Regular download
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.${format}`;
        a.click();
      }
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  const formats = [
    { id: 'pdf' as const, label: 'PDF Document', icon: FileText, description: 'Best for printing' },
    { id: 'docx' as const, label: 'Word Document', icon: File, description: 'Editable .docx file' },
    { id: 'gdocs' as const, label: 'Google Docs', icon: ExternalLink, description: 'Open in Google Docs' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={exporting !== null}
        className={buttonClassName || 'flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition'}
      >
        {exporting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Export
            <ChevronDown className="w-4 h-4" />
          </>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-20">
            {formats.map((format) => (
              <button
                key={format.id}
                onClick={() => handleExport(format.id)}
                className="w-full px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition text-left"
              >
                <format.icon className="w-5 h-5 text-slate-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-slate-900 flex items-center gap-2">
                    {format.label}
                    {isDemo && <Lock className="w-3 h-3 text-amber-500" />}
                  </div>
                  <div className="text-xs text-slate-500">{format.description}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
