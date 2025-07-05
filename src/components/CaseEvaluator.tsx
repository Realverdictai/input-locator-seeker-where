import { useState } from 'react';
import { generateValuation } from '@/utils/generateValuation';
import { findComparables } from '@/integrations/supabase/findComparables';

interface FormData {
  Venue: string;
  Surgery: string;
  Injuries: string;
  LiabPct: string;
  AccType: string;
  PolLim: string;
  medicalSpecials?: string;
  howellSpecials?: string;
  surgeryType?: string;
  injectionType?: string;
  surgeries?: string;
  injections?: string;
  tbiSeverity?: string;
}

interface ValuationResult {
  proposal: string;
  rationale: string;
  sourceCaseID: number;
  expiresOn: string;
  confidence?: number;
  valueFactors?: {
    increasing: string[];  
    decreasing: string[];
  };
  comparableCases?: Array<{
    case_id: number;
    settlement_amount: number;
    similarity_reason: string;
  }>;
  settlementRange?: {
    low: number;
    high: number;
  };
  policyExceedanceRisk?: number;
  policyLimit?: number;
  settlementAmount?: number;
}

interface ComparableCase {
  CaseID: number;
  Settle: string;
}

const CaseEvaluator = () => {
  const [formData, setFormData] = useState<FormData>({
    Venue: '',
    Surgery: '',
    Injuries: '',
    LiabPct: '',
    AccType: '',
    PolLim: '',
    medicalSpecials: '',
    howellSpecials: '',
    surgeryType: '',
    injectionType: '',
    surgeries: '',
    injections: '',
    tbiSeverity: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [comparableCases, setComparableCases] = useState<ComparableCase[]>([]);
  const [showComparables, setShowComparables] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setComparableCases([]);

    try {
      // Call data-driven valuation using database patterns
      const valuation = await generateValuation({
        Venue: formData.Venue,
        Surgery: formData.Surgery,
        Injuries: formData.Injuries,
        LiabPct: formData.LiabPct,
        AccType: formData.AccType,
        PolLim: formData.PolLim,
        medicalSpecials: formData.medicalSpecials ? parseInt(formData.medicalSpecials) : undefined,
        howellSpecials: formData.howellSpecials ? parseInt(formData.howellSpecials) : undefined,
        tbiSeverity: formData.tbiSeverity,
        surgeryType: formData.surgeryType,
        injectionType: formData.injectionType,
        surgeries: formData.surgeries ? parseInt(formData.surgeries) : undefined,
        injections: formData.injections ? parseInt(formData.injections) : undefined
      });
      
      // Set results - use AI comparable cases, not separate findComparables call
      setResult(valuation);
      
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-pro section-spacing">
      <h1 className="display-heading text-center mb-8">⚖️ Data-Driven Case Evaluator</h1>
      <div className="professional-card p-6 text-center mb-8 bg-primary/5 border-primary/20">
        <p className="text-primary font-semibold">
          Using Linear Model Analysis of 313 Real Settlement Cases
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="professional-card p-8 mb-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Venue:
            </label>
            <input
              type="text"
              name="Venue"
              value={formData.Venue}
              onChange={handleInputChange}
              className="premium-input w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Surgery (or "None"):
            </label>
            <input
              type="text"
              name="Surgery"
              value={formData.Surgery}
              onChange={handleInputChange}
              placeholder="None"
              className="premium-input w-full"
              required
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-foreground">
              Injuries:
            </label>
            <textarea
              name="Injuries"
              value={formData.Injuries}
              onChange={handleInputChange}
              rows={3}
              className="premium-input w-full resize-y"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Liability % (0-100):
            </label>
            <input
              type="number"
              name="LiabPct"
              value={formData.LiabPct}
              onChange={handleInputChange}
              min="0"
              max="100"
              className="premium-input w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Accident Type:
            </label>
            <input
              type="text"
              name="AccType"
              value={formData.AccType}
              onChange={handleInputChange}
              className="premium-input w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Medical Specials ($) - Optional:
            </label>
            <input
              type="number"
              name="medicalSpecials"
              value={formData.medicalSpecials}
              onChange={handleInputChange}
              placeholder="150000"
              className="premium-input w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Howell (post-contracted) Specials ($) - Optional:
            </label>
            <input
              type="number"
              name="howellSpecials"
              value={formData.howellSpecials}
              onChange={handleInputChange}
              placeholder="125000"
              className="premium-input w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Surgery Type - Optional:
            </label>
            <input
              type="text"
              name="surgeryType"
              value={formData.surgeryType}
              onChange={handleInputChange}
              placeholder="e.g., ACDF, Lumbar Fusion"
              className="premium-input w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Number of Surgeries - Optional:
            </label>
            <input
              type="number"
              name="surgeries"
              value={formData.surgeries}
              onChange={handleInputChange}
              placeholder="1"
              min="0"
              className="premium-input w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Injection Type - Optional:
            </label>
            <input
              type="text"
              name="injectionType"
              value={formData.injectionType}
              onChange={handleInputChange}
              placeholder="e.g., Epidural Steroid, Facet Joint"
              className="premium-input w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Number of Injections - Optional:
            </label>
            <input
              type="number"
              name="injections"
              value={formData.injections}
              onChange={handleInputChange}
              placeholder="3"
              min="0"
              className="premium-input w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              TBI Severity - Optional:
            </label>
            <select
              name="tbiSeverity"
              value={formData.tbiSeverity}
              onChange={handleInputChange}
              className="premium-select w-full"
            >
              <option value="">Select TBI severity</option>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
            <small className="text-muted-foreground text-xs">
              Defense perspective: Mild=minor symptoms, Severe=significant ongoing symptoms
            </small>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Policy Limits ($):
            </label>
            <input
              type="text"
              name="PolLim"
              value={formData.PolLim}
              onChange={handleInputChange}
              placeholder="$250,000"
              className="premium-input w-full"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`premium-button w-full mt-8 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Loading...' : 'Evaluate Case'}
        </button>
      </form>

      {error && (
        <div className="professional-card p-4 mb-6 bg-destructive/10 border-destructive/20">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="professional-card p-8 text-center bg-success/5 border-success/20">
            <h2 className="section-heading text-success mb-4">
              ⚖️ Data-Driven Settlement Analysis: {result.proposal}
            </h2>
            <p className="body-large text-muted-foreground mb-4">
              {result.rationale}
            </p>
            <p className="text-sm text-muted-foreground italic mb-4">
              (from Case #{result.sourceCaseID})
            </p>
            <p className="text-base font-semibold text-destructive">
              Open for acceptance until {result.expiresOn}
            </p>
          </div>

          {/* Policy Exceedance Risk Indicator */}
          {result.policyExceedanceRisk !== undefined && result.policyLimit && result.policyLimit > 0 && (
            <div className={`professional-card p-6 ${
              result.policyExceedanceRisk > 60 ? 'bg-destructive/5 border-destructive/20' : 
              result.policyExceedanceRisk > 30 ? 'bg-warning/5 border-warning/20' : 
              'bg-success/5 border-success/20'
            }`}>
              <h3 className={`card-heading flex items-center gap-2 ${
                result.policyExceedanceRisk > 60 ? 'text-destructive' : 
                result.policyExceedanceRisk > 30 ? 'text-warning' : 
                'text-success'
              }`}>
                {result.policyExceedanceRisk > 60 ? '🚨' : result.policyExceedanceRisk > 30 ? '⚠️' : '✅'} Policy Limit Analysis
              </h3>
              
              <div className="space-y-3">
                <div className="text-sm">
                  <span className="font-semibold">Policy Limit:</span> ${result.policyLimit.toLocaleString()}
                </div>
                
                <div className="text-sm">
                  <span className="font-semibold">Settlement Recommendation:</span> {result.proposal}
                </div>
                
                <div className="text-sm">
                  <span className="font-semibold">Coverage Ratio:</span> {((result.settlementAmount || 0) / result.policyLimit * 100).toFixed(1)}% of policy limits
                </div>
                
                <div className="professional-card p-4 bg-background/70">
                  <div className="text-sm">
                    <span className="font-semibold">Risk Assessment:</span> {
                      result.policyExceedanceRisk > 85 ? 'CRITICAL - Settlement likely exceeds policy limits. Significant excess exposure risk.' :
                      result.policyExceedanceRisk > 60 ? 'HIGH RISK - Settlement approaching policy limits. Monitor for excess exposure.' :
                      result.policyExceedanceRisk > 30 ? 'MODERATE RISK - Settlement within reasonable range of policy limits.' :
                      'LOW RISK - Settlement well within policy limits.'
                    }
                  </div>
                </div>
                
                {/* Visual risk meter */}
                <div>
                  <div className="text-xs font-semibold mb-2">
                    Exceedance Risk: {result.policyExceedanceRisk}%
                  </div>
                  <div className="w-full h-5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        result.policyExceedanceRisk > 60 ? 'bg-gradient-to-r from-destructive/80 to-destructive' : 
                        result.policyExceedanceRisk > 30 ? 'bg-gradient-to-r from-warning/80 to-warning' : 
                        'bg-gradient-to-r from-success/80 to-success'
                      }`}
                      style={{ width: `${Math.min(result.policyExceedanceRisk, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {result.valueFactors && (
            <div className="professional-card p-6">
              <h3 className="card-heading text-muted-foreground mb-4">Settlement Analysis:</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {result.valueFactors.increasing.length > 0 && (
                  <div>
                    <h4 className="text-success font-semibold mb-3 flex items-center gap-2">
                      📈 Factors Increasing Value:
                    </h4>
                    <ul className="space-y-2 pl-4">
                      {result.valueFactors.increasing.map((factor, index) => (
                        <li key={index} className="text-success text-sm">{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.valueFactors.decreasing.length > 0 && (
                  <div>
                    <h4 className="text-destructive font-semibold mb-3 flex items-center gap-2">
                      📉 Factors Decreasing Value:
                    </h4>
                    <ul className="space-y-2 pl-4">
                      {result.valueFactors.decreasing.map((factor, index) => (
                        <li key={index} className="text-destructive text-sm">{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="text-center">
            <button
              onClick={() => setShowComparables(!showComparables)}
              className="premium-button"
            >
              {showComparables ? 'Hide' : 'Show'} Similar Cases
            </button>
          </div>

          {showComparables && result.comparableCases && result.comparableCases.length > 0 && (
            <div className="professional-card p-6">
              <h3 className="card-heading mb-4">Comparable Cases:</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="p-3 text-left border border-border font-semibold text-foreground">
                        Case ID
                      </th>
                      <th className="p-3 text-left border border-border font-semibold text-foreground">
                        Settlement Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.comparableCases.map((caseItem, index) => (
                      <tr key={caseItem.case_id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                        <td className="p-3 border border-border text-foreground">
                          {caseItem.case_id}
                        </td>
                        <td className="p-3 border border-border text-foreground">
                          ${caseItem.settlement_amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CaseEvaluator;