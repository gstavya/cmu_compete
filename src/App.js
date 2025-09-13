import { useEffect, useState } from "react";
import { auth } from "./firebase";
import Login from "./components/Login";
import MatchForm from "./components/MatchForm";
import PendingMatches from "./components/PendingMatches";
import Leaderboard from "./components/Leaderboard";
import Challenges from "./components/Challenges";
import VideoUpload from "./components/VideoUpload";
import Feed from "./components/Feed";
import Betting from "./components/Betting";
import Tournament from "./components/Tournament";
import ProfilePage from "./pages/ProfilePage";
import PublicProfilePage from "./pages/PublicProfilePage";
import AIVideos from "./components/AIVideos";
import AISuggestions from "./components/AISuggestions";
import ChallengePage from "./pages/ChallengePage";
import React from "react";

export default function App() {
  const [user, setUser] = useState(null);
  const [currentAndrewID, setCurrentAndrewID] = useState("");
  const [activeTab, setActiveTab] = useState("main");
  const [loading, setLoading] = useState(true);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [viewingChallenge, setViewingChallenge] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(
      (u) => {
        console.log('Auth state changed:', u ? 'User logged in' : 'User logged out');
        if (u) {
          setUser(u);
          setCurrentAndrewID(u.email.split("@")[0]);
        } else {
          setUser(null);
          setCurrentAndrewID("");
        }
        setLoading(false);
      },
      (error) => {
        console.error('Auth state change error:', error);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#b91c1c',
        color: 'white',
        fontSize: '18px'
      }}>
        Loading CMU Compete...
      </div>
    );
  }

  const handleViewProfile = (andrewID) => {
    setViewingProfile(andrewID);
  };

  const handleBackToMain = () => {
    setViewingProfile(null);
    setActiveTab("main");
  };

  const handleViewChallenge = (opponent, sport) => {
    setViewingChallenge({ opponent, sport });
  };

  const handleBackFromChallenge = () => {
    setViewingChallenge(null);
  };

  if (!user) return <Login />;

  // If viewing someone else's profile
  if (viewingProfile) {
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
              onClick={handleBackToMain}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#4b5563';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#6b7280';
                e.target.style.transform = 'scale(1)';
              }}
            >
              ← Back
            </button>
            <span style={{color: '#ffcccc', fontSize: '14px'}}>Viewing {viewingProfile}'s Profile</span>
            <button
              onClick={() => auth.signOut()}
              style={{
                backgroundColor: 'white',
                color: '#b91c1c',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#ffcccc';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.transform = 'scale(1)';
              }}
            >
              Logout
            </button>
          </div>
        </header>
        <main style={{ maxWidth: "1200px", margin: "30px auto", padding: "0 20px" }}>
          <PublicProfilePage andrewID={viewingProfile} />
        </main>
      </>
    );
  }

  // If viewing challenge form
  if (viewingChallenge) {
    return <ChallengePage 
      opponent={viewingChallenge.opponent} 
      sport={viewingChallenge.sport} 
      currentAndrewID={currentAndrewID}
      onBack={handleBackFromChallenge} 
    />;
  }

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
          <div style={{display: 'flex', gap: '10px'}}>
            <button
              onClick={() => setActiveTab("main")}
              style={{
                backgroundColor: activeTab === "main" ? '#b91c1c' : 'white',
                color: activeTab === "main" ? 'white' : '#b91c1c',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseOver={(e) => {
                if (activeTab !== "main") {
                  e.target.style.backgroundColor = '#ffcccc';
                  e.target.style.transform = 'scale(1.05)';
                }
              }}
              onMouseOut={(e) => {
                if (activeTab !== "main") {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.transform = 'scale(1)';
                }
              }}
            >
              Main
            </button>
            <button
              onClick={() => setActiveTab("feed")}
              style={{
                backgroundColor: activeTab === "feed" ? '#b91c1c' : 'white',
                color: activeTab === "feed" ? 'white' : '#b91c1c',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseOver={(e) => {
                if (activeTab !== "feed") {
                  e.target.style.backgroundColor = '#ffcccc';
                  e.target.style.transform = 'scale(1.05)';
                }
              }}
              onMouseOut={(e) => {
                if (activeTab !== "feed") {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.transform = 'scale(1)';
                }
              }}
            >
              Feed
            </button>
            <button
              onClick={() => setActiveTab("betting")}
              style={{
                backgroundColor: activeTab === "betting" ? '#b91c1c' : 'white',
                color: activeTab === "betting" ? 'white' : '#b91c1c',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseOver={(e) => {
                if (activeTab !== "betting") {
                  e.target.style.backgroundColor = '#ffcccc';
                  e.target.style.transform = 'scale(1.05)';
                }
              }}
              onMouseOut={(e) => {
                if (activeTab !== "betting") {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.transform = 'scale(1)';
                }
              }}
            >
              Betting
            </button>
            <button
              onClick={() => setActiveTab("tournament")}
              style={{
                backgroundColor: activeTab === "tournament" ? '#b91c1c' : 'white',
                color: activeTab === "tournament" ? 'white' : '#b91c1c',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseOver={(e) => {
                if (activeTab !== "tournament") {
                  e.target.style.backgroundColor = '#ffcccc';
                  e.target.style.transform = 'scale(1.05)';
                }
              }}
              onMouseOut={(e) => {
                if (activeTab !== "tournament") {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.transform = 'scale(1)';
                }
              }}
            >
              Tournament
            </button>
            <button
              onClick={() => setActiveTab("aivideos")}
              style={{
                backgroundColor: activeTab === "aivideos" ? '#b91c1c' : 'white',
                color: activeTab === "aivideos" ? 'white' : '#b91c1c',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseOver={(e) => {
                if (activeTab !== "aivideos") {
                  e.target.style.backgroundColor = '#ffcccc';
                  e.target.style.transform = 'scale(1.05)';
                }
              }}
              onMouseOut={(e) => {
                if (activeTab !== "aivideos") {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.transform = 'scale(1)';
                }
              }}
            >
              AI-analyzed videos
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              style={{
                backgroundColor: activeTab === "profile" ? '#b91c1c' : 'white',
                color: activeTab === "profile" ? 'white' : '#b91c1c',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseOver={(e) => {
                if (activeTab !== "profile") {
                  e.target.style.backgroundColor = '#ffcccc';
                  e.target.style.transform = 'scale(1.05)';
                }
              }}
              onMouseOut={(e) => {
                if (activeTab !== "profile") {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.transform = 'scale(1)';
                }
              }}
            >
              Profile
            </button>
          </div>
          <span style={{color: '#ffcccc', fontSize: '14px'}}>Welcome, {currentAndrewID}</span>
          <button
            onClick={() => auth.signOut()}
            style={{
              backgroundColor: 'white',
              color: '#b91c1c',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#ffcccc';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.transform = 'scale(1)';
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <main style={{ maxWidth: "1200px", margin: "30px auto", padding: "0 20px" }}>
        {activeTab === "main" ? (
          <>
            {/* AI Suggestions - TOP PRIORITY */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '30px', marginBottom: '30px'}}>
              <AISuggestions currentAndrewID={currentAndrewID} onViewChallenge={handleViewChallenge} />
            </div>

            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px', marginBottom: '30px'}}>
              <div className="cmu-card">
                <MatchForm currentAndrewID={currentAndrewID} />
              </div>

              <div className="cmu-card">
                <PendingMatches currentAndrewID={currentAndrewID} />
              </div>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px', marginBottom: '30px'}}>
              <div className="cmu-card">
                <Challenges currentAndrewID={currentAndrewID} />
              </div>

              <div className="cmu-card">
                <Leaderboard currentAndrewID={currentAndrewID} onViewProfile={handleViewProfile} onViewChallenge={handleViewChallenge} />
              </div>
            </div>

            {user && (
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px', marginBottom: '30px'}}>
                <div className="cmu-card">
                  <VideoUpload currentAndrewID={currentAndrewID} user={user} />
                </div>
              </div>
            )}
          </>
        ) : activeTab === "feed" ? (
          <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '30px', marginBottom: '30px'}}>
            <Feed currentAndrewID={currentAndrewID} />
          </div>
        ) : activeTab === "betting" ? (
          <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '30px', marginBottom: '30px'}}>
            <Betting currentAndrewID={currentAndrewID} user={user} />
          </div>
        ) : activeTab === "tournament" ? (
          <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '30px', marginBottom: '30px'}}>
            <Tournament currentAndrewID={currentAndrewID} user={user} />
          </div>
        ) : activeTab === "aivideos" ? (
          <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '30px', marginBottom: '30px'}}>
            <AIVideos currentAndrewID={currentAndrewID} />
          </div>
        ) : activeTab === "profile" ? (
          <ProfilePage user={user} currentAndrewID={currentAndrewID} />
        ) : null}
      </main>
    </>
  );
}
