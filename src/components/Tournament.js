import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, getDocs, addDoc, updateDoc, setDoc, query, where, orderBy, serverTimestamp, getDoc } from 'firebase/firestore';
import { generateFairBracket, updateBracket, isTournamentComplete, getTournamentChampion } from '../utils/tournamentBracket';

// Tennis-style bracket component
const TennisBracket = ({ bracket, participants, totalRounds, isPreview }) => {
  if (!bracket || bracket.length === 0) return null;

  // Calculate the full bracket structure based on max participants
  const maxParticipants = Math.max(participants.length, 4); // Minimum 4 spots
  const actualRounds = Math.ceil(Math.log2(maxParticipants));
  
  // Group matches by round
  const matchesByRound = bracket.reduce((acc, match) => {
    if (!acc[match.round]) acc[match.round] = [];
    acc[match.round].push(match);
    return acc;
  }, {});

  // Create a complete bracket structure with empty spots
  const createCompleteBracket = () => {
    const completeBracket = {};
    
    for (let round = 0; round < actualRounds; round++) {
      completeBracket[round] = [];
      const matchesInRound = Math.pow(2, actualRounds - round - 1);
      
      for (let match = 0; match < matchesInRound; match++) {
        const matchId = `match-r${round}-m${match}`;
        const existingMatch = matchesByRound[round]?.find(m => m.id === matchId);
        
        if (existingMatch) {
          completeBracket[round].push(existingMatch);
        } else {
          // Create empty match placeholder
          completeBracket[round].push({
            id: matchId,
            round: round,
            participants: [null, null],
            winner: null,
            completed: false,
            isBye: false,
            isEmpty: true
          });
        }
      }
    }
    
    return completeBracket;
  };

  const completeBracket = createCompleteBracket();
  const roundNumbers = Object.keys(completeBracket).sort((a, b) => parseInt(a) - parseInt(b));

  return (
    <div style={{
      display: 'flex',
      gap: '40px',
      overflowX: 'auto',
      padding: '20px 0',
      minHeight: '300px'
    }}>
      {roundNumbers.map((roundNum) => {
        const round = parseInt(roundNum);
        const roundMatches = completeBracket[roundNum];
        
        return (
          <div key={round} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            minWidth: '200px',
            position: 'relative'
          }}>
            {/* Round Header */}
            <div style={{
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: 'bold',
              color: isPreview ? '#92400e' : '#374151',
              marginBottom: '10px',
              padding: '8px',
              backgroundColor: isPreview ? '#fef3c7' : '#f3f4f6',
              borderRadius: '6px'
            }}>
              Round {round + 1}
            </div>

            {/* Matches in this round */}
            {roundMatches.map((match, matchIndex) => (
              <div key={match.id} style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                {/* Match Box */}
                <div style={{
                  backgroundColor: match.completed ? '#dcfce7' : 
                                 match.isEmpty ? '#f9fafb' : 
                                 (isPreview ? '#fff7ed' : 'white'),
                  border: `2px solid ${match.completed ? '#16a34a' : 
                                    match.isEmpty ? '#e5e7eb' :
                                    (isPreview ? '#fed7aa' : '#e5e7eb')}`,
                  borderRadius: '8px',
                  padding: '12px',
                  minWidth: '180px',
                  position: 'relative',
                  opacity: match.isBye ? 0.6 : (match.isEmpty ? 0.4 : 1)
                }}>
                  {/* Player 1 */}
                  <div style={{
                    padding: '8px',
                    backgroundColor: match.participants[0] === match.winner ? '#dcfce7' : 
                                   (!match.participants[0] && match.isEmpty) ? '#f3f4f6' : 'transparent',
                    borderRadius: '4px',
                    fontWeight: match.participants[0] === match.winner ? 'bold' : 'normal',
                    color: match.participants[0] === match.winner ? '#166534' : 
                           (!match.participants[0] && match.isEmpty) ? '#9ca3af' : '#374151',
                    fontSize: '12px',
                    border: match.participants[0] === match.winner ? '1px solid #16a34a' : 'none',
                    fontStyle: (!match.participants[0] && match.isEmpty) ? 'italic' : 'normal'
                  }}>
                    {match.participants[0] || (match.isEmpty ? 'Open Spot' : 'TBD')}
                  </div>
                  
                  {/* VS separator */}
                  <div style={{
                    textAlign: 'center',
                    fontSize: '10px',
                    color: '#6b7280',
                    margin: '4px 0',
                    fontWeight: 'bold'
                  }}>
                    vs
                  </div>
                  
                  {/* Player 2 */}
                  <div style={{
                    padding: '8px',
                    backgroundColor: match.participants[1] === match.winner ? '#dcfce7' : 
                                   (!match.participants[1] && match.isEmpty) ? '#f3f4f6' : 'transparent',
                    borderRadius: '4px',
                    fontWeight: match.participants[1] === match.winner ? 'bold' : 'normal',
                    color: match.participants[1] === match.winner ? '#166534' : 
                           (!match.participants[1] && match.isEmpty) ? '#9ca3af' : '#374151',
                    fontSize: '12px',
                    border: match.participants[1] === match.winner ? '1px solid #16a34a' : 'none',
                    fontStyle: (!match.participants[1] && match.isEmpty) ? 'italic' : 'normal'
                  }}>
                    {match.participants[1] || (match.isEmpty ? 'Open Spot' : 'TBD')}
                  </div>

                  {/* Bye indicator */}
                  {match.isBye && (
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      backgroundColor: '#fbbf24',
                      color: '#92400e',
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontWeight: 'bold'
                    }}>
                      BYE
                    </div>
                  )}

                  {/* ELO gap warning */}
                  {match.eloDifference && match.eloDifference > 200 && (
                    <div style={{
                      position: 'absolute',
                      bottom: '-20px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      color: '#dc2626',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      ⚠️ Large ELO gap
                    </div>
                  )}
                </div>

                {/* Connecting lines to next round */}
                {round < actualRounds - 1 && (
                  <>
                    {/* Horizontal line to next round */}
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '100%',
                      width: '20px',
                      height: '2px',
                      backgroundColor: match.isEmpty ? '#e5e7eb' : (isPreview ? '#fed7aa' : '#d1d5db'),
                      transform: 'translateY(-50%)',
                      zIndex: 1,
                      opacity: match.isEmpty ? 0.5 : 1
                    }}></div>
                    
                    {/* Vertical line to connect with next match */}
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: 'calc(100% + 20px)',
                      width: '2px',
                      height: '40px',
                      backgroundColor: match.isEmpty ? '#e5e7eb' : (isPreview ? '#fed7aa' : '#d1d5db'),
                      transform: 'translateY(-50%)',
                      zIndex: 1,
                      opacity: match.isEmpty ? 0.5 : 1
                    }}></div>
                  </>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default function Tournament({ currentAndrewID }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userElo, setUserElo] = useState(1200); // Default ELO
  const [creatingTournament, setCreatingTournament] = useState(false);
  const [newTournament, setNewTournament] = useState({
    name: '',
    description: '',
    maxParticipants: 16,
    startDate: '',
    entryFee: 0,
    prizePool: 0
  });
  const [previewBracket, setPreviewBracket] = useState(null);
  const [previewTournamentId, setPreviewTournamentId] = useState(null);

  useEffect(() => {
    loadTournaments();
    loadUserElo();
    
    // Test Firebase connection
    console.log('Firebase db instance:', db);
    console.log('Current Andrew ID:', currentAndrewID);
  }, [currentAndrewID]);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const tournamentsRef = collection(db, 'tournaments');
      const q = query(tournamentsRef, where('status', 'in', ['upcoming', 'active', 'completed']), orderBy('startDate', 'asc'));
      const snapshot = await getDocs(q);
      
      const tournamentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setTournaments(tournamentsData);
    } catch (err) {
      console.error('Error loading tournaments:', err);
      setError('Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const loadUserElo = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', currentAndrewID));
      if (userDoc.exists()) {
        setUserElo(userDoc.data().elo || 1200);
      }
    } catch (err) {
      console.error('Error loading user ELO:', err);
    }
  };

  const handleCreateTournament = async () => {
    if (!newTournament.name || !newTournament.startDate) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate date is in the future
    const startDate = new Date(newTournament.startDate);
    const now = new Date();
    if (startDate <= now) {
      setError('Start date must be in the future');
      return;
    }

    try {
      setCreatingTournament(true);
      setError(null);
      
      // Use the same logic as the working test button
      const tournamentData = {
        name: newTournament.name,
        description: newTournament.description || '',
        maxParticipants: newTournament.maxParticipants,
        entryFee: newTournament.entryFee || 0,
        createdBy: currentAndrewID,
        createdAt: serverTimestamp(),
        status: 'upcoming',
        participants: [],
        bracket: null,
        startDate: startDate,
        prizePool: (newTournament.entryFee || 0) * newTournament.maxParticipants
      };
      
      console.log('Creating tournament with data:', tournamentData);
      const docRef = await addDoc(collection(db, 'tournaments'), tournamentData);
      console.log('Tournament created with ID:', docRef.id);
      
      // Reset form
      setNewTournament({
        name: '',
        description: '',
        maxParticipants: 16,
        startDate: '',
        entryFee: 0,
        prizePool: 0
      });
      
      setError('Tournament created successfully!');
      setCreatingTournament(false);
      await loadTournaments();
      
    } catch (err) {
      console.error('Tournament creation failed:', err);
      setError(`Failed to create tournament: ${err.message}`);
      setCreatingTournament(false);
    }
  };

  const handleSignUp = async (tournamentId, entryFee) => {
    try {
      console.log('Signing up for tournament:', tournamentId, 'Entry fee:', entryFee);
      
      // Check if user has enough balance (simplified - you might want to integrate with betting system)
      const userDoc = await getDoc(doc(db, 'users', currentAndrewID));
      
      let userData;
      let currentBalance;
      
      if (!userDoc.exists()) {
        console.log('User document does not exist, creating it...');
        // Create user document with default balance
        await setDoc(doc(db, 'users', currentAndrewID), {
          balance: 1000, // Default balance
          elo: 1200, // Default ELO
          displayName: currentAndrewID
        });
        console.log('User document created successfully');
        currentBalance = 1000;
      } else {
        userData = userDoc.data();
        currentBalance = userData?.balance || 1000; // Default to 1000 if no balance
      }
      
      console.log('User balance:', currentBalance, 'Entry fee:', entryFee);
      
      if (currentBalance < entryFee) {
        setError(`Insufficient balance. You have $${currentBalance}, need $${entryFee}`);
        return;
      }

      // Add user to tournament participants
      const tournamentRef = doc(db, 'tournaments', tournamentId);
      const tournamentDoc = await getDoc(tournamentRef);
      
      if (!tournamentDoc.exists()) {
        setError('Tournament not found');
        return;
      }
      
      const tournament = tournamentDoc.data();
      
      if (tournament.participants.includes(currentAndrewID)) {
        setError('You are already signed up for this tournament');
        return;
      }

      if (tournament.participants.length >= tournament.maxParticipants) {
        setError('Tournament is full');
        return;
      }

      console.log('Adding user to tournament participants...');
      
      // Update tournament participants
      await updateDoc(tournamentRef, {
        participants: [...tournament.participants, currentAndrewID]
      });

      console.log('Deducting entry fee from user balance...');
      
      // Deduct entry fee from user balance (only if entry fee > 0)
      if (entryFee > 0) {
        await updateDoc(doc(db, 'users', currentAndrewID), {
          balance: currentBalance - entryFee
        });
      }

      console.log('Signup successful!');
      setError(null);
      await loadTournaments();
      
    } catch (err) {
      console.error('Error signing up for tournament:', err);
      setError(`Failed to sign up for tournament: ${err.message}`);
    }
  };

  const generateBracket = async (participants) => {
    if (participants.length < 2) return null;
    
    try {
      const bracketData = await generateFairBracket(participants);
      return bracketData;
    } catch (error) {
      console.error('Error generating bracket:', error);
      setError('Failed to generate tournament bracket');
      return null;
    }
  };

  const generatePreviewBracket = async (participants) => {
    if (participants.length === 0) return null;
    
    try {
      // If we have participants, generate a preview bracket
      if (participants.length >= 2) {
        return await generateFairBracket(participants);
      } else {
        // For single participant or empty, create a placeholder structure
        return {
          participants: participants.map(p => ({
            andrewId: p,
            elo: 1200, // Default ELO for preview
            displayName: p
          })),
          bracket: [],
          metadata: {
            totalParticipants: participants.length,
            totalRounds: 0,
            created: new Date().toISOString(),
            isPreview: true
          }
        };
      }
    } catch (error) {
      console.error('Error generating preview bracket:', error);
      return null;
    }
  };

  const startTournament = async (tournamentId) => {
    try {
      const tournamentRef = doc(db, 'tournaments', tournamentId);
      const tournamentDoc = await getDoc(tournamentRef);
      const tournament = tournamentDoc.data();
      
      if (tournament.participants.length < 2) {
        setError('Need at least 2 participants to start tournament');
        return;
      }

      const bracketData = await generateBracket(tournament.participants);
      
      if (!bracketData) {
        setError('Failed to generate tournament bracket');
        return;
      }
      
      await updateDoc(tournamentRef, {
        status: 'active',
        bracket: bracketData.bracket,
        bracketMetadata: bracketData.metadata,
        startedAt: serverTimestamp()
      });

      loadTournaments();
    } catch (err) {
      console.error('Error starting tournament:', err);
      setError('Failed to start tournament');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'TBD';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  const handleShowBracketPreview = async (tournament) => {
    try {
      setError(null);
      
      // If already showing this tournament's preview, hide it
      if (previewTournamentId === tournament.id) {
        setPreviewBracket(null);
        setPreviewTournamentId(null);
        return;
      }

      // Generate preview bracket for this tournament
      const bracketData = await generatePreviewBracket(tournament.participants);
      
      if (bracketData) {
        setPreviewBracket(bracketData);
        setPreviewTournamentId(tournament.id);
      } else {
        setError('Failed to generate bracket preview');
      }
    } catch (err) {
      console.error('Error generating bracket preview:', err);
      setError('Failed to generate bracket preview');
    }
  };

  if (loading) {
    return (
      <div className="cmu-card">
        <h2>Tournaments</h2>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          Loading tournaments...
        </div>
      </div>
    );
  }

  return (
    <div className="cmu-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Tournaments</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setCreatingTournament(!creatingTournament)}
            style={{
              backgroundColor: '#b91c1c',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Create Tournament
          </button>
          <button
            onClick={() => {
              setCreatingTournament(false);
              setError(null);
            }}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '12px'
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {error && (
        <div style={{ 
          backgroundColor: '#fef2f2', 
          color: '#dc2626', 
          padding: '10px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '1px solid #fecaca'
        }}>
          {error}
        </div>
      )}

      {creatingTournament && (
        <div style={{ 
          backgroundColor: '#f9fafb', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <h3>Create New Tournament</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tournament Name *</label>
              <input
                type="text"
                value={newTournament.name}
                onChange={(e) => setNewTournament({...newTournament, name: e.target.value})}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                placeholder="Enter tournament name"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Max Participants</label>
              <select
                value={newTournament.maxParticipants}
                onChange={(e) => setNewTournament({...newTournament, maxParticipants: parseInt(e.target.value)})}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
              >
                <option value={4}>4</option>
                <option value={8}>8</option>
                <option value={16}>16</option>
                <option value={32}>32</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Start Date *</label>
              <input
                type="datetime-local"
                value={newTournament.startDate}
                onChange={(e) => setNewTournament({...newTournament, startDate: e.target.value})}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Entry Fee</label>
              <input
                type="number"
                value={newTournament.entryFee}
                onChange={(e) => setNewTournament({...newTournament, entryFee: parseFloat(e.target.value)})}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description</label>
            <textarea
              value={newTournament.description}
              onChange={(e) => setNewTournament({...newTournament, description: e.target.value})}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', minHeight: '80px' }}
              placeholder="Tournament description..."
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={async () => {
                if (!newTournament.name || !newTournament.startDate) {
                  setError('Please fill in all required fields');
                  return;
                }

                try {
                  setError(null);
                  const startDate = new Date(newTournament.startDate);
                  const tournamentData = {
                    name: newTournament.name,
                    description: newTournament.description || '',
                    maxParticipants: newTournament.maxParticipants,
                    entryFee: newTournament.entryFee || 0,
                    createdBy: currentAndrewID,
                    createdAt: serverTimestamp(),
                    status: 'upcoming',
                    participants: [],
                    bracket: null,
                    startDate: startDate,
                    prizePool: (newTournament.entryFee || 0) * newTournament.maxParticipants
                  };
                  
                  console.log('Creating tournament:', tournamentData);
                  const docRef = await addDoc(collection(db, 'tournaments'), tournamentData);
                  console.log('Tournament created:', docRef.id);
                  setError('Tournament created successfully!');
                  
                  // Reset form
                  setNewTournament({
                    name: '',
                    description: '',
                    maxParticipants: 16,
                    startDate: '',
                    entryFee: 0,
                    prizePool: 0
                  });
                  
                  await loadTournaments();
                } catch (err) {
                  console.error('Tournament creation failed:', err);
                  setError(`Failed to create tournament: ${err.message}`);
                }
              }}
              style={{
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Create Tournament
            </button>
            <button
              onClick={() => {
                setCreatingTournament(false);
                setError(null);
                setNewTournament({
                  name: '',
                  description: '',
                  maxParticipants: 16,
                  startDate: '',
                  entryFee: 0,
                  prizePool: 0
                });
              }}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: '20px' }}>
        {tournaments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            No tournaments available. Create one to get started!
          </div>
        ) : (
          tournaments.map(tournament => (
            <div key={tournament.id} style={{
              backgroundColor: '#f9fafb',
              padding: '20px',
              borderRadius: '8px',
              border: `1px solid ${previewTournamentId === tournament.id ? '#b91c1c' : '#e5e7eb'}`,
              cursor: tournament.status === 'upcoming' ? 'pointer' : 'default',
              transition: 'all 0.2s ease-in-out'
            }}
            onClick={tournament.status === 'upcoming' ? () => handleShowBracketPreview(tournament) : undefined}
            onMouseOver={(e) => {
              if (tournament.status === 'upcoming') {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.transform = 'scale(1.02)';
              }
            }}
            onMouseOut={(e) => {
              if (tournament.status === 'upcoming') {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                    <h3 style={{ margin: '0', color: '#111827' }}>{tournament.name}</h3>
                    {tournament.status === 'upcoming' && (
                      <span style={{
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}>
                        Click to preview bracket
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '0 0 10px 0', color: '#6b7280', fontSize: '14px' }}>
                    {tournament.description}
                  </p>
                  <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#6b7280' }}>
                    <span>📅 {formatDate(tournament.startDate)}</span>
                    <span>👥 {tournament.participants.length}/{tournament.maxParticipants}</span>
                    <span>💰 ${tournament.entryFee} entry</span>
                    <span>🏆 ${tournament.prizePool} prize pool</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: tournament.status === 'upcoming' ? '#fef3c7' : 
                                   tournament.status === 'active' ? '#dcfce7' : '#f3f4f6',
                    color: tournament.status === 'upcoming' ? '#92400e' : 
                           tournament.status === 'active' ? '#166534' : '#6b7280'
                  }}>
                    {tournament.status.toUpperCase()}
                  </span>
                  {tournament.status === 'upcoming' && tournament.participants.length >= 2 && tournament.createdBy === currentAndrewID && (
                    <button
                      onClick={() => startTournament(tournament.id)}
                      style={{
                        backgroundColor: '#059669',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    >
                      Start Tournament
                    </button>
                  )}
                </div>
              </div>

              {tournament.status === 'upcoming' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    Participants: {tournament.participants.join(', ') || 'None yet'}
                  </div>
                  {!tournament.participants.includes(currentAndrewID) && tournament.participants.length < tournament.maxParticipants && (
                    <button
                      onClick={() => handleSignUp(tournament.id, tournament.entryFee)}
                      style={{
                        backgroundColor: '#b91c1c',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px'
                      }}
                    >
                      Sign Up
                    </button>
                  )}
                  {tournament.participants.includes(currentAndrewID) && (
                    <span style={{ color: '#059669', fontWeight: 'bold', fontSize: '14px' }}>
                      ✓ You're signed up!
                    </span>
                  )}
                </div>
              )}

              {tournament.status === 'upcoming' && previewTournamentId === tournament.id && previewBracket && (
                <div style={{ marginTop: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: '0', fontSize: '16px', color: '#b91c1c' }}>Bracket Preview</h4>
                    <span style={{
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      Based on current participants ({previewBracket.participants.length}/{tournament.maxParticipants})
                    </span>
                  </div>
                  
                  {previewBracket.participants.length >= 2 ? (
                    <TennisBracket 
                      bracket={previewBracket.bracket}
                      participants={previewBracket.participants}
                      totalRounds={previewBracket.metadata.totalRounds}
                      isPreview={true}
                    />
                  ) : (
                    <div style={{
                      backgroundColor: '#f3f4f6',
                      padding: '20px',
                      borderRadius: '8px',
                      textAlign: 'center',
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      {previewBracket.participants.length === 0 
                        ? 'No participants yet. Sign up to see the bracket!'
                        : 'Need at least 2 participants to generate bracket preview'
                      }
                    </div>
                  )}
                  
                  <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#0369a1'
                  }}>
                    💡 <strong>Note:</strong> This preview shows the bracket structure based on current participants. 
                    The final bracket will be generated when the tournament starts with all registered players.
                  </div>
                </div>
              )}

              {tournament.status === 'active' && tournament.bracket && (
                <div style={{ marginTop: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: '0', fontSize: '16px' }}>Tournament Bracket</h4>
                    {isTournamentComplete(tournament.bracket) && (
                      <div style={{
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        padding: '8px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        🏆 Champion: {getTournamentChampion(tournament.bracket)}
                      </div>
                    )}
                  </div>
                  <TennisBracket 
                    bracket={tournament.bracket}
                    participants={tournament.participants}
                    totalRounds={tournament.bracketMetadata?.totalRounds}
                    isPreview={false}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}