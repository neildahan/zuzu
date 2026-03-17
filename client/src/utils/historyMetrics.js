/**
 * Compute weight progression: max weight per session date.
 * @param {Array} entries - workout log exercises with sets
 * @param {Array} logs - parent logs (for date)
 * @param {string} exerciseId
 * @returns {Array<{date: string, maxWeight: number}>}
 */
export function computeWeightProgression(logs, exerciseId) {
  const points = [];
  for (const log of logs) {
    const ex = log.exercises.find(
      (e) => (e.exerciseId?._id || e.exerciseId)?.toString() === exerciseId
    );
    if (!ex) continue;
    const maxWeight = Math.max(...ex.sets.filter(s => s.isCompleted).map(s => s.weight || 0));
    if (maxWeight > 0) {
      points.push({
        date: new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        rawDate: new Date(log.date),
        maxWeight,
      });
    }
  }
  return points;
}

/**
 * Compute volume progression: total volume (weight * reps) per session.
 */
export function computeVolumeProgression(logs, exerciseId) {
  const points = [];
  for (const log of logs) {
    const ex = log.exercises.find(
      (e) => (e.exerciseId?._id || e.exerciseId)?.toString() === exerciseId
    );
    if (!ex) continue;
    const totalVolume = ex.sets
      .filter(s => s.isCompleted)
      .reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0);
    if (totalVolume > 0) {
      points.push({
        date: new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        rawDate: new Date(log.date),
        totalVolume,
      });
    }
  }
  return points;
}

/**
 * Compute best set per session: highest weight * reps single set.
 */
export function computeBestSet(logs, exerciseId) {
  let best = null;
  for (const log of logs) {
    const ex = log.exercises.find(
      (e) => (e.exerciseId?._id || e.exerciseId)?.toString() === exerciseId
    );
    if (!ex) continue;
    for (const s of ex.sets.filter(s => s.isCompleted)) {
      const score = (s.weight || 0) * (s.reps || 0);
      if (!best || score > best.score) {
        best = { weight: s.weight, reps: s.reps, score };
      }
    }
  }
  return best;
}

/**
 * Compute volume distribution by muscle group across all logs.
 */
export function computeMuscleGroupVolume(logs) {
  const groups = {};
  for (const log of logs) {
    for (const ex of log.exercises) {
      const info = ex.exerciseId; // populated
      if (!info || !info.muscleGroup) continue;
      const vol = ex.sets
        .filter(s => s.isCompleted)
        .reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0);
      groups[info.muscleGroup] = (groups[info.muscleGroup] || 0) + vol;
    }
  }
  return Object.entries(groups)
    .map(([muscleGroup, volume]) => ({ muscleGroup, volume }))
    .sort((a, b) => b.volume - a.volume);
}

/**
 * Extract unique exercises from logs (populated exerciseId).
 * Groups them by muscle group.
 */
export function extractExercises(logs) {
  const map = new Map();
  for (const log of logs) {
    for (const ex of log.exercises) {
      const info = ex.exerciseId;
      if (!info || !info._id) continue;
      if (!map.has(info._id)) {
        map.set(info._id, {
          _id: info._id,
          name: info.name,
          nameHe: info.nameHe,
          muscleGroup: info.muscleGroup,
        });
      }
    }
  }
  // Group by muscle group
  const exercises = Array.from(map.values());
  const grouped = {};
  for (const ex of exercises) {
    const g = ex.muscleGroup || 'Other';
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(ex);
  }
  return grouped;
}

/**
 * Compute summary stats from all logs.
 */
export function computeSummaryStats(logs) {
  const totalSessions = logs.length;
  const totalVolume = logs.reduce((sum, log) => {
    return sum + log.exercises.reduce((eSum, ex) => {
      return eSum + ex.sets
        .filter(s => s.isCompleted)
        .reduce((sSum, s) => sSum + (s.weight || 0) * (s.reps || 0), 0);
    }, 0);
  }, 0);
  const weeks = new Set(logs.map(l => {
    const d = new Date(l.date);
    const start = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d - start) / 86400000 + start.getDay() + 1) / 7);
  }));
  return { totalSessions, totalVolume, activeWeeks: weeks.size };
}
