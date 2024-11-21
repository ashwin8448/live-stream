import { useRef, useState } from "react";
import { connect, Room } from "twilio-video";
import "./styles.css";

const VideoScreener = ({
  credentials,
}: {
  credentials: { roomName: string; token: string };
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const roomRef = useRef<Room | null>(null); // Persist room reference
  const localStreamRef = useRef<MediaStream | null>(null);
  const [sessionStatus, setSessionStatus] = useState<
    "not yet started" | "ongoing" | "ended"
  >("not yet started");

  const handleStartStop = async () => {
    if (sessionStatus === "not yet started") {
      try {
        localStreamRef.current = await navigator.mediaDevices.getUserMedia({
          video: {
            height: 1080,
            width: 1920,
            frameRate: 30,
          },
          audio: { noiseSuppression: true, echoCancellation: true },
        });
        const localVideoStream = localStreamRef.current.getVideoTracks();

        if (videoRef.current) {
          videoRef.current.srcObject = new MediaStream(localVideoStream);
          videoRef.current.play();
          setSessionStatus("ongoing");

          const room = await connect(credentials.token, {
            name: credentials.roomName,
            tracks: [
              ...localStreamRef.current.getVideoTracks(),
              ...localStreamRef.current.getAudioTracks(),
            ],
          });
          roomRef.current = room; // Store room reference in useRef
        }
      } catch (error) {
        alert("Error accessing webcam and microphone");
        console.error("Error accessing webcam and microphone: ", error);
      }
    } else {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          console.log(track);
          track.stop(); // Stop all tracks (audio + video)
        });
      }

      // Clear the video element's source
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setSessionStatus("ended");

      // Disconnect from the room if it exists
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null; // Reset room reference
        (() => {
          fetch("https://twilio.kytt.site/close_room", {
            method: "POST",
            body: JSON.stringify({ room_name: credentials.roomName }),
            credentials: 'include'
          });
        })();
      }
    }
  };

  return (
    <div>
      {sessionStatus != "ended" ? (
        <>
          <h1>Video Screener</h1>
          <video
            ref={videoRef}
            disablePictureInPicture
            className="videoElement"
          />
          <div>
            <button onClick={handleStartStop}>
              {sessionStatus === "not yet started" && "Start recording"}
              {sessionStatus === "ongoing" && "Stop recording"}
            </button>
          </div>
        </>
      ) : (
        <h1>Session is over</h1>
      )}
    </div>
  );
};

export default VideoScreener;
