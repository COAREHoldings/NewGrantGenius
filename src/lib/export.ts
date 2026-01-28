import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Packer,
  AlignmentType,
  convertInchesToTwip,
  PageOrientation,
} from 'docx';
import { jsPDF } from 'jspdf';

export interface ExportContent {
  title: string;
  sections: {
    heading: string;
    content: string;
  }[];
  metadata?: {
    author?: string;
    date?: string;
    type?: string;
  };
}

// Generate DOCX document
export async function generateDocx(data: ExportContent): Promise<Buffer> {
  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: data.title,
          bold: true,
          size: 32,
        }),
      ],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // Metadata
  if (data.metadata) {
    if (data.metadata.author) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Author: ${data.metadata.author}`, italics: true, size: 22 }),
          ],
          alignment: AlignmentType.CENTER,
        })
      );
    }
    if (data.metadata.date) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Date: ${data.metadata.date}`, italics: true, size: 22 }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );
    }
  }

  // Sections
  for (const section of data.sections) {
    // Section heading
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: section.heading,
            bold: true,
            size: 26,
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 200 },
      })
    );

    // Section content - split by paragraphs
    const paragraphs = section.content.split('\n\n');
    for (const para of paragraphs) {
      if (para.trim()) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: para.trim(),
                size: 24,
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
            size: {
              orientation: PageOrientation.PORTRAIT,
            },
          },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}

// Generate PDF document
export function generatePdf(data: ExportContent): Buffer {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 72; // 1 inch margin
  const maxWidth = pageWidth - margin * 2;
  let y = margin;
  const lineHeight = 14;

  // Title
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  const titleLines = pdf.splitTextToSize(data.title, maxWidth);
  pdf.text(titleLines, pageWidth / 2, y, { align: 'center' });
  y += titleLines.length * 22 + 20;

  // Metadata
  if (data.metadata) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    if (data.metadata.author) {
      pdf.text(`Author: ${data.metadata.author}`, pageWidth / 2, y, { align: 'center' });
      y += 14;
    }
    if (data.metadata.date) {
      pdf.text(`Date: ${data.metadata.date}`, pageWidth / 2, y, { align: 'center' });
      y += 14;
    }
    y += 20;
  }

  // Sections
  for (const section of data.sections) {
    // Check if we need a new page
    if (y > pdf.internal.pageSize.getHeight() - margin - 50) {
      pdf.addPage();
      y = margin;
    }

    // Section heading
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(section.heading, margin, y);
    y += 20;

    // Section content
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    const contentLines = pdf.splitTextToSize(section.content, maxWidth);
    
    for (const line of contentLines) {
      if (y > pdf.internal.pageSize.getHeight() - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, margin, y);
      y += lineHeight;
    }
    
    y += 15; // Space between sections
  }

  return Buffer.from(pdf.output('arraybuffer'));
}

// Generate Google Docs URL (opens DOCX in Google Docs)
export function getGoogleDocsUrl(docxUrl: string): string {
  return `https://docs.google.com/document/create?usp=docs_home&title=Document`;
}
