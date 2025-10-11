# Snapshot PI v1 - Project Backup

**Created:** December 2025  
**Purpose:** Read-only safety snapshot of all PI-related routes, components, and server functions

## Overview
This snapshot preserves the complete state of the Personal Injury case evaluation system before any major changes. All files have been duplicated with a `_v1` suffix for safety and reference purposes.

## Duplicated Components

### Pages (src/pages/)
- `Index_v1.tsx` - Main application page with authentication and case evaluation
- `Admin_v1.tsx` - Admin dashboard for CSV imports

### Core Components (src/components/)
- `AIMediator_v1.tsx` - AI-powered mediation advice component
- `AdminCsvImporter_v1.tsx` - CSV data import functionality
- `AuthForm_v1.tsx` - User authentication form
- `CaseEvaluator_v1.tsx` - Legacy case evaluation interface
- `CaseEvaluatorAI_v1.tsx` - AI-enhanced case evaluator
- `CaseInputForm_v1.tsx` - Case data input form
- `ClarifyModal_v1.tsx` - Clarification question modal
- `ConfidenceWarning_v1.tsx` - Confidence level warnings
- `FileDropZone_v1.tsx` - File upload drag-and-drop zone
- `FormWizard_v1.tsx` - Multi-step form wizard
- `ManualOverride_v1.tsx` - Manual case value override
- `MediationDashboard_v1.tsx` - Mediation session management
- `MediatorProposal_v1.tsx` - Mediation proposal display
- `VerdictResults_v1.tsx` - Verdict and settlement results
- `VerdictResultsAI_v1.tsx` - AI-enhanced verdict results

### Edge Functions (supabase/functions/)
- `clarify-answer_v1/` - Stores clarification answers
- `enhanced-case-matching_v1/` - Enhanced AI case matching
- `find-similar-cases_v1/` - Vector similarity search
- `get-clarify-question_v1/` - Generates clarification questions
- `get-mediator-advice_v1/` - Provides AI mediation advice
- `send-mediation-proposal_v1/` - Sends mediation proposals via email
- `send-welcome-email_v1/` - Welcome email webhook
- `upload-docs_v1/` - Document upload and processing

### Type Definitions (src/types/)
- `auth_v1.ts` - Authentication and user types
- `mediation_v1.ts` - Mediation session types
- `verdict_v1.ts` - Case data and verdict types

### Library Functions (src/lib/)
- `damageAnalyzer_v1.ts` - Damage assessment from media
- `documentParser_v1.ts` - PDF/DOCX parsing
- `verdictCalculator_v1.ts` - Verdict calculation logic

### Hooks (src/hooks/)
- `useAuth_v1.tsx` - Authentication hook
- `useCsvImport_v1.ts` - CSV import hook

### Valuation Engine (src/valuation/)
- `calcEvaluator_v1.ts` - Traditional evaluator calculation
- `calcEvaluatorAI_v1.ts` - AI-enhanced evaluator
- `calcMediator_v1.ts` - Mediator proposal calculation
- `deductionEngine_v1.ts` - Smart deduction logic
- `evaluateCase_v1.ts` - Main case evaluation
- `featureExtractor_v1.ts` - Feature extraction from cases
- `findNearest_v1.ts` - Nearest neighbor search
- `fitLocalModel_v1.ts` - Local regression model
- `getComparables_v1.ts` - Comparable case retrieval
- `getEmbeddings_v1.ts` - Vector embeddings generation
- `ridgeRegression_v1.ts` - Ridge regression implementation
- `testHarness_v1.ts` - Testing framework
- `traditionalValuation_v1.ts` - Traditional valuation methods
- `weights_v1.ts` - Feature weights

### AI & Integration (src/)
- `ai/docSearch_v1.ts` - Document search functionality
- `utils/generateValuation_v1.ts` - Valuation generation
- `integrations/supabase/findComparables_v1.ts` - Find comparable cases
- `integrations/supabase/getEnhancedSettlement_v1.ts` - Enhanced settlement data
- `integrations/supabase/getSingleSettlement_v1.ts` - Single settlement retrieval
- `integrations/supabase/getWeights_v1.ts` - Weight retrieval

## Important Notes

1. **No Import Changes**: All original files remain unchanged with their existing imports
2. **No Routing Changes**: No routes were modified - all live routes point to original files
3. **Database Unchanged**: Database schema and data remain as-is
4. **UI Unchanged**: No visual or functional changes to the live application

## Usage

These `_v1` files serve as a reference and backup:
- Review previous implementations
- Restore specific functionality if needed
- Compare changes between versions
- Emergency rollback reference

## Restoration

To restore any component, simply:
1. Copy the relevant `_v1` file
2. Remove the `_v1` suffix
3. Replace the current live file

**⚠️ Warning:** Do not import from `_v1` files in live code. They are reference copies only.

---

*This snapshot was created automatically as a safety measure before implementing major changes to the PI system.*
