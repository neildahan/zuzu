const express = require('express');
const router = express.Router();
const controller = require('../controllers/admin');

router.get('/stats', controller.stats);
router.get('/users', controller.getUsers);
router.delete('/users/:id', controller.deleteUser);
router.patch('/users/:id', controller.updateUser);
router.get('/programs', controller.getPrograms);
router.get('/workout-logs', controller.getWorkoutLogs);
router.post('/exercise-templates', controller.createTemplate);
router.patch('/exercise-templates/:id', controller.updateTemplate);
router.delete('/exercise-templates/:id', controller.deleteTemplate);

module.exports = router;
