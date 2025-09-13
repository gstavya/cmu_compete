import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const ChallengePage = ({ opponent, sport, currentAndrewID, onBack }) => {
  const [challengeForm, setChallengeForm] = useState({
    date: '',
    time: '',
    place: '',
    dare: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentAndrewID) {
      alert("Please log in to challenge someone!");
      return;
    }

    if (opponent.email?.split('@')[0] === currentAndrewID) {
      alert("You cannot challenge yourself!");
      return;
    }

    setSubmitting(true);

    try {
      // Create challenge request with enhanced details
      const challengeData = {
        challengerUID: auth.currentUser.uid,
        challengerAndrewID: currentAndrewID,
        opponentUID: opponent.id,
        opponentAndrewID: opponent.email?.split('@')[0],
        sport: sport,
        status: "pending",
        createdAt: serverTimestamp(),
        scheduledDate: challengeForm.date ? new Date(challengeForm.date) : null,
        scheduledTime: challengeForm.time || null,
        place: challengeForm.place || null,
        dare: challengeForm.dare || null,
        message: `${currentAndrewID} has challenged you to a ${sport} match!${challengeForm.dare ? ` Loser has to: ${challengeForm.dare}` : ''}`
      };

      await addDoc(collection(db, "challenges"), challengeData);

      alert(`Challenge sent to ${opponent.displayName || opponent.email?.split('@')[0]} for ${sport}!`);
      
      // Reset form and go back
      setChallengeForm({ date: '', time: '', place: '', dare: '' });
      onBack();
    } catch (err) {
      console.error("Error sending challenge:", err);
      alert("Failed to send challenge. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const sportEmojis = {
    pingpong: '🏓',
    pool: '🎱',
    foosball: '⚽',
    basketball1v1: '🏀',
    tennis: '🎾',
    beerpong: '🍺'
  };

  return (
    <>
      <header>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <div style={{width: '50px', height: '50px', backgroundColor: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <span style={{color: '#b91c1c', fontWeight: 'bold', fontSize: '24px'}}>C</span>
          </div>
          <h1 style={{margin: 0, fontSize: '28px', fontWeight: 'bold'}}>CMU Compete</h1>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
          <button
            onClick={onBack}
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
            ← Back to Leaderboard
          </button>
        </div>
      </header>

      <main style={{ maxWidth: "800px", margin: "30px auto", padding: "0 20px" }}>
        <div className="cmu-card">
          <h2 style={{ color: '#b91c1c', marginBottom: '20px', textAlign: 'center' }}>
            {sportEmojis[sport]} Send Challenge to {opponent.displayName || opponent.email?.split('@')[0]}
          </h2>
          
          <div style={{ 
            backgroundColor: '#f9fafb', 
            padding: '20px', 
            borderRadius: '10px', 
            marginBottom: '30px',
            border: '2px solid #e5e7eb'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#374151' }}>Challenge Details</h3>
            <p style={{ margin: '0', color: '#6b7280' }}>
              <strong>Sport:</strong> {sport.charAt(0).toUpperCase() + sport.slice(1)} {sportEmojis[sport]}
            </p>
            <p style={{ margin: '5px 0 0 0', color: '#6b7280' }}>
              <strong>Opponent:</strong> {opponent.displayName || opponent.email?.split('@')[0]}
            </p>
            <p style={{ margin: '5px 0 0 0', color: '#6b7280' }}>
              <strong>Your ELO:</strong> {opponent.elo?.[sport] || 1000}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
                Date (Optional)
              </label>
              <input
                type="date"
                value={challengeForm.date}
                onChange={(e) => setChallengeForm({...challengeForm, date: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: 'white'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
                Time (Optional)
              </label>
              <input
                type="time"
                value={challengeForm.time}
                onChange={(e) => setChallengeForm({...challengeForm, time: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: 'white'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
                Place (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Skibo Gym, UC Table Tennis Room"
                value={challengeForm.place}
                onChange={(e) => setChallengeForm({...challengeForm, place: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: 'white'
                }}
              />
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
                Dare for Loser (Optional)
              </label>
              <textarea
                placeholder="e.g., Buy the winner lunch, Do 20 push-ups, Wear a funny hat for a day"
                value={challengeForm.dare}
                onChange={(e) => setChallengeForm({...challengeForm, dare: e.target.value})}
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: 'white',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '15px', 
              justifyContent: 'center'
            }}>
              <button
                type="button"
                onClick={onBack}
                style={{
                  padding: '15px 30px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '15px 30px',
                  backgroundColor: submitting ? '#9ca3af' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                {submitting ? 'Sending Challenge...' : 'Send Challenge'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
};

export default ChallengePage;
