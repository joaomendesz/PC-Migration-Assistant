const BLOCKED_PACKAGE_ID_CHARS = /[\\/"'`;|&<>$]/

export function isValidWingetPackageId(packageId: string): boolean {
  if (packageId.length < 3 || packageId.length > 128) return false
  if (!packageId.includes('.')) return false
  if (BLOCKED_PACKAGE_ID_CHARS.test(packageId)) return false
  return /^[A-Za-z0-9][A-Za-z0-9._+-]*$/.test(packageId)
}
