import { useAuth } from '../../contexts/AuthContext'

export const webPermissions = {
  dashboard: 'web:dashboard',
  product: {
    view: 'web:product:view',
    edit: 'web:product:edit',
    add: 'web:product:add',
    delete: 'web:product:delete',
  },
  client: {
    view: 'web:client:view',
    edit: 'web:client:edit',
    add: 'web:client:add',
    delete: 'web:client:delete',
  },
  obra: {
    view: 'web:obra:view',
    edit: 'web:obra:edit',
    add: 'web:obra:add',
    delete: 'web:obra:delete',
  },
  romaneio: {
    view: 'web:romaneio:view',
    edit: 'web:romaneio:edit',
    add: 'web:romaneio:add',
    delete: 'web:romaneio:delete',
  },
  tag: {
    view: 'web:tag:view',
    generate: 'web:tag:generate',
    delete: 'web:tag:delete',
  },
  delivery: {
    view: 'web:delivery:view',
    edit: 'web:delivery:edit',
    add: 'web:delivery:add',
    delete: 'web:delivery:delete',
  },
  deliveryDocument: {
    view: 'web:delivery-document:view',
    edit: 'web:delivery-document:edit',
    add: 'web:delivery-document:add',
    delete: 'web:delivery-document:delete',
  },
  kanban: {
    view: 'web:kanban:view',
    edit: 'web:kanban:edit',
    add: 'web:kanban:add',
    delete: 'web:kanban:delete'
  },
  cost: {
    view: 'web:quote_fixed_cost:view',
    edit: 'web:quote_fixed_cost:edit',
    add: 'web:quote_fixed_cost:add',
    delete: 'web:quote_fixed_cost:delete',
  },
  quote: {
    view: 'web:quote:view',
    edit: 'web:quote:edit',
    add: 'web:quote:add',
    delete: 'web:quote:delete',
  },
  supplier: {
    view: 'web:supplier:view',
    edit: 'web:supplier:edit',
    add: 'web:supplier:add',
    delete: 'web:supplier:delete',
  },
  budget: {
    view: 'web:quote:view',
    edit: 'web:quote:edit',
    add: 'web:quote:add',
    delete: 'web:quote:delete'
  },
  material: {
    view: 'web:material:view',
    edit: 'web:material:edit',
    add: 'web:material:add',
    delete: 'web:material:delete'
  },
  quotePricingOption: {
    view: 'web:quote_pricing_option:view',
    edit: 'web:quote_pricing_option:edit',
    add: 'web:quote_pricing_option:add',
    delete: 'web:quote_pricing_option:delete'
  },
  quoteScope: {
    view: 'web:quote_scope:view',
    edit: 'web:quote_scope:edit',
    add: 'web:quote_scope:add',
    delete: 'web:quote_scope:delete'
  },
  quoteElement: {
    view: 'web:quote_element:view',
    edit: 'web:quote_element:edit',
    add: 'web:quote_element:add',
    delete: 'web:quote_element:delete'
  },
  quoteDocument: {
    view: 'web:quote_document:view',
    edit: 'web:quote_document:edit',
    add: 'web:quote_document:add',
    delete: 'web:quote_document:delete'
  },
  user: {
    view: 'web:user:view',
    edit: 'web:user:edit',
    add: 'web:user:add',
    delete: 'web:user:delete'
  },
  profile: {
    view: 'web:profile:view',
    edit: 'web:profile:edit',
    add: 'web:profile:add',
    delete: 'web:profile:delete'
  },
  app: {
    buildPackage: 'app:build-package',
    loadPackage: 'app:load-package',
    removePackageFromDelivery: 'app:remove-package-from-delivery',
    removeItemFromPackage: 'app:remove-item-from-package',
    search: 'app:search'
  }
};

export const usePermissions = () => {
  const { currentUser } = useAuth()
  return currentUser?.permissions || []
}

export const useHasPermission = (permission: string) => {
  const permissions = usePermissions()
  return permissions.includes(permission)
}

export const useHasAnyPermission = (permissions: string[]) => {
  const userPermissions = usePermissions()
  return permissions.some(permission => userPermissions.includes(permission))
}
