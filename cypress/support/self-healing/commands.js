// cypress/support/self-healing/commands.js

import {HEALING_CONFIG, createElementSnapshot} from './utils';

/**
 * Attempts to find an element using various healing strategies
 */
const attemptHealing = (originalSelector, elementSnapshot) => {
    let healingAttempts = 0;

    const tryStrategy = (strategy) => {
        cy.log(`Attempting healing strategy: ${strategy}`);

        switch (strategy) {
            case 'attribute':
                return attemptAttributeHealing(elementSnapshot);
            case 'nearby':
                return attemptNearbyHealing(elementSnapshot);
            case 'visual':
                return attemptVisualHealing(elementSnapshot);
            default:
                return null;
        }
    };

    const attemptNextStrategy = (strategies) => {
        if (healingAttempts >= HEALING_CONFIG.retryAttempts || strategies.length === 0) {
            cy.log(`All healing attempts failed for selector: ${originalSelector}`);
            return null;
        }

        healingAttempts++;
        const currentStrategy = strategies[0];

        return tryStrategy(currentStrategy).then((element) => {
            if (element && element.length > 0) {
                cy.log(`Successfully healed selector "${originalSelector}" using ${currentStrategy} strategy`);
                return element;
            }
            return attemptNextStrategy(strategies.slice(1));
        });
    };

    return attemptNextStrategy([...HEALING_CONFIG.healingStrategies]);
};

/**
 * Attempts to heal using element attributes
 */
const attemptAttributeHealing = (elementSnapshot) => {
    const {attributes, tagName, text} = elementSnapshot;
    const selectors = [];

    // Try ID
    if (attributes.id) {
        selectors.push(`#${CSS.escape(attributes.id)}`);
    }

    // Try name attribute
    if (attributes.name) {
        selectors.push(`[name="${CSS.escape(attributes.name)}"]`);
    }

    // Try class combinations
    if (attributes.class) {
        const classes = attributes.class.split(' ').filter(Boolean);
        if (classes.length > 0) {
            selectors.push(`.${classes.join('.')}`);
        }
    }

    // Try text content
    if (text) {
        selectors.push(`${tagName}:contains("${text}")`);
    }

    // Try combinations of attributes
    const combinedSelector = Object.entries(attributes)
        .filter(([key, value]) => value && !['id', 'class'].includes(key))
        .map(([key, value]) => `[${key}="${CSS.escape(value)}"]`)
        .join('');

    if (combinedSelector) {
        selectors.push(`${tagName}${combinedSelector}`);
    }

    // Try selectors sequentially
    const trySelectors = (selectorList) => {
        if (selectorList.length === 0) return cy.wrap(null);

        return cy.get('body').then($body => {
            const $element = $body.find(selectorList[0]);
            if ($element.length > 0) {
                return cy.wrap($element);
            }
            return trySelectors(selectorList.slice(1));
        });
    };

    return trySelectors(selectors);
};

/**
 * Attempts to heal using nearby element analysis
 */
const attemptNearbyHealing = (elementSnapshot) => {
    const {position, tagName, attributes} = elementSnapshot;
    const tolerance = 50; // pixels

    return cy.get(tagName).then($elements => {
        const nearby = $elements.filter((_, element) => {
            const rect = element.getBoundingClientRect();
            return Math.abs(rect.x - position.x) < tolerance &&
                Math.abs(rect.y - position.y) < tolerance &&
                Math.abs(rect.width - position.width) < tolerance &&
                Math.abs(rect.height - position.height) < tolerance;
        });

        if (nearby.length) {
            const mostSimilar = nearby.filter((_, element) => {
                let similarityScore = 0;
                const elementAttrs = element.attributes;

                Object.entries(attributes).forEach(([key, value]) => {
                    if (elementAttrs[key] && elementAttrs[key].value === value) {
                        similarityScore++;
                    }
                });

                return similarityScore > 0;
            });

            return cy.wrap(mostSimilar.length ? mostSimilar : nearby);
        }

        return cy.wrap(null);
    });
};

/**
 * Attempts to heal using visual comparison
 */
const attemptVisualHealing = (elementSnapshot) => {
    cy.log('Visual healing strategy - To be implemented');
    return cy.wrap(null);
};

/**
 * Main self-healing command
 */
Cypress.Commands.add('getHealing', (selector, options = {}) => {
    const getOptions = {timeout: 4000, ...options};

    return cy.get('body').then($body => {
        // First try with original selector
        const $element = $body.find(selector);

        if ($element.length > 0) {
            // Element found, store snapshot and return
            const snapshot = createElementSnapshot($element, selector);
            cy.writeFile(
                `${HEALING_CONFIG.storageLocation}/elements/${selector.replace(/[^a-z0-9]/gi, '_')}.json`,
                snapshot
            );
            return cy.wrap($element);
        }

        // Element not found, try healing
        cy.log(`Element not found with selector: ${selector}. Attempting to heal...`);

        return cy.readFile(
            `${HEALING_CONFIG.storageLocation}/elements/${selector.replace(/[^a-z0-9]/gi, '_')}.json`,
            {failOnStatusCode: false}
        ).then((elementSnapshot) => {
            if (!elementSnapshot) {
                throw new Error(`No stored data found for selector: ${selector}`);
            }

            return attemptHealing(selector, elementSnapshot).then((healedElement) => {
                if (!healedElement) {
                    throw new Error(`Failed to heal selector: ${selector}`);
                }
                return healedElement;
            });
        });
    });
});