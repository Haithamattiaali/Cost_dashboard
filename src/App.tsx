import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Comparison from './pages/Comparison';
import Upload from './pages/Upload';
import Analysis from './pages/Analysis';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/comparison" element={<Comparison />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/upload" element={<Upload />} />
      </Routes>
    </Layout>
  );
}

export default App;