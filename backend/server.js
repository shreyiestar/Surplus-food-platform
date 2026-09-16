require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const donationRoutes = require('./routes/donations');
const assignmentRoutes = require('./routes/assignments');
const userRoutes = require('./routes/users');
const ratingRoutes = require('./routes/ratings');
const publicRoutes = require('./routes/public');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/public', publicRoutes);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});