import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Home from "./Home"; // Example component
import VideoStream from "./VideoStream"; // Example 404 component

// Create the router with routes
const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />, // The component for the home page
  },
  {
    path: "/video",
    element: <VideoStream />, // Example of a route with credentials passed as props
  },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
