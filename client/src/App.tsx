import { Route, Routes } from 'react-router-dom'
import { EventDetail } from './pages/EventDetail'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Payment } from './pages/Payment'
import { Reservation } from './pages/Reservation'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/entrar" element={<Login />} />
      <Route path="/eventos/:id" element={<EventDetail />} />
      <Route path="/eventos/:id/reservar" element={<Reservation />} />
      <Route path="/reservas/:bookingId/pagamento" element={<Payment />} />
    </Routes>
  )
}

export default App
