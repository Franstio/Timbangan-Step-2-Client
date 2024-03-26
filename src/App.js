import { Routes, Route } from "react-router-dom";
import Home from "./components/Home.jsx"
import "./index.css"
import Setting from "./components/Settings.jsx"
import Dashboardv2 from "./components/Dashboardv2.jsx"
import Page from "./components/Newpage.jsx"

function App() {
  return (
    <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/setting" element={<Setting />} />
          <Route path="/dashboardv2" element={<Dashboardv2 />} />
          <Route path="/page" element={<Page />} />
        </Routes>
      
    </div>
  );
}

export default App;
