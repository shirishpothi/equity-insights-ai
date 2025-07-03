// Simple test script to verify API routes work locally
// Run with: node test-api.js

const http = require('http');

const testData = {
  ticker: 'AAPL',
  investmentThesis: 'Apple has strong brand loyalty and ecosystem lock-in effects that provide sustainable competitive advantages.',
  goal: 'Long-term growth investment for retirement portfolio'
};

function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

async function testAPIs() {
  console.log('Testing API routes...\n');
  
  try {
    // Test ticker suggestions
    console.log('1. Testing ticker suggestions API...');
    const suggestResult = await makeRequest('/api/suggest-tickers', { query: 'app' });
    console.log(`Status: ${suggestResult.status}`);
    console.log(`Response: ${JSON.stringify(suggestResult.data, null, 2)}\n`);
    
    // Test stock analysis
    console.log('2. Testing stock analysis API...');
    const analysisResult = await makeRequest('/api/analyze-stock', testData);
    console.log(`Status: ${analysisResult.status}`);
    console.log(`Response: ${JSON.stringify(analysisResult.data, null, 2)}\n`);
    
    console.log('✅ API tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nMake sure the development server is running with: npm run dev');
  }
}

testAPIs();
