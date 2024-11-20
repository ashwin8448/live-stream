import { useRef, useState, useEffect } from "react";
import {
  connect,
  createLocalTracks,
  Room,
  // LocalTrack,
  LocalVideoTrack,
  LocalAudioTrack,
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
  const [recordedVideoURL, setRecordedVideoURL] = useState<string | null>(null);
  const roomRef = useRef<Room | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);

  const handleStartStop = async () => {
    if (!isPlaying) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current!.play();
          };
          videoRef.current.muted = true;
          setIsPlaying(true);
        }
      } catch (error) {
        alert("Error accessing webcam and microphone");
        console.error("Error accessing webcam and microphone: ", error);
      }
    } else {
      const stream = videoRef.current?.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsPlaying(false);
      setIsRecording(false);
      setRecordedVideoURL(null);
    }
  };

  const handleRecordStartStop = async () => {
    console.log("record click");
    if (!isRecording) {
      try {
        const localTracks = await createLocalTracks({
          video: true,
          audio: true,
        });

        const room: Room = await connect(credentials.token, {
          name: credentials.roomName,
          tracks: localTracks,
        });

        roomRef.current = room;

        const stream = new MediaStream();
        localTracks.forEach((track) => {
          if (track.kind === "video" || track.kind === "audio") {
            stream.addTrack(
              (track as LocalVideoTrack | LocalAudioTrack).mediaStreamTrack
            );
          }
        });

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

        room.on("participantConnected", (participant) => {
          participant.tracks.forEach((publication: RemoteTrackPublication) => {
            if (publication.track && publication.track.kind === "video") {
              (publication.track as RemoteVideoTrack).attach(videoRef.current!);
            }
          });

          participant.on("trackSubscribed", (track) => {
            if (track.kind === "video") {
              (track as RemoteVideoTrack).attach(videoRef.current!);
            }
          });
        });

        room.on("participantDisconnected", (participant) => {
          participant.tracks.forEach((publication: RemoteTrackPublication) => {
            if (publication.track && publication.track.kind === "video") {
              (publication.track as RemoteVideoTrack)
                .detach()
                .forEach((element) => element.remove());
            }
          });
        });
      } catch (error) {
        alert("Error connecting to Twilio room");
        console.error("Error connecting to Twilio room: ", error);
      }
    } else {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
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
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
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
          <h2>Recorded Video</h2>
          <video src={recordedVideoURL} controls className="videoElement" />
        </div>
      )}
    </div>
  );
};

export default VideoScreener;
