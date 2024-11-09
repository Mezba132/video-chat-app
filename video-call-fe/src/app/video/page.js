"use client";
import { useEffect, useState } from "react";
import Peer from "peerjs";
import io from "socket.io-client";

const VideoChat = () => {
  const [peerId, setPeerId] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [socket, setSocket] = useState(null);
  const [peer, setPeer] = useState(null);
  const [remotePeerId, setRemotePeerId] = useState("");
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCamEnabled, setIsCamEnabled] = useState(true);
  const [callInProgress, setCallInProgress] = useState(false);  // Track if call is active

  useEffect(() => {
    const newPeer = new Peer();
    setPeer(newPeer);

    newPeer.on("open", (id) => {
      setPeerId(id);
    });

    newPeer.on("call", (call) => {
      call.answer(localStream);
      call.on("stream", (remoteStream) => {
        setRemoteStream(remoteStream);
      });
    });

    const newSocket = io("http://localhost:8000", {
      transports: ["websocket", "polling"],
      path: "/socket",
      reconnection: true,
      reconnectionAttempts: 5,
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected via WebSocket");
      newSocket.emit("register", newPeer.id);
    });

    newSocket.on("new-call", (data) => {
      setCallInProgress(true);
      const call = newPeer.call(data.callerId, localStream);
      call.on("stream", (remoteStream) => {
        setRemoteStream(remoteStream);
      });
    });

    return () => {
      newPeer?.destroy();
      newSocket?.disconnect();
    };
  }, [localStream]);

  const getMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
    } catch (error) {
      console.error("Error accessing media devices.", error);
    }
  };

  useEffect(() => {
    getMediaStream();
  }, []);

  const handleCall = () => {
    console.log("call please");

    if (remotePeerId && localStream) {
      const call = peer.call(remotePeerId, localStream);
      call.on("stream", (remoteStream) => {
        setRemoteStream(remoteStream);
      });

      socket.emit("make-call", {
        callerId: peerId,
        receiverId: remotePeerId,
      });

      setCallInProgress(true);
    }
  };

  const handleHangup = async () => {
    if (peer) {
      peer.disconnect();
    }
    localStream.getTracks().forEach((track) => track.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setCallInProgress(false);
    setIsMicEnabled(true);
    setIsCamEnabled(true);
  };

  const toggleMicrophone = () => {
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicEnabled(audioTrack.enabled);
    }
  };

  const toggleCamera = () => {
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCamEnabled(videoTrack.enabled);
    }
  };

  return (
    <div className="container">
      <h1 className="title">Video Chat</h1>

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
        <button
          id="callButton"
          className="button call-button"
          onClick={handleCall}
          disabled={callInProgress} // Disable call button while call is in progress
        >
          Join
        </button>
        {callInProgress && (
          <button
            id="hangupButton"
            className="button hangup-button"
            onClick={handleHangup}
          >
            Hang Up
          </button>
        )}
        <button
          id="micButton"
          className="button mic-button"
          onClick={toggleMicrophone}
          disabled={!callInProgress} // Disable microphone button if no call is in progress
        >
          {isMicEnabled ? "Mute" : "Unmute"} Microphone
        </button>
        <button
          id="camButton"
          className="button cam-button"
          onClick={toggleCamera}
          disabled={!callInProgress} // Disable camera button if no call is in progress
        >
          {isCamEnabled ? "Disable" : "Enable"} Camera
        </button>
      </div>
    </div>
  );
};

export default VideoChat;
