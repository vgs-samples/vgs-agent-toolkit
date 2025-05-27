const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');
const tunnel = require('tunnel');
const fs = require('fs');
const request = require('request');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');

class FormTester {
    constructor(config) {
        this.config = config;
        this.setupPuppeteer();
    }

    setupPuppeteer() {
        puppeteer.use(StealthPlugin());
        puppeteer.use(RecaptchaPlugin({
            provider: {
                id: '2captcha',
                token: this.config.recaptchaToken
            },
            visualFeedback: true
        }));
    }
 
    async createBrowser() {
        return await puppeteer.launch({
            slowMo: 20,
            args: [
                '--enable-features=NetworkService',
                '--disable-setuid-sandbox',
                '--no-sandbox'
            ],
            headless: this.config.headless
        });
    }

    createTunnelAgent() {
        return tunnel.httpsOverHttp({
            ca: [fs.readFileSync(this.config.certPath)],
            proxy: {
                host: this.config.proxyHost,
                port: this.config.proxyPort,
                proxyAuth: this.config.proxyAuth
            }
        });
    }

    async submitForm(formData) {
        const browser = await this.createBrowser();
        let recorder = null;
        try {
            const page = await browser.newPage();
            await this.setupRequestInterception(page);
            
            if (this.config.recordVideo) {
                recorder = new PuppeteerScreenRecorder(page);
                await recorder.start('./form-test-video.mp4');
            }
            await page.goto(this.config.formUrl);

            // Print all form elements
            const formElements = await page.evaluate(() => {
                const elements = document.querySelectorAll('input, select, textarea');
                return Array.from(elements).map(el => ({
                    type: el.type || el.tagName.toLowerCase(),
                    name: el.name,
                    id: el.id,
                    value: el.value,
                    placeholder: el.placeholder
                }));
            });
            console.log('Form elements found:', JSON.stringify(formElements, null, 2));

            await this.fillForm(page, formData);
            
            const result = await this.handleSubmission(page);
            return result;
        } catch (error) {
            console.error('Form submission failed:', error);
            throw error;
        } finally {
            if (recorder) {
                await recorder.stop();
            }
            await browser.close();
        }
    }

    async setupRequestInterception(page) {
        await page.setRequestInterception(true);
        const agent = this.createTunnelAgent();

        page.on('request', interceptedRequest => {
            const options = {
                uri: interceptedRequest.url(),
                method: interceptedRequest.method(),
                headers: interceptedRequest.headers(),
                agent: agent,
                body: interceptedRequest.postData()
            };

            request(options, (err, resp, body) => {
                if (err) {
                    console.error('Request failed:', err);
                    interceptedRequest.abort();
                    return;
                }
                interceptedRequest.respond({
                    status: resp.statusCode,
                    contentType: resp.headers['content-type'],
                    headers: resp.headers,
                    body: body
                });
            });
        });
    }

    async fillForm(page, formData) {
        await page.waitForSelector('input[name=username]');
        await page.type('input[name=username]', formData.username);
        await page.type('input[name=email]', formData.email);
        await page.type('input[name=password]', formData.password);
        
        if (formData.agreement) {
            await page.click('#agreement');
        }
        
        await page.solveRecaptchas();
    }

    async handleSubmission(page) {
        await page.click('#register');
        await page.waitForNavigation();
        await page.waitForTimeout(2000);
        
        return {
            success: true,
            message: 'Form submitted successfully'
        };
    }
}

module.exports = FormTester; 