const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Înregistrare utilizator
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Verifică dacă utilizatorul există deja
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Utilizatorul există deja' });
    }

    // Hash parolă
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Creează utilizator nou
    user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    res.status(201).json({ message: 'Utilizator înregistrat cu succes' });
  } catch (error) {
    res.status(500).json({ message: 'Eroare la înregistrare', error });
  }
});

// Autentificare
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Verifică utilizatorul
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Credențiale invalide' });
    }

    // Verifică parola
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credențiale invalide' });
    }

    // Generează token
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email 
      } 
    });
  } catch (error) {
    res.status(500).json({ message: 'Eroare la autentificare', error });
  }
});

module.exports = router;