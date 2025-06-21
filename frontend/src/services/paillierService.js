// paillierService.js - FIXED IMPLEMENTATION
import forge from 'node-forge';

class PaillierService {
  constructor() {
    this.publicKey = null;
    this.n = null;
    this.g = null;
    this.nsquared = null;
    this.initialized = false;
    
    console.log('🔐 Paillier Service constructed');
  }

  /**
   * ✅ FIXED: Initialize with public key from server
   */
  initializeWithPublicKey(publicKeyData) {
    try {
      console.log('🔐 Initializing Paillier with public key from server...');
      console.log('🔍 Public key data:', {
        hasN: !!publicKeyData.n,
        hasG: !!publicKeyData.g,
        nType: typeof publicKeyData.n,
        gType: typeof publicKeyData.g,
        nLength: publicKeyData.n ? publicKeyData.n.length : 0,
        gLength: publicKeyData.g ? publicKeyData.g.length : 0
      });
      
      if (!publicKeyData.n || !publicKeyData.g) {
        throw new Error('Missing n or g in public key data');
      }
      
      // Convert string representations to BigInteger
      this.n = new forge.jsbn.BigInteger(publicKeyData.n, 10);
      this.g = new forge.jsbn.BigInteger(publicKeyData.g, 10);
      this.nsquared = this.n.multiply(this.n);
      
      // Validate key parameters
      if (this.n.bitLength() < 1024) {
        throw new Error(`Key too short: ${this.n.bitLength()} bits (minimum 1024)`);
      }
      
      if (this.g.compareTo(this.nsquared) >= 0) {
        throw new Error('Invalid generator g (must be < n²)');
      }
      
      this.publicKey = {
        n: this.n,
        g: this.g,
        nsquared: this.nsquared
      };
      
      this.initialized = true;
      
      console.log('✅ Paillier public key initialized successfully');
      console.log(`🔑 n bitLength: ${this.n.bitLength()}`);
      console.log(`🔑 g: ${this.g.toString(16).substring(0, 50)}...`);
      console.log(`🔑 n²: ${this.nsquared.toString(16).substring(0, 50)}...`);
      
      return true;
      
    } catch (error) {
      console.error('❌ Error initializing Paillier:', error);
      this.initialized = false;
      throw error;
    }
  }

  /**
   * ✅ FIXED: Encrypt with proper random number generation
   */
  encrypt(plaintext) {
    try {
      if (!this.initialized || !this.publicKey) {
        throw new Error('Paillier public key not initialized');
      }

      console.log(`🔐 Encrypting plaintext: ${plaintext}`);

      // Validate input
      if (typeof plaintext !== 'number' || plaintext < 0) {
        throw new Error(`Invalid plaintext: ${plaintext} (must be non-negative number)`);
      }

      // Convert plaintext to BigInteger
      const m = new forge.jsbn.BigInteger(plaintext.toString(), 10);
      
      // Ensure plaintext is smaller than n
      if (m.compareTo(this.n) >= 0) {
        throw new Error('Plaintext must be smaller than n');
      }

      // Generate secure random factor r where 1 < r < n and gcd(r, n) = 1
      let r;
      let attempts = 0;
      const maxAttempts = 100;
      
      do {
        attempts++;
        if (attempts > maxAttempts) {
          throw new Error('Failed to generate valid random factor after ' + maxAttempts + ' attempts');
        }
        
        // Generate random bytes (same bit length as n)
        const randomBits = this.n.bitLength();
        const randomBytes = Math.ceil(randomBits / 8);
        const randomData = forge.random.getBytesSync(randomBytes);
        const randomHex = forge.util.bytesToHex(randomData);
        
        r = new forge.jsbn.BigInteger(randomHex, 16);
        r = r.mod(this.n);
        
      } while (r.equals(forge.jsbn.BigInteger.ZERO) || 
               r.equals(forge.jsbn.BigInteger.ONE) ||
               !r.gcd(this.n).equals(forge.jsbn.BigInteger.ONE));

      console.log(`🎲 Generated random factor r after ${attempts} attempts`);

      // Calculate g^m mod n²
      const gPowM = this.g.modPow(m, this.nsquared);
      console.log(`🔐 g^m calculated`);
      
      // Calculate r^n mod n²
      const rPowN = r.modPow(this.n, this.nsquared);
      console.log(`🔐 r^n calculated`);
      
      // Calculate final ciphertext: c = g^m * r^n mod n²
      const ciphertext = gPowM.multiply(rPowN).mod(this.nsquared);
      console.log(`🔐 Final ciphertext calculated`);
      
      const result = {
        ciphertext: ciphertext.toString(10),
        exponent: 0, // Standard Paillier exponent
        randomFactor: r.toString(16) // For debugging (remove in production)
      };

      console.log(`✅ Encryption successful: ${result.ciphertext.substring(0, 50)}...`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Error encrypting:', error);
      throw error;
    }
  }

  /**
   * ✅ FIXED: Encrypt vote vector with validation
   */
  encryptVoteVector(voteVector) {
    try {
      console.log(`🔐 Encrypting vote vector: [${voteVector.join(', ')}]`);
      
      if (!this.initialized || !this.publicKey) {
        throw new Error('Paillier public key not initialized');
      }

      if (!Array.isArray(voteVector) || voteVector.length === 0) {
        throw new Error('Vote vector must be non-empty array');
      }

      const encryptedVector = [];

      for (let i = 0; i < voteVector.length; i++) {
        const vote = voteVector[i];
        
        // Validate that vote is 0 or 1
        if (vote !== 0 && vote !== 1) {
          throw new Error(`Vote must be 0 or 1, got ${vote} at index ${i}`);
        }

        console.log(`🔐 Encrypting vote[${i}]: ${vote}`);
        
        const encryptedVote = this.encrypt(vote);
        
        // Remove random factor from result (security)
        const cleanResult = {
          ciphertext: encryptedVote.ciphertext,
          exponent: encryptedVote.exponent
        };
        
        encryptedVector.push(cleanResult);
        
        console.log(`✅ Encrypted vote[${i}]: ${cleanResult.ciphertext.substring(0, 30)}...`);
      }

      console.log(`✅ Vote vector encrypted successfully: ${encryptedVector.length} elements`);
      return encryptedVector;
      
    } catch (error) {
      console.error('❌ Error encrypting vote vector:', error);
      throw error;
    }
  }

  /**
   * ✅ FIXED: Test encryption with proper validation
   */
  testEncryption() {
    try {
      console.log('🧪 Testing Paillier encryption...');
      
      if (!this.initialized) {
        return {
          success: false,
          error: 'Not initialized'
        };
      }

      // Test encrypting 0 and 1
      const testValues = [0, 1];
      const results = [];

      for (const value of testValues) {
        console.log(`🧪 Testing encryption of ${value}...`);
        
        const encrypted = this.encrypt(value);
        
        if (!encrypted || !encrypted.ciphertext) {
          throw new Error(`Encryption of ${value} failed`);
        }
        
        // Verify ciphertext is valid
        const ciphertext = new forge.jsbn.BigInteger(encrypted.ciphertext, 10);
        
        if (ciphertext.compareTo(forge.jsbn.BigInteger.ZERO) <= 0 ||
            ciphertext.compareTo(this.nsquared) >= 0) {
          throw new Error(`Invalid ciphertext for ${value}`);
        }
        
        results.push({
          plaintext: value,
          ciphertext: encrypted.ciphertext.substring(0, 50) + '...',
          valid: true
        });
        
        console.log(`✅ Encryption test for ${value}: PASSED`);
      }

      // Test vector encryption
      console.log('🧪 Testing vote vector encryption...');
      const testVector = [1, 0];
      const encryptedVector = this.encryptVoteVector(testVector);
      
      if (!encryptedVector || encryptedVector.length !== 2) {
        throw new Error('Vote vector encryption failed');
      }

      console.log('✅ All Paillier encryption tests passed');
      
      return {
        success: true,
        individual_tests: results,
        vector_test: {
          input: testVector,
          output_length: encryptedVector.length,
          valid: true
        },
        key_info: this.getPublicKeyInfo()
      };
      
    } catch (error) {
      console.error('❌ Paillier encryption test failed:', error);
      
      return {
        success: false,
        error: error.message,
        key_info: this.getPublicKeyInfo()
      };
    }
  }

  /**
   * ✅ Check if service is properly initialized
   */
  isInitialized() {
    const initialized = this.initialized && 
                      this.publicKey !== null && 
                      this.n !== null && 
                      this.g !== null &&
                      this.nsquared !== null;
    
    console.log(`🔍 Paillier initialized check: ${initialized}`);
    return initialized;
  }

  /**
   * ✅ Get public key information for debugging
   */
  getPublicKeyInfo() {
    if (!this.publicKey) {
      return {
        initialized: false,
        error: 'Not initialized'
      };
    }

    try {
      return {
        initialized: true,
        n_bitLength: this.n.bitLength(),
        n_preview: this.n.toString(16).substring(0, 40) + '...',
        g_preview: this.g.toString(16).substring(0, 20) + '...',
        nsquared_bitLength: this.nsquared.bitLength(),
        valid_key_size: this.n.bitLength() >= 1024
      };
    } catch (error) {
      return {
        initialized: false,
        error: error.message
      };
    }
  }

  /**
   * ✅ Validate ciphertext format
   */
  validateCiphertext(encryptedData) {
    try {
      if (!encryptedData || typeof encryptedData !== 'object') {
        return false;
      }

      if (!encryptedData.ciphertext || typeof encryptedData.ciphertext !== 'string') {
        return false;
      }

      if (typeof encryptedData.exponent !== 'number') {
        return false;
      }

      // Try to parse ciphertext as BigInteger
      const ciphertext = new forge.jsbn.BigInteger(encryptedData.ciphertext, 10);
      
      // Check if ciphertext is in valid range
      if (ciphertext.compareTo(forge.jsbn.BigInteger.ZERO) <= 0) {
        return false;
      }

      if (this.nsquared && ciphertext.compareTo(this.nsquared) >= 0) {
        return false;
      }

      return true;
      
    } catch (error) {
      console.error('❌ Ciphertext validation error:', error);
      return false;
    }
  }

  /**
   * ✅ Get encryption statistics
   */
  getEncryptionStats() {
    if (!this.isInitialized()) {
      return null;
    }

    return {
      key_size_bits: this.n.bitLength(),
      security_level: this.n.bitLength() >= 2048 ? 'High' : this.n.bitLength() >= 1024 ? 'Medium' : 'Low',
      max_plaintext_bits: this.n.bitLength() - 1,
      ciphertext_size_bits: this.nsquared.bitLength(),
      homomorphic_operations: ['Addition', 'Scalar multiplication'],
      algorithm: 'Paillier Homomorphic Encryption'
    };
  }
}

export default PaillierService;