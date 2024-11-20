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
  const [isRecording, setIsRecording] = useState<boolean>(false);

  const handleStartStop = async () => {
    if (!isRecording) {
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
          setIsRecording(true);

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
          track.stop(); // Stop all tracks (audio + video)
        });
      }

      // Clear the video element's source
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setIsRecording(false);

      // Disconnect from the room if it exists
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null; // Reset room reference
      }
    }
  };

  return (
    <div>
      <h1>Video Screener</h1>
      <video ref={videoRef} disablePictureInPicture className="videoElement" />
      <div>
        <button onClick={handleStartStop}>
          {isRecording ? "Stop recording" : "Start recording"}
        </button>
      </div>
    </div>
  );
};

export default VideoScreener;
