require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { requireAuth, requireAdmin } = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
}

// Public routes (no auth needed)
app.use('/api/auth', require('./routes/auth'));

// Protected routes (require valid JWT)
app.use('/api/exercise-templates', requireAuth, require('./routes/exerciseTemplates'));
app.use('/api/users', requireAuth, require('./routes/users'));
app.use('/api/programs', requireAuth, require('./routes/programs'));
app.use('/api/programs/:programId/workouts', requireAuth, require('./routes/workouts'));
app.use('/api/workouts', requireAuth, require('./routes/workoutsDirect'));
app.use('/api/workouts/:workoutId/exercises', requireAuth, require('./routes/exercises'));
app.use('/api/exercises', requireAuth, require('./routes/exercisesDirect'));
app.use('/api/workout-logs', requireAuth, require('./routes/workoutLogs'));

// Admin routes (require auth + admin role)
app.use('/api/admin', requireAuth, requireAdmin, require('./routes/admin'));

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
