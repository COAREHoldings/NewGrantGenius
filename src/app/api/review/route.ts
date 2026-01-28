import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { verifyToken } from '@/lib/auth';
import { MECHANISMS } from '@/lib/mechanisms';

const sql = neon(process.env.DATABASE_URL!);

async function getUserId(req: NextRequest): Promise<number | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const payload = await verifyToken(authHeader.slice(7));
  return payload?.userId ?? null;
}

interface Section {
  title: string;
  type: string;
  content: string | null;
  page_limit: number;
  page_count: number | null;
  required_headings: string[] | null;
}

interface Attachment {
  name: string;
  required: boolean;
  status: string;
}

interface ReviewResult {
  criterionScores: {
    significance: number;
    innovation: number;
    approach: number;
    investigators: number;
    environment: number;
  };
  strengths: string[];
  weaknesses: string[];
  fatalFlaws: string[];
  overallImpactScore: number;
  fundingTier: string;
  detailedFeedback: {
    section: string;
    feedback: string[];
  }[];
}

// Strip HTML for text analysis
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Count words in text
function wordCount(text: string): number {
  if (!text) return 0;
  return stripHtml(text).split(/\s+/).filter(w => w.length > 0).length;
}

// Check for key phrases indicating quality
function containsKeyPhrases(text: string, phrases: string[]): string[] {
  const lowerText = stripHtml(text).toLowerCase();
  return phrases.filter(p => lowerText.includes(p.toLowerCase()));
}

// Analyze section content quality
function analyzeSection(section: Section): { score: number; strengths: string[]; weaknesses: string[]; feedback: string[] } {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const feedback: string[] = [];
  let score = 5; // Start at middle

  const content = section.content || '';
  const plainText = stripHtml(content);
  const words = wordCount(content);

  // Check if section has content
  if (!content || words < 50) {
    weaknesses.push(`${section.title} is empty or has minimal content`);
    feedback.push('Section needs substantial content development');
    return { score: 9, strengths, weaknesses, feedback };
  }

  // Check required headings
  if (section.required_headings && section.required_headings.length > 0) {
    const missing = section.required_headings.filter(h => !plainText.toLowerCase().includes(h.toLowerCase()));
    const present = section.required_headings.filter(h => plainText.toLowerCase().includes(h.toLowerCase()));
    
    if (missing.length > 0) {
      weaknesses.push(`Missing required heading(s) in ${section.title}: ${missing.join(', ')}`);
      score += missing.length;
    }
    if (present.length === section.required_headings.length) {
      strengths.push(`${section.title} contains all required headings`);
      score -= 1;
    }
  }

  // Check page utilization
  const pageCount = section.page_count || Math.ceil(plainText.length / 3000);
  const utilization = pageCount / section.page_limit;
  
  if (utilization < 0.5) {
    weaknesses.push(`${section.title} underutilizes available pages (${Math.round(utilization * 100)}% of limit)`);
    feedback.push('Consider expanding content to better utilize available space');
    score += 1;
  } else if (utilization >= 0.8 && utilization <= 1.0) {
    strengths.push(`${section.title} effectively uses available page limit`);
    score -= 1;
  } else if (utilization > 1.0) {
    weaknesses.push(`${section.title} exceeds page limit`);
    score += 2;
  }

  // Content quality indicators
  const qualityIndicators = {
    significance: ['public health', 'burden', 'prevalence', 'mortality', 'morbidity', 'unmet need', 'impact', 'patients'],
    innovation: ['novel', 'innovative', 'first', 'unique', 'breakthrough', 'paradigm', 'transformative', 'new approach'],
    approach: ['hypothesis', 'specific aim', 'milestone', 'timeline', 'rigor', 'reproducibility', 'statistical', 'sample size'],
    preliminary: ['preliminary data', 'pilot study', 'feasibility', 'proof of concept', 'demonstrated'],
    commercialization: ['market', 'commercialization', 'revenue', 'customer', 'competitive', 'business model', 'licensing']
  };

  // Analyze based on section type
  if (section.type === 'specific_aims') {
    const hasHypothesis = plainText.toLowerCase().includes('hypothesis') || plainText.toLowerCase().includes('hypothesize');
    const hasObjective = plainText.toLowerCase().includes('objective') || plainText.toLowerCase().includes('goal');
    const hasRationale = plainText.toLowerCase().includes('rationale') || plainText.toLowerCase().includes('because');
    
    if (hasHypothesis) {
      strengths.push('Clear hypothesis stated in Specific Aims');
      score -= 1;
    } else {
      weaknesses.push('No clear hypothesis stated');
      feedback.push('Consider adding a clear, testable hypothesis');
      score += 1;
    }
    
    if (hasObjective) strengths.push('Clear objectives defined');
    if (hasRationale) strengths.push('Rationale for study provided');
  }

  if (section.type === 'research_strategy') {
    const sigPhrases = containsKeyPhrases(content, qualityIndicators.significance);
    const innPhrases = containsKeyPhrases(content, qualityIndicators.innovation);
    const appPhrases = containsKeyPhrases(content, qualityIndicators.approach);
    const prelimPhrases = containsKeyPhrases(content, qualityIndicators.preliminary);

    if (sigPhrases.length >= 3) {
      strengths.push('Strong significance argument with clear impact statements');
      score -= 1;
    } else if (sigPhrases.length === 0) {
      weaknesses.push('Significance section lacks impact statements');
      score += 1;
    }

    if (innPhrases.length >= 2) {
      strengths.push('Innovation clearly articulated');
      score -= 1;
    } else if (innPhrases.length === 0) {
      weaknesses.push('Innovation not clearly stated');
      score += 1;
    }

    if (appPhrases.length >= 3) {
      strengths.push('Approach section shows methodological rigor');
      score -= 1;
    }

    if (prelimPhrases.length >= 2) {
      strengths.push('Preliminary data referenced to support feasibility');
      score -= 1;
    } else {
      weaknesses.push('Limited or no preliminary data mentioned');
      feedback.push('Consider adding preliminary data or pilot study results');
      score += 1;
    }
  }

  if (section.type === 'commercialization_plan') {
    const commPhrases = containsKeyPhrases(content, qualityIndicators.commercialization);
    
    if (commPhrases.length >= 4) {
      strengths.push('Comprehensive commercialization strategy');
      score -= 1;
    } else if (commPhrases.length < 2) {
      weaknesses.push('Commercialization plan lacks key business elements');
      feedback.push('Add market analysis, competitive landscape, and revenue projections');
      score += 1;
    }

    const hasMarketSize = plainText.toLowerCase().includes('market size') || plainText.toLowerCase().includes('tam') || plainText.toLowerCase().includes('addressable');
    if (hasMarketSize) {
      strengths.push('Market size analysis included');
    } else {
      weaknesses.push('No market size analysis');
      score += 1;
    }
  }

  // Clamp score to 1-9
  score = Math.max(1, Math.min(9, score));

  return { score, strengths, weaknesses, feedback };
}

// Detect fatal flaws
function detectFatalFlaws(sections: Section[], attachments: Attachment[], mechanism: string): string[] {
  const flaws: string[] = [];
  
  const researchStrategy = sections.find(s => s.type === 'research_strategy');
  const commercPlan = sections.find(s => s.type === 'commercialization_plan');
  const specificAims = sections.find(s => s.type === 'specific_aims');

  // Check for ambiguous endpoints
  if (researchStrategy?.content) {
    const content = stripHtml(researchStrategy.content).toLowerCase();
    const hasEndpoints = content.includes('endpoint') || content.includes('outcome') || content.includes('measure');
    const hasMilestone = content.includes('milestone') || content.includes('deliverable') || content.includes('timeline');
    
    if (!hasEndpoints) {
      flaws.push('FATAL: No clear endpoints or outcome measures defined');
    }
    if (!hasMilestone) {
      flaws.push('FATAL: Unclear milestones or timeline');
    }
  }

  // Check for insufficient preliminary data (especially for Phase II)
  if (mechanism.includes('Phase II') || mechanism.includes('R44') || mechanism.includes('R42')) {
    if (researchStrategy?.content) {
      const content = stripHtml(researchStrategy.content).toLowerCase();
      const hasPrelimData = content.includes('preliminary') || content.includes('phase i') || content.includes('pilot');
      if (!hasPrelimData) {
        flaws.push('FATAL: Insufficient preliminary data for Phase II application');
      }
    }
    
    // Phase II requires commercialization
    if (!commercPlan?.content || wordCount(commercPlan.content) < 500) {
      flaws.push('FATAL: Missing or inadequate commercialization strategy for Phase II');
    }
  }

  // Check for over-ambitious scope
  if (specificAims?.content) {
    const content = stripHtml(specificAims.content).toLowerCase();
    const aimMatches = content.match(/aim\s*\d|specific\s*aim/gi) || [];
    if (aimMatches.length > 4) {
      flaws.push('WARNING: Potentially over-ambitious scope (more than 4 specific aims)');
    }
  }

  // Check required attachments
  const requiredMissing = attachments.filter(a => a.required && a.status !== 'uploaded');
  if (requiredMissing.length > 3) {
    flaws.push(`FATAL: Multiple required attachments missing (${requiredMissing.length})`);
  }

  // Check for minimal content across sections
  const emptySections = sections.filter(s => !s.content || wordCount(s.content) < 100);
  if (emptySections.length > 0) {
    flaws.push(`FATAL: ${emptySections.length} section(s) have insufficient content`);
  }

  return flaws;
}

// Calculate overall impact score
function calculateOverallImpact(criterionScores: ReviewResult['criterionScores'], fatalFlaws: string[]): number {
  if (fatalFlaws.some(f => f.startsWith('FATAL'))) {
    return 9; // Fatal flaws = not fundable
  }

  const { significance, innovation, approach, investigators, environment } = criterionScores;
  // Weighted average - Significance, Innovation, Approach have more weight
  const weighted = (significance * 2 + innovation * 2 + approach * 3 + investigators * 1.5 + environment * 1.5) / 10;
  return Math.round(Math.max(1, Math.min(9, weighted)));
}

// Determine funding tier
function determineFundingTier(overallScore: number): string {
  if (overallScore <= 3) return 'Highly Competitive';
  if (overallScore <= 5) return 'Competitive';
  if (overallScore <= 7) return 'Marginal';
  return 'Not Competitive';
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { applicationId } = await req.json();
    
    const appResult = await sql`
      SELECT * FROM applications WHERE id = ${applicationId} AND user_id = ${userId}
    `;
    if (appResult.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const application = appResult[0];
    const sectionsResult = await sql`SELECT * FROM sections WHERE application_id = ${applicationId} ORDER BY order_index`;
    const attachmentsResult = await sql`SELECT * FROM attachments WHERE application_id = ${applicationId}`;

    const sections: Section[] = sectionsResult.map(s => ({
      title: s.title as string,
      type: s.type as string,
      content: s.content as string | null,
      page_limit: s.page_limit as number,
      page_count: s.page_count as number | null,
      required_headings: s.required_headings as string[] | null
    }));

    const attachments: Attachment[] = attachmentsResult.map(a => ({
      name: a.name as string,
      required: a.required as boolean,
      status: a.status as string
    }));

    const mechanismConfig = MECHANISMS[application.mechanism as string];
    const mechanismName = mechanismConfig?.name || application.mechanism as string;

    // Analyze each section
    const sectionAnalyses = sections.map(s => ({
      section: s.title,
      ...analyzeSection(s)
    }));

    // Aggregate strengths and weaknesses
    const allStrengths = sectionAnalyses.flatMap(a => a.strengths);
    const allWeaknesses = sectionAnalyses.flatMap(a => a.weaknesses);
    const detailedFeedback = sectionAnalyses.map(a => ({
      section: a.section,
      feedback: a.feedback
    })).filter(f => f.feedback.length > 0);

    // Calculate criterion scores
    const researchAnalysis = sectionAnalyses.find(a => a.section.includes('Research Strategy'));
    const aimsAnalysis = sectionAnalyses.find(a => a.section.includes('Specific Aims'));
    const commercAnalysis = sectionAnalyses.find(a => a.section.includes('Commercialization'));

    const criterionScores = {
      significance: researchAnalysis?.score || 5,
      innovation: Math.min(9, (researchAnalysis?.score || 5) + (allStrengths.some(s => s.includes('Innovation')) ? -1 : 1)),
      approach: researchAnalysis?.score || 5,
      investigators: 5, // Based on biographical sketches - default middle
      environment: attachments.some(a => a.name.includes('Facilities') && a.status === 'uploaded') ? 4 : 6
    };

    // Detect fatal flaws
    const fatalFlaws = detectFatalFlaws(sections, attachments, mechanismName);

    // Calculate overall impact
    const overallImpactScore = calculateOverallImpact(criterionScores, fatalFlaws);
    const fundingTier = determineFundingTier(overallImpactScore);

    const reviewResult: ReviewResult = {
      criterionScores,
      strengths: allStrengths.slice(0, 10), // Top 10 strengths
      weaknesses: allWeaknesses.slice(0, 10), // Top 10 weaknesses
      fatalFlaws,
      overallImpactScore,
      fundingTier,
      detailedFeedback
    };

    return NextResponse.json(reviewResult);
  } catch (error) {
    console.error('Review simulation error:', error);
    return NextResponse.json({ error: 'Review simulation failed' }, { status: 500 });
  }
}
