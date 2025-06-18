const homomorphicEncryption = require('./homomorphicEncryption');
const blindSignatureAuthority = require('./blindSignature');

// Exportă toate funcțiile necesare
module.exports = {
  // Inițializează sistemul și returnează cheia publică
  initialize: async function() {
    return {
      publicKey: blindSignatureAuthority.getPublicKey()
    };
  },
  
  // Metode pentru criptare homomorfică
  encryptVote: homomorphicEncryption.encryptVote.bind(homomorphicEncryption),
  addEncryptedVotes: homomorphicEncryption.addEncryptedVotes.bind(homomorphicEncryption),
  decryptResult: homomorphicEncryption.decryptResult.bind(homomorphicEncryption),
  
  // Metode pentru blind signatures
  getPublicKey: blindSignatureAuthority.getPublicKey.bind(blindSignatureAuthority),
  signBlindToken: blindSignatureAuthority.signBlindToken.bind(blindSignatureAuthority),
  verifyToken: blindSignatureAuthority.verifyToken.bind(blindSignatureAuthority)
};