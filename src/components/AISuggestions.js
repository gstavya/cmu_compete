import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { getDisplayELO, getMatchType } from "../utils/eloNormalization";

const sports = ["pingpong", "pool", "foosball", "basketball1v1", "tennis", "beerpong"];

export default function AISuggestions({ currentAndrewID, onViewChallenge }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState({});

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

  useEffect(() => {
    if (users.length > 0 && currentAndrewID) {
      generateSuggestions();
    }
  }, [users, currentAndrewID]);

  const generateSuggestions = () => {
    const currentUser = users.find(user => user.email?.split('@')[0] === currentAndrewID);
    if (!currentUser) return;

    const newSuggestions = {};

    sports.forEach(sport => {
      const currentUserELO = getDisplayELO(currentUser.elo?.[sport]);
      
      // Filter out current user and users without ELO for this sport
      const otherUsers = users.filter(user => {
        const andrewID = user.email?.split('@')[0];
        return andrewID !== currentAndrewID && user.elo?.[sport];
      });

      if (otherUsers.length === 0) {
        newSuggestions[sport] = { type: 'no_opponents', message: 'No opponents available' };
        return;
      }

      // Sort by ELO difference (closest matches first)
      const sortedByELO = otherUsers.sort((a, b) => {
        const aElo = getDisplayELO(a.elo[sport]);
        const bElo = getDisplayELO(b.elo[sport]);
        const aDiff = Math.abs(aElo - currentUserELO);
        const bDiff = Math.abs(bElo - currentUserELO);
        return aDiff - bDiff;
      });

      // Get top 3 suggestions
      const topSuggestions = sortedByELO.slice(0, 3).map(user => {
        const displayElo = getDisplayELO(user.elo[sport]);
        return {
          ...user,
          andrewID: user.email?.split('@')[0],
          elo: displayElo,
          eloDiff: Math.abs(displayElo - currentUserELO)
        };
      });

      // Determine suggestion type based on ELO difference using normalized scale
      const bestMatch = topSuggestions[0];
      const matchInfo = getMatchType(bestMatch.eloDiff);

      newSuggestions[sport] = {
        type: matchInfo.type,
        message: matchInfo.message,
        suggestions: topSuggestions
      };
    });

    setSuggestions(newSuggestions);
  };

  const getSuggestionColor = (type) => {
    switch (type) {
      case 'perfect_match': return '#10b981'; // green
      case 'good_match': return '#3b82f6'; // blue
      case 'challenging_match': return '#f59e0b'; // orange
      case 'learning_match': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'perfect_match': return '🎯';
      case 'good_match': return '⚔️';
      case 'challenging_match': return '🔥';
      case 'learning_match': return '📚';
      default: return '🤖';
    }
  };

  const handleChallenge = (opponent, sport) => {
    if (!currentAndrewID) {
      alert("Please log in to challenge someone!");
      return;
    }

    if (opponent.andrewID === currentAndrewID) {
      alert("You cannot challenge yourself!");
      return;
    }

    onViewChallenge(opponent, sport);
  };

  if (loading) {
    return (
      <div style={{ 
        backgroundColor: "white", 
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)", 
        borderRadius: "16px", 
        padding: "24px",
        textAlign: "center"
      }}>
        <p style={{ color: "#b91c1c" }}>Loading AI suggestions...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: "white", 
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)", 
      borderRadius: "16px", 
      padding: "24px" 
    }}>
      <h3 style={{ 
        fontSize: "20px", 
        fontWeight: "bold", 
        color: "#1f2937", 
        marginBottom: "20px",
        textAlign: "center"
      }}>
        🤖 AI Match Suggestions
      </h3>
      <p style={{ 
        fontSize: "14px", 
        color: "#6b7280", 
        marginBottom: "20px",
        textAlign: "center",
        fontStyle: "italic"
      }}>
        Find your perfect opponent based on skill level
      </p>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
        gap: "16px" 
      }}>
        {sports.map(sport => {
          const suggestion = suggestions[sport];
          if (!suggestion || suggestion.type === 'no_opponents') {
            return (
              <div key={sport} style={{ 
                padding: "16px", 
                backgroundColor: "#f9fafb", 
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                textAlign: "center"
              }}>
                <h4 style={{ 
                  fontSize: "16px", 
                  fontWeight: "bold", 
                  color: "#374151",
                  marginBottom: "8px",
                  textTransform: "capitalize"
                }}>
                  {sport.replace(/([A-Z])/g, ' $1').trim()}
                </h4>
                <p style={{ 
                  fontSize: "14px", 
                  color: "#6b7280",
                  margin: 0
                }}>
                  {suggestion?.message || 'No opponents available'}
                </p>
              </div>
            );
          }

          const bestMatch = suggestion.suggestions[0];
          
          return (
            <div key={sport} style={{ 
              padding: "16px", 
              backgroundColor: "#f9fafb", 
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              transition: "all 0.2s ease"
            }}>
              {/* Sport Header */}
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                marginBottom: "12px"
              }}>
                <h4 style={{ 
                  fontSize: "16px", 
                  fontWeight: "bold", 
                  color: "#374151",
                  textTransform: "capitalize",
                  margin: 0
                }}>
                  {sport.replace(/([A-Z])/g, ' $1').trim()}
                </h4>
                <span style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: getSuggestionColor(suggestion.type),
                  backgroundColor: getSuggestionColor(suggestion.type) + '20',
                  padding: "4px 8px",
                  borderRadius: "12px"
                }}>
                  {getSuggestionIcon(suggestion.type)} {suggestion.message}
                </span>
              </div>

              {/* Top Suggestion */}
              <div style={{ 
                marginBottom: "12px",
                padding: "12px",
                backgroundColor: "white",
                borderRadius: "8px",
                border: "2px solid " + getSuggestionColor(suggestion.type) + '40'
              }}>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  marginBottom: "8px"
                }}>
                  <span style={{ 
                    fontWeight: "600", 
                    color: "#1f2937",
                    fontSize: "14px"
                  }}>
                    {bestMatch.displayName || bestMatch.andrewID}
                  </span>
                  <span style={{ 
                    color: "#b91c1c", 
                    fontWeight: "bold",
                    fontSize: "14px"
                  }}>
                    ELO: {bestMatch.elo}
                  </span>
                </div>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center"
                }}>
                  <span style={{ 
                    fontSize: "12px", 
                    color: "#6b7280" 
                  }}>
                    ±{bestMatch.eloDiff} ELO difference
                  </span>
                  <button
                    onClick={() => handleChallenge(bestMatch, sport)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: getSuggestionColor(suggestion.type),
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
                </div>
              </div>

              {/* Additional Suggestions */}
              {suggestion.suggestions.length > 1 && (
                <div>
                  <p style={{ 
                    fontSize: "12px", 
                    color: "#6b7280", 
                    marginBottom: "8px",
                    fontWeight: "600"
                  }}>
                    Other good matches:
                  </p>
                  {suggestion.suggestions.slice(1).map((opponent, index) => (
                    <div key={opponent.id} style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center",
                      padding: "8px",
                      backgroundColor: "#f3f4f6",
                      borderRadius: "6px",
                      marginBottom: "4px"
                    }}>
                      <span style={{ 
                        fontSize: "12px", 
                        color: "#374151",
                        fontWeight: "500"
                      }}>
                        {opponent.displayName || opponent.andrewID}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ 
                          fontSize: "11px", 
                          color: "#6b7280" 
                        }}>
                          ELO: {opponent.elo}
                        </span>
                        <button
                          onClick={() => handleChallenge(opponent, sport)}
                          style={{
                            padding: "4px 8px",
                            backgroundColor: "#6b7280",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "10px",
                            fontWeight: "bold"
                          }}
                        >
                          Challenge
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
