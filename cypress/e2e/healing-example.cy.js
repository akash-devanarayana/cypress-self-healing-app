// cypress/e2e/healing-example.cy.js

describe('Self-Healing Tests', () => {
    beforeEach(() => {
        cy.visit('/commands/querying');
    });

    it.only('should find element by ID even if changed', () => {
        // First interaction - original selector
        cy.getHealing('#query-btn')
            .should('be.visible')
            .and('contain', 'Button');

        // Change ID
        cy.get('#query-btn').then($button => {
            $button[0].id = 'changed-btn';
        });

        // Should still find the element
        cy.getHealing('#query-btn')
            .should('be.visible')
            .and('contain', 'Button');
    });

    it('should find element by nearby content if moved', () => {
        // First interaction
        cy.getHealing('.query-button')
            .should('be.visible');

        // Move the element
        cy.get('.query-button').then($button => {
            $button[0].style.position = 'relative';
            $button[0].style.top = '20px';
        });

        // Should still find the element
        cy.getHealing('.query-button')
            .should('be.visible');
    });

    it('should find element by multiple attributes if class changes', () => {
        // First interaction
        cy.getHealing('.well')
            .first()
            .should('be.visible');

        // Change the class
        cy.get('.well').first().then($well => {
            $well[0].className = 'changed-well';
        });

        // Should still find the element
        cy.getHealing('.well')
            .should('be.visible');
    });
});