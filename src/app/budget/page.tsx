'use client';

import { useState, createContext, useContext, useReducer, ReactNode } from 'react';
import Link from 'next/link';
import { FileSpreadsheet, Clock, ArrowLeft, Check, Plus, Pencil, Trash2, X, ChevronDown, ChevronRight, Info, AlertTriangle, AlertCircle, Download, FileText, CheckCircle } from 'lucide-react';

// Types
interface PersonnelItem { id: string; name: string; role: string; baseSalary: number; effortPercent: number; fringeRate: number; months: number; }
interface DirectCostItem { id: string; category: 'equipment' | 'supplies' | 'travel' | 'consultant' | 'subcontract' | 'other'; description: string; amount: number; justification: string; }
interface BudgetState { projectTitle: string; grantType: string; startDate: string; endDate: string; duration: number; personnel: PersonnelItem[]; directCosts: DirectCostItem[]; customFringeRate: number | null; customIndirectRate: number | null; }
interface BudgetTotals { personnelSalaries: number; personnelFringe: number; personnelTotal: number; equipment: number; supplies: number; travel: number; consultants: number; subcontracts: number; otherDirect: number; totalDirectCosts: number; indirectBase: number; indirectCosts: number; totalBudget: number; }
interface ComplianceIssue { type: 'error' | 'warning'; category: string; message: string; field?: string; }

// Grant Rules
const RULES_LAST_UPDATED = 'January 2026';
interface GrantRule { id: string; name: string; fullName: string; maxBudget: number | null; subcontractLimit: number | null; salaryCapPerYear: number | null; fringeRate: number; indirectRate: number; indirectBase: 'MTDC' | 'TDC'; equipmentThreshold: number; notes: string[]; budgetEmphasis: string[]; typicalAllocation: Record<string, string>; }

const GRANT_RULES: Record<string, GrantRule> = {
  'sbir-phase1': { id: 'sbir-phase1', name: 'SBIR Phase I', fullName: 'Small Business Innovation Research - Phase I', maxBudget: 275000, subcontractLimit: 0.33, salaryCapPerYear: null, fringeRate: 0.30, indirectRate: 0.50, indirectBase: 'MTDC', equipmentThreshold: 5000, notes: ['Maximum award: $275,000', 'Subcontracts ≤33% of total'], budgetEmphasis: ['Feasibility demonstration', 'Proof-of-concept R&D', 'Minimal equipment (use existing)'], typicalAllocation: { personnel: '50-60%', supplies: '15-25%', subcontracts: '10-33%', travel: '2-5%' } },
  'sbir-phase2': { id: 'sbir-phase2', name: 'SBIR Phase II', fullName: 'Small Business Innovation Research - Phase II', maxBudget: 1750000, subcontractLimit: 0.33, salaryCapPerYear: null, fringeRate: 0.30, indirectRate: 0.50, indirectBase: 'MTDC', equipmentThreshold: 5000, notes: ['Maximum award: $1,750,000', 'Subcontracts ≤33% of total'], budgetEmphasis: ['Full R&D and prototyping', 'Commercialization planning', 'Equipment for scale-up'], typicalAllocation: { personnel: '45-55%', equipment: '10-20%', supplies: '15-20%', subcontracts: '10-25%' } },
  'sbir-fasttrack': { id: 'sbir-fasttrack', name: 'SBIR Fast Track', fullName: 'Small Business Innovation Research - Fast Track (Phase I/II)', maxBudget: 2025000, subcontractLimit: 0.33, salaryCapPerYear: null, fringeRate: 0.30, indirectRate: 0.50, indirectBase: 'MTDC', equipmentThreshold: 5000, notes: ['Phase I: $275K + Phase II: $1.75M', 'Single application', 'Must meet Phase I milestones'], budgetEmphasis: ['Clear Phase I/II budget split', 'Milestone-driven spending', 'Commercialization-ready by end'], typicalAllocation: { personnel: '50-55%', equipment: '8-15%', supplies: '15-20%', subcontracts: '15-30%' } },
  'sttr-phase1': { id: 'sttr-phase1', name: 'STTR Phase I', fullName: 'Small Business Technology Transfer - Phase I', maxBudget: 275000, subcontractLimit: 0.40, salaryCapPerYear: null, fringeRate: 0.30, indirectRate: 0.50, indirectBase: 'MTDC', equipmentThreshold: 5000, notes: ['Maximum award: $275,000', 'Research institution ≥30% of work', 'Subcontracts can be ≤40%'], budgetEmphasis: ['Strong academic collaboration', 'Leverage university resources', 'Technology transfer focus'], typicalAllocation: { personnel: '40-50%', subcontracts: '30-40%', supplies: '10-20%', travel: '3-5%' } },
  'sttr-phase2': { id: 'sttr-phase2', name: 'STTR Phase II', fullName: 'Small Business Technology Transfer - Phase II', maxBudget: 1750000, subcontractLimit: 0.40, salaryCapPerYear: null, fringeRate: 0.30, indirectRate: 0.50, indirectBase: 'MTDC', equipmentThreshold: 5000, notes: ['Maximum award: $1,750,000', 'Research institution ≥30% of work'], budgetEmphasis: ['Continued university partnership', 'Scale technology from lab', 'Bridge academic to commercial'], typicalAllocation: { personnel: '40-50%', subcontracts: '30-40%', equipment: '10-15%', supplies: '10-15%' } },
  'sttr-fasttrack': { id: 'sttr-fasttrack', name: 'STTR Fast Track', fullName: 'Small Business Technology Transfer - Fast Track (Phase I/II)', maxBudget: 2025000, subcontractLimit: 0.40, salaryCapPerYear: null, fringeRate: 0.30, indirectRate: 0.50, indirectBase: 'MTDC', equipmentThreshold: 5000, notes: ['Phase I: $275K + Phase II: $1.75M', 'Research institution ≥30% of work'], budgetEmphasis: ['Sustained research partnership', 'Phased technology development', 'Clear IP transfer plan'], typicalAllocation: { personnel: '40-50%', subcontracts: '30-40%', equipment: '8-12%', supplies: '10-15%' } },
  r01: { id: 'r01', name: 'NIH R01', fullName: 'NIH Research Project Grant (R01)', maxBudget: 250000, subcontractLimit: null, salaryCapPerYear: 228000, fringeRate: 0.32, indirectRate: 0.55, indirectBase: 'MTDC', equipmentThreshold: 5000, notes: ['Modular: $250K/year direct costs', 'Salary Cap: $228,000 (Jan 2026)'], budgetEmphasis: ['Heavy personnel investment', 'Research trainees encouraged', 'Rigorous scientific methods'], typicalAllocation: { personnel: '60-75%', supplies: '15-25%', travel: '3-5%', equipment: '0-10%' } },
  nci: { id: 'nci', name: 'NCI R01', fullName: 'National Cancer Institute Research Project Grant (R01)', maxBudget: 250000, subcontractLimit: null, salaryCapPerYear: 228000, fringeRate: 0.32, indirectRate: 0.55, indirectBase: 'MTDC', equipmentThreshold: 5000, notes: ['Modular: $250K/year direct costs', 'Salary Cap: $228,000', 'Cancer-specific focus'], budgetEmphasis: ['Cancer research expertise', 'Biospecimen costs common', 'Multi-site collaborations valued'], typicalAllocation: { personnel: '60-70%', supplies: '15-25%', travel: '3-5%', subcontracts: '5-15%' } },
  'dod-sbir-phase1': { id: 'dod-sbir-phase1', name: 'DOD SBIR Phase I', fullName: 'Department of Defense SBIR - Phase I', maxBudget: 314363, subcontractLimit: 0.33, salaryCapPerYear: null, fringeRate: 0.30, indirectRate: 0.45, indirectBase: 'MTDC', equipmentThreshold: 5000, notes: ['Maximum award: $314,363', 'Lower indirect rate (45%)', 'Check dodsbirsttr.mil'], budgetEmphasis: ['Defense application focus', 'Prototype orientation', 'Security clearance costs if needed'], typicalAllocation: { personnel: '50-60%', supplies: '15-25%', travel: '5-8%', equipment: '5-15%' } },
  'dod-sbir-phase2': { id: 'dod-sbir-phase2', name: 'DOD SBIR Phase II', fullName: 'Department of Defense SBIR - Phase II', maxBudget: 1800000, subcontractLimit: 0.33, salaryCapPerYear: null, fringeRate: 0.30, indirectRate: 0.45, indirectBase: 'MTDC', equipmentThreshold: 5000, notes: ['Maximum award: $1,800,000', 'Lower indirect rate (45%)', 'Phase III transition planning'], budgetEmphasis: ['Prototype to product', 'Field testing costs', 'Manufacturing readiness'], typicalAllocation: { personnel: '45-55%', equipment: '15-25%', supplies: '10-20%', travel: '5-10%' } },
  cprit: { id: 'cprit', name: 'CPRIT', fullName: 'Cancer Prevention Research Institute of Texas', maxBudget: null, subcontractLimit: null, salaryCapPerYear: null, fringeRate: 0.28, indirectRate: 0.05, indirectBase: 'TDC', equipmentThreshold: 5000, notes: ['Texas institutions only', 'Indirect capped at 5%', 'No budget ceiling'], budgetEmphasis: ['Maximize direct costs (low indirect)', 'Texas-based jobs prioritized', 'Cancer prevention/research focus'], typicalAllocation: { personnel: '65-80%', supplies: '10-20%', equipment: '5-15%', travel: '2-5%' } },
};

// Grant conversion mapping - shows what happens when switching between grant types
const GRANT_CONVERSION_NOTES: Record<string, Record<string, string[]>> = {
  'sbir-phase1': {
    'dod-sbir-phase1': ['Budget limit increases to $314,363', 'Indirect rate decreases to 45%', 'Review DOD-specific requirements'],
    'sttr-phase1': ['Subcontract limit increases to 40%', 'Research institution must perform 30% of work'],
  },
  'dod-sbir-phase1': {
    'sbir-phase1': ['Budget limit decreases to $275,000', 'Indirect rate increases to 50%', 'NIH-specific formatting required'],
  },
  'sttr-phase1': {
    'sbir-phase1': ['Subcontract limit decreases to 33%', 'No research institution requirement'],
  },
};

const PERSONNEL_ROLES = ['Principal Investigator', 'Co-Investigator', 'Postdoctoral Fellow', 'Graduate Student', 'Research Associate', 'Research Technician', 'Lab Manager', 'Data Analyst', 'Project Coordinator'];

// Calculations
const formatCurrency = (amount: number): string => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

function calculatePersonnelCost(baseSalary: number, effortPercent: number, fringeRate: number, months: number) {
  const salary = (baseSalary * effortPercent / 100) * (months / 12);
  const fringe = salary * fringeRate;
  return { salary, fringe, total: salary + fringe };
}

function calculateBudgetTotals(state: BudgetState): BudgetTotals {
  const rule = GRANT_RULES[state.grantType];
  const fringeRate = state.customFringeRate ?? rule?.fringeRate ?? 0.30;
  const indirectRate = state.customIndirectRate ?? rule?.indirectRate ?? 0.50;

  let personnelSalaries = 0, personnelFringe = 0;
  state.personnel.forEach((p) => {
    const effectiveSalary = rule?.salaryCapPerYear ? Math.min(p.baseSalary, rule.salaryCapPerYear) : p.baseSalary;
    const cost = calculatePersonnelCost(effectiveSalary, p.effortPercent, fringeRate, p.months);
    personnelSalaries += cost.salary;
    personnelFringe += cost.fringe;
  });

  const personnelTotal = personnelSalaries + personnelFringe;
  const equipment = state.directCosts.filter(c => c.category === 'equipment').reduce((sum, c) => sum + c.amount, 0);
  const supplies = state.directCosts.filter(c => c.category === 'supplies').reduce((sum, c) => sum + c.amount, 0);
  const travel = state.directCosts.filter(c => c.category === 'travel').reduce((sum, c) => sum + c.amount, 0);
  const consultants = state.directCosts.filter(c => c.category === 'consultant').reduce((sum, c) => sum + c.amount, 0);
  const subcontracts = state.directCosts.filter(c => c.category === 'subcontract').reduce((sum, c) => sum + c.amount, 0);
  const otherDirect = state.directCosts.filter(c => c.category === 'other').reduce((sum, c) => sum + c.amount, 0);

  const totalDirectCosts = personnelTotal + equipment + supplies + travel + consultants + subcontracts + otherDirect;
  let indirectBase = totalDirectCosts;
  if (rule?.indirectBase === 'MTDC') {
    indirectBase -= equipment;
    indirectBase -= Math.max(0, subcontracts - 25000);
  }
  const indirectCosts = indirectBase * indirectRate;
  const totalBudget = totalDirectCosts + indirectCosts;

  return { personnelSalaries, personnelFringe, personnelTotal, equipment, supplies, travel, consultants, subcontracts, otherDirect, totalDirectCosts, indirectBase, indirectCosts, totalBudget };
}

function validateCompliance(state: BudgetState, totals: BudgetTotals): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];
  const rule = GRANT_RULES[state.grantType];
  if (!rule) return issues;

  if (rule.maxBudget && totals.totalBudget > rule.maxBudget) {
    issues.push({ type: 'error', category: 'Budget Cap', message: `Total budget (${formatCurrency(totals.totalBudget)}) exceeds maximum allowed (${formatCurrency(rule.maxBudget)})` });
  }
  if (rule.subcontractLimit && totals.subcontracts > 0) {
    const subcontractPercent = totals.subcontracts / totals.totalBudget;
    if (subcontractPercent > rule.subcontractLimit) {
      issues.push({ type: 'error', category: 'Subcontract Limit', message: `Subcontracts (${(subcontractPercent * 100).toFixed(1)}%) exceed ${(rule.subcontractLimit * 100).toFixed(0)}% limit` });
    }
  }
  if (rule.salaryCapPerYear) {
    state.personnel.forEach((p) => {
      if (p.baseSalary > rule.salaryCapPerYear!) {
        issues.push({ type: 'warning', category: 'Salary Cap', message: `${p.name}'s salary exceeds NIH cap. Budget will use capped amount.`, field: p.id });
      }
    });
  }
  if (state.personnel.length === 0) {
    issues.push({ type: 'warning', category: 'Personnel', message: 'No personnel added to budget' });
  }
  return issues;
}

// Context
type BudgetAction =
  | { type: 'SET_PROJECT_INFO'; payload: Partial<BudgetState> }
  | { type: 'ADD_PERSONNEL'; payload: PersonnelItem }
  | { type: 'UPDATE_PERSONNEL'; payload: PersonnelItem }
  | { type: 'DELETE_PERSONNEL'; payload: string }
  | { type: 'ADD_DIRECT_COST'; payload: DirectCostItem }
  | { type: 'UPDATE_DIRECT_COST'; payload: DirectCostItem }
  | { type: 'DELETE_DIRECT_COST'; payload: string }
  | { type: 'SET_CUSTOM_RATES'; payload: { fringeRate?: number; indirectRate?: number } }
  | { type: 'RESET' };

const initialState: BudgetState = { projectTitle: '', grantType: '', startDate: '', endDate: '', duration: 12, personnel: [], directCosts: [], customFringeRate: null, customIndirectRate: null };

function budgetReducer(state: BudgetState, action: BudgetAction): BudgetState {
  switch (action.type) {
    case 'SET_PROJECT_INFO': return { ...state, ...action.payload };
    case 'ADD_PERSONNEL': return { ...state, personnel: [...state.personnel, action.payload] };
    case 'UPDATE_PERSONNEL': return { ...state, personnel: state.personnel.map(p => p.id === action.payload.id ? action.payload : p) };
    case 'DELETE_PERSONNEL': return { ...state, personnel: state.personnel.filter(p => p.id !== action.payload) };
    case 'ADD_DIRECT_COST': return { ...state, directCosts: [...state.directCosts, action.payload] };
    case 'UPDATE_DIRECT_COST': return { ...state, directCosts: state.directCosts.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_DIRECT_COST': return { ...state, directCosts: state.directCosts.filter(c => c.id !== action.payload) };
    case 'SET_CUSTOM_RATES': return { ...state, customFringeRate: action.payload.fringeRate ?? state.customFringeRate, customIndirectRate: action.payload.indirectRate ?? state.customIndirectRate };
    case 'RESET': return initialState;
    default: return state;
  }
}

interface BudgetContextType { state: BudgetState; dispatch: React.Dispatch<BudgetAction>; }
const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

function BudgetProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(budgetReducer, initialState);
  return <BudgetContext.Provider value={{ state, dispatch }}>{children}</BudgetContext.Provider>;
}

function useBudget() {
  const context = useContext(BudgetContext);
  if (!context) throw new Error('useBudget must be used within a BudgetProvider');
  return context;
}

// Components
function WizardStepper({ steps, currentStep, onStepClick }: { steps: string[]; currentStep: number; onStepClick: (step: number) => void }) {
  return (
    <div className="w-full bg-white border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;
            return (
              <div key={step} className="flex items-center">
                <button onClick={() => isCompleted && onStepClick(index)} disabled={index > currentStep} className={`flex items-center gap-3 ${isCompleted ? 'cursor-pointer' : index > currentStep ? 'cursor-not-allowed' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${isCompleted ? 'bg-primary-500 text-white' : isActive ? 'ring-2 ring-primary-500 text-primary-500 bg-white' : 'bg-slate-200 text-slate-500'}`}>
                    {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                  </div>
                  <span className={`text-sm hidden sm:block ${isActive ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>{step}</span>
                </button>
                {index < steps.length - 1 && <div className={`w-8 sm:w-16 h-0.5 mx-2 ${index < currentStep ? 'bg-primary-500' : 'bg-slate-200'}`} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SetupStep({ onNext }: { onNext: () => void }) {
  const { state, dispatch } = useBudget();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!state.projectTitle.trim()) newErrors.projectTitle = 'Project title is required';
    if (!state.grantType) newErrors.grantType = 'Please select a grant type';
    if (!state.startDate) newErrors.startDate = 'Start date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const selectedRule = state.grantType ? GRANT_RULES[state.grantType] : null;

  return (
    <div className="space-y-8">
      <div><h2 className="text-2xl font-bold text-slate-900">Project Setup</h2><p className="text-slate-500 mt-1">Enter basic project information and select grant type</p></div>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Project Title *</label>
          <input type="text" value={state.projectTitle} onChange={(e) => dispatch({ type: 'SET_PROJECT_INFO', payload: { projectTitle: e.target.value } })} className={`w-full h-14 px-4 rounded-lg border ${errors.projectTitle ? 'border-error' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-primary-500`} placeholder="Enter your project title" />
          {errors.projectTitle && <p className="text-error text-sm mt-1">{errors.projectTitle}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Grant Type *</label>
          <div className="relative">
            <select value={state.grantType} onChange={(e) => dispatch({ type: 'SET_PROJECT_INFO', payload: { grantType: e.target.value } })} className={`w-full h-14 px-4 pr-10 rounded-lg border appearance-none ${errors.grantType ? 'border-error' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white`}>
              <option value="">Select a grant type</option>
              {Object.values(GRANT_RULES).map((rule) => <option key={rule.id} value={rule.id}>{rule.name} - {rule.fullName}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
          </div>
          {errors.grantType && <p className="text-error text-sm mt-1">{errors.grantType}</p>}
        </div>
        {selectedRule && (
          <div className="bg-primary-50 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between">
              <h4 className="font-medium text-primary-900">{selectedRule.fullName}</h4>
              {selectedRule.maxBudget && <span className="text-lg font-bold text-primary-700">{formatCurrency(selectedRule.maxBudget)}</span>}
            </div>
            <ul className="text-sm text-primary-900 space-y-1">{selectedRule.notes.map((note, i) => <li key={i}>• {note}</li>)}</ul>
            
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-primary-200">
              <div>
                <p className="text-xs font-semibold text-primary-800 mb-1">Budget Emphasis:</p>
                <ul className="text-xs text-primary-700 space-y-0.5">{selectedRule.budgetEmphasis.map((e, i) => <li key={i}>→ {e}</li>)}</ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-primary-800 mb-1">Typical Allocation:</p>
                <ul className="text-xs text-primary-700 space-y-0.5">
                  {Object.entries(selectedRule.typicalAllocation).map(([cat, pct]) => (
                    <li key={cat} className="capitalize">{cat}: {pct}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="pt-2 border-t border-primary-200">
              <p className="text-xs font-medium text-primary-800 mb-2">Quick Convert to Similar Grant:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(GRANT_RULES).filter(([id]) => id !== state.grantType && (
                  (state.grantType.includes('sbir') && (id.includes('sbir') || id.includes('sttr'))) ||
                  (state.grantType.includes('sttr') && (id.includes('sbir') || id.includes('sttr'))) ||
                  (state.grantType.includes('r01') || state.grantType === 'nci') && (id.includes('r01') || id === 'nci') ||
                  (state.grantType.includes('dod') && id.includes('dod'))
                )).slice(0, 4).map(([id, rule]) => (
                  <button key={id} onClick={() => dispatch({ type: 'SET_PROJECT_INFO', payload: { grantType: id } })} className="text-xs px-2 py-1 bg-white border border-primary-300 rounded hover:bg-primary-100 text-primary-700">
                    → {rule.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Start Date *</label>
            <input type="date" value={state.startDate} onChange={(e) => dispatch({ type: 'SET_PROJECT_INFO', payload: { startDate: e.target.value } })} className={`w-full h-14 px-4 rounded-lg border ${errors.startDate ? 'border-error' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-primary-500`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Duration (months) *</label>
            <input type="number" min="1" max="60" value={state.duration} onChange={(e) => dispatch({ type: 'SET_PROJECT_INFO', payload: { duration: parseInt(e.target.value) || 12 } })} className="w-full h-14 px-4 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
      </div>
      <div className="flex justify-end pt-4">
        <button onClick={() => validate() && onNext()} className="px-8 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600">Continue to Personnel</button>
      </div>
    </div>
  );
}

function PersonnelStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { state, dispatch } = useBudget();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<PersonnelItem>>({ name: '', role: '', baseSalary: 0, effortPercent: 100, fringeRate: 0.30, months: 12 });
  const rule = GRANT_RULES[state.grantType];
  const defaultFringeRate = state.customFringeRate ?? rule?.fringeRate ?? 0.30;

  const resetForm = () => { setFormData({ name: '', role: '', baseSalary: 0, effortPercent: 100, fringeRate: defaultFringeRate, months: state.duration || 12 }); setEditingId(null); setShowForm(false); };
  const handleSave = () => {
    if (!formData.name || !formData.role || !formData.baseSalary) return;
    const item: PersonnelItem = { id: editingId || crypto.randomUUID(), name: formData.name!, role: formData.role!, baseSalary: formData.baseSalary!, effortPercent: formData.effortPercent!, fringeRate: formData.fringeRate!, months: formData.months! };
    dispatch(editingId ? { type: 'UPDATE_PERSONNEL', payload: item } : { type: 'ADD_PERSONNEL', payload: item });
    resetForm();
  };
  const getPersonnelTotal = (person: PersonnelItem) => {
    const effectiveSalary = rule?.salaryCapPerYear ? Math.min(person.baseSalary, rule.salaryCapPerYear) : person.baseSalary;
    return calculatePersonnelCost(effectiveSalary, person.effortPercent, person.fringeRate, person.months);
  };
  const totalPersonnelCost = state.personnel.reduce((sum, p) => sum + getPersonnelTotal(p).total, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-900">Personnel</h2><p className="text-slate-500 mt-1">Add project team members</p></div>
        {!showForm && <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600"><Plus className="w-4 h-4" /> Add Person</button>}
      </div>
      {showForm && (
        <div className="bg-slate-50 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between"><h3 className="font-semibold text-slate-900">{editingId ? 'Edit Personnel' : 'Add Personnel'}</h3><button onClick={resetForm} className="p-1 hover:bg-slate-200 rounded"><X className="w-5 h-5 text-slate-500" /></button></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full h-12 px-4 rounded-lg border border-slate-200" placeholder="Dr. Jane Smith" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
              <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full h-12 px-4 rounded-lg border border-slate-200 bg-white">
                <option value="">Select role</option>{PERSONNEL_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Base Salary *</label><input type="number" value={formData.baseSalary || ''} onChange={(e) => setFormData({ ...formData, baseSalary: parseFloat(e.target.value) || 0 })} className="w-full h-12 px-4 rounded-lg border border-slate-200" placeholder="120000" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Effort %</label><input type="number" min="1" max="100" value={formData.effortPercent || ''} onChange={(e) => setFormData({ ...formData, effortPercent: parseFloat(e.target.value) || 0 })} className="w-full h-12 px-4 rounded-lg border border-slate-200" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Fringe Rate</label><input type="number" step="0.01" value={formData.fringeRate || ''} onChange={(e) => setFormData({ ...formData, fringeRate: parseFloat(e.target.value) || 0 })} className="w-full h-12 px-4 rounded-lg border border-slate-200" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Months</label><input type="number" min="1" value={formData.months || ''} onChange={(e) => setFormData({ ...formData, months: parseInt(e.target.value) || 12 })} className="w-full h-12 px-4 rounded-lg border border-slate-200" /></div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={resetForm} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">Cancel</button>
            <button onClick={handleSave} disabled={!formData.name || !formData.role || !formData.baseSalary} className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50">{editingId ? 'Update' : 'Add'}</button>
          </div>
        </div>
      )}
      {state.personnel.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full">
            <thead className="bg-slate-50"><tr><th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Name</th><th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Role</th><th className="text-right px-4 py-3 text-sm font-medium text-slate-700">Salary</th><th className="text-right px-4 py-3 text-sm font-medium text-slate-700">Effort</th><th className="text-right px-4 py-3 text-sm font-medium text-slate-700">Total</th><th className="w-20"></th></tr></thead>
            <tbody className="divide-y divide-slate-200">{state.personnel.map(person => {
              const cost = getPersonnelTotal(person);
              return <tr key={person.id} className="hover:bg-slate-50"><td className="px-4 py-3 text-slate-900">{person.name}</td><td className="px-4 py-3 text-slate-600">{person.role}</td><td className="px-4 py-3 text-right font-mono text-slate-900">{formatCurrency(person.baseSalary)}</td><td className="px-4 py-3 text-right font-mono text-slate-900">{person.effortPercent}%</td><td className="px-4 py-3 text-right font-mono font-medium text-slate-900">{formatCurrency(cost.total)}</td><td className="px-4 py-3"><div className="flex gap-1 justify-end"><button onClick={() => { setFormData(person); setEditingId(person.id); setShowForm(true); }} className="p-1.5 hover:bg-slate-200 rounded text-slate-500"><Pencil className="w-4 h-4" /></button><button onClick={() => dispatch({ type: 'DELETE_PERSONNEL', payload: person.id })} className="p-1.5 hover:bg-red-100 rounded text-slate-500 hover:text-error"><Trash2 className="w-4 h-4" /></button></div></td></tr>;
            })}</tbody>
            <tfoot className="bg-slate-100"><tr><td colSpan={4} className="px-4 py-3 text-right font-medium text-slate-900">Total Personnel</td><td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{formatCurrency(totalPersonnelCost)}</td><td></td></tr></tfoot>
          </table>
        </div>
      )}
      <div className="flex justify-between pt-4">
        <button onClick={onBack} className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Back</button>
        <button onClick={onNext} className="px-8 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600">Continue to Direct Costs</button>
      </div>
    </div>
  );
}

const CATEGORIES = [
  { id: 'equipment', label: 'Equipment', description: 'Items over $5,000 with useful life > 1 year' },
  { id: 'supplies', label: 'Supplies', description: 'Consumables and items under $5,000' },
  { id: 'travel', label: 'Travel', description: 'Domestic and international travel costs' },
  { id: 'consultant', label: 'Consultants', description: 'External expert services' },
  { id: 'subcontract', label: 'Subcontracts', description: 'Work performed by other organizations' },
  { id: 'other', label: 'Other Direct Costs', description: 'Publication, tuition, participant support' },
] as const;

type CategoryId = typeof CATEGORIES[number]['id'];

function DirectCostsStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { state, dispatch } = useBudget();
  const [expandedCategory, setExpandedCategory] = useState<string | null>('equipment');
  const [showForm, setShowForm] = useState<CategoryId | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<DirectCostItem>>({ description: '', amount: 0, justification: '' });

  const resetForm = () => { setFormData({ description: '', amount: 0, justification: '' }); setEditingId(null); setShowForm(null); };
  const handleSave = (category: CategoryId) => {
    if (!formData.description || !formData.amount) return;
    const item: DirectCostItem = { id: editingId || crypto.randomUUID(), category, description: formData.description!, amount: formData.amount!, justification: formData.justification || '' };
    dispatch(editingId ? { type: 'UPDATE_DIRECT_COST', payload: item } : { type: 'ADD_DIRECT_COST', payload: item });
    resetForm();
  };
  const getCategoryTotal = (categoryId: string) => state.directCosts.filter(c => c.category === categoryId).reduce((sum, c) => sum + c.amount, 0);
  const totalDirectCosts = state.directCosts.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-900">Direct Costs</h2><p className="text-slate-500 mt-1">Add non-personnel direct costs by category</p></div>
      <div className="space-y-3">
        {CATEGORIES.map(category => {
          const isExpanded = expandedCategory === category.id;
          const items = state.directCosts.filter(c => c.category === category.id);
          const total = getCategoryTotal(category.id);
          return (
            <div key={category.id} className="border border-slate-200 rounded-xl overflow-hidden">
              <button onClick={() => setExpandedCategory(isExpanded ? null : category.id)} className="w-full px-4 py-4 flex items-center justify-between bg-white hover:bg-slate-50">
                <div className="flex items-center gap-3">{isExpanded ? <ChevronDown className="w-5 h-5 text-slate-500" /> : <ChevronRight className="w-5 h-5 text-slate-500" />}<div className="text-left"><div className="font-medium text-slate-900">{category.label}</div><div className="text-sm text-slate-500">{category.description}</div></div></div>
                <div className="font-mono font-medium text-slate-900">{formatCurrency(total)}</div>
              </button>
              {isExpanded && (
                <div className="border-t border-slate-200 p-4 bg-slate-50 space-y-4">
                  {items.length > 0 && <div className="space-y-2">{items.map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                      <div><div className="font-medium text-slate-900">{item.description}</div>{item.justification && <div className="text-sm text-slate-500 mt-0.5">{item.justification}</div>}</div>
                      <div className="flex items-center gap-4"><span className="font-mono font-medium text-slate-900">{formatCurrency(item.amount)}</span><div className="flex gap-1"><button onClick={() => { setFormData(item); setEditingId(item.id); setShowForm(category.id); }} className="p-1.5 hover:bg-slate-100 rounded text-slate-500"><Pencil className="w-4 h-4" /></button><button onClick={() => dispatch({ type: 'DELETE_DIRECT_COST', payload: item.id })} className="p-1.5 hover:bg-red-100 rounded text-slate-500 hover:text-error"><Trash2 className="w-4 h-4" /></button></div></div>
                    </div>
                  ))}</div>}
                  {showForm === category.id ? (
                    <div className="bg-white p-4 rounded-lg space-y-4">
                      <div className="flex items-center justify-between"><h4 className="font-medium text-slate-900">{editingId ? 'Edit Item' : 'Add Item'}</h4><button onClick={resetForm} className="p-1 hover:bg-slate-100 rounded"><X className="w-4 h-4 text-slate-500" /></button></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Description *</label><input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-slate-200" placeholder="Item description" /></div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Amount *</label><input type="number" value={formData.amount || ''} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} className="w-full h-10 px-3 rounded-lg border border-slate-200" /></div>
                      </div>
                      <div><label className="block text-sm font-medium text-slate-700 mb-1">Justification</label><textarea value={formData.justification} onChange={(e) => setFormData({ ...formData, justification: e.target.value })} className="w-full h-20 px-3 py-2 rounded-lg border border-slate-200 resize-none" placeholder="Brief justification" /></div>
                      <div className="flex justify-end gap-2"><button onClick={resetForm} className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button><button onClick={() => handleSave(category.id)} disabled={!formData.description || !formData.amount} className="px-3 py-1.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50">{editingId ? 'Update' : 'Add'}</button></div>
                    </div>
                  ) : <button onClick={() => setShowForm(category.id)} className="flex items-center gap-2 text-primary-500 hover:text-primary-600 font-medium"><Plus className="w-4 h-4" /> Add {category.label}</button>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="bg-slate-100 rounded-xl p-4 flex justify-between items-center"><span className="font-medium text-slate-900">Total Non-Personnel Direct Costs</span><span className="font-mono text-xl font-bold text-slate-900">{formatCurrency(totalDirectCosts)}</span></div>
      <div className="flex justify-between pt-4"><button onClick={onBack} className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Back</button><button onClick={onNext} className="px-8 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600">Continue to Indirect Costs</button></div>
    </div>
  );
}

function IndirectCostsStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { state, dispatch } = useBudget();
  const rule = GRANT_RULES[state.grantType];
  const totals = calculateBudgetTotals(state);
  const defaultIndirectRate = rule?.indirectRate ?? 0.50;
  const currentRate = state.customIndirectRate ?? defaultIndirectRate;

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-900">Indirect Costs (F&A)</h2><p className="text-slate-500 mt-1">Configure facilities and administrative cost rate</p></div>
      <div className="bg-primary-50 rounded-xl p-4 flex gap-3"><Info className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" /><div className="text-sm text-primary-900"><p className="font-medium">About Indirect Costs</p><p className="mt-1">Indirect costs (F&A) cover institutional overhead such as utilities, administrative support, and facility maintenance.</p></div></div>
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Indirect Cost Rate</label>
          <div className="flex items-center gap-4">
            <input type="range" min="0" max="100" value={currentRate * 100} onChange={(e) => dispatch({ type: 'SET_CUSTOM_RATES', payload: { indirectRate: parseFloat(e.target.value) / 100 } })} className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-500" />
            <div className="w-24"><input type="number" min="0" max="100" step="0.5" value={(currentRate * 100).toFixed(1)} onChange={(e) => dispatch({ type: 'SET_CUSTOM_RATES', payload: { indirectRate: parseFloat(e.target.value) / 100 } })} className="w-full h-12 px-3 rounded-lg border border-slate-200 text-right font-mono" /></div>
          </div>
          <p className="text-sm text-slate-500 mt-2">Default rate for {rule?.name || 'this grant'}: {(defaultIndirectRate * 100).toFixed(0)}%</p>
        </div>
        <div className="border-t border-slate-200 pt-6 space-y-3">
          <h4 className="font-medium text-slate-900">Calculation Summary</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-slate-600">Total Direct Costs</span><span className="font-mono text-slate-900">{formatCurrency(totals.totalDirectCosts)}</span></div>
            <div className="flex justify-between text-sm border-t border-slate-200 pt-2"><span className="text-slate-600">Indirect Cost Base</span><span className="font-mono font-medium text-slate-900">{formatCurrency(totals.indirectBase)}</span></div>
            <div className="flex justify-between text-lg border-t border-slate-200 pt-2"><span className="font-medium text-slate-900">Total Indirect Costs</span><span className="font-mono font-bold text-slate-900">{formatCurrency(totals.indirectCosts)}</span></div>
          </div>
        </div>
      </div>
      <div className="flex justify-between pt-4"><button onClick={onBack} className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Back</button><button onClick={onNext} className="px-8 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600">Review Budget</button></div>
    </div>
  );
}

function ReviewStep({ onBack }: { onBack: () => void }) {
  const { state } = useBudget();
  const rule = GRANT_RULES[state.grantType];
  const totals = calculateBudgetTotals(state);
  const issues = validateCompliance(state, totals);
  const errors = issues.filter(i => i.type === 'error');
  const warnings = issues.filter(i => i.type === 'warning');

  const exportJSON = () => {
    const data = { project: { title: state.projectTitle, grantType: state.grantType, grantName: rule?.fullName, duration: state.duration }, personnel: state.personnel, directCosts: state.directCosts, totals, compliance: { errors: errors.length, warnings: warnings.length, issues } };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${state.projectTitle.replace(/\s+/g, '_')}_budget.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const rows = [['Category', 'Description', 'Amount'], ['Personnel - Salaries', '', totals.personnelSalaries.toFixed(2)], ['Personnel - Fringe', '', totals.personnelFringe.toFixed(2)], ['Equipment', '', totals.equipment.toFixed(2)], ['Supplies', '', totals.supplies.toFixed(2)], ['Travel', '', totals.travel.toFixed(2)], ['Consultants', '', totals.consultants.toFixed(2)], ['Subcontracts', '', totals.subcontracts.toFixed(2)], ['Other Direct', '', totals.otherDirect.toFixed(2)], ['', 'Total Direct Costs', totals.totalDirectCosts.toFixed(2)], ['Indirect Costs (F&A)', '', totals.indirectCosts.toFixed(2)], ['', 'GRAND TOTAL', totals.totalBudget.toFixed(2)]];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${state.projectTitle.replace(/\s+/g, '_')}_budget.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-900">Budget Review</h2><p className="text-slate-500 mt-1">Review your budget and export documents</p></div>
      {issues.length > 0 ? (
        <div className="space-y-3">
          {errors.map((issue, i) => <div key={i} className="flex gap-3 p-4 bg-red-50 rounded-xl"><AlertCircle className="w-5 h-5 text-error flex-shrink-0" /><div><p className="font-medium text-error">{issue.category}</p><p className="text-sm text-red-800">{issue.message}</p></div></div>)}
          {warnings.map((issue, i) => <div key={i} className="flex gap-3 p-4 bg-amber-50 rounded-xl"><AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" /><div><p className="font-medium text-amber-800">{issue.category}</p><p className="text-sm text-amber-700">{issue.message}</p></div></div>)}
        </div>
      ) : <div className="flex gap-3 p-4 bg-green-50 rounded-xl"><CheckCircle className="w-5 h-5 text-success flex-shrink-0" /><div><p className="font-medium text-green-800">Budget Compliant</p><p className="text-sm text-green-700">No compliance issues detected</p></div></div>}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200"><h3 className="font-semibold text-slate-900">{state.projectTitle}</h3><p className="text-sm text-slate-500">{rule?.fullName} | {state.duration} months</p></div>
        <div className="divide-y divide-slate-200">
          <div className="px-6 py-3 flex justify-between"><span className="text-slate-600">Personnel - Salaries</span><span className="font-mono text-slate-900">{formatCurrency(totals.personnelSalaries)}</span></div>
          <div className="px-6 py-3 flex justify-between"><span className="text-slate-600">Personnel - Fringe Benefits</span><span className="font-mono text-slate-900">{formatCurrency(totals.personnelFringe)}</span></div>
          <div className="px-6 py-3 flex justify-between"><span className="text-slate-600">Equipment</span><span className="font-mono text-slate-900">{formatCurrency(totals.equipment)}</span></div>
          <div className="px-6 py-3 flex justify-between"><span className="text-slate-600">Supplies</span><span className="font-mono text-slate-900">{formatCurrency(totals.supplies)}</span></div>
          <div className="px-6 py-3 flex justify-between"><span className="text-slate-600">Travel</span><span className="font-mono text-slate-900">{formatCurrency(totals.travel)}</span></div>
          <div className="px-6 py-3 flex justify-between"><span className="text-slate-600">Consultants</span><span className="font-mono text-slate-900">{formatCurrency(totals.consultants)}</span></div>
          <div className="px-6 py-3 flex justify-between"><span className="text-slate-600">Subcontracts</span><span className="font-mono text-slate-900">{formatCurrency(totals.subcontracts)}</span></div>
          <div className="px-6 py-3 flex justify-between"><span className="text-slate-600">Other Direct Costs</span><span className="font-mono text-slate-900">{formatCurrency(totals.otherDirect)}</span></div>
          <div className="px-6 py-3 flex justify-between bg-slate-50"><span className="font-medium text-slate-900">Total Direct Costs</span><span className="font-mono font-medium text-slate-900">{formatCurrency(totals.totalDirectCosts)}</span></div>
          <div className="px-6 py-3 flex justify-between"><span className="text-slate-600">Indirect Costs (F&A)</span><span className="font-mono text-slate-900">{formatCurrency(totals.indirectCosts)}</span></div>
          <div className="px-6 py-4 flex justify-between bg-primary-50"><span className="font-bold text-primary-900">GRAND TOTAL</span><span className="font-mono text-xl font-bold text-primary-900">{formatCurrency(totals.totalBudget)}</span></div>
        </div>
      </div>
      {rule?.maxBudget && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex justify-between mb-2"><span className="text-sm text-slate-600">Budget Utilization</span><span className="text-sm font-medium text-slate-900">{formatCurrency(totals.totalBudget)} / {formatCurrency(rule.maxBudget)}</span></div>
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full transition-all ${totals.totalBudget > rule.maxBudget ? 'bg-error' : totals.totalBudget > rule.maxBudget * 0.95 ? 'bg-warning' : 'bg-success'}`} style={{ width: `${Math.min((totals.totalBudget / rule.maxBudget) * 100, 100)}%` }} /></div>
          <p className="text-sm text-slate-500 mt-2">{((totals.totalBudget / rule.maxBudget) * 100).toFixed(1)}% of maximum budget</p>
        </div>
      )}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Export Options</h3>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={exportJSON} className="flex flex-col items-center gap-2 p-4 border border-slate-200 rounded-xl hover:bg-slate-50"><Download className="w-6 h-6 text-primary-500" /><span className="font-medium text-slate-900">JSON</span><span className="text-xs text-slate-500">Full data export</span></button>
          <button onClick={exportCSV} className="flex flex-col items-center gap-2 p-4 border border-slate-200 rounded-xl hover:bg-slate-50"><Download className="w-6 h-6 text-primary-500" /><span className="font-medium text-slate-900">CSV</span><span className="text-xs text-slate-500">Spreadsheet format</span></button>
        </div>
      </div>
      <div className="flex justify-between pt-4"><button onClick={onBack} className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Back to Edit</button></div>
    </div>
  );
}

const STEPS = ['Setup', 'Personnel', 'Direct Costs', 'Indirect', 'Review'];

function BudgetWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const goNext = () => setCurrentStep(s => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setCurrentStep(s => Math.max(s - 1, 0));
  const goToStep = (step: number) => setCurrentStep(step);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-slate-600" /></Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center"><FileSpreadsheet className="w-5 h-5 text-white" /></div>
              <div><h1 className="font-bold text-slate-900">Grant Budget Tool</h1><p className="text-xs text-slate-500">Compliance-ready budget planning</p></div>
            </div>
          </div>
          <button onClick={() => window.location.reload()} className="text-sm text-slate-500 hover:text-slate-700">Start Over</button>
        </div>
      </header>
      <WizardStepper steps={STEPS} currentStep={currentStep} onStepClick={goToStep} />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {currentStep === 0 && <SetupStep onNext={goNext} />}
          {currentStep === 1 && <PersonnelStep onNext={goNext} onBack={goBack} />}
          {currentStep === 2 && <DirectCostsStep onNext={goNext} onBack={goBack} />}
          {currentStep === 3 && <IndirectCostsStep onNext={goNext} onBack={goBack} />}
          {currentStep === 4 && <ReviewStep onBack={goBack} />}
        </div>
      </main>
      <footer className="py-6 px-6"><div className="max-w-4xl mx-auto space-y-3"><div className="flex items-center justify-center gap-2 text-sm text-slate-600"><Clock className="w-4 h-4" /><span>Rules verified: {RULES_LAST_UPDATED}</span></div><p className="text-center text-xs text-slate-500">Grant Budget Tool - Supporting STTR, SBIR, DOD, NIH R01, NCI, and CPRIT grants</p></div></footer>
    </div>
  );
}

export default function BudgetPage() {
  return <BudgetProvider><BudgetWizard /></BudgetProvider>;
}
