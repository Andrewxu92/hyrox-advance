// HYROX Database Export CLI
// Usage: npm run db:export -- [options]

import { exportToJSON, exportToCSV, exportAthleteData } from './export.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);

function showHelp() {
  console.log(`
HYROX Database Export Tool

Usage: npm run db:export -- [options]

Options:
  --format <json|csv|both>    Export format (default: json)
  --athlete <id>              Export specific athlete only
  --tables <list>             Tables to export for CSV (default: athletes,results,analysisReports)
  --help                      Show this help message

Examples:
  npm run db:export                              # Export all data to JSON
  npm run db:export -- --format csv              # Export all data to CSV
  npm run db:export -- --athlete abc123          # Export specific athlete to JSON
  npm run db:export -- --athlete abc123 --format both
  npm run db:export -- --format csv --tables athletes,results
`);
}

async function main() {
  if (args.includes('--help')) {
    showHelp();
    process.exit(0);
  }

  // Parse options
  const formatIndex = args.indexOf('--format');
  const format = formatIndex !== -1 ? args[formatIndex + 1] : 'json';

  const athleteIndex = args.indexOf('--athlete');
  const athleteId = athleteIndex !== -1 ? args[athleteIndex + 1] : undefined;

  const tablesIndex = args.indexOf('--tables');
  const tables = tablesIndex !== -1 ? args[tablesIndex + 1].split(',') : undefined;

  console.log('🔧 HYROX Database Export Tool');
  console.log('═══════════════════════════════');

  try {
    if (athleteId) {
      console.log(`📊 Exporting athlete: ${athleteId}`);
      console.log(`📁 Format: ${format}`);
      
      const { filePaths, data } = await exportAthleteData(
        athleteId, 
        format as 'json' | 'csv' | 'both'
      );
      
      console.log('\n✅ Export completed successfully!');
      console.log('\n📁 Generated files:');
      filePaths.forEach(fp => console.log(`   - ${fp}`));
    } else {
      console.log(`📊 Exporting all data`);
      console.log(`📁 Format: ${format}`);
      
      if (format === 'json' || format === 'both') {
        const { filePath, data } = await exportToJSON();
        console.log('\n📄 JSON Export:');
        console.log(`   File: ${filePath}`);
        console.log(`   Athletes: ${data.data.athletes?.length || 0}`);
        console.log(`   Results: ${data.data.results?.length || 0}`);
        console.log(`   Analyses: ${data.data.analysisReports?.length || 0}`);
        console.log(`   Training Plans: ${data.data.trainingPlans?.length || 0}`);
      }
      
      if (format === 'csv' || format === 'both') {
        const { filePaths, data } = await exportToCSV({ tables });
        console.log('\n📄 CSV Export:');
        filePaths.forEach(fp => console.log(`   File: ${fp}`));
      }
      
      console.log('\n✅ Export completed successfully!');
    }
  } catch (error) {
    console.error('\n❌ Export failed:', error);
    process.exit(1);
  }
}

main();