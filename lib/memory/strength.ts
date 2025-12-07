/**
 * Calculates memory strength based on various factors
 */
export function calculateMemoryStrength(
  importance: number,
  accessCount: number,
  daysSinceCreation: number,
  daysSinceLastAccess: number | null
): number {
  // Base strength from importance (0.3 to 0.7)
  let strength = 0.3 + (importance / 10) * 0.4

  // Boost from access count (up to +0.2)
  strength += Math.min(accessCount * 0.02, 0.2)

  // Decay based on time since creation
  const creationDecay = Math.max(0, 1 - daysSinceCreation / 365) // Decay over a year
  strength *= 0.5 + (creationDecay * 0.5)

  // Additional decay if not accessed recently
  if (daysSinceLastAccess !== null) {
    const accessDecay = Math.max(0, 1 - daysSinceLastAccess / 90) // Decay over 90 days
    strength *= 0.7 + (accessDecay * 0.3)
  }

  return Math.min(Math.max(strength, 0), 1) // Clamp between 0 and 1
}

/**
 * Gets days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

