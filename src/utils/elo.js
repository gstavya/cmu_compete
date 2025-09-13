// src/utils/elo.js
import { calculateNormalizedELO as calcNormELO, normalizeELO, denormalizeELO } from './eloNormalization.js';

export function calculateELO(playerElo, opponentElo, playerScore, opponentScore, k = 32) {
    // Validate inputs
    if (typeof playerElo !== 'number' || typeof opponentElo !== 'number' || 
        typeof playerScore !== 'number' || typeof opponentScore !== 'number') {
        console.error('Invalid ELO calculation inputs:', { playerElo, opponentElo, playerScore, opponentScore });
        return playerElo; // Return original ELO if inputs are invalid
    }

    // Avoid division by zero
    if (playerScore === opponentScore) return playerElo; // tie → no change
  
    const totalScore = playerScore + opponentScore;
    if (totalScore === 0) return playerElo; // Avoid division by zero
  
    const actualScore = playerScore / totalScore; // fraction of total points
  
    const expectedScore = 1 / (1 + 10 ** ((opponentElo - playerElo) / 400));
  
    const newElo = playerElo + k * (actualScore - expectedScore);
    return Math.round(newElo);
  }

// New normalized ELO calculation function
export function calculateNormalizedELO(playerElo, opponentElo, playerScore, opponentScore, k = 8) {
    return calcNormELO(playerElo, opponentElo, playerScore, opponentScore, k);
}
  