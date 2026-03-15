import { spawn } from "node:child_process"
import http from "node:http"
import process from "node:process"

const rendererUrl = "http://127.0.0.1:5173"
let viteProcess
let electronProcess
let shuttingDown = false

function spawnCommand(command, args, extraOptions = {}) {
  if (process.platform === "win32") {
    const commandLine = [command, ...args].join(" ")

    return spawn("cmd.exe", ["/d", "/s", "/c", commandLine], {
      stdio: "inherit",
      ...extraOptions,
    })
  }

  return spawn(command, args, {
    stdio: "inherit",
    shell: false,
    ...extraOptions,
  })
}

function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true

  if (electronProcess && !electronProcess.killed) {
    electronProcess.kill()
  }

  if (viteProcess && !viteProcess.killed) {
    viteProcess.kill()
  }

  process.exit(code)
}

function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now()

  return new Promise((resolve, reject) => {
    const check = () => {
      const request = http.get(url, (response) => {
        response.resume()
        resolve()
      })

      request.on("error", () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error("Timed out waiting for Vite dev server"))
          return
        }

        setTimeout(check, 500)
      })
    }

    check()
  })
}

viteProcess = spawnCommand("npm", [
  "run",
  "dev",
  "--",
  "--host",
  "127.0.0.1",
  "--port",
  "5173",
])

viteProcess.on("exit", (code) => {
  if (!shuttingDown) {
    shutdown(code ?? 1)
  }
})

try {
  await waitForServer(rendererUrl)
} catch (error) {
  console.error(error.message)
  shutdown(1)
}

electronProcess = spawnCommand("npx", ["electron", "."], {
  env: {
    ...process.env,
    ELECTRON_RENDERER_URL: rendererUrl,
  },
})

electronProcess.on("exit", (code) => {
  shutdown(code ?? 0)
})

process.on("SIGINT", () => shutdown(0))
process.on("SIGTERM", () => shutdown(0))
