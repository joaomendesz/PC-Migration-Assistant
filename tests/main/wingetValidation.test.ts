import { describe, expect, it } from 'vitest'
import { isValidWingetPackageId } from '@main/scanners/wingetValidation'

describe('winget package validation', () => {
  it('accepts package ids used by winget', () => {
    expect(isValidWingetPackageId('Google.Chrome')).toBe(true)
    expect(isValidWingetPackageId('Microsoft.VisualStudioCode')).toBe(true)
  })

  it('rejects shell metacharacters and non package names', () => {
    expect(isValidWingetPackageId('Google.Chrome;Remove-Item')).toBe(false)
    expect(isValidWingetPackageId('winget install Google.Chrome')).toBe(false)
    expect(isValidWingetPackageId('Chrome')).toBe(false)
  })
})
