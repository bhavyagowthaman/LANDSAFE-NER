import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AuthProvider } from "./AuthContext"
import ProtectedRoute from './ProtectedRoute'

import Login from './Login'
import Register from './Register'
import Dashboard from './Dashboard'
import RiskMap from './RiskMap'
import LiveSensors from './LiveSensors'
import AIPrediction from './AIPrediction'
import Alerts from './Alerts'
import Analytics from './Analytics'
import Locations from './Locations'
import SensorManagement from './SensorManagement'
import EmergencyResponse from './EmergencyResponse'
import Profile from './Profile'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/risk-map"
            element={
              <ProtectedRoute>
                <RiskMap />
              </ProtectedRoute>
            }
          />

          <Route
            path="/live-sensors"
            element={
              <ProtectedRoute>
                <LiveSensors />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ai-prediction"
            element={
              <ProtectedRoute>
                <AIPrediction />
              </ProtectedRoute>
            }
          />

          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <Alerts />
              </ProtectedRoute>
            }
          />

          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />

          <Route
            path="/locations"
            element={
              <ProtectedRoute>
                <Locations />
              </ProtectedRoute>
            }
          />

          <Route
            path="/sensor-management"
            element={
              <ProtectedRoute>
                <SensorManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/emergency-response"
            element={
              <ProtectedRoute>
                <EmergencyResponse />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
