// DEBUGGING TOOLS FOR PRESIGNED URL UPLOADS
// Copy/paste these into browser console for debugging

// 1. Test the exact minimal fetch implementation
async function testMinimalUpload(presignedUrl, file) {
  console.log('🧪 Testing minimal upload implementation...');
  console.log('Presigned URL:', presignedUrl.substring(0, 100) + '...');
  
  try {
    const resp = await fetch(presignedUrl, {
      method: "PUT",
      credentials: "omit",
      headers: {
        "Content-Type": "application/octet-stream",
        "x-amz-server-side-encryption": "AES256",
        "x-amz-acl": "private"
      },
      body: file
    });

    console.log('Response status:', resp.status);
    console.log('Response headers:', Object.fromEntries(resp.headers.entries()));
    
    if (!resp.ok) {
      const text = await resp.text();
      console.error('Error response:', text);
    } else {
      console.log('✅ Upload successful!');
    }
    
    return resp;
  } catch (error) {
    console.error('❌ Upload failed:', error);
    throw error;
  }
}

// 2. Inspect presigned URL parameters
function inspectPresignedUrl(url) {
  console.log('🔍 Inspecting presigned URL...');
  
  try {
    const urlObj = new URL(url);
    const params = Object.fromEntries(urlObj.searchParams.entries());
    
    console.log('URL components:');
    console.log('- Protocol:', urlObj.protocol);
    console.log('- Host:', urlObj.host);
    console.log('- Pathname:', urlObj.pathname);
    console.log('- Search params:', params);
    
    // Check for required parameters
    const requiredParams = ['X-Amz-Algorithm', 'X-Amz-Credential', 'X-Amz-Date', 'X-Amz-Signature'];
    const missingParams = requiredParams.filter(param => !params[param]);
    
    if (missingParams.length > 0) {
      console.warn('⚠️ Missing required parameters:', missingParams);
    } else {
      console.log('✅ All required parameters present');
    }
    
    // Check signed headers
    const signedHeaders = params['X-Amz-SignedHeaders'];
    if (signedHeaders) {
      console.log('Signed headers:', signedHeaders);
      const requiredHeaders = ['content-type', 'x-amz-server-side-encryption', 'x-amz-acl'];
      const signedHeadersList = signedHeaders.split(';');
      const missingHeaders = requiredHeaders.filter(header => !signedHeadersList.includes(header));
      
      if (missingHeaders.length > 0) {
        console.warn('⚠️ Missing signed headers:', missingHeaders);
      } else {
        console.log('✅ All required headers are signed');
      }
    } else {
      console.warn('⚠️ No X-Amz-SignedHeaders parameter found');
    }
    
  } catch (error) {
    console.error('❌ Error parsing URL:', error);
  }
}

// 3. Generate cURL command for testing
function generateCurlCommand(presignedUrl, file) {
  console.log('📋 Generated cURL command:');
  console.log('');
  console.log(`curl -v -X PUT "${presignedUrl}" \\`);
  console.log(`  -H "Content-Type: application/octet-stream" \\`);
  console.log(`  -H "x-amz-server-side-encryption: AES256" \\`);
  console.log(`  -H "x-amz-acl: private" \\`);
  console.log(`  --data-binary @test-file.bin`);
  console.log('');
  console.log('💡 Save this command and test it in CloudShell or terminal');
}

// 4. Compare browser request with expected headers
function validateRequestHeaders() {
  console.log('🔍 Expected headers for presigned URL upload:');
  console.log('');
  console.log('Required headers:');
  console.log('- Content-Type: application/octet-stream');
  console.log('- x-amz-server-side-encryption: AES256');
  console.log('- x-amz-acl: private');
  console.log('');
  console.log('❌ DO NOT include:');
  console.log('- Authorization (presigned URLs authorize via query string)');
  console.log('- Any AWS headers (x-amz-date, etc.)');
  console.log('- Custom headers not in X-Amz-SignedHeaders');
  console.log('');
  console.log('✅ DO include:');
  console.log('- credentials: "omit" in fetch options');
  console.log('- Use URL exactly as returned from backend');
  console.log('- No URL encoding or modification');
}

// 5. Test CORS preflight
async function testCorsPreflight(presignedUrl) {
  console.log('🌐 Testing CORS preflight...');
  
  try {
    // This will trigger a preflight request
    const resp = await fetch(presignedUrl, {
      method: "OPTIONS",
      headers: {
        "Content-Type": "application/octet-stream",
        "x-amz-server-side-encryption": "AES256",
        "x-amz-acl": "private"
      }
    });
    
    console.log('Preflight response status:', resp.status);
    console.log('Preflight response headers:', Object.fromEntries(resp.headers.entries()));
    
    if (resp.status === 200) {
      console.log('✅ CORS preflight successful');
    } else {
      console.warn('⚠️ CORS preflight may have issues');
    }
    
  } catch (error) {
    console.error('❌ CORS preflight failed:', error);
  }
}

// Usage examples:
console.log('🚀 DeadDropper Debug Tools Loaded!');
console.log('');
console.log('Available functions:');
console.log('- testMinimalUpload(presignedUrl, file)');
console.log('- inspectPresignedUrl(url)');
console.log('- generateCurlCommand(presignedUrl, file)');
console.log('- validateRequestHeaders()');
console.log('- testCorsPreflight(presignedUrl)');
console.log('');
console.log('Example usage:');
console.log('inspectPresignedUrl("YOUR_PRESIGNED_URL_HERE")');
console.log('validateRequestHeaders()');

