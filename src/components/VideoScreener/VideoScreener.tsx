import { useRef, useState, useEffect } from "react";
import "./styles.css";

const VideoScreener = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recordedChunks = useRef<Blob[]>([]);
  const [recordedVideoURL, setRecordedVideoURL] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

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

      // Close WebSocket when stopping video
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    }
  };

  const handleRecordStartStop = () => {
    if (!isRecording) {
      setRecordedVideoURL(null);
      recordedChunks.current = [];
      const stream = videoRef.current?.srcObject as MediaStream;

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "video/webm",
      });
      
      // Open WebSocket connection
      wsRef.current = new WebSocket("ws://localhost:4000"); // Replace with your backend WebSocket server URL
      wsRef.current.onopen = () => console.log("WebSocket connected");

      mediaRecorderRef.current.start(100); // Set timeslice for continuous recording

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);

          // Send each chunk to the backend via WebSocket
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(event.data);
          }
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: "video/webm" });
        setRecordedVideoURL(URL.createObjectURL(blob));

        // Close WebSocket when stopping recording
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }
      };
      
      setIsRecording(true);
    } else {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (wsRef.current) {
        wsRef.current.close();
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
