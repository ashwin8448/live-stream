const WebSocket = require("ws");
const { spawn } = require("child_process");

const PORT = 4000;
const RTMP_URL = "rtmp://a.rtmp.youtube.com/live2/uuqz-ktwu-zyqc-s1tw-eat6"; // Replace with your AWS MediaLive RTMP endpoint

const wss = new WebSocket.Server({ port: PORT });

wss.on("connection", (ws) => {
  console.log("Client connected");

  // Initialize FFmpeg with RTMP output
  const ffmpeg = spawn("ffmpeg", [
    "-loglevel",
    "debug", // Enable debug logs
    "-i",
    "-", // Input from stdin
    "-c:v",
    "libx264", // Video codec
    "-preset",
    "veryfast", // Encoding speed
    "-tune",
    "zerolatency", // Low-latency settings
    "-c:a",
    "aac", // Audio codec
    "-f",
    "flv", // Output format
    RTMP_URL, // Output RTMP URL
  ]);

  ffmpeg.stderr.on("data", (data) =>
    console.error(`FFmpeg stderr: ${data.toString()}`)
  );

  ffmpeg.on("close", (code) =>
    console.log(`FFmpeg process exited with code ${code}`)
  );

  ws.on("message", (message) => {
    console.log("Received message from client:", message.length);
    if (ffmpeg.stdin.writable) {
      ffmpeg.stdin.write(message);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    if (ffmpeg.stdin) {
      ffmpeg.stdin.end();
    }
  });
});

console.log(`WebSocket server started on ws://localhost:${PORT}`);
