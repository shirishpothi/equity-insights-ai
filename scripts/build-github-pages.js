#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Building for GitHub Pages...');

// Backup original actions file
const actionsPath = path.join(__dirname, '../src/app/actions.ts');
const actionsBackupPath = path.join(__dirname, '../src/app/actions.ts.backup');
const staticActionsPath = path.join(__dirname, '../src/app/actions.static.ts');

try {
  // Create backup of original actions file
  console.log('📦 Backing up original actions file...');
  fs.copyFileSync(actionsPath, actionsBackupPath);
  
  // Replace actions file with static version
  console.log('🔄 Replacing actions with static version...');
  fs.copyFileSync(staticActionsPath, actionsPath);
  
  // Set environment variable and build
  console.log('🏗️  Building application...');
  process.env.GITHUB_PAGES = 'true';
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('✅ GitHub Pages build completed successfully!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} finally {
  // Restore original actions file
  if (fs.existsSync(actionsBackupPath)) {
    console.log('🔄 Restoring original actions file...');
    fs.copyFileSync(actionsBackupPath, actionsPath);
    fs.unlinkSync(actionsBackupPath);
  }
}
