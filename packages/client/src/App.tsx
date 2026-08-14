import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing.tsx';
import CreateGroup from './pages/CreateGroup.tsx';
import JoinGroup from './pages/JoinGroup.tsx';
import GroupDashboard from './pages/GroupDashboard.tsx';
import ConsensusResult from './pages/ConsensusResult.tsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/create" element={<CreateGroup />} />
      <Route path="/join" element={<JoinGroup />} />
      <Route path="/join/:code" element={<JoinGroup />} />
      <Route path="/group/:id" element={<GroupDashboard />} />
      <Route path="/group/:id/result" element={<ConsensusResult />} />
    </Routes>
  );
}
