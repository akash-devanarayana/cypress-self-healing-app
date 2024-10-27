export const HEALING_CONFIG = Cypress.env('healingConfig') || {
    retryAttempts: 3,
    healingStrategies: ['attribute', 'nearby', 'visual'],
    screenshotOnFail: true,
    storageLocation: 'cypress/healing-data',
    toleranceLevel: 0.8
};

export const createElementSnapshot = ($element, selector) => {
    const rect = $element[0].getBoundingClientRect();

    return {
        selector,
        tagName: $element.prop('tagName').toLowerCase(),
        text: $element.text().trim(),
        attributes: {
            id: $element.attr('id'),
            class: $element.attr('class'),
            name: $element.attr('name'),
            type: $element.attr('type'),
            href: $element.attr('href'),
        },
        position: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
        },
        timestamp: new Date().toISOString(),
    };
};