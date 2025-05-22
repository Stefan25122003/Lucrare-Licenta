const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const authRoutes = require('./routes/auth');
const pollRoutes = require('./routes/polls');
const securePollRoutes = require('./routes/securePolls');
const userRoutes = require('./routes/users'); // Adăugăm rutele utilizatorilor

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Servirea fișierelor statice din directorul uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Conectat la MongoDB cu succes'))
.catch((err) => console.error('Eroare la conectarea MongoDB:', err));

// Adaugă rutele
app.use('/api/auth', authRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/secure-polls', securePollRoutes);
app.use('/api/users', userRoutes); // Adăugăm rutele utilizatorilor

app.listen(PORT, () => {
  console.log(`Serverul rulează pe portul ${PORT}`);
});