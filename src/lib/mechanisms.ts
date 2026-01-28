export interface MechanismConfig {
  id: string;
  name: string;
  agency: 'NIH' | 'DOD_CDMRP' | 'CPRIT';
  program?: string;
  description: string;
  sections: SectionConfig[];
  attachments: AttachmentConfig[];
}

export interface SectionConfig {
  type: string;
  title: string;
  pageLimit: number;
  requiredHeadings?: string[];
  description: string;
  format?: 'narrative' | 'milestone'; // For DoD SOW
}

export interface AttachmentConfig {
  name: string;
  required: boolean;
  description: string;
}

// NIH Attachments
const nihBaseAttachments: AttachmentConfig[] = [
  { name: 'PHS 398 Cover Page Supplement', required: true, description: 'Cover page with project information' },
  { name: 'Project Summary/Abstract', required: true, description: '30 lines max, no proprietary info' },
  { name: 'Project Narrative', required: true, description: '2-3 sentences for public health relevance' },
  { name: 'Facilities & Other Resources', required: true, description: 'Describe available facilities' },
  { name: 'Equipment', required: true, description: 'List major equipment' },
  { name: 'Biographical Sketch', required: true, description: 'For all senior/key personnel' },
  { name: 'Budget Justification', required: true, description: 'Detailed budget narrative' },
  { name: 'Authentication of Key Resources', required: false, description: 'If applicable' },
  { name: 'Letters of Support', required: false, description: 'From collaborators/consultants' },
];

const nihSbirAttachments: AttachmentConfig[] = [
  ...nihBaseAttachments,
  { name: 'SBIR/STTR Information', required: true, description: 'Company info and certifications' },
];

const nihSttrAttachments: AttachmentConfig[] = [
  ...nihBaseAttachments,
  { name: 'SBIR/STTR Information', required: true, description: 'Company info and certifications' },
  { name: 'Research Institution Letter', required: true, description: 'Commitment letter from research institution' },
];

// DoD CDMRP Attachments
const dodBaseAttachments: AttachmentConfig[] = [
  { name: 'SF424 Research & Related Cover', required: true, description: 'Federal grant cover page' },
  { name: 'Project Abstract', required: true, description: 'Unclassified abstract for public release' },
  { name: 'Biographical Sketch', required: true, description: 'For PI and key personnel' },
  { name: 'SF424 R&R Budget', required: true, description: 'Detailed budget with justification' },
  { name: 'Facilities & Resources', required: true, description: 'Available resources and environment' },
  { name: 'Equipment', required: true, description: 'Major equipment list' },
  { name: 'Letters of Support', required: false, description: 'Collaborator commitment letters' },
  { name: 'Human Subjects Documentation', required: false, description: 'IRB approval if applicable' },
  { name: 'Animal Use Documentation', required: false, description: 'IACUC approval if applicable' },
];

const dodSbirAttachments: AttachmentConfig[] = [
  ...dodBaseAttachments,
  { name: 'Company Commercialization Report', required: true, description: 'SBA company registry report' },
  { name: 'Cost Volume', required: true, description: 'Detailed cost breakdown' },
  { name: 'Commercialization Strategy', required: true, description: 'Path to market' },
];

// DoD CDMRP Programs
export const DOD_PROGRAMS = {
  PRCRP: { id: 'PRCRP', name: 'Peer Reviewed Cancer Research Program', description: 'Supports cancer research across all cancer types' },
  BCRP: { id: 'BCRP', name: 'Breast Cancer Research Program', description: 'Dedicated to breast cancer eradication' },
  PCRP: { id: 'PCRP', name: 'Prostate Cancer Research Program', description: 'Prostate cancer research and treatment' },
  KCRP: { id: 'KCRP', name: 'Kidney Cancer Research Program', description: 'Kidney cancer research initiatives' },
  LCRP: { id: 'LCRP', name: 'Lung Cancer Research Program', description: 'Lung cancer research and prevention' },
  SBIR_STTR: { id: 'SBIR_STTR', name: 'DoD SBIR/STTR', description: 'Small business innovation programs' },
};

// NIH SBIR/STTR Mechanisms
export const MECHANISMS: Record<string, MechanismConfig> = {
  // ============ NIH MECHANISMS ============
  'R43': {
    id: 'R43',
    name: 'SBIR Phase I (R43)',
    agency: 'NIH',
    description: 'Small Business Innovation Research Phase I - Feasibility study up to $293,697 total costs',
    sections: [
      { type: 'specific_aims', title: 'Specific Aims', pageLimit: 1, description: 'State objectives and specific aims' },
      { type: 'research_strategy', title: 'Research Strategy', pageLimit: 6, requiredHeadings: ['Significance', 'Innovation', 'Approach'], description: 'Significance, Innovation, and Approach sections' },
      { type: 'commercialization_plan', title: 'Commercialization Plan', pageLimit: 12, description: 'Market analysis and commercialization strategy' },
    ],
    attachments: nihSbirAttachments,
  },
  'R44': {
    id: 'R44',
    name: 'SBIR Phase II (R44)',
    agency: 'NIH',
    description: 'Small Business Innovation Research Phase II - Full R&D up to $1,956,460 total costs',
    sections: [
      { type: 'specific_aims', title: 'Specific Aims', pageLimit: 1, description: 'State objectives and specific aims' },
      { type: 'research_strategy', title: 'Research Strategy', pageLimit: 12, requiredHeadings: ['Significance', 'Innovation', 'Approach'], description: 'Significance, Innovation, and Approach sections' },
      { type: 'commercialization_plan', title: 'Commercialization Plan', pageLimit: 12, description: 'Market analysis and commercialization strategy' },
      { type: 'progress_report', title: 'Progress Report', pageLimit: 6, description: 'Phase I accomplishments and milestones' },
    ],
    attachments: nihSbirAttachments,
  },
  'SBIR_FAST_TRACK': {
    id: 'SBIR_FAST_TRACK',
    name: 'SBIR Fast-Track',
    agency: 'NIH',
    description: 'Combined Phase I and II application',
    sections: [
      { type: 'specific_aims', title: 'Specific Aims', pageLimit: 1, description: 'State objectives and specific aims' },
      { type: 'research_strategy', title: 'Research Strategy', pageLimit: 12, requiredHeadings: ['Significance', 'Innovation', 'Approach'], description: 'Significance, Innovation, and Approach sections' },
      { type: 'commercialization_plan', title: 'Commercialization Plan', pageLimit: 12, description: 'Market analysis and commercialization strategy' },
    ],
    attachments: nihSbirAttachments,
  },
  'R44_PHASE_IIB': {
    id: 'R44_PHASE_IIB',
    name: 'SBIR Phase IIB',
    agency: 'NIH',
    description: 'Competing continuation for additional Phase II funding',
    sections: [
      { type: 'specific_aims', title: 'Specific Aims', pageLimit: 1, description: 'State objectives and specific aims' },
      { type: 'research_strategy', title: 'Research Strategy', pageLimit: 12, requiredHeadings: ['Significance', 'Innovation', 'Approach'], description: 'Significance, Innovation, and Approach sections' },
      { type: 'commercialization_plan', title: 'Commercialization Plan', pageLimit: 12, description: 'Market analysis and commercialization strategy' },
      { type: 'progress_report', title: 'Progress Report', pageLimit: 6, description: 'Previous Phase II accomplishments' },
    ],
    attachments: nihSbirAttachments,
  },
  'R41': {
    id: 'R41',
    name: 'STTR Phase I (R41)',
    agency: 'NIH',
    description: 'Small Business Technology Transfer Phase I - Requires research institution partnership',
    sections: [
      { type: 'specific_aims', title: 'Specific Aims', pageLimit: 1, description: 'State objectives and specific aims' },
      { type: 'research_strategy', title: 'Research Strategy', pageLimit: 6, requiredHeadings: ['Significance', 'Innovation', 'Approach'], description: 'Significance, Innovation, and Approach sections' },
      { type: 'commercialization_plan', title: 'Commercialization Plan', pageLimit: 12, description: 'Market analysis and commercialization strategy' },
    ],
    attachments: nihSttrAttachments,
  },
  'R42': {
    id: 'R42',
    name: 'STTR Phase II (R42)',
    agency: 'NIH',
    description: 'Small Business Technology Transfer Phase II - Full R&D with research institution',
    sections: [
      { type: 'specific_aims', title: 'Specific Aims', pageLimit: 1, description: 'State objectives and specific aims' },
      { type: 'research_strategy', title: 'Research Strategy', pageLimit: 12, requiredHeadings: ['Significance', 'Innovation', 'Approach'], description: 'Significance, Innovation, and Approach sections' },
      { type: 'commercialization_plan', title: 'Commercialization Plan', pageLimit: 12, description: 'Market analysis and commercialization strategy' },
      { type: 'progress_report', title: 'Progress Report', pageLimit: 6, description: 'Phase I accomplishments and milestones' },
    ],
    attachments: nihSttrAttachments,
  },
  'STTR_FAST_TRACK': {
    id: 'STTR_FAST_TRACK',
    name: 'STTR Fast-Track',
    agency: 'NIH',
    description: 'Combined STTR Phase I and II application',
    sections: [
      { type: 'specific_aims', title: 'Specific Aims', pageLimit: 1, description: 'State objectives and specific aims' },
      { type: 'research_strategy', title: 'Research Strategy', pageLimit: 12, requiredHeadings: ['Significance', 'Innovation', 'Approach'], description: 'Significance, Innovation, and Approach sections' },
      { type: 'commercialization_plan', title: 'Commercialization Plan', pageLimit: 12, description: 'Market analysis and commercialization strategy' },
    ],
    attachments: nihSttrAttachments,
  },
  'R01': {
    id: 'R01',
    name: 'NIH R01 Research Project Grant',
    agency: 'NIH',
    description: 'Standard investigator-initiated research grant. Up to $500K/year direct costs for up to 5 years.',
    sections: [
      { type: 'specific_aims', title: 'Specific Aims', pageLimit: 1, description: 'State objectives and specific aims' },
      { type: 'research_strategy', title: 'Research Strategy', pageLimit: 12, requiredHeadings: ['Significance', 'Innovation', 'Approach'], description: 'Significance, Innovation, and Approach sections' },
      { type: 'bibliography', title: 'Bibliography & References Cited', pageLimit: 0, description: 'No page limit - list all references' },
    ],
    attachments: nihBaseAttachments,
  },

  // ============ DoD CDMRP MECHANISMS ============
  'DOD_IDEA': {
    id: 'DOD_IDEA',
    name: 'Idea Award',
    agency: 'DOD_CDMRP',
    description: 'Supports innovative, high-risk/high-reward research concepts. Typically $100K-$300K for 1-2 years.',
    sections: [
      { type: 'impact_statement', title: 'Impact Statement', pageLimit: 1, description: 'Describe potential impact on military health and cancer research' },
      { type: 'military_relevance', title: 'Military/Veteran Relevance', pageLimit: 1, description: 'Explain relevance to military personnel, veterans, or beneficiaries' },
      { type: 'specific_aims_dod', title: 'Specific Aims', pageLimit: 1, description: 'Clear statement of research objectives' },
      { type: 'research_strategy_dod', title: 'Research Strategy', pageLimit: 6, requiredHeadings: ['Background', 'Hypothesis', 'Specific Aims', 'Research Design'], description: 'Background, hypothesis, and research design' },
      { type: 'sow', title: 'Statement of Work', pageLimit: 3, format: 'milestone', description: 'Milestone-driven tasks and deliverables (not narrative format)' },
    ],
    attachments: dodBaseAttachments,
  },
  'DOD_IIRA': {
    id: 'DOD_IIRA',
    name: 'Investigator-Initiated Research Award',
    agency: 'DOD_CDMRP',
    description: 'Supports independent research ideas from investigators. Up to $600K for 3 years.',
    sections: [
      { type: 'impact_statement', title: 'Impact Statement', pageLimit: 1, description: 'Describe potential impact on military health and research field' },
      { type: 'military_relevance', title: 'Military/Veteran Relevance', pageLimit: 1, description: 'Explain relevance to military personnel, veterans, or beneficiaries' },
      { type: 'specific_aims_dod', title: 'Specific Aims', pageLimit: 1, description: 'Clear statement of research objectives' },
      { type: 'research_strategy_dod', title: 'Research Strategy', pageLimit: 10, requiredHeadings: ['Background', 'Hypothesis', 'Specific Aims', 'Research Design', 'Preliminary Data'], description: 'Comprehensive research plan with preliminary data' },
      { type: 'sow', title: 'Statement of Work', pageLimit: 3, format: 'milestone', description: 'Milestone-driven tasks and deliverables' },
    ],
    attachments: dodBaseAttachments,
  },
  'DOD_CDA': {
    id: 'DOD_CDA',
    name: 'Career Development Award',
    agency: 'DOD_CDMRP',
    description: 'Supports early-career researchers to develop independent research programs. Up to $360K for 3 years.',
    sections: [
      { type: 'impact_statement', title: 'Impact Statement', pageLimit: 1, description: 'Impact on cancer research and career development' },
      { type: 'military_relevance', title: 'Military/Veteran Relevance', pageLimit: 1, description: 'Relevance to military health' },
      { type: 'specific_aims_dod', title: 'Specific Aims', pageLimit: 1, description: 'Research objectives' },
      { type: 'research_strategy_dod', title: 'Research Strategy', pageLimit: 8, requiredHeadings: ['Background', 'Hypothesis', 'Research Design'], description: 'Research plan' },
      { type: 'career_development', title: 'Career Development Plan', pageLimit: 3, description: 'Mentorship, training goals, and career trajectory' },
      { type: 'sow', title: 'Statement of Work', pageLimit: 3, format: 'milestone', description: 'Milestone-driven deliverables' },
    ],
    attachments: [...dodBaseAttachments, { name: 'Mentor Letter', required: true, description: 'Letter from mentor describing training plan' }],
  },
  'DOD_TRA': {
    id: 'DOD_TRA',
    name: 'Translational Research Award',
    agency: 'DOD_CDMRP',
    description: 'Bridges basic research to clinical application. Up to $1M for 3 years.',
    sections: [
      { type: 'impact_statement', title: 'Impact Statement', pageLimit: 1, description: 'Translational impact and clinical relevance' },
      { type: 'military_relevance', title: 'Military/Veteran Relevance', pageLimit: 1, description: 'Military health relevance' },
      { type: 'specific_aims_dod', title: 'Specific Aims', pageLimit: 1, description: 'Research objectives' },
      { type: 'research_strategy_dod', title: 'Research Strategy', pageLimit: 12, requiredHeadings: ['Background', 'Preliminary Data', 'Hypothesis', 'Research Design', 'Translational Potential'], description: 'Comprehensive research and translation plan' },
      { type: 'transition_plan', title: 'Transition Plan', pageLimit: 2, description: 'Plan for advancing findings toward clinical application' },
      { type: 'sow', title: 'Statement of Work', pageLimit: 3, format: 'milestone', description: 'Milestone-driven deliverables' },
    ],
    attachments: dodBaseAttachments,
  },
  'DOD_CTA': {
    id: 'DOD_CTA',
    name: 'Clinical Trial Award',
    agency: 'DOD_CDMRP',
    description: 'Supports clinical trials for cancer interventions. Up to $4M for 4 years.',
    sections: [
      { type: 'impact_statement', title: 'Impact Statement', pageLimit: 1, description: 'Clinical trial impact' },
      { type: 'military_relevance', title: 'Military/Veteran Relevance', pageLimit: 1, description: 'Military relevance of trial' },
      { type: 'specific_aims_dod', title: 'Specific Aims', pageLimit: 1, description: 'Trial objectives' },
      { type: 'research_strategy_dod', title: 'Research Strategy', pageLimit: 15, requiredHeadings: ['Background', 'Preliminary Data', 'Study Design', 'Endpoints', 'Statistical Plan', 'Safety Monitoring'], description: 'Complete clinical trial protocol' },
      { type: 'sow', title: 'Statement of Work', pageLimit: 4, format: 'milestone', description: 'Trial milestones and deliverables' },
    ],
    attachments: [...dodBaseAttachments, { name: 'Clinical Protocol', required: true, description: 'Full clinical trial protocol' }],
  },
  'DOD_SBIR_I': {
    id: 'DOD_SBIR_I',
    name: 'DoD SBIR Phase I',
    agency: 'DOD_CDMRP',
    description: 'Small business feasibility study. Up to $250K for 6-12 months.',
    sections: [
      { type: 'technical_objectives', title: 'Technical Objectives', pageLimit: 1, description: 'Clear technical goals' },
      { type: 'impact_statement', title: 'Impact Statement', pageLimit: 1, description: 'Military and commercial impact' },
      { type: 'military_relevance', title: 'Military/Veteran Relevance', pageLimit: 1, description: 'Defense application relevance' },
      { type: 'technical_proposal', title: 'Technical Proposal', pageLimit: 10, requiredHeadings: ['Technical Approach', 'Innovation', 'Feasibility'], description: 'Technical approach and innovation' },
      { type: 'sow', title: 'Statement of Work', pageLimit: 3, format: 'milestone', description: 'Phase I milestones' },
      { type: 'commercialization_dod', title: 'Commercialization Strategy', pageLimit: 3, description: 'Path to dual-use commercialization' },
    ],
    attachments: dodSbirAttachments,
  },
  'DOD_SBIR_II': {
    id: 'DOD_SBIR_II',
    name: 'DoD SBIR Phase II',
    agency: 'DOD_CDMRP',
    description: 'Full R&D of Phase I concept. Up to $1.7M for 2 years.',
    sections: [
      { type: 'technical_objectives', title: 'Technical Objectives', pageLimit: 1, description: 'Phase II technical goals' },
      { type: 'impact_statement', title: 'Impact Statement', pageLimit: 1, description: 'Military and commercial impact' },
      { type: 'military_relevance', title: 'Military/Veteran Relevance', pageLimit: 1, description: 'Defense application relevance' },
      { type: 'phase_i_results', title: 'Phase I Results', pageLimit: 5, description: 'Summary of Phase I accomplishments' },
      { type: 'technical_proposal', title: 'Technical Proposal', pageLimit: 15, requiredHeadings: ['Technical Approach', 'Innovation', 'Risk Mitigation'], description: 'Full technical approach' },
      { type: 'sow', title: 'Statement of Work', pageLimit: 4, format: 'milestone', description: 'Phase II milestones' },
      { type: 'commercialization_dod', title: 'Commercialization Strategy', pageLimit: 5, description: 'Detailed commercialization plan' },
      { type: 'transition_plan', title: 'Transition Plan', pageLimit: 2, description: 'Plan for Phase III or commercialization' },
    ],
    attachments: dodSbirAttachments,
  },
  'DOD_STTR_I': {
    id: 'DOD_STTR_I',
    name: 'DoD STTR Phase I',
    agency: 'DOD_CDMRP',
    description: 'Small business/research institution partnership. Up to $250K for 12 months.',
    sections: [
      { type: 'technical_objectives', title: 'Technical Objectives', pageLimit: 1, description: 'Technical goals' },
      { type: 'impact_statement', title: 'Impact Statement', pageLimit: 1, description: 'Impact statement' },
      { type: 'military_relevance', title: 'Military/Veteran Relevance', pageLimit: 1, description: 'Defense relevance' },
      { type: 'technical_proposal', title: 'Technical Proposal', pageLimit: 10, requiredHeadings: ['Technical Approach', 'Innovation', 'Feasibility'], description: 'Technical approach' },
      { type: 'sow', title: 'Statement of Work', pageLimit: 3, format: 'milestone', description: 'Milestones' },
      { type: 'commercialization_dod', title: 'Commercialization Strategy', pageLimit: 3, description: 'Commercialization path' },
    ],
    attachments: [...dodSbirAttachments, { name: 'Research Institution Agreement', required: true, description: 'STTR collaboration agreement' }],
  },
  'DOD_STTR_II': {
    id: 'DOD_STTR_II',
    name: 'DoD STTR Phase II',
    agency: 'DOD_CDMRP',
    description: 'Full STTR R&D. Up to $1.7M for 2 years.',
    sections: [
      { type: 'technical_objectives', title: 'Technical Objectives', pageLimit: 1, description: 'Phase II goals' },
      { type: 'impact_statement', title: 'Impact Statement', pageLimit: 1, description: 'Impact' },
      { type: 'military_relevance', title: 'Military/Veteran Relevance', pageLimit: 1, description: 'Relevance' },
      { type: 'phase_i_results', title: 'Phase I Results', pageLimit: 5, description: 'Phase I summary' },
      { type: 'technical_proposal', title: 'Technical Proposal', pageLimit: 15, requiredHeadings: ['Technical Approach', 'Innovation', 'Risk Mitigation'], description: 'Technical plan' },
      { type: 'sow', title: 'Statement of Work', pageLimit: 4, format: 'milestone', description: 'Milestones' },
      { type: 'commercialization_dod', title: 'Commercialization Strategy', pageLimit: 5, description: 'Commercialization' },
      { type: 'transition_plan', title: 'Transition Plan', pageLimit: 2, description: 'Transition plan' },
    ],
    attachments: [...dodSbirAttachments, { name: 'Research Institution Agreement', required: true, description: 'STTR collaboration agreement' }],
  },

  // ============ CPRIT MECHANISMS ============
  'CPRIT_IIRA': {
    id: 'CPRIT_IIRA',
    name: 'CPRIT Individual Investigator Research Award',
    agency: 'CPRIT',
    description: 'Supports innovative cancer research by Texas-based investigators. Up to $900K for 3 years.',
    sections: [
      { type: 'layperson_summary', title: "Layperson's Summary", pageLimit: 1, description: 'Non-technical summary for public understanding' },
      { type: 'goals_objectives', title: 'Goals and Objectives', pageLimit: 1, description: 'Clear statement of project goals' },
      { type: 'research_plan', title: 'Research Plan', pageLimit: 10, requiredHeadings: ['Background', 'Preliminary Data', 'Specific Aims', 'Research Design', 'Timeline'], description: 'Comprehensive research plan' },
      { type: 'timeline', title: 'Timeline', pageLimit: 1, description: 'Project milestones and timeline' },
      { type: 'budget_justification', title: 'Budget Justification', pageLimit: 3, description: 'Detailed budget narrative' },
    ],
    attachments: [
      { name: 'Biographical Sketch', required: true, description: 'NIH-style biosketch for PI and key personnel' },
      { name: 'Current and Pending Support', required: true, description: 'Other funding sources' },
      { name: 'Institutional Letter', required: true, description: 'Texas institution commitment letter' },
      { name: 'Letters of Collaboration', required: false, description: 'From collaborators if applicable' },
    ],
  },
  'CPRIT_ETRA': {
    id: 'CPRIT_ETRA',
    name: 'CPRIT Early Translational Research Award',
    agency: 'CPRIT',
    description: 'Bridges discovery to early clinical development. Up to $2M for 3 years.',
    sections: [
      { type: 'layperson_summary', title: "Layperson's Summary", pageLimit: 1, description: 'Non-technical summary' },
      { type: 'goals_objectives', title: 'Goals and Objectives', pageLimit: 1, description: 'Translational goals' },
      { type: 'research_plan', title: 'Research Plan', pageLimit: 12, requiredHeadings: ['Background', 'Preliminary Data', 'Translational Strategy', 'Research Design', 'Milestones'], description: 'Translational research plan' },
      { type: 'timeline', title: 'Timeline', pageLimit: 1, description: 'Development milestones' },
      { type: 'commercialization_cprit', title: 'Commercialization Plan', pageLimit: 3, description: 'Path to clinical development or licensing' },
      { type: 'budget_justification', title: 'Budget Justification', pageLimit: 3, description: 'Budget narrative' },
    ],
    attachments: [
      { name: 'Biographical Sketch', required: true, description: 'Biosketch for PI and team' },
      { name: 'Current and Pending Support', required: true, description: 'Other funding' },
      { name: 'Institutional Letter', required: true, description: 'Texas institution letter' },
      { name: 'IP Assessment', required: true, description: 'Intellectual property status' },
    ],
  },
  'CPRIT_PDRA': {
    id: 'CPRIT_PDRA',
    name: 'CPRIT Product Development Research Award',
    agency: 'CPRIT',
    description: 'Supports late-stage product development toward commercialization. Up to $20M over multiple years.',
    sections: [
      { type: 'layperson_summary', title: "Layperson's Summary", pageLimit: 1, description: 'Non-technical summary' },
      { type: 'goals_objectives', title: 'Goals and Objectives', pageLimit: 2, description: 'Product development objectives' },
      { type: 'research_plan', title: 'Development Plan', pageLimit: 15, requiredHeadings: ['Product Description', 'Development Strategy', 'Regulatory Path', 'Clinical Plan', 'Manufacturing'], description: 'Comprehensive product development plan' },
      { type: 'timeline', title: 'Timeline and Milestones', pageLimit: 2, description: 'Go/no-go milestones' },
      { type: 'commercialization_cprit', title: 'Commercialization Strategy', pageLimit: 5, description: 'Market analysis and commercialization path' },
      { type: 'texas_impact', title: 'Texas Impact Statement', pageLimit: 2, description: 'Economic impact and job creation in Texas' },
      { type: 'budget_justification', title: 'Budget Justification', pageLimit: 5, description: 'Detailed budget with matching funds' },
    ],
    attachments: [
      { name: 'Company Information', required: true, description: 'Company overview and financials' },
      { name: 'Biographical Sketch', required: true, description: 'Team biosketches' },
      { name: 'IP Portfolio', required: true, description: 'Patents and IP status' },
      { name: 'Regulatory Strategy', required: true, description: 'FDA pathway documentation' },
      { name: 'Texas Operations Plan', required: true, description: 'Plan for Texas-based operations' },
    ],
  },
};

// Agency-specific formatting requirements
export const NIH_FORMATTING = {
  margins: '0.5 inches',
  font: 'Arial',
  fontSize: 11,
  lineSpacing: 'single',
  headerFooter: 'No headers/footers in page count',
};

export const DOD_FORMATTING = {
  margins: '1 inch',
  font: 'Times New Roman, Courier New, or Arial',
  fontSize: 12,
  lineSpacing: 'single',
  headerFooter: 'Headers/footers allowed but not counted',
  sowFormat: 'Milestone-driven format with specific tasks, not narrative',
};

// Helper functions
// CPRIT formatting
export const CPRIT_FORMATTING = {
  margins: '0.5 inches',
  font: 'Arial, Helvetica, or Georgia',
  fontSize: 11,
  lineSpacing: 'single',
  headerFooter: 'Include page numbers',
  texasRequirement: 'PI must be at a Texas institution',
};

// Funding agencies
export const FUNDING_AGENCIES = {
  NIH: { id: 'NIH', name: 'National Institutes of Health (NIH)', description: 'Federal biomedical research agency' },
  DOD_CDMRP: { id: 'DOD_CDMRP', name: 'DoD CDMRP', description: 'Department of Defense medical research programs' },
  CPRIT: { id: 'CPRIT', name: 'CPRIT', description: 'Cancer Prevention and Research Institute of Texas' },
};

export type AgencyType = 'NIH' | 'DOD_CDMRP' | 'CPRIT';

export function getAgencyMechanisms(agency: AgencyType): MechanismConfig[] {
  return Object.values(MECHANISMS).filter(m => m.agency === agency);
}

export function getFormatting(agency: AgencyType) {
  if (agency === 'NIH') return NIH_FORMATTING;
  if (agency === 'CPRIT') return CPRIT_FORMATTING;
  return DOD_FORMATTING;
}
