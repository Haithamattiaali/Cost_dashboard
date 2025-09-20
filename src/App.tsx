import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import CostPlayground from './pages/CostPlayground';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/playground" element={<CostPlayground />} />
        <Route path="/upload" element={<Upload />} />
      </Routes>
    </Layout>
  );
}

export default App;