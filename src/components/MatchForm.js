import { useState } from "react";
import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import React from "react";

export default function MatchForm({ currentAndrewID }) {
  const [opponentAndrewID, setOpponentAndrewID] = useState("");
  const [sport, setSport] = useState("pingpong");
  const [challengerScore, setChallengerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!opponentAndrewID) return alert("Enter opponent AndrewID");
    if (opponentAndrewID === currentAndrewID) return alert("Cannot challenge yourself");

    try {
      await addDoc(collection(db, "matches_pending"), {
        sport,
        challengerUID: auth.currentUser.uid,
        challengerAndrewID: currentAndrewID,
        opponentUID: opponentAndrewID,  // could also be UID if you resolve it
        opponentAndrewID,
        challengerScore: Number(challengerScore),
        opponentScore: Number(opponentScore),
        confirmed: false,
        createdAt: serverTimestamp(),
      });
      alert("Match added! Waiting for confirmation.");
      setOpponentAndrewID("");
      setChallengerScore(0);
      setOpponentScore(0);
    } catch (err) {
      console.error(err);
      alert("Failed to add match.");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{marginBottom: "30px"}}>
      <h3 style={{color:"#b91c1c"}}>Add a Match That You've Played</h3>
      <input
        placeholder="Opponent AndrewID"
        value={opponentAndrewID}
        onChange={e => setOpponentAndrewID(e.target.value)}
        style={{marginBottom:"10px", padding:"8px", width:"100%"}}
      />
      <select value={sport} onChange={e => setSport(e.target.value)} style={{marginBottom:"10px", padding:"8px", width:"100%"}}>
        <option value="pingpong">Ping Pong</option>
        <option value="foosball">Foosball</option>
        <option value="basketball">Basketball 1v1</option>
      </select>
      <input
        type="number"
        placeholder="Your Score"
        value={challengerScore}
        onChange={e => setChallengerScore(e.target.value)}
        style={{marginBottom:"10px", padding:"8px", width:"100%"}}
      />
      <input
        type="number"
        placeholder="Opponent Score"
        value={opponentScore}
        onChange={e => setOpponentScore(e.target.value)}
        style={{marginBottom:"10px", padding:"8px", width:"100%"}}
      />
      <button type="submit" style={{padding:"10px 20px", backgroundColor:"#ef4444", color:"white", border:"none", borderRadius:"10px"}}>
        Submit Match
      </button>
    </form>
  );
}
