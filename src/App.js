import { Routes, Route } from "react-router-dom";
import Home from "./components/Home.jsx"
import Setting from "./components/Settings.jsx"
import Dashboardv2 from "./components/Dashboardv2.jsx"
import Page from "./components/Newpage.jsx"
import Page3 from "./components/Page.jsx"
import Page2 from "./components/Page2.jsx"

function App() {
  return (
    <div>
        <Routes>
        <Route path="/page4" element={<Home />} /> 
          <Route path="/setting" element={<Setting />} />
          <Route path="/dashboardv2" element={<Dashboardv2 />} />
          <Route path="/page" element={<Page />} />
          <Route path="/" element={<Page2 />} />
          <Route path="/page3" element={<Page3 />} />
        </Routes>
      
    </div>
  );
}

export default App;
