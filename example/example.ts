import { Mith } from './deps.ts'
import rootRouter from './routes/root.ts'

const app = new Mith()

app.use(rootRouter.getRoutes())
app.error(
  (req, res, next) => {
    if (res.error) {
      res.status = res.error.status || 500
      res.body = {
        message: res.error.message
      }
    } else if (!req.requestHandled) {
      res.status = 404
      res.body = 'Not Found'
    }
    next()
  }
)

export default app