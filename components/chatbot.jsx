import { useState } from "react";

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    const userMsg = input;
    setMessages([...messages, { sender: "user", text: userMsg }]);
    setInput("");

    const res = await fetch("https://compute.0g.xyz/jobs/chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMsg })
    });

    const data = await res.json();
    setMessages((msgs) => [...msgs, { sender: "bot", text: data.reply }]);
  };

  return (
    <div style={{ border: "1px solid gray", padding: "10px", maxWidth: "400px" }}>
      <div style={{ height: "200px", overflowY: "auto", marginBottom: "10px" }}>
        {messages.map((m, i) => (
          <div key={i}><b>{m.sender}:</b> {m.text}</div>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask something..."
        style={{ width: "70%" }}
      />
      <button onClick={sendMessage} style={{ width: "28%" }}>Send</button>
    </div>
  );
}
