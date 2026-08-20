import { createHash } from 'node:crypto'
import type { InstalledApplication, RegistryApplication, WingetPackage } from '@shared/types/app'

const EDITION_SUFFIX_REGEX =
  /\b(\(?x64\)?|\(?x86\)?|\(?64-bit\)?|\(?32-bit\)?|\(?64 bit\)?|\(?32 bit\)?)\b/gi
const TRAILING_VERSION_REGEX = /\s+\d+(\.\d+){1,3}$/g
const WHITESPACE_REGEX = /\s+/g

export function normalizeApplicationName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(EDITION_SUFFIX_REGEX, '')
    .replace(TRAILING_VERSION_REGEX, '')
    .replace(/[®™©]/g, '')
    .replace(/[._-]+/g, ' ')
    .replace(/[()[\]{}]/g, ' ')
    .replace(WHITESPACE_REGEX, ' ')
    .trim()
    .toLowerCase()
}

export function createApplicationId(name: string, publisher?: string): string {
  const normalized = `${normalizeApplicationName(name)}:${publisher?.trim().toLowerCase() ?? ''}`
  return createHash('sha256').update(normalized).digest('hex').slice(0, 16)
}

export function mergeApplications(
  registryApps: RegistryApplication[],
  wingetPackages: WingetPackage[],
): InstalledApplication[] {
  const wingetByName = new Map<string, WingetPackage[]>()

  for (const wingetPackage of wingetPackages) {
    const key = normalizeApplicationName(wingetPackage.name)
    const current = wingetByName.get(key) ?? []
    current.push(wingetPackage)
    wingetByName.set(key, current)
  }

  const matchedWingetIds = new Set<string>()
  const appsByName = new Map<string, InstalledApplication>()

  for (const registryApp of registryApps) {
    const normalizedName = normalizeApplicationName(registryApp.name)
    if (!normalizedName) continue

    const wingetMatch = findBestWingetMatch(registryApp, wingetPackages, wingetByName)
    if (wingetMatch) matchedWingetIds.add(wingetMatch.packageId.toLowerCase())

    const candidate: InstalledApplication = {
      id: createApplicationId(registryApp.name, registryApp.publisher),
      name: registryApp.name,
      version: registryApp.version,
      publisher: registryApp.publisher,
      installLocation: registryApp.installLocation,
      icon: registryApp.icon,
      winget: wingetMatch
        ? {
            packageId: wingetMatch.packageId,
            source: wingetMatch.source,
            version: wingetMatch.version,
          }
        : undefined,
      restoreMethod: wingetMatch ? 'winget' : 'manual',
    }

    const existing = appsByName.get(normalizedName)
    appsByName.set(
      normalizedName,
      existing ? preferMoreCompleteApp(existing, candidate) : candidate,
    )
  }

  for (const wingetPackage of wingetPackages) {
    if (matchedWingetIds.has(wingetPackage.packageId.toLowerCase())) continue

    const normalizedName = normalizeApplicationName(wingetPackage.name)
    if (!normalizedName || appsByName.has(normalizedName)) continue

    appsByName.set(normalizedName, {
      id: createApplicationId(wingetPackage.name, wingetPackage.packageId),
      name: wingetPackage.name,
      version: wingetPackage.version,
      winget: {
        packageId: wingetPackage.packageId,
        source: wingetPackage.source,
        version: wingetPackage.version,
      },
      restoreMethod: 'winget',
    })
  }

  return [...appsByName.values()].sort((a, b) => a.name.localeCompare(b.name))
}

function findBestWingetMatch(
  registryApp: RegistryApplication,
  wingetPackages: WingetPackage[],
  wingetByName: Map<string, WingetPackage[]>,
): WingetPackage | undefined {
  const normalizedName = normalizeApplicationName(registryApp.name)
  const exact = wingetByName.get(normalizedName)?.[0]
  if (exact) return exact

  return wingetPackages.find((wingetPackage) => {
    const wingetName = normalizeApplicationName(wingetPackage.name)
    if (wingetName.length < 4 || normalizedName.length < 4) return false
    return wingetName.includes(normalizedName) || normalizedName.includes(wingetName)
  })
}

function preferMoreCompleteApp(
  current: InstalledApplication,
  candidate: InstalledApplication,
): InstalledApplication {
  return scoreApp(candidate) > scoreApp(current) ? candidate : current
}

function scoreApp(app: InstalledApplication): number {
  return [app.version, app.publisher, app.installLocation, app.icon, app.winget?.packageId].filter(
    Boolean,
  ).length
}
