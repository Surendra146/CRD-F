// Keep a request ID after a failed response so a retry cannot renew twice.
export function createManualSubscriptionClient(send, makeId = () => crypto.randomUUID()) {
  let pending;
  return async (tenantId, organizationId, operation, values) => {
    const fingerprint = JSON.stringify([tenantId, organizationId, operation, values]);
    if (!pending || pending.fingerprint !== fingerprint) {
      pending = { fingerprint, payload: { ...values, request_id: makeId() } };
    }
    const response = await send(tenantId, organizationId, operation, pending.payload);
    pending = undefined;
    return response;
  };
}
