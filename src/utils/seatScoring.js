// Gaussian scoring based on SMPTE/THX cinema standards.
// Keep this formula shared by room authoring and seat recommendations.
export function getSeatScore(r, c, rCount, cCount) {
  const idealRow = rCount * 0.66
  const sigmaRow = rCount * 0.20
  const distScore = Math.exp(-Math.pow(r - idealRow, 2) / (2 * sigmaRow * sigmaRow))

  const idealCol = (cCount - 1) / 2
  const sigmaCol = cCount * 0.25
  const centerScore = Math.exp(-Math.pow(c - idealCol, 2) / (2 * sigmaCol * sigmaCol))

  const frontRatio = r / rCount
  const frontPenalty = frontRatio < 0.15 ? 0.25 : frontRatio < 0.25 ? 0.6 : 1.0

  return 0.50 * distScore + 0.35 * centerScore + 0.15 * frontPenalty
}
