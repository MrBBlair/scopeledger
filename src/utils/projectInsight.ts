import { formatCurrency } from './format'

export function getProjectInsight(
  costToDate: number,
  totalBudget: number,
  remainingBudget: number,
  burnRate: number,
  costCount: number
): string {
  if (costCount === 0) {
    return 'No costs recorded yet. Add costs to track spending and burn rate.'
  }

  if (remainingBudget < 0) {
    return `Over budget by ${formatCurrency(-remainingBudget)}. Review costs and consider adjustments.`
  }

  const percentSpent = totalBudget > 0 ? (costToDate / totalBudget) * 100 : 0

  if (burnRate <= 0) {
    if (percentSpent >= 90) {
      return `Approaching budget limit. ${percentSpent.toFixed(0)}% of budget spent. Add more cost entries to estimate burn rate.`
    }
    return `${percentSpent.toFixed(0)}% of budget spent. Add at least two cost entries with different dates to estimate burn rate.`
  }

  const daysOfRunway = Math.floor(remainingBudget / burnRate)

  if (percentSpent >= 90) {
    return `Approaching budget limit. ${percentSpent.toFixed(0)}% spent. At current burn rate of ${formatCurrency(burnRate)}/day, remaining budget will last approximately ${daysOfRunway} days.`
  }

  return `On track. ${percentSpent.toFixed(0)}% of budget spent. At current burn rate of ${formatCurrency(burnRate)}/day, remaining budget will last approximately ${daysOfRunway} days.`
}
