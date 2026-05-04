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
        const encryptedData = localStorage.getItem('DE-checkoutData');
        
        if (!encryptedData) {
            redirectToPolicy('No checkout data found');
            return;
        }
        
        const decrypted = CryptoJS.AES.decrypt(
            decodeURIComponent(encryptedData), 
            CONFIG.SECRET_KEY
        );
        
        const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
        
        if (!decryptedText) {
            localStorage.removeItem('DE-checkoutData');
            redirectToPolicy('Invalid checkout data');
            return;
        }
        
        const orderData = JSON.parse(decryptedText);
        
        if (!validateOrderData(orderData)) {
            localStorage.removeItem('DE-checkoutData');
            redirectToPolicy('Malformed checkout data');
            return;
        }
        
        if (isExpired(orderData.timestamp)) {
            localStorage.removeItem('DE-checkoutData');
            showError('This checkout link has expired (valid for 5 minutes). Please request a new link from DemiEssence.');
            return;
        }
        
        displayCheckout(orderData);
        
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
           data.items && 
           Array.isArray(data.items) &&
           data.items.length > 0 &&
           data.currency &&
           data.shipping !== undefined &&
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
    const currency = orderData.currency;
    const symbol = getCurrencySymbol(currency);
    
    // Calculate totals
    let itemsTotal = 0;
    orderData.items.forEach(item => {
        itemsTotal += item.price * item.quantity;
    });
    
    const shipping = orderData.shipping;
    const total = itemsTotal + shipping;
    
    // Populate order summary
    document.getElementById('orderId').textContent = orderData.orderId;
    document.getElementById('customerName').textContent = orderData.customerName;
    document.getElementById('country').textContent = orderData.country;
    document.getElementById('shippingCost').textContent = `${symbol}${shipping.toFixed(2)}`;
    document.getElementById('totalAmount').textContent = `${symbol}${total.toFixed(2)}`;
    
    // Render items dynamically
    renderItems(orderData.items, symbol);
    
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

function renderItems(items, symbol) {
    const container = document.querySelector('.product-details');
    container.innerHTML = ''; // Clear existing content
    
    items.forEach((item, index) => {
        const subtotal = item.price * item.quantity;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'product-item';
        
        let itemDescription = `${item.style} | Size ${item.size}`;
        if (item.customizations) {
            itemDescription += ` | ${item.customizations}`;
        }
        
        itemElement.innerHTML = `
            <div class="product-info">
                <h3>Item ${index + 1}: ${item.style}</h3>
                <p>${itemDescription}</p>
                <p class="item-qty-price">Qty: ${item.quantity} × ${symbol}${item.price.toFixed(2)}</p>
            </div>
            <div class="product-price">${symbol}${subtotal.toFixed(2)}</div>
        `;
        
        container.appendChild(itemElement);
    });
}

function displayPaymentDetails(currency, total) {
    if (currency === 'NGN') {
        document.getElementById('ngnPayment').classList.remove('hidden');
        document.getElementById('intlPayment').classList.add('hidden');
        document.getElementById('amountNGN').textContent = `₦${total.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
        document.getElementById('ngnPayment').classList.add('hidden');
        document.getElementById('intlPayment').classList.remove('hidden');
        
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

function getCurrencySymbol(currency) {
    const symbols = {
        'NGN': '₦',
        'USD': '$',
        'GBP': '£',
        'EUR': '€'
    };
    return symbols[currency] || currency;
}

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