const Program = require('../models/Program');

exports.create = async (req, res) => {
  try {
    // Deactivate previous active programs for this client
    if (req.validated.clientId) {
      await Program.updateMany(
        { clientId: req.validated.clientId, isActive: true },
        { isActive: false }
      );
    }
    const program = await Program.create(req.validated);
    res.status(201).json(program);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const filter = {};
    if (req.query.clientId) filter.clientId = req.query.clientId;
    if (req.query.trainerId) filter.trainerId = req.query.trainerId;
    if (req.query.active === 'true') filter.isActive = true;
    const programs = await Program.find(filter).sort({ createdAt: -1 });
    res.json(programs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) return res.status(404).json({ error: 'Program not found' });
    res.json(program);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const program = await Program.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!program) return res.status(404).json({ error: 'Program not found' });
    res.json(program);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const program = await Program.findByIdAndDelete(req.params.id);
    if (!program) return res.status(404).json({ error: 'Program not found' });
    res.json({ message: 'Program deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
