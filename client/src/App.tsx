import { Route, Routes } from 'react-router-dom'
import { CreateEvent } from './pages/CreateEvent'
import { EditEvent } from './pages/EditEvent'
import { EventDetail } from './pages/EventDetail'
import { GateValidation } from './pages/GateValidation'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { MyTickets } from './pages/MyTickets'
import { OrganizerEvents } from './pages/OrganizerEvents'
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
      <Route path="/organizador/eventos" element={<OrganizerEvents />} />
      <Route path="/organizador/eventos/novo" element={<CreateEvent />} />
      <Route path="/organizador/eventos/:id/editar" element={<EditEvent />} />
    </Routes>
  )
}

export default App
