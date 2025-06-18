const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const SecurePoll = require('../models/SecurePoll');
const BlindToken = require('../models/BlindToken');
const cryptoUtils = require('../utils/cryptoUtils');

// Initialize the system and get public key
router.get('/authority-key', async (req, res) => {
  try {
    const initResult = await cryptoUtils.initialize();
    res.json({ publicKey: initResult.publicKey });
  } catch (error) {
    console.error('Error initializing cryptography:', error);
    res.status(500).json({ message: 'Error initializing authority', error });
  }
});

// Create a new secure poll
router.post('/', async (req, res) => {
  try {
    const { title, options, endDate } = req.body;
    
    const newPoll = new SecurePoll({
      title,
      options: options.map(opt => ({ text: opt })),
      endDate: new Date(endDate)
    });
    
    await newPoll.save();
    res.status(201).json(newPoll);
  } catch (error) {
    res.status(500).json({ message: 'Error creating secure poll', error });
  }
});

// Get all active secure polls
router.get('/', async (req, res) => {
  try {
    const polls = await SecurePoll.find({ 
      isActive: true,
      endDate: { $gt: new Date() }
    });
    res.json(polls);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching secure polls', error });
  }
});

// Request a blind signature for voting
router.post('/request-signature', (req, res) => {
  try {
    const { blindedToken } = req.body;
    
    // Authority signs the blind token without knowing its content
    const signature = cryptoUtils.signBlindToken(blindedToken);
    
    res.json({ signature });
  } catch (error) {
    res.status(500).json({ message: 'Error generating signature', error });
  }
});

// Cast an anonymous encrypted vote
router.post('/:pollId/vote', async (req, res) => {
  try {
    const { pollId } = req.params;
    const { vote, signedToken, message } = req.body;
    
    // Verify the token
    if (!cryptoUtils.verifyToken(signedToken, message)) {
      return res.status(400).json({ message: 'Invalid or used token' });
    }
    
    // Create a hash of the token to prevent reuse
    const tokenHash = crypto.createHash('sha256').update(signedToken).digest('hex');
    
    // Check if this token has been used before
    const existingToken = await BlindToken.findOne({ tokenHash });
    if (existingToken) {
      return res.status(400).json({ message: 'This token has already been used' });
    }
    
    // Store the token as used
    await new BlindToken({
      tokenHash,
      pollId
    }).save();
    
    // Get the poll
    const poll = await SecurePoll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }
    
    if (!poll.isActive || new Date() > new Date(poll.endDate)) {
      return res.status(400).json({ message: 'This poll is no longer active' });
    }
    
    // Convert vote to one-hot encoding
    const oneHotVote = Array(poll.options.length).fill(0);
    oneHotVote[vote] = 1;
    
    // Encrypt the vote
    const encryptedVote = await cryptoUtils.encryptVote(oneHotVote);
    
    // Add encrypted vote to the poll
    poll.encryptedVotes.push(encryptedVote);
    await poll.save();
    
    res.json({ message: 'Vote cast successfully' });
  } catch (error) {
    console.error('Error casting vote:', error);
    res.status(500).json({ message: 'Error casting vote', error });
  }
});

// Close a poll and calculate results (only for admins in a real app)
router.post('/:pollId/close', async (req, res) => {
  try {
    const { pollId } = req.params;
    
    const poll = await SecurePoll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }
    
    // Close the poll
    poll.isActive = false;
    
    // If there are no votes, return zeros
    if (poll.encryptedVotes.length === 0) {
      poll.finalResults = poll.options.map((option) => ({
        text: option.text,
        votes: 0
      }));
      await poll.save();
      return res.json(poll);
    }
    
    // Add all encrypted votes (using homomorphic properties)
    const encryptedSum = await cryptoUtils.addEncryptedVotes(poll.encryptedVotes);
    
    // Decrypt only the final sum
    const decryptedResults = await cryptoUtils.decryptResult(encryptedSum);
    
    // Update the poll with final results (take only as many results as we have options)
    poll.finalResults = poll.options.map((option, index) => ({
      text: option.text,
      votes: decryptedResults[index] || 0
    }));
    
    await poll.save();
    
    res.json(poll);
  } catch (error) {
    console.error('Error closing poll:', error);
    res.status(500).json({ message: 'Error closing poll', error });
  }
});

// Get a single secure poll by ID
router.get('/:pollId', async (req, res) => {
  try {
    const { pollId } = req.params;
    const poll = await SecurePoll.findById(pollId);
    
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }
    
    res.json(poll);
  } catch (error) {
    console.error('Error fetching poll:', error);
    res.status(500).json({ message: 'Error fetching poll', error });
  }
});

module.exports = router;