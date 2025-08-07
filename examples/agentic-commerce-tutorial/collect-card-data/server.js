// sample-agentic-app
// `npm start` to run

const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3030;

app.use(cors());
app.use(express.static('public')); // serve frontend

const CLIENT_ID = process.env.VGS_CLIENT_ID;
const CLIENT_SECRET = process.env.VGS_CLIENT_SECRET;
const TOKEN_URL = 'https://auth.verygoodsecurity.com/auth/realms/vgs/protocol/openid-connect/token';

app.get('/get-collect-token', async (req, res) => {
    try {
        const params = new URLSearchParams();
        params.append('client_id', CLIENT_ID);
        params.append('client_secret', CLIENT_SECRET);
        params.append('grant_type', 'client_credentials');

        const response = await axios.post(TOKEN_URL, params);
        res.json({
            access_token: response.data.access_token
        });
    } catch (error) {
        console.error('Error getting VGS token:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to get token'
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});