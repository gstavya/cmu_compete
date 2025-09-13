import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, deleteDoc, setDoc, getDoc, updateDoc, serverTimestamp, query, where } from "firebase/firestore";
import { calculateELO } from "../utils/elo";
import React from "react";

export default function PendingMatches({ currentAndrewID }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const snap = await getDocs(collection(db, "matches_pending"));
        setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, []);

  if (loading) return <p style={{color:"#660000"}}>Loading pending matches...</p>;
  if (!currentAndrewID) return <p style={{color:"#660000"}}>Loading user...</p>;

  const handleConfirm = async (match) => {
    console.log("Confirm clicked!", match);
    try {
      const challengerRef = doc(db, "users", match.challengerUID);
      
      console.log("Challenger ref:", challengerRef.path);
      console.log("Opponent AndrewID:", match.opponentAndrewID);

      // Look up opponent's UID from their AndrewID
      const usersRef = collection(db, "users");
      const opponentQuery = query(usersRef, where("email", "==", `${match.opponentAndrewID}@andrew.cmu.edu`));
      const opponentQuerySnap = await getDocs(opponentQuery);
      
      if (opponentQuerySnap.empty) {
        alert("Opponent user not found in database!");
        return;
      }
      
      const opponentDoc = opponentQuerySnap.docs[0];
      const opponentRef = doc(db, "users", opponentDoc.id);
      
      console.log("Opponent ref:", opponentRef.path);

      const challengerSnap = await getDoc(challengerRef);
      const opponentSnap = await getDoc(opponentRef);
      
      console.log("Challenger exists:", challengerSnap.exists());
      console.log("Opponent exists:", opponentSnap.exists());
      
      if (!challengerSnap.exists() || !opponentSnap.exists()) {
        console.log("User documents don't exist");
        return;
      }

      const challengerData = challengerSnap.data();
      const opponentData = opponentSnap.data();
      const sport = match.sport;

      console.log("Challenger data:", challengerData);
      console.log("Opponent data:", opponentData);
      console.log("Sport:", sport);

      // Ensure ELO data exists, default to 1200 if missing
      const challengerElo = challengerData.elo && challengerData.elo[sport] ? challengerData.elo[sport] : 1200;
      const opponentElo = opponentData.elo && opponentData.elo[sport] ? opponentData.elo[sport] : 1200;

      console.log("Challenger ELO:", challengerElo);
      console.log("Opponent ELO:", opponentElo);
      console.log("Match scores:", { challengerScore: match.challengerScore, opponentScore: match.opponentScore });

      // Validate all inputs before calling calculateELO
      if (typeof challengerElo !== 'number' || typeof opponentElo !== 'number' || 
          typeof match.challengerScore !== 'number' || typeof match.opponentScore !== 'number') {
        throw new Error(`Invalid input types: challengerElo=${typeof challengerElo}, opponentElo=${typeof opponentElo}, challengerScore=${typeof match.challengerScore}, opponentScore=${typeof match.opponentScore}`);
      }

      // Simple ELO calculation to avoid any potential issues
      let newChallengerElo, newOpponentElo;
      
      try {
        // Determine winner and apply simple ELO change
        if (match.challengerScore > match.opponentScore) {
          // Challenger wins
          newChallengerElo = challengerElo + 20;
          newOpponentElo = opponentElo - 20;
        } else if (match.opponentScore > match.challengerScore) {
          // Opponent wins
          newChallengerElo = challengerElo - 20;
          newOpponentElo = opponentElo + 20;
        } else {
          // Tie - no change
          newChallengerElo = challengerElo;
          newOpponentElo = opponentElo;
        }
        
        console.log("Simple ELO calculation successful");
      } catch (eloError) {
        console.error("ELO calculation error:", eloError);
        throw eloError;
      }

      console.log("New ELOs:", { newChallengerElo, newOpponentElo });

      try {
        console.log("Updating challenger ELO...");
        await updateDoc(challengerRef, { [`elo.${sport}`]: newChallengerElo });
        console.log("Challenger ELO updated successfully");
        
        console.log("Updating opponent ELO...");
        await updateDoc(opponentRef, { [`elo.${sport}`]: newOpponentElo });
        console.log("Opponent ELO updated successfully");

        console.log("Moving match to completed...");
        await setDoc(doc(db, "matches_completed", match.id), {
          ...match,
          confirmed: true,
          confirmedAt: serverTimestamp(),
        });
        console.log("Match moved to completed successfully");

        console.log("Deleting from pending matches...");
        await deleteDoc(doc(db, "matches_pending", match.id));
        console.log("Match deleted from pending successfully");

        setMatches(prev => prev.filter(m => m.id !== match.id));
        console.log("UI updated successfully");
      } catch (firestoreError) {
        console.error("Firestore operation error:", firestoreError);
        throw firestoreError;
      }

      console.log("Match confirmed successfully!");

    } catch (err) {
      console.error("Error details:", err);
      alert(`Failed to confirm match: ${err.message}`);
    }
  };

  return (
    <div>
      <h2 style={{fontSize:'24px', fontWeight:'bold', color:'#b91c1c', marginBottom:'20px'}}>Pending Matches</h2>
      {matches.length === 0 && <p style={{color:'#660000', textAlign:'center'}}>No pending matches!</p>}
      {matches.map(match => (
        <div key={match.id} style={{
          padding:'20px', backgroundColor:'#ffcccc', borderRadius:'12px', marginBottom:'15px',
          display:'flex', justifyContent:'space-between', alignItems:'center', border:'2px solid #ef4444'
        }}>
          <div>
            <p style={{fontWeight:'bold'}}>{match.sport}</p>
            <p style={{color:'#660000'}}>
              {match.challengerAndrewID} ({match.challengerScore}) vs {match.opponentAndrewID} ({match.opponentScore})
            </p>
          </div>
          {currentAndrewID === match.opponentAndrewID && (
            <button 
              onClick={() => handleConfirm(match)}
              className="cmu-button"
              style={{padding: '10px 20px'}}
            >
              Confirm Match
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
