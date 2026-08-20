import type { WingetPackage, WingetStatus } from '@shared/types/app'
import { ProcessRunner } from '@main/services/processRunner'
import { isValidWingetPackageId } from './wingetValidation'

const WINGET_TIMEOUT_MS = 60_000

export class WingetService {
  constructor(private readonly processRunner = new ProcessRunner()) {}

  async detect(): Promise<WingetStatus> {
    const result = await this.processRunner.runExecutable({
      executable: 'winget',
      args: ['--version'],
      timeoutMs: 10_000,
    })

    if (result.exitCode !== 0 || result.timedOut) {
      return {
        available: false,
        error: result.timedOut ? 'Winget demorou demais para responder.' : result.stderr.trim(),
      }
    }

    return {
      available: true,
      version: result.stdout.trim(),
    }
  }

  async listInstalledPackages(): Promise<WingetPackage[]> {
    const primary = await this.processRunner.runExecutable({
      executable: 'winget',
      args: ['list', '--accept-source-agreements', '--disable-interactivity'],
      timeoutMs: WINGET_TIMEOUT_MS,
      env: {
        COLUMNS: '240',
      },
    })

    if (primary.exitCode === 0 && !primary.timedOut) {
      return this.parseWingetList(primary.stdout)
    }

    const fallback = await this.processRunner.runExecutable({
      executable: 'winget',
      args: ['list', '--accept-source-agreements'],
      timeoutMs: WINGET_TIMEOUT_MS,
      env: {
        COLUMNS: '240',
      },
    })

    if (fallback.exitCode !== 0 || fallback.timedOut) {
      return []
    }

    return this.parseWingetList(fallback.stdout)
  }

  parseWingetList(output: string): WingetPackage[] {
    const lines = output
      .split(/\r?\n/)
      .map((line) => line.trimEnd())
      .filter((line) => line.trim().length > 0)

    const fixedWidthPackages = this.parseFixedWidthTable(lines)
    const packages =
      fixedWidthPackages.length > 0 ? fixedWidthPackages : this.parseLooseTable(lines)
    const byId = new Map<string, WingetPackage>()

    for (const item of packages) {
      if (!isValidWingetPackageId(item.packageId)) continue
      byId.set(item.packageId.toLowerCase(), item)
    }

    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
  }

  private parseFixedWidthTable(lines: string[]): WingetPackage[] {
    const headerIndex = lines.findIndex(
      (line) => /\bName\b/.test(line) && /\bId\b/.test(line) && /\bVersion\b/.test(line),
    )

    if (headerIndex < 0) return []

    const header = lines[headerIndex]
    const idStart = header.indexOf('Id')
    const versionStart = header.indexOf('Version')
    const availableStart = header.indexOf('Available')
    const sourceStart = header.indexOf('Source')

    if (idStart < 0 || versionStart < 0 || idStart >= versionStart) return []

    const versionEnd =
      availableStart > -1 ? availableStart : sourceStart > -1 ? sourceStart : undefined

    return lines
      .slice(headerIndex + 1)
      .filter((line) => !/^\s*-+\s*$/.test(line))
      .map((line) => {
        const name = line.slice(0, idStart).trim()
        const idColumn = line.slice(idStart, versionStart).trim()
        const packageId = idColumn.split(/\s+/).find((part) => isValidWingetPackageId(part)) ?? ''
        const version = line.slice(versionStart, versionEnd).trim() || undefined
        const source = sourceStart > -1 ? line.slice(sourceStart).trim() || undefined : undefined

        return {
          name,
          packageId,
          version,
          source,
        }
      })
      .filter((item) => item.name.length > 0 && isValidWingetPackageId(item.packageId))
  }

  private parseLooseTable(lines: string[]): WingetPackage[] {
    return lines
      .filter((line) => !line.includes('---') && !line.toLowerCase().includes('name'))
      .map((line) =>
        line
          .trim()
          .split(/\s{2,}/)
          .filter(Boolean),
      )
      .map((columns): WingetPackage | undefined => {
        if (columns.length < 2) return undefined

        const packageId = columns.find(
          (column, index) => index > 0 && isValidWingetPackageId(column),
        )
        if (!packageId) return undefined

        const idIndex = columns.indexOf(packageId)
        return {
          name: columns.slice(0, idIndex).join(' ').trim(),
          packageId,
          version: columns[idIndex + 1],
          source: columns.at(-1),
        }
      })
      .filter((item): item is WingetPackage => Boolean(item))
  }
}
