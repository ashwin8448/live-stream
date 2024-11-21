import "./App.css";
import VideoScreener from "./components/VideoScreener/VideoScreener";
import { useSearchParams } from "react-router-dom";

function App() {
  const [searchParams] = useSearchParams();
  const roomName: string | null = searchParams.get("room_name");
  const token: string | null = searchParams.get("token");

  return (
    <>
      {roomName && token ? (
        <VideoScreener credentials={{ roomName, token }} />
      ) : (
        <form method="POST" action="https://twilio.kytt.site/create_room">
          <button type="submit">Create Room</button>
        </form>
      )}
    </>
  );
}

export default App;
