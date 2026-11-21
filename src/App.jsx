import { HashRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Tracking from './pages/Tracking';
import Admin from './pages/Admin';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/suivi/:code" element={<Tracking />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </HashRouter>
  );
}