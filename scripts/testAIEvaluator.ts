/**
 * Test script for AI-first case evaluator
 */

import { calcEvaluatorAI } from '../src/valuation/calcEvaluatorAI';

// Force offline mode for local testing environments without database access
process.env.OFFLINE_MODE = 'true';

const testCase = {
  Venue: 'Los Angeles',
  Surgery: 'None',
  Injuries: 'Mild traumatic brain injury; Cervical strain; Post-concussion syndrome',
  LiabPct: 100,
  AccType: 'Motor Vehicle Accident',
  howell: 45000,
  medicalSpecials: 50000,
  policyLimits: 300000,
  surgeryType: 'None',
  surgeries: 0,
  injectionType: 'Epidural Steroid',
  injections: 3,
  age: 45,
  tbiLevel: 1, // 1 = Mild TBI
  dol: '2022-06-15'
};

// Sample narrative WITHOUT deduction triggers
const testNarrative = `
Patient was involved in rear-end collision on 06/15/2022. Patient sustained mild traumatic brain injury with post-concussion symptoms.
Treatment began immediately with consistent follow-up care. Patient received 3 epidural steroid injections over treatment period.
Medical specials total $50,000. Howell damages calculated at $45,000.
Patient has been compliant with all treatment recommendations and attending all appointments.
No pre-existing conditions affecting this injury. No subsequent accidents during treatment.
`;

async function runTest() {
  console.log('🧪 Testing AI-First Case Evaluator');
  console.log('====================================');
  
  try {
    console.log('📋 Test Case Data:');
    console.log(JSON.stringify(testCase, null, 2));
    
    console.log('\n📝 Test Narrative:');
    console.log(testNarrative.trim());
    
    console.log('\n🚀 Running AI Evaluation...');
    const result = await calcEvaluatorAI(testCase, testNarrative, {
      plaintiffBottomLine: 250000,
      defenseAuthority: 200000,
      defenseRangeLow: 150000,
      defenseRangeHigh: 200000
    });
    
    console.log('\n✅ AI Evaluation Result:');
    console.log('========================');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('\n📊 Summary:');
    console.log(`Base Evaluator: ${result.evaluator}`);
    console.log(`Deductions Applied: ${result.deductions.length}`);
    result.deductions.forEach(d => {
      console.log(`  - ${d.name}: ${d.pct}%`);
    });
    console.log(`Net Evaluator: ${result.evaluatorNet}`);
    console.log(`Mediator Proposal: ${result.mediatorProposal}`);
    console.log(`Confidence: ${result.confidence}%`);
    console.log(`Expires: ${result.expiresOn}`);
    console.log(`Source Cases: #${result.nearestCases.join(', #')}`);
    
  } catch (error) {
    console.error('❌ Test Failed:', error);
    process.exit(1);
  }
}

// Check for IGNORE_WEIGHTS flag
if (process.env.IGNORE_WEIGHTS === 'true') {
  console.log('⚠️  IGNORE_WEIGHTS flag is set - surgery/injection weights disabled');
}

// Check for OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  console.log('⚠️  No OpenAI API key found - setting test key for local testing');
  process.env.OPENAI_API_KEY = 'test-key-for-local-testing';
}

runTest().then(() => {
  console.log('\n🎉 Test completed successfully!');
  process.exit(0);
});