import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import RiskMap from './pages/RiskMap'
import LiveSensors from './pages/LiveSensors'
import AIPrediction from './pages/AIPrediction'
import Alerts from './pages/Alerts'
import Analytics from './pages/Analytics'
import Locations from './pages/Locations'
import SensorManagement from './pages/SensorManagement'
import EmergencyResponse from './pages/EmergencyResponse'
import Profile from './pages/Profile'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/risk-map" element={<ProtectedRoute><RiskMap /></ProtectedRoute>} />
          <Route path="/live-sensors" element={<ProtectedRoute><LiveSensors /></ProtectedRoute>} />
          <Route path="/ai-prediction" element={<ProtectedRoute><AIPrediction /></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/locations" element={<ProtectedRoute><Locations /></ProtectedRoute>} />
          <Route path="/sensor-management" element={<ProtectedRoute><SensorManagement /></ProtectedRoute>} />
          <Route path="/emergency-response" element={<ProtectedRoute><EmergencyResponse /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
