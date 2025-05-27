import puppeteer from 'puppeteer';
// --- Helper functions ---
export async function addStealth(page) {
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
}
export async function createProxy(page) {
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        request.continue();
    });
}
export async function solveRecaptcha(page) {
    // For now, we'll just return true as we're not handling recaptcha
    return true;
}
export class StripeTester {
    browser = null;
    page = null;
    paymentDetails = null;
    async initialize(paymentDetails) {
        this.paymentDetails = paymentDetails;
        // Proxy setup matching frontend/config/config.js
        const proxyAuth = process.env.HTTPS_PROXY_USERNAME && process.env.HTTPS_PROXY_PASSWORD
            ? `${process.env.HTTPS_PROXY_USERNAME}:${process.env.HTTPS_PROXY_PASSWORD}`
            : process.env.PROXY_AUTH;
        const proxyHost = process.env.TENANT_ID && process.env.SANDBOX_URL
            ? `${process.env.TENANT_ID}.${process.env.SANDBOX_URL}`
            : process.env.PROXY_HOST;
        const proxyPort = process.env.PROXY_PORT || process.env.TLS_PROXY_PORT;
        let proxyArg = [];
        if (proxyHost && proxyPort) {
            const proxyUrl = `http://${proxyHost}:${proxyPort}`;
            console.log('Proxy URL:', proxyUrl);
            proxyArg = [`--proxy-server=${proxyUrl}`];
        }
        this.browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920x1080',
                '--disable-web-security',
                '--ignore-certificate-errors',
                ...proxyArg,
            ],
        });
        this.page = await this.browser.newPage();
        await this.addStealth(this.page);
        // Authenticate if credentials are present
        if (proxyAuth) {
            const [username, password] = proxyAuth.split(':');
            await this.page.authenticate({ username, password });
        }
        await this.createProxy(this.page);
        this.page.on('pageerror', (error) => {
            console.error('JavaScript error on the page:', error);
        });
        this.page.on('console', (msg) => {
            if (msg.type() === 'error') {
                console.error('Console error:', msg.text());
                if (msg.text().includes('404')) {
                    console.error('404 URL:', msg.location()?.url);
                }
            }
        });
    }
    async navigateToPaymentPage() {
        if (!this.page)
            throw new Error('Page not initialized');
        await this.page.goto('https://vgs.ngrok.app/payment', {
            waitUntil: 'networkidle0',
        });
        await this.page.screenshot({ path: 'screenshot1.png' });
    }
    async fillPaymentDetails() {
        if (!this.page || !this.paymentDetails)
            throw new Error('Page or payment details not initialized');
        await this.page.waitForSelector('#payment-element');
        await this.page.waitForSelector('iframe[name*="__privateStripeFrame"]');
        const frames = this.page.frames();
        const stripeFrames = frames.filter((frame) => frame.name().includes('__privateStripeFrame'));
        if (!stripeFrames.length) {
            throw new Error('Stripe iframes not found');
        }
        const fieldValues = {
            number: this.paymentDetails.pan,
            expiry: this.paymentDetails.expiration.replace('/', ''),
            cvc: this.paymentDetails.cvc,
            postalCode: this.paymentDetails.postalCode,
        };
        for (const frame of stripeFrames) {
            const inputNames = await frame.evaluate(() => {
                const inputs = Array.from(document.querySelectorAll('input'));
                return inputs.map(input => input.name);
            });
            console.log(`Input names in frame ${frame.name()}:`, inputNames);
            if (inputNames.includes('number') && inputNames.includes('expiry') && inputNames.includes('cvc') && inputNames.includes('postalCode')) {
                for (const [name, value] of Object.entries(fieldValues)) {
                    try {
                        const input = await frame.$(`input[name="${name}"]`);
                        if (input) {
                            await frame.type(`input[name="${name}"]`, value);
                            const filledValue = await frame.evaluate((el) => el.value, input);
                            console.log(`Field ${name} filled with value: ${filledValue}`);
                        }
                    }
                    catch (e) {
                        // Ignore if not found in this frame
                    }
                }
            }
        }
        await new Promise(res => setTimeout(res, 1000));
        await this.page.screenshot({ path: 'screenshot2.png' });
    }
    async handleSubmission() {
        if (!this.page)
            throw new Error('Page not initialized');
        console.log('About to click submit button...');
        await this.page.click('#submit');
        await this.inspectDOMForErrors();
        await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
        await this.page.screenshot({ path: 'screenshot3.png' });
        console.log('Submit button clicked, waiting for success message...');
        await this.page.waitForSelector('.message.success', { timeout: 30000 });
        console.log('Success message found.');
        // Capture details from the payment complete page
        const pageDetails = await this.page.evaluate(() => {
            const message = document.querySelector('.message.success')?.textContent || '';
            const title = document.title;
            const bodyText = document.body?.innerText || '';
            return { message, title, bodyText };
        });
        return {
            success: true,
            message: 'Payment submitted successfully',
            details: pageDetails
        };
    }
    async inspectDOMForErrors() {
        if (!this.page)
            throw new Error('Page not initialized');
        console.log('Inspecting DOM for error messages...');
        const formHTML = await this.page.evaluate(() => {
            const form = document.querySelector('#payment-form');
            return form ? form.innerHTML : 'Form not found';
        });
        console.log('Payment form innerHTML:', formHTML);
        const errorMessages = await this.page.evaluate(() => {
            const errorElements = document.querySelectorAll('.error-message, .error, [role="alert"]');
            return Array.from(errorElements).map(el => el.textContent);
        });
        if (errorMessages.length > 0) {
            console.log('Found error messages:', errorMessages);
        }
        else {
            console.log('No error messages found in the DOM.');
        }
    }
    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }
    async addStealth(page) {
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    }
    async createProxy(page) {
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            request.continue();
        });
    }
}
