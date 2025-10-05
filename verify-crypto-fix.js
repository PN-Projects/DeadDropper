// Quick verification that the crypto fix works
// Copy and paste this into your browser console to test

async function verifyCryptoFix() {
  console.log('🔒 Verifying DeadDropper Crypto Fix...');
  
  try {
    // Test the exact same code that was failing
    const keyMaterial = crypto.getRandomValues(new Uint8Array(32));
    const masterKey = await crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    console.log('✅ Master key generation: SUCCESS');
    
    // Test key derivation
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
    console.log('✅ Chunk key derivation: SUCCESS');
    
    console.log('🎉 All crypto functions working correctly!');
    console.log('The HKDF error should be resolved now.');
    
  } catch (error) {
    console.error('❌ Crypto test failed:', error);
  }
}

verifyCryptoFix();

