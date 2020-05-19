# Mith_router

Routing system to be used with the [Mith framework](https://github.com/JWebCoder/mith)

## Deno documentation

[doc.deno.land/mith_router](https://doc.deno.land/https/deno.land/x/mith_router/mod.ts)

## Usage

**Basic integration with routing**
```typescript
import Mith from 'https://deno.land/x/mith@v0.1.0/mod.ts'
import Router from 'https://deno.land/x/mith_router@v0.0.1/mod.ts'
const { env } = Deno

const router = new Router()
const innerRouter = new Router()

innerRouter.use(
  'GET',
  '/',
  (req, res, next) => {
    res.body.text = 'inner route'
    next()
  }
)

router.use(
  'GET',
  '/inner',
  innerRouter.getRoutes()
)

router.use(
  'GET',
  '/',
  (req, res, next) => {
    res.body.text = 'something'
    next()
  }
)

const app = new Mith()

app.use(router.getRoutes())

const PORT = Number(env.get('PORT')) || 3000
app.listen({ port: PORT})
console.log('listening on', PORT)
```

Right now I'm still working on the documentation, so you can check the **example** folder for full usage examples