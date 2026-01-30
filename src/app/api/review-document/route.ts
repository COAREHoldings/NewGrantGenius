import { NextRequest, NextResponse } from 'next/server';

interface ReviewResult {
  section: string;
  score: number; // 1-9 NIH scale
  overallFeedback: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: Array<{
    id: string;
    type: 'rewrite' | 'edit' | 'add' | 'remove';
    original: string;
    suggested: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  nihCompliance: {
    pageLimit: { passed: boolean; message: string };
    formatting: { passed: boolean; message: string };
    requiredElements: { passed: boolean; message: string };
  };
}

export async function POST(request: NextRequest) {
  try {
    const { section, content, grantType } = await request.json();

    if (!section || !content) {
      return NextResponse.json({ error: 'Section and content required' }, { status: 400 });
    }

    // Perform AI review based on section type
    const review = await reviewSection(section, content, grantType || 'SBIR Phase I');

    return NextResponse.json({ review });
  } catch (error) {
    console.error('Review error:', error);
    return NextResponse.json({ error: 'Review failed' }, { status: 500 });
  }
}

async function reviewSection(section: string, content: string, grantType: string): Promise<ReviewResult> {
  const wordCount = content.split(/\s+/).length;
  const pageEstimate = Math.ceil(wordCount / 500); // ~500 words per page

  // Section-specific rules
  const sectionRules: Record<string, { maxPages: number; requiredElements: string[] }> = {
    'specific_aims': { 
      maxPages: 1, 
      requiredElements: ['long-term goal', 'hypothesis', 'rationale', 'aims'] 
    },
    'research_strategy': { 
      maxPages: 12, 
      requiredElements: ['significance', 'innovation', 'approach', 'timeline'] 
    },
    'budget_justification': { 
      maxPages: 3, 
      requiredElements: ['personnel', 'equipment', 'supplies', 'travel'] 
    },
    'facilities': { 
      maxPages: 2, 
      requiredElements: ['laboratory space', 'equipment', 'resources'] 
    },
    'commercialization': { 
      maxPages: 10, 
      requiredElements: ['market analysis', 'competition', 'business model', 'IP strategy'] 
    }
  };

  const rules = sectionRules[section] || { maxPages: 5, requiredElements: [] };
  
  // Check NIH compliance
  const pageCompliant = pageEstimate <= rules.maxPages;
  const foundElements = rules.requiredElements.filter(elem => 
    content.toLowerCase().includes(elem.toLowerCase())
  );
  const missingElements = rules.requiredElements.filter(elem => 
    !content.toLowerCase().includes(elem.toLowerCase())
  );

  // Calculate score based on multiple factors
  let score = 5; // Start neutral
  
  // Page compliance
  if (pageCompliant) score -= 0.5;
  else score += 1;
  
  // Required elements
  const elementCoverage = foundElements.length / Math.max(rules.requiredElements.length, 1);
  score -= elementCoverage * 2;
  
  // Content quality indicators
  const qualityIndicators = ['novel', 'innovative', 'significant', 'rigorous', 'feasible', 'preliminary data'];
  const foundQuality = qualityIndicators.filter(q => content.toLowerCase().includes(q));
  score -= foundQuality.length * 0.3;

  // Clamp score
  score = Math.max(1, Math.min(9, Math.round(score)));

  // Generate suggestions
  const suggestions = generateSuggestions(section, content, missingElements);

  // Generate feedback
  const strengths = generateStrengths(section, content, foundElements, foundQuality);
  const weaknesses = generateWeaknesses(section, content, missingElements, pageEstimate, rules.maxPages);

  return {
    section,
    score,
    overallFeedback: generateOverallFeedback(score, section),
    strengths,
    weaknesses,
    suggestions,
    nihCompliance: {
      pageLimit: {
        passed: pageCompliant,
        message: pageCompliant 
          ? `Within ${rules.maxPages} page limit (est. ${pageEstimate} pages)`
          : `Exceeds ${rules.maxPages} page limit (est. ${pageEstimate} pages)`
      },
      formatting: {
        passed: true,
        message: 'Formatting check requires PDF analysis'
      },
      requiredElements: {
        passed: missingElements.length === 0,
        message: missingElements.length === 0 
          ? 'All required elements present'
          : `Missing: ${missingElements.join(', ')}`
      }
    }
  };
}

function generateSuggestions(section: string, content: string, missingElements: string[]): ReviewResult['suggestions'] {
  const suggestions: ReviewResult['suggestions'] = [];
  let suggestionId = 1;

  // Add suggestions for missing elements
  missingElements.forEach(element => {
    suggestions.push({
      id: `s${suggestionId++}`,
      type: 'add',
      original: '',
      suggested: `Consider adding a clear ${element} section to strengthen your ${section.replace('_', ' ')}.`,
      reason: `NIH reviewers specifically look for ${element} in this section.`,
      priority: 'high'
    });
  });

  // Check for weak openings
  const firstSentence = content.split('.')[0] || '';
  if (firstSentence.length < 50 || !firstSentence.toLowerCase().includes('we')) {
    suggestions.push({
      id: `s${suggestionId++}`,
      type: 'rewrite',
      original: firstSentence,
      suggested: `We propose to [specific action] that will address [specific problem] by [specific approach].`,
      reason: 'Opening sentences should immediately convey the core proposal with active voice.',
      priority: 'medium'
    });
  }

  // Check for passive voice overuse
  const passiveIndicators = ['was', 'were', 'been', 'being', 'is being', 'are being'];
  const passiveCount = passiveIndicators.filter(p => content.toLowerCase().includes(p)).length;
  if (passiveCount > 5) {
    suggestions.push({
      id: `s${suggestionId++}`,
      type: 'edit',
      original: 'Multiple instances of passive voice detected',
      suggested: 'Convert passive voice to active voice for stronger impact. Example: "The experiment will be conducted" → "We will conduct the experiment"',
      reason: 'Active voice is more direct and engaging for reviewers.',
      priority: 'low'
    });
  }

  // Section-specific suggestions
  if (section === 'specific_aims' && !content.toLowerCase().includes('aim 1')) {
    suggestions.push({
      id: `s${suggestionId++}`,
      type: 'edit',
      original: '',
      suggested: 'Clearly label each aim with "Aim 1:", "Aim 2:", etc. for easy navigation.',
      reason: 'Reviewers scan quickly - clear labels help them find key information.',
      priority: 'medium'
    });
  }

  if (section === 'research_strategy' && !content.toLowerCase().includes('rigor')) {
    suggestions.push({
      id: `s${suggestionId++}`,
      type: 'add',
      original: '',
      suggested: 'Add a "Scientific Rigor" subsection addressing reproducibility, blinding, sample sizes, and statistical approach.',
      reason: 'NIH requires explicit discussion of scientific rigor since 2016.',
      priority: 'high'
    });
  }

  return suggestions;
}

function generateStrengths(section: string, content: string, foundElements: string[], qualityIndicators: string[]): string[] {
  const strengths: string[] = [];
  
  if (foundElements.length > 0) {
    strengths.push(`Addresses key required elements: ${foundElements.slice(0, 3).join(', ')}`);
  }
  
  if (qualityIndicators.length >= 3) {
    strengths.push('Strong use of NIH-valued language (innovation, significance, rigor)');
  }
  
  if (content.includes('preliminary data') || content.includes('our published')) {
    strengths.push('References preliminary/published data to support feasibility');
  }
  
  if (content.includes('Figure') || content.includes('Table')) {
    strengths.push('Includes visual elements to support arguments');
  }

  if (strengths.length === 0) {
    strengths.push('Content addresses the section topic');
  }

  return strengths;
}

function generateWeaknesses(section: string, content: string, missingElements: string[], pageEstimate: number, maxPages: number): string[] {
  const weaknesses: string[] = [];
  
  if (missingElements.length > 0) {
    weaknesses.push(`Missing required elements: ${missingElements.join(', ')}`);
  }
  
  if (pageEstimate > maxPages) {
    weaknesses.push(`Exceeds page limit (${pageEstimate} vs ${maxPages} allowed) - needs trimming`);
  }
  
  if (!content.includes('hypothesis') && section === 'specific_aims') {
    weaknesses.push('Central hypothesis not clearly stated');
  }
  
  if (content.split('\n').filter(l => l.trim()).length < 10) {
    weaknesses.push('Content may be underdeveloped - consider expanding key points');
  }

  return weaknesses;
}

function generateOverallFeedback(score: number, section: string): string {
  const sectionName = section.replace('_', ' ');
  
  if (score <= 2) {
    return `Excellent ${sectionName}! This section is highly competitive and addresses reviewer expectations well. Minor polish recommended.`;
  } else if (score <= 4) {
    return `Good ${sectionName} with solid foundation. Address the suggested improvements to strengthen competitiveness.`;
  } else if (score <= 6) {
    return `This ${sectionName} needs significant revision. Focus on the high-priority suggestions to improve your score.`;
  } else {
    return `This ${sectionName} requires substantial rework. Consider the structural suggestions and required elements before resubmitting for review.`;
  }
}

// Bulk review endpoint
export async function PUT(request: NextRequest) {
  try {
    const { documents } = await request.json();
    
    if (!documents || !Array.isArray(documents)) {
      return NextResponse.json({ error: 'Documents array required' }, { status: 400 });
    }

    const reviews = await Promise.all(
      documents.map(async (doc: { section: string; content: string }) => {
        return await reviewSection(doc.section, doc.content, 'SBIR Phase I');
      })
    );

    // Calculate overall score
    const avgScore = reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length;
    
    return NextResponse.json({ 
      reviews,
      overallScore: Math.round(avgScore * 10) / 10,
      fundable: avgScore <= 3.0,
      summary: generateBulkSummary(reviews)
    });
  } catch (error) {
    console.error('Bulk review error:', error);
    return NextResponse.json({ error: 'Bulk review failed' }, { status: 500 });
  }
}

function generateBulkSummary(reviews: ReviewResult[]): string {
  const avgScore = reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length;
  const criticalIssues = reviews.filter(r => r.score >= 6).length;
  
  if (avgScore <= 2) {
    return 'Your application is highly competitive. Focus on final polish and formatting compliance.';
  } else if (avgScore <= 4) {
    return `Your application shows promise. Address ${criticalIssues > 0 ? `${criticalIssues} section(s) with critical issues` : 'suggested improvements'} to strengthen competitiveness.`;
  } else {
    return `Your application needs significant revision. ${criticalIssues} section(s) require major rework before submission.`;
  }
}
