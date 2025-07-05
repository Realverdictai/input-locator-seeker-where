import { useState } from 'react';
import { generateValuation } from '@/utils/generateValuation';

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

  const handleInputChange = (name: string, value: string) => {
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

  const getRiskLevel = (risk: number) => {
    if (risk > 85) return { label: 'CRITICAL', color: '#dc2626', bgColor: '#fef2f2' };
    if (risk > 60) return { label: 'HIGH', color: '#ea580c', bgColor: '#fff7ed' };
    if (risk > 30) return { label: 'MODERATE', color: '#ca8a04', bgColor: '#fefce8' };
    return { label: 'LOW', color: '#16a34a', bgColor: '#f0fdf4' };
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '10px' }}>
          ⚖️ Verdict AI Case Evaluator
        </h1>
        <div style={{ 
          display: 'inline-block', 
          padding: '8px 16px', 
          backgroundColor: '#e3f2fd', 
          color: '#1976d2', 
          border: '1px solid #bbdefb', 
          borderRadius: '6px',
          fontSize: '14px'
        }}>
          Using Linear Model Analysis of 313 Real Settlement Cases
        </div>
      </div>

      <div style={{ 
        backgroundColor: 'white', 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '20px', 
        marginBottom: '30px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#2c3e50' }}>
          Case Information
        </h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Enter case details for data-driven settlement analysis
        </p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>Venue</label>
              <input
                type="text"
                value={formData.Venue}
                onChange={(e) => handleInputChange('Venue', e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>Accident Type</label>
              <input
                type="text"
                value={formData.AccType}
                onChange={(e) => handleInputChange('AccType', e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>Surgery (or "None")</label>
              <input
                type="text"
                value={formData.Surgery}
                onChange={(e) => handleInputChange('Surgery', e.target.value)}
                placeholder="None"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>Liability % (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.LiabPct}
                onChange={(e) => handleInputChange('LiabPct', e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>Injuries</label>
              <textarea
                value={formData.Injuries}
                onChange={(e) => handleInputChange('Injuries', e.target.value)}
                rows={3}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>Medical Specials ($)</label>
              <input
                type="number"
                value={formData.medicalSpecials}
                onChange={(e) => handleInputChange('medicalSpecials', e.target.value)}
                placeholder="150000"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>Howell Specials ($)</label>
              <input
                type="number"
                value={formData.howellSpecials}
                onChange={(e) => handleInputChange('howellSpecials', e.target.value)}
                placeholder="125000"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>Surgery Type</label>
              <input
                type="text"
                value={formData.surgeryType}
                onChange={(e) => handleInputChange('surgeryType', e.target.value)}
                placeholder="e.g., ACDF, Lumbar Fusion"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>Number of Surgeries</label>
              <input
                type="number"
                min="0"
                value={formData.surgeries}
                onChange={(e) => handleInputChange('surgeries', e.target.value)}
                placeholder="1"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>Injection Type</label>
              <input
                type="text"
                value={formData.injectionType}
                onChange={(e) => handleInputChange('injectionType', e.target.value)}
                placeholder="e.g., Epidural Steroid"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>Number of Injections</label>
              <input
                type="number"
                min="0"
                value={formData.injections}
                onChange={(e) => handleInputChange('injections', e.target.value)}
                placeholder="3"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>TBI Severity</label>
              <select
                value={formData.tbiSeverity}
                onChange={(e) => handleInputChange('tbiSeverity', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              >
                <option value="">Select TBI severity</option>
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                Defense perspective: Mild=minor symptoms, Severe=significant ongoing symptoms
              </p>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>Policy Limits ($)</label>
              <input
                type="text"
                value={formData.PolLim}
                onChange={(e) => handleInputChange('PolLim', e.target.value)}
                placeholder="$250,000"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '15px 30px',
              backgroundColor: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? 'Analyzing Case...' : 'Evaluate Case'}
          </button>
        </form>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626' }}>
            <span>⚠️</span>
            <p style={{ fontWeight: 'bold', margin: 0 }}>{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Main Settlement Result */}
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '24px',
            textAlign: 'center'
          }}>
            <h2 style={{ fontSize: '28px', color: '#15803d', marginBottom: '12px', fontWeight: 'bold' }}>
              ⚖️ Settlement Analysis: {result.proposal}
            </h2>
            <p style={{ fontSize: '16px', color: '#374151', marginBottom: '16px' }}>
              {result.rationale}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '14px', color: '#6b7280' }}>
              <span>Case #{result.sourceCaseID}</span>
              <span>•</span>
              <span style={{ color: '#dc2626', fontWeight: 'bold' }}>Expires: {result.expiresOn}</span>
            </div>
          </div>

          {/* Policy Exceedance Risk Analysis */}
          {result.policyExceedanceRisk !== undefined && result.policyLimit && result.policyLimit > 0 && (
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '20px',
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#1f2937'
              }}>
                {result.policyExceedanceRisk > 60 ? '🚨' : result.policyExceedanceRisk > 30 ? '⚠️' : '✅'}
                Policy Limit Analysis
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '16px',
                marginBottom: '20px'
              }}>
                <div>
                  <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Policy Limit:</span>
                  <p style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>${result.policyLimit.toLocaleString()}</p>
                </div>
                <div>
                  <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Settlement:</span>
                  <p style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{result.proposal}</p>
                </div>
                <div>
                  <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Coverage Ratio:</span>
                  <p style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
                    {((result.settlementAmount || 0) / result.policyLimit * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Exceedance Risk</span>
                  <div style={{
                    padding: '4px 8px',
                    backgroundColor: getRiskLevel(result.policyExceedanceRisk).bgColor,
                    color: getRiskLevel(result.policyExceedanceRisk).color,
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {getRiskLevel(result.policyExceedanceRisk).label} RISK
                  </div>
                </div>
                <div style={{
                  width: '100%',
                  height: '12px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '6px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${result.policyExceedanceRisk}%`,
                    height: '100%',
                    backgroundColor: getRiskLevel(result.policyExceedanceRisk).color,
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280', marginTop: '4px', margin: 0 }}>
                  {result.policyExceedanceRisk}% chance of exceeding policy limits
                </p>
              </div>

              <div style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px'
              }}>
                <p style={{ fontSize: '14px', margin: 0 }}>
                  <span style={{ fontWeight: 'bold' }}>Risk Assessment:</span>{' '}
                  {result.policyExceedanceRisk > 85 ? 'CRITICAL - Settlement likely exceeds policy limits. Significant excess exposure risk.' :
                   result.policyExceedanceRisk > 60 ? 'HIGH RISK - Settlement approaching policy limits. Monitor for excess exposure.' :
                   result.policyExceedanceRisk > 30 ? 'MODERATE RISK - Settlement within reasonable range of policy limits.' :
                   'LOW RISK - Settlement well within policy limits.'}
                </p>
              </div>
            </div>
          )}

          {/* Value Factors Analysis */}
          {result.valueFactors && (
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
                Settlement Factor Analysis
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                {result.valueFactors.increasing.length > 0 && (
                  <div>
                    <h4 style={{ fontWeight: 'bold', color: '#059669', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      📈 Value Increasing Factors
                    </h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {result.valueFactors.increasing.map((factor, index) => (
                        <li key={index} style={{
                          fontSize: '14px',
                          color: '#065f46',
                          paddingLeft: '8px',
                          borderLeft: '2px solid #34d399',
                          marginBottom: '4px'
                        }}>
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.valueFactors.decreasing.length > 0 && (
                  <div>
                    <h4 style={{ fontWeight: 'bold', color: '#dc2626', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      📉 Value Decreasing Factors
                    </h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {result.valueFactors.decreasing.map((factor, index) => (
                        <li key={index} style={{
                          fontSize: '14px',
                          color: '#991b1b',
                          paddingLeft: '8px',
                          borderLeft: '2px solid #f87171',
                          marginBottom: '4px'
                        }}>
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comparable Cases */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>Comparable Cases</h3>
              <button
                onClick={() => setShowComparables(!showComparables)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {showComparables ? 'Hide' : 'Show'} Similar Cases
              </button>
            </div>
            {showComparables && result.comparableCases && result.comparableCases.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e5e7eb', fontWeight: 'bold' }}>
                        Case ID
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e5e7eb', fontWeight: 'bold' }}>
                        Settlement Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.comparableCases.map((caseItem, index) => (
                      <tr key={caseItem.case_id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>
                          {caseItem.case_id}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontWeight: 'bold' }}>
                          ${caseItem.settlement_amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseEvaluator;