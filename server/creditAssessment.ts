import OpenAI from "openai";
import type { CreditAssessment, Account, Budget, Transaction } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface CreditImprovementPlan {
  overallAnalysis: string;
  currentScoreAnalysis: string;
  timeToGoal: string;
  prioritizedActions: Array<{
    action: string;
    impact: "High" | "Medium" | "Low";
    timeframe: string;
    description: string;
  }>;
  monthlyTasks: Array<{
    month: number;
    tasks: string[];
    expectedProgress: string;
  }>;
  tips: string[];
  warnings: string[];
}

export async function generateCreditImprovementPlan(
  assessment: CreditAssessment,
  accounts: Account[],
  budgets: Budget[],
  transactions: Transaction[]
): Promise<CreditImprovementPlan> {
  try {
    // Calculate financial context
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const monthlyBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
    const recentSpending = transactions
      .filter(t => new Date(t.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const creditUtilization = assessment.totalCreditBalance > 0 
      ? (assessment.totalCreditBalance / assessment.totalCreditLimit) * 100 
      : 0;

    const prompt = `You are Money Mind, an expert credit advisor. Analyze this user's complete financial profile and create a detailed, actionable credit improvement plan.

USER PROFILE:
- Current Credit Score: ${assessment.currentScore}
- Goal Credit Score: ${assessment.goalScore}
- Payment History: ${assessment.paymentHistory}
- Credit Utilization: ${creditUtilization.toFixed(1)}% (Balance: $${assessment.totalCreditBalance}, Limit: $${assessment.totalCreditLimit})
- Credit History Length: ${assessment.creditHistoryLength} months
- Credit Mix: ${assessment.creditMix}
- Hard Inquiries (12mo): ${assessment.newCreditInquiries}
- Monthly Income: $${assessment.monthlyIncome}
- Collections: ${assessment.hasCollections ? 'Yes' : 'No'}
- Bankruptcy: ${assessment.hasBankruptcy ? 'Yes' : 'No'}
- Foreclosure: ${assessment.hasForeclosure ? 'Yes' : 'No'}

FINANCIAL CONTEXT:
- Total Bank Balance: $${totalBalance.toFixed(2)}
- Monthly Budget: $${monthlyBudget.toFixed(2)}
- Recent 30-day Spending: $${recentSpending.toFixed(2)}
- Connected Accounts: ${accounts.length}

Create a comprehensive improvement plan in JSON format with these sections:
1. Overall analysis of their credit situation
2. Current score analysis (what's helping/hurting)
3. Realistic timeline to reach goal score
4. 5-7 prioritized actions (High/Medium/Low impact)
5. Monthly tasks for next 6 months with expected progress
6. Specific tips based on their profile
7. Important warnings or cautions

Be specific, actionable, and consider their complete financial picture. Reference their actual numbers.

Respond with ONLY valid JSON in this format:
{
  "overallAnalysis": "string",
  "currentScoreAnalysis": "string", 
  "timeToGoal": "string",
  "prioritizedActions": [
    {
      "action": "string",
      "impact": "High|Medium|Low",
      "timeframe": "string",
      "description": "string"
    }
  ],
  "monthlyTasks": [
    {
      "month": 1,
      "tasks": ["string"],
      "expectedProgress": "string"
    }
  ],
  "tips": ["string"],
  "warnings": ["string"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are Money Mind, an expert credit advisor. Always respond with valid JSON only. Be specific and actionable in your recommendations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000
    });

    const planContent = response.choices[0].message.content;
    if (!planContent) {
      throw new Error("No response from OpenAI");
    }

    return JSON.parse(planContent) as CreditImprovementPlan;

  } catch (error: any) {
    console.error('Error generating credit improvement plan:', error);
    throw new Error(`Failed to generate credit plan: ${error.message}`);
  }
}

export function calculateCreditScoreFactors(assessment: CreditAssessment) {
  const factors = [];
  
  // Payment History (35%)
  let paymentScore = 0;
  switch (assessment.paymentHistory.toLowerCase()) {
    case 'excellent': paymentScore = 35; break;
    case 'good': paymentScore = 30; break;
    case 'fair': paymentScore = 20; break;
    case 'poor': paymentScore = 10; break;
  }
  
  // Credit Utilization (30%)
  const utilization = (assessment.totalCreditBalance / assessment.totalCreditLimit) * 100;
  let utilizationScore = 30;
  if (utilization > 30) utilizationScore = 15;
  else if (utilization > 10) utilizationScore = 25;
  
  // Credit History Length (15%)
  let historyScore = Math.min(15, (assessment.creditHistoryLength / 120) * 15);
  
  // Credit Mix (10%)
  let mixScore = 0;
  switch (assessment.creditMix.toLowerCase()) {
    case 'excellent': mixScore = 10; break;
    case 'good': mixScore = 8; break;
    case 'limited': mixScore = 5; break;
    case 'poor': mixScore = 2; break;
  }
  
  // New Credit (10%)
  let inquiryScore = Math.max(0, 10 - (assessment.newCreditInquiries * 2));
  
  // Derogatory marks
  let derogScore = 0;
  if (assessment.hasCollections) derogScore -= 50;
  if (assessment.hasBankruptcy) derogScore -= 100;
  if (assessment.hasForeclosure) derogScore -= 80;
  
  const estimatedScore = Math.max(300, Math.min(850, 
    paymentScore + utilizationScore + historyScore + mixScore + inquiryScore + derogScore + 500
  ));

  return {
    estimatedScore,
    factors: [
      { name: "Payment History", impact: paymentScore, maxImpact: 35, percentage: 35 },
      { name: "Credit Utilization", impact: utilizationScore, maxImpact: 30, percentage: 30 },
      { name: "Credit History Length", impact: historyScore, maxImpact: 15, percentage: 15 },
      { name: "Credit Mix", impact: mixScore, maxImpact: 10, percentage: 10 },
      { name: "New Credit Inquiries", impact: inquiryScore, maxImpact: 10, percentage: 10 },
    ],
    derogatory: {
      collections: assessment.hasCollections,
      bankruptcy: assessment.hasBankruptcy,
      foreclosure: assessment.hasForeclosure,
      totalImpact: derogScore
    }
  };
}