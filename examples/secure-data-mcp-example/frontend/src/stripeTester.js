const puppeteer = require('puppeteer');
const { createProxy } = require('./proxy');
const { addStealth } = require('./stealth');
const { solveRecaptcha } = require('./recaptcha');
const config = require('../config/config');
const tunnel = require('tunnel');
const fs = require('fs');
const request = require('request');

class StripeTester {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async initialize() {
        // Build proxy URL without credentials
        let proxyUrl = `http://${config.proxyHost}:${config.proxyPort}`;
        console.log('Proxy URL:', proxyUrl);

        this.browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920x1080',
                '--disable-web-security',
                '--ignore-certificate-errors', // Allow untrusted proxy certs
                `--proxy-server=${proxyUrl}`
            ],
        });

        this.page = await this.browser.newPage();
        await addStealth(this.page);

        // Authenticate if credentials are present
        if (config.proxyAuth) {
            const [username, password] = config.proxyAuth.split(':');
            await this.page.authenticate({ username, password });
        }

        // No authentication for now
        // Log JavaScript errors
        this.page.on('pageerror', error => {
            console.error('JavaScript error on the page:', error);
        });

        // Log console errors
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.error('Console error:', msg.text());
                // Log the full URL of the 404 resource
                if (msg.text().includes('404')) {
                    console.error('404 URL:', msg.location().url);
                }
            }
        });
    }

    async navigateToPaymentPage() {
        await this.page.goto(`${config.formUrl}/payment`, {
            waitUntil: 'networkidle0',
        });
        // Take screenshot after navigation
        await this.page.screenshot({ path: 'screenshot1.png' });
    }

    async fillPaymentDetails() {
        // Wait for Stripe Elements to load
        await this.page.waitForSelector('#payment-element');
        
        // Wait for all Stripe iframes to be present
        await this.page.waitForSelector('iframe[name*="__privateStripeFrame"]');
        
        // Get all Stripe frames
        const frames = await this.page.frames();
        const stripeFrames = frames.filter(frame => frame.name().includes('__privateStripeFrame'));
        
        if (!stripeFrames.length) {
            throw new Error('Stripe iframes not found');
        }

        // Map of input names to values
        const fieldValues = {
            number: '4111114805321111', // '4242424242424242', // '4111114805321111',
            expiry: '1234',
            cvc: '161',
            postalCode: '12345',
        };

        // For each frame, try to fill the appropriate field
        for (const frame of stripeFrames) {
            // Log all input names in this frame
            const inputNames = await frame.evaluate(() => {
                const inputs = Array.from(document.querySelectorAll('input'));
                return inputs.map(input => input.name);
            });
            console.log(`Input names in frame ${frame.name()}:`, inputNames);

            // Only proceed if this frame has the expected input names
            if (inputNames.includes('number') && inputNames.includes('expiry') && inputNames.includes('cvc') && inputNames.includes('postalCode')) {
                for (const [name, value] of Object.entries(fieldValues)) {
                    try {
                        const input = await frame.$(`input[name="${name}"]`);
                        if (input) {
                            await frame.type(`input[name="${name}"]`, value);
                            // Log the value after filling
                            const filledValue = await frame.evaluate((el) => el.value, input);
                            console.log(`Field ${name} filled with value: ${filledValue}`);
                        }
                    } catch (e) {
                        // Ignore if not found in this frame
                    }
                }
            }
        }

        // Wait a moment for the form to validate
        await new Promise(res => setTimeout(res, 1000));
        // Take screenshot after filling fields
        await this.page.screenshot({ path: 'screenshot2.png' });
    }

    async handleSubmission() {
        if (!this.page) throw new Error('Page not initialized');
        console.log('About to click submit button...');
        await this.page.click('#submit');
        // Add inspection for error messages in the DOM
        await this.inspectDOMForErrors();
        await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
        await this.page.screenshot({ path: 'screenshot3.png' });
        // Get any responses that came after submit
        const responses = await this.page.evaluate(() => {
            const responses = performance.getEntriesByType('resource')
                .filter(entry => entry.startTime > window.submitClickTime)
                .map(entry => ({
                    url: entry.name,
                    duration: entry.duration,
                    type: entry.initiatorType
                }));
            return responses;
        });
        
        console.log('Network responses after submit:', responses);

        console.log('Submit button clicked, waiting for success message...');
        await this.page.waitForSelector('.message.success', { timeout: 30000 });
        console.log('Success message found.');
        return {
            success: true,
            message: 'Payment submitted successfully'
        };
    }

    async inspectDOMForErrors() {
        if (!this.page) throw new Error('Page not initialized');
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
        } else {
            console.log('No error messages found in the DOM.');
        }
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async run() {
        try {
            await this.initialize();
            await this.navigateToPaymentPage();
            await this.fillPaymentDetails();
            const result = await this.handleSubmission();
            console.log('Test completed:', result);
        } catch (error) {
            console.error('Test failed:', error);
        } finally {
            await this.cleanup();
        }
    }
}

// Export the class
module.exports = StripeTester;

// If this file is run directly
if (require.main === module) {
    const tester = new StripeTester();
    tester.run();
} 