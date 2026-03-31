const bcrypt = require('bcryptjs');

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const verifyPassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

const generateToken = () => {
  return require('crypto').randomBytes(32).toString('hex');
};

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken
};