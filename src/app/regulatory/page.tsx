'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Users, Stethoscope, FileText, AlertTriangle, 
  CheckCircle2, HelpCircle, ChevronDown, ChevronUp
} from 'lucide-react';

interface HumanSubjectsData {
  involvesHumanSubjects: boolean | null;
  isClinicalTrial: boolean | null;
  exemptionCategory: string;
  riskLevel: 'minimal' | 'greater_than_minimal' | null;
  vulnerablePopulations: string[];
  inclusionPlan: {
    targetEnrollment: number;
    sex: { males: number; females: number };
    race: Record<string, number>;
    ethnicity: { hispanic: number; nonHispanic: number };
  };
  protectionPlan: string;
  dataPrivacyPlan: string;
  informedConsentProcess: string;
  irbStatus: 'approved' | 'pending' | 'exempt' | 'not_submitted';
  irbProtocolNumber?: string;
}

interface VertebrateAnimalsData {
  involvesAnimals: boolean | null;
  species: string[];
  totalNumber: number;
  justification: string;
  veterinaryCare: string;
  proceduresDescription: string;
  painCategories: {
    categoryC: number; // No pain
    categoryD: number; // Pain with relief
    categoryE: number; // Pain without relief
  };
  euthanasiaMethod: string;
  alternativesConsidered: string;
  iacucStatus: 'approved' | 'pending' | 'not_submitted';
  iacucProtocolNumber?: string;
}

export default function RegulatoryPage() {
  const [activeTab, setActiveTab] = useState<'human' | 'animal'>('human');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  
  const [humanData, setHumanData] = useState<HumanSubjectsData>({
    involvesHumanSubjects: null,
    isClinicalTrial: null,
    exemptionCategory: '',
    riskLevel: null,
    vulnerablePopulations: [],
    inclusionPlan: {
      targetEnrollment: 0,
      sex: { males: 0, females: 0 },
      race: {},
      ethnicity: { hispanic: 0, nonHispanic: 0 }
    },
    protectionPlan: '',
    dataPrivacyPlan: '',
    informedConsentProcess: '',
    irbStatus: 'not_submitted'
  });
  
  const [animalData, setAnimalData] = useState<VertebrateAnimalsData>({
    involvesAnimals: null,
    species: [],
    totalNumber: 0,
    justification: '',
    veterinaryCare: '',
    proceduresDescription: '',
    painCategories: { categoryC: 0, categoryD: 0, categoryE: 0 },
    euthanasiaMethod: '',
    alternativesConsidered: '',
    iacucStatus: 'not_submitted'
  });

  const toggleSection = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const exemptionCategories = [
    { id: '1', name: 'Category 1', desc: 'Research in educational settings' },
    { id: '2', name: 'Category 2', desc: 'Educational tests, surveys, interviews, observation' },
    { id: '3', name: 'Category 3', desc: 'Benign behavioral interventions' },
    { id: '4', name: 'Category 4', desc: 'Secondary research with identifiable private information' },
    { id: '5', name: 'Category 5', desc: 'Federal demonstration projects' },
    { id: '6', name: 'Category 6', desc: 'Taste and food quality evaluation' },
    { id: '7', name: 'Category 7', desc: 'Storage or maintenance of identifiable data/specimens' },
    { id: '8', name: 'Category 8', desc: 'Secondary research with broad consent' }
  ];

  const vulnerablePopOptions = [
    'Children/Minors',
    'Pregnant Women',
    'Prisoners',
    'Cognitively Impaired',
    'Economically Disadvantaged',
    'Educationally Disadvantaged',
    'Terminally Ill',
    'Students/Employees (potential coercion)'
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Link href="/grant-builder" className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Grant Builder
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Regulatory Sections</h1>
          <p className="text-slate-600">Complete required regulatory documentation for your grant application</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('human')}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
              activeTab === 'human' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300'
            }`}
          >
            <Users className="w-5 h-5" /> Human Subjects
          </button>
          <button
            onClick={() => setActiveTab('animal')}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
              activeTab === 'animal' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300'
            }`}
          >
            <Stethoscope className="w-5 h-5" /> Vertebrate Animals
          </button>
        </div>

        {/* Human Subjects Tab */}
        {activeTab === 'human' && (
          <div className="space-y-6">
            {/* Initial Determination */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Human Subjects Involvement</h2>
              
              <div className="mb-4">
                <p className="text-sm text-slate-700 mb-3">Does this research involve human subjects?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setHumanData({...humanData, involvesHumanSubjects: true})}
                    className={`px-4 py-2 rounded-lg border ${
                      humanData.involvesHumanSubjects === true 
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700' 
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setHumanData({...humanData, involvesHumanSubjects: false})}
                    className={`px-4 py-2 rounded-lg border ${
                      humanData.involvesHumanSubjects === false 
                        ? 'bg-green-50 border-green-300 text-green-700' 
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {humanData.involvesHumanSubjects === true && (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-slate-700 mb-3">Is this a clinical trial?</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setHumanData({...humanData, isClinicalTrial: true})}
                        className={`px-4 py-2 rounded-lg border ${
                          humanData.isClinicalTrial === true 
                            ? 'bg-amber-50 border-amber-300 text-amber-700' 
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        Yes - Clinical Trial
                      </button>
                      <button
                        onClick={() => setHumanData({...humanData, isClinicalTrial: false})}
                        className={`px-4 py-2 rounded-lg border ${
                          humanData.isClinicalTrial === false 
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700' 
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        No - Not a Clinical Trial
                      </button>
                    </div>
                  </div>

                  {/* Exemption Category */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Exemption Category (if applicable)
                    </label>
                    <select
                      value={humanData.exemptionCategory}
                      onChange={(e) => setHumanData({...humanData, exemptionCategory: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="">Not Exempt - Full IRB Review Required</option>
                      {exemptionCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}: {cat.desc}</option>
                      ))}
                    </select>
                  </div>

                  {/* Risk Level */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Risk Level</label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setHumanData({...humanData, riskLevel: 'minimal'})}
                        className={`px-4 py-2 rounded-lg border ${
                          humanData.riskLevel === 'minimal' 
                            ? 'bg-green-50 border-green-300 text-green-700' 
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        Minimal Risk
                      </button>
                      <button
                        onClick={() => setHumanData({...humanData, riskLevel: 'greater_than_minimal'})}
                        className={`px-4 py-2 rounded-lg border ${
                          humanData.riskLevel === 'greater_than_minimal' 
                            ? 'bg-amber-50 border-amber-300 text-amber-700' 
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        Greater Than Minimal Risk
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Protection Plan */}
            {humanData.involvesHumanSubjects === true && (
              <>
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <button 
                    onClick={() => toggleSection('protection')}
                    className="w-full flex items-center justify-between"
                  >
                    <h2 className="text-lg font-semibold text-slate-900">Protection of Human Subjects</h2>
                    {expanded.protection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                  
                  {expanded.protection && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Risks to Subjects
                        </label>
                        <textarea
                          value={humanData.protectionPlan}
                          onChange={(e) => setHumanData({...humanData, protectionPlan: e.target.value})}
                          rows={4}
                          placeholder="Describe potential risks to participants and how they will be minimized..."
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Adequacy of Protection Against Risks
                        </label>
                        <textarea
                          value={humanData.informedConsentProcess}
                          onChange={(e) => setHumanData({...humanData, informedConsentProcess: e.target.value})}
                          rows={4}
                          placeholder="Describe informed consent process, data safety monitoring, protections for vulnerable populations..."
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Data and Safety Monitoring Plan
                        </label>
                        <textarea
                          value={humanData.dataPrivacyPlan}
                          onChange={(e) => setHumanData({...humanData, dataPrivacyPlan: e.target.value})}
                          rows={4}
                          placeholder="Describe how participant data will be protected, stored, and monitored..."
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Vulnerable Populations */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Vulnerable Populations</h2>
                  <p className="text-sm text-slate-600 mb-3">Select any vulnerable populations involved:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {vulnerablePopOptions.map(pop => (
                      <label key={pop} className="flex items-center gap-2 p-2 rounded hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={humanData.vulnerablePopulations.includes(pop)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setHumanData({...humanData, vulnerablePopulations: [...humanData.vulnerablePopulations, pop]});
                            } else {
                              setHumanData({...humanData, vulnerablePopulations: humanData.vulnerablePopulations.filter(p => p !== pop)});
                            }
                          }}
                          className="rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">{pop}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* IRB Status */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">IRB Status</h2>
                  <div className="flex gap-3 flex-wrap">
                    {(['not_submitted', 'pending', 'approved', 'exempt'] as const).map(status => (
                      <button
                        key={status}
                        onClick={() => setHumanData({...humanData, irbStatus: status})}
                        className={`px-4 py-2 rounded-lg border capitalize ${
                          humanData.irbStatus === status 
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700' 
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {status.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                  {(humanData.irbStatus === 'approved' || humanData.irbStatus === 'pending') && (
                    <input
                      type="text"
                      placeholder="IRB Protocol Number"
                      value={humanData.irbProtocolNumber || ''}
                      onChange={(e) => setHumanData({...humanData, irbProtocolNumber: e.target.value})}
                      className="mt-3 px-3 py-2 border border-slate-300 rounded-lg w-full max-w-xs"
                    />
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Vertebrate Animals Tab */}
        {activeTab === 'animal' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Vertebrate Animals Involvement</h2>
              
              <div className="mb-4">
                <p className="text-sm text-slate-700 mb-3">Does this research involve vertebrate animals?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setAnimalData({...animalData, involvesAnimals: true})}
                    className={`px-4 py-2 rounded-lg border ${
                      animalData.involvesAnimals === true 
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700' 
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setAnimalData({...animalData, involvesAnimals: false})}
                    className={`px-4 py-2 rounded-lg border ${
                      animalData.involvesAnimals === false 
                        ? 'bg-green-50 border-green-300 text-green-700' 
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {animalData.involvesAnimals === true && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Species Used</label>
                    <input
                      type="text"
                      placeholder="e.g., C57BL/6 mice, Sprague-Dawley rats"
                      value={animalData.species.join(', ')}
                      onChange={(e) => setAnimalData({...animalData, species: e.target.value.split(',').map(s => s.trim())})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Total Number of Animals</label>
                    <input
                      type="number"
                      value={animalData.totalNumber || ''}
                      onChange={(e) => setAnimalData({...animalData, totalNumber: parseInt(e.target.value) || 0})}
                      className="w-full max-w-xs px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </>
              )}
            </div>

            {animalData.involvesAnimals === true && (
              <>
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Justification & Alternatives</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Justification for Animal Use
                      </label>
                      <textarea
                        value={animalData.justification}
                        onChange={(e) => setAnimalData({...animalData, justification: e.target.value})}
                        rows={3}
                        placeholder="Explain why animals are necessary for this research..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Alternatives Considered (3Rs)
                      </label>
                      <textarea
                        value={animalData.alternativesConsidered}
                        onChange={(e) => setAnimalData({...animalData, alternativesConsidered: e.target.value})}
                        rows={3}
                        placeholder="Describe alternatives considered and why they are not suitable..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Procedures & Pain Categories</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Description of Procedures
                      </label>
                      <textarea
                        value={animalData.proceduresDescription}
                        onChange={(e) => setAnimalData({...animalData, proceduresDescription: e.target.value})}
                        rows={4}
                        placeholder="Describe all procedures to be performed on animals..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Category C (No Pain)</label>
                        <input
                          type="number"
                          value={animalData.painCategories.categoryC || ''}
                          onChange={(e) => setAnimalData({
                            ...animalData, 
                            painCategories: {...animalData.painCategories, categoryC: parseInt(e.target.value) || 0}
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Category D (Pain w/ Relief)</label>
                        <input
                          type="number"
                          value={animalData.painCategories.categoryD || ''}
                          onChange={(e) => setAnimalData({
                            ...animalData, 
                            painCategories: {...animalData.painCategories, categoryD: parseInt(e.target.value) || 0}
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Category E (Pain w/o Relief)</label>
                        <input
                          type="number"
                          value={animalData.painCategories.categoryE || ''}
                          onChange={(e) => setAnimalData({
                            ...animalData, 
                            painCategories: {...animalData.painCategories, categoryE: parseInt(e.target.value) || 0}
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Euthanasia Method</label>
                      <input
                        type="text"
                        value={animalData.euthanasiaMethod}
                        onChange={(e) => setAnimalData({...animalData, euthanasiaMethod: e.target.value})}
                        placeholder="e.g., CO2 asphyxiation followed by cervical dislocation"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">IACUC Status</h2>
                  <div className="flex gap-3 flex-wrap">
                    {(['not_submitted', 'pending', 'approved'] as const).map(status => (
                      <button
                        key={status}
                        onClick={() => setAnimalData({...animalData, iacucStatus: status})}
                        className={`px-4 py-2 rounded-lg border capitalize ${
                          animalData.iacucStatus === status 
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700' 
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {status.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                  {(animalData.iacucStatus === 'approved' || animalData.iacucStatus === 'pending') && (
                    <input
                      type="text"
                      placeholder="IACUC Protocol Number"
                      value={animalData.iacucProtocolNumber || ''}
                      onChange={(e) => setAnimalData({...animalData, iacucProtocolNumber: e.target.value})}
                      className="mt-3 px-3 py-2 border border-slate-300 rounded-lg w-full max-w-xs"
                    />
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
            Save Regulatory Sections
          </button>
        </div>
      </div>
    </div>
  );
}
