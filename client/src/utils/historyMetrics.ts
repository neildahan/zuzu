/**
 * Compute weight progression: max weight per session date.
 * @param {Array} entries - workout log exercises with sets
 * @param {Array} logs - parent logs (for date)
 * @param {string} exerciseId
 * @returns {Array<{date: string, maxWeight: number}>}
 */
function getExerciseKey(ex) {
  const info = ex.exerciseId && typeof ex.exerciseId === 'object' ? ex.exerciseId : null;
  // Prefer templateId as stable key
  if (ex.templateId) return ex.templateId.toString();
  if (info?.templateId) return info.templateId.toString();
  // Fallback to name
  return (info?.name || ex.name || '').toLowerCase().trim();
}

function matchExercise(ex, exerciseKey) {
  return getExerciseKey(ex) === exerciseKey;
}

export function computeWeightProgression(logs, exerciseId, locale) {
  const loc = locale === 'he' ? 'he-IL' : 'en-US';
  const points = [];
  for (const log of logs) {
    const ex = log.exercises.find(e => matchExercise(e, exerciseId));
    if (!ex) continue;
    const maxWeight = Math.max(...ex.sets.filter(s => s.isCompleted).map(s => s.weight || 0));
    if (maxWeight > 0) {
      points.push({
        date: new Date(log.date).toLocaleDateString(loc, { month: 'short', day: 'numeric' }),
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
export function computeVolumeProgression(logs, exerciseId, locale) {
  const loc = locale === 'he' ? 'he-IL' : 'en-US';
  const points = [];
  for (const log of logs) {
    const ex = log.exercises.find(e => matchExercise(e, exerciseId));
    if (!ex) continue;
    const totalVolume = ex.sets
      .filter(s => s.isCompleted)
      .reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0);
    if (totalVolume > 0) {
      points.push({
        date: new Date(log.date).toLocaleDateString(loc, { month: 'short', day: 'numeric' }),
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
    const ex = log.exercises.find(e => matchExercise(e, exerciseId));
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
      const info = ex.exerciseId && typeof ex.exerciseId === 'object' ? ex.exerciseId : null;
      const mg = info?.muscleGroup || ex.muscleGroup;
      if (!mg) continue;
      const vol = ex.sets
        .filter(s => s.isCompleted)
        .reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0);
      groups[mg] = (groups[mg] || 0) + vol;
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
      const info = ex.exerciseId && typeof ex.exerciseId === 'object' ? ex.exerciseId : null;
      const name = info?.name || ex.name;
      const nameHe = info?.nameHe || ex.nameHe || '';
      const mg = info?.muscleGroup || ex.muscleGroup || '';
      if (!name && !nameHe) continue;

      const key = getExerciseKey(ex);
      if (!map.has(key)) {
        map.set(key, { _id: key, name: name || nameHe, nameHe, muscleGroup: mg });
      } else {
        const existing = map.get(key);
        if (name && /^[a-zA-Z]/.test(name) && !/^[a-zA-Z]/.test(existing.name)) existing.name = name;
        if (nameHe && !existing.nameHe) existing.nameHe = nameHe;
        if (mg && !existing.muscleGroup) existing.muscleGroup = mg;
      }
    }
  }
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
