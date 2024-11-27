import "./App.css";
import Admin from "./components/VideoScreener/Admin";
import VideoScreener from "./components/VideoScreener/VideoScreener";
import { Route, Routes, useSearchParams } from "react-router-dom";
import { API_BASE } from "./const";

function App() {
  const [searchParams] = useSearchParams();
  const roomName: string | null = searchParams.get("room_name");
  const token: string | null = searchParams.get("token");

  return (
    <>
      <Routes>
        <Route path="/admin" element={<Admin />}></Route>
        <Route
          path="/"
          element={
            roomName && token ? (
              <VideoScreener credentials={{ roomName, token }} />
            ) : (
              <form method="POST" action={API_BASE + "create_room"}>
                <button type="submit">Create Room</button>
              </form>
            )
          }
        ></Route>
      </Routes>
    </>
  );
}

export default App;
