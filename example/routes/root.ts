import { Router } from '../deps.ts'
import deepRouter from './deep.ts'
import app from '../example.ts'
import userController from '../controllers/users.ts'

const router = new Router()

router.use(
  'GET',
  '/user/:id',
  (req, res, next) => {
    res.body = userController.getUserById(req.params.id)
    next()
  }
)

router.useRouter(
  '/deep',
  deepRouter.getRoutes()
)

router.use(
  'GET',
  '/error',
  (req, res, next) => {
    next({message: 'this is an error', status: 402})
  }
)

router.use(
  'GET',
  '/close',
  (req, res, next) => {
    app.close()
    res.body = 'closed'
    next()
  }
)

router.use(
  'GET',
  '/multimiddleware',
  [
    (req, res, next) => {
      res.body.one = 1
      next()
    },
    (req, res, next) => {
      res.body.two = 2
      next()
    }
  ]
)

router.use(
  'GET',
  '/',
  (req, res, next) => {
    res.body = { test: 'get' }
    next()
  }
)
.use(
  'POST',
  '/',
  async (req, res, next) => {
    res.body = { test: 'post' }
    next()
  }
)
.use(
  'PUT',
  '/',
  async (req, res, next) => {
    res.body = { test: 'put' }
    next()
  }
)

export default router