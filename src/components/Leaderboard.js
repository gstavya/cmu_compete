import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { getDisplayELO } from "../utils/eloNormalization";

const sports = ["pingpong", "pool", "foosball", "basketball1v1", "tennis", "beerpong"];

export default function Leaderboard({ currentAndrewID, onViewProfile, onViewChallenge }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);


  const handleChallenge = (opponent, sport) => {
    if (!currentAndrewID) {
      alert("Please log in to challenge someone!");
      return;
    }

    if (opponent.email?.split('@')[0] === currentAndrewID) {
      alert("You cannot challenge yourself!");
      return;
    }

    onViewChallenge(opponent, sport);
  };

  const handleProfileClick = (user) => {
    const andrewID = user.email?.split('@')[0];
    if (andrewID && onViewProfile) {
      onViewProfile(andrewID);
    }
  };

  if (loading) return <p style={{ color: "#b91c1c", textAlign: "center", marginTop: "30px" }}>Loading leaderboard...</p>;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "#b91c1c", marginBottom: "30px", textAlign: "center" }}>
        Leaderboards
      </h2>

      {sports.map((sport) => {
        const sorted = [...users].sort(
          (a, b) => getDisplayELO(b.elo?.[sport]) - getDisplayELO(a.elo?.[sport])
        );

        return (
          <div key={sport} style={{ marginBottom: "40px" }}>
            <h3 style={{ fontSize: "22px", fontWeight: "bold", color: "#ef4444", marginBottom: "15px" }}>
              {sport.toUpperCase()}
            </h3>
            {sorted.map((user, i) => (
              <div
                key={user.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 20px",
                  backgroundColor: "#ffe5e5",
                  borderRadius: "12px",
                  marginBottom: "8px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  border: i === 0 ? "2px solid #b91c1c" : "1px solid #ef4444",
                  fontWeight: i === 0 ? "bold" : "normal",
                  fontSize: "16px",
                }}
              >
                <span>
                  {i + 1}. 
                  <button
                    onClick={() => handleProfileClick(user)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#b91c1c',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'inherit',
                      padding: '0',
                      marginLeft: '4px'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.color = '#991b1b';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.color = '#b91c1c';
                    }}
                  >
                    {user.displayName || user.andrewID || user.email?.split('@')[0] || "(Unknown)"}
                  </button>
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span>{getDisplayELO(user.elo?.[sport])}</span>
                  {currentAndrewID && user.email?.split('@')[0] !== currentAndrewID && (
                    <button
                      onClick={() => handleChallenge(user, sport)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}
                    >
                      Challenge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      })}

    </div>
  );
}
