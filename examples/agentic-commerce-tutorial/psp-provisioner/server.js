// PSP Token Provisioning Server
// `npm start` to run

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const tunnel = require('tunnel');
const qs = require('qs');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3031;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // serve frontend

// VGS Configuration
const VAULT_ID = process.env.VGS_VAULT_ID || 'tntonm7yolo';
const VGS_USERNAME = process.env.VGS_USERNAME;
const VGS_PASSWORD = process.env.VGS_PASSWORD;
const ENVIRONMENT = process.env.VGS_ENVIRONMENT || 'sandbox';

// PSP Configuration
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;

// VGS Outbound Proxy Configuration
function getProxyAgent() {
    const vgs_outbound_url = `${VAULT_ID}.${ENVIRONMENT}.verygoodproxy.com`;
    console.log(`Sending request through outbound Route: ${vgs_outbound_url}`);
    return tunnel.httpsOverHttps({
        proxy: {
            servername: vgs_outbound_url,
            host: vgs_outbound_url,
            port: 8443,
            proxyAuth: `${VGS_USERNAME}:${VGS_PASSWORD}`
        },
    });
}

// Create Stripe Payment Method using VGS Outbound Proxy
async function createStripeToken(cardObject) {
    let agent = getProxyAgent();
    let buff = Buffer.from(STRIPE_KEY + ":");
    let base64Auth = buff.toString('base64');

    const instance = axios.create({
        baseURL: 'https://api.stripe.com',
        headers: {
            'authorization': `Basic ${base64Auth}`
        },
        httpsAgent: agent,
    });

    try {
        let pm_response = await instance.post('/v1/payment_methods', qs.stringify({
            type: 'card',
            card: {
                number: cardObject.attributes.pan_alias,
                cvc: cardObject.attributes.cvc_alias,
                exp_month: cardObject.attributes.exp_month,
                exp_year: cardObject.attributes.exp_year,
            }
        }));

        return {
            success: true,
            psp_token: pm_response.data.id,
            payment_method: pm_response.data
        };
    } catch (error) {
        console.error('Stripe API Error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data || error.message
        };
    }
}

// Endpoint to provision PSP token
app.post('/provision-psp-token', async (req, res) => {
    try {
        const {
            cardObject,
            pspProvider = 'stripe'
        } = req.body;

        if (!cardObject) {
            return res.status(400).json({
                success: false,
                error: 'Card object is required'
            });
        }

        console.log('Provisioning PSP token for card:', cardObject.data.id);

        let result;
        switch (pspProvider.toLowerCase()) {
            case 'stripe':
                result = await createStripeToken(cardObject.data);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Unsupported PSP provider'
                });
        }

        if (result.success) {
            console.log('PSP token provisioned successfully:', result.psp_token);
            res.json({
                success: true,
                psp_token: result.psp_token,
                payment_method: result.payment_method,
                card_id: cardObject.data.id
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }

    } catch (error) {
        console.error('Error provisioning PSP token:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        vault_id: VAULT_ID,
        environment: ENVIRONMENT,
        psp_configured: !!STRIPE_KEY
    });
});

// Get VGS configuration info
app.get('/config', (req, res) => {
    res.json({
        vault_id: VAULT_ID,
        environment: ENVIRONMENT,
        outbound_url: `${VAULT_ID}.${ENVIRONMENT}.verygoodproxy.com:8443`,
        psp_configured: !!STRIPE_KEY
    });
});

app.listen(PORT, () => {
    console.log(`PSP Provisioning Server running at http://localhost:${PORT}`);
    console.log(`Vault ID: ${VAULT_ID}`);
    console.log(`Environment: ${ENVIRONMENT}`);
    console.log(`Outbound URL: ${VAULT_ID}.${ENVIRONMENT}.verygoodproxy.com:8443`);
});