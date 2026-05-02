// =============================================
// DemiEssence Checkout Viewer
// =============================================

const CONFIG = {
    SECRET_KEY: 'DemiEssence2026SecretKey!@#',
    LINK_EXPIRY_MINUTES: 5
};

// =============================================
// Initialize
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    loadAndDecryptOrder();
});

// =============================================
// Main Logic
// =============================================

function loadAndDecryptOrder() {
    try {
        // Read encrypted data from localStorage
        const encryptedData = localStorage.getItem('DE-checkoutData');
        
        if (!encryptedData) {
            // No data found - redirect back to policy
            redirectToPolicy('No checkout data found');
            return;
        }
        
        // Decrypt the data
        const decrypted = CryptoJS.AES.decrypt(
            decodeURIComponent(encryptedData), 
            CONFIG.SECRET_KEY
        );
        
        const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
        
        if (!decryptedText) {
            // Decryption failed - clear stale data and redirect
            localStorage.removeItem('DE-checkoutData');
            redirectToPolicy('Invalid checkout data');
            return;
        }
        
        // Parse JSON
        const orderData = JSON.parse(decryptedText);
        
        // Validate order data structure
        if (!validateOrderData(orderData)) {
            localStorage.removeItem('DE-checkoutData');
            redirectToPolicy('Malformed checkout data');
            return;
        }
        
        // Check expiration (payload-based, single source of truth)
        if (isExpired(orderData.timestamp)) {
            localStorage.removeItem('DE-checkoutData');
            showError('This checkout link has expired (valid for 5 minutes). Please request a new link from DemiEssence.');
            return;
        }
        
        // Display the checkout page
        displayCheckout(orderData);
        
        // DO NOT clear localStorage here - allow page refresh
        
    } catch (error) {
        console.error('Decryption error:', error);
        localStorage.removeItem('DE-checkoutData');
        redirectToPolicy('Failed to load checkout data');
    }
}

// =============================================
// Validation
// =============================================

function validateOrderData(data) {
    return data && 
           data.orderId && 
           data.customerName && 
           data.item && 
           data.currency &&  // ← ADDED
           data.price && 
           data.shipping &&
           data.timestamp;
}

function isExpired(timestamp) {
    if (!timestamp) return true;
    
    const createdAt = new Date(timestamp);
    const now = new Date();
    const diffMinutes = (now - createdAt) / 1000 / 60;
    
    return diffMinutes > CONFIG.LINK_EXPIRY_MINUTES;
}

// =============================================
// Display Functions
// =============================================

function displayCheckout(orderData) {
    const total = orderData.price + orderData.shipping;
    const currency = orderData.currency;
    
    // Populate order summary
    document.getElementById('orderId').textContent = orderData.orderId;
    document.getElementById('customerName').textContent = orderData.customerName;
    document.getElementById('itemName').textContent = orderData.item;
    
    // Item specifications
    const specs = [];
    if (orderData.size) specs.push(`Size: ${orderData.size}`);
    if (orderData.color) specs.push(`Color: ${orderData.color}`);
    document.getElementById('itemSpecs').textContent = specs.join(' • ');
    
    // Format currency display
    const currencySymbols = {
        'NGN': '₦',
        'USD': '$',
        'GBP': '£',
        'EUR': '€'
    };
    
    const symbol = currencySymbols[currency] || currency;
    
    document.getElementById('itemPrice').textContent = `${symbol}${orderData.price.toFixed(2)}`;
    document.getElementById('country').textContent = orderData.country;
    document.getElementById('shippingCost').textContent = `${symbol}${orderData.shipping.toFixed(2)}`;
    document.getElementById('totalAmount').textContent = `${symbol}${total.toFixed(2)}`;
    
    // Display notes if present
    if (orderData.notes && orderData.notes.trim()) {
        document.getElementById('notesContent').textContent = orderData.notes;
        document.getElementById('notesSection').classList.remove('hidden');
    }
    
    // Display payment section based on currency
    displayPaymentDetails(currency, total);
    
    // Footer order ID
    document.getElementById('orderIdFooter').textContent = orderData.orderId;
    
    // Show checkout section, hide loading
    document.getElementById('loadingSection').classList.add('hidden');
    document.getElementById('checkoutSection').classList.remove('hidden');
}

function displayPaymentDetails(currency, total) {
    if (currency === 'NGN') {
        // Show Nigerian bank details
        document.getElementById('ngnPayment').classList.remove('hidden');
        document.getElementById('intlPayment').classList.add('hidden');
        document.getElementById('amountNGN').textContent = `₦${total.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
        // Show international payment details
        document.getElementById('ngnPayment').classList.add('hidden');
        document.getElementById('intlPayment').classList.remove('hidden');
        
        // Show specific currency section
        document.getElementById('usdSection').classList.add('hidden');
        document.getElementById('gbpSection').classList.add('hidden');
        document.getElementById('eurSection').classList.add('hidden');
        
        if (currency === 'USD') {
            document.getElementById('usdSection').classList.remove('hidden');
            document.getElementById('amountUSD').textContent = `$${total.toFixed(2)}`;
        } else if (currency === 'GBP') {
            document.getElementById('gbpSection').classList.remove('hidden');
            document.getElementById('amountGBP').textContent = `£${total.toFixed(2)}`;
        } else if (currency === 'EUR') {
            document.getElementById('eurSection').classList.remove('hidden');
            document.getElementById('amountEUR').textContent = `€${total.toFixed(2)}`;
        }
    }
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('loadingSection').classList.add('hidden');
    document.getElementById('errorSection').classList.remove('hidden');
}

function redirectToPolicy(reason) {
    console.warn('Redirecting to policy:', reason);
    window.location.href = 'policy.html';
}

// =============================================
// Utility Functions
// =============================================

function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
        showCopyFeedback(event.target);
    }).catch(err => {
        console.error('Copy failed:', err);
    });
}

function showCopyFeedback(element) {
    const originalHTML = element.innerHTML;
    element.innerHTML = 'Copied!';
    element.style.color = '#22c55e';
    
    setTimeout(() => {
        element.innerHTML = originalHTML;
        element.style.color = '';
    }, 1500);
}