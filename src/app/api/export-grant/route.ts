import { NextRequest, NextResponse } from 'next/server';
import {
  assembleGrantDocument,
  formatForExport,
  calculateWordCount,
  validateSectionLimits,
  ExportOptions,
  GrantPackage,
} from '@/lib/document-export';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { grantPackage, options } = body as {
      grantPackage: GrantPackage;
      options: ExportOptions;
    };

    if (!grantPackage || !grantPackage.sections) {
      return NextResponse.json(
        { error: 'Grant package with sections is required' },
        { status: 400 }
      );
    }

    // Calculate word counts for each section
    const sectionsWithCounts = grantPackage.sections.map((section) => ({
      ...section,
      wordCount: section.content.trim().split(/\s+/).length,
    }));

    // Validate section limits
    const validation = validateSectionLimits(sectionsWithCounts);

    // Assemble the document
    const assembledDocument = assembleGrantDocument(
      { ...grantPackage, sections: sectionsWithCounts },
      options
    );

    // Format for the requested export type
    const formattedContent = formatForExport(assembledDocument, options.format);

    // Calculate total statistics
    const totalWordCount = calculateWordCount(sectionsWithCounts);
    const estimatedPages = Math.ceil(totalWordCount / 500);

    // For PDF, generate HTML that can be converted
    if (options.format === 'pdf') {
      const htmlDocument = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${grantPackage.title}</title>
  <style>
    body {
      font-family: ${options.fontFamily || 'Arial, sans-serif'};
      font-size: ${options.fontSize || 11}pt;
      line-height: 1.5;
      max-width: 8.5in;
      margin: 1in auto;
      padding: 0 0.5in;
    }
    h1 { font-size: 14pt; margin-top: 24pt; margin-bottom: 12pt; }
    h2 { font-size: 12pt; margin-top: 18pt; margin-bottom: 9pt; }
    p { margin-bottom: 12pt; text-align: justify; }
    .page-break { page-break-after: always; }
    @media print {
      body { margin: 0; padding: 0; }
    }
  </style>
</head>
<body>
${formattedContent}
</body>
</html>`;

      return NextResponse.json({
        success: true,
        format: 'pdf',
        content: htmlDocument,
        filename: `${grantPackage.title.replace(/\s+/g, '_')}.html`,
        stats: {
          totalWordCount,
          estimatedPages,
          sectionCount: sectionsWithCounts.length,
        },
        validation,
        message: 'HTML document ready for PDF conversion. Use browser print or a PDF library.',
      });
    }

    // For DOCX, return markdown that can be converted
    return NextResponse.json({
      success: true,
      format: 'docx',
      content: formattedContent,
      filename: `${grantPackage.title.replace(/\s+/g, '_')}.md`,
      stats: {
        totalWordCount,
        estimatedPages,
        sectionCount: sectionsWithCounts.length,
      },
      validation,
      message: 'Markdown document ready for DOCX conversion.',
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export grant document' },
      { status: 500 }
    );
  }
}
