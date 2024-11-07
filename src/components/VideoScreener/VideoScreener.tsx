import { useRef, useState, useEffect } from "react";

const VideoScreener = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordedVideoURL, setRecordedVideoURL] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

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
    }
  };

  const handleRecordStartStop = () => {
    if (!isRecording) {
      setRecordedVideoURL(null);
      setRecordedChunks([]);
      const stream = videoRef.current?.srcObject as MediaStream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.start();
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunks, { type: "video/webm" });
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
  console.log(recordedChunks);
  return (
    <div>
      <h1>Video Screener</h1>
      <video ref={videoRef} autoPlay={isPlaying} disablePictureInPicture />
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
          <video src={recordedVideoURL} controls />
        </div>
      )}
    </div>
  );
};

export default VideoScreener;
