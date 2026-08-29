import { Router } from 'express'
import { userGet } from './get'
import { userPost } from './post'
import { userDelete } from './delete'

export const accountRouter = Router()

accountRouter.get('/', userGet)
accountRouter.post('/', userPost)
accountRouter.delete('/', userDelete)
