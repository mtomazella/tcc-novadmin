import { createBrowserRouter } from 'react-router-dom'
import Login from '../pages/auth/Login'
import Client from '../pages/client/Client'
import Product from '../pages/product/Product'
import Work from '../pages/work/Work'
import PrivateRoute from './PrivateRoute'
import PublicRoute from './PublicRoute'
import { RootLayout } from './RootLayout'
import { Navigate } from 'react-router-dom'
import { webPermissions } from '../hooks/auth/usePermissions'
import Cost from '../pages/costs/CostsPage'
import Suppliers from '../pages/supplier/SuppliersPage'
import QuoteListPage from '../pages/quote/list'
import QuoteManagerPage from '../pages/quote/edit'
import ScopeEditPage from '../pages/quote/edit/ScopeEditPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        path: '/login',
        element: <PublicRoute />,
        children: [{ index: true, element: <Login /> }],
      },
      {
        path: '/cliente',
        element: (
          <PrivateRoute requiredPermission={webPermissions.client.view} />
        ),
        children: [{ index: true, element: <Client /> }],
      },
      {
        path: '/produto',
        element: (
          <PrivateRoute requiredPermission={webPermissions.product.view} />
        ),
        children: [{ index: true, element: <Product /> }],
      },
      {
        path: '/obra',
        element: <PrivateRoute requiredPermission={webPermissions.obra.view} />,
        children: [{ index: true, element: <Work /> }],
      },
      {
        path: '/cost',
        element: <PrivateRoute requiredPermission={webPermissions.cost.view} />,
        children: [{ index: true, element: <Cost /> }],
      },
      {
        path: '/orcamento',
        element: <PrivateRoute />,
        children: [{ index: true, element: <QuoteListPage /> }],
      },
      {
        path: '/orcamento/edit/:id',
        element: (
          <PrivateRoute requiredPermission={webPermissions.quote.edit} />
        ),
        children: [{ index: true, element: <QuoteManagerPage /> }],
      },
      {
        path: '/orcamento/edit/:id/escopo/:scopeId',
        element: (
          <PrivateRoute requiredPermission={webPermissions.quote.edit} />
        ),
        children: [{ index: true, element: <ScopeEditPage /> }],
      },
      {
        path: '/supplier',
        element: (
          <PrivateRoute requiredPermission={webPermissions.supplier.view} />
        ),
        children: [{ index: true, element: <Suppliers /> }],
      },
      {
        path: '*',
        element: <Navigate to="/login" replace />,
        children: [{ index: true, element: <Login /> }],
      },
    ],
  },
])
