import { Route, Routes } from 'react-router-dom'
import { Login } from './pages/Login'

function App() {
  return (
    <Routes>
      <Route path="/" element={<div>Tessera</div>} />
      <Route path="/entrar" element={<Login />} />
    </Routes>
  )
}

export default App
