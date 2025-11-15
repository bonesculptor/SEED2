import { supabase } from '../lib/supabase';
import { storeLetterDataInDigitalTwin } from '../services/medicalLetterParser';

async function main() {
  try {
    console.log('Starting import of Simon Grange medical letter data...\n');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error('Error: No authenticated user found');
      console.log('Please ensure you are logged in before running this script');
      return;
    }

    console.log(`User authenticated: ${user.email}\n`);

    const result = await storeLetterDataInDigitalTwin(user.id);

    console.log('\n' + '='.repeat(80));
    console.log(result.summary);
    console.log('='.repeat(80) + '\n');

    console.log('Import completed successfully!');
    console.log(`\nPatient ID: ${result.patientId}`);
    console.log(`Baseline ID: ${result.baselineId}`);
    console.log('\nYou can now view this data in the graph database visualizations.');
  } catch (error) {
    console.error('Error importing data:', error);
    throw error;
  }
}

main().catch(console.error);
