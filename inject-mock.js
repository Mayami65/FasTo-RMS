const { ipcRenderer } = require('electron');

async function testData() {
    try {
        console.log("Mocking Sales from preload API...");
        // This is meant to be run in DevTools from the renderer.
        await window.api.processSale({
            userId: 1,
            amountGiven: 200,
            paymentMethod: 'CASH',
            status: 'COMPLETED',
            items: [
                {
                    productId: 1, // assume product id 1 exists
                    variantId: 1, // assume variant id 1 exists
                    quantity: 1,
                    price: 200,
                    discount: 0
                }
            ],
            subtotal: 200,
            discount: 0,
            total: 200
        });

        console.log("Mock Sale inserted.");
    } catch (e) {
        console.error("Error creating test sale:", e);
    }
}
