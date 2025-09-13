import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';

// Function to create a new tournament
export const createTournament = async (tournamentData) => {
  try {
    const tournamentRef = await addDoc(collection(db, 'tournaments'), {
      ...tournamentData,
      status: 'upcoming',
      participants: [],
      createdAt: serverTimestamp()
    });
    
    console.log('Tournament created with ID:', tournamentRef.id);
    return { success: true, tournamentId: tournamentRef.id };
  } catch (error) {
    console.error('Error creating tournament:', error);
    return { success: false, error: error.message };
  }
};

// Function to get user's ELO rating for a specific sport
export const getUserELORating = async (andrewID, sport) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('andrewID', '==', andrewID));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return 1200; // Default ELO rating
    }
    
    const userData = snapshot.docs[0].data();
    return userData.eloRatings?.[sport] || 1200;
  } catch (error) {
    console.error('Error fetching user ELO rating:', error);
    return 1200; // Default ELO rating
  }
};

// Function to add ELO ratings to tournament participants
export const enrichParticipantsWithELO = async (participants, sport) => {
  try {
    const enrichedParticipants = await Promise.all(
      participants.map(async (participant) => {
        const eloRating = await getUserELORating(participant.andrewID, sport);
        return {
          ...participant,
          eloRating
        };
      })
    );
    
    return enrichedParticipants;
  } catch (error) {
    console.error('Error enriching participants with ELO:', error);
    return participants; // Return original participants if error
  }
};

// Function to create sample tournaments for testing
export const createSampleTournaments = async () => {
  const sampleTournaments = [
    {
      name: "Spring Table Tennis Championship",
      sport: "Table Tennis",
      description: "Annual spring table tennis tournament open to all skill levels. Single elimination bracket format.",
      maxParticipants: 16,
      entryFee: 10,
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
      location: "CMU Gymnasium",
      prizePool: 200
    },
    {
      name: "Summer Basketball League",
      sport: "Basketball",
      description: "3v3 basketball tournament with round-robin group stage followed by elimination bracket.",
      maxParticipants: 24,
      entryFee: 15,
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      endDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000), // 16 days from now
      location: "CMU Basketball Court",
      prizePool: 300
    },
    {
      name: "Fall Tennis Open",
      sport: "Tennis",
      description: "Singles tennis tournament with double elimination format. All matches best of 3 sets.",
      maxParticipants: 32,
      entryFee: 20,
      startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
      endDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000), // 23 days from now
      location: "CMU Tennis Courts",
      prizePool: 500
    }
  ];

  try {
    const results = [];
    for (const tournament of sampleTournaments) {
      const result = await createTournament(tournament);
      results.push(result);
    }
    
    console.log('Sample tournaments created:', results);
    return { success: true, results };
  } catch (error) {
    console.error('Error creating sample tournaments:', error);
    return { success: false, error: error.message };
  }
};

// Function to get tournament bracket with ELO-based seeding
export const getTournamentBracket = async (tournamentId) => {
  try {
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const tournamentDoc = await getDoc(tournamentRef);
    
    if (!tournamentDoc.exists()) {
      throw new Error('Tournament not found');
    }
    
    const tournament = tournamentDoc.data();
    const sport = tournament.sport;
    
    // Enrich participants with ELO ratings
    const enrichedParticipants = await enrichParticipantsWithELO(tournament.participants, sport);
    
    // Sort by ELO rating (highest first for seeding)
    const seededParticipants = enrichedParticipants.sort((a, b) => (b.eloRating || 1200) - (a.eloRating || 1200));
    
    return {
      tournament: { ...tournament, id: tournamentId },
      participants: seededParticipants,
      bracket: generateBracket(seededParticipants)
    };
  } catch (error) {
    console.error('Error getting tournament bracket:', error);
    return null;
  }
};

// Function to generate bracket structure
const generateBracket = (participants) => {
  if (!participants || participants.length === 0) return null;

  const bracket = {
    rounds: [],
    participants: participants
  };

  // Calculate number of rounds needed
  const numRounds = Math.ceil(Math.log2(participants.length));
  
  // Create first round (seeding)
  const firstRound = [];
  for (let i = 0; i < participants.length; i += 2) {
    if (i + 1 < participants.length) {
      firstRound.push({
        matchId: `match_${i/2}`,
        player1: participants[i],
        player2: participants[i + 1],
        winner: null,
        completed: false,
        round: 1
      });
    } else {
      // Odd number of participants - bye for highest seed
      firstRound.push({
        matchId: `match_${i/2}`,
        player1: participants[i],
        player2: null,
        winner: participants[i],
        completed: true,
        round: 1
      });
    }
  }

  bracket.rounds.push(firstRound);

  // Create subsequent rounds
  let currentRound = firstRound;
  for (let round = 1; round < numRounds; round++) {
    const nextRound = [];
    for (let i = 0; i < currentRound.length; i += 2) {
      nextRound.push({
        matchId: `match_${round + 1}_${i/2}`,
        player1: null,
        player2: null,
        winner: null,
        completed: false,
        round: round + 1
      });
    }
    bracket.rounds.push(nextRound);
    currentRound = nextRound;
  }

  return bracket;
};

// Function to update match result in tournament
export const updateMatchResult = async (tournamentId, matchId, winner) => {
  try {
    // This would update the tournament bracket with match results
    // For now, we'll just log the action
    console.log(`Updating match ${matchId} in tournament ${tournamentId} with winner:`, winner);
    
    // In a full implementation, you would:
    // 1. Update the match result in the tournament document
    // 2. Advance the winner to the next round
    // 3. Update ELO ratings based on the match result
    // 4. Check if tournament is complete
    
    return { success: true };
  } catch (error) {
    console.error('Error updating match result:', error);
    return { success: false, error: error.message };
  }
};
