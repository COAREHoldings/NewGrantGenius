import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

function getOpenAI() { return new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' }); }

export async function POST(request: NextRequest) {
  try {
    const { title, specificAims, researchStrategy } = await request.json();

    if (!specificAims && !researchStrategy) {
      return NextResponse.json({ error: 'Please provide Specific Aims or Research Strategy content' }, { status: 400 });
    }

    const systemPrompt = `You are an expert NIH grant consultant with deep knowledge of NIH Center for Scientific Review (CSR) study sections.

Your task is to recommend the best NIH study sections for a grant application based on its scientific content.

For each recommendation, provide:
1. Study section abbreviation and full name
2. Match score (1-100)
3. Key reasons why this section is appropriate
4. Potential concerns or mismatches
5. Strategic advice for this section

Consider:
- Scientific focus and methodology alignment
- Reviewer expertise match
- Historical funding rates
- Competition level
- Whether the application spans multiple areas (and needs assignment request)

Return JSON format:
{
  "recommendations": [
    {
      "abbreviation": "BCMB",
      "name": "Biochemistry and Molecular Biology",
      "matchScore": 85,
      "reasons": ["Strong alignment with...", "Reviewers have expertise in..."],
      "concerns": ["May need to emphasize..."],
      "strategy": "Consider highlighting X aspect",
      "parentCommittee": "ICD abbreviation"
    }
  ],
  "assignmentRequest": {
    "recommended": true/false,
    "suggestedSection": "abbreviation",
    "justification": "reason for assignment request"
  },
  "generalAdvice": "Overall strategic advice"
}`;

    const content = `
Title: ${title || 'Not provided'}

Specific Aims:
${specificAims || 'Not provided'}

Research Strategy Summary:
${researchStrategy ? researchStrategy.substring(0, 3000) : 'Not provided'}
`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this grant and recommend the top 3 most appropriate NIH study sections:\n${content}` },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const responseText = response.choices[0]?.message?.content || '{}';
    const result = JSON.parse(responseText);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Study section recommendation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
