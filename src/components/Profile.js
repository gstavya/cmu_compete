// src/components/Profile.js
import React, { useEffect, useState, useRef } from "react";
import { signOut } from "firebase/auth";
import { auth, db, storage } from "../firebase";
import { collection, getDocs, query, where, orderBy, limit, doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getDisplayELO, getSkillLevel } from "../utils/eloNormalization";

const sports = ["pingpong", "pool", "foosball", "basketball1v1", "tennis", "beerpong"];

// AI Analysis data for each sport
const getAIAnalysis = (sport, andrewID) => {
  const analyses = {
    pingpong: [
      "Aggressive smasher with powerful forehand",
      "Defensive player with excellent backhand",
      "Quick reflexes and fast footwork",
      "Strategic spinner with varied shots",
      "Consistent rally player",
      "Counter-attacking specialist",
      "Close-to-table aggressor",
      "Long-distance defensive player"
    ],
    pool: [
      "Precise shot maker with excellent aim",
      "Strategic position player",
      "Aggressive break specialist",
      "Defensive safety shot expert",
      "Bank shot master",
      "Jump shot specialist",
      "Consistent cue ball controller",
      "Pressure shot performer"
    ],
    foosball: [
      "Fast shooter with quick reflexes",
      "Defensive goalie specialist",
      "Passing master with good vision",
      "Aggressive striker",
      "Strategic ball controller",
      "Quick counter-attacker",
      "Precise shot placement",
      "Team coordination expert"
    ],
    basketball1v1: [
      "Explosive scorer with quick moves",
      "Defensive lockdown specialist",
      "Three-point shooting threat",
      "Drive-and-finish expert",
      "Post-up game master",
      "Quick first step attacker",
      "Clutch shot performer",
      "Defensive rebounder"
    ],
    tennis: [
      "Powerful server with strong groundstrokes",
      "Quick baseline player",
      "Net play specialist",
      "Strategic point constructor",
      "Defensive counter-puncher",
      "Aggressive all-court player",
      "Consistent rally builder",
      "Clutch tiebreak performer"
    ],
    beerpong: [
      "Precise shooter with steady aim",
      "Pressure shot specialist",
      "Strategic cup targeting",
      "Consistent arc shooter",
      "Defensive blocker expert",
      "Clutch comeback player",
      "Quick release shooter",
      "Team coordination leader"
    ]
  };

  // Use andrewID to generate consistent "random" analysis
  const hash = andrewID.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const sportAnalyses = analyses[sport] || [];
  const index = Math.abs(hash) % sportAnalyses.length;
  return sportAnalyses[index] || "AI analysis pending";
};

export default function Profile({ user, currentAndrewID }) {
  const [userStats, setUserStats] = useState(null);
  const [allMatches, setAllMatches] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.photoURL || null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentAndrewID) return;

      try {
        // Get user stats from users collection
        const usersRef = collection(db, "users");
        const userQuery = query(usersRef, where("email", "==", user.email));
        const userSnap = await getDocs(userQuery);
        
        if (!userSnap.empty) {
          const userDoc = userSnap.docs[0];
          const userData = { id: userDoc.id, ...userDoc.data() };
          setUserStats(userData);
          // Update profile image if available in user data
          if (userData.photoURL) {
            setProfileImage(userData.photoURL);
          }
        }

        // Get all completed matches for the user
        const matchesRef = collection(db, "matches_completed");
        const matchesQuery = query(
          matchesRef,
          where("challengerAndrewID", "==", currentAndrewID)
        );
        const opponentMatchesQuery = query(
          matchesRef,
          where("opponentAndrewID", "==", currentAndrewID)
        );

        const [matchesSnap, opponentMatchesSnap] = await Promise.all([
          getDocs(matchesQuery),
          getDocs(opponentMatchesQuery)
        ]);

        const allMatches = [
          ...matchesSnap.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(), 
            playerType: "challenger",
            player1AndrewID: doc.data().challengerAndrewID,
            player2AndrewID: doc.data().opponentAndrewID,
            player1Score: doc.data().challengerScore,
            player2Score: doc.data().opponentScore
          })),
          ...opponentMatchesSnap.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(), 
            playerType: "opponent",
            player1AndrewID: doc.data().challengerAndrewID,
            player2AndrewID: doc.data().opponentAndrewID,
            player1Score: doc.data().challengerScore,
            player2Score: doc.data().opponentScore
          }))
        ];

        // Sort by date (most recent first) for display
        allMatches.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });

        // Set all matches for statistics, and recent 10 for display
        console.log("All matches found:", allMatches.length);
        console.log("Sample match data:", allMatches.slice(0, 2));
        setAllMatches(allMatches);
        setRecentMatches(allMatches.slice(0, 10));
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentAndrewID, user.email]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("Logged out successfully!");
      window.location.reload();
    } catch (err) {
      console.error("Logout error:", err);
      alert("Error logging out");
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Create a unique filename
      const fileName = `profile-pictures/${currentAndrewID}_${Date.now()}.${file.name.split('.').pop()}`;
      const storageRef = ref(storage, fileName);

      // Upload the file
      await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update the user's profile picture in Firestore
      if (userStats && userStats.id) {
        await updateDoc(doc(db, "users", userStats.id), {
          photoURL: downloadURL
        });
      }

      // Update local state
      setProfileImage(downloadURL);
      
      alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload profile picture. Please try again.');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getELOForSport = (sport) => {
    return getDisplayELO(userStats?.elo?.[sport]);
  };

  const getBestSport = () => {
    if (!userStats?.elo) return "None";
    
    let bestSport = "";
    let highestELO = 0;
    
    Object.entries(userStats.elo).forEach(([sport, elo]) => {
      const displayElo = getDisplayELO(elo);
      if (displayElo > highestELO) {
        highestELO = displayElo;
        bestSport = sport;
      }
    });
    
    return bestSport || "None";
  };

  const getTotalMatches = () => {
    return allMatches.length;
  };

  const getWinRate = () => {
    if (allMatches.length === 0) return "0%";
    
    const wins = allMatches.filter(match => {
      if (match.playerType === "challenger") {
        return match.player1Score > match.player2Score;
      } else {
        return match.player2Score > match.player1Score;
      }
    }).length;
    
    return `${Math.round((wins / allMatches.length) * 100)}%`;
  };

  const getWins = () => {
    return allMatches.filter(match => {
      if (match.playerType === "challenger") {
        return match.player1Score > match.player2Score;
      } else {
        return match.player2Score > match.player1Score;
      }
    }).length;
  };

  const getLosses = () => {
    return allMatches.length - getWins();
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
        <p style={{ color: "#b91c1c" }}>Loading profile...</p>
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
      <h2 style={{ 
        fontSize: "24px", 
        fontWeight: "bold", 
        marginBottom: "24px", 
        color: "#b91c1c", 
        textAlign: "center" 
      }}>
        Profile
      </h2>
      
      {/* User Info Section */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: "16px", 
        marginBottom: "24px",
        padding: "16px",
        backgroundColor: "#fef2f2",
        borderRadius: "12px"
      }}>
        <div style={{ position: "relative" }}>
          <img 
            src={profileImage || `https://ui-avatars.com/api/?name=${currentAndrewID}&background=b91c1c&color=fff`} 
            alt="profile" 
            style={{ 
              width: "80px", 
              height: "80px", 
              borderRadius: "50%", 
              border: "4px solid #fecaca",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              objectFit: "cover",
              opacity: uploading ? 0.7 : 1
            }} 
          />
          {uploading && (
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "rgba(0,0,0,0.7)",
              color: "white",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "bold"
            }}>
              Uploading...
            </div>
          )}
          <button
            onClick={triggerFileInput}
            disabled={uploading}
            style={{
              position: "absolute",
              bottom: "-5px",
              right: "-5px",
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              backgroundColor: uploading ? "#6b7280" : "#b91c1c",
              border: "2px solid white",
              color: "white",
              cursor: uploading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              opacity: uploading ? 0.6 : 1
            }}
            title={uploading ? "Uploading..." : "Change profile picture"}
          >
            {uploading ? "⏳" : "📷"}
          </button>
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ 
            fontSize: "20px", 
            fontWeight: "bold", 
            color: "#1f2937", 
            margin: "0 0 4px 0" 
          }}>
            {user.displayName || currentAndrewID}
          </h3>
          <p style={{ 
            color: "#6b7280", 
            fontSize: "14px", 
            margin: "0 0 4px 0" 
          }}>
            {user.email}
          </p>
          <p style={{ 
            color: "#b91c1c", 
            fontSize: "14px", 
            fontWeight: "600", 
            margin: 0 
          }}>
            @{currentAndrewID}
          </p>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        style={{ display: "none" }}
      />

      {/* Key Statistics */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", 
        gap: "16px", 
        marginBottom: "24px" 
      }}>
        <div style={{ 
          textAlign: "center", 
          padding: "16px", 
          backgroundColor: "#fef2f2", 
          borderRadius: "12px",
          border: "2px solid #fecaca"
        }}>
          <div style={{ 
            fontSize: "28px", 
            fontWeight: "bold", 
            color: "#b91c1c" 
          }}>
            {getTotalMatches()}
          </div>
          <div style={{ 
            fontSize: "12px", 
            color: "#6b7280", 
            fontWeight: "600" 
          }}>
            Total Matches
          </div>
        </div>
        
        <div style={{ 
          textAlign: "center", 
          padding: "16px", 
          backgroundColor: "#f0fdf4", 
          borderRadius: "12px",
          border: "2px solid #bbf7d0"
        }}>
          <div style={{ 
            fontSize: "28px", 
            fontWeight: "bold", 
            color: "#16a34a" 
          }}>
            {getWins()}
          </div>
          <div style={{ 
            fontSize: "12px", 
            color: "#6b7280", 
            fontWeight: "600" 
          }}>
            Wins
          </div>
        </div>
        
        <div style={{ 
          textAlign: "center", 
          padding: "16px", 
          backgroundColor: "#fef2f2", 
          borderRadius: "12px",
          border: "2px solid #fecaca"
        }}>
          <div style={{ 
            fontSize: "28px", 
            fontWeight: "bold", 
            color: "#dc2626" 
          }}>
            {getLosses()}
          </div>
          <div style={{ 
            fontSize: "12px", 
            color: "#6b7280", 
            fontWeight: "600" 
          }}>
            Losses
          </div>
        </div>
        
        <div style={{ 
          textAlign: "center", 
          padding: "16px", 
          backgroundColor: "#eff6ff", 
          borderRadius: "12px",
          border: "2px solid #bfdbfe"
        }}>
          <div style={{ 
            fontSize: "28px", 
            fontWeight: "bold", 
            color: "#2563eb" 
          }}>
            {getWinRate()}
          </div>
          <div style={{ 
            fontSize: "12px", 
            color: "#6b7280", 
            fontWeight: "600" 
          }}>
            Win Rate
          </div>
        </div>
      </div>

      {/* ELO Ratings */}
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ 
          fontSize: "18px", 
          fontWeight: "bold", 
          color: "#1f2937", 
          marginBottom: "12px" 
        }}>
          ELO Ratings
        </h3>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
          gap: "12px" 
        }}>
          {sports.map(sport => (
            <div key={sport} style={{ 
              padding: "16px", 
              backgroundColor: "#f9fafb", 
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f0fdf4";
              e.currentTarget.style.borderColor = "#22c55e";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#f9fafb";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}>
              {/* Sport Header */}
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                marginBottom: "8px"
              }}>
                <span style={{ 
                  fontWeight: "700", 
                  color: "#374151",
                  textTransform: "capitalize",
                  fontSize: "16px"
                }}>
                  {sport.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <div style={{ textAlign: "right" }}>
                  <div style={{ 
                    color: "#b91c1c", 
                    fontWeight: "bold",
                    fontSize: "18px"
                  }}>
                    {getELOForSport(sport)}
                  </div>
                  <div style={{ 
                    color: "#6b7280", 
                    fontSize: "11px",
                    fontWeight: "500"
                  }}>
                    {getSkillLevel(getELOForSport(sport))}
                  </div>
                </div>
              </div>
              
              {/* AI Analysis */}
              <div style={{
                padding: "8px 12px",
                backgroundColor: "#e0f2fe",
                borderRadius: "8px",
                border: "1px solid #b3e5fc"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "4px"
                }}>
                  <span style={{ fontSize: "12px", color: "#0277bd", fontWeight: "600" }}>
                    🤖 AI Analysis
                  </span>
                </div>
                <p style={{
                  margin: "0",
                  fontSize: "13px",
                  color: "#01579b",
                  fontStyle: "italic",
                  lineHeight: "1.4"
                }}>
                  {getAIAnalysis(sport, currentAndrewID)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Best Sport */}
      <div style={{ 
        marginBottom: "24px", 
        padding: "16px", 
        backgroundColor: "#fef3c7", 
        borderRadius: "12px",
        border: "2px solid #fbbf24"
      }}>
        <h3 style={{ 
          fontSize: "16px", 
          fontWeight: "bold", 
          color: "#92400e", 
          margin: "0 0 8px 0" 
        }}>
          🏆 Best Sport
        </h3>
        <p style={{ 
          fontSize: "18px", 
          fontWeight: "bold", 
          color: "#b45309", 
          margin: 0,
          textTransform: "capitalize"
        }}>
          {getBestSport().replace(/([A-Z])/g, ' $1').trim()}
        </p>
      </div>

      {/* Recent Matches */}
      {recentMatches.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ 
            fontSize: "18px", 
            fontWeight: "bold", 
            color: "#1f2937", 
            marginBottom: "12px" 
          }}>
            Recent Matches
          </h3>
          <div style={{ 
            maxHeight: "200px", 
            overflowY: "auto",
            border: "1px solid #e5e7eb",
            borderRadius: "8px"
          }}>
            {recentMatches.map(match => {
              const isWin = match.playerType === "challenger" 
                ? match.player1Score > match.player2Score 
                : match.player2Score > match.player1Score;
              
              return (
                <div key={match.id} style={{ 
                  padding: "12px", 
                  borderBottom: "1px solid #f3f4f6",
                  backgroundColor: isWin ? "#f0fdf4" : "#fef2f2"
                }}>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    marginBottom: "4px"
                  }}>
                    <span style={{ 
                      fontWeight: "600",
                      fontSize: "14px"
                    }}>
                      {match.player1AndrewID} vs {match.player2AndrewID}
                    </span>
                    <span style={{ 
                      fontWeight: "bold",
                      fontSize: "14px",
                      color: isWin ? "#16a34a" : "#dc2626",
                      backgroundColor: isWin ? "#dcfce7" : "#fecaca",
                      padding: "2px 8px",
                      borderRadius: "12px"
                    }}>
                      {isWin ? 'W' : 'L'}
                    </span>
                  </div>
                  <div style={{ 
                    color: "#6b7280", 
                    fontSize: "12px" 
                  }}>
                    {match.sport} • {match.player1Score}-{match.player2Score}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        style={{
          width: "100%",
          backgroundColor: "#b91c1c",
          color: "white",
          padding: "12px 24px",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
          fontWeight: "600",
          fontSize: "16px",
          transition: "background-color 0.2s"
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = "#991b1b";
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = "#b91c1c";
        }}
      >
        Logout
      </button>
    </div>
  );
}
