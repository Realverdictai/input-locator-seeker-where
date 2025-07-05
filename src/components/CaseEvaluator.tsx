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
}

interface ValuationResult {
  proposal: string;
  rationale: string;
  sourceCaseID: number;
  expiresOn: string;
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
    PolLim: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [comparableCases, setComparableCases] = useState<ComparableCase[]>([]);
  const [showComparables, setShowComparables] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      // Call generateValuation with new single settlement approach
      const valuation = await generateValuation(formData);
      
      // Get comparables for optional display
      const comparables = await findComparables(formData);
      
      // Set results
      setResult(valuation);
      setComparableCases(comparables.slice(0, 5).map(c => ({
        CaseID: c.CaseID,
        Settle: c.Settle
      })));
      
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Case Evaluator</h1>
      
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
              Mediator's Single-Number Proposal: {result.proposal}
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

          {showComparables && comparableCases.length > 0 && (
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
                  {comparableCases.map((caseItem, index) => (
                    <tr key={caseItem.CaseID} style={{
                      backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa'
                    }}>
                      <td style={{ 
                        padding: '12px',
                        border: '1px solid #dee2e6'
                      }}>
                        {caseItem.CaseID}
                      </td>
                      <td style={{ 
                        padding: '12px',
                        border: '1px solid #dee2e6'
                      }}>
                        {caseItem.Settle}
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