export function getLatestPurchase(customer) {
  const purchases = Array.isArray(customer?.purchases) ? customer.purchases : [];
  if (!purchases.length) return null;

  return [...purchases].sort((a, b) => new Date(b?.date || 0) - new Date(a?.date || 0))[0];
}
