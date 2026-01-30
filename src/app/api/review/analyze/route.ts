import { NextResponse } from 'next/server';
import pdf from 'pdf-parse';

// NIH Review Criteria Sections
const REVIEW_SECTIONS = [
  { name: 'Specific Aims', maxScore: 15, keywords: ['specific aims', 'objective', 'hypothesis', 'goal'] },
  { name: 'Significance', maxScore: 15, keywords: ['significance', 'importance', 'impact', 'public health', 'clinical relevance'] },
  { name: 'Innovation', maxScore: 15, keywords: ['innovation', 'novel', 'unique', 'first', 'new approach', 'paradigm'] },
  { name: 'Approach', maxScore: 25, keywords: ['approach', 'research strategy', 'methodology', 'experimental design', 'methods'] },
  { name: 'Investigators', maxScore: 10, keywords: ['investigator', 'team', 'expertise', 'qualification', 'biosketch', 'experience'] },
  { name: 'Environment', maxScore: 10, keywords: ['environment', 'facilities', 'resources', 'equipment', 'institutional support'] },
  { name: 'Budget', maxScore: 10, keywords: ['budget', 'cost', 'funding', 'resources', 'personnel costs'] },
];

function detectGrantType(text: string): string {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('sbir') && lowerText.includes('sttr')) return 'SBIR/STTR Fast-Track';
  if (lowerText.includes('sbir')) return 'SBIR';
  if (lowerText.includes('sttr')) return 'STTR';
  if (lowerText.includes('r01')) return 'NIH R01';
  if (lowerText.includes('r21')) return 'NIH R21';
  if (lowerText.includes('r03')) return 'NIH R03';
  if (lowerText.includes('nci')) return 'NCI Grant';
  if (lowerText.includes('sf 424') || lowerText.includes('sf424')) return 'Federal Grant (SF-424)';
  return 'Grant Application';
}

function extractProjectTitle(text: string): string {
  // Look for common title patterns
  const patterns = [
    /project title[:\s]*([^\n]+)/i,
    /descriptive title[:\s]*([^\n]+)/i,
    /title of project[:\s]*([^\n]+)/i,
    /targeting[^:]+:[^\n]*precision/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1]?.trim() || match[0].trim();
  }
  
  // Fallback - look for a capitalized line early in the document
  const lines = text.split('\n').slice(0, 50);
  for (const line of lines) {
    if (line.length > 20 && line.length < 200 && /^[A-Z]/.test(line)) {
      return line.trim();
    }
  }
  
  return 'Untitled Grant Application';
}

function analyzeSection(text: string, section: typeof REVIEW_SECTIONS[0]): {
  score: number;
  status: 'excellent' | 'good' | 'needs_work' | 'missing';
  findings: string[];
  recommendations: string[];
} {
  const lowerText = text.toLowerCase();
  const findings: string[] = [];
  const recommendations: string[] = [];
  
  // Check if section content exists
  const keywordMatches = section.keywords.filter(kw => lowerText.includes(kw)).length;
  const hasSection = keywordMatches >= 2;
  
  if (!hasSection) {
    return {
      score: 0,
      status: 'missing',
      findings: [`${section.name} section not clearly identified in document`],
      recommendations: [`Add a dedicated ${section.name} section with clear headers`],
    };
  }
  
  // Calculate base score based on content presence and quality indicators
  let score = Math.floor(section.maxScore * 0.5); // Base 50% for having the section
  
  // Quality indicators
  const qualityIndicators = {
    hasData: /data|result|figure|table|evidence/i.test(text),
    hasReferences: /reference|citation|\[\d+\]|\(\d{4}\)/i.test(text),
    hasTimeline: /year|month|phase|timeline|milestone/i.test(text),
    hasQuantitative: /\d+%|\d+ month|\$[\d,]+/i.test(text),
    hasClear: /objective|goal|aim|hypothesis/i.test(text),
  };
  
  // Section-specific analysis
  switch (section.name) {
    case 'Specific Aims':
      if (/aim\s*[1-3]|objective\s*[1-3]/i.test(text)) {
        score += Math.floor(section.maxScore * 0.2);
        findings.push('Clear enumeration of aims detected');
      } else {
        recommendations.push('Number your specific aims clearly (Aim 1, Aim 2, etc.)');
      }
      if (/hypothesis/i.test(text)) {
        score += Math.floor(section.maxScore * 0.15);
        findings.push('Hypothesis statement included');
      } else {
        recommendations.push('Include a clear hypothesis statement');
      }
      if (/long.?term goal|overall goal/i.test(text)) {
        score += Math.floor(section.maxScore * 0.15);
        findings.push('Long-term goals articulated');
      }
      break;
      
    case 'Significance':
      if (/public health|clinical|patient/i.test(text)) {
        score += Math.floor(section.maxScore * 0.2);
        findings.push('Public health relevance addressed');
      } else {
        recommendations.push('Emphasize the public health significance and potential clinical impact');
      }
      if (/gap|unmet need|limitation/i.test(text)) {
        score += Math.floor(section.maxScore * 0.15);
        findings.push('Knowledge gaps identified');
      }
      if (/survival|mortality|morbidity|prevalence/i.test(text)) {
        score += Math.floor(section.maxScore * 0.15);
        findings.push('Disease burden statistics included');
      } else {
        recommendations.push('Include disease statistics (incidence, mortality, survival rates)');
      }
      break;
      
    case 'Innovation':
      if (/first|novel|unique|new/i.test(text)) {
        score += Math.floor(section.maxScore * 0.2);
        findings.push('Novel aspects highlighted');
      }
      if (/paradigm|transform|revolutionize/i.test(text)) {
        score += Math.floor(section.maxScore * 0.15);
        findings.push('Paradigm-shifting potential described');
      } else {
        recommendations.push('Articulate how this work could shift current paradigms');
      }
      if (/proprietary|patent|intellectual property/i.test(text)) {
        score += Math.floor(section.maxScore * 0.15);
        findings.push('IP/proprietary technology mentioned');
      }
      break;
      
    case 'Approach':
      if (qualityIndicators.hasData) {
        score += Math.floor(section.maxScore * 0.1);
        findings.push('Preliminary data referenced');
      } else {
        recommendations.push('Include preliminary data to support feasibility');
      }
      if (qualityIndicators.hasTimeline) {
        score += Math.floor(section.maxScore * 0.1);
        findings.push('Timeline/milestones included');
      } else {
        recommendations.push('Add a clear timeline with milestones');
      }
      if (/statistical|power|sample size/i.test(text)) {
        score += Math.floor(section.maxScore * 0.1);
        findings.push('Statistical considerations addressed');
      } else {
        recommendations.push('Include power analysis and sample size justification');
      }
      if (/alternative|contingency|risk/i.test(text)) {
        score += Math.floor(section.maxScore * 0.1);
        findings.push('Alternative approaches considered');
      } else {
        recommendations.push('Describe potential pitfalls and alternative strategies');
      }
      if (/control|comparison|placebo/i.test(text)) {
        score += Math.floor(section.maxScore * 0.1);
        findings.push('Appropriate controls described');
      }
      break;
      
    case 'Investigators':
      if (/expertise|experience|publications/i.test(text)) {
        score += Math.floor(section.maxScore * 0.2);
        findings.push('Team expertise documented');
      }
      if (/collaboration|partnership|consortium/i.test(text)) {
        score += Math.floor(section.maxScore * 0.15);
        findings.push('Collaborations established');
      }
      if (/training|mentor/i.test(text)) {
        score += Math.floor(section.maxScore * 0.15);
        findings.push('Training opportunities mentioned');
      }
      break;
      
    case 'Environment':
      if (/facility|facilities|laboratory/i.test(text)) {
        score += Math.floor(section.maxScore * 0.2);
        findings.push('Facilities described');
      } else {
        recommendations.push('Detail available facilities and resources');
      }
      if (/equipment|instrument/i.test(text)) {
        score += Math.floor(section.maxScore * 0.15);
        findings.push('Equipment resources listed');
      }
      if (/core|shared resource/i.test(text)) {
        score += Math.floor(section.maxScore * 0.15);
        findings.push('Access to core facilities noted');
      }
      break;
      
    case 'Budget':
      if (/justification/i.test(text)) {
        score += Math.floor(section.maxScore * 0.2);
        findings.push('Budget justification included');
      } else {
        recommendations.push('Provide detailed budget justification for each category');
      }
      if (qualityIndicators.hasQuantitative) {
        score += Math.floor(section.maxScore * 0.15);
        findings.push('Detailed cost breakdown provided');
      }
      if (/fringe|indirect|f&a/i.test(text)) {
        score += Math.floor(section.maxScore * 0.15);
        findings.push('F&A/fringe rates addressed');
      }
      break;
  }
  
  // Determine status based on score percentage
  const scorePercent = score / section.maxScore;
  let status: 'excellent' | 'good' | 'needs_work' | 'missing';
  if (scorePercent >= 0.85) status = 'excellent';
  else if (scorePercent >= 0.65) status = 'good';
  else if (scorePercent >= 0.4) status = 'needs_work';
  else status = 'missing';
  
  return { score: Math.min(score, section.maxScore), status, findings, recommendations };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Parse PDF to extract text
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let text: string;
    try {
      const pdfData = await pdf(buffer);
      text = pdfData.text;
    } catch {
      // Fallback for non-PDF or parsing errors
      text = new TextDecoder().decode(arrayBuffer);
    }
    
    // Detect grant type and extract title
    const grantType = detectGrantType(text);
    const projectTitle = extractProjectTitle(text);
    
    // Analyze each section
    const sections = REVIEW_SECTIONS.map(section => ({
      name: section.name,
      maxScore: section.maxScore,
      ...analyzeSection(text, section),
    }));
    
    // Calculate overall score
    const totalScore = sections.reduce((sum, s) => sum + s.score, 0);
    const maxPossible = sections.reduce((sum, s) => sum + s.maxScore, 0);
    const overallScore = Math.round((totalScore / maxPossible) * 100);
    
    // Determine fundability rating
    let fundabilityRating: 'High' | 'Medium' | 'Low' | 'Needs Major Revision';
    if (overallScore >= 80) fundabilityRating = 'High';
    else if (overallScore >= 60) fundabilityRating = 'Medium';
    else if (overallScore >= 40) fundabilityRating = 'Low';
    else fundabilityRating = 'Needs Major Revision';
    
    // Compile overall strengths
    const strengthsOverall = sections
      .filter(s => s.status === 'excellent' || s.status === 'good')
      .flatMap(s => s.findings.slice(0, 2))
      .slice(0, 5);
    
    // Compile overall weaknesses  
    const weaknessesOverall = sections
      .filter(s => s.status === 'needs_work' || s.status === 'missing')
      .flatMap(s => s.recommendations.slice(0, 2))
      .slice(0, 5);
    
    // Top priorities - the most impactful improvements
    const topPriorities = sections
      .filter(s => s.status !== 'excellent')
      .sort((a, b) => b.maxScore - a.maxScore)
      .slice(0, 3)
      .map(s => s.recommendations[0] || `Improve ${s.name} section`)
      .filter(Boolean);
    
    return NextResponse.json({
      overallScore,
      fundabilityRating,
      grantType,
      projectTitle,
      sections,
      strengthsOverall,
      weaknessesOverall,
      topPriorities,
    });
    
  } catch (error) {
    console.error('Document analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze document' }, { status: 500 });
  }
}
