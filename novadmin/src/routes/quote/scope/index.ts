import { Router } from 'express'
import { quoteScopeGet } from './get'
import { quoteScopePost } from './post'
import { quoteScopeDelete } from './delete'
import { quoteScopeLockPost } from './lock'
import { quoteScopeUnlockPost } from './unlock'

export const quoteScopeRouter = Router()

quoteScopeRouter.get('/', quoteScopeGet)
quoteScopeRouter.post('/', quoteScopePost)
quoteScopeRouter.post('/lock', quoteScopeLockPost)
quoteScopeRouter.post('/unlock', quoteScopeUnlockPost)
quoteScopeRouter.delete('/', quoteScopeDelete)
