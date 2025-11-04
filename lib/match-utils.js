// lib/match-utils.js
export async function computeMatchScore(jobMeta, candidateMeta, weights = {}) {
  // Default weights if not provided
  const w = {
    skills: weights.skills || 0.4,
    location: weights.location || 0.2,
    salary: weights.salary || 0.15,
    education: weights.education || 0.15,
    experience: weights.experience || 0.1
  };

  // Normalize weights to sum to 1
  const total = Object.values(w).reduce((s, v) => s + v, 0);
  Object.keys(w).forEach(k => w[k] /= total);

  // Feature extraction
  const features = {
    skills: (() => {
      const jobSkills = Array.isArray(jobMeta.skills) ? jobMeta.skills : [];
      const candSkills = Array.isArray(candidateMeta.skills) ? candidateMeta.skills : [];
      const matched = jobSkills.filter(s => candSkills.includes(s)).length;
      return jobSkills.length > 0 ? matched / jobSkills.length : 0;
    })(),
    location: jobMeta.location === candidateMeta.location ? 1 : 0,
    salary: (() => {
      const jobAvg = jobMeta.salary ? (jobMeta.salary.min + jobMeta.salary.max) / 2 : 0;
      const candAvg = candidateMeta.salary ? (candidateMeta.salary.min + candidateMeta.salary.max) / 2 : 0;
      if (jobAvg === 0) return 0.5; // Neutral if no salary data
      return 1 - Math.min(Math.abs(jobAvg - candAvg) / jobAvg, 1);
    })(),
    education: candidateMeta.education === jobMeta.education ? 1 : 
               candidateMeta.education && jobMeta.education ? 0.7 : 0.5,
    experience: (() => {
      const jobExp = jobMeta.experience?.min || 0;
      const candExp = candidateMeta.experience?.years || candidateMeta.experience || 0;
      if (jobExp === 0) return 1;
      return Math.min(candExp / jobExp, 1);
    })()
  };

  // Weighted score
  let score = 0;
  let totalWeight = 0;
  for (const [key, value] of Object.entries(features)) {
    if (w[key] !== undefined) {
      score += w[key] * value;
      totalWeight += w[key];
    }
  }

  return totalWeight > 0 ? (score / totalWeight) * 100 : 0;
}

