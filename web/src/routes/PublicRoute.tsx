import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { ReactNode } from 'react'
import LoadingSpinner from '../components/LoadingSpinner'
import { useEffect } from 'react'

interface PublicRouteProps {
  children?: ReactNode
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const navigate = useNavigate()
  const { currentUser, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && currentUser) {
      navigate('/orcamento')
    }
  }, [currentUser, isLoading, navigate])

  if (isLoading) return <LoadingSpinner />

  if (!currentUser) return children || <Outlet />

  return null
}
