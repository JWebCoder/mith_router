import { Router } from '../deps.ts'
import deeperRouter from './deeper.ts'
const deepRouter = new Router()

deepRouter.use(
  'GET',
  '/deeper',
  deeperRouter.getRoutes()
)

deepRouter.use(
  'GET',
  '/',
  (req, res, next) => {
    res.body.test = 'deep'
    next()
  }  
)

export default deepRouter