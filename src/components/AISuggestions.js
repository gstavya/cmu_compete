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
    <div className="cmu-card" style={{ 
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Background decoration */}
      <div style={{
        position: "absolute",
        top: "-50px",
        right: "-50px",
        width: "100px",
        height: "100px",
        background: "rgba(255,255,255,0.1)",
        borderRadius: "50%",
        zIndex: 1
      }}></div>
      <div style={{
        position: "absolute",
        bottom: "-30px",
        left: "-30px",
        width: "60px",
        height: "60px",
        background: "rgba(255,255,255,0.1)",
        borderRadius: "50%",
        zIndex: 1
      }}></div>
      
      <div style={{ position: "relative", zIndex: 2 }}>
        <h3 style={{ 
          fontSize: "28px", 
          fontWeight: "bold", 
          marginBottom: "8px",
          textAlign: "center",
          textShadow: "2px 2px 4px rgba(0,0,0,0.3)"
        }}>
          🤖 AI Match Suggestions
        </h3>
        <p style={{ 
          fontSize: "16px", 
          marginBottom: "30px",
          textAlign: "center",
          opacity: 0.9,
          textShadow: "1px 1px 2px rgba(0,0,0,0.3)"
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
                padding: "20px", 
                backgroundColor: "rgba(255,255,255,0.95)", 
                borderRadius: "16px",
                border: "2px solid rgba(255,255,255,0.3)",
                textAlign: "center",
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)"
              }}>
                <h4 style={{ 
                  fontSize: "18px", 
                  fontWeight: "bold", 
                  color: "#1f2937",
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
              padding: "20px", 
              backgroundColor: "rgba(255,255,255,0.95)", 
              borderRadius: "16px",
              border: "2px solid rgba(255,255,255,0.3)",
              transition: "all 0.3s ease",
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              transform: "translateY(0)",
              cursor: "pointer"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.1)";
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
                marginBottom: "16px",
                padding: "16px",
                backgroundColor: "rgba(255,255,255,0.9)",
                borderRadius: "12px",
                border: "3px solid " + getSuggestionColor(suggestion.type),
                boxShadow: "0 4px 16px rgba(0,0,0,0.1)"
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
                      padding: "8px 16px",
                      backgroundColor: getSuggestionColor(suggestion.type),
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "bold",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "scale(1.05)";
                      e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "scale(1)";
                      e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
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
    </div>
  );
}
