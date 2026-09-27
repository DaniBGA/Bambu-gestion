import { useState } from 'react'
import { useAuth } from './contexts/AuthContext.jsx'
import Login from './components/Login.jsx'
import Layout from './components/Layout.jsx'
import Inventario from './components/Inventario.jsx'
import Marcas from './components/Marcas.jsx'
import Ventas from './components/Ventas.jsx'
import Clientes from './components/Clientes.jsx'
import Dashboard from './components/Dashboard.jsx'

export default function App() {
  const { session, loading } = useAuth()
  const [section, setSection] = useState('inventario')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <p className="text-sm text-stone-400">Cargando…</p>
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  return (
    <Layout active={section} onNavigate={setSection}>
      {section === 'inventario' && <Inventario />}
      {section === 'marcas' && <Marcas />}
      {section === 'ventas' && <Ventas />}
      {section === 'clientes' && <Clientes />}
      {section === 'dashboard' && <Dashboard />}
    </Layout>
  )
}
