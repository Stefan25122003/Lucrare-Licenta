const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

const authRoutes = require('./routes/auth');
const pollRoutes = require('./routes/polls');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Conectat la MongoDB cu succes'))
.catch((err) => console.error('Eroare la conectarea MongoDB:', err));

// Adaugă rutele
app.use('/api/auth', authRoutes);
app.use('/api/polls', pollRoutes);

app.listen(PORT, () => {
  console.log(`Serverul rulează pe portul ${PORT}`);
});