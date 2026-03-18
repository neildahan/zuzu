require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
}

// Mount routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/exercise-templates', require('./routes/exerciseTemplates'));
app.use('/api/users', require('./routes/users'));
app.use('/api/programs', require('./routes/programs'));
app.use('/api/programs/:programId/workouts', require('./routes/workouts'));
app.use('/api/workouts', require('./routes/workoutsDirect'));
app.use('/api/workouts/:workoutId/exercises', require('./routes/exercises'));
app.use('/api/exercises', require('./routes/exercisesDirect'));
app.use('/api/workout-logs', require('./routes/workoutLogs'));
app.use('/api/admin', require('./routes/admin'));

// SPA fallback — serve index.html for non-API routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(process.env.PORT || 3001, () => {
      console.log(`Server running on port ${process.env.PORT || 3001}`);
    });
  })
  .catch(err => console.error('MongoDB connection error:', err));
