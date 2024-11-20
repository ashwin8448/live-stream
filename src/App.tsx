import { useEffect } from "react";
import "./App.css";
import VideoScreener from "./components/VideoScreener/VideoScreener";
import { useSearchParams } from "react-router-dom";

function App() {
  const [searchParams] = useSearchParams();
  const roomName: string | null = searchParams.get("roomName");
  const token: string | null = searchParams.get("token");
  useEffect(() => {
    (async () => {
      await fetch("https://twilio.kytt.site/create_room", {
        method: "POST",
      });
    })();
  });
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

export default App;
