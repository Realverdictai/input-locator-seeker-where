import { evaluateCase } from '@/valuation/evaluateCase';
import { supabase } from '@/integrations/supabase/client';

/**
 * Quick unit test to verify numeric column conversion is working
 */
async function testCaseEvaluation() {
  try {
    console.log('🧪 Testing case evaluation with numeric columns...\n');
    
    // First, let's verify the numeric columns exist and have data
    const { data: sample, error: sampleError } = await supabase
      .from('cases_master')
      .select('case_id, settle, settle_num, liab_pct, liab_pct_num, pol_lim, policy_limits_num')
      .not('settle_num', 'is', null)
      .limit(1)
      .single();
    
    if (sampleError) {
      console.error('❌ Error fetching sample case:', sampleError);
      return;
    }
    
    if (!sample) {
      console.error('❌ No cases with numeric data found');
      return;
    }
    
    console.log('✅ Sample case data:');
    console.log(`   Case ID: ${sample.case_id}`);
    console.log(`   Original settle: "${sample.settle}" → Numeric: ${sample.settle_num}`);
    console.log(`   Original liab_pct: "${sample.liab_pct}" → Numeric: ${sample.liab_pct_num}`);
    console.log(`   Original pol_lim: "${sample.pol_lim}" → Numeric: ${sample.policy_limits_num}`);
    console.log('');
    
    // Now test the evaluator with a mock case
    const testCase = {
      Venue: 'Los Angeles',
      Surgery: 'Spinal Fusion',
      Injuries: 'Herniated disc, chronic pain',
      LiabPct: '85',
      AccType: 'Motor Vehicle',
      PolicyLimits: '500000',
      medicalSpecials: 45000,
      surgeries: 1,
      surgeryType: 'Spinal',
      injections: 3,
      injectionType: 'Epidural',
      tbiLevel: 0,
      age: 42,
      PriorAccidents: 'No'
    };
    
    console.log('🔍 Evaluating test case:');
    console.log('   Venue:', testCase.Venue);
    console.log('   Surgery:', testCase.Surgery);
    console.log('   Liability:', testCase.LiabPct + '%');
    console.log('   Medical Specials:', '$' + testCase.medicalSpecials.toLocaleString());
    console.log('');
    
    const result = await evaluateCase(testCase);
    
    console.log('✅ Evaluation completed!');
    console.log('   Evaluator Number:', result.evaluator);
    console.log('   Mediator Proposal:', result.mediatorProposal);
    console.log('   Expires On:', result.expiresOn);
    console.log('   Model R² Score:', result.r2Score.toFixed(3));
    console.log('   Rationale:', result.rationale);
    console.log('   Similar Cases Used:', result.nearestCases.join(', '));
    
    // Validate the result makes sense
    const evaluatorNum = parseFloat(result.evaluator.replace(/[$,]/g, ''));
    const mediatorNum = parseFloat(result.mediatorProposal.replace(/[$,]/g, ''));
    
    if (evaluatorNum > 0 && mediatorNum > 0 && mediatorNum <= evaluatorNum) {
      console.log('\n🎉 TEST PASSED: Numeric evaluation is working correctly!');
    } else {
      console.log('\n⚠️  TEST WARNING: Numbers seem unusual');
      console.log('   Check if evaluator > 0 and mediator ≤ evaluator');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCaseEvaluation();