import {
  assert,
  assertEquals,
} from "https://deno.land/std@v0.57.0/testing/asserts.ts"

Deno.test("server is created", async () => {
  const { default: app } = await import('./example/example.ts')
  assert(app, 'is not created')
})

Deno.test("simple router get setup test", async () => {
  const { default: app } = await import('./example/example.ts')
  app.listen({ port: 8000})
  const response = await fetch(
    'http://localhost:8000',
    {
      method: 'GET',
    }
  )
  const result = await response.json()
  app.close()
  assertEquals(result.test, 'get')
})

Deno.test("simple router post setup test", async () => {
  const { default: app } = await import('./example/example.ts')
  app.listen({ port: 8000})
  const response = await fetch(
    'http://localhost:8000',
    {
      method: 'POST',
      body: JSON.stringify({
        test: 'post'
      })
    }
  )
  const result = await response.json()
  app.close()
  assertEquals(result.test, 'post')
})

Deno.test("simple router put setup test", async () => {
  const { default: app } = await import('./example/example.ts')
  app.listen({ port: 8000})
  const response = await fetch(
    'http://localhost:8000',
    {
      method: 'PUT',
      body: JSON.stringify({
        test: 'put'
      })
    }
  )
  const result = await response.json()
  app.close()
  assertEquals(result.test, 'put')
})

Deno.test("deep level 1 router", async () => {
  const { default: app } = await import('./example/example.ts')
  app.listen({ port: 8000})
  const response = await fetch(
    'http://localhost:8000/deep',
    {
      method: 'GET',
      body: 'text'
    }
  )
  const result = await response.json()
  app.close()
  assertEquals(result.test, 'deep')
})

Deno.test("deep level 2 router", async () => {
  const { default: app } = await import('./example/example.ts')
  app.listen({ port: 8000})
  const response = await fetch(
    'http://localhost:8000/deep/deeper',
    {
      method: 'GET',
      body: 'text'
    }
  )
  const result = await response.json()
  app.close()
  assertEquals(result.test, 'deeper')
})

Deno.test("multi middleware router", async () => {
  const { default: app } = await import('./example/example.ts')
  app.listen({ port: 8000})
  const response = await fetch(
    'http://localhost:8000/multimiddleware',
    {
      method: 'GET',
      body: 'text'
    }
  )
  const result = await response.json()
  app.close()
  assertEquals(result.one, 1)
  assertEquals(result.two, 2)
})

Deno.test("parameter setup router", async () => {
  const { default: app } = await import('./example/example.ts')
  app.listen({ port: 8000})
  const response = await fetch(
    'http://localhost:8000/user/1',
    {
      method: 'GET',
      body: 'text'
    }
  )
  const result = await response.json()
  app.close()
  assertEquals(result, { username: "JWebCoder", firstName: "joao", lastName: "Moura" })
})

Deno.test("error router", async () => {
  const { default: app } = await import('./example/example.ts')
  app.listen({ port: 8000})
  const response = await fetch(
    'http://localhost:8000/error',
    {
      method: 'GET',
      body: 'text'
    }
  )
  const result = await response.json()
  app.close()
  assertEquals(result, { message: "this is an error" })
  assertEquals(response.status, 402)
})
