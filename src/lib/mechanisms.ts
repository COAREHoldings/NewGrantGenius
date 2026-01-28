export interface MechanismConfig {
  id: string;
  name: string;
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
}

export interface AttachmentConfig {
  name: string;
  required: boolean;
  description: string;
}

const baseAttachments: AttachmentConfig[] = [
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

const sbirAttachments: AttachmentConfig[] = [
  ...baseAttachments,
  { name: 'SBIR/STTR Information', required: true, description: 'Company info and certifications' },
];

const sttrAttachments: AttachmentConfig[] = [
  ...baseAttachments,
  { name: 'SBIR/STTR Information', required: true, description: 'Company info and certifications' },
  { name: 'Research Institution Letter', required: true, description: 'Commitment letter from research institution' },
];

export const MECHANISMS: Record<string, MechanismConfig> = {
  'R43': {
    id: 'R43',
    name: 'SBIR Phase I (R43)',
    description: 'Small Business Innovation Research Phase I - Feasibility study up to $293,697 total costs',
    sections: [
      { type: 'specific_aims', title: 'Specific Aims', pageLimit: 1, description: 'State objectives and specific aims' },
      { 
        type: 'research_strategy', 
        title: 'Research Strategy', 
        pageLimit: 6, 
        requiredHeadings: ['Significance', 'Innovation', 'Approach'],
        description: 'Significance, Innovation, and Approach sections'
      },
      { type: 'commercialization_plan', title: 'Commercialization Plan', pageLimit: 12, description: 'Market analysis and commercialization strategy' },
    ],
    attachments: sbirAttachments,
  },
  'R44': {
    id: 'R44',
    name: 'SBIR Phase II (R44)',
    description: 'Small Business Innovation Research Phase II - Full R&D up to $1,956,460 total costs',
    sections: [
      { type: 'specific_aims', title: 'Specific Aims', pageLimit: 1, description: 'State objectives and specific aims' },
      { 
        type: 'research_strategy', 
        title: 'Research Strategy', 
        pageLimit: 12, 
        requiredHeadings: ['Significance', 'Innovation', 'Approach'],
        description: 'Significance, Innovation, and Approach sections'
      },
      { type: 'commercialization_plan', title: 'Commercialization Plan', pageLimit: 12, description: 'Market analysis and commercialization strategy' },
      { type: 'progress_report', title: 'Progress Report', pageLimit: 6, description: 'Phase I accomplishments and milestones' },
    ],
    attachments: sbirAttachments,
  },
  'SBIR_FAST_TRACK': {
    id: 'SBIR_FAST_TRACK',
    name: 'SBIR Fast-Track',
    description: 'Combined Phase I and II application',
    sections: [
      { type: 'specific_aims', title: 'Specific Aims', pageLimit: 1, description: 'State objectives and specific aims' },
      { 
        type: 'research_strategy', 
        title: 'Research Strategy', 
        pageLimit: 12, 
        requiredHeadings: ['Significance', 'Innovation', 'Approach'],
        description: 'Significance, Innovation, and Approach sections'
      },
      { type: 'commercialization_plan', title: 'Commercialization Plan', pageLimit: 12, description: 'Market analysis and commercialization strategy' },
    ],
    attachments: sbirAttachments,
  },
  'R44_PHASE_IIB': {
    id: 'R44_PHASE_IIB',
    name: 'SBIR Phase IIB',
    description: 'Competing continuation for additional Phase II funding',
    sections: [
      { type: 'specific_aims', title: 'Specific Aims', pageLimit: 1, description: 'State objectives and specific aims' },
      { 
        type: 'research_strategy', 
        title: 'Research Strategy', 
        pageLimit: 12, 
        requiredHeadings: ['Significance', 'Innovation', 'Approach'],
        description: 'Significance, Innovation, and Approach sections'
      },
      { type: 'commercialization_plan', title: 'Commercialization Plan', pageLimit: 12, description: 'Market analysis and commercialization strategy' },
      { type: 'progress_report', title: 'Progress Report', pageLimit: 6, description: 'Previous Phase II accomplishments' },
    ],
    attachments: sbirAttachments,
  },
  'R41': {
    id: 'R41',
    name: 'STTR Phase I (R41)',
    description: 'Small Business Technology Transfer Phase I - Requires research institution partnership',
    sections: [
      { type: 'specific_aims', title: 'Specific Aims', pageLimit: 1, description: 'State objectives and specific aims' },
      { 
        type: 'research_strategy', 
        title: 'Research Strategy', 
        pageLimit: 6, 
        requiredHeadings: ['Significance', 'Innovation', 'Approach'],
        description: 'Significance, Innovation, and Approach sections'
      },
      { type: 'commercialization_plan', title: 'Commercialization Plan', pageLimit: 12, description: 'Market analysis and commercialization strategy' },
    ],
    attachments: sttrAttachments,
  },
  'R42': {
    id: 'R42',
    name: 'STTR Phase II (R42)',
    description: 'Small Business Technology Transfer Phase II - Full R&D with research institution',
    sections: [
      { type: 'specific_aims', title: 'Specific Aims', pageLimit: 1, description: 'State objectives and specific aims' },
      { 
        type: 'research_strategy', 
        title: 'Research Strategy', 
        pageLimit: 12, 
        requiredHeadings: ['Significance', 'Innovation', 'Approach'],
        description: 'Significance, Innovation, and Approach sections'
      },
      { type: 'commercialization_plan', title: 'Commercialization Plan', pageLimit: 12, description: 'Market analysis and commercialization strategy' },
      { type: 'progress_report', title: 'Progress Report', pageLimit: 6, description: 'Phase I accomplishments and milestones' },
    ],
    attachments: sttrAttachments,
  },
  'STTR_FAST_TRACK': {
    id: 'STTR_FAST_TRACK',
    name: 'STTR Fast-Track',
    description: 'Combined STTR Phase I and II application',
    sections: [
      { type: 'specific_aims', title: 'Specific Aims', pageLimit: 1, description: 'State objectives and specific aims' },
      { 
        type: 'research_strategy', 
        title: 'Research Strategy', 
        pageLimit: 12, 
        requiredHeadings: ['Significance', 'Innovation', 'Approach'],
        description: 'Significance, Innovation, and Approach sections'
      },
      { type: 'commercialization_plan', title: 'Commercialization Plan', pageLimit: 12, description: 'Market analysis and commercialization strategy' },
    ],
    attachments: sttrAttachments,
  },
};

export const NIH_FORMATTING = {
  margins: '0.5 inches',
  font: 'Arial',
  fontSize: 11,
  lineSpacing: 'single',
  headerFooter: 'No headers/footers in page count',
};
