import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { loadStripe, createMockPaymentIntent } from '../utils/stripeMock';

const Betting = ({ currentAndrewID, user }) => {
  const [pendingMatches, setPendingMatches] = useState([]);
  const [userBets, setUserBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [betAmount, setBetAmount] = useState('');
  const [bettingOn, setBettingOn] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchPendingMatches();
    fetchUserBets();
  }, [currentAndrewID]);

  const fetchPendingMatches = async () => {
    try {
      setLoading(true);
      console.log('Fetching all available matches for betting...');
      
      const allMatches = [];
      
      // 1. Get accepted challenges that can be bet on
      try {
        const challengesRef = collection(db, 'challenges');
        console.log('Challenges collection:', challengesRef);
        
        // First, let's check if there are ANY challenges at all
        const allChallengesQuery = query(challengesRef);
        const allChallengesSnapshot = await getDocs(allChallengesQuery);
        console.log('ALL challenges in collection:', allChallengesSnapshot.size);
        console.log('ALL challenges docs:', allChallengesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        // If no challenges exist, let's create a sample one for testing
        if (allChallengesSnapshot.size === 0) {
          console.log('No challenges found, creating sample challenge for testing...');
          try {
            await addDoc(collection(db, 'challenges'), {
              challengerAndrewID: 'testuser1',
              opponentAndrewID: 'testuser2',
              challengerName: 'Test User 1',
              opponentName: 'Test User 2',
              sport: 'Ping Pong',
              status: 'accepted',
              acceptedAt: new Date(),
              description: 'Sample challenge for betting testing',
              createdAt: new Date()
            });
            console.log('Sample challenge created!');
          } catch (error) {
            console.error('Error creating sample challenge:', error);
          }
        }
        
        const challengesQuery = query(
          challengesRef, 
          orderBy('createdAt', 'desc')
        );
        const challengesSnapshot = await getDocs(challengesQuery);
        console.log('Challenges snapshot:', challengesSnapshot);
        console.log('Challenges snapshot size:', challengesSnapshot.size);
        console.log('Challenges snapshot empty:', challengesSnapshot.empty);
        console.log('Challenges snapshot docs:', challengesSnapshot.docs);
        
        const challenges = challengesSnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Challenge doc data:', doc.id, data);
          return {
            id: doc.id,
            ...data,
            matchType: 'challenge',
            displayName: `${data.challengerName || data.challengerAndrewID} vs ${data.opponentName || data.opponentAndrewID}`,
            sport: data.sport || 'Ping Pong'
          };
        });
        
        console.log('Found challenges:', challenges.length);
        console.log('Challenges data:', challenges);
        allMatches.push(...challenges);
      } catch (error) {
        console.error('Error fetching challenges:', error);
      }
      
      // 2. Get pending matches
      try {
        const pendingMatchesRef = collection(db, 'matches_pending');
        const pendingSnapshot = await getDocs(pendingMatchesRef);
        console.log('Pending matches snapshot size:', pendingSnapshot.size);
        console.log('Pending matches docs:', pendingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        const pendingMatches = pendingSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          matchType: 'pending',
          displayName: `${doc.data().challengerName || 'Challenger'} vs ${doc.data().opponentName || 'Opponent'}`,
          sport: doc.data().sport || 'Ping Pong'
        }));
        
        console.log('Found pending matches:', pendingMatches.length);
        allMatches.push(...pendingMatches);
      } catch (error) {
        console.error('Error fetching pending matches:', error);
      }
      
      // 3. Add hardcoded sample matches
      const hardcodedMatches = [
        {
          id: 'hardcoded-1',
          challengerAndrewID: 'stavyagaonkar',
          opponentAndrewID: 'josephouyang',
          challengerName: 'Stavya Gaonkar',
          opponentName: 'Joseph Ouyang',
          sport: 'Tennis',
          status: 'accepted',
          description: 'Intense tennis match at the campus courts',
          acceptedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          matchType: 'challenge',
          displayName: 'Stavya Gaonkar vs Joseph Ouyang',
          scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
          challengerOdds: 1.45,
          opponentOdds: 2.85
        },
        {
          id: 'hardcoded-3',
          challengerAndrewID: 'jonathanchen',
          opponentAndrewID: 'stavyagaonkar',
          challengerName: 'Jonathan Chen',
          opponentName: 'Stavya Gaonkar',
          sport: 'Soccer',
          status: 'accepted',
          description: 'Championship soccer match',
          acceptedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
          matchType: 'challenge',
          displayName: 'Jonathan Chen vs Stavya Gaonkar',
          scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
          challengerOdds: 3.10,
          opponentOdds: 1.35
        },
        {
          id: 'hardcoded-4',
          challengerAndrewID: 'stavyagaonkar',
          opponentAndrewID: 'jonathanchen',
          challengerName: 'Stavya Gaonkar',
          opponentName: 'Jonathan Chen',
          sport: 'Beer Pong',
          status: 'accepted',
          description: 'Beach volleyball tournament prep',
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
          matchType: 'challenge',
          displayName: 'Stavya Gaonkar vs Jonathan Chen',
          challengerOdds: 1.90,
          opponentOdds: 1.90
        }
      ];
      
      console.log('Adding hardcoded matches:', hardcodedMatches.length);
      allMatches.push(...hardcodedMatches);
      
      console.log('Total matches found:', allMatches.length);
      
      // Filter out matches where the current user is involved (can't bet on own matches)
      const availableMatches = allMatches.filter(match => {
        // For challenges
        if (match.matchType === 'challenge') {
          return match.challengerAndrewID !== currentAndrewID && 
                 match.opponentAndrewID !== currentAndrewID;
        }
        // For pending matches
        if (match.matchType === 'pending') {
          return match.challengerUID !== currentAndrewID && 
                 match.opponentUID !== currentAndrewID;
        }
        // For tournaments, allow betting (no specific player restrictions)
        if (match.matchType === 'tournament') {
          return true;
        }
        return true;
      });
      
      console.log('Available matches for betting:', availableMatches.length);
      setPendingMatches(availableMatches);
    } catch (error) {
      console.error('Error fetching matches for betting:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBets = async () => {
    if (!currentAndrewID) return;
    
    try {
      const betsRef = collection(db, 'bets');
      const q = query(
        betsRef, 
        where('bettor', '==', currentAndrewID),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      const bets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUserBets(bets);
    } catch (error) {
      console.error('Error fetching user bets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBetPlacement = async (match, betOn, amount) => {
    if (!user || !currentAndrewID) {
      alert('You must be logged in to place bets');
      return;
    }

    if (amount < 1) {
      alert('Minimum bet amount is $1');
      return;
    }

    if (amount > 100) {
      alert('Maximum bet amount is $100');
      return;
    }

    setProcessingPayment(true);

    try {
      // Create payment intent (mock implementation)
      const { clientSecret } = await createMockPaymentIntent(
        amount * 100, // Convert to cents
        'usd',
        {
          matchId: match.id,
          bettor: currentAndrewID,
          betOn: betOn,
          matchDescription: `${match.challengerAndrewID} vs ${match.opponentAndrewID} - ${match.sport}`
        }
      );

      // Initialize Stripe (mock implementation)
      const stripe = await loadStripe('pk_test_mock');
      
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: {
            // In a real app, you'd collect card details from a form
            // For demo purposes, we'll use a test card
            number: '4242424242424242',
            exp_month: 12,
            exp_year: 2025,
            cvc: '123',
          },
        },
      });

      if (error) {
        console.error('Payment failed:', error);
        alert('Payment failed: ' + error.message);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Save bet to Firestore
        await addDoc(collection(db, 'bets'), {
          challengeId: match.id,
          bettor: currentAndrewID,
          betOn: betOn,
          amount: amount,
          odds: calculateOdds(match, betOn),
          potentialWinnings: amount * calculateOdds(match, betOn),
          status: 'active',
          paymentIntentId: paymentIntent.id,
          createdAt: serverTimestamp(),
          challengeDetails: {
            challenger: match.challengerAndrewID,
            opponent: match.opponentAndrewID,
            sport: match.sport || 'Unknown Sport',
            scheduledDate: match.scheduledDate || match.acceptedAt || match.createdAt
          }
        });

        alert('Bet placed successfully!');
        setSelectedMatch(null);
        setBetAmount('');
        setBettingOn('');
        fetchUserBets();
      }
    } catch (error) {
      console.error('Error placing bet:', error);
      alert('Error placing bet. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const calculateOdds = (match, betOn) => {
    // Use hardcoded odds if available, otherwise use default odds
    if (match.challengerOdds && match.opponentOdds) {
      if (betOn === 'challenger') {
        return match.challengerOdds;
      } else {
        return match.opponentOdds;
      }
    }
    
    // Default odds calculation for matches without hardcoded odds
    if (betOn === 'challenger') {
      return 1.8; // 1.8x odds for challenger
    } else {
      return 1.8; // 1.8x odds for opponent
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'TBD';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getBetStatusColor = (status) => {
    switch (status) {
      case 'active': return '#3b82f6';
      case 'won': return '#10b981';
      case 'lost': return '#ef4444';
      case 'cancelled': return '#6b7280';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="cmu-card">
        <h2 style={{ color: '#b91c1c', marginBottom: '20px', fontSize: '24px' }}>Sports Betting</h2>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#666' }}>Loading betting options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cmu-card">
      <h2 style={{ color: '#b91c1c', marginBottom: '20px', fontSize: '24px' }}>Sports Betting</h2>
      
      {/* Available Matches to Bet On */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
            Available Matches for Betting ({pendingMatches.length})
          </h3>
          <button
            onClick={() => {
              fetchPendingMatches();
              fetchUserBets();
            }}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            🔄 Refresh
          </button>
        </div>
        
        {pendingMatches.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎯</div>
            <h4 style={{ color: '#374151', margin: '0 0 10px 0', fontSize: '18px' }}>
              No matches available for betting
            </h4>
            <p style={{ color: '#6b7280', margin: '0 0 15px 0', fontSize: '14px' }}>
              Matches become available for betting once both players accept a challenge.
            </p>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
              💡 <strong>Tip:</strong> Challenge someone to a match to create betting opportunities!
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {pendingMatches.map(match => (
              <div key={match.id} style={{
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '20px',
                backgroundColor: '#f9fafb',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                      <h4 style={{ margin: '0', fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
                        {match.displayName || `${match.challengerAndrewID || 'Challenger'} vs ${match.opponentAndrewID || 'Opponent'}`}
                      </h4>
                      <span style={{
                        backgroundColor: match.matchType === 'challenge' ? 
                                        (match.status === 'accepted' ? '#10b981' : 
                                         match.status === 'pending' ? '#f59e0b' : 
                                         match.status === 'declined' ? '#ef4444' : '#6b7280') :
                                        match.matchType === 'pending' ? '#f59e0b' : 
                                        match.matchType === 'tournament' ? '#8b5cf6' : '#6b7280',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}>
                        {match.matchType === 'challenge' ? match.status : match.matchType}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '15px', fontSize: '14px', color: '#6b7280', marginBottom: '10px' }}>
                      <span>🏆 {match.sport || 'Unknown Sport'}</span>
                      <span>📅 {formatDate(match.scheduledDate || match.acceptedAt || match.createdAt || match.startDate)}</span>
                      {match.status === 'accepted' && match.acceptedAt && (
                        <span>✅ Accepted {formatDate(match.acceptedAt)}</span>
                      )}
                      {match.status === 'pending' && (
                        <span>⏳ Pending</span>
                      )}
                      {match.status === 'declined' && (
                        <span>❌ Declined</span>
                      )}
                      {match.matchType === 'tournament' && match.status && (
                        <span>🏟️ {match.status}</span>
                      )}
                    </div>
                    {match.description && (
                      <p style={{ margin: '0', color: '#4b5563', fontSize: '14px', fontStyle: 'italic' }}>
                        "{match.description}"
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedMatch(match)}
                    style={{
                      backgroundColor: '#b91c1c',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      transition: 'all 0.2s ease-in-out',
                      boxShadow: '0 2px 4px rgba(185, 28, 28, 0.3)'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = '#991b1b';
                      e.target.style.transform = 'scale(1.05)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = '#b91c1c';
                      e.target.style.transform = 'scale(1)';
                    }}
                  >
                    🎯 Place Bet
                  </button>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  gap: '20px', 
                  fontSize: '14px',
                  padding: '15px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '5px' }}>
                      {match.challengerAndrewID}
                    </div>
                    <div style={{ 
                      color: '#10b981', 
                      fontWeight: 'bold', 
                      fontSize: '16px',
                      backgroundColor: '#f0fdf4',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      display: 'inline-block'
                    }}>
                      {calculateOdds(match, 'challenger').toFixed(2)}x
                    </div>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    fontSize: '20px', 
                    fontWeight: 'bold', 
                    color: '#6b7280' 
                  }}>
                    VS
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '5px' }}>
                      {match.opponentAndrewID}
                    </div>
                    <div style={{ 
                      color: '#10b981', 
                      fontWeight: 'bold', 
                      fontSize: '16px',
                      backgroundColor: '#f0fdf4',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      display: 'inline-block'
                    }}>
                      {calculateOdds(match, 'opponent').toFixed(2)}x
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bet Placement Modal */}
      {selectedMatch && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '15px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ color: '#b91c1c', marginBottom: '20px', textAlign: 'center' }}>
              Place Your Bet
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>
                {selectedMatch.challengerAndrewID} vs {selectedMatch.opponentAndrewID}
              </h4>
              <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
                {selectedMatch.sport || 'Unknown Sport'} • {formatDate(selectedMatch.scheduledDate || selectedMatch.createdAt)}
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#1f2937' }}>
                Who are you betting on?
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setBettingOn('challenger')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: bettingOn === 'challenger' ? '#b91c1c' : '#f3f4f6',
                    color: bettingOn === 'challenger' ? 'white' : '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {selectedMatch.challengerAndrewID} ({calculateOdds(selectedMatch, 'challenger').toFixed(2)}x)
                </button>
                <button
                  onClick={() => setBettingOn('opponent')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: bettingOn === 'opponent' ? '#b91c1c' : '#f3f4f6',
                    color: bettingOn === 'opponent' ? 'white' : '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {selectedMatch.opponentAndrewID} ({calculateOdds(selectedMatch, 'opponent').toFixed(2)}x)
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#1f2937' }}>
                Bet Amount ($)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                placeholder="Enter amount (1-100)"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>

            {betAmount && bettingOn && (
              <div style={{ 
                marginBottom: '20px', 
                padding: '15px', 
                backgroundColor: '#f0f9ff', 
                borderRadius: '8px',
                border: '1px solid #0ea5e9'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>Bet Amount:</span>
                  <span>${betAmount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>Odds:</span>
                  <span>{calculateOdds(selectedMatch, bettingOn).toFixed(2)}x</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#0ea5e9' }}>
                  <span>Potential Winnings:</span>
                  <span>${(betAmount * calculateOdds(selectedMatch, bettingOn)).toFixed(2)}</span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setSelectedMatch(null);
                  setBetAmount('');
                  setBettingOn('');
                }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleBetPlacement(selectedMatch, bettingOn, parseFloat(betAmount))}
                disabled={!betAmount || !bettingOn || processingPayment}
                style={{
                  padding: '12px 24px',
                  backgroundColor: processingPayment ? '#9ca3af' : '#b91c1c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: processingPayment ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                {processingPayment ? 'Processing...' : 'Place Bet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User's Betting History */}
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '15px' }}>
          Your Bets
        </h3>
        
        {userBets.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>
            You haven't placed any bets yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {userBets.map(bet => (
              <div key={bet.id} style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '15px',
                backgroundColor: '#f9fafb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>
                      {bet.challengeDetails?.challenger || bet.matchDetails?.challenger} vs {bet.challengeDetails?.opponent || bet.matchDetails?.opponent}
                    </h4>
                    <p style={{ margin: '0', color: '#6b7280', fontSize: '12px' }}>
                      {bet.challengeDetails?.sport || bet.matchDetails?.sport} • Bet on: {bet.betOn}
                    </p>
                  </div>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: 'white',
                    backgroundColor: getBetStatusColor(bet.status)
                  }}>
                    {bet.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span>Bet: ${bet.amount}</span>
                  <span>Odds: {bet.odds.toFixed(2)}x</span>
                  <span style={{ fontWeight: 'bold', color: bet.status === 'won' ? '#10b981' : '#1f2937' }}>
                    Potential: ${bet.potentialWinnings.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Betting;
