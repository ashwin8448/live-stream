import { useEffect, useRef, useState } from "react";
import { connect, Room } from "twilio-video";
import "./styles.css";
import { useNavigate } from "react-router-dom";

const VideoScreener = ({
  credentials,
}: {
  credentials: { roomName: string; token: string };
}) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const roomRef = useRef<Room | null>(null); // Persist room reference
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [sessionStatus, setSessionStatus] = useState<
    "not yet started" | "ongoing" | "ended" | "connecting"
  >("not yet started");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            height: { ideal: 480 },
            width: { ideal: 854 },
            frameRate: 30,
          },
          audio: {
            noiseSuppression: true,
            echoCancellation: true,
            channelCount: 2,
            sampleRate: 48000,
            sampleSize: 16,
            autoGainControl: true,
          },
        });

        // Create audio context and gain node
        audioContextRef.current = new AudioContext();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        const gainNode = audioContextRef.current.createGain();

        // Increase gain to amplify audio
        gainNode.gain.value = 2; // Amplify audio by a factor of 2
        source.connect(gainNode).connect(audioContextRef.current.destination);

        localStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = new MediaStream(stream.getVideoTracks());
          videoRef.current.onloadedmetadata = () => {
            videoRef.current!.play();
          };
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
        setError((error as { message: string }).message);
      }
    })();

    return () => {
      // Clean up audio context on unmount
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleStart = async () => {
    try {
      setSessionStatus("connecting");
      if (localStreamRef.current) {
        const room = await connect(credentials.token, {
          name: credentials.roomName,
          tracks: [
            ...localStreamRef.current.getVideoTracks(),
            ...localStreamRef.current.getAudioTracks(),
          ],
        });
        roomRef.current = room;
        setSessionStatus("ongoing");
      }
    } catch (error) {
      console.log(error);
      setError((error as { message: string }).message);
      handleStop();
    }
  };

  const handleStop = async () => {
    try {
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null; // Reset room reference
      }

      // Notify the server about the room closure
      await fetch("https://twilio.kytt.site/close_room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_name: credentials.roomName }),
        credentials: "include",
      });

      // Stop and clear media stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (err) {
            console.error("Error stopping track:", err);
          }
        });
        localStreamRef.current = null;
      }

      // Clear video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setSessionStatus("ended");
    } catch (error) {
      console.error("Error during session stop:", error);
      setError((error as { message: string }).message);
    }
  };

  let renderComponent;
  switch (sessionStatus) {
    case "not yet started":
      renderComponent = (
        <div>
          <button onClick={handleStart}>Start recording</button>
        </div>
      );
      break;
    case "connecting":
      renderComponent = <h2>Loading</h2>;
      break;
    case "ongoing":
      renderComponent = (
        <div>
          <button onClick={handleStop}>Stop recording</button>
        </div>
      );
      break;
  }
  return (
    <div>
      <h1>Video Screener</h1>
      {error ? (
        <>
          <h2>{error}</h2>
          <button onClick={() => navigate("/")}>Home page</button>
        </>
      ) : sessionStatus != "ended" ? (
        <>
          <video
            ref={videoRef}
            disablePictureInPicture
            className="videoElement"
          />
          {renderComponent}
        </>
      ) : (
        <>
          <h2>Session is over</h2>
          <button onClick={() => navigate("/")}>Home page</button>
        </>
      )}
    </div>
  );
};

export default VideoScreener;
