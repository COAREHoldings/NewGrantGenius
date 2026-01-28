import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { validateRequestBody, sanitizeInput } from '@/lib/validate';

function getOpenAI() { 
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' }); 
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validation = validateRequestBody(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    
    const content = body.content || '';
    const sectionType = sanitizeInput(body.sectionType || '');
    const grantType = sanitizeInput(body.grantType || 'NIH R01');
    const mode = body.mode || 'critique'; // 'critique' | 'rewrite'

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    if (mode === 'rewrite') {
      return handleRewrite(content, sectionType, grantType);
    }

    const systemPrompt = `You are an expert NIH grant reviewer with decades of experience on study sections. 
Provide a rigorous, detailed critique of grant application sections using NIH review criteria.

Your critique MUST include:
1. An overall score from 1-10 (1=exceptional, 9=poor, following NIH scoring conventions where lower is better)
2. Detailed strengths (what works well)
3. Detailed weaknesses (what needs improvement)
4. Specific, actionable suggestions for improvement
5. Assessment of scientific rigor, innovation, and feasibility

Be thorough but constructive. Identify both major and minor issues.

Return your response as JSON:
{
  "score": <number 1-10>,
  "scoreLabel": "<Exceptional/Outstanding/Excellent/Very Good/Good/Satisfactory/Fair/Marginal/Poor>",
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
  "suggestions": [
    {
      "category": "<Significance/Innovation/Approach/Clarity/Other>",
      "issue": "<specific issue identified>",
      "recommendation": "<actionable recommendation>",
      "priority": "<High/Medium/Low>"
    }
  ],
  "sectionSpecificFeedback": {
    "significance": "<feedback on significance if applicable>",
    "innovation": "<feedback on innovation if applicable>",
    "approach": "<feedback on approach if applicable>",
    "investigators": "<feedback on investigator qualifications if mentioned>",
    "environment": "<feedback on environment if mentioned>"
  }
}`;

    const userPrompt = `Provide a comprehensive NIH-style review critique of this ${sectionType} section from a ${grantType} grant application:

---
${content}
---

Evaluate using standard NIH review criteria. Be rigorous and specific.`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    });

    const responseText = response.choices[0]?.message?.content || '{}';
    let critique;
    
    try {
      critique = JSON.parse(responseText);
    } catch {
      critique = {
        score: 5,
        scoreLabel: 'Good',
        summary: 'Unable to parse critique response.',
        strengths: [],
        weaknesses: [],
        suggestions: []
      };
    }

    return NextResponse.json({ critique });
  } catch (error) {
    console.error('AI critique error:', error);
    return NextResponse.json(
      { error: 'Failed to generate critique' },
      { status: 500 }
    );
  }
}

async function handleRewrite(content: string, sectionType: string, grantType: string) {
  const systemPrompt = `You are an expert grant writer who has successfully secured millions in NIH funding.
Rewrite the provided grant section to dramatically improve its competitiveness while maintaining the scientific content.

Focus on:
- Stronger opening hooks
- Clearer articulation of significance and innovation
- More compelling narrative flow
- Elimination of jargon and unclear passages
- Stronger transitions between ideas
- More confident, assertive language
- Better alignment with NIH review criteria

Return your response as JSON:
{
  "rewrittenContent": "<the improved text>",
  "changes": [
    {
      "type": "<Clarity/Impact/Structure/Language/Specificity>",
      "description": "<what was changed and why>"
    }
  ],
  "improvementSummary": "<brief summary of key improvements made>"
}`;

  const userPrompt = `Rewrite this ${sectionType} section from a ${grantType} grant application to make it more competitive:

---
${content}
---

Maintain the core scientific content while dramatically improving the writing quality and persuasiveness.`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const responseText = response.choices[0]?.message?.content || '{}';
    let rewrite;
    
    try {
      rewrite = JSON.parse(responseText);
    } catch {
      rewrite = {
        rewrittenContent: content,
        changes: [],
        improvementSummary: 'Unable to generate rewrite.'
      };
    }

    return NextResponse.json({ rewrite });
  } catch (error) {
    console.error('AI rewrite error:', error);
    return NextResponse.json(
      { error: 'Failed to generate rewrite' },
      { status: 500 }
    );
  }
}
