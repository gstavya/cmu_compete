import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy } from "firebase/firestore";

export default function Challenges({ currentAndrewID }) {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        // Get challenges where user is either challenger or opponent
        const challengesRef = collection(db, "challenges");
        const q = query(
          challengesRef,
          where("challengerAndrewID", "==", currentAndrewID)
        );
        const opponentQ = query(
          challengesRef,
          where("opponentAndrewID", "==", currentAndrewID)
        );

        const [challengerSnap, opponentSnap] = await Promise.all([
          getDocs(q),
          getDocs(opponentQ)
        ]);

        const allChallenges = [
          ...challengerSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: "outgoing" })),
          ...opponentSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: "incoming" }))
        ];

        setChallenges(allChallenges);
      } catch (err) {
        console.error("Error fetching challenges:", err);
      } finally {
        setLoading(false);
      }
    };

    if (currentAndrewID) {
      fetchChallenges();
    }
  }, [currentAndrewID]);

  const handleAcceptChallenge = async (challenge) => {
    try {
      await updateDoc(doc(db, "challenges", challenge.id), {
        status: "accepted",
        acceptedAt: new Date()
      });

      // Refresh challenges
      setChallenges(prev => 
        prev.map(c => 
          c.id === challenge.id 
            ? { ...c, status: "accepted", acceptedAt: new Date() }
            : c
        )
      );

      alert(`Challenge accepted! You can now schedule your ${challenge.sport} match.`);
    } catch (err) {
      console.error("Error accepting challenge:", err);
      alert("Failed to accept challenge. Please try again.");
    }
  };

  const handleDeclineChallenge = async (challenge) => {
    try {
      await updateDoc(doc(db, "challenges", challenge.id), {
        status: "declined",
        declinedAt: new Date()
      });

      // Refresh challenges
      setChallenges(prev => 
        prev.map(c => 
          c.id === challenge.id 
            ? { ...c, status: "declined", declinedAt: new Date() }
            : c
        )
      );

      alert("Challenge declined.");
    } catch (err) {
      console.error("Error declining challenge:", err);
      alert("Failed to decline challenge. Please try again.");
    }
  };

  const handleCancelChallenge = async (challenge) => {
    try {
      await deleteDoc(doc(db, "challenges", challenge.id));
      setChallenges(prev => prev.filter(c => c.id !== challenge.id));
      alert("Challenge cancelled.");
    } catch (err) {
      console.error("Error cancelling challenge:", err);
      alert("Failed to cancel challenge. Please try again.");
    }
  };

  if (loading) return <p style={{ color: "#660000" }}>Loading challenges...</p>;

  const incomingChallenges = challenges.filter(c => c.type === "incoming" && c.status === "pending");
  const outgoingChallenges = challenges.filter(c => c.type === "outgoing" && c.status === "pending");
  const acceptedChallenges = challenges.filter(c => c.status === "accepted");

  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#b91c1c' }}>
        Challenges
      </h2>

      {/* Incoming Challenges */}
      {incomingChallenges.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444', marginBottom: '10px' }}>
            Incoming Challenges
          </h3>
          {incomingChallenges.map(challenge => (
            <div key={challenge.id} style={{
              padding: '15px',
              backgroundColor: '#ffcccc',
              borderRadius: '10px',
              marginBottom: '10px',
              border: '2px solid #ef4444'
            }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
                {challenge.challengerAndrewID} challenged you to {challenge.sport}!
              </p>
              
              {/* Challenge Details */}
              <div style={{ marginBottom: '10px', fontSize: '14px' }}>
                {challenge.scheduledDate && (
                  <p style={{ margin: '2px 0', color: '#660000' }}>
                    📅 Date: {new Date(challenge.scheduledDate.seconds * 1000).toLocaleDateString()}
                  </p>
                )}
                {challenge.scheduledTime && (
                  <p style={{ margin: '2px 0', color: '#660000' }}>
                    🕐 Time: {challenge.scheduledTime}
                  </p>
                )}
                {challenge.place && (
                  <p style={{ margin: '2px 0', color: '#660000' }}>
                    📍 Place: {challenge.place}
                  </p>
                )}
                {challenge.dare && (
                  <p style={{ margin: '2px 0', color: '#660000', fontWeight: 'bold' }}>
                    🎯 Dare: {challenge.dare}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleAcceptChallenge(challenge)}
                  className="cmu-button"
                  style={{ padding: '8px 16px', fontSize: '14px' }}
                >
                  Accept
                </button>
                <button
                  onClick={() => handleDeclineChallenge(challenge)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#666',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Outgoing Challenges */}
      {outgoingChallenges.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444', marginBottom: '10px' }}>
            Pending Challenges
          </h3>
          {outgoingChallenges.map(challenge => (
            <div key={challenge.id} style={{
              padding: '15px',
              backgroundColor: '#ffe5e5',
              borderRadius: '10px',
              marginBottom: '10px',
              border: '2px solid #ef4444'
            }}>
              <p style={{ margin: '0 0 10px 0' }}>
                You challenged {challenge.opponentAndrewID} to {challenge.sport}
              </p>
              
              {/* Challenge Details */}
              <div style={{ marginBottom: '10px', fontSize: '14px' }}>
                {challenge.scheduledDate && (
                  <p style={{ margin: '2px 0', color: '#660000' }}>
                    📅 Date: {new Date(challenge.scheduledDate.seconds * 1000).toLocaleDateString()}
                  </p>
                )}
                {challenge.scheduledTime && (
                  <p style={{ margin: '2px 0', color: '#660000' }}>
                    🕐 Time: {challenge.scheduledTime}
                  </p>
                )}
                {challenge.place && (
                  <p style={{ margin: '2px 0', color: '#660000' }}>
                    📍 Place: {challenge.place}
                  </p>
                )}
                {challenge.dare && (
                  <p style={{ margin: '2px 0', color: '#660000', fontWeight: 'bold' }}>
                    🎯 Dare: {challenge.dare}
                  </p>
                )}
              </div>

              <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>
                Status: Waiting for response
              </p>
              <button
                onClick={() => handleCancelChallenge(challenge)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Cancel
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Accepted Challenges */}
      {acceptedChallenges.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444', marginBottom: '10px' }}>
            Accepted Challenges
          </h3>
          {acceptedChallenges.map(challenge => (
            <div key={challenge.id} style={{
              padding: '15px',
              backgroundColor: '#e5ffe5',
              borderRadius: '10px',
              marginBottom: '10px',
              border: '2px solid #22c55e'
            }}>
              <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                {challenge.sport} match accepted!
              </p>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>
                {challenge.type === "incoming" 
                  ? `You vs ${challenge.challengerAndrewID}`
                  : `You vs ${challenge.opponentAndrewID}`
                }
              </p>

              {/* Challenge Details */}
              <div style={{ marginBottom: '10px', fontSize: '14px' }}>
                {challenge.scheduledDate && (
                  <p style={{ margin: '2px 0', color: '#660000' }}>
                    📅 Date: {new Date(challenge.scheduledDate.seconds * 1000).toLocaleDateString()}
                  </p>
                )}
                {challenge.scheduledTime && (
                  <p style={{ margin: '2px 0', color: '#660000' }}>
                    🕐 Time: {challenge.scheduledTime}
                  </p>
                )}
                {challenge.place && (
                  <p style={{ margin: '2px 0', color: '#660000' }}>
                    📍 Place: {challenge.place}
                  </p>
                )}
                {challenge.dare && (
                  <p style={{ margin: '2px 0', color: '#660000', fontWeight: 'bold' }}>
                    🎯 Dare: {challenge.dare}
                  </p>
                )}
              </div>

              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
                Ready to play! Use the match form to report results.
              </p>
            </div>
          ))}
        </div>
      )}

      {challenges.length === 0 && (
        <p style={{ color: '#660000', textAlign: 'center', fontStyle: 'italic' }}>
          No challenges yet. Challenge someone from the leaderboard!
        </p>
      )}
    </div>
  );
}
