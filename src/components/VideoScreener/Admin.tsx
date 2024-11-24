import { useEffect, useRef, useState } from "react";
import dashjs from "dashjs";

import "../../App.css";
import { API_BASE } from "../../const";

function Admin() {
  const [videourl, setvideoUrl] = useState("");
  const [selectedInterview, setSelectedInterview] = useState("");
  const [interviews, setInterviews] = useState([]);
  const videoRef = useRef(null);
  const [data, setData] = useState([{ url: "" }]);

  useEffect(() => {
    const postData = async () => {
      try {
        const res = await fetch(API_BASE+"admin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
      } catch {
        console.log("error");
      }
    };

    const fetchInterviews = async () => {
      try {
        const res = await fetch(API_BASE+"get_all_rooms");
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        const data = await res.json();
        setInterviews(data.interviews); // Set interviews array from response
      } catch {
        console.log("error");
      }
    };

    fetchInterviews();
    postData();
  }, []);

  useEffect(() => {
    if (videourl && videoRef.current) {
      // Initialize dash.js player
      const player = dashjs.MediaPlayer().create();
      player.initialize(videoRef.current, videourl, true);

      // Clean up on unmount
      return () => {
        player.reset();
      };
    }
  }, [videourl]);

  const handleSelectChange = (event:any) => {
    setSelectedInterview(event.target.value);

    const fetchVideourl = async () => {
      try {
        const res = await fetch(API_BASE+"get_all_recordings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "room_name":event.target.value
          }),
           credentials: 'include'
        });

        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }

        const data = await res.json();
        setData(data.urls); // Set the data with urls and room name
      } catch {
        console.log("error");
      }
    };

    fetchVideourl()

  };


  const handleVideoClick = (event:any) => {
    setvideoUrl(event.target.value);
  };


  return (
    <div>
      <video
        ref={videoRef}
        controls
        style={{ width: "100%", maxWidth: "800px" }}
      />

      <select value={selectedInterview} onChange={handleSelectChange}>
        <option value="">--Select an Interview--</option>
        {interviews.map((interviewId) => (
          <option key={interviewId} value={interviewId}>
            {interviewId}
          </option>
        ))}
      </select>
      {selectedInterview && <p>Selected Interview ID: {selectedInterview}</p>}

      <select value={videourl} onChange={handleVideoClick}>
        <option value="">--Select a URL--</option>
        {data.map((urlObj, index) => (
          <option key={index} value={urlObj.url}>
            {urlObj.url}
          </option>
        ))}
      </select>


    </div>

    
  );
}

export default Admin;
