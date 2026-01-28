'use client';

import { useResubmission } from '../hooks/useResubmission';
import DocumentUpload from './DocumentUpload';
import CritiqueParser from './CritiqueParser';
import AuditResults from './AuditResults';
import ResponseStrategy from './ResponseStrategy';
import SectionRewriter from './SectionRewriter';
import CoverLetterGenerator from './CoverLetterGenerator';
import QualityCheck from './QualityCheck';
import { DISCLAIMER } from '../types';

const STEPS = [
  { id: 1, name: 'Upload', description: 'Upload documents' },
  { id: 2, name: 'Parse', description: 'Extract critiques' },
  { id: 3, name: 'Audit', description: 'AI analysis' },
  { id: 4, name: 'Strategy', description: 'Response plan' },
  { id: 5, name: 'Rewrite', description: 'Section editing' },
  { id: 6, name: 'Cover Letter', description: 'Introduction' },
  { id: 7, name: 'Quality', description: 'Final check' },
];

export default function ResubmissionWizard() {
  const {
    state,
    setStep,
    setSubmissionType,
    setPreviousScore,
    setGrantDocument,
    setSummaryStatement,
    parseSummaryStatement,
    runAudit,
    generateStrategy,
    rewriteSection,
    generateCoverLetter,
    runQualityCheck,
  } = useResubmission();

  const currentStep = state.step;

  const goToStep = (step: number) => {
    if (step >= 1 && step <= 7) setStep(step);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <DocumentUpload
            onGrantUpload={setGrantDocument}
            onSummaryUpload={setSummaryStatement}
            onSubmissionTypeChange={setSubmissionType}
            onPreviousScoreChange={setPreviousScore}
            grantFile={state.grantDocument}
            summaryFile={state.summaryStatement}
            submissionType={state.submissionType}
            previousScore={state.previousScore}
          />
        );
      case 2:
        return state.parsedSummary ? (
          <CritiqueParser data={state.parsedSummary} />
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Parse Summary Statement</h3>
            <p className="text-slate-600">Extract reviewer critiques from the summary statement.</p>
            <button
              onClick={parseSummaryStatement}
              disabled={state.loading || !state.summaryText}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {state.loading ? 'Parsing...' : 'Parse Critiques'}
            </button>
          </div>
        );
      case 3:
        return state.auditResults ? (
          <AuditResults data={state.auditResults} />
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Run AI Audit</h3>
            <p className="text-slate-600">Analyze your original application against the critiques.</p>
            <button
              onClick={runAudit}
              disabled={state.loading || !state.parsedSummary || !state.grantText}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {state.loading ? 'Analyzing...' : 'Run Audit'}
            </button>
          </div>
        );
      case 4:
        return state.responseStrategy ? (
          <ResponseStrategy data={state.responseStrategy} />
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Generate Response Strategy</h3>
            <p className="text-slate-600">Create a point-by-point response plan for each critique.</p>
            <button
              onClick={generateStrategy}
              disabled={state.loading || !state.auditResults}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {state.loading ? 'Generating...' : 'Generate Strategy'}
            </button>
          </div>
        );
      case 5:
        return (
          <SectionRewriter
            strategy={state.responseStrategy}
            rewrites={state.sectionRewrites}
            onRewrite={async (s, o, c) => { await rewriteSection(s, o, c); }}
            loading={state.loading}
          />
        );
      case 6:
        return (
          <CoverLetterGenerator
            data={state.coverLetter}
            onGenerate={generateCoverLetter}
            loading={state.loading}
          />
        );
      case 7:
        return (
          <QualityCheck
            data={state.qualityCheck}
            onCheck={runQualityCheck}
            loading={state.loading}
          />
        );
      default:
        return null;
    }
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 1: return state.summaryStatement !== null;
      case 2: return state.parsedSummary !== null;
      case 3: return state.auditResults !== null;
      case 4: return state.responseStrategy !== null;
      case 5: return true;
      case 6: return state.coverLetter !== null;
      default: return true;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Resubmission Assistant</h1>
      <p className="text-gray-600 mb-8">Prepare your NIH grant resubmission step by step</p>

      {/* Progress Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => goToStep(step.id)}
                className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-colors ${
                  currentStep === step.id
                    ? 'bg-indigo-600 text-white'
                    : currentStep > step.id
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {currentStep > step.id ? '✓' : step.id}
              </button>
              {idx < STEPS.length - 1 && (
                <div className={`w-8 h-1 mx-1 ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {STEPS.map((step) => (
            <div key={step.id} className="text-center w-16">
              <p className={`text-xs font-medium ${currentStep === step.id ? 'text-indigo-600' : 'text-gray-500'}`}>
                {step.name}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{state.error}</div>
      )}

      {/* Step Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[400px]">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => goToStep(currentStep - 1)}
          disabled={currentStep === 1}
          className="px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          ← Previous
        </button>
        {currentStep < 7 ? (
          <button
            onClick={() => goToStep(currentStep + 1)}
            disabled={!canGoNext() || state.loading}
            className="px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {state.loading ? 'Processing...' : 'Next →'}
          </button>
        ) : (
          <div />
        )}
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 mt-6 text-center">{DISCLAIMER}</p>
    </div>
  );
}
