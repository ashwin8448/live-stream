import { useState } from "react";
import "./App.css";
import VideoScreener from "./components/VideoScreener/VideoScreener";

function App() {
  const [formValues, setFormValues] = useState({ roomName: "", token: "" });
  const [showVideo, setShowVideo] = useState(false);

  return (
    <>
      {!showVideo && (
        <form>
          <div className="form-field">
            <label htmlFor="room-name">Room name: </label>
            <input
              type="text"
              id="room-name"
              value={formValues.roomName}
              onChange={(e) =>
                setFormValues({ ...formValues, roomName: e.target.value })
              }
            />
          </div>
          <div className="form-field">
            <label htmlFor="token">Token: </label>
            <input
              type="text"
              id="token"
              value={formValues.token}
              onChange={(e) =>
                setFormValues({ ...formValues, token: e.target.value })
              }
            />
          </div>
          <button
            onClick={() => {
              if (formValues.roomName && formValues.token) setShowVideo(true);
            }}
          >
            Show Video
          </button>
        </form>
      )}
      {showVideo && <VideoScreener credentials={formValues} />}
    </>
  );
}

export default App;
