'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, Lightbulb,
  Target, FlaskConical, Users, FileText, DollarSign, Database,
  BarChart3, Image, Check, X, ChevronDown, ChevronUp
} from 'lucide-react';

type Module = 'title' | 'hypothesis' | 'aims' | 'collaborators' | 'approach' | 'budget' | 'data' | 'figure';

interface ValidationResult {
  passed: boolean;
  message: string;
}

interface GrantData {
  // Module 1: Title & Concept
  workingTitle: string;
  diseaseArea: string;
  biologicalTarget: string;
  fundingMechanism: string;
  whatIsKnown: string;
  whatIsUnknown: string;
  criticalGaps: string;
  clinicalImportance: string;
  refinedTitle: string;
  gapStatement: string;
  impactParagraph: string;
  
  // Module 2: Hypothesis
  centralHypothesis: string;
  mechanisticFraming: string;
  clinicalImplication: string;
  hypothesisValidation: {
    resolvesGap: boolean;
    isTestable: boolean;
    isFalsifiable: boolean;
  };
  
  // Module 3: Specific Aims
  aims: Array<{
    id: string;
    scientificQuestion: string;
    expectedOutcome: string;
    experimentalModel: string;
    linksToHypothesis: string;
  }>;
  aimsCoherenceCheck: {
    closesGap: boolean;
    logicalOrder: boolean;
    noDisconnects: boolean;
  };
}

const FUNDING_MECHANISMS = [
  'NIH R01',
  'NIH R21',
  'NIH R03',
  'SBIR Phase I',
  'SBIR Phase II',
  'STTR Phase I',
  'STTR Phase II',
  'DoD CDMRP',
  'CPRIT',
  'Foundation Grant',
  'Other'
];

export default function GrantBuilderPage() {
  const [currentModule, setCurrentModule] = useState<Module>('title');
  const [mode, setMode] = useState<'create' | 'validate'>('create');
  const [grantData, setGrantData] = useState<GrantData>({
    workingTitle: '',
    diseaseArea: '',
    biologicalTarget: '',
    fundingMechanism: 'SBIR Phase I',
    whatIsKnown: '',
    whatIsUnknown: '',
    criticalGaps: '',
    clinicalImportance: '',
    refinedTitle: '',
    gapStatement: '',
    impactParagraph: '',
    centralHypothesis: '',
    mechanisticFraming: '',
    clinicalImplication: '',
    hypothesisValidation: {
      resolvesGap: false,
      isTestable: false,
      isFalsifiable: false
    },
    aims: [{ id: '1', scientificQuestion: '', expectedOutcome: '', experimentalModel: '', linksToHypothesis: '' }],
    aimsCoherenceCheck: {
      closesGap: false,
      logicalOrder: false,
      noDisconnects: false
    }
  });
  const [generating, setGenerating] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const modules: { id: Module; name: string; icon: React.ReactNode; description: string }[] = [
    { id: 'title', name: 'Title & Concept', icon: <Lightbulb className="w-5 h-5" />, description: 'Define your research concept and knowledge gaps' },
    { id: 'hypothesis', name: 'Hypothesis', icon: <FlaskConical className="w-5 h-5" />, description: 'Generate and validate your central hypothesis' },
    { id: 'aims', name: 'Specific Aims', icon: <Target className="w-5 h-5" />, description: 'Build structured, testable specific aims' },
    { id: 'collaborators', name: 'Team Mapping', icon: <Users className="w-5 h-5" />, description: 'Map expertise requirements to collaborators' },
    { id: 'approach', name: 'Approach', icon: <FileText className="w-5 h-5" />, description: 'Design experimental approach for each aim' },
    { id: 'budget', name: 'Budget', icon: <DollarSign className="w-5 h-5" />, description: 'Translate approach into budget items' },
    { id: 'data', name: 'Preliminary Data', icon: <Database className="w-5 h-5" />, description: 'Integrate supporting preliminary data' },
    { id: 'figure', name: 'Summary Figure', icon: <Image className="w-5 h-5" />, description: 'Generate conceptual summary schematic' },
  ];

  const currentModuleIndex = modules.findIndex(m => m.id === currentModule);

  const updateField = (field: keyof GrantData, value: any) => {
    setGrantData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const generateGapStatement = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/grant-builder/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'gap_statement',
          data: {
            whatIsKnown: grantData.whatIsKnown,
            whatIsUnknown: grantData.whatIsUnknown,
            criticalGaps: grantData.criticalGaps,
            clinicalImportance: grantData.clinicalImportance,
            diseaseArea: grantData.diseaseArea,
            target: grantData.biologicalTarget
          }
        })
      });
      if (res.ok) {
        const result = await res.json();
        updateField('gapStatement', result.gapStatement);
        updateField('impactParagraph', result.impactParagraph);
        if (result.refinedTitle) updateField('refinedTitle', result.refinedTitle);
      }
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setGenerating(false);
    }
  };

  const generateHypothesis = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/grant-builder/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'hypothesis',
          data: {
            gapStatement: grantData.gapStatement,
            diseaseArea: grantData.diseaseArea,
            target: grantData.biologicalTarget,
            title: grantData.refinedTitle || grantData.workingTitle
          }
        })
      });
      if (res.ok) {
        const result = await res.json();
        updateField('centralHypothesis', result.hypothesis);
        updateField('mechanisticFraming', result.mechanisticFraming);
        updateField('clinicalImplication', result.clinicalImplication);
      }
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setGenerating(false);
    }
  };

  const validateHypothesis = () => {
    const h = grantData.centralHypothesis.toLowerCase();
    const gap = grantData.gapStatement.toLowerCase();
    
    // Simple validation logic - in production this would be AI-powered
    const resolvesGap = gap && h && (
      gap.split(' ').some(word => word.length > 4 && h.includes(word))
    );
    
    const testableKeywords = ['will', 'can', 'result in', 'lead to', 'cause', 'increase', 'decrease', 'improve'];
    const isTestable = testableKeywords.some(kw => h.includes(kw));
    
    const falsifiableKeywords = ['if', 'then', 'would', 'should', 'expect'];
    const isFalsifiable = falsifiableKeywords.some(kw => h.includes(kw)) || isTestable;

    updateField('hypothesisValidation', { resolvesGap, isTestable, isFalsifiable });
  };

  const addAim = () => {
    const newId = (grantData.aims.length + 1).toString();
    updateField('aims', [...grantData.aims, { 
      id: newId, 
      scientificQuestion: '', 
      expectedOutcome: '', 
      experimentalModel: '', 
      linksToHypothesis: '' 
    }]);
  };

  const updateAim = (id: string, field: string, value: string) => {
    updateField('aims', grantData.aims.map(aim => 
      aim.id === id ? { ...aim, [field]: value } : aim
    ));
  };

  const removeAim = (id: string) => {
    if (grantData.aims.length > 1) {
      updateField('aims', grantData.aims.filter(aim => aim.id !== id));
    }
  };

  const ValidationBadge = ({ passed, label }: { passed: boolean; label: string }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
      passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}>
      {passed ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      {label}
    </span>
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/submission" className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Submission
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Grant Builder</h1>
              <p className="text-slate-600 mt-1">Structured grant development with validation at every step</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setMode('create')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'create' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Create Mode
              </button>
              <button 
                onClick={() => setMode('validate')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'validate' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Validate Mode
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Module Navigation */}
          <div className="col-span-3">
            <div className="bg-white rounded-xl border border-slate-200 p-4 sticky top-24">
              <h3 className="font-medium text-slate-900 mb-3">Modules</h3>
              <nav className="space-y-1">
                {modules.map((module, idx) => (
                  <button
                    key={module.id}
                    onClick={() => setCurrentModule(module.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      currentModule === module.id 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`flex-shrink-0 ${currentModule === module.id ? 'text-indigo-600' : 'text-slate-400'}`}>
                      {module.icon}
                    </span>
                    <span className="text-sm font-medium">{module.name}</span>
                    {idx < currentModuleIndex && (
                      <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-9 space-y-6">
            {/* Module 1: Title & Concept */}
            {currentModule === 'title' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-1">Module 1: Title & Concept Clarity</h2>
                  <p className="text-sm text-slate-600 mb-6">Define what is known, unknown, and why closing this gap matters.</p>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Working Title</label>
                        <input
                          type="text"
                          value={grantData.workingTitle}
                          onChange={(e) => updateField('workingTitle', e.target.value)}
                          placeholder="e.g., Novel Therapeutic Targeting X for Disease Y"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Funding Mechanism</label>
                        <select
                          value={grantData.fundingMechanism}
                          onChange={(e) => updateField('fundingMechanism', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {FUNDING_MECHANISMS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Disease Area</label>
                        <input
                          type="text"
                          value={grantData.diseaseArea}
                          onChange={(e) => updateField('diseaseArea', e.target.value)}
                          placeholder="e.g., Breast Cancer, Alzheimer's Disease"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Biological Target</label>
                        <input
                          type="text"
                          value={grantData.biologicalTarget}
                          onChange={(e) => updateField('biologicalTarget', e.target.value)}
                          placeholder="e.g., HER2, Amyloid-beta, PD-1"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">What is Known?</label>
                      <textarea
                        value={grantData.whatIsKnown}
                        onChange={(e) => updateField('whatIsKnown', e.target.value)}
                        placeholder="Summarize the current state of knowledge in this field..."
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">What is Unknown?</label>
                      <textarea
                        value={grantData.whatIsUnknown}
                        onChange={(e) => updateField('whatIsUnknown', e.target.value)}
                        placeholder="What key questions remain unanswered?"
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Critical Gaps in Knowledge</label>
                      <textarea
                        value={grantData.criticalGaps}
                        onChange={(e) => updateField('criticalGaps', e.target.value)}
                        placeholder="What specific gaps does your research address?"
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Why Does This Gap Matter? (Clinical/Commercial Importance)</label>
                      <textarea
                        value={grantData.clinicalImportance}
                        onChange={(e) => updateField('clinicalImportance', e.target.value)}
                        placeholder="Explain the clinical significance or commercial potential..."
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={generateGapStatement}
                      disabled={generating || !grantData.whatIsKnown || !grantData.criticalGaps}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {generating ? (
                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Generating...</>
                      ) : (
                        <><Lightbulb className="w-4 h-4" /> Generate Gap Statement & Impact</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Output Section */}
                {(grantData.gapStatement || grantData.impactParagraph) && (
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-medium text-slate-900 mb-4">Generated Output</h3>
                    
                    {grantData.refinedTitle && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Refined Title</label>
                        <input
                          type="text"
                          value={grantData.refinedTitle}
                          onChange={(e) => updateField('refinedTitle', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-indigo-50"
                        />
                      </div>
                    )}

                    {grantData.gapStatement && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Gap Statement</label>
                        <textarea
                          value={grantData.gapStatement}
                          onChange={(e) => updateField('gapStatement', e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-green-50"
                        />
                      </div>
                    )}

                    {grantData.impactParagraph && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Impact Positioning Paragraph</label>
                        <textarea
                          value={grantData.impactParagraph}
                          onChange={(e) => updateField('impactParagraph', e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-blue-50"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Module 2: Hypothesis */}
            {currentModule === 'hypothesis' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-1">Module 2: Hypothesis Generation</h2>
                  <p className="text-sm text-slate-600 mb-6">Generate a central hypothesis that directly resolves the defined gap.</p>

                  {!grantData.gapStatement && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800">Complete Module 1 First</p>
                        <p className="text-sm text-amber-700">You need a gap statement before generating a hypothesis.</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Central Hypothesis</label>
                      <textarea
                        value={grantData.centralHypothesis}
                        onChange={(e) => updateField('centralHypothesis', e.target.value)}
                        placeholder="We hypothesize that..."
                        rows={4}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Mechanistic Framing</label>
                      <textarea
                        value={grantData.mechanisticFraming}
                        onChange={(e) => updateField('mechanisticFraming', e.target.value)}
                        placeholder="The proposed mechanism involves..."
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Clinical/Translational Implication</label>
                      <textarea
                        value={grantData.clinicalImplication}
                        onChange={(e) => updateField('clinicalImplication', e.target.value)}
                        placeholder="If validated, this will lead to..."
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={generateHypothesis}
                      disabled={generating || !grantData.gapStatement}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {generating ? (
                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Generating...</>
                      ) : (
                        <><FlaskConical className="w-4 h-4" /> Generate Hypothesis</>
                      )}
                    </button>
                    <button
                      onClick={validateHypothesis}
                      disabled={!grantData.centralHypothesis}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Validate Hypothesis
                    </button>
                  </div>
                </div>

                {/* Validation Results */}
                {grantData.centralHypothesis && (
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-medium text-slate-900 mb-4">Hypothesis Validation</h3>
                    <div className="flex flex-wrap gap-2">
                      <ValidationBadge passed={grantData.hypothesisValidation.resolvesGap} label="Resolves Gap" />
                      <ValidationBadge passed={grantData.hypothesisValidation.isTestable} label="Testable" />
                      <ValidationBadge passed={grantData.hypothesisValidation.isFalsifiable} label="Falsifiable" />
                    </div>
                    {!grantData.hypothesisValidation.resolvesGap && grantData.hypothesisValidation.isTestable && (
                      <p className="mt-3 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
                        <strong>Tip:</strong> Ensure your hypothesis directly addresses the knowledge gap you defined. The hypothesis should propose a solution or explanation for the unknown.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Module 3: Specific Aims */}
            {currentModule === 'aims' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-1">Module 3: Specific Aims Builder</h2>
                  <p className="text-sm text-slate-600 mb-6">Build structured aims that collectively close the defined gap.</p>

                  <div className="space-y-4">
                    {grantData.aims.map((aim, idx) => (
                      <div key={aim.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-slate-900">Specific Aim {idx + 1}</h4>
                          {grantData.aims.length > 1 && (
                            <button onClick={() => removeAim(aim.id)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Scientific Question</label>
                            <input
                              type="text"
                              value={aim.scientificQuestion}
                              onChange={(e) => updateAim(aim.id, 'scientificQuestion', e.target.value)}
                              placeholder="What specific question does this aim address?"
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Expected Outcome</label>
                            <input
                              type="text"
                              value={aim.expectedOutcome}
                              onChange={(e) => updateAim(aim.id, 'expectedOutcome', e.target.value)}
                              placeholder="What measurable outcome do you expect?"
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Experimental Model</label>
                            <input
                              type="text"
                              value={aim.experimentalModel}
                              onChange={(e) => updateAim(aim.id, 'experimentalModel', e.target.value)}
                              placeholder="e.g., In vitro cell lines, mouse xenograft, clinical samples"
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Link to Hypothesis</label>
                            <input
                              type="text"
                              value={aim.linksToHypothesis}
                              onChange={(e) => updateAim(aim.id, 'linksToHypothesis', e.target.value)}
                              placeholder="How does this aim test the central hypothesis?"
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button onClick={addAim} className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                      + Add Another Aim
                    </button>
                  </div>
                </div>

                {/* Aims Coherence Check */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="font-medium text-slate-900 mb-4">Aims Coherence Check</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={grantData.aimsCoherenceCheck.closesGap}
                        onChange={(e) => updateField('aimsCoherenceCheck', { ...grantData.aimsCoherenceCheck, closesGap: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-sm text-slate-700">All aims collectively close the defined gap</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={grantData.aimsCoherenceCheck.logicalOrder}
                        onChange={(e) => updateField('aimsCoherenceCheck', { ...grantData.aimsCoherenceCheck, logicalOrder: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-sm text-slate-700">Aims are logically ordered (foundational first)</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={grantData.aimsCoherenceCheck.noDisconnects}
                        onChange={(e) => updateField('aimsCoherenceCheck', { ...grantData.aimsCoherenceCheck, noDisconnects: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-sm text-slate-700">No aim feels disconnected from the hypothesis</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Placeholder for other modules */}
            {['collaborators', 'approach', 'budget', 'data', 'figure'].includes(currentModule) && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {modules.find(m => m.id === currentModule)?.icon}
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    {modules.find(m => m.id === currentModule)?.name}
                  </h3>
                  <p className="text-slate-600 mb-4">
                    {modules.find(m => m.id === currentModule)?.description}
                  </p>
                  <p className="text-sm text-slate-500">This module is coming in Phase 2</p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={() => setCurrentModule(modules[currentModuleIndex - 1]?.id || 'title')}
                disabled={currentModuleIndex === 0}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 disabled:opacity-50 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Previous Module
              </button>
              <button
                onClick={() => setCurrentModule(modules[currentModuleIndex + 1]?.id || 'figure')}
                disabled={currentModuleIndex === modules.length - 1}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                Next Module <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
