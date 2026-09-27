import { useAuth } from '../contexts/AuthContext.jsx'
import { useTheme } from '../contexts/ThemeContext.jsx'

const NAV_ITEMS = [
  { id: 'inventario', label: 'Inventario', icon: '📦' },
  { id: 'marcas', label: 'Marcas', icon: '🏷️' },
  { id: 'ventas', label: 'Ventas', icon: '🧾' },
  { id: 'clientes', label: 'Clientes', icon: '👤' },
  { id: 'dashboard', label: 'Datos', icon: '📊' },
]

function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
      className={`inline-flex items-center justify-center h-9 w-9 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition ${className}`}
    >
      {isDark ? (
        // Ícono de sol
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        // Ícono de luna
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}

export default function Layout({ active, onNavigate, children }) {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-stone-50 dark:bg-stone-950 transition-colors duration-200">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-stone-200 dark:md:border-stone-800 md:bg-white dark:md:bg-stone-900">
        <div className="flex items-center justify-between gap-2 px-5 py-5 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bambu-700 dark:bg-bambu-600 text-white font-display text-sm">B</div>
            <span className="font-display text-lg font-semibold text-stone-900 dark:text-stone-100">Bambu Gestión</span>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active === item.id
                  ? 'bg-bambu-50 dark:bg-bambu-900/40 text-bambu-800 dark:text-bambu-300'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-stone-200 dark:border-stone-800 space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-stone-400 dark:text-stone-500 truncate">{user?.email}</p>
            <ThemeToggle />
          </div>
          <button onClick={signOut} className="btn-secondary w-full">
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Header - mobile */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-bambu-700 dark:bg-bambu-600 text-white font-display text-sm">B</div>
          <span className="font-display text-base font-semibold text-stone-900 dark:text-stone-100">Bambu Gestión</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button onClick={signOut} className="text-sm text-stone-500 dark:text-stone-400">Salir</button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>

      {/* Bottom nav - mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-10 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
              active === item.id ? 'text-bambu-700 dark:text-bambu-400' : 'text-stone-400 dark:text-stone-500'
            }`}
          >
            <span className="text-lg" aria-hidden="true">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
