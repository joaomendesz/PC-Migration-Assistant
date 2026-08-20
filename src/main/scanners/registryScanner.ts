import type { RegistryApplication } from '@shared/types/app'
import { ProcessRunner } from '@main/services/processRunner'

const REGISTRY_ROOTS = [
  'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
  'HKLM\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
  'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
] as const

interface RegistryAccumulator {
  registryKey: string
  registryRoot: string
  values: Record<string, string>
}

export class RegistryScanner {
  constructor(private readonly processRunner = new ProcessRunner()) {}

  async scanInstalledApplications(): Promise<RegistryApplication[]> {
    if (process.platform !== 'win32') return []

    const apps: RegistryApplication[] = []

    for (const root of REGISTRY_ROOTS) {
      const result = await this.processRunner.runExecutable({
        executable: 'reg',
        args: ['query', root, '/s'],
        timeoutMs: 60_000,
      })

      if (result.exitCode !== 0 || result.timedOut) continue
      apps.push(...this.parseRegistryOutput(result.stdout, root))
    }

    return apps
  }

  parseRegistryOutput(output: string, registryRoot: string): RegistryApplication[] {
    const entries: RegistryAccumulator[] = []
    let current: RegistryAccumulator | undefined

    const flushCurrent = (): void => {
      if (current) entries.push(current)
      current = undefined
    }

    for (const line of output.split(/\r?\n/)) {
      const trimmed = line.trim()

      if (trimmed.startsWith('HKEY_')) {
        flushCurrent()
        current = {
          registryKey: trimmed,
          registryRoot,
          values: {},
        }
        continue
      }

      const valueMatch = line.match(/^\s+([^\s]+)\s+REG_[A-Z_]+\s+(.*)$/)
      if (valueMatch && current) {
        const [, name, value] = valueMatch
        current.values[name] = value.trim()
      }
    }

    flushCurrent()

    return entries
      .map((entry) => this.toApplication(entry))
      .filter((app): app is RegistryApplication => Boolean(app))
  }

  private toApplication(entry: RegistryAccumulator): RegistryApplication | undefined {
    const name = entry.values.DisplayName
    if (!name) return undefined
    if (entry.values.SystemComponent === '0x1') return undefined
    if (entry.values.ReleaseType === 'Update') return undefined

    return {
      name,
      version: entry.values.DisplayVersion,
      publisher: entry.values.Publisher,
      installLocation: entry.values.InstallLocation,
      icon: entry.values.DisplayIcon,
      uninstallString: entry.values.UninstallString,
      registryKey: entry.registryKey,
      registryRoot: entry.registryRoot,
    }
  }
}
