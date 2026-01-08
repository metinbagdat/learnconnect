import { exec } from 'child_process';
import fs from 'fs';

console.log('🚀 Starting TypeScript build verification...');

// Step 1: Type check
exec('npx tsc --noEmit --skipLibCheck', (tsError, tsStdout, tsStderr) => {
  if (tsError) {
    console.error('❌ TypeScript errors found:');
    console.error(tsStderr);
    
    // Create error log
    fs.writeFileSync('ts-errors.log', tsStderr);
    console.log('📄 Error log saved to ts-errors.log');
    
    process.exit(1);
  }
  
  console.log('✅ TypeScript check passed!');
  
  // Step 2: Build client
  console.log('🔨 Building client...');
  exec('npm run build:client', (buildError, buildStdout, buildStderr) => {
    if (buildError) {
      console.error('❌ Client build failed:');
      console.error(buildStderr);
      process.exit(1);
    }
    
    console.log('✅ Client build successful!');
    console.log('🎉 All checks passed! Ready to deploy.');
    process.exit(0);
  });
});
