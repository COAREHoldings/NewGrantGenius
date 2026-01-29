# Architecture-First Migration Guide

## Quick Start

### 1. Run Database Migrations

Execute these SQL files in order on your Supabase SQL Editor:

```sql
-- File: migrations/005_architecture_columns.sql
ALTER TABLE sections 
ADD COLUMN IF NOT EXISTS architecture_jsonb JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS dependency_map_jsonb JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS score_jsonb JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS risk_jsonb JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_sections_architecture ON sections USING GIN (architecture_jsonb);
```

```sql
-- File: migrations/006_phase7_to_10_tables.sql
-- Creates: reviewer_simulations, budgets, grant_opportunities, research_references
-- (Copy full contents from migrations/006_phase7_to_10_tables.sql)
```

### 2. Build & Deploy

```bash
cd coare-grant-master
pnpm install
pnpm build
# Deploy to Vercel
```

---

## What's New

### Phase 1: Architecture Tab
- New JSONB columns on `sections` table
- `<ArchitectureTab />` component for designing aims/hypotheses
- API: `PUT/GET /api/sections/[id]/architecture`

### Phase 2: Services Layer
All AI/validation logic extracted to `/src/services/`:
- `aiCritique.service.ts` - AI critique/rewrite
- `compliance.service.ts` - Section validation
- `structuralScoring.service.ts` - Score calculation
- `riskEngine.service.ts` - Risk analysis
- `dependencyGraph.service.ts` - Aim dependencies
- `exportGate.service.ts` - Export blocking

### Phase 3-5: Scoring & Risk
- `<ArchitectureSidebar />` displays scores + risks
- API: `POST /api/sections/[id]/score` calculates all metrics

### Phase 6-8: Export Gates
- Soft warnings (Phase 6) now active
- Hard blocking (Phase 8) via `exportGate.service.ts`
- Enable hard gates by passing `{ hardGateEnabled: true }`

### Phase 7: Reviewer V2
- New endpoint: `POST /api/reviewer-v2`
- 4 personas: Methodologist, Skeptic, Innovator, Clinician
- Uses architecture_jsonb for context-aware review

### Phase 9: Budget Builder
- `<BudgetBuilder />` component
- Multi-year budget with categories
- AI-generated justifications
- API: `GET/POST /api/budgets`, `POST /api/budgets/justify`

### Phase 10: Search Modules
- `<GrantSearch />` - Search & save grant opportunities
- `<ReferenceSearch />` - PubMed search + citation insertion
- APIs: `/api/references/*`, `/api/grants/*`

---

## Integration Examples

### Add Architecture Tab to Section Editor
```tsx
import ArchitectureTab from '@/components/ArchitectureTab';
import ArchitectureSidebar from '@/components/ArchitectureSidebar';

// In your section editor page:
<Tabs>
  <Tab label="Content">
    <SectionEditor ... />
  </Tab>
  <Tab label="Architecture">
    <ArchitectureTab sectionId={sectionId} applicationId={appId} />
  </Tab>
</Tabs>

// In sidebar:
<ArchitectureSidebar sectionId={sectionId} />
```

### Check Export Gate
```tsx
import { checkExportGate } from '@/services';

const result = checkExportGate(
  section.architectureJsonb,
  section.scoreJsonb,
  section.riskJsonb,
  section.dependencyMapJsonb,
  { hardGateEnabled: true }
);

if (!result.canExport) {
  // Show blockers
}
```

---

## Backward Compatibility

✅ All existing routes unchanged  
✅ All existing tables preserved  
✅ New columns have defaults  
✅ No breaking changes  
