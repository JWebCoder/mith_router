import { Middleware, Response, NextFunction, Mith } from "https://deno.land/x/mith@v0.2.0/mod.ts";
import { ServerRequest } from "https://deno.land/std@0.51.0/http/server.ts";
import { match, MatchFunction } from 'https://raw.githubusercontent.com/pillarjs/path-to-regexp/master/src/index.ts'

declare module "https://deno.land/std@0.51.0/http/server.ts" {
  interface ServerRequest {
    params: {
      [key: string]: any
    }
    requestHandled: boolean
  }
}

interface RouterMiddleware extends Middleware {
  isRouter: boolean
}

type methods = 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'OPTIONS'

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
    [key in methods]: {
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
    DELETE: {},
    PATCH: {},
    OPTIONS: {}
  }

  private savedPaths: {
    [key in methods]: string[]
  } = {
    GET: [],
    POST: [],
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
  use(method: methods, path: string, middleware: Middleware | RouterMiddleware | Array<Middleware | RouterMiddleware>) {
    const subApp = new Mith({
      isSubApp: true
    })
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
  }

  /** Returns a middleware that will trigger the routing system
   * @return middleware
  */
  getRoutes(): RouterMiddleware {
    const router: RouterMiddleware = async (req: ServerRequest, res: Response, next: NextFunction) => {
      let matchedRoute = false
      const connectionId = req.conn.rid
      const statePath = getStatePath(req.conn.rid)
      for (const savedPath of this.savedPaths[req.method as methods]) {
        const route = this.paths[req.method as methods][savedPath]
        const matched = route.matcher(req.url.replace(statePath, '') || '/')
        if (matched) {
          matchedRoute = true
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
          return route.middleware.dispatch(req, res, 0, next)
        }
      }
      if (!matchedRoute) {
        deleteStatePath(connectionId)
        next()
      }
    }

    router.isRouter = true
    return router
  }
}