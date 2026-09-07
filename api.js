const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

function getToken() {
  return localStorage.getItem('landsafe_token')
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  let data = null
  try { data = await res.json() } catch (e) { /* no body */ }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`
    throw new Error(message)
  }
  return data
}

export const api = {
  // auth
  register: (payload) => request('/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/login', { method: 'POST', body: payload, auth: false }),
  logout: () => request('/logout', { method: 'POST' }),
  getUser: () => request('/user'),
  updateUser: (payload) => request('/user', { method: 'PUT', body: payload }),
  changePassword: (payload) => request('/change-password', { method: 'POST', body: payload }),

  // sensors
  getSensors: () => request('/sensors'),
  getSensor: (sensorId) => request(`/sensors/${sensorId}`),
  createSensor: (payload) => request('/sensors', { method: 'POST', body: payload }),
  updateSensor: (sensorId, payload) => request(`/sensors/${sensorId}`, { method: 'PUT', body: payload }),
  deleteSensor: (sensorId) => request(`/sensors/${sensorId}`, { method: 'DELETE' }),
  ingestSensorData: (payload) => request('/sensor-data', { method: 'POST', body: payload }),

  // simulation
  simulateScenario: (scenario, sensorId) => request('/simulate', { method: 'POST', body: { scenario, sensor_id: sensorId } }),
  resetSimulation: () => request('/simulate/reset', { method: 'POST' }),

  // risk
  predictRisk: (features) => request('/predict-risk', { method: 'POST', body: features }),
  getOverallRisk: () => request('/risk'),

  // alerts
  getAlerts: (status) => request(`/alerts${status ? `?status=${status}` : ''}`),
  createAlert: (payload) => request('/alerts', { method: 'POST', body: payload }),
  updateAlert: (id, status) => request(`/alerts/${id}`, { method: 'PUT', body: { status } }),

  // analytics
  getAnalytics: (range, sensorId) => request(`/analytics?range=${range}${sensorId ? `&sensor_id=${sensorId}` : ''}`),

  // emergency
  emergencyAction: (payload) => request('/emergency-action', { method: 'POST', body: payload }),
  getEmergencyActions: () => request('/emergency-action'),
  getEmergencyStatus: () => request('/emergency-status'),
}

export function setToken(token) {
  localStorage.setItem('landsafe_token', token)
}
export function clearToken() {
  localStorage.removeItem('landsafe_token')
}
export function hasToken() {
  return !!getToken()
}
