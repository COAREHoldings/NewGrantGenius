'use client';

import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// NIH PDF Styles: 0.5" margins, 11pt Arial
const styles = StyleSheet.create({
  page: {
    padding: 36, // 0.5 inch = 36 points
    fontFamily: 'Helvetica', // Closest to Arial in PDF
    fontSize: 11,
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 20,
    borderBottom: '1px solid #333',
    paddingBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  heading1: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
  },
  heading2: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 4,
  },
  paragraph: {
    marginBottom: 8,
    textAlign: 'justify',
  },
  listItem: {
    marginLeft: 20,
    marginBottom: 4,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    right: 36,
    fontSize: 10,
    color: '#666',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 36,
    fontSize: 8,
    color: '#999',
  },
});

interface Section {
  id: number;
  title: string;
  content: string;
  type: string;
}

interface Attachment {
  id: number;
  name: string;
  status: string;
  file_url: string | null;
}

interface Application {
  id: number;
  title: string;
  mechanism: string;
}

// Convert HTML to PDF-compatible elements
function htmlToElements(html: string): React.ReactElement[] {
  const elements: React.ReactElement[] = [];
  if (!html) return elements;

  // Simple HTML parser for common elements
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  function processNode(node: Node, key: string): React.ReactElement | null {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        return <Text key={key}>{text} </Text>;
      }
      return null;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();
      const children = Array.from(el.childNodes)
        .map((child, i) => processNode(child, `${key}-${i}`))
        .filter(Boolean);

      switch (tagName) {
        case 'h1':
          return <Text key={key} style={styles.heading1}>{children}</Text>;
        case 'h2':
          return <Text key={key} style={styles.heading2}>{children}</Text>;
        case 'h3':
          return <Text key={key} style={styles.heading2}>{children}</Text>;
        case 'p':
          return <Text key={key} style={styles.paragraph}>{children}</Text>;
        case 'strong':
        case 'b':
          return <Text key={key} style={{ fontWeight: 'bold' }}>{children}</Text>;
        case 'em':
        case 'i':
          return <Text key={key} style={{ fontStyle: 'italic' }}>{children}</Text>;
        case 'ul':
        case 'ol':
          return <View key={key}>{children}</View>;
        case 'li':
          return <Text key={key} style={styles.listItem}>* {children}</Text>;
        case 'br':
          return <Text key={key}>{'\n'}</Text>;
        case 'img':
          // Images are noted but not embedded in this version
          return <Text key={key} style={{ fontStyle: 'italic', color: '#666' }}>[Figure: {el.getAttribute('alt') || 'Image'}]</Text>;
        default:
          if (children.length > 0) {
            return <Text key={key}>{children}</Text>;
          }
          return null;
      }
    }
    return null;
  }

  Array.from(tempDiv.childNodes).forEach((node, i) => {
    const element = processNode(node, `node-${i}`);
    if (element) {
      elements.push(element);
    }
  });

  return elements;
}

// PDF Document Component
function GrantPDF({ application, sections, mechanism }: { 
  application: Application; 
  sections: Section[];
  mechanism: string;
}) {
  return (
    <Document>
      {sections.map((section, idx) => (
        <Page key={section.id} size="LETTER" style={styles.page}>
          {idx === 0 && (
            <View style={styles.header}>
              <Text style={styles.title}>{application.title}</Text>
              <Text style={styles.subtitle}>Mechanism: {mechanism}</Text>
            </View>
          )}
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View>
            {section.content ? (
              htmlToElements(section.content).length > 0 ? (
                htmlToElements(section.content)
              ) : (
                <Text style={styles.paragraph}>{section.content}</Text>
              )
            ) : (
              <Text style={{ fontStyle: 'italic', color: '#999' }}>No content</Text>
            )}
          </View>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
          <Text style={styles.footer}>NIH SBIR/STTR Application - Generated by COARE Grant Master</Text>
        </Page>
      ))}
    </Document>
  );
}

export async function generatePDF(
  application: Application,
  sections: Section[],
  mechanism: string
): Promise<Blob> {
  const doc = <GrantPDF application={application} sections={sections} mechanism={mechanism} />;
  const blob = await pdf(doc).toBlob();
  return blob;
}

export async function exportAsZip(
  application: Application,
  sections: Section[],
  attachments: Attachment[],
  mechanism: string
): Promise<void> {
  const zip = new JSZip();

  // Generate main PDF
  const pdfBlob = await generatePDF(application, sections, mechanism);
  zip.file(`${sanitizeFilename(application.title)}_Application.pdf`, pdfBlob);

  // Add sections as individual text files for reference
  const sectionsFolder = zip.folder('sections');
  sections.forEach((section, idx) => {
    const content = section.content || '(No content)';
    const plainText = stripHtmlForExport(content);
    sectionsFolder?.file(`${idx + 1}_${sanitizeFilename(section.title)}.txt`, plainText);
  });

  // Add attachment checklist
  const attachmentList = attachments.map(a => 
    `[${a.status === 'uploaded' ? 'X' : ' '}] ${a.name}`
  ).join('\n');
  zip.file('Attachment_Checklist.txt', `Attachment Status:\n\n${attachmentList}`);

  // Add README
  const readme = `
COARE Grant Master Export
========================

Application: ${application.title}
Mechanism: ${mechanism}
Export Date: ${new Date().toISOString()}

Contents:
- ${sanitizeFilename(application.title)}_Application.pdf - Main application PDF
- sections/ - Individual section text files
- Attachment_Checklist.txt - Status of required attachments

NIH Formatting Applied:
- Font: Arial 11pt (Helvetica in PDF)
- Margins: 0.5 inches
- Line Spacing: Single

Note: Uploaded attachment files should be added manually to complete the submission package.
`;
  zip.file('README.txt', readme);

  // Generate and download ZIP
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `${sanitizeFilename(application.title)}_Export.zip`);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
}

function stripHtmlForExport(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}
