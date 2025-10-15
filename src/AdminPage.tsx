import React from 'react';
import ChatAdmin from './components/ChatAdmin';
import FirebaseTest from './components/FirebaseTest';
import AnalyticsDashboard from './components/AnalyticsDashboard';

const AdminPage: React.FC = () => {
  return (
    <div>
      <FirebaseTest />
      <AnalyticsDashboard />
      <ChatAdmin />
    </div>
  );
};

export default AdminPage;
