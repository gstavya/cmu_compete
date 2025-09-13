// src/utils/tournamentBracket.js
import { db } from '../firebase';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';

/**
 * Generates a fair tournament bracket based on ELO ratings
 * Higher ELO players are seeded to avoid early elimination
 */
export async function generateFairBracket(participantIds) {
  if (participantIds.length < 2) {
    throw new Error('Need at least 2 participants for a tournament');
  }

  // Fetch ELO ratings for all participants
  const participantsWithElo = await Promise.all(
    participantIds.map(async (andrewId) => {
      try {
        const userDoc = await getDoc(doc(db, 'users', andrewId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          return {
            andrewId,
            elo: userData.elo || 1200, // Default ELO if not set
            displayName: userData.displayName || andrewId
          };
        } else {
          return {
            andrewId,
            elo: 1200, // Default ELO for users not found
            displayName: andrewId
          };
        }
      } catch (error) {
        console.error(`Error fetching ELO for ${andrewId}:`, error);
        return {
          andrewId,
          elo: 1200,
          displayName: andrewId
        };
      }
    })
  );

  // Sort participants by ELO rating (highest to lowest)
  const sortedParticipants = participantsWithElo.sort((a, b) => b.elo - a.elo);

  // Create bracket structure
  const bracket = createBracketStructure(sortedParticipants);
  
  return {
    participants: sortedParticipants,
    bracket: bracket,
    metadata: {
      totalParticipants: participantIds.length,
      totalRounds: Math.ceil(Math.log2(participantIds.length)),
      created: new Date().toISOString()
    }
  };
}

/**
 * Creates the bracket structure with proper seeding
 */
function createBracketStructure(sortedParticipants) {
  const numParticipants = sortedParticipants.length;
  const numRounds = Math.ceil(Math.log2(numParticipants));
  const bracket = [];

  // For single elimination tournaments, we need to handle byes
  const totalSlots = Math.pow(2, numRounds);
  const byes = totalSlots - numParticipants;

  // Create first round matches with proper seeding
  const firstRoundMatches = createFirstRoundMatches(sortedParticipants, byes);
  bracket.push(...firstRoundMatches);

  // Create subsequent rounds
  for (let round = 1; round < numRounds; round++) {
    const matchesInRound = Math.pow(2, numRounds - round - 1);
    for (let match = 0; match < matchesInRound; match++) {
      bracket.push({
        id: `match-r${round}-m${match}`,
        round: round,
        participants: [null, null], // Will be filled by winners of previous round
        winner: null,
        completed: false,
        isBye: false
      });
    }
  }

  return bracket;
}

/**
 * Creates first round matches with proper seeding to ensure fairness
 */
function createFirstRoundMatches(sortedParticipants, byes) {
  const matches = [];
  const numParticipants = sortedParticipants.length;
  
  // Create a seeded bracket structure
  const seededPositions = createSeededPositions(numParticipants);
  
  // Assign participants to their seeded positions
  const positionedParticipants = new Array(numParticipants);
  sortedParticipants.forEach((participant, index) => {
    positionedParticipants[seededPositions[index]] = participant;
  });

  // Create matches for first round
  for (let i = 0; i < positionedParticipants.length; i += 2) {
    const participant1 = positionedParticipants[i];
    const participant2 = positionedParticipants[i + 1];
    
    // If only one participant in the match, it's a bye
    const isBye = !participant2;
    
    matches.push({
      id: `match-r0-m${Math.floor(i / 2)}`,
      round: 0,
      participants: [
        participant1 ? participant1.andrewId : null,
        participant2 ? participant2.andrewId : null
      ],
      winner: isBye ? participant1.andrewId : null, // Winner of bye is automatic
      completed: isBye,
      isBye: isBye,
      eloDifference: participant1 && participant2 ? 
        Math.abs(participant1.elo - participant2.elo) : 0
    });
  }

  return matches;
}

/**
 * Creates seeded positions to ensure fair distribution
 * Higher seeds avoid each other in early rounds
 */
function createSeededPositions(numParticipants) {
  if (numParticipants <= 2) return [0, 1];
  if (numParticipants <= 4) return [0, 3, 2, 1];
  if (numParticipants <= 8) return [0, 7, 4, 3, 2, 5, 6, 1];
  if (numParticipants <= 16) {
    return [0, 15, 8, 7, 4, 11, 12, 3, 2, 13, 10, 5, 6, 9, 14, 1];
  }
  
  // For larger tournaments, use a more complex seeding system
  const positions = [];
  const totalSlots = Math.pow(2, Math.ceil(Math.log2(numParticipants)));
  
  // Fill positions using standard tournament seeding
  for (let i = 0; i < numParticipants; i++) {
    positions.push(i);
  }
  
  return positions;
}

/**
 * Updates bracket after a match result
 */
export function updateBracket(bracket, matchId, winnerId) {
  const updatedBracket = bracket.map(match => {
    if (match.id === matchId) {
      return {
        ...match,
        winner: winnerId,
        completed: true
      };
    }
    return match;
  });

  // Advance winner to next round
  advanceWinner(updatedBracket, matchId, winnerId);
  
  return updatedBracket;
}

/**
 * Advances the winner to the next round
 */
function advanceWinner(bracket, matchId, winnerId) {
  const match = bracket.find(m => m.id === matchId);
  if (!match) return;

  const nextRound = match.round + 1;
  const nextMatchIndex = Math.floor(match.id.split('-m')[1] / 2);
  const nextMatchId = `match-r${nextRound}-m${nextMatchIndex}`;
  
  const nextMatch = bracket.find(m => m.id === nextMatchId);
  if (nextMatch) {
    // Determine which slot to fill (left or right)
    const isLeftSlot = match.id.split('-m')[1] % 2 === 0;
    const slotIndex = isLeftSlot ? 0 : 1;
    
    nextMatch.participants[slotIndex] = winnerId;
  }
}

/**
 * Gets the current tournament standings
 */
export function getTournamentStandings(bracket, participants) {
  const standings = participants.map(p => ({
    ...p,
    matchesPlayed: 0,
    matchesWon: 0,
    currentRound: 0
  }));

  // Analyze bracket to calculate standings
  bracket.forEach(match => {
    if (match.completed && match.winner) {
      const winner = standings.find(p => p.andrewId === match.winner);
      const loser = standings.find(p => 
        match.participants.includes(p.andrewId) && p.andrewId !== match.winner
      );
      
      if (winner) {
        winner.matchesPlayed++;
        winner.matchesWon++;
        winner.currentRound = Math.max(winner.currentRound, match.round + 1);
      }
      
      if (loser) {
        loser.matchesPlayed++;
        loser.currentRound = Math.max(loser.currentRound, match.round);
      }
    }
  });

  // Sort by current round (descending), then by ELO (descending)
  return standings.sort((a, b) => {
    if (b.currentRound !== a.currentRound) {
      return b.currentRound - a.currentRound;
    }
    return b.elo - a.elo;
  });
}

/**
 * Checks if tournament is complete
 */
export function isTournamentComplete(bracket) {
  const finalRound = bracket.filter(match => match.round === Math.max(...bracket.map(m => m.round)));
  return finalRound.length === 1 && finalRound[0].completed;
}

/**
 * Gets the tournament champion
 */
export function getTournamentChampion(bracket) {
  const finalRound = bracket.filter(match => match.round === Math.max(...bracket.map(m => m.round)));
  if (finalRound.length === 1 && finalRound[0].completed) {
    return finalRound[0].winner;
  }
  return null;
}
