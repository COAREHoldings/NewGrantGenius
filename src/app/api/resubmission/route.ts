import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;
function getOpenAI() {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
  }
  return openaiClient;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'parse':
        return handleParse(data);
      case 'audit':
        return handleAudit(data);
      case 'strategy':
        return handleStrategy(data);
      case 'rewrite':
        return handleRewrite(data);
      case 'cover-letter':
        return handleCoverLetter(data);
      case 'quality-check':
        return handleQualityCheck(data);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Resubmission API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleParse(data: { summaryText: string }) {
  const { summaryText } = data;
  if (!summaryText || summaryText.length < 100) {
    return NextResponse.json({ error: 'Summary statement text too short' }, { status: 400 });
  }

  const prompt = `Analyze this NIH Summary Statement and extract structured information.

Summary Statement:
${summaryText}

Return JSON with this exact structure:
{
  "overallImpactScore": <number 1-9>,
  "criterionScores": [
    {"criterion": "Significance", "score": <1-9>},
    {"criterion": "Innovation", "score": <1-9>},
    {"criterion": "Approach", "score": <1-9>},
    {"criterion": "Investigators", "score": <1-9>},
    {"criterion": "Environment", "score": <1-9>}
  ],
  "critiques": [
    {
      "id": "<unique-id>",
      "criterion": "<significance|innovation|approach|investigators|environment>",
      "reviewer": "Reviewer 1",
      "text": "<critique text>",
      "severity": "<must-address|consider>"
    }
  ],
  "resumeSynopsis": "<extracted resume/synopsis section>"
}

Categorize as "must-address" if it's a weakness/concern, "consider" if minor/suggestion.`;

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(response.choices[0]?.message?.content || '{}');
  return NextResponse.json(result);
}

async function handleAudit(data: { grantText: string; parsedSummary: unknown }) {
  const { grantText, parsedSummary } = data;

  const prompt = `You are an expert NIH grant reviewer. Conduct an independent audit of this grant application, going BEYOND what the reviewers identified.

Grant Text:
${grantText.slice(0, 15000)}

Previous Review Summary:
${JSON.stringify(parsedSummary, null, 2)}

Identify issues the reviewers may have missed. Return JSON:
{
  "findings": [
    {
      "id": "<unique-id>",
      "category": "<category>",
      "finding": "<what you found>",
      "recommendation": "<how to fix>",
      "priority": "<critical|important|minor>"
    }
  ],
  "preliminaryDataGaps": ["<gap1>", "<gap2>"],
  "suggestedNewData": ["<data that would strengthen the application>"],
  "missedOpportunities": ["<opportunities not addressed>"]
}

Focus on: rigor, reproducibility, feasibility, preliminary data quality, innovation claims, statistical power.`;

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(response.choices[0]?.message?.content || '{}');
  return NextResponse.json(result);
}

async function handleStrategy(data: { parsedSummary: unknown; auditResults: unknown }) {
  const { parsedSummary, auditResults } = data;

  const prompt = `Generate a comprehensive response strategy for this NIH grant resubmission.

Parsed Critiques:
${JSON.stringify(parsedSummary, null, 2)}

Audit Findings:
${JSON.stringify(auditResults, null, 2)}

For each critique, provide a point-by-point response strategy. Return JSON:
{
  "suggestions": [
    {
      "critiqueId": "<id>",
      "response": "<detailed response strategy>",
      "priority": "<critical|important|minor>",
      "structuralChanges": ["<change1>", "<change2>"],
      "pageEstimate": <estimated pages needed>
    }
  ],
  "totalPageEstimate": <total pages for all changes>,
  "remainingPageBudget": <pages remaining after 1-page intro, assuming 12-page limit>
}

Prioritize critical weaknesses. Be specific about what to add/change.`;

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(response.choices[0]?.message?.content || '{}');
  return NextResponse.json(result);
}

async function handleRewrite(data: {
  sectionName: string;
  originalText: string;
  critiquesToAddress: string[];
  responseStrategy: unknown;
}) {
  const { sectionName, originalText, critiquesToAddress, responseStrategy } = data;

  const prompt = `Rewrite this grant section to address the specified critiques.

Section: ${sectionName}

Original Text:
${originalText}

Critiques to Address:
${critiquesToAddress.join('\n')}

Response Strategy Context:
${JSON.stringify(responseStrategy, null, 2)}

Return JSON:
{
  "sectionName": "${sectionName}",
  "originalText": "<original>",
  "revisedText": "<improved version addressing critiques>",
  "changes": ["<change1>", "<change2>"],
  "pageCount": <estimated pages>
}

Make substantive improvements while maintaining scientific accuracy. Highlight how each critique is addressed.`;

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(response.choices[0]?.message?.content || '{}');
  return NextResponse.json(result);
}

async function handleCoverLetter(data: {
  parsedSummary: unknown;
  responseStrategy: unknown;
  sectionRewrites: unknown[];
}) {
  const { parsedSummary, responseStrategy, sectionRewrites } = data;

  const prompt = `Generate an NIH-compliant Introduction to the Resubmission Application (cover letter).

Previous Review:
${JSON.stringify(parsedSummary, null, 2)}

Response Strategy:
${JSON.stringify(responseStrategy, null, 2)}

Section Changes Made:
${JSON.stringify(sectionRewrites, null, 2)}

Create a 1-page (max 500 words) introduction that:
1. Thanks reviewers for feedback
2. Summarizes major changes point-by-point
3. References specific page numbers where changes appear
4. Is professional and concise

Return JSON:
{
  "content": "<the letter text>",
  "wordCount": <number>,
  "pageEstimate": <should be ~1>
}

Format with clear sections: Opening, Summary of Major Changes, Specific Responses, Closing.`;

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(response.choices[0]?.message?.content || '{}');
  return NextResponse.json(result);
}

async function handleQualityCheck(data: {
  grantText: string;
  parsedSummary: unknown;
  responseStrategy: unknown;
  sectionRewrites: unknown[];
  coverLetter: unknown;
}) {
  const { parsedSummary, responseStrategy, sectionRewrites, coverLetter } = data;

  const prompt = `Conduct a quality check on this grant resubmission, simulating an NIH review panel.

Original Review:
${JSON.stringify(parsedSummary, null, 2)}

Response Strategy Used:
${JSON.stringify(responseStrategy, null, 2)}

Revised Sections:
${JSON.stringify(sectionRewrites, null, 2)}

Cover Letter:
${JSON.stringify(coverLetter, null, 2)}

Score the revised application on each criterion (1-9, lower is better). Return JSON:
{
  "scores": [
    {
      "criterion": "Significance",
      "originalScore": <from parsed summary>,
      "projectedScore": <your estimate after revisions>,
      "delta": <improvement, negative means better>
    }
  ],
  "overallOriginal": <original impact score>,
  "overallProjected": <projected impact score>,
  "overallDelta": <improvement>,
  "remainingRisks": ["<risk1>", "<risk2>"],
  "checklist": [
    {"item": "All major critiques addressed", "completed": true/false},
    {"item": "Introduction within 1 page", "completed": true/false},
    {"item": "New data/analysis added", "completed": true/false},
    {"item": "Statistical concerns resolved", "completed": true/false},
    {"item": "Feasibility improved", "completed": true/false}
  ]
}

Be realistic - major improvements are possible but scores rarely improve by more than 2-3 points.`;

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(response.choices[0]?.message?.content || '{}');
  return NextResponse.json(result);
}
