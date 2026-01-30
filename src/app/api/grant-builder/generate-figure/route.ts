import { NextRequest, NextResponse } from 'next/server';

// AI Summary Figure Generation endpoint
export async function POST(request: NextRequest) {
  try {
    const { hypothesis, aims, gapStatement, diseaseArea, target, title } = await request.json();

    // Build a detailed prompt for scientific figure generation
    const aimsText = aims.map((aim: any, idx: number) => 
      `Aim ${idx + 1}: ${aim.scientificQuestion || aim.title || 'Research objective'}`
    ).join('; ');

    const prompt = buildScientificFigurePrompt({
      hypothesis,
      aims: aimsText,
      gapStatement,
      diseaseArea,
      target,
      title
    });

    // Call external AI image generation API
    const apiKey = process.env.OPENAI_API_KEY || process.env.REPLICATE_API_KEY;
    
    if (!apiKey) {
      // Return a placeholder/mock response for demo
      return NextResponse.json({
        success: true,
        imageUrl: null,
        prompt: prompt,
        message: 'Image generation API key not configured. Here is the prompt that would be used:',
        suggestedPrompt: prompt
      });
    }

    // If using OpenAI DALL-E
    if (process.env.OPENAI_API_KEY) {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1792x1024',
          quality: 'hd',
          style: 'natural'
        })
      });

      const data = await response.json();
      
      if (data.error) {
        return NextResponse.json({ error: data.error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        imageUrl: data.data[0].url,
        revisedPrompt: data.data[0].revised_prompt,
        prompt: prompt
      });
    }

    return NextResponse.json({
      success: true,
      imageUrl: null,
      prompt: prompt,
      message: 'Configure OPENAI_API_KEY to enable AI figure generation'
    });

  } catch (error) {
    console.error('Figure generation error:', error);
    return NextResponse.json({ error: 'Figure generation failed' }, { status: 500 });
  }
}

function buildScientificFigurePrompt(data: {
  hypothesis: string;
  aims: string;
  gapStatement: string;
  diseaseArea: string;
  target: string;
  title: string;
}): string {
  const { hypothesis, aims, gapStatement, diseaseArea, target, title } = data;

  return `Create a professional scientific summary figure/schematic for an NIH grant application.

GRANT OVERVIEW:
- Title: ${title || 'Biomedical Research Project'}
- Disease/Research Area: ${diseaseArea || 'biomedical research'}
- Target: ${target || 'therapeutic target'}

SCIENTIFIC CONTENT TO VISUALIZE:
- Knowledge Gap: ${gapStatement?.slice(0, 200) || 'Critical gap in understanding disease mechanism'}
- Central Hypothesis: ${hypothesis?.slice(0, 300) || 'Novel therapeutic approach'}
- Research Aims: ${aims || 'Multiple specific aims addressing the hypothesis'}

FIGURE REQUIREMENTS:
- Style: Clean, professional scientific illustration suitable for NIH grant
- Layout: Clear flow from left to right showing: Problem → Hypothesis → Approach → Expected Outcomes
- Colors: Use professional scientific color palette (blues, greens, oranges)
- Include: Arrows showing relationships, labeled components, clear visual hierarchy
- Format: Landscape orientation, publication-quality
- NO text overlays or labels that could be misread - keep it diagrammatic
- Show molecular/cellular concepts if applicable
- Include visual representation of experimental workflow`;
}

export async function GET() {
  return NextResponse.json({
    info: 'POST to this endpoint with grant data to generate an AI summary figure',
    requiredFields: ['hypothesis', 'aims'],
    optionalFields: ['gapStatement', 'diseaseArea', 'target', 'title']
  });
}
