import VideoScreener from "./components/VideoScreener/VideoScreener";
import { useSearchParams } from "react-router-dom";

function VideoStream() {
  const [searchParams] = useSearchParams();
  const roomName: string | null = searchParams.get("room_name");
  const token: string | null = searchParams.get("token");

  return (
    <>
      {roomName && token ? (
        <VideoScreener credentials={{ roomName, token }} />
      ) : (
        <h1>Invalid URL</h1>
      )}
    </>
  );
}

export default VideoStream;
