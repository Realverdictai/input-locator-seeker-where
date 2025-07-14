import { calcEvaluator } from './calcEvaluator';
import { calcMediator } from './calcMediator';

/**
 * Test harness for the valuation system
 */
export async function runTestHarness() {
  console.log('🧪 Running Valuation Test Harness...');
  
  const testCase = {
    Venue: 'Los Angeles',
    Surgery: 'Fusion', 
    Injuries: 'ESI;Facet',
    LiabPct: '0',
    AccType: 'rear-end',
    howell: 180000,
    surgeryType: 'Spinal Fusion',
    surgeries: 2,
    injectionType: 'Epidural Steroid',
    injections: 3,
    age: 45,
    tbiLevel: 1,
    policyLimits: 250000
  };
  
  try {
    console.log('📊 Test Case:', testCase);
    
    // Calculate evaluator
    const evalRes = await calcEvaluator(testCase);
    console.log('💰 Evaluator Result:', evalRes);
    
    // Calculate mediator proposal
    const medRes = calcMediator(evalRes.evaluator, testCase.policyLimits);
    console.log('⚖️ Mediator Result:', medRes);
    
    // Summary
    console.log('\n✅ Test Harness Complete');
    console.log(`Evaluator: ${evalRes.evaluator}`);
    console.log(`Mediator: ${medRes.mediator}`);
    console.log(`Range: ${medRes.rangeLow} - ${medRes.rangeHigh}`);
    console.log(`Rationale: ${evalRes.rationale}`);
    console.log(`Source Cases: #${evalRes.sourceCases.join(', #')}`);
    console.log(`Expires: ${medRes.expiresOn}`);
    
    return { evalRes, medRes };
    
  } catch (error) {
    console.error('❌ Test Harness Failed:', error);
    throw error;
  }
}