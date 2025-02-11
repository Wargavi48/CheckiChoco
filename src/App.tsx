import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";

const App: React.FC = () => {
  const isMobile = window.innerWidth < 768;
  return isMobile ? <MobileView /> : <DesktopView />;
    
};

export default App;
