'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, DollarSign, Save, FileText } from 'lucide-react';

interface BudgetItem {
  id: string;
  category: string;
  description: string;
  amount: number;
  justification: string;
}

interface BudgetYear {
  year: number;
  items: BudgetItem[];
}

interface BudgetBuilderProps {
  applicationId: number;
  projectYears?: number;
}

const BUDGET_CATEGORIES = [
  'Personnel - PI Salary',
  'Personnel - Co-I Salary',
  'Personnel - Postdoc',
  'Personnel - Graduate Student',
  'Personnel - Technician',
  'Personnel - Other',
  'Fringe Benefits',
  'Equipment',
  'Supplies - Lab',
  'Supplies - Office',
  'Travel - Domestic',
  'Travel - International',
  'Participant Support',
  'Other Direct Costs',
  'Consultant Services',
  'Subawards',
  'Tuition',
];

export default function BudgetBuilder({ applicationId, projectYears = 5 }: BudgetBuilderProps) {
  const [budgetYears, setBudgetYears] = useState<BudgetYear[]>([]);
  const [activeYear, setActiveYear] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Initialize budget years
    const years: BudgetYear[] = [];
    for (let i = 1; i <= projectYears; i++) {
      years.push({ year: i, items: [] });
    }
    setBudgetYears(years);
    loadBudget();
  }, [applicationId, projectYears]);

  const loadBudget = async () => {
    try {
      const res = await fetch(`/api/budgets?applicationId=${applicationId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.budgets?.length > 0) {
          // Group by year
          const grouped: Record<number, BudgetItem[]> = {};
          for (const item of data.budgets) {
            if (!grouped[item.fiscalYear]) grouped[item.fiscalYear] = [];
            grouped[item.fiscalYear].push({
              id: item.id.toString(),
              category: item.category,
              description: item.description || '',
              amount: item.amount,
              justification: item.justification || ''
            });
          }
          setBudgetYears(prev => prev.map(y => ({
            ...y,
            items: grouped[y.year] || []
          })));
        }
      }
    } catch (error) {
      console.error('Failed to load budget:', error);
    }
  };

  const addItem = () => {
    setBudgetYears(prev => prev.map(y => 
      y.year === activeYear 
        ? { ...y, items: [...y.items, { 
            id: crypto.randomUUID(), 
            category: BUDGET_CATEGORIES[0], 
            description: '', 
            amount: 0, 
            justification: '' 
          }]}
        : y
    ));
  };

  const updateItem = (itemId: string, field: keyof BudgetItem, value: string | number) => {
    setBudgetYears(prev => prev.map(y => 
      y.year === activeYear 
        ? { ...y, items: y.items.map(item => 
            item.id === itemId ? { ...item, [field]: value } : item
          )}
        : y
    ));
  };

  const removeItem = (itemId: string) => {
    setBudgetYears(prev => prev.map(y => 
      y.year === activeYear 
        ? { ...y, items: y.items.filter(item => item.id !== itemId) }
        : y
    ));
  };

  const copyToNextYear = () => {
    if (activeYear >= projectYears) return;
    const currentItems = budgetYears.find(y => y.year === activeYear)?.items || [];
    setBudgetYears(prev => prev.map(y => 
      y.year === activeYear + 1 
        ? { ...y, items: currentItems.map(item => ({ ...item, id: crypto.randomUUID() })) }
        : y
    ));
    setActiveYear(activeYear + 1);
  };

  const saveBudget = async () => {
    setSaving(true);
    try {
      const allItems = budgetYears.flatMap(y => 
        y.items.map(item => ({
          applicationId,
          fiscalYear: y.year,
          category: item.category,
          description: item.description,
          amount: item.amount,
          justification: item.justification
        }))
      );
      
      await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, items: allItems })
      });
    } catch (error) {
      console.error('Failed to save budget:', error);
    } finally {
      setSaving(false);
    }
  };

  const generateJustification = async (itemId: string) => {
    const item = budgetYears.find(y => y.year === activeYear)?.items.find(i => i.id === itemId);
    if (!item) return;

    try {
      const res = await fetch('/api/budgets/justify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: item.category, description: item.description, amount: item.amount })
      });
      if (res.ok) {
        const data = await res.json();
        updateItem(itemId, 'justification', data.justification);
      }
    } catch (error) {
      console.error('Failed to generate justification:', error);
    }
  };

  const currentYear = budgetYears.find(y => y.year === activeYear);
  const yearTotal = currentYear?.items.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
  const grandTotal = budgetYears.reduce((sum, y) => 
    sum + y.items.reduce((s, item) => s + (item.amount || 0), 0), 0
  );

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <DollarSign className="w-5 h-5" /> Budget Builder
        </h2>
        <button
          onClick={saveBudget}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Budget'}
        </button>
      </div>

      {/* Year Tabs */}
      <div className="flex gap-2 border-b">
        {budgetYears.map(y => (
          <button
            key={y.year}
            onClick={() => setActiveYear(y.year)}
            className={`px-4 py-2 font-medium ${
              activeYear === y.year 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Year {y.year}
          </button>
        ))}
      </div>

      {/* Budget Items */}
      <div className="space-y-3">
        {currentYear?.items.map((item, idx) => (
          <div key={item.id} className="bg-white border rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-4">
              <div className="flex-1 grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Category</label>
                  <select
                    value={item.category}
                    onChange={e => updateItem(item.id, 'category', e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                  >
                    {BUDGET_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Description</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={e => updateItem(item.id, 'description', e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                    placeholder="e.g., Dr. Smith (20% effort)"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    value={item.amount || ''}
                    onChange={e => updateItem(item.id, 'amount', parseInt(e.target.value) || 0)}
                    className="w-full p-2 border rounded text-sm"
                    placeholder="0"
                  />
                </div>
              </div>
              <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 mt-5">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-500">Justification</label>
                <button
                  onClick={() => generateJustification(item.id)}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" /> Generate
                </button>
              </div>
              <textarea
                value={item.justification}
                onChange={e => updateItem(item.id, 'justification', e.target.value)}
                className="w-full p-2 border rounded text-sm h-16 resize-none"
                placeholder="Explain why this cost is necessary..."
              />
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          <button
            onClick={addItem}
            className="flex items-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
          {activeYear < projectYears && (
            <button
              onClick={copyToNextYear}
              className="px-3 py-2 text-gray-600 hover:bg-gray-50 rounded text-sm"
            >
              Copy to Year {activeYear + 1}
            </button>
          )}
        </div>
      </div>

      {/* Totals */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Year {activeYear} Total:</span>
          <span className="font-semibold">${yearTotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between border-t pt-2">
          <span className="font-medium">Project Total ({projectYears} years):</span>
          <span className="font-bold text-lg">${grandTotal.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
