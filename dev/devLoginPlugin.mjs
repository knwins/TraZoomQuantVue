import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../backend_api_python')

function readJson (text) {
  const lines = String(text || '').trim().split(/\r?\n/).filter(Boolean)
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    try {
      return JSON.parse(lines[index])
    } catch (error) {
      // Ignore log lines that are not the token payload.
    }
  }
  return null
}

export function devLoginPlugin ({ python = '' } = {}) {
  return {
    name: 'dev-default-login',
    apply: 'serve',
    configureServer (server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0]
        if (req.method !== 'POST' || url !== '/api/auth/dev-login') {
          next()
          return
        }
        const command = python || 'python'
        const child = spawn(command, ['-m', 'app.services.dev_login'], {
          cwd: backendDir,
          env: {
            ...process.env,
            DEV_LOGIN: 'true',
            PYTHONPATH: backendDir
          },
          windowsHide: true
        })
        let stdout = ''
        let settled = false
        const finish = (status, body) => {
          if (settled) return
          settled = true
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(body))
        }
        const timer = setTimeout(() => {
          child.kill()
          finish(503, { error: 'dev_login_timeout' })
        }, 15000)
        child.stdout.on('data', (chunk) => {
          stdout += chunk.toString()
        })
        child.on('error', () => {
          clearTimeout(timer)
          finish(503, { error: 'dev_login_unavailable' })
        })
        child.on('close', (code) => {
          clearTimeout(timer)
          const body = readJson(stdout)
          if (code === 0 && body && typeof body.token === 'string' && body.token) {
            finish(200, { token: body.token })
            return
          }
          finish(503, { error: (body && body.error) || 'dev_login_failed' })
        })
      })
    }
  }
}
