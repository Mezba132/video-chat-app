"use client";
import { useEffect, useState } from "react";
import Peer from "peerjs";
import io from "socket.io-client";

const VideoChat = () => {
  const [peerId, setPeerId] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [peer, setPeer] = useState(null);
  const [remotePeerId, setRemotePeerId] = useState("");
  const [remoteStream, setRemoteStream] = useState(null);
  const [callInProgress, setCallInProgress] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);

  const newSocket = io("http://localhost:5000");

  const initPeerAndSocket = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    setLocalStream(stream);

    const newPeer = new Peer();
    setPeer(newPeer);

    newPeer.on("open", (id) => {
      setPeerId(id);
    });

    newPeer.on("call", (call) => {
      setIncomingCall(call);
    });

    newSocket.on("connect", () => {
      console.log("Connected via WebSocket");
      newSocket.emit("register", newPeer.id);
    });

    newSocket.on("new-call", (data) => {
      setCallInProgress(true);
      const outgoingCall = newPeer.call(data.callerId, stream);
      outgoingCall.on("stream", (incomingStream) => {
        setRemoteStream(incomingStream);
      });
    });
  };

  useEffect(() => {
    initPeerAndSocket();
    return () => {
      peer?.destroy();
      newSocket?.disconnect();
      localStream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleAnswerCall = () => {
    if (incomingCall && localStream) {
      incomingCall.answer(localStream);
      incomingCall.on("stream", (incomingStream) => {
        setRemoteStream(incomingStream);
      });

      setCallInProgress(true);
      setIncomingCall(null);
    }
  };

  const handleCall = () => {
    if (remotePeerId && localStream) {
      const outgoingCall = peer.call(remotePeerId, localStream);
      outgoingCall.on("stream", (incomingStream) => {
        setRemoteStream(incomingStream);
      });

      setCallInProgress(true);
    }
  };

  const handleHangup = () => {
    if (peer) {
      peer.disconnect();
    }
    localStream.getTracks().forEach((track) => track.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setCallInProgress(false);
    setIncomingCall(null);
  };

  return (
    <div className="container">
      <h1 className="title">Video Chat</h1>

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
      </div>

      <div className="video-container">
        <div className="video-section">
          <h2 className="video-title">Your Video</h2>
          <video
            ref={(video) => {
              if (video && localStream) {
                video.srcObject = localStream;
              }
            }}
            autoPlay
            playsInline
            className="video-element"
          ></video>
        </div>

        <div className="video-section">
          <h2 className="video-title">Remote Video</h2>
          <video
            ref={(video) => {
              if (video && remoteStream) {
                video.srcObject = remoteStream;
              }
            }}
            autoPlay
            playsInline
            className="video-element"
          ></video>
        </div>
      </div>

      <div className="button-container">
        {!callInProgress && (
          <button
            id="callButton"
            className="button call-button"
            onClick={handleCall}
          >
            Call
          </button>
        )}
        {callInProgress && (
          <button
            id="hangupButton"
            className="button hangup-button"
            onClick={handleHangup}
          >
            Hang Up
          </button>
        )}
        {incomingCall && !callInProgress && (
          <button
            id="answerButton"
            className="button answer-button"
            onClick={handleAnswerCall}
          >
            Answer
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoChat;
