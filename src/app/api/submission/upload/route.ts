import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// Allow larger file uploads (50MB)
export const config = {
  api: {
    bodyParser: false,
  },
};

// Increase body size limit for file uploads
export const maxDuration = 60; // 60 seconds for large files

// Document type detection based on filename/content
function detectDocumentType(filename: string): string {
  const lower = filename.toLowerCase();
  
  if (lower.includes('biosketch') || lower.includes('bio sketch') || lower.includes('cv')) {
    return 'biosketch';
  }
  if (lower.includes('budget')) {
    return 'budget';
  }
  if (lower.includes('facilities') || lower.includes('equipment')) {
    return 'facilities';
  }
  if (lower.includes('letter') || lower.includes('support')) {
    return 'letter_of_support';
  }
  if (lower.includes('aims') || lower.includes('specific')) {
    return 'specific_aims';
  }
  if (lower.includes('strategy') || lower.includes('research')) {
    return 'research_strategy';
  }
  if (lower.includes('commercialization')) {
    return 'commercialization';
  }
  
  return 'other';
}

// Map document type to section
function mapToSection(docType: string): string | null {
  const mapping: Record<string, string> = {
    'specific_aims': 'Specific Aims',
    'research_strategy': 'Research Strategy',
    'budget': 'Budget & Justification',
    'biosketch': 'Biographical Sketch',
    'facilities': 'Facilities & Equipment',
    'letter_of_support': 'Letters of Support',
    'commercialization': 'Commercialization Plan'
  };
  
  return mapping[docType] || null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const applicationId = formData.get('applicationId') as string;
    const files = formData.getAll('files');

    if (!applicationId) {
      return NextResponse.json({ error: 'applicationId required' }, { status: 400 });
    }

    const supabase = createServerClient();
    const uploads = [];

    for (const file of files) {
      if (file instanceof File) {
        const docType = detectDocumentType(file.name);
        const mappedSection = mapToSection(docType);

        // Generate unique filename
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `${applicationId}/${timestamp}_${safeName}`;

        // Convert File to ArrayBuffer then to Uint8Array for upload
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Upload to Supabase Storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from('attachments')
          .upload(storagePath, uint8Array, {
            contentType: file.type || 'application/octet-stream',
            upsert: false
          });

        if (storageError) {
          console.error('Storage upload error:', storageError);
          throw new Error(`Failed to upload file: ${storageError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('attachments')
          .getPublicUrl(storagePath);

        const fileUrl = urlData.publicUrl;

        // Save metadata to database
        const { data, error } = await supabase
          .from('document_uploads')
          .insert({
            application_id: parseInt(applicationId),
            document_type: docType,
            original_filename: file.name,
            file_size: file.size,
            file_url: fileUrl,
            audit_status: 'pending',
            mapped_to_section: mappedSection
          })
          .select()
          .single();

        if (error) throw error;
        
        uploads.push({
          id: data.id,
          documentType: data.document_type,
          originalFilename: data.original_filename,
          fileUrl: data.file_url,
          auditStatus: data.audit_status,
          auditResults: {},
          mappedToSection: data.mapped_to_section
        });
      }
    }

    return NextResponse.json({ uploads });
  } catch (error) {
    console.error('Error processing upload:', error);
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
