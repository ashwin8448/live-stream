import { useRef, useState, useEffect } from "react";
import {
  connect,
  createLocalTracks,
  Room,
  LocalTrack,
  RemoteTrackPublication,
  RemoteVideoTrack,
} from "twilio-video";
import "./styles.css";

const VideoScreener = ({
  credentials,
}: {
  credentials: { roomName: string; token: string };
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const recordedChunks = useRef<Blob[]>([]);
  const [recordedVideoURL, setRecordedVideoURL] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const handleStartStop = async () => {
    if (!isPlaying) {
      try {
        const localTracks = await createLocalTracks({
          video: {
            height: 1080,
            width: 1920,
            frameRate: 30,
          },
          audio: { noiseSuppression: true, echoCancellation: true }, // Enable these features
        });
        const videoTrack = localTracks.find(
          (track: LocalTrack) => track.kind === "video"
        );
        if (videoTrack && videoRef.current) {
          videoTrack.attach(videoRef.current);
          setIsPlaying(true);

          // Connect to a Twilio room (replace "your-twilio-token" with your actual Twilio token)
          const room: Room = await connect(credentials.token, {
            name: credentials.roomName,
            tracks: localTracks,
          });

          // Handle participant connected
          room.on("participantConnected", (participant) => {
            participant.tracks.forEach(
              (publication: RemoteTrackPublication) => {
                if (publication.track && publication.track.kind === "video") {
                  (publication.track as RemoteVideoTrack).attach(
                    videoRef.current!
                  );
                }
              }
            );

            participant.on("trackSubscribed", (track) => {
              if (track.kind === "video") {
                (track as RemoteVideoTrack).attach(videoRef.current!);
              }
            });
          });

          // Handle participant disconnected
          room.on("participantDisconnected", (participant) => {
            participant.tracks.forEach(
              (publication: RemoteTrackPublication) => {
                if (publication.track && publication.track.kind === "video") {
                  (publication.track as RemoteVideoTrack)
                    .detach()
                    .forEach((element) => element.remove());
                }
              }
            );
          });

          // Disconnect from the room on component unmount
          return () => {
            room.disconnect();
          };
        }
      } catch (error) {
        alert("Error accessing webcam and microphone");
        console.error("Error accessing webcam and microphone: ", error);
      }
    } else {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach((track) => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsPlaying(false);
      setIsRecording(false);
      setRecordedVideoURL(null);
    }
  };

  const handleRecordStartStop = () => {
    if (!isRecording) {
      setRecordedVideoURL(null);
      recordedChunks.current = [];
      const stream = videoRef.current?.srcObject as MediaStream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.start();
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: "video/webm" });
        setRecordedVideoURL(URL.createObjectURL(blob));
      };
      setIsRecording(true);
    } else {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  return (
    <div>
      <h1>Video Screener</h1>
      <video ref={videoRef} disablePictureInPicture className="videoElement" />
      <div>
        <button onClick={handleStartStop}>
          {isPlaying ? "Stop Video" : "Start Video"}
        </button>
        {isPlaying && (
          <button onClick={handleRecordStartStop}>
            {isRecording ? "Stop Recording" : "Start Recording"}
          </button>
        )}
      </div>
      {recordedVideoURL && (
        <div>
          <h2>Recorded Video {recordedVideoURL}</h2>
          <video src={recordedVideoURL} controls className="videoElement" />
        </div>
      )}
    </div>
  );
};

export default VideoScreener;
