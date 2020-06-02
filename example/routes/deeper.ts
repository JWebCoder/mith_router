import { Router } from '../deps.ts'
const deeperRouter = new Router()

deeperRouter.use(
  'GET',
  '/',
  (req, res, next) => {
  res.body.test = 'deeper'
  next()
})

export default deeperRouter
