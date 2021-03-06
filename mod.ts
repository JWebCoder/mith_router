import { Middleware, IResponse, IRequest, NextFunction, Mith } from 'https://deno.land/x/mith@v0.9.4/mod.ts'
import { match, MatchFunction } from 'https://raw.githubusercontent.com/pillarjs/path-to-regexp/master/src/index.ts'

interface RouterMiddleware<
  Req extends IRequest = any,
  Res extends IResponse = any,
  Next extends NextFunction = any
> extends Middleware {
  isRouter: boolean
}

type methodTypes = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS'
const allMethods: Array<methodTypes> = [
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
  'OPTIONS'
]
const state: {
  [key: number]: string
} = {}

/** Router state handlers
 * they are used to keep track of the current state of the matcher during deep routing
 * this is cleaned when the request ends
 */

 /** Sets the router state
 * @param id connection id from Deno request object
 * @param path string containing the currently matched path
 * @return void
 */
const setStatePath = (id: number, path: string) => {
  return state[id] = path
}

/** Get a router state
 * @param id connection id from Deno request object
 * @return current state for the id
 */
const getStatePath = (id: number) => {
  return state[id]
}

/** Delete a router state
 * @param id connection id from Deno request object
 * @return void
 */
const deleteStatePath = (id: number) => {
  delete state[id]
}

/** A class which registers middleware (via `.use()`) and then processes
 * inbound requests against that middleware (via `.getRoutes()`).
 */
export class Router {
  private paths: {
    [key in methodTypes]: {
      [key: string]: {
        middleware: Mith,
        isRouter: boolean,
        matcher: MatchFunction,
        route: string
      }
    }
  } = {
    GET: {},
    POST: {},
    PUT: {},
    DELETE: {},
    PATCH: {},
    OPTIONS: {}
  }

  private savedPaths: {
    [key in methodTypes]: string[]
  } = {
    GET: [],
    POST: [],
    PUT: [],
    DELETE: [],
    PATCH: [],
    OPTIONS: []
  }

  /** Register middleware to be used with the router.
   * @param methods http method
   * @param path path that will be matched with the requested url
   * @param middleware
   * @return void
  */
  use(method: methodTypes, path: string, middleware: Middleware | RouterMiddleware | Array<Middleware | RouterMiddleware>) {
    const subApp = new Mith()
    subApp.use(middleware)
    let isRouter = false
    if (Array.isArray(middleware)) {
      isRouter = middleware.filter(
        (item) => {
          return (item as RouterMiddleware).isRouter
        }
      ).length > 0
    } else {
      isRouter = (middleware as RouterMiddleware).isRouter
    }
    this.paths[method][path] = {
      middleware: subApp,
      isRouter,
      matcher: match(path, { end: !isRouter }),
      route: path,
    }
    this.savedPaths[method] = Object.keys(this.paths[method])
    return this
  }

  /** Register router middleware to be used with the router.
   * @param path path that will be matched with the requested url
   * @param middleware
   * @return void
  */
 useRouter(path: string, middleware: RouterMiddleware | Array<RouterMiddleware>) {
  const subApp = new Mith()
  subApp.use(middleware)
  allMethods.forEach(
    (method) => {
      this.paths[method][path] = {
        middleware: subApp,
        isRouter: true,
        matcher: match(path, { end: false }),
        route: path,
      }
      this.savedPaths[method] = Object.keys(this.paths[method])
    }
  )
  return this
}

  /** Returns a middleware that will trigger the routing system
   * @return middleware
  */
  getRoutes() {
    const router = (req: any, res: any, next: NextFunction) => {
      const connectionId = req.serverRequest.conn.rid
      const statePath = getStatePath(connectionId)
      const {
        method,
        url
      } = req.serverRequest
      for (const savedPath of this.savedPaths[method as methodTypes]) {
        const route = this.paths[method as methodTypes][savedPath]
        const matched = route.matcher(url.split('?')[0].replace(statePath, '') || '/')
        if (matched) {
          req.params = {
            ...req.params,
            ...matched.params
          }
          if (route.isRouter) {
            if (matched.path !== '/') {
              setStatePath(connectionId, (statePath || '') + matched.path)
            }
          } else {
            req.requestHandled = true
            deleteStatePath(connectionId)
          }
          route.middleware.dispatch(req, res, 'main', 0, next)
          return
        }
      }
      deleteStatePath(connectionId)
      next()
    }

    router.isRouter = true
    return router
  }
}