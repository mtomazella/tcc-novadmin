import { Router } from 'express'
import { userGet } from './get'
import { userPost } from './post'

export const userRouter = Router()

userRouter.get('/', userGet)
userRouter.post('/', userPost)
