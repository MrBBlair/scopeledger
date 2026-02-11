# Project Insight (Computed)

## Overview

ScopeLedger shows a **predetermined project insight** in the Overview tab, computed from the project math: cost to date, total budget, remaining budget, and burn rate. No AI or external services.

## How it works

- **Implementation:** `src/utils/projectInsight.ts` — `getProjectInsight(costToDate, totalBudget, remainingBudget, burnRate, costCount)`
- **Logic:**
  - No costs: "No costs recorded yet. Add costs to track spending and burn rate."
  - Over budget: "Over budget by X. Review costs and consider adjustments."
  - Burn rate available: "On track. X% of budget spent. At current burn rate of Y/day, remaining budget will last approximately Z days."
  - Approaching limit (>90% spent): Similar message with runway days.
  - Insufficient cost history: Prompts user to add more cost entries.
- **Forecast snapshots:** The computed insight at save time is stored in the snapshot's `aiSummary` field for historical reference.
