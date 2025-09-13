import { db } from '../firebase';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';

// Function to settle bets when a match is completed
export const settleBets = async (challengeId, winner) => {
  try {
    // Get all active bets for this challenge
    const betsRef = collection(db, 'bets');
    const q = query(
      betsRef,
      where('challengeId', '==', challengeId),
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(q);
    const bets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Process each bet
    for (const bet of bets) {
      let newStatus;
      let winnings = 0;
      
      if (bet.betOn === winner) {
        // Bet won
        newStatus = 'won';
        winnings = bet.potentialWinnings;
      } else {
        // Bet lost
        newStatus = 'lost';
        winnings = 0;
      }
      
      // Update bet status
      await updateDoc(doc(db, 'bets', bet.id), {
        status: newStatus,
        winnings: winnings,
        settledAt: new Date(),
        matchResult: winner
      });
      
      console.log(`Bet ${bet.id} settled: ${newStatus}, winnings: $${winnings}`);
    }
    
    console.log(`Settled ${bets.length} bets for challenge ${challengeId}`);
    return { success: true, settledBets: bets.length };
    
  } catch (error) {
    console.error('Error settling bets:', error);
    return { success: false, error: error.message };
  }
};

// Function to get betting statistics
export const getBettingStats = async (andrewID) => {
  try {
    const betsRef = collection(db, 'bets');
    const q = query(betsRef, where('bettor', '==', andrewID));
    
    const snapshot = await getDocs(q);
    const bets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const stats = {
      totalBets: bets.length,
      activeBets: bets.filter(bet => bet.status === 'active').length,
      wonBets: bets.filter(bet => bet.status === 'won').length,
      lostBets: bets.filter(bet => bet.status === 'lost').length,
      totalWagered: bets.reduce((sum, bet) => sum + bet.amount, 0),
      totalWinnings: bets.reduce((sum, bet) => sum + (bet.winnings || 0), 0),
      netProfit: 0
    };
    
    stats.netProfit = stats.totalWinnings - stats.totalWagered;
    stats.winRate = stats.totalBets > 0 ? (stats.wonBets / stats.totalBets) * 100 : 0;
    
    return stats;
    
  } catch (error) {
    console.error('Error getting betting stats:', error);
    return null;
  }
};

// Function to cancel bets if a challenge is cancelled
export const cancelBets = async (challengeId) => {
  try {
    const betsRef = collection(db, 'bets');
    const q = query(
      betsRef,
      where('challengeId', '==', challengeId),
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(q);
    const bets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Update all active bets to cancelled
    for (const bet of bets) {
      await updateDoc(doc(db, 'bets', bet.id), {
        status: 'cancelled',
        cancelledAt: new Date(),
        refundAmount: bet.amount // Full refund for cancelled challenges
      });
    }
    
    console.log(`Cancelled ${bets.length} bets for challenge ${challengeId}`);
    return { success: true, cancelledBets: bets.length };
    
  } catch (error) {
    console.error('Error cancelling bets:', error);
    return { success: false, error: error.message };
  }
};
