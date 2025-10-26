import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import GroupView from './pages/GroupView';
import SettleUp from './pages/SettleUp';
import People from './pages/People';
import Requests from './pages/Requests';
import Auth from './pages/Auth';
import { useStore } from './store/store';

function App() {
  const { currentUser } = useStore();

  if (!currentUser) {
    return <Auth />;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/people" element={<People />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/groups/:id" element={<GroupView />} />
          <Route path="/groups/:id/settle" element={<SettleUp />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
