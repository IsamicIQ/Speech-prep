import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './components/Landing'
import Practice from './components/Practice'
import Auth from './components/Auth'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/landing" replace />} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/practice" element={<Practice />} />
      <Route path="/auth" element={<Auth />} />
    </Routes>
  )
}

export default App
