import { Routes, Route } from "react-router-dom";
import Home from "./components/Home.jsx"
import "./index.css"
import Setting from "./components/Settings.jsx"
import Dashboardv2 from "./components/Dashboardv2.jsx"
import Page from "./components/Newpage.jsx"
import Page2 from "./components/Page.jsx"

function App() {
  return (
    <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/setting" element={<Setting />} />
          <Route path="/dashboardv2" element={<Dashboardv2 />} />
          <Route path="/page" element={<Page />} />
          <Route path="/page2" element={<Page2 />} />
        </Routes>
      
    </div>
  );
}

export default App;
