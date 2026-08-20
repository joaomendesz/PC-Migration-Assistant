import os from 'node:os'
import type { SystemInfo } from '@shared/types/system'

export function getSystemInfo(): SystemInfo {
  const cpus = os.cpus()
  const release = os.release()

  return {
    computerName: os.hostname(),
    osName: process.platform === 'win32' ? 'Windows' : os.type(),
    osVersion: release,
    osBuild: release.split('.').at(-1) ?? release,
    architecture: os.arch(),
    cpu: cpus[0]?.model ?? 'CPU não identificada',
    memoryGB: Math.round((os.totalmem() / 1024 ** 3) * 10) / 10,
  }
}
