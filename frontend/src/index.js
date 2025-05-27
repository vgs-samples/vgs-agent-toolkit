const FormTester = require('./formTester');
const config = require('../config/config');

async function main() {
    try {
        console.log('Headless mode:', config.headless);
        console.log('Record video:', config.recordVideo);
        // const tester = new FormTester(config);
        // const result = await tester.submitForm(config.testData);
        // console.log('Form submission result:', result);
        while (true) {
        }
    } catch (error) {
        console.error('Error running form test:', error);
        process.exit(1);
    }
}

main(); 