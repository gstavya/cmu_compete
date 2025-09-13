import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, addDoc, query, orderBy, onSnapshot } from "firebase/firestore";

export default function Messages({ chatId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    const q = query(collection(db, "messages", chatId, "msgs"), orderBy("timestamp"));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, [chatId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await addDoc(collection(db, "messages", chatId, "msgs"), {
      sender: auth.currentUser.uid,
      text,
      timestamp: new Date(),
    });
    setText("");
  };

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 mt-4">
      <h2 className="text-xl font-bold mb-4 text-red-700">Messages</h2>
      <div className="h-40 overflow-y-auto border border-red-200 rounded-lg p-3 mb-4 bg-red-50">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`mb-2 p-2 rounded-lg ${
              m.sender === auth.currentUser.uid 
                ? 'bg-red-600 text-white ml-8' 
                : 'bg-white border border-red-200 mr-8'
            }`}>
              <p className="text-sm font-medium">
                {m.sender === auth.currentUser.uid ? "You" : "Opponent"}:
              </p>
              <p className="text-sm">{m.text}</p>
            </div>
          ))
        )}
      </div>
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-grow p-3 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          placeholder="Type a message..."
        />
        <button className="bg-red-700 text-white px-6 py-3 rounded-lg hover:bg-red-800 transition-colors duration-200 font-medium">
          Send
        </button>
      </form>
    </div>
  );
}
