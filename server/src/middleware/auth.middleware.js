const jwt = require('jsonwebtoken');

function protect(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const token = authHeader.split(" ")[1]; // After Bearer token
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
}
function authorizeAdmin(req, res, next) {
    if (req.user.role == 'admin') {
        next();
    } else {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
}

module.exports = { protect, authorizeAdmin };