"use client";
import { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:7000");

const Chat = () => {
      const [message, setMessage] = useState("");
      const [messages, setMessages] = useState([]);
      const [username, setUsername] = useState("");
      const [recipient, setRecipient] = useState("");
      const [joined, setJoined] = useState(false);

      useEffect(() => {
            socket.on("joined", (welcomeMessage) => {
                  alert(welcomeMessage);
                  setJoined(true);
            });

            socket.on("message", (data) => {
                  setMessages((prev) => [...prev, data]);
            });

            return () => {
                  socket.off("joined");
                  socket.off("message");
            };
      }, []);

      const joinChat = () => {
            if (username) {
                  socket.emit("join", username);
            }
      };

      const sendMessage = () => {
            if (recipient && message) {
                  socket.emit("message", { recipient, message });
                  setMessages((prev) => [...prev, { sender: "You", message }]);
                  setMessage("");
            }
      };

      return (
            <div className="chatContainer">
                  {!joined ? (
                        <div className="joinContainer">
                              <input
                                    type="text"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="input"
                              />
                              <button onClick={joinChat} className="button">
                                    Join Chat
                              </button>
                        </div>
                  ) : (
                        <div className="chatBox">
                              <div className="chatHeader">
                                    <h3>Welcome, {username}!</h3>
                              </div>
                              <div className="messages">
                                    {messages.map((msg, index) => (
                                          <div
                                                key={index}
                                                className={msg.sender === "You" ? "myMessage" : "otherMessage"}
                                          >
                                                <strong>{msg.sender}:</strong> {msg.message}
                                          </div>
                                    ))}
                              </div>
                              <div className="inputContainer">
                                    <input
                                          type="text"
                                          placeholder="Recipient's username"
                                          value={recipient}
                                          onChange={(e) => setRecipient(e.target.value)}
                                          className="input"
                                    />
                                    <input
                                          type="text"
                                          placeholder="Type a message..."
                                          value={message}
                                          onChange={(e) => setMessage(e.target.value)}
                                          className="input"
                                          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                                    />
                                    <button onClick={sendMessage} className="button">
                                          Send
                                    </button>
                              </div>
                        </div>
                  )}
            </div>
      );
};

export default Chat;
