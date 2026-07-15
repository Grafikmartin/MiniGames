import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SpaceInvaders } from './games/space-invaders/SpaceInvaders';
import { Snake } from './games/snake/Snake';
import { PingPong } from './games/ping-pong/PingPong';
import { BattleshipGame } from './games/battleship/BattleshipGame';
import { Breakout } from './games/breakout/Breakout';
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
        <Route path="/schiffe-versenken" element={<BattleshipGame />} />
        <Route path="/breakout" element={<Breakout />} />
        <Route path="/snake" element={<Snake />} />
      </Routes>
    </Layout>
  );
}

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '');

export default function App() {
  return (
    <BrowserRouter basename={routerBasename || undefined}>
      <AppRoutes />
    </BrowserRouter>
  );
}
