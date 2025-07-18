# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/9ac7ec86-72e6-45d0-b5cc-099fe2e5fee1

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/9ac7ec86-72e6-45d0-b5cc-099fe2e5fee1) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/9ac7ec86-72e6-45d0-b5cc-099fe2e5fee1) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Case Valuation System

This application includes an advanced case valuation system with customizable weights for different medical procedures and treatments.

### Adjusting Surgery and Treatment Values

To adjust how much specific medical procedures add to case valuations, edit the `src/valuation/weights.json` file:

- **Surgery weights**: Adjust values for fusion, arthroscopy, rotator cuff repair, ACL repair, and disc replacement surgeries
- **Injection values**: Modify the default injection value that applies to all injection treatments
- **TBI weights**: Set compensation amounts for different levels of traumatic brain injury (None, Mild, Moderate, Severe)

After making changes to the weights file, redeploy the application for the changes to take effect.

### Testing the Valuation System

To test case valuations with different approaches:

```bash
# Test traditional evaluator with weights enabled (default)
IGNORE_WEIGHTS=false ts-node scripts/testOneCase.ts

# Test traditional evaluator with weights disabled (regression only)
IGNORE_WEIGHTS=true ts-node scripts/testOneCase.ts

# Test AI-first evaluator with smart deductions
ts-node scripts/testAIEvaluator.ts

# Test AI-first evaluator with weights disabled
IGNORE_WEIGHTS=true ts-node scripts/testAIEvaluator.ts
```

### AI-First Evaluation System

The application now includes an advanced AI-first case evaluation system with:

- **Enhanced Feature Extraction**: 16 key factors including surgery complexity, treatment gaps, venue economics, and risk flags
- **Smart Deduction Engine**: Automatic deductions for subsequent accidents, treatment gaps, pre-existing conditions, non-compliance, and conflicting medical opinions
- **Ridge Regression Model**: Uses top-K similar cases for more accurate predictions
- **Confidence Scoring**: Provides reliability metrics for each evaluation
- **Transparent Deductions**: Shows exactly what factors reduced the evaluation and by how much

To adjust deduction percentages or add new risk factors, edit the deduction engine in `src/valuation/deductionEngine.ts`.

## Document Upload and Case Categories

- Plaintiff and insurance/defense users can optionally upload case documents at the start of the wizard.
- Uploaded text is parsed and used to prefill fields and provide context for AI evaluation.
- Case types are organized into categories with relevant sub-categories (e.g. `Auto Accident` > `T-Bone/Broadside`).
- The evaluation engine uses the uploaded narrative when calling `calcEvaluatorAI`.

### Refreshing Case Data

After importing new cases into the `cases_master` table, run the refresh script to normalize the data and create embeddings:

```bash
SUPABASE_SERVICE_ROLE_KEY=<service_key> OPENAI_API_KEY=<openai_key> \
  ts-node scripts/refreshCaseData.ts
```

This populates missing numeric fields and embeddings so the AI evaluators include your latest cases.

## Multi-Doc AI & Clarify Loop
1. Deploy the new edge functions in `supabase/functions`.
2. Run the latest SQL migration to create `uploaded_docs` and policies.
3. The Document Upload wizard step lets you drop PDFs or DOCX files which are sent to `/api/uploadDocs`.
4. If "Ask any follow-up questions" is selected, the app calls `/api/getClarifyQuestion` until it returns `NO_MORE_QUESTIONS`. Answers are saved via `/api/clarifyAnswer`.
5. `evaluateCase()` automatically uses the uploaded docs during valuation.

### Offline Mode

If your environment doesn't have database access, set `OFFLINE_MODE=true` before running tests. This forces the evaluator to use the built-in traditional valuation logic.

### Settlement Strategy Analysis

AI evaluations compare your settlement expectations to the AI settlement range. Results include color-coded guidance on plaintiff and defense alignment plus recommendations.

Use this analysis to refine your negotiation strategy.
