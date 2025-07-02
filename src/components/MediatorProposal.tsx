interface MediatorProposalProps {
  recommendedRange: string;
  midpoint: number;
  rationale: string;
  proposal: string;
}

const MediatorProposal = ({ recommendedRange, midpoint, rationale, proposal }: MediatorProposalProps) => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7);
  
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
          Mediator's Proposal: {proposal}
        </h2>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Proposal Amount:
            <input
              type="text"
              value={proposal}
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
          The mediator's single-number proposal, drawn from a closely matching real case, is {proposal}.
        </p>
        
        <p style={{ margin: '10px 0', color: '#495057' }}>
          <strong>Settlement Range:</strong> {recommendedRange}
        </p>
        
        <p style={{ margin: '10px 0', color: '#495057' }}>
          <strong>Rationale:</strong> {rationale}
        </p>
        
        <p style={{ 
          margin: '15px 0 0 0', 
          color: '#dc3545',
          fontWeight: 'bold'
        }}>
          This proposal expires on {expiryDate.toLocaleDateString()} at 5:00 PM.
        </p>
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