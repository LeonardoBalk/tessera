import { Route, Routes } from 'react-router-dom'
import { EventDetail } from './pages/EventDetail'
import { GateValidation } from './pages/GateValidation'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { MyTickets } from './pages/MyTickets'
import { Payment } from './pages/Payment'
import { Reservation } from './pages/Reservation'
import { TicketDetail } from './pages/TicketDetail'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/entrar" element={<Login />} />
      <Route path="/eventos/:id" element={<EventDetail />} />
      <Route path="/eventos/:id/reservar" element={<Reservation />} />
      <Route path="/reservas/:bookingId/pagamento" element={<Payment />} />
      <Route path="/ingressos" element={<MyTickets />} />
      <Route path="/ingressos/:id" element={<TicketDetail />} />
      <Route path="/portaria" element={<GateValidation />} />
    </Routes>
  )
}

export default App
