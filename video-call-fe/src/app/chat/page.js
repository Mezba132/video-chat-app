"use client";
import { useEffect, useState, useCallback } from "react";
import Peer from "peerjs";
import io from "socket.io-client";

const ChatRoom = () => {
      const [peerId, setPeerId] = useState(null);
      const [remotePeerId, setRemotePeerId] = useState("");
      const [socket, setSocket] = useState(null);
      const [peer, setPeer] = useState(null);
      const [connection, setConnection] = useState(null);
      const [messages, setMessages] = useState([]);
      const [inputMessage, setInputMessage] = useState("");

      useEffect(() => {
            // const newPeer = new Peer({
            //       host: 'localhost',
            //       port: 9000,
            //       path: '/',
            //       secure: false,
            // });
            // setPeer(newPeer);

            const newPeer = new Peer();
            setPeer(newPeer);

            newPeer.on("open", (id) => {
                  setPeerId(id);
            });

            const newSocket = io("http://localhost:8000", {
                  transports: ["websocket", "polling"],
                  path: "/socket",
                  reconnection: true,
                  reconnectionAttempts: 5,
            });

            setSocket(newSocket);

            newSocket.on("connect", () => {
                  console.log("Connected to WebSocket");
                  newSocket.emit("register", newPeer.id);
            });

            return () => {
                  newPeer?.destroy();
                  newSocket?.disconnect();
            };
      }, []);

      const connectToPeer = () => {
            if (remotePeerId) {
                  const conn = peer.connect(remotePeerId);
                  setConnection(conn);

                  conn.on("open", () => {
                        console.log("Connection established");
                  });
            }
      };

      const handleSendMessage = () => {
            if (connection && inputMessage.trim()) {
                  socket.emit("send-message", {
                        toUserId: remotePeerId,
                        message: inputMessage,
                  });
                  setInputMessage("");
            }
      };

      const messageListener = useCallback((data) => {
            setMessages((prevMessages) => [
                  ...prevMessages,
                  { sender: data.sender === peerId ? "You" : "Peer", text: data.message },
            ]);
      }, [peerId]);

      useEffect(() => {
            socket?.on("private-message", messageListener);
            return () => {
                  socket?.off("private-message", messageListener);
            };
      }, [socket, messageListener]);

      return (
            <div className="container">
                  <h1 className="title">Chat Room</h1>

                  {/* Peer ID and Connect Section */}
                  <div className="input-section">
                        <div id="myId" className="peer-id">
                              {peerId ? `My ID: ${peerId}` : "Loading ID..."}
                        </div>
                        <input
                              type="text"
                              placeholder="Enter remote peer ID"
                              className="input"
                              value={remotePeerId}
                              onChange={(e) => setRemotePeerId(e.target.value)}
                        />
                        <button className="button connect-button" onClick={connectToPeer}>
                              Connect
                        </button>
                  </div>

                  {/* Chat Box */}
                  <div className="chat-box">
                        {messages.map((msg, index) => (
                              <div
                                    key={index}
                                    className={`message ${msg.sender === "You" ? "local-message" : "remote-message"}`}
                              >
                                    <strong>{msg.sender}:</strong> {msg.text}
                              </div>
                        ))}
                  </div>

                  {/* Input for sending messages */}
                  <div className="input-section">
                        <input
                              type="text"
                              placeholder="Type your message"
                              className="input"
                              value={inputMessage}
                              onChange={(e) => setInputMessage(e.target.value)}
                        />
                        <button className="button send-button" onClick={handleSendMessage}>
                              Send
                        </button>
                  </div>
            </div>
      );
};

export default ChatRoom;
