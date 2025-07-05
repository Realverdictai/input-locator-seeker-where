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
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>⚖️ Data-Driven Case Evaluator</h1>
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '20px',
        padding: '10px',
        backgroundColor: '#e7f3ff',
        border: '1px solid #007bff',
        borderRadius: '4px'
      }}>
        <p style={{ margin: 0, color: '#0066cc', fontWeight: 'bold' }}>
          Using Linear Model Analysis of 313 Real Settlement Cases
        </p>
      </div>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Venue:
            <input
              type="text"
              name="Venue"
              value={formData.Venue}
              onChange={handleInputChange}
              style={{ 
                width: '100%', 
                padding: '8px', 
                marginTop: '5px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
              required
            />
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Surgery (or "None"):
            <input
              type="text"
              name="Surgery"
              value={formData.Surgery}
              onChange={handleInputChange}
              placeholder="None"
              style={{ 
                width: '100%', 
                padding: '8px', 
                marginTop: '5px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
              required
            />
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Injuries:
            <textarea
              name="Injuries"
              value={formData.Injuries}
              onChange={handleInputChange}
              rows={3}
              style={{ 
                width: '100%', 
                padding: '8px', 
                marginTop: '5px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                resize: 'vertical'
              }}
              required
            />
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Liability % (0-100):
            <input
              type="number"
              name="LiabPct"
              value={formData.LiabPct}
              onChange={handleInputChange}
              min="0"
              max="100"
              style={{ 
                width: '100%', 
                padding: '8px', 
                marginTop: '5px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
              required
            />
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Accident Type:
            <input
              type="text"
              name="AccType"
              value={formData.AccType}
              onChange={handleInputChange}
              style={{ 
                width: '100%', 
                padding: '8px', 
                marginTop: '5px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
              required
            />
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Medical Specials ($) - Optional:
            <input
              type="number"
              name="medicalSpecials"
              value={formData.medicalSpecials}
              onChange={handleInputChange}
              placeholder="150000"
              style={{ 
                width: '100%', 
                padding: '8px', 
                marginTop: '5px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Howell (post-contracted) Specials ($) - Optional:
            <input
              type="number"
              name="howellSpecials"
              value={formData.howellSpecials}
              onChange={handleInputChange}
              placeholder="125000"
              style={{ 
                width: '100%', 
                padding: '8px', 
                marginTop: '5px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Surgery Type - Optional:
            <input
              type="text"
              name="surgeryType"
              value={formData.surgeryType}
              onChange={handleInputChange}
              placeholder="e.g., ACDF, Lumbar Fusion"
              style={{ 
                width: '100%', 
                padding: '8px', 
                marginTop: '5px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Number of Surgeries - Optional:
            <input
              type="number"
              name="surgeries"
              value={formData.surgeries}
              onChange={handleInputChange}
              placeholder="1"
              min="0"
              style={{ 
                width: '100%', 
                padding: '8px', 
                marginTop: '5px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Injection Type - Optional:
            <input
              type="text"
              name="injectionType"
              value={formData.injectionType}
              onChange={handleInputChange}
              placeholder="e.g., Epidural Steroid, Facet Joint"
              style={{ 
                width: '100%', 
                padding: '8px', 
                marginTop: '5px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Number of Injections - Optional:
            <input
              type="number"
              name="injections"
              value={formData.injections}
              onChange={handleInputChange}
              placeholder="3"
              min="0"
              style={{ 
                width: '100%', 
                padding: '8px', 
                marginTop: '5px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            TBI Severity - Optional:
            <select
              name="tbiSeverity"
              value={formData.tbiSeverity}
              onChange={handleInputChange}
              style={{ 
                width: '100%', 
                padding: '8px', 
                marginTop: '5px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value="">Select TBI severity</option>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </label>
          <small style={{ color: '#666', fontSize: '0.8em' }}>
            Defense perspective: Mild=minor symptoms, Severe=significant ongoing symptoms
          </small>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Policy Limits ($):
            <input
              type="text"
              name="PolLim"
              value={formData.PolLim}
              onChange={handleInputChange}
              placeholder="$250,000"
              style={{ 
                width: '100%', 
                padding: '8px', 
                marginTop: '5px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
              required
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Loading...' : 'Evaluate Case'}
        </button>
      </form>

      {error && (
        <div style={{ 
          color: 'red', 
          padding: '10px', 
          backgroundColor: '#ffe6e6', 
          border: '1px solid #ff9999',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '30px' }}>
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '20px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '8px'
          }}>
            <h2 style={{ 
              fontSize: '2em', 
              fontWeight: 'bold', 
              margin: '0 0 10px 0',
              color: '#28a745'
            }}>
              ⚖️ Data-Driven Settlement Analysis: {result.proposal}
            </h2>
            <p style={{ 
              fontSize: '1.1em', 
              margin: '10px 0',
              color: '#6c757d',
              lineHeight: '1.4'
            }}>
              {result.rationale}
            </p>
            <p style={{ 
              fontSize: '0.9em', 
              margin: '10px 0',
              color: '#666',
              fontStyle: 'italic'
            }}>
              (from Case #{result.sourceCaseID})
            </p>
            <p style={{ 
              fontSize: '1em', 
              margin: '0',
              color: '#dc3545',
              fontWeight: 'bold'
            }}>
              Open for acceptance until {result.expiresOn}
            </p>
          </div>

          {/* Policy Exceedance Risk Indicator */}
          {result.policyExceedanceRisk !== undefined && result.policyLimit && result.policyLimit > 0 && (
            <div style={{ 
              marginTop: '20px',
              padding: '15px',
              backgroundColor: result.policyExceedanceRisk > 60 ? '#fff5f5' : result.policyExceedanceRisk > 30 ? '#fffbf0' : '#f0fff4',
              border: `2px solid ${result.policyExceedanceRisk > 60 ? '#e53e3e' : result.policyExceedanceRisk > 30 ? '#dd6b20' : '#38a169'}`,
              borderRadius: '8px'
            }}>
              <h3 style={{ 
                marginBottom: '10px', 
                color: result.policyExceedanceRisk > 60 ? '#e53e3e' : result.policyExceedanceRisk > 30 ? '#dd6b20' : '#38a169',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {result.policyExceedanceRisk > 60 ? '🚨' : result.policyExceedanceRisk > 30 ? '⚠️' : '✅'} Policy Limit Analysis
              </h3>
              
              <div style={{ marginBottom: '10px' }}>
                <strong>Policy Limit:</strong> ${result.policyLimit.toLocaleString()}
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <strong>Settlement Recommendation:</strong> {result.proposal}
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <strong>Coverage Ratio:</strong> {((result.settlementAmount || 0) / result.policyLimit * 100).toFixed(1)}% of policy limits
              </div>
              
              <div style={{ 
                padding: '10px',
                backgroundColor: 'rgba(255,255,255,0.7)',
                borderRadius: '4px',
                fontSize: '0.9em'
              }}>
                <strong>Risk Assessment:</strong> {
                  result.policyExceedanceRisk > 85 ? 'CRITICAL - Settlement likely exceeds policy limits. Significant excess exposure risk.' :
                  result.policyExceedanceRisk > 60 ? 'HIGH RISK - Settlement approaching policy limits. Monitor for excess exposure.' :
                  result.policyExceedanceRisk > 30 ? 'MODERATE RISK - Settlement within reasonable range of policy limits.' :
                  'LOW RISK - Settlement well within policy limits.'
                }
              </div>
              
              {/* Visual risk meter */}
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '0.8em', marginBottom: '5px' }}>
                  <strong>Exceedance Risk: {result.policyExceedanceRisk}%</strong>
                </div>
                <div style={{ 
                  width: '100%', 
                  height: '20px', 
                  backgroundColor: '#e2e8f0',
                  borderRadius: '10px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: `${Math.min(result.policyExceedanceRisk, 100)}%`,
                    height: '100%',
                    background: result.policyExceedanceRisk > 60 ? 
                      'linear-gradient(90deg, #fc8181, #e53e3e)' : 
                      result.policyExceedanceRisk > 30 ? 
                      'linear-gradient(90deg, #f6ad55, #dd6b20)' : 
                      'linear-gradient(90deg, #68d391, #38a169)',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>
            </div>
          )}

          {result.valueFactors && (
            <div style={{ 
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '8px'
            }}>
              <h3 style={{ marginBottom: '15px', color: '#495057' }}>Settlement Analysis:</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {result.valueFactors.increasing.length > 0 && (
                  <div>
                    <h4 style={{ color: '#28a745', marginBottom: '10px' }}>📈 Factors Increasing Value:</h4>
                    <ul style={{ paddingLeft: '20px', margin: 0 }}>
                      {result.valueFactors.increasing.map((factor, index) => (
                        <li key={index} style={{ marginBottom: '5px', color: '#28a745' }}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.valueFactors.decreasing.length > 0 && (
                  <div>
                    <h4 style={{ color: '#dc3545', marginBottom: '10px' }}>📉 Factors Decreasing Value:</h4>
                    <ul style={{ paddingLeft: '20px', margin: 0 }}>
                      {result.valueFactors.decreasing.map((factor, index) => (
                        <li key={index} style={{ marginBottom: '5px', color: '#dc3545' }}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <button
              onClick={() => setShowComparables(!showComparables)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {showComparables ? 'Hide' : 'Show'} Similar Cases
            </button>
          </div>

          {showComparables && result.comparableCases && result.comparableCases.length > 0 && (
            <div>
              <h3 style={{ marginBottom: '15px' }}>Comparable Cases:</h3>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                border: '1px solid #dee2e6'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'left',
                      border: '1px solid #dee2e6',
                      fontWeight: 'bold'
                    }}>
                      Case ID
                    </th>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'left',
                      border: '1px solid #dee2e6',
                      fontWeight: 'bold'
                    }}>
                      Settlement Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.comparableCases.map((caseItem, index) => (
                    <tr key={caseItem.case_id} style={{
                      backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa'
                    }}>
                      <td style={{ 
                        padding: '12px',
                        border: '1px solid #dee2e6'
                      }}>
                        {caseItem.case_id}
                      </td>
                      <td style={{ 
                        padding: '12px',
                        border: '1px solid #dee2e6'
                      }}>
                        ${caseItem.settlement_amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CaseEvaluator;