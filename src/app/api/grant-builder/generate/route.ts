import { NextRequest, NextResponse } from 'next/server';

// Grant content generation endpoint
export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json();

    switch (type) {
      case 'gap_statement':
        return generateGapStatement(data);
      case 'hypothesis':
        return generateHypothesis(data);
      case 'aims':
        return generateAims(data);
      case 'validate_aims':
        return validateAims(data);
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
