import { createHash } from 'node:crypto'
import type { InstalledApplication, RegistryApplication, WingetPackage } from '@shared/types/app'

const EDITION_SUFFIX_REGEX =
  /\b(\(?x64\)?|\(?x86\)?|\(?64-bit\)?|\(?32-bit\)?|\(?64 bit\)?|\(?32 bit\)?)\b/gi
const TRAILING_VERSION_REGEX = /\s+\d+(\.\d+){1,3}$/g
const WHITESPACE_REGEX = /\s+/g
const MATCH_THRESHOLD = 0.78
const GENERIC_NAME_TOKENS = new Set([
  'app',
  'application',
  'browser',
  'desktop',
  'installer',
  'launcher',
  'setup',
  'software',
  'tool',
  'tools',
  'windows',
])

const PUBLISHER_SUFFIX_TOKENS = new Set([
  'co',
  'company',
  'corp',
  'corporation',
  'gmbh',
  'inc',
  'incorporated',
  'llc',
  'ltd',
  'limited',
  'sa',
])

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
            availableVersion: wingetMatch.availableVersion,
            detectedBy: wingetMatch.detectedBy,
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
        availableVersion: wingetPackage.availableVersion,
        detectedBy: wingetPackage.detectedBy,
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

  const rankedMatches = wingetPackages
    .map((wingetPackage) => ({
      wingetPackage,
      score: scoreWingetMatch(registryApp, wingetPackage),
    }))
    .filter((match) => match.score >= MATCH_THRESHOLD)
    .sort((a, b) => b.score - a.score)

  return rankedMatches[0]?.wingetPackage
}

function preferMoreCompleteApp(
  current: InstalledApplication,
  candidate: InstalledApplication,
): InstalledApplication {
  return scoreApp(candidate) > scoreApp(current) ? candidate : current
}

function scoreApp(app: InstalledApplication): number {
  const completeness = [
    app.version,
    app.publisher,
    app.installLocation,
    app.icon,
    app.winget?.packageId,
  ].filter(Boolean).length

  return completeness + (app.winget ? 2 : 0)
}

function scoreWingetMatch(registryApp: RegistryApplication, wingetPackage: WingetPackage): number {
  const registryName = normalizeApplicationName(registryApp.name)
  const wingetName = normalizeApplicationName(wingetPackage.name)

  if (!registryName || !wingetName) return 0
  if (registryName === wingetName) return 1

  const registryTokens = tokenizeApplicationName(registryApp.name)
  const wingetNameTokens = tokenizeApplicationName(wingetPackage.name)
  const packageIdTokens = tokenizePackageId(wingetPackage.packageId)
  const publisherTokens = registryApp.publisher ? tokenizePublisher(registryApp.publisher) : []
  const qualifierPenalty = scoreMissingGenericQualifier(
    registryApp.name,
    wingetPackage.name,
    wingetPackage.packageId,
  )

  const nameScore = scoreTokenOverlap(registryTokens, wingetNameTokens)
  const packageIdScore = scoreTokenOverlap(registryTokens, packageIdTokens) * 0.92
  const substringScore = scoreBoundarySubstring(registryName, wingetName)
  const publisherSignal = hasTokenOverlap(publisherTokens, [
    ...wingetNameTokens,
    ...packageIdTokens,
  ])

  const score =
    Math.max(nameScore, packageIdScore, substringScore) +
    (publisherSignal ? 0.08 : 0) -
    qualifierPenalty

  return Math.min(score, 1)
}

function tokenizeApplicationName(value: string): string[] {
  return tokenize(normalizeApplicationName(value)).filter(
    (token) => !GENERIC_NAME_TOKENS.has(token),
  )
}

function tokenizePackageId(value: string): string[] {
  return tokenize(value.replace(/[._+-]+/g, ' '))
}

function tokenizePublisher(value: string): string[] {
  return tokenize(normalizeApplicationName(value)).filter(
    (token) => !PUBLISHER_SUFFIX_TOKENS.has(token),
  )
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
}

function scoreTokenOverlap(sourceTokens: string[], targetTokens: string[]): number {
  if (sourceTokens.length === 0 || targetTokens.length === 0) return 0

  const target = new Set(targetTokens)
  const overlap = sourceTokens.filter((token) => target.has(token)).length
  if (overlap === 0) return 0

  const shortNameCoverage = overlap / Math.min(sourceTokens.length, targetTokens.length)
  const fullNameCoverage = overlap / Math.max(sourceTokens.length, targetTokens.length)

  if (shortNameCoverage === 1 && fullNameCoverage >= 0.5) return 0.84
  if (fullNameCoverage >= 0.75) return 0.86

  return fullNameCoverage
}

function scoreBoundarySubstring(source: string, target: string): number {
  if (source.length < 5 || target.length < 5) return 0
  if (containsTokenBoundary(target, source) || containsTokenBoundary(source, target)) return 0.82
  return 0
}

function containsTokenBoundary(target: string, source: string): boolean {
  return new RegExp(`(^|\\s)${escapeRegExp(source)}($|\\s)`).test(target)
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function hasTokenOverlap(sourceTokens: string[], targetTokens: string[]): boolean {
  if (sourceTokens.length === 0 || targetTokens.length === 0) return false
  const target = new Set(targetTokens)
  return sourceTokens.some((token) => target.has(token))
}

function scoreMissingGenericQualifier(
  registryName: string,
  wingetName: string,
  packageId: string,
): number {
  const registryAllTokens = tokenize(normalizeApplicationName(registryName))
  const genericQualifiers = registryAllTokens.filter((token) => GENERIC_NAME_TOKENS.has(token))
  if (genericQualifiers.length === 0) return 0

  const targetTokens = new Set([
    ...tokenize(normalizeApplicationName(wingetName)),
    ...tokenizePackageId(packageId),
  ])

  const hasMissingQualifier = genericQualifiers.some((token) => !targetTokens.has(token))
  return hasMissingQualifier ? 0.18 : 0
}
