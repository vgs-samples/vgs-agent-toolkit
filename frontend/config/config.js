require('dotenv').config();

const proxyAuth = process.env.HTTPS_PROXY_USERNAME && process.env.HTTPS_PROXY_PASSWORD
    ? `${process.env.HTTPS_PROXY_USERNAME}:${process.env.HTTPS_PROXY_PASSWORD}`
    : process.env.PROXY_AUTH;

const proxyHost = process.env.TENANT_ID && process.env.SANDBOX_URL
    ? `${process.env.TENANT_ID}.${process.env.SANDBOX_URL}`
    : process.env.PROXY_HOST;

const config = {
    development: {
        formUrl: process.env.FORM_URL || 'http://localhost:5000',
        headless: process.env.HEADLESS ? process.env.HEADLESS === 'true' : false,
        recordVideo: process.env.RECORD_VIDEO === 'true',
        recaptchaToken: process.env.RECAPTCHA_TOKEN || '72fd7ebda90588d56abb09f840d21f28',
        proxyHost: process.env.PROXY_HOST,
        proxyPort: process.env.PROXY_PORT || process.env.TLS_PROXY_PORT,
        proxyAuth : process.env.HTTPS_PROXY_USERNAME + ':' + process.env.HTTPS_PROXY_PASSWORD,
        certPath: process.env.CERT_PATH || './config/sandbox-cert.pem',
        testData: {
            username: process.env.TEST_USERNAME || 'tok_sandbox_8rVSERS1WKtC2H3a2mJABY',
            email: process.env.TEST_EMAIL || 'dev@verygoodsecurity.com',
            password: process.env.TEST_PASSWORD || 'tok_sandbox_t3TqVDEgkkhofo8BA6xraz',
            agreement: true
        }
    },
    production: {
        formUrl: process.env.FORM_URL,
        headless: process.env.HEADLESS ? process.env.HEADLESS === 'true' : true,
        recordVideo: process.env.RECORD_VIDEO === 'true',
        recaptchaToken: process.env.RECAPTCHA_TOKEN,
        proxyHost,
        proxyPort: process.env.PROXY_PORT,
        proxyAuth,
        certPath: process.env.CERT_PATH,
        testData: {
            username: process.env.TEST_USERNAME,
            email: process.env.TEST_EMAIL,
            password: process.env.TEST_PASSWORD,
            agreement: true
        }
    }
};

module.exports = config[process.env.NODE_ENV || 'development']; 