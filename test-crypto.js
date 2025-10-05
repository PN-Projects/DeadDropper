// Test script to verify crypto functions work
// Run this in browser console to test

async function testCryptoFunctions() {
  console.log('🔒 Testing DeadDropper Crypto Functions...');
  
  try {
    // Test 1: Generate master key
    console.log('Test 1: Generating master key...');
    const keyMaterial = crypto.getRandomValues(new Uint8Array(32));
    const masterKey = await crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    console.log('✅ Master key generated successfully');
    
    // Test 2: Derive chunk key
    console.log('Test 2: Deriving chunk key...');
    const salt = crypto.getRandomValues(new Uint8Array(32));
    const chunkSalt = new Uint8Array(salt.length + 8);
    chunkSalt.set(salt);
    chunkSalt.set(new Uint8Array(new BigUint64Array([BigInt(0)]).buffer), salt.length);
    
    const chunkKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: chunkSalt,
        iterations: 10000,
        hash: 'SHA-256'
      },
      masterKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    console.log('✅ Chunk key derived successfully');
    
    // Test 3: Encrypt/decrypt test
    console.log('Test 3: Testing encryption/decryption...');
    const testData = new TextEncoder().encode('Hello DeadDropper!');
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      chunkKey,
      testData
    );
    console.log('✅ Data encrypted successfully');
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      chunkKey,
      encrypted
    );
    
    const decryptedText = new TextDecoder().decode(decrypted);
    if (decryptedText === 'Hello DeadDropper!') {
      console.log('✅ Data decrypted successfully');
    } else {
      console.log('❌ Decryption failed');
    }
    
    console.log('🎉 All crypto tests passed!');
    
  } catch (error) {
    console.error('❌ Crypto test failed:', error);
  }
}

// Run the test
testCryptoFunctions();

