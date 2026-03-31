const tenantIsolation = (req, res, next) => {
  if (!req.tenantId) {
    return res.status(400).json({ error: 'Tenant context required' });
  }
  next();
};

module.exports = tenantIsolation;