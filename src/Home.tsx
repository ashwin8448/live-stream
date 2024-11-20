import "./App.css";

function Home() {
  (async () => {
    const res = await fetch("https://twilio.kytt.site/create_room", {
      method: "GET",
    });
    if (res.redirected) {
      // If the response is a redirect, use window.location to redirect the browser
      window.location.href = res.url; // This will redirect the user to the new URL
    } else {
      console.log("Response received:", res);
    }
  })();

  return null;
}

export default Home;
