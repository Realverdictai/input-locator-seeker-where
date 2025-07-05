import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { buildPdf } from '@/report/buildPdf';
import { CaseData } from '@/types/verdict';

interface MediatorProposalProps {
  mediatorProposal: string;
  evaluator: string;
  rationale: string;
  expiresOn: string;
  caseData?: Partial<CaseData>;
  sourceRows?: number[];
}

const MediatorProposal = ({ 
  mediatorProposal, 
  evaluator, 
  rationale, 
  expiresOn,
  caseData,
  sourceRows = []
}: MediatorProposalProps) => {
  const [plaintiffEmail, setPlaintiffEmail] = useState('');
  const [defenseEmail, setDefenseEmail] = useState('');
  const [attachReport, setAttachReport] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  
  // Parse the provided expiration date
  const expiryDate = new Date(expiresOn);

  const handleSendProposal = async () => {
    if (!plaintiffEmail || !defenseEmail) {
      setMessage('Please enter both email addresses');
      return;
    }

    setSending(true);
    setMessage('');

    try {
      let pdfBuffer: Buffer | null = null;
      
      if (attachReport && caseData) {
        // Generate PDF report
        pdfBuffer = await buildPdf({
          newCase: caseData,
          evaluator,
          mediatorProposal,
          rationale,
          sourceRows,
          expiresOn
        });
      }

      const { data, error } = await supabase.functions.invoke('send-mediation-proposal', {
        body: {
          plaintiffEmail,
          defenseEmail,
          mediatorProposal,
          evaluator,
          rationale,
          expiresOn,
          attachReport,
          pdfData: pdfBuffer ? pdfBuffer.toString('base64') : null
        }
      });

      if (error) throw error;

      setMessage('Proposal sent successfully to both parties!');
      setPlaintiffEmail('');
      setDefenseEmail('');
      setAttachReport(false);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setSending(false);
    }
  };
  
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Mediator Proposal</h1>
      
      <div style={{ 
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '30px'
      }}>
        <h2 style={{ 
          fontSize: '2em', 
          fontWeight: 'bold', 
          margin: '0 0 15px 0',
          color: '#28a745',
          textAlign: 'center'
        }}>
          Mediator's Proposal: {mediatorProposal}
        </h2>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Proposal Amount:
            <input
              type="text"
              value={mediatorProposal}
              readOnly
              style={{ 
                width: '100%', 
                padding: '8px', 
                marginTop: '5px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: '#f5f5f5',
                color: '#666'
              }}
            />
          </label>
        </div>
        
        <p style={{ 
          fontSize: '1.1em', 
          margin: '15px 0',
          color: '#6c757d',
          lineHeight: '1.4'
        }}>
          The mediator's single-number proposal, drawn from a comprehensive analysis of 313 real cases, is {mediatorProposal}.
        </p>
        
        <p style={{ margin: '10px 0', color: '#495057' }}>
          <strong>Evaluator Number:</strong> {evaluator}
        </p>
        
        <p style={{ margin: '10px 0', color: '#495057' }}>
          <strong>Source Cases:</strong> #{sourceRows.join(', #')}
        </p>
        
        <p style={{ margin: '10px 0', color: '#495057' }}>
          <strong>Rationale:</strong> {rationale}
        </p>
        
        <p style={{ 
          margin: '15px 0 0 0', 
          color: '#dc3545',
          fontWeight: 'bold'
        }}>
          This proposal expires on {expiresOn} at 5:00 PM.
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '15px' }}>Send Proposal</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Plaintiff's Email:
            <input
              type="email"
              value={plaintiffEmail}
              onChange={(e) => setPlaintiffEmail(e.target.value)}
              placeholder="plaintiff@lawfirm.com"
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
            Defense Email:
            <input
              type="email"
              value={defenseEmail}
              onChange={(e) => setDefenseEmail(e.target.value)}
              placeholder="defense@insurance.com"
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
          <label style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
            <input
              type="checkbox"
              checked={attachReport}
              onChange={(e) => setAttachReport(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Attach full report to both parties
          </label>
          <small style={{ color: '#666', fontSize: '0.9em', marginLeft: '24px' }}>
            Includes detailed factor analysis and defense considerations
          </small>
        </div>

        <button
          onClick={handleSendProposal}
          disabled={sending}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: sending ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: sending ? 'not-allowed' : 'pointer'
          }}
        >
          {sending ? 'Sending...' : 'Send Proposal'}
        </button>

        {message && (
          <p style={{ 
            marginTop: '10px',
            padding: '10px',
            backgroundColor: message.includes('Error') ? '#ffe6e6' : '#e6ffe6',
            border: `1px solid ${message.includes('Error') ? '#ff9999' : '#99ff99'}`,
            borderRadius: '4px',
            color: message.includes('Error') ? '#cc0000' : '#006600'
          }}>
            {message}
          </p>
        )}
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px',
        marginTop: '30px'
      }}>
        <div style={{ 
          backgroundColor: '#e3f2fd',
          border: '1px solid #bbdefb',
          borderRadius: '8px',
          padding: '15px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>To Plaintiff's Counsel</h3>
          <p style={{ margin: '0', fontSize: '0.9em', lineHeight: '1.4' }}>
            This proposal represents a fair settlement based on comparable cases with similar injuries and circumstances. 
            Accepting ensures certainty and avoids the risks and costs of continued litigation.
          </p>
        </div>
        
        <div style={{ 
          backgroundColor: '#fff3e0',
          border: '1px solid #ffcc02',
          borderRadius: '8px',
          padding: '15px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#f57c00' }}>To Defense Counsel</h3>
          <p style={{ margin: '0', fontSize: '0.9em', lineHeight: '1.4' }}>
            This proposal is based on actual settlement data from similar cases. 
            It provides predictable resolution and eliminates the uncertainty of trial outcomes and potential excess judgments.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MediatorProposal;