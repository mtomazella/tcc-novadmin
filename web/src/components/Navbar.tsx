import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  FolderOpen,
  Package,
  Users,
  Building2,
  User,
  LogOut,
  Settings,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  useHasAnyPermission,
  webPermissions,
} from '../hooks/auth/usePermissions'
import { FaBox, FaDollarSign, FaMoneyBill } from 'react-icons/fa'

interface NavbarProps {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}

export const Navbar = ({ isCollapsed, setIsCollapsed }: NavbarProps) => {
  const [cadastroOpen, setCadastroOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const { logout, currentUser } = useAuth()
  const navigate = useNavigate()

  const hasProduto = useHasAnyPermission(Object.values(webPermissions.product))
  const hasCliente = useHasAnyPermission(Object.values(webPermissions.client))
  const hasObra = useHasAnyPermission(Object.values(webPermissions.obra))
  const hasQuote = useHasAnyPermission(Object.values(webPermissions.quote))
  const hasCusto = useHasAnyPermission(Object.values(webPermissions.cost))
  const hasFornecedor = useHasAnyPermission(
    Object.values(webPermissions.supplier),
  )
  const hasCadastro = hasProduto || hasCliente || hasObra

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      console.error('Erro no logout:', err)
    }
  }

  const toggleCadastro = () => {
    if (isCollapsed && window.innerWidth >= 1024) {
      setIsCollapsed(false)
      setTimeout(() => setCadastroOpen(true), 300)
    } else {
      setCadastroOpen(!cadastroOpen)
    }
  }

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const toggleCollapse = () => setIsCollapsed(!isCollapsed)

  const closeMobileMenu = () => {
    if (window.innerWidth < 1024) {
      setIsMenuOpen(false)
    }
  }

  useEffect(() => {
    setIsMenuOpen(false)
  }, [location])

  return (
    <>
      <button
        onClick={toggleMenu}
        className="lg:hidden fixed top-6 left-4 z-50 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white p-4 rounded-r-xl shadow-lg transition-all duration-300 hover:scale-110"
        aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
      >
        {isMenuOpen ? (
          <ChevronLeft className="text-white w-8 h-8" />
        ) : (
          <ChevronRight className="text-white w-8 h-8" />
        )}
      </button>

      {isMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden backdrop-blur-sm"
          onClick={toggleMenu}
        />
      )}

      <div
        className={`
        fixed inset-y-0 left-0 z-40
        bg-gradient-to-b from-[#1a1a1a] to-[#2d2d2d] text-white
        transform transition-all duration-300 ease-in-out
        ${
          isMenuOpen
            ? 'translate-x-0 w-1/2'
            : '-translate-x-full lg:translate-x-0'
        }
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        shadow-2xl
      `}
      >
        <div className="flex flex-col h-full">
          <div
            className={`flex items-center justify-center py-8 border-b border-[#333333] ${
              isCollapsed ? 'px-2' : 'px-4'
            }`}
          >
            <div className="flex items-center space-x-4">
              <span className="text-2xl font-bold text-white tracking-wide">
                Orçamentos
              </span>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-6">
            <ul className="space-y-3 px-4">
              {hasCadastro && (
                <li>
                  <button
                    onClick={toggleCadastro}
                    className="w-full flex items-center justify-between px-4 py-4 rounded-xl transition-all duration-200 text-gray-300 hover:bg-[#3d3d3d] hover:text-white hover:shadow-lg hover:scale-105 active:scale-95 group"
                    aria-expanded={cadastroOpen}
                  >
                    <div className="flex items-center">
                      <FolderOpen className="w-7 h-7 lg:w-5 lg:h-5 transition-transform group-hover:rotate-12" />
                      {(!isCollapsed || window.innerWidth < 1024) && (
                        <span className="ml-4 text-xl lg:text-base">
                          Cadastro
                        </span>
                      )}
                    </div>
                    {(!isCollapsed || window.innerWidth < 1024) &&
                      (cadastroOpen ? (
                        <ChevronUp className="w-6 h-6 lg:w-4 lg:h-4" />
                      ) : (
                        <ChevronDown className="w-6 h-6 lg:w-4 lg:h-4" />
                      ))}
                  </button>

                  {cadastroOpen &&
                    (!isCollapsed || window.innerWidth < 1024) && (
                      <ul className="ml-6 mt-2 space-y-2">
                        {hasProduto && (
                          <NavItem
                            to="/produto"
                            currentPath={location.pathname}
                            icon={<Package className="w-6 h-6 lg:w-4 lg:h-4" />}
                            isCollapsed={isCollapsed}
                            activeBg="#7C3AED"
                            onClick={closeMobileMenu}
                          >
                            Produto
                          </NavItem>
                        )}
                        {hasCliente && (
                          <NavItem
                            to="/cliente"
                            currentPath={location.pathname}
                            icon={<Users className="w-6 h-6 lg:w-4 lg:h-4" />}
                            isCollapsed={isCollapsed}
                            activeBg="#7C3AED"
                            onClick={closeMobileMenu}
                          >
                            Cliente
                          </NavItem>
                        )}
                        {hasObra && (
                          <NavItem
                            to="/obra"
                            currentPath={location.pathname}
                            icon={
                              <Building2 className="w-6 h-6 lg:w-4 lg:h-4" />
                            }
                            isCollapsed={isCollapsed}
                            activeBg="#7C3AED"
                            onClick={closeMobileMenu}
                          >
                            Obra
                          </NavItem>
                        )}
                        {hasCusto && (
                          <NavItem
                            to="/cost"
                            currentPath={location.pathname}
                            icon={
                              <FaMoneyBill className="w-6 h-6 lg:w-4 lg:h-4" />
                            }
                            isCollapsed={isCollapsed}
                            activeBg="#7C3AED"
                            onClick={closeMobileMenu}
                          >
                            Custos
                          </NavItem>
                        )}
                        {hasFornecedor && (
                          <NavItem
                            to="/supplier"
                            currentPath={location.pathname}
                            icon={<FaBox className="w-6 h-6 lg:w-4 lg:h-4" />}
                            isCollapsed={isCollapsed}
                            activeBg="#7C3AED"
                            onClick={closeMobileMenu}
                          >
                            Fornecedor
                          </NavItem>
                        )}
                      </ul>
                    )}
                </li>
              )}

              {hasQuote && (
                <NavItem
                  to="/orcamento"
                  currentPath={location.pathname}
                  icon={<FaDollarSign />}
                  isCollapsed={isCollapsed}
                  activeBg="#7C3AED"
                  onClick={closeMobileMenu}
                >
                  Orçamento
                </NavItem>
              )}
            </ul>
          </nav>

          <div
            className={`mt-auto pb-6 px-4 ${
              isCollapsed && window.innerWidth >= 1024 ? 'text-center' : ''
            }`}
          >
            <div
              className={`border-t border-[#333333] mb-4 ${
                isCollapsed && window.innerWidth >= 1024 ? 'mx-2' : 'mx-4'
              }`}
            ></div>
            <div
              className={`flex items-center ${
                isCollapsed && window.innerWidth >= 1024
                  ? 'justify-center'
                  : 'space-x-4'
              }`}
            >
              <div className="h-14 w-14 lg:h-10 lg:w-10 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] flex items-center justify-center text-white font-bold shadow-lg">
                <User className="w-7 h-7 lg:w-5 lg:h-5" />
              </div>
              {(!isCollapsed || window.innerWidth < 1024) && (
                <div className="flex-1">
                  <p className="text-lg lg:text-sm font-medium">
                    {currentUser?.name}
                  </p>
                  <div className="flex space-x-3">
                    <button
                      className="text-base lg:text-xs text-gray-400 hover:text-white transition-colors duration-200"
                      title="Configurações"
                    >
                      <Settings className="w-5 h-5 lg:w-4 lg:h-4" />
                    </button>
                    <button
                      className="text-base lg:text-xs text-gray-400 hover:text-white transition-colors duration-200"
                      onClick={handleLogout}
                      title="Sair"
                    >
                      <LogOut className="w-5 h-5 lg:w-4 lg:h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={toggleCollapse}
          className="hidden lg:flex absolute -right-3 top-8 z-50 items-center justify-center p-2 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl"
          title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          <ChevronLeft
            className={`w-4 h-4 transition-transform duration-300 ${
              isCollapsed ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>
    </>
  )
}

const NavItem = ({
  to,
  currentPath,
  children,
  icon,
  isCollapsed,
  onClick,
  activeBg = '#3d3d3d',
}: {
  to: string
  currentPath: string
  children: React.ReactNode
  icon: React.ReactNode
  isCollapsed: boolean
  onClick?: () => void
  activeBg?: string
}) => {
  const isActive =
    currentPath === to || (to !== '/' && currentPath.startsWith(to))

  return (
    <li>
      <Link
        to={to}
        onClick={onClick}
        className={`
          flex items-center px-4 py-4 lg:py-3 rounded-xl transition-all duration-200 group
          hover:shadow-lg hover:scale-105 active:scale-95
          ${
            isActive
              ? 'text-white'
              : 'text-gray-300 hover:bg-[#3d3d3d] hover:text-white'
          }
        `}
        style={
          isActive
            ? {
                backgroundColor: activeBg,
                backgroundImage:
                  'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
              }
            : {}
        }
      >
        <div className="relative">{icon}</div>
        {(!isCollapsed || window.innerWidth < 1024) && (
          <span className="ml-4 text-xl lg:text-base font-medium">
            {children}
          </span>
        )}
      </Link>
    </li>
  )
}
