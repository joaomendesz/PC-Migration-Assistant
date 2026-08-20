import { constants as fsConstants } from 'node:fs'
import { access, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { WingetPackage, WingetStatus } from '@shared/types/app'
import { ProcessRunner } from '@main/services/processRunner'
import { isValidWingetPackageId } from './wingetValidation'

const WINGET_TIMEOUT_MS = 60_000
const WINGET_DETECT_TIMEOUT_MS = 10_000

interface WingetExecutable {
  executable: string
  resolvedFrom: 'path' | 'windowsApps'
  version: string
}

export class WingetService {
  private cachedExecutable: WingetExecutable | undefined

  constructor(private readonly processRunner = new ProcessRunner()) {}

  async detect(): Promise<WingetStatus> {
    const executable = await this.resolveExecutable()

    if (!executable) {
      return {
        available: false,
        error:
          process.platform === 'win32'
            ? 'Winget não foi encontrado no PATH nem no alias WindowsApps do usuário.'
            : 'Winget só está disponível no Windows.',
      }
    }

    return {
      available: true,
      version: executable.version,
      resolvedFrom: executable.resolvedFrom,
    }
  }

  async listInstalledPackages(): Promise<WingetPackage[]> {
    const executable = await this.resolveExecutable()
    if (!executable) return []

    const listPackages = await this.listFromWingetList(executable)
    const exportPackages = await this.exportInstalledPackages(executable)

    return this.mergeWingetPackages(listPackages, exportPackages)
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
      byId.set(item.packageId.toLowerCase(), {
        ...item,
        detectedBy: item.detectedBy ?? 'list',
      })
    }

    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
  }

  parseWingetExportManifest(output: string): WingetPackage[] {
    const parsed: unknown = JSON.parse(output)
    if (!isRecord(parsed) || !Array.isArray(parsed.Sources)) return []

    const packages: WingetPackage[] = []

    for (const source of parsed.Sources) {
      if (!isRecord(source) || !Array.isArray(source.Packages)) continue

      const sourceName = readSourceName(source)

      for (const packageEntry of source.Packages) {
        if (!isRecord(packageEntry)) continue

        const packageId = readString(packageEntry.PackageIdentifier)
        if (!packageId || !isValidWingetPackageId(packageId)) continue

        const version = readString(packageEntry.Version) ?? readString(packageEntry.PackageVersion)

        packages.push({
          name: deriveNameFromPackageId(packageId),
          packageId,
          version,
          source: sourceName,
          detectedBy: 'export',
        })
      }
    }

    return this.dedupePackages(packages)
  }

  private async resolveExecutable(): Promise<WingetExecutable | undefined> {
    if (this.cachedExecutable) return this.cachedExecutable
    if (process.platform !== 'win32') return undefined

    for (const candidate of this.getExecutableCandidates()) {
      if (candidate.resolvedFrom !== 'path' && !(await fileExists(candidate.executable))) continue

      const result = await this.processRunner.runExecutable({
        executable: candidate.executable,
        args: ['--version'],
        timeoutMs: WINGET_DETECT_TIMEOUT_MS,
      })

      if (result.exitCode === 0 && !result.timedOut && result.stdout.trim().length > 0) {
        this.cachedExecutable = {
          ...candidate,
          version: result.stdout.trim(),
        }
        return this.cachedExecutable
      }
    }

    return undefined
  }

  private getExecutableCandidates(): Array<Omit<WingetExecutable, 'version'>> {
    const candidates: Array<Omit<WingetExecutable, 'version'>> = [
      {
        executable: 'winget',
        resolvedFrom: 'path',
      },
    ]

    if (process.env.LOCALAPPDATA) {
      candidates.push({
        executable: join(process.env.LOCALAPPDATA, 'Microsoft', 'WindowsApps', 'winget.exe'),
        resolvedFrom: 'windowsApps',
      })
    }

    return candidates
  }

  private async listFromWingetList(executable: WingetExecutable): Promise<WingetPackage[]> {
    const primary = await this.processRunner.runExecutable({
      executable: executable.executable,
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
      executable: executable.executable,
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

  private async exportInstalledPackages(executable: WingetExecutable): Promise<WingetPackage[]> {
    const tempDir = await mkdtemp(join(tmpdir(), 'pcma-winget-'))
    const outputPath = join(tempDir, 'winget-export.json')

    try {
      const primary = await this.processRunner.runExecutable({
        executable: executable.executable,
        args: [
          'export',
          '--output',
          outputPath,
          '--include-versions',
          '--accept-source-agreements',
          '--disable-interactivity',
        ],
        timeoutMs: WINGET_TIMEOUT_MS,
      })

      if (primary.exitCode !== 0 || primary.timedOut) {
        const fallback = await this.processRunner.runExecutable({
          executable: executable.executable,
          args: [
            'export',
            '--output',
            outputPath,
            '--include-versions',
            '--accept-source-agreements',
          ],
          timeoutMs: WINGET_TIMEOUT_MS,
        })

        if (fallback.exitCode !== 0 || fallback.timedOut) return []
      }

      const contents = await readFile(outputPath, 'utf8')
      return this.parseWingetExportManifest(contents)
    } catch {
      return []
    } finally {
      await rm(tempDir, { recursive: true, force: true })
    }
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
    const availableEnd = sourceStart > -1 ? sourceStart : undefined

    return lines
      .slice(headerIndex + 1)
      .filter((line) => !/^\s*-+\s*$/.test(line))
      .map((line): WingetPackage => {
        const name = line.slice(0, idStart).trim()
        const idColumn = line.slice(idStart, versionStart).trim()
        const packageId = idColumn.split(/\s+/).find((part) => isValidWingetPackageId(part)) ?? ''
        const version = line.slice(versionStart, versionEnd).trim() || undefined
        const availableVersion =
          availableStart > -1
            ? line.slice(availableStart, availableEnd).trim() || undefined
            : undefined
        const source = sourceStart > -1 ? line.slice(sourceStart).trim() || undefined : undefined

        return {
          name,
          packageId,
          version,
          availableVersion,
          source,
          detectedBy: 'list',
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
        const remaining = columns.slice(idIndex + 1)
        const version = remaining[0]
        const source = readLooseSource(remaining)
        const availableVersion = readLooseAvailableVersion(remaining, source)

        return {
          name: columns.slice(0, idIndex).join(' ').trim(),
          packageId,
          version,
          availableVersion,
          source,
          detectedBy: 'list',
        }
      })
      .filter((item): item is WingetPackage => Boolean(item))
  }

  private mergeWingetPackages(
    listPackages: WingetPackage[],
    exportPackages: WingetPackage[],
  ): WingetPackage[] {
    const byId = new Map<string, WingetPackage>()

    for (const item of listPackages) {
      byId.set(item.packageId.toLowerCase(), item)
    }

    for (const item of exportPackages) {
      const key = item.packageId.toLowerCase()
      const existing = byId.get(key)

      byId.set(
        key,
        existing
          ? {
              ...existing,
              version: existing.version ?? item.version,
              source: existing.source ?? item.source,
              detectedBy: 'list-and-export',
            }
          : item,
      )
    }

    return this.dedupePackages([...byId.values()])
  }

  private dedupePackages(packages: WingetPackage[]): WingetPackage[] {
    const byId = new Map<string, WingetPackage>()

    for (const item of packages) {
      if (!isValidWingetPackageId(item.packageId)) continue
      byId.set(item.packageId.toLowerCase(), item)
    }

    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function readSourceName(source: Record<string, unknown>): string | undefined {
  const sourceDetails = source.SourceDetails
  if (!isRecord(sourceDetails)) return undefined
  return readString(sourceDetails.Name) ?? readString(sourceDetails.Identifier)
}

function deriveNameFromPackageId(packageId: string): string {
  return packageId
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, fsConstants.F_OK)
    return true
  } catch {
    return false
  }
}

function readLooseSource(columnsAfterId: string[]): string | undefined {
  if (columnsAfterId.length < 2) return undefined

  const last = columnsAfterId.at(-1)
  if (!last) return undefined

  return isKnownWingetSource(last) ? last : undefined
}

function readLooseAvailableVersion(
  columnsAfterId: string[],
  source: string | undefined,
): string | undefined {
  if (columnsAfterId.length < 2) return undefined
  if (columnsAfterId.length === 2) return source ? undefined : columnsAfterId[1]

  return columnsAfterId[1]
}

function isKnownWingetSource(value: string): boolean {
  return ['winget', 'msstore'].includes(value.trim().toLowerCase())
}
