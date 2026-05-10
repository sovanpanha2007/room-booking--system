const { PrismaClient } = require('@prisma/client');

// Create a new instance of PrismaClient for database Connection to share across teh entire app
const prisma = new PrismaClient();
module.exports = prisma;