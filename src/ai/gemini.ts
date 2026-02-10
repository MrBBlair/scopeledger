/**
 * Google Gemini AI integration.
 * Used for: budget insights, forecast suggestions, cost anomaly detection, natural language summaries.
 * AI is optional, explainable, and never silently changes data.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AIInsightRequest, AIInsightResponse } from '@/types'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? ''
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null

const MODEL = 'gemini-1.5-flash'

function buildContext(req: AIInsightRequest, context?: Record<string, unknown>): string {
  const parts: string[] = [
    `Project ID: ${req.projectId}`,
    `Prompt type: ${req.prompt}`,
  ]
  if (req.customPrompt) parts.push(`Custom: ${req.customPrompt}`)
  if (context && Object.keys(context).length) {
    parts.push('Data context: ' + JSON.stringify(context, null, 2))
  }
  return parts.join('\n')
}

function promptForType(req: AIInsightRequest): string {
  switch (req.prompt) {
    case 'health':
      return 'Explain this project’s financial health in 2–4 sentences. Be clear and actionable. Do not suggest changing any numbers.'
    case 'forecast_risk':
      return 'Assess forecast completion risk in 2–4 sentences. Mention burn rate and remaining budget if relevant. Do not suggest changing any data.'
    case 'monthly_summary':
      return 'Summarize monthly spending in 2–4 sentences. Keep it factual. Do not suggest changing any data.'
    case 'custom':
      return (req.customPrompt ?? 'Summarize the provided project context.') + ' Do not suggest changing any data.'
    default:
      return 'Provide a brief, actionable summary of the project context. Do not suggest changing any data.'
  }
}

export async function getAIInsight(
  req: AIInsightRequest,
  context?: Record<string, unknown>
): Promise<AIInsightResponse> {
  if (!genAI) {
    return {
      summary: 'AI insights are disabled. Set VITE_GEMINI_API_KEY to enable.',
      explainable: 'No API key configured.',
    }
  }

  const contextStr = buildContext(req, context)
  const instruction = promptForType(req)

  const model = genAI.getGenerativeModel({ model: MODEL })
  const result = await model.generateContent(
    `You are a project budgeting assistant. ${instruction}\n\n${contextStr}`
  )
  const text = result.response.text()

  return {
    summary: text.trim(),
    explainable: 'This insight was generated from the project data you provided. No data was modified.',
    suggestedActions: [],
  }
}

export async function getForecastSuggestion(
  projectId: string,
  costToDate: number,
  remainingBudget: number,
  burnRate: number
): Promise<string> {
  if (!genAI) return 'Enable Gemini API to get AI forecast suggestions.'

  const model = genAI.getGenerativeModel({ model: MODEL })
  const result = await model.generateContent(
    `As a PM budgeting assistant, in 1–3 sentences suggest how to interpret these metrics. Do not change any numbers. Project: ${projectId}. Cost to date: ${costToDate}. Remaining budget: ${remainingBudget}. Burn rate: ${burnRate}.`
  )
  return result.response.text().trim()
}
