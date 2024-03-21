import { Routes, Route } from "react-router-dom";
import Home from "./components/Home.jsx"
import "./index.css"
import Setting from "./components/Settings.jsx"

function App() {
  return (
    <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/setting" element={<Setting />} />
        </Routes>
      
    </div>
  );
}

export default App;
