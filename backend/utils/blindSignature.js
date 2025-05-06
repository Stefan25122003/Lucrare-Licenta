const crypto = require('crypto');
const { BlindSignature } = require('blind-signatures');

class BlindSignatureAuthority {
  constructor() {
    // Generate RSA key pair for the authority
    this.keyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });
    
    // Track issued and used tokens
    this.issuedTokens = new Set();
    this.usedTokens = new Set();
  }
  
  // Get the public key
  getPublicKey() {
    return this.keyPair.publicKey;
  }
  
  // Sign a blinded message
  signBlindToken(blindedToken) {
    try {
      // Create a real blind signature
      const signature = BlindSignature.sign({
        blinded: blindedToken,
        key: this.keyPair.privateKey
      });
      
      // Store signature hash to track issued tokens
      const signatureHash = crypto.createHash('sha256').update(signature).digest('hex');
      this.issuedTokens.add(signatureHash);
      
      return signature;
    } catch (error) {
      console.error('Error signing blind token:', error);
      throw error;
    }
  }
  
  // Verify a token and mark it as used if valid
  verifyToken(token, message) {
    try {
      // Check if already used
      if (this.usedTokens.has(token)) {
        return false;
      }
      
      // Verify the signature
      const isValid = BlindSignature.verify({
        unblinded: token,
        message: message,
        key: this.keyPair.publicKey
      });
      
      if (isValid) {
        // Track as used to prevent double-voting
        this.usedTokens.add(token);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error verifying token:', error);
      return false;
    }
  }
}

// Create a singleton instance
const authority = new BlindSignatureAuthority();

module.exports = authority;