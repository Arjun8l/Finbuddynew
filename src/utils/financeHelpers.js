// Calculate recommended budget for each category using 50/30/20 rule
export function calculateRecommended(income, categoryName) {
  const needs   = income * 0.50;
  const wants   = income * 0.30;
  const savings = income * 0.20;

  const needsCategories = ['Housing', 'Food', 'Transport', 'Health'];
  const wantsCategories = ['Entertainment', 'Clothing', 'Education'];

  if (categoryName === 'Savings') return savings;
  if (needsCategories.includes(categoryName)) return needs / needsCategories.length;
  if (wantsCategories.includes(categoryName)) return wants / wantsCategories.length;
  return 0;
}

// Calculate savings rate percentage
export function getSavingsRate(totalSpent, income) {
  if (!income) return 0;
  const saved = income - totalSpent;
  return Math.round((saved / income) * 100);
}

// Determine health status label
export function getHealthStatus(savingsRate) {
  if (savingsRate >= 20) return 'Excellent';
  if (savingsRate >= 10) return 'Good';
  if (savingsRate >= 0)  return 'Caution';
  return 'Over Budget';
}