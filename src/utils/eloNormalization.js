// ELO Normalization utilities
// Converts ELO from 0-2000+ scale to 1-100 scale starting at 50

// Old ELO system: starts at 1000, typically ranges 800-1800
// New ELO system: starts at 50, ranges 1-100

export const OLD_ELO_START = 1000;
export const NEW_ELO_START = 50;
export const NEW_ELO_MIN = 1;
export const NEW_ELO_MAX = 100;

/**
 * Convert old ELO (1000-based) to new normalized ELO (50-based, 1-100 scale)
 * @param {number} oldElo - ELO in old system (typically 800-1800)
 * @returns {number} - ELO in new system (1-100, starting at 50)
 */
export function normalizeELO(oldElo) {
  if (typeof oldElo !== 'number' || isNaN(oldElo)) {
    return NEW_ELO_START; // Default to 50 for invalid inputs
  }

  // Handle edge cases
  if (oldElo <= 0) return NEW_ELO_MIN; // 1
  if (oldElo >= 2000) return NEW_ELO_MAX; // 100

  // Map old ELO range to new range
  // Old: 800-1800 -> New: 10-90 (with 50 as center)
  const oldMin = 800;
  const oldMax = 1800;
  const oldRange = oldMax - oldMin;
  
  // Normalize to 0-1 range first
  const normalized = Math.max(0, Math.min(1, (oldElo - oldMin) / oldRange));
  
  // Map to new range (10-90) with 50 as center
  const newRange = 80; // 90 - 10
  const newElo = Math.round(10 + (normalized * newRange));
  
  // Ensure bounds
  return Math.max(NEW_ELO_MIN, Math.min(NEW_ELO_MAX, newElo));
}

/**
 * Convert new normalized ELO back to old ELO for calculations
 * @param {number} newElo - ELO in new system (1-100)
 * @returns {number} - ELO in old system for calculations
 */
export function denormalizeELO(newElo) {
  if (typeof newElo !== 'number' || isNaN(newElo)) {
    return OLD_ELO_START; // Default to 1000 for invalid inputs
  }

  // Ensure bounds
  const clampedElo = Math.max(NEW_ELO_MIN, Math.min(NEW_ELO_MAX, newElo));
  
  // Map new range back to old range
  const oldMin = 800;
  const oldMax = 1800;
  const oldRange = oldMax - oldMin;
  
  // Normalize from 10-90 range to 0-1
  const normalized = (clampedElo - 10) / 80; // 80 is the range (90-10)
  
  // Map to old range
  const oldElo = oldMin + (normalized * oldRange);
  
  return Math.round(oldElo);
}

/**
 * Get display ELO (normalized) for UI
 * @param {number} oldElo - ELO in old system
 * @returns {number} - ELO in new system for display
 */
export function getDisplayELO(oldElo) {
  return normalizeELO(oldElo || OLD_ELO_START);
}

/**
 * Get calculation ELO (old system) for ELO updates
 * @param {number} newElo - ELO in new system
 * @returns {number} - ELO in old system for calculations
 */
export function getCalculationELO(newElo) {
  return denormalizeELO(newElo || NEW_ELO_START);
}

/**
 * Calculate new ELO using normalized system
 * @param {number} playerDisplayELO - Player's display ELO (1-100)
 * @param {number} opponentDisplayELO - Opponent's display ELO (1-100)
 * @param {number} playerScore - Player's score
 * @param {number} opponentScore - Opponent's score
 * @param {number} k - K-factor (default 8 for normalized system)
 * @returns {number} - New display ELO (1-100)
 */
export function calculateNormalizedELO(playerDisplayELO, opponentDisplayELO, playerScore, opponentScore, k = 8) {
  // Convert to old ELO for calculation
  const playerOldElo = denormalizeELO(playerDisplayELO);
  const opponentOldElo = denormalizeELO(opponentDisplayELO);
  
  // Use existing ELO calculation logic
  const totalScore = playerScore + opponentScore;
  if (totalScore === 0) return playerDisplayELO; // tie → no change
  
  const actualScore = playerScore / totalScore;
  const expectedScore = 1 / (1 + 10 ** ((opponentOldElo - playerOldElo) / 400));
  
  const newOldElo = playerOldElo + k * (actualScore - expectedScore);
  
  // Convert back to normalized ELO
  return normalizeELO(newOldElo);
}

/**
 * Get skill level description based on normalized ELO
 * @param {number} displayELO - ELO in new system (1-100)
 * @returns {string} - Skill level description
 */
export function getSkillLevel(displayELO) {
  if (displayELO >= 90) return "Elite";
  if (displayELO >= 80) return "Expert";
  if (displayELO >= 70) return "Advanced";
  if (displayELO >= 60) return "Intermediate+";
  if (displayELO >= 50) return "Intermediate";
  if (displayELO >= 40) return "Beginner+";
  if (displayELO >= 30) return "Beginner";
  if (displayELO >= 20) return "Novice";
  return "Rookie";
}

/**
 * Get ELO difference description for match suggestions
 * @param {number} eloDiff - ELO difference
 * @returns {object} - Match type and description
 */
export function getMatchType(eloDiff) {
  if (eloDiff <= 2) {
    return { type: 'perfect_match', message: 'Perfect match!', icon: '🎯', color: '#10b981' };
  } else if (eloDiff <= 5) {
    return { type: 'good_match', message: 'Great match!', icon: '⚔️', color: '#3b82f6' };
  } else if (eloDiff <= 10) {
    return { type: 'challenging_match', message: 'Challenging!', icon: '🔥', color: '#f59e0b' };
  } else {
    return { type: 'learning_match', message: 'Learning opportunity!', icon: '📚', color: '#ef4444' };
  }
}
