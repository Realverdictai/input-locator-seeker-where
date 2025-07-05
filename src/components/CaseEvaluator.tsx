import { useState } from 'react';
import { calcEvaluator } from '@/valuation/calcEvaluator';
import { calcMediator } from '@/valuation/calcMediator';
import { runTestHarness } from '@/valuation/testHarness';

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

interface EvaluationResult {
  evaluator: string;
  rationale: string;
  sourceCases: number[];
}

interface MediatorResult {
  mediator: string;
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
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [mediatorResult, setMediatorResult] = useState<MediatorResult | null>(null);
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
    setEvaluationResult(null);
    setMediatorResult(null);

    try {
      // Convert form data to new case format
      const newCase = {
        Venue: formData.Venue,
        Surgery: formData.Surgery,
        Injuries: formData.Injuries,
        LiabPct: formData.LiabPct,
        AccType: formData.AccType,
        howell: formData.howellSpecials ? parseInt(formData.howellSpecials) : undefined,
        medicalSpecials: formData.medicalSpecials ? parseInt(formData.medicalSpecials) : undefined,
        surgeryType: formData.surgeryType,
        surgeries: formData.surgeries ? parseInt(formData.surgeries) : undefined,
        injectionType: formData.injectionType,
        injections: formData.injections ? parseInt(formData.injections) : undefined,
        tbiLevel: formData.tbiSeverity ? ['mild', 'moderate', 'severe'].indexOf(formData.tbiSeverity) + 1 : undefined,
        policyLimits: formData.PolLim ? parseInt(formData.PolLim.replace(/[$,]/g, '')) : undefined
      };

      // Calculate evaluator number using new algorithm
      const evaluation = await calcEvaluator(newCase);
      setEvaluationResult(evaluation);
      
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateProposal = () => {
    if (!evaluationResult) return;
    
    const policyLimits = formData.PolLim ? parseInt(formData.PolLim.replace(/[$,]/g, '')) : undefined;
    const proposal = calcMediator(evaluationResult.evaluator, policyLimits);
    setMediatorResult(proposal);
  };

  const handleRunTest = async () => {
    setLoading(true);
    setError('');
    try {
      const { evalRes, medRes } = await runTestHarness();
      setEvaluationResult({
        evaluator: evalRes.evaluator,
        rationale: evalRes.rationale,
        sourceCases: evalRes.sourceCases
      });
      setMediatorResult({
        mediator: medRes.mediator,
        expiresOn: medRes.expiresOn
      });
    } catch (err) {
      setError(`Test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
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

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
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
            {loading ? 'Calculating...' : 'Calculate Evaluator Number'}
          </button>
          
          <button
            type="button"
            onClick={handleRunTest}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: loading ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Testing...' : 'Run Test Harness'}
          </button>
        </div>
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

      {evaluationResult && (
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
              Evaluator Number: {evaluationResult.evaluator}
            </h2>
            <p style={{ 
              fontSize: '1.1em', 
              margin: '10px 0',
              color: '#6c757d',
              lineHeight: '1.4'
            }}>
              {evaluationResult.rationale}
            </p>
            <p style={{ 
              fontSize: '0.9em', 
              margin: '10px 0',
              color: '#666',
              fontStyle: 'italic'
            }}>
              (based on Cases #{evaluationResult.sourceCases.join(', #')})
            </p>
          </div>

          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <button
              onClick={handleGenerateProposal}
              disabled={!!mediatorResult}
              style={{
                padding: '12px 24px',
                backgroundColor: mediatorResult ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: mediatorResult ? 'not-allowed' : 'pointer',
                marginRight: '10px'
              }}
            >
              {mediatorResult ? 'Proposal Generated' : 'Generate Mediator Proposal'}
            </button>
          </div>

          {mediatorResult && (
            <div style={{ 
              textAlign: 'center', 
              marginTop: '20px',
              padding: '20px',
              backgroundColor: '#e8f5e8',
              border: '1px solid #28a745',
              borderRadius: '8px'
            }}>
              <h3 style={{ 
                fontSize: '1.8em', 
                fontWeight: 'bold', 
                margin: '0 0 10px 0',
                color: '#28a745'
              }}>
                Mediator's Proposal: {mediatorResult.mediator}
              </h3>
              <p style={{ 
                fontSize: '1em', 
                margin: '0',
                color: '#dc3545',
                fontWeight: 'bold'
              }}>
                Expires: {mediatorResult.expiresOn} at 5:00 PM
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CaseEvaluator;