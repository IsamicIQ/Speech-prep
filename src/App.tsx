import { Routes, Route } from 'react-router-dom'
import Landing from './components/Landing'
import Practice from './components/Practice'
import Auth from './components/Auth'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Practice />} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
    </Routes>
  )
}

export default App
