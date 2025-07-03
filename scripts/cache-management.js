#!/usr/bin/env node

/**
 * Cache Management Script for Next.js Build Optimization
 * 
 * This script provides utilities to manage build caches for faster rebuilds.
 * It can clean, analyze, and optimize various cache directories.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CACHE_DIRS = [
  '.next/cache',
  'node_modules/.cache',
  '.next/static',
  '.next/server',
];

const CACHE_FILES = [
  'tsconfig.tsbuildinfo',
  '.next/trace',
];

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getDirectorySize(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;
  
  let totalSize = 0;
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      totalSize += getDirectorySize(filePath);
    } else {
      totalSize += stats.size;
    }
  }
  
  return totalSize;
}

function analyzeCache() {
  console.log('🔍 Analyzing build cache...\n');
  
  let totalCacheSize = 0;
  
  // Analyze cache directories
  for (const dir of CACHE_DIRS) {
    const size = getDirectorySize(dir);
    totalCacheSize += size;
    
    if (size > 0) {
      console.log(`📁 ${dir}: ${formatBytes(size)}`);
    } else {
      console.log(`📁 ${dir}: Not found or empty`);
    }
  }
  
  // Analyze cache files
  for (const file of CACHE_FILES) {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      totalCacheSize += stats.size;
      console.log(`📄 ${file}: ${formatBytes(stats.size)}`);
    } else {
      console.log(`📄 ${file}: Not found`);
    }
  }
  
  console.log(`\n💾 Total cache size: ${formatBytes(totalCacheSize)}`);
  
  if (totalCacheSize > 0) {
    console.log('\n✅ Build cache is active and will speed up subsequent builds!');
  } else {
    console.log('\n⚠️  No build cache found. Run a build first to generate cache.');
  }
}

function cleanCache() {
  console.log('🧹 Cleaning build cache...\n');
  
  let cleanedSize = 0;
  
  // Clean cache directories
  for (const dir of CACHE_DIRS) {
    if (fs.existsSync(dir)) {
      const size = getDirectorySize(dir);
      cleanedSize += size;
      
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`🗑️  Removed ${dir} (${formatBytes(size)})`);
      } catch (error) {
        console.log(`❌ Failed to remove ${dir}: ${error.message}`);
      }
    }
  }
  
  // Clean cache files (except tsconfig.tsbuildinfo which we want to keep)
  const filesToClean = CACHE_FILES.filter(file => file !== 'tsconfig.tsbuildinfo');
  for (const file of filesToClean) {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      cleanedSize += stats.size;
      
      try {
        fs.unlinkSync(file);
        console.log(`🗑️  Removed ${file} (${formatBytes(stats.size)})`);
      } catch (error) {
        console.log(`❌ Failed to remove ${file}: ${error.message}`);
      }
    }
  }
  
  console.log(`\n🎉 Cleaned ${formatBytes(cleanedSize)} of cache data`);
  console.log('💡 TypeScript incremental cache (tsconfig.tsbuildinfo) was preserved for faster compilation');
}

function optimizeCache() {
  console.log('⚡ Optimizing build cache...\n');
  
  // Ensure cache directories exist
  for (const dir of CACHE_DIRS) {
    const dirPath = path.dirname(dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`📁 Created cache directory: ${dirPath}`);
    }
  }
  
  // Run a clean build to populate cache
  console.log('🏗️  Running optimized build to populate cache...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('\n✅ Build cache optimized successfully!');
  } catch (error) {
    console.log('\n❌ Build failed during cache optimization');
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🚀 Next.js Build Cache Management

Usage: node scripts/cache-management.js [command]

Commands:
  analyze    Show current cache size and status
  clean      Remove all build cache (except TypeScript incremental cache)
  optimize   Clean and rebuild cache for optimal performance
  help       Show this help message

Examples:
  node scripts/cache-management.js analyze
  node scripts/cache-management.js clean
  node scripts/cache-management.js optimize
`);
}

// Main execution
const command = process.argv[2];

switch (command) {
  case 'analyze':
    analyzeCache();
    break;
  case 'clean':
    cleanCache();
    break;
  case 'optimize':
    optimizeCache();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    if (command) {
      console.log(`❌ Unknown command: ${command}\n`);
    }
    showHelp();
    process.exit(1);
}
