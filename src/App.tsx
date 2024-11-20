import { useEffect } from "react";
import "./App.css";
import VideoScreener from "./components/VideoScreener/VideoScreener";
import { useSearchParams } from "react-router-dom";


function App() {
  const [searchParams] = useSearchParams();
  const roomName: string | null = searchParams.get("room_name");
  const token: string | null = searchParams.get("token");

  const handleSubmit = () => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "https://twilio.kytt.site/create_room"; // The URL to handle the request
  
    document.body.appendChild(form); // Append form to DOM
    form.submit(); // Submit the form
  };
  // useEffect(() => {
  //   (async () => {
  //     let res =await fetch("https://twilio.kytt.site/create_room", {
  //       method: "POST",
  //     });

  //     console.log(res.redirected)
  //     console.log(res.url)
      
  //   })();

  // });
  return (
    <>
      {roomName && token ? (
        <VideoScreener credentials={{ roomName, token }} />
      ) : (
        <>
        <h1>Invalid URL</h1>
        <button onClick={handleSubmit}>Create Room</button>
        </>
      )}
    </>
  );
}

export default App;
