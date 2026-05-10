// Controller : to handle HTTP requests and respones(extract and respond with data)

const authService = require('../services/auth.service');

async function register(req, res) {
    const { name, email, password } = req.body;
    try {
        const result = await authService.register(name, email, password);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function login(req, res) {
    const { email, password } = req.body;
    try {
        const result = await authService.login(email, password);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

module.exports = { register, login };