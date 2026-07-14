import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SpaceInvaders } from './games/space-invaders/SpaceInvaders';
import { Snake } from './games/snake/Snake';
import { PingPong } from './games/ping-pong/PingPong';
import { VierGewinnt } from './games/vier-gewinnt/VierGewinnt';
import { HomePage } from './pages/HomePage';

function AppRoutes() {
  const { pathname } = useLocation();

  return (
    <Layout showBack={pathname !== '/'}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/space-invaders" element={<SpaceInvaders />} />
        <Route path="/vier-gewinnt" element={<VierGewinnt />} />
        <Route path="/ping-pong" element={<PingPong />} />
        <Route path="/snake" element={<Snake />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
