import 'dotenv/config';
import https from 'https';

console.log('\n🔍 Testing network connectivity from Node.js...\n');

// Test 1: Can we reach the internet at all?
function testBasicHTTPS(url, name) {
  return new Promise((resolve) => {
    console.log(`Testing ${name}...`);
    const startTime = Date.now();

    const req = https.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Node.js Connection Test'
      }
    }, (res) => {
      const duration = Date.now() - startTime;
      console.log(`✅ ${name}: Connected! (${res.statusCode}) - ${duration}ms`);
      resolve({ success: true, statusCode: res.statusCode, duration });
      req.destroy();
    });

    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      console.log(`❌ ${name}: FAILED - ${error.message} - ${duration}ms`);
      console.log(`   Error code: ${error.code}`);
      console.log(`   Error type: ${error.constructor.name}`);
      resolve({ success: false, error: error.message, code: error.code, duration });
    });

    req.on('timeout', () => {
      console.log(`❌ ${name}: TIMEOUT after 10 seconds`);
      req.destroy();
      resolve({ success: false, error: 'Timeout', duration: 10000 });
    });
  });
}

// Test 2: Can we reach OpenAI API specifically?
function testOpenAI() {
  return new Promise((resolve) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.log('⚠️  OpenAI API: No API key found in .env');
      return resolve({ success: false, error: 'No API key' });
    }

    console.log('Testing OpenAI API with your key...');
    const startTime = Date.now();

    const postData = JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 5
    });

    const req = https.request({
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': postData.length
      }
    }, (res) => {
      const duration = Date.now() - startTime;
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ OpenAI API: Connected and authenticated! - ${duration}ms`);
          resolve({ success: true, statusCode: res.statusCode, duration });
        } else if (res.statusCode === 401) {
          console.log(`❌ OpenAI API: Invalid API key (401) - ${duration}ms`);
          resolve({ success: false, error: 'Invalid API key', statusCode: 401, duration });
        } else {
          console.log(`⚠️  OpenAI API: Unexpected response (${res.statusCode}) - ${duration}ms`);
          console.log(`   Response: ${data.substring(0, 200)}`);
          resolve({ success: false, statusCode: res.statusCode, duration });
        }
      });
    });

    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      console.log(`❌ OpenAI API: Connection FAILED - ${error.message} - ${duration}ms`);
      console.log(`   Error code: ${error.code}`);
      resolve({ success: false, error: error.message, code: error.code, duration });
    });

    req.on('timeout', () => {
      console.log(`❌ OpenAI API: TIMEOUT after 15 seconds`);
      req.destroy();
      resolve({ success: false, error: 'Timeout', duration: 15000 });
    });

    req.write(postData);
    req.end();
  });
}

// Test 3: Can we reach AssemblyAI?
function testAssemblyAI() {
  return new Promise((resolve) => {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
      console.log('⚠️  AssemblyAI API: No API key found in .env');
      return resolve({ success: false, error: 'No API key' });
    }

    console.log('Testing AssemblyAI API with your key...');
    const startTime = Date.now();

    const req = https.request({
      hostname: 'api.assemblyai.com',
      port: 443,
      path: '/v2/transcript',
      method: 'GET',
      timeout: 15000,
      headers: {
        'Authorization': apiKey
      }
    }, (res) => {
      const duration = Date.now() - startTime;
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 400) {
          console.log(`✅ AssemblyAI API: Connected! (${res.statusCode}) - ${duration}ms`);
          resolve({ success: true, statusCode: res.statusCode, duration });
        } else if (res.statusCode === 401) {
          console.log(`❌ AssemblyAI API: Invalid API key (401) - ${duration}ms`);
          resolve({ success: false, error: 'Invalid API key', statusCode: 401, duration });
        } else {
          console.log(`⚠️  AssemblyAI API: Unexpected response (${res.statusCode}) - ${duration}ms`);
          resolve({ success: false, statusCode: res.statusCode, duration });
        }
      });
    });

    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      console.log(`❌ AssemblyAI API: Connection FAILED - ${error.message} - ${duration}ms`);
      console.log(`   Error code: ${error.code}`);
      resolve({ success: false, error: error.message, code: error.code, duration });
    });

    req.on('timeout', () => {
      console.log(`❌ AssemblyAI API: TIMEOUT after 15 seconds`);
      req.destroy();
      resolve({ success: false, error: 'Timeout', duration: 15000 });
    });

    req.end();
  });
}

// Run all tests
async function runTests() {
  console.log('═══════════════════════════════════════════════════════\n');

  // Test basic internet connectivity
  await testBasicHTTPS('https://www.google.com', 'Google (basic internet)');
  console.log();

  await testBasicHTTPS('https://api.openai.com', 'OpenAI domain');
  console.log();

  await testBasicHTTPS('https://api.assemblyai.com', 'AssemblyAI domain');
  console.log();

  // Test actual API endpoints with auth
  const openaiResult = await testOpenAI();
  console.log();

  const assemblyResult = await testAssemblyAI();
  console.log();

  console.log('═══════════════════════════════════════════════════════');
  console.log('\n📊 DIAGNOSIS:\n');

  // Provide diagnosis
  if (!openaiResult.success && !assemblyResult.success) {
    if (openaiResult.code === 'ETIMEDOUT' || openaiResult.code === 'ECONNREFUSED' ||
        assemblyResult.code === 'ETIMEDOUT' || assemblyResult.code === 'ECONNREFUSED') {
      console.log('🔥 FIREWALL BLOCKING DETECTED!');
      console.log('   Node.js cannot reach external APIs.');
      console.log('\n   FIX: Run this PowerShell command AS ADMINISTRATOR:\n');
      console.log('   New-NetFirewallRule -DisplayName "Node.js API Access" -Direction Outbound -Program (Get-Command node).Source -Action Allow\n');
    } else if (openaiResult.code === 'ENOTFOUND' || assemblyResult.code === 'ENOTFOUND') {
      console.log('🌐 DNS RESOLUTION FAILED!');
      console.log('   Your system cannot resolve API domain names.');
      console.log('   Check your internet connection and DNS settings.\n');
    } else {
      console.log('❌ NETWORK ERROR!');
      console.log(`   OpenAI error: ${openaiResult.error || 'Unknown'}`);
      console.log(`   AssemblyAI error: ${assemblyResult.error || 'Unknown'}`);
      console.log('   Check your network connection and proxy settings.\n');
    }
  } else if (openaiResult.statusCode === 401 || assemblyResult.statusCode === 401) {
    console.log('🔑 INVALID API KEY!');
    console.log('   At least one API key is incorrect.');
    console.log('   Check your .env file and verify your keys.\n');
  } else if (openaiResult.success && assemblyResult.success) {
    console.log('✅ ALL CONNECTIONS WORKING!');
    console.log('   Both APIs are reachable and keys are valid.');
    console.log('   The issue might be intermittent or already resolved.\n');
  } else {
    console.log('⚠️  PARTIAL CONNECTION!');
    console.log(`   OpenAI: ${openaiResult.success ? '✅ Working' : '❌ Failed'}`);
    console.log(`   AssemblyAI: ${assemblyResult.success ? '✅ Working' : '❌ Failed'}`);
    console.log('   At least one service is working, but check the logs above.\n');
  }
}

runTests().catch(console.error);
