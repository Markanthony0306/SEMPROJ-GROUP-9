import { useState } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import UserPage from './pages/UserPage'
import AdminStaffPage from './pages/AdminStaffPage'
import './styles/landing_and_forms.css'
import './styles/user_page.css'
import './styles/admin_staff_page.css'

export default function App() {
  const [route, setRoute] = useState('home')
  const isPortal = ['user', 'admin'].includes(route)

  const navigate = (page) => {
    window.scrollTo(0, 0)
    setRoute(page)
  }

  const pages = {
    home: <Home navigate={navigate} />,
    login: <Login navigate={navigate} />,
    register: <Register navigate={navigate} />,
    user: <UserPage navigate={navigate} />,
    admin: <AdminStaffPage navigate={navigate} />
  }

  return (
    <>
      {!isPortal && <Navbar route={route} navigate={navigate} />}
      {pages[route]}
      {!isPortal && <Footer navigate={navigate} />}
    </>
  )
}
