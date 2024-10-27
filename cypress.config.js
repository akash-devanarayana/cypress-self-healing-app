const { defineConfig } = require('cypress')

module.exports = defineConfig({
    e2e: {
        baseUrl: 'https://example.cypress.io',
        supportFile: 'cypress/support/e2e.js',
        specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
        viewportWidth: 1980,
        viewportHeight: 1080,
        video: false,
        screenshotOnRunFailure: true,
        // Custom configuration for our healing framework
        env: {
            healingConfig: {
                retryAttempts: 3,
                healingStrategies: ['attribute', 'nearby', 'visual'],
                screenshotOnFail: true,
                storageLocation: 'cypress/healing-data',
                toleranceLevel: 0.8
            }
        }
    },
})