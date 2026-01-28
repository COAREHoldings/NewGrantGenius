import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
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

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.pdf')) {
    try {
      return await extractTextFromPDF(buffer);
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error('Failed to parse PDF file');
    }
  }

  if (fileName.endsWith('.docx')) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    } catch (error) {
      console.error('DOCX parsing error:', error);
      throw new Error('Failed to parse DOCX file');
    }
  }

  if (fileName.endsWith('.txt')) {
    return buffer.toString('utf-8');
  }

  throw new Error('Unsupported file type. Please upload PDF, DOCX, or TXT.');
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let content: string;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const textContent = formData.get('content') as string | null;

      if (file && file.size > 0) {
        content = await extractTextFromFile(file);
      } else if (textContent) {
        content = textContent;
      } else {
        return NextResponse.json(
          { error: 'No file or content provided' },
          { status: 400 }
        );
      }
    } else {
      const body = await request.json();
      content = body.content;
    }

    if (!content || content.trim().length < 100) {
      return NextResponse.json(
        { error: 'Biosketch content is too short or could not be extracted' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an NIH biosketch compliance expert. Analyze the provided biosketch text against NIH requirements and return a JSON assessment.

NIH Biosketch Requirements to Check:
1. Section A - Personal Statement: Must be present, relevant to the project, up to 4 paragraphs
2. Section B - Positions, Scientific Appointments, and Honors: Listed chronologically (most recent first)
3. Section C - Contributions to Science: Maximum 5 contributions, each with up to 4 publications
4. Section D - Research Support and/or Scholastic Performance: Must include active/recent support
5. Page Limit: Should fit within 5 pages (approximately 3000-3500 words)
6. No URLs/Hyperlinks: Publications should NOT contain URLs or hyperlinks
7. Citation Format: Publications should include PMCID or PMID when available, proper author format

Return ONLY valid JSON in this exact format:
{
  "results": [
    {
      "requirement": "Section A: Personal Statement",
      "passed": true/false,
      "details": "Brief explanation of what was found",
      "suggestion": "Improvement suggestion if not passed (omit if passed)"
    }
  ],
  "overallScore": number (0-100),
  "summary": "One sentence summary"
}`;

    const userPrompt = `Analyze this NIH biosketch for compliance:

---
${content}
---

Check each requirement and provide specific feedback. Be strict but fair.`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const analysisText = response.choices[0]?.message?.content || '{}';
    
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch {
      analysis = {
        results: [{
          requirement: 'Analysis Error',
          passed: false,
          details: 'Could not parse verification results',
          suggestion: 'Please try again'
        }],
        overallScore: 0,
        summary: 'Verification failed'
      };
    }

    if (!analysis.results || !Array.isArray(analysis.results)) {
      analysis.results = [];
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Biosketch verification error:', error);
    const message = error instanceof Error ? error.message : 'Failed to verify biosketch';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
