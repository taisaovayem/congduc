import { BrowserRouter, Navigate, Route, Routes, useNavigate, useOutletContext } from 'react-router-dom';
import { AppShell, type AppShellContext } from '@/app/layout/AppShell';
import { HomeView } from '@/app/views/HomeView';
import { SongTuLobbyView } from '@/app/views/SongTuLobbyView';
import { SongTuRoomView } from '@/app/views/SongTuRoomView';
import { TransferView } from '@/app/views/TransferView';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="chuyen-cong-duc" element={<TransferPage />} />
          <Route path="song-tu" element={<SongTuLobbyView />} />
          <Route path="song-tu/phong/:roomId" element={<SongTuRoomView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function HomePage() {
  const { sessionReady } = useOutletContext<AppShellContext>();
  return <HomeView sessionReady={sessionReady} />;
}

function TransferPage() {
  const { meritPoints } = useOutletContext<AppShellContext>();
  const navigate = useNavigate();
  return <TransferView meritPoints={meritPoints} onBack={() => navigate('/')} />;
}
