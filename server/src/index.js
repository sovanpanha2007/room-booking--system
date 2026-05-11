const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth.routes');
const roomRoutes = require('./routes/room.routes');
//allow you app to understand .env variables
dotenv.config();

const app = express();
//allow different orgins and block requests from other domains 
//convert json to js object (express.json)
app.use(cors());
app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(process.env.PORT || 5000, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});