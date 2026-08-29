import { Router } from 'express'
import { profileGet } from './get'
import { profilePost } from './post'
import { profileDelete } from './delete'

export const profileRouter = Router()

profileRouter.get('/', profileGet)
profileRouter.post('/', profilePost)
profileRouter.delete('/', profileDelete)
