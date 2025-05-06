const express = require('express');
const Poll = require('../models/Poll');
const User = require('../models/User');
const router = express.Router();

// Creează sondaj
router.post('/', async (req, res) => {
  try {
    const { title, options, userId } = req.body;
    const newPoll = new Poll({
      title,
      options: options.map(opt => ({ text: opt, votes: 0 })),
      createdBy: userId
    });
    await newPoll.save();
    res.status(201).json(newPoll);
  } catch (error) {
    res.status(500).json({ message: 'Eroare la crearea sondajului', error });
  }
});

// Listează sondaje active
router.get('/', async (req, res) => {
  try {
    const polls = await Poll.find({ isActive: true });
    res.json(polls);
  } catch (error) {
    res.status(500).json({ message: 'Eroare la preluarea sondajelor', error });
  }
});

// Votează
router.post('/:pollId/vote', async (req, res) => {
  try {
    const { pollId } = req.params;
    const { optionIndex, userId } = req.body;

    const poll = await Poll.findById(pollId);
    const user = await User.findById(userId);

    if (!poll) return res.status(404).json({ message: 'Sondaj negăsit' });
    if (!user) return res.status(404).json({ message: 'Utilizator negăsit' });

    // Verifică dacă utilizatorul a mai votat
    if (user.votedPolls.includes(pollId)) {
      return res.status(400).json({ message: 'Ai votat deja în acest sondaj' });
    }

    // Incrementează voturile
    poll.options[optionIndex].votes += 1;
    user.votedPolls.push(pollId);

    await poll.save();
    await user.save();

    res.json(poll);
  } catch (error) {
    res.status(500).json({ message: 'Eroare la votare', error });
  }
});

module.exports = router;