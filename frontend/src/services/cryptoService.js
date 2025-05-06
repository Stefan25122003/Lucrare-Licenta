import axios from 'axios';
import { BlindSignature } from 'blind-signatures';
import cryptoRandomString from 'crypto-random-string';

class CryptoService {
  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    this.authorityPublicKey = null;
    this.currentBlinding = null;
    this.currentMessage = null;
  }

  // Initialize by fetching the authority's public key
  async initialize() {
    try {
      const response = await axios.get(`${this.apiUrl}/secure-polls/authority-key`);
      this.authorityPublicKey = response.data.publicKey;
      return this.authorityPublicKey;
    } catch (error) {
      console.error('Failed to initialize crypto service:', error);
      throw error;
    }
  }

  // Generate a random voting token (message to be signed)
  generateVotingToken() {
    this.currentMessage = cryptoRandomString({ length: 32 });
    return this.currentMessage;
  }

  // Blind the token using real RSA blinding
  blindToken(message) {
    try {
      const { blinded, r } = BlindSignature.blind({
        message: message || this.currentMessage,
        key: this.authorityPublicKey
      });
      
      // Store the blinding factor to unblind later
      this.currentBlinding = r;
      
      return blinded;
    } catch (error) {
      console.error('Error blinding token:', error);
      throw error;
    }
  }

  // Request a signature from the authority
  async requestSignature(blindedToken) {
    try {
      const response = await axios.post(`${this.apiUrl}/secure-polls/request-signature`, {
        blindedToken
      });
      return response.data.signature;
    } catch (error) {
      console.error('Failed to request signature:', error);
      throw error;
    }
  }

  // Unblind the signature
  unblindSignature(blindedSignature) {
    try {
      const unblinded = BlindSignature.unblind({
        blinded: blindedSignature,
        r: this.currentBlinding,
        key: this.authorityPublicKey
      });
      
      return {
        signature: unblinded,
        message: this.currentMessage
      };
    } catch (error) {
      console.error('Error unblinding signature:', error);
      throw error;
    }
  }

  // Cast a vote anonymously
  async castVote(pollId, optionIndex, token) {
    try {
      await axios.post(`${this.apiUrl}/secure-polls/${pollId}/vote`, {
        vote: optionIndex,
        signedToken: token.signature,
        message: token.message
      });
      return true;
    } catch (error) {
      console.error('Failed to cast vote:', error);
      throw error;
    }
  }

  // Get a complete anonymous voting token
  async getAnonymousVotingToken() {
    // 1. Generate a random token message
    const message = this.generateVotingToken();
    
    // 2. Blind the token
    const blindedToken = this.blindToken(message);
    
    // 3. Request signature from authority
    const blindedSignature = await this.requestSignature(blindedToken);
    
    // 4. Unblind the signature
    return this.unblindSignature(blindedSignature);
  }
}

export default new CryptoService();