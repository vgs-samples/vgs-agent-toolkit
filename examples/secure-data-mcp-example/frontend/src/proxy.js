const { createProxyMiddleware } = require('http-proxy-middleware');

async function createProxy(page) {
    // Set up proxy configuration
    await page.setRequestInterception(true);
    
    page.on('request', request => {
        // Allow all requests for now
        request.continue();
    });
}

module.exports = { createProxy }; 