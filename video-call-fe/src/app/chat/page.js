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
      const [connectionStatus, setConnectionStatus] = useState(null);

      useEffect(() => {
            const newPeer = new Peer({
                  host: 'localhost',
                  port: 9000,
                  path: '/',
                  secure: false,
            });
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

            newSocket.on("success-message", () => {
                  setConnectionStatus("success");
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

                  let connectionTimeout = setTimeout(() => {
                        setConnectionStatus("fail");
                        console.log("Connection timed out");
                  }, 2000);

                  conn.on("open", () => {
                        clearTimeout(connectionTimeout);
                        socket.emit("connection-success", remotePeerId);
                        setConnectionStatus("success");
                        console.log("Connection established");
                  });

                  conn.on("error", (err) => {
                        clearTimeout(connectionTimeout);
                        setConnectionStatus("fail");
                        console.log("Connection failed:", err);
                  });

            }
      };

      useEffect(() => {
            if (connectionStatus) {
                  const timer = setTimeout(() => {
                        setConnectionStatus(null);
                  }, 5000);
                  return () => clearTimeout(timer);
            }
      }, [connectionStatus]);

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

                  <div className="input-section-box">
                        <div className="peer-id-box">
                              <div id="myId" className="peer-id">
                                    {peerId ? `My ID : ${peerId}` : "Loading ID..."}
                              </div>
                        </div>

                        <div className="input-box">
                              <div id="myId" className="peer-id">
                                    Remote ID :
                              </div>
                              <input
                                    type="text"
                                    placeholder="Enter remote peer ID"
                                    className="input"
                                    value={remotePeerId}
                                    onChange={(e) => setRemotePeerId(e.target.value)}
                              />
                        </div>

                        <div className="button-box">
                              <button className="button connect-button" onClick={connectToPeer}>
                                    Connect
                              </button>
                        </div>

                        {connectionStatus === "success" && (
                              <div className="notification success">
                                    {`Connection successful : ${peerId} successfully Connected`}
                              </div>
                        )}

                        {connectionStatus === "fail" && (
                              <div className="notification fail">
                                    Connection failed. Please try again.
                              </div>
                        )}
                  </div>

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

                  <div >
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


