import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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
}

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    // Read file content
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    // Use OpenAI to extract text and parse structure
    const openai = getOpenAI();
    
    const systemPrompt = `You are an expert at parsing NIH grant Specific Aims documents.
Extract the following information from the uploaded PDF:

1. Project title (if present)
2. Each Specific Aim with:
   - Aim number (1, 2, 3, etc.)
   - Aim title (the main goal statement)
   - Full content of the aim
   - Hypothesis (if stated)

Return your response as JSON:
{
  "projectTitle": "title if found or null",
  "fullText": "the complete extracted text",
  "aims": [
    {
      "number": 1,
      "title": "concise aim title",
      "content": "full aim description",
      "hypothesis": "hypothesis if stated or null"
    }
  ]
}

Be thorough in extracting all aims. Most NIH applications have 2-4 specific aims.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            {
              type: 'file',
              file: {
                filename: file.name,
                file_data: `data:application/pdf;base64,${base64}`
              }
            },
            {
              type: 'text',
              text: 'Parse this Specific Aims document and extract all aims with their details.'
            }
          ]
        }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const responseText = response.choices[0]?.message?.content || '{}';
    let parsed: ParsedDocument;
    
    try {
      parsed = JSON.parse(responseText);
      // Ensure aims array exists
      if (!parsed.aims) parsed.aims = [];
      if (!parsed.fullText) parsed.fullText = '';
    } catch {
      parsed = {
        fullText: '',
        aims: [],
        projectTitle: undefined
      };
    }

    return NextResponse.json({ 
      success: true,
      parsed
    });
  } catch (error) {
    console.error('PDF parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to parse PDF. Please ensure it is a valid Specific Aims document.' },
      { status: 500 }
    );
  }
}
