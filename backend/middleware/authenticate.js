const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Obține token din header
  const authHeader = req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Nu există token, autorizare refuzată' });
  }
  
  const token = authHeader.substring(7);
  
  // Verifică token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalid' });
  }
};