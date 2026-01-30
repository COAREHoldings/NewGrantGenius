import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// Grant content generation endpoint
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { type, data, applicationId, userId } = await request.json();

    switch (type) {
      case 'gap_statement':
        return generateGapStatement(data);
      case 'hypothesis':
        return generateHypothesis(data);
      case 'aims':
        return generateAims(data);
      case 'validate_aims':
        return validateAims(data);
      case 'save_section':
        return saveSection(supabase, applicationId, data);
      case 'load_application':
        return loadApplication(supabase, applicationId);
      case 'run_reviewer_simulation':
        return runReviewerSimulation(supabase, applicationId, data);
      case 'create_application':
        return createApplication(supabase, userId, data);
      default:
        return NextResponse.json({ error: 'Unknown generation type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Grant generation error:', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}

function generateGapStatement(data: {
  whatIsKnown: string;
  whatIsUnknown: string;
  criticalGaps: string;
  clinicalImportance: string;
  diseaseArea: string;
  target: string;
}) {
  // In production, this would call an LLM API
  // For now, generate structured output based on inputs
  
  const { whatIsKnown, whatIsUnknown, criticalGaps, clinicalImportance, diseaseArea, target } = data;
  
  // Generate gap statement
  const gapStatement = `While ${whatIsKnown.slice(0, 100).toLowerCase()}, significant gaps remain in our understanding of ${whatIsUnknown.slice(0, 100).toLowerCase()}. Specifically, ${criticalGaps}. This gap is critical because ${clinicalImportance.slice(0, 150).toLowerCase()}.`;
  
  // Generate impact paragraph
  const impactParagraph = `The proposed research addresses a critical unmet need in ${diseaseArea}. By targeting ${target}, this project will ${criticalGaps.includes('mechanism') ? 'elucidate key mechanisms' : 'develop novel therapeutic approaches'} that have the potential to ${clinicalImportance.toLowerCase().includes('patient') ? 'significantly improve patient outcomes' : 'transform the treatment landscape'}. The clinical and commercial implications of this work extend to ${diseaseArea} patients who currently lack effective treatment options.`;
  
  // Suggest refined title
  const refinedTitle = target && diseaseArea 
    ? `Targeting ${target} as a Novel Therapeutic Strategy for ${diseaseArea}`
    : undefined;
  
  return NextResponse.json({
    gapStatement,
    impactParagraph,
    refinedTitle
  });
}

function generateHypothesis(data: {
  gapStatement: string;
  diseaseArea: string;
  target: string;
  title: string;
}) {
  const { gapStatement, diseaseArea, target, title } = data;
  
  // Generate hypothesis based on gap
  const hypothesis = `We hypothesize that ${target ? `targeting ${target}` : 'our proposed intervention'} will effectively address the identified knowledge gap by providing mechanistic insight into ${diseaseArea} pathophysiology, ultimately leading to improved therapeutic outcomes.`;
  
  // Generate mechanistic framing
  const mechanisticFraming = `The proposed mechanism involves ${target ? `modulation of ${target}` : 'targeted intervention'}, which we predict will result in measurable changes to disease-relevant endpoints. This mechanistic understanding will provide the foundation for rational therapeutic development.`;
  
  // Generate clinical implication
  const clinicalImplication = `If validated, this hypothesis will establish ${target || 'our approach'} as a viable therapeutic target for ${diseaseArea}. This would represent a significant advancement in the field, potentially leading to novel treatment options for patients who currently have limited therapeutic choices.`;
  
  return NextResponse.json({
    hypothesis,
    mechanisticFraming,
    clinicalImplication
  });
}

function generateAims(data: {
  hypothesis: string;
  gapStatement: string;
  numAims: number;
}) {
  // Generate suggested aims based on hypothesis
  const aims = [];
  
  for (let i = 1; i <= (data.numAims || 3); i++) {
    if (i === 1) {
      aims.push({
        id: i.toString(),
        scientificQuestion: 'Establish proof-of-concept for the proposed mechanism',
        expectedOutcome: 'Demonstration of target engagement and preliminary efficacy',
        experimentalModel: 'In vitro cellular models',
        linksToHypothesis: 'Tests the fundamental premise of the hypothesis'
      });
    } else if (i === 2) {
      aims.push({
        id: i.toString(),
        scientificQuestion: 'Validate findings in a more complex disease model',
        expectedOutcome: 'Confirmation of in vitro results in disease-relevant context',
        experimentalModel: 'In vivo animal models or ex vivo human samples',
        linksToHypothesis: 'Extends hypothesis testing to translational models'
      });
    } else {
      aims.push({
        id: i.toString(),
        scientificQuestion: 'Determine translational potential and optimize for clinical development',
        expectedOutcome: 'IND-enabling data or clinical development pathway',
        experimentalModel: 'GLP studies or clinical samples',
        linksToHypothesis: 'Validates clinical relevance of hypothesis'
      });
    }
  }
  
  return NextResponse.json({ aims });
}

function validateAims(data: {
  aims: Array<{
    scientificQuestion: string;
    expectedOutcome: string;
    experimentalModel: string;
    linksToHypothesis: string;
  }>;
  hypothesis: string;
  gapStatement: string;
}) {
  const { aims, hypothesis, gapStatement } = data;
  const issues: string[] = [];
  const warnings: string[] = [];
  const passed: string[] = [];
  
  // Check each aim
  aims.forEach((aim, idx) => {
    const aimNum = idx + 1;
    
    // Check for clear question
    if (!aim.scientificQuestion || aim.scientificQuestion.length < 20) {
      issues.push(`Aim ${aimNum}: Scientific question is too vague or missing`);
    } else {
      passed.push(`Aim ${aimNum}: Has clear scientific question`);
    }
    
    // Check for testable outcome
    const testableWords = ['measure', 'determine', 'demonstrate', 'show', 'establish', 'quantify', 'assess'];
    if (!testableWords.some(w => aim.expectedOutcome.toLowerCase().includes(w))) {
      warnings.push(`Aim ${aimNum}: Expected outcome may not be easily measurable`);
    } else {
      passed.push(`Aim ${aimNum}: Has measurable outcome`);
    }
    
    // Check link to hypothesis
    if (!aim.linksToHypothesis || aim.linksToHypothesis.length < 10) {
      issues.push(`Aim ${aimNum}: Missing clear link to central hypothesis`);
    }
    
    // Check for exploratory vagueness
    const vagueWords = ['explore', 'investigate broadly', 'examine various', 'look at'];
    if (vagueWords.some(w => aim.scientificQuestion.toLowerCase().includes(w))) {
      warnings.push(`Aim ${aimNum}: Question may be too exploratory - consider making more specific`);
    }
  });
  
  // Check collective coherence
  if (aims.length >= 2) {
    passed.push('Multiple aims provide comprehensive coverage');
  }
  
  // Check logical ordering (first aim should be foundational)
  if (aims[0]?.experimentalModel?.toLowerCase().includes('vivo') && 
      aims[1]?.experimentalModel?.toLowerCase().includes('vitro')) {
    warnings.push('Consider reordering: in vitro studies typically precede in vivo work');
  }
  
  return NextResponse.json({
    isValid: issues.length === 0,
    issues,
    warnings,
    passed,
    coherenceScore: Math.max(0, 100 - (issues.length * 20) - (warnings.length * 10))
  });
}

// GET endpoint for validation rules
export async function GET() {
  return NextResponse.json({
    modules: [
      {
        id: 'title',
        name: 'Title & Concept Clarity',
        requiredFields: ['workingTitle', 'diseaseArea', 'whatIsKnown', 'criticalGaps'],
        outputs: ['refinedTitle', 'gapStatement', 'impactParagraph']
      },
      {
        id: 'hypothesis',
        name: 'Hypothesis Generation',
        requiredFields: ['gapStatement'],
        outputs: ['centralHypothesis', 'mechanisticFraming', 'clinicalImplication'],
        validationCriteria: ['resolvesGap', 'isTestable', 'isFalsifiable']
      },
      {
        id: 'aims',
        name: 'Specific Aims Builder',
        requiredFields: ['centralHypothesis'],
        outputs: ['aims'],
        validationCriteria: ['clearQuestion', 'testableOutcome', 'linksToHypothesis', 'noExploratoryVagueness']
      }
    ],
    fundingMechanisms: [
      { id: 'r01', name: 'NIH R01', maxAims: 3, emphasizes: ['innovation', 'approach'] },
      { id: 'sbir1', name: 'SBIR Phase I', maxAims: 2, emphasizes: ['commercialization', 'feasibility'] },
      { id: 'sbir2', name: 'SBIR Phase II', maxAims: 3, emphasizes: ['commercialization', 'scalability'] },
      { id: 'dod', name: 'DoD CDMRP', maxAims: 3, emphasizes: ['military relevance', 'translational potential'] }
    ]
  });
}

// ============= Database Operations =============

async function createApplication(supabase: any, userId: string, data: { title: string; mechanism: string }) {
  const { data: app, error } = await supabase
    .from('applications')
    .insert({
      user_id: userId,
      title: data.title,
      mechanism: data.mechanism,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ application: app });
}

async function saveSection(supabase: any, applicationId: string, data: { sectionType: string; content: any }) {
  const { sectionType, content } = data;

  // Upsert section content
  const { data: section, error } = await supabase
    .from('sections')
    .upsert({
      application_id: applicationId,
      section_type: sectionType,
      content: content,
      updated_at: new Date().toISOString()
    }, { onConflict: 'application_id,section_type' })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update application timestamp
  await supabase
    .from('applications')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', applicationId);

  return NextResponse.json({ section });
}

async function loadApplication(supabase: any, applicationId: string) {
  // Get application
  const { data: app, error: appError } = await supabase
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .single();

  if (appError) {
    return NextResponse.json({ error: appError.message }, { status: 404 });
  }

  // Get all sections
  const { data: sections } = await supabase
    .from('sections')
    .select('*')
    .eq('application_id', applicationId);

  // Get latest reviewer simulation
  const { data: simulation } = await supabase
    .from('reviewer_simulations')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({ application: app, sections: sections || [], simulation });
}

// ============= Reviewer Simulation Scoring Engine =============

async function runReviewerSimulation(supabase: any, applicationId: string, data: { sections: any }) {
  const { sections } = data;

  // NIH-style scoring (1-9 scale, 1 is best)
  const scores = {
    significance: calculateSignificanceScore(sections),
    innovation: calculateInnovationScore(sections),
    approach: calculateApproachScore(sections),
    investigators: 5, // Default to middle until team info provided
    environment: 5    // Default to middle until environment info provided
  };

  // Calculate overall impact score (weighted average)
  const overallScore = Math.round(
    (scores.significance * 0.25 + 
     scores.innovation * 0.20 + 
     scores.approach * 0.35 + 
     scores.investigators * 0.10 + 
     scores.environment * 0.10) * 10
  ) / 10;

  const feedback = generateReviewerFeedback(scores, sections);
  const strengths = extractStrengths(scores, sections);
  const weaknesses = extractWeaknesses(scores, sections);

  // Save simulation result
  const { data: simulation, error } = await supabase
    .from('reviewer_simulations')
    .insert({
      application_id: applicationId,
      scores: scores,
      overall_score: overallScore,
      feedback: feedback,
      strengths: strengths,
      weaknesses: weaknesses,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    simulation,
    scores,
    overallScore,
    feedback,
    strengths,
    weaknesses,
    fundable: overallScore <= 3.0
  });
}

function calculateSignificanceScore(sections: any): number {
  let score = 5; // Start neutral
  
  const gapSection = sections.find((s: any) => s.section_type === 'gap_statement');
  const hypothesisSection = sections.find((s: any) => s.section_type === 'hypothesis');
  
  if (gapSection?.content) {
    // Check for clear clinical relevance
    const content = JSON.stringify(gapSection.content).toLowerCase();
    if (content.includes('patient') || content.includes('clinical')) score -= 1;
    if (content.includes('unmet need') || content.includes('mortality')) score -= 1;
    if (content.length > 500) score -= 0.5; // Well-developed
  }
  
  if (hypothesisSection?.content) {
    const content = JSON.stringify(hypothesisSection.content).toLowerCase();
    if (content.includes('mechanism')) score -= 0.5;
  }
  
  return Math.max(1, Math.min(9, Math.round(score)));
}

function calculateInnovationScore(sections: any): number {
  let score = 5;
  
  const allContent = JSON.stringify(sections).toLowerCase();
  
  if (allContent.includes('novel') || allContent.includes('first')) score -= 1;
  if (allContent.includes('paradigm') || allContent.includes('transform')) score -= 1;
  if (allContent.includes('unique') || allContent.includes('innovative')) score -= 0.5;
  
  return Math.max(1, Math.min(9, Math.round(score)));
}

function calculateApproachScore(sections: any): number {
  let score = 5;
  
  const aimsSection = sections.find((s: any) => s.section_type === 'aims');
  
  if (aimsSection?.content?.aims) {
    const aims = aimsSection.content.aims;
    if (aims.length >= 2 && aims.length <= 3) score -= 1;
    
    // Check aim quality
    aims.forEach((aim: any) => {
      if (aim.scientificQuestion?.length > 50) score -= 0.3;
      if (aim.expectedOutcome?.length > 30) score -= 0.2;
      if (aim.linksToHypothesis?.length > 20) score -= 0.2;
    });
  }
  
  return Math.max(1, Math.min(9, Math.round(score)));
}

function generateReviewerFeedback(scores: any, sections: any): string[] {
  const feedback: string[] = [];
  
  if (scores.significance <= 3) {
    feedback.push('The significance of this research is well-articulated with clear clinical relevance.');
  } else if (scores.significance >= 6) {
    feedback.push('Consider strengthening the significance by more clearly articulating the clinical impact and unmet need.');
  }
  
  if (scores.innovation <= 3) {
    feedback.push('The innovative aspects of this proposal are compelling and could advance the field.');
  } else if (scores.innovation >= 6) {
    feedback.push('The innovation could be better highlighted - what makes this approach truly novel?');
  }
  
  if (scores.approach <= 3) {
    feedback.push('The experimental approach is rigorous with well-designed aims.');
  } else if (scores.approach >= 6) {
    feedback.push('The approach needs more detail on methodology and potential pitfalls.');
  }
  
  return feedback;
}

function extractStrengths(scores: any, sections: any): string[] {
  const strengths: string[] = [];
  
  if (scores.significance <= 4) strengths.push('Strong significance with clear clinical relevance');
  if (scores.innovation <= 4) strengths.push('Innovative approach that could transform the field');
  if (scores.approach <= 4) strengths.push('Well-designed experimental strategy');
  
  return strengths.length ? strengths : ['Application is in early development - continue building'];
}

function extractWeaknesses(scores: any, sections: any): string[] {
  const weaknesses: string[] = [];
  
  if (scores.significance >= 6) weaknesses.push('Significance/clinical relevance needs strengthening');
  if (scores.innovation >= 6) weaknesses.push('Innovation not clearly differentiated from existing work');
  if (scores.approach >= 6) weaknesses.push('Experimental approach lacks sufficient detail');
  
  return weaknesses;
}
