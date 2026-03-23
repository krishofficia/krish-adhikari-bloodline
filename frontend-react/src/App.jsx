import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import OrgRegister from './pages/OrgRegister.jsx'
import DonorDashboard from './pages/DonorDashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import OrgDashboard from './pages/OrgDashboard.jsx'
import Chatbot from './pages/Chatbot.jsx'
import DonorResponse from './pages/DonorResponse.jsx'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/org-register" element={<OrgRegister />} />
        <Route path="/donor-dashboard" element={<DonorDashboard />} />
        <Route path="/donor/dashboard" element={<DonorDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/org-dashboard" element={<OrgDashboard />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/donor/respond/:requestId/:action" element={<DonorResponse />} />
      </Routes>
    </Router>
  )
}

export default App
