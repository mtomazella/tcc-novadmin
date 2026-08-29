import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Navbar } from '../components/Navbar'
import { useEffect, useState } from 'react'
import LoadingSpinner from '../components/LoadingSpinner'

export function RootLayout() {
  const { currentUser, isLoading } = useAuth()
  const [_, setIsMobile] = useState(window.innerWidth < 1024)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    return saved ? JSON.parse(saved) : false
  })
  const location = useLocation()

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed))
  }, [isCollapsed])

  if (isLoading) return <LoadingSpinner />

  if (location.pathname === '/') {
    return <Navigate to={currentUser ? '/orcamento' : '/login'} replace />
  }

  const isPublicRoute = ['/login'].includes(location.pathname)

  return (
    <div className="flex h-screen bg-gray-100">
      {!isPublicRoute && (
        <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      )}

      <main
        className={`flex-1 overflow-auto transition-all duration-300 ${
          currentUser && !isPublicRoute
            ? isCollapsed
              ? 'ml-0 lg:ml-20'
              : 'ml-0 lg:ml-64'
            : ''
        }`}
      >
        <Outlet />
      </main>
    </div>
  )
}
