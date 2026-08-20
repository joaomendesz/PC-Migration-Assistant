import { spawn } from 'node:child_process'
import { performance } from 'node:perf_hooks'

export interface ProcessRunOptions {
  executable: string
  args: string[]
  timeoutMs?: number
  env?: Record<string, string>
}

export interface ProcessRunResult {
  stdout: string
  stderr: string
  exitCode: number | null
  timedOut: boolean
  durationMs: number
}

export class ProcessRunner {
  runExecutable(options: ProcessRunOptions): Promise<ProcessRunResult> {
    const startedAt = performance.now()
    const timeoutMs = options.timeoutMs ?? 30_000

    return new Promise<ProcessRunResult>((resolve) => {
      let stdout = ''
      let stderr = ''
      let settled = false
      let timedOut = false

      const child = spawn(options.executable, options.args, {
        shell: false,
        windowsHide: true,
        env: {
          ...process.env,
          ...options.env,
        },
      })

      const timer = setTimeout(() => {
        timedOut = true
        child.kill()
      }, timeoutMs)

      const finish = (exitCode: number | null): void => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        resolve({
          stdout,
          stderr,
          exitCode,
          timedOut,
          durationMs: Math.round(performance.now() - startedAt),
        })
      }

      child.stdout.setEncoding('utf8')
      child.stderr.setEncoding('utf8')

      child.stdout.on('data', (chunk: string) => {
        stdout += chunk
      })

      child.stderr.on('data', (chunk: string) => {
        stderr += chunk
      })

      child.on('error', (error) => {
        stderr += error.message
        finish(null)
      })

      child.on('close', (code) => {
        finish(code)
      })
    })
  }
}
