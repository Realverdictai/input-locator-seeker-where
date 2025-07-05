/**
 * Test script for AI-first case evaluator
 */

import { calcEvaluatorAI } from '../src/valuation/calcEvaluatorAI';

const testCase = {
  Venue: 'Los Angeles',
  Surgery: 'Fusion',
  Injuries: 'Lumbar disc herniation; Nerve root compression; Chronic pain syndrome',
  LiabPct: 100,
  AccType: 'Motor Vehicle Accident',
  howell: 185000,
  policyLimits: 300000,
  surgeryType: 'Lumbar Fusion',
  surgeries: 1,
  injectionType: 'Epidural Steroid',
  injections: 3,
  age: 45,
  tbiLevel: 0,
  dol: '2022-06-15'
};

// Sample narrative with deduction triggers
const testNarrative = `
Patient was involved in rear-end collision on 06/15/2022. Initial treatment began immediately.
However, patient had a subsequent accident in September 2022 during the treatment period when he fell at home.
There was also a significant gap in treatment from October to December 2022 (90+ days) due to patient non-compliance.
Medical records indicate some pre-existing degenerative changes in the lumbar spine.
Patient missed several appointments and was non-compliant with physical therapy recommendations.
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
    const result = await calcEvaluatorAI(testCase, testNarrative);
    
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

runTest().then(() => {
  console.log('\n🎉 Test completed successfully!');
  process.exit(0);
});