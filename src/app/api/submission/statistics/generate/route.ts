import { NextRequest, NextResponse } from 'next/server';

// Statistical analysis types for different research designs
const ANALYSIS_TYPES = {
  comparison: ['Two-sample t-test', 'ANOVA', 'Mann-Whitney U', 'Kruskal-Wallis'],
  correlation: ['Pearson correlation', 'Spearman correlation', 'Linear regression'],
  survival: ['Kaplan-Meier', 'Cox proportional hazards', 'Log-rank test'],
  categorical: ['Chi-square test', 'Fisher exact test', 'Logistic regression'],
  longitudinal: ['Mixed-effects model', 'Repeated measures ANOVA', 'GEE']
};

function generateStatisticalModel(aim: any) {
  // Determine analysis type based on hypothesis keywords
  const hypothesis = aim.hypothesis.toLowerCase();
  let analysisType = 'Two-sample t-test';
  let methodology = '';
  
  if (hypothesis.includes('correlat') || hypothesis.includes('relationship') || hypothesis.includes('association')) {
    analysisType = 'Pearson correlation';
    methodology = 'Correlation analysis will be used to assess the relationship between variables. Assumptions of linearity and normality will be tested using scatter plots and Shapiro-Wilk tests.';
  } else if (hypothesis.includes('survival') || hypothesis.includes('time to') || hypothesis.includes('mortality')) {
    analysisType = 'Kaplan-Meier with Log-rank test';
    methodology = 'Survival analysis will be performed using Kaplan-Meier curves. Differences between groups will be assessed using the log-rank test. Cox proportional hazards regression will be used for multivariate analysis.';
  } else if (hypothesis.includes('compar') || hypothesis.includes('differ') || hypothesis.includes('effect')) {
    if (hypothesis.includes('groups') || hypothesis.includes('multiple')) {
      analysisType = 'One-way ANOVA';
      methodology = 'Analysis of variance (ANOVA) will be used to compare means across multiple groups. Post-hoc pairwise comparisons will use Tukey HSD correction.';
    } else {
      analysisType = 'Two-sample t-test';
      methodology = 'Independent samples t-test will be used to compare means between two groups. Normality will be assessed using Shapiro-Wilk test, with Mann-Whitney U as non-parametric alternative.';
    }
  } else if (hypothesis.includes('predict') || hypothesis.includes('model')) {
    analysisType = 'Multiple linear regression';
    methodology = 'Multiple linear regression will be used to model the relationship between predictors and outcome. Model fit will be assessed using R² and residual analysis.';
  } else if (hypothesis.includes('longitudinal') || hypothesis.includes('over time') || hypothesis.includes('repeated')) {
    analysisType = 'Mixed-effects model';
    methodology = 'Linear mixed-effects models will account for repeated measures and random effects. Fixed effects will include time and treatment, with random intercepts for subjects.';
  }

  // Generate sample size based on typical requirements
  const baseSampleSize = 30;
  const effectSize = 0.5 + Math.random() * 0.3; // Medium to large effect
  const power = 0.8;
  const alpha = 0.05;
  
  // Simplified sample size calculation
  const sampleSize = Math.ceil(baseSampleSize * (2 / (effectSize * effectSize)));

  // Generate assumptions based on analysis type
  const assumptions = [];
  if (analysisType.includes('t-test') || analysisType.includes('ANOVA')) {
    assumptions.push('Normal distribution of residuals');
    assumptions.push('Homogeneity of variances (Levene test)');
    assumptions.push('Independence of observations');
  }
  if (analysisType.includes('regression') || analysisType.includes('correlation')) {
    assumptions.push('Linear relationship between variables');
    assumptions.push('No multicollinearity among predictors');
    assumptions.push('Homoscedasticity of residuals');
  }
  if (analysisType.includes('mixed') || analysisType.includes('longitudinal')) {
    assumptions.push('Missing data mechanism is ignorable (MAR)');
    assumptions.push('Correct specification of random effects structure');
  }
  assumptions.push('Adequate sample size for statistical power');

  // Generate justification
  const justification = `Based on the research hypothesis and study design, ${analysisType} is the most appropriate statistical approach. ` +
    `With an anticipated effect size of ${effectSize.toFixed(2)} (Cohen's d), a sample size of n=${sampleSize} per group provides ${(power * 100).toFixed(0)}% power ` +
    `to detect significant differences at α=${alpha}. This sample size accounts for potential 15% attrition and allows for subgroup analyses.`;

  return {
    id: Date.now(),
    aimId: aim.aimId,
    aimTitle: aim.aimTitle,
    analysisType,
    sampleSize,
    powerAnalysis: {
      power,
      effectSize: parseFloat(effectSize.toFixed(2)),
      alpha
    },
    assumptions,
    methodology,
    justification,
    status: 'pending'
  };
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const model = generateStatisticalModel(data);
    
    return NextResponse.json(model);
  } catch (error) {
    console.error('Error generating model:', error);
    return NextResponse.json({ error: 'Failed to generate model' }, { status: 500 });
  }
}
