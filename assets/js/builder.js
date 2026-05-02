// =============================================
// DemiEssence Checkout Link Builder
// =============================================

// Configuration
const CONFIG = {
    VA_PASSWORD: 'demi2026admin',
    SECRET_KEY: 'DemiEssence2026SecretKey!@#',
    POLICY_URL: 'https://segunnano.github.io/checkout-system/policy.html'
};

// State
let currentCheckoutUrl = '';

// =============================================
// Authentication
// =============================================

function authenticate() {
    const password = document.getElementById('accessPassword').value;
    
    if (password === CONFIG.VA_PASSWORD) {
        document.getElementById('authSection').classList.add('hidden');
        document.getElementById('builderForm').classList.remove('hidden');
        document.getElementById('accessPassword').value = '';
    } else {
        showError('Incorrect password. Please try again.');
        document.getElementById('accessPassword').value = '';
        document.getElementById('accessPassword').focus();
    }
}

// =============================================
// Form Handling
// =============================================

// Auto-update price when item is selected
document.addEventListener('DOMContentLoaded', function() {
    const itemSelect = document.getElementById('item');
    const priceInput = document.getElementById('price');
    
    if (itemSelect) {
        itemSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            const price = selectedOption.getAttribute('data-price');
            
            if (price && price !== '0') {
                priceInput.value = price;
            } else {
                priceInput.value = '';
                priceInput.focus();
            }
        });
    }
    
    // Form submission
    const form = document.getElementById('orderForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            generateLink();
        });
    }
    
    // Enter key on password field
    const passwordField = document.getElementById('accessPassword');
    if (passwordField) {
        passwordField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                authenticate();
            }
        });
    }
});

// =============================================
// Link Generation
// =============================================


function generateLink() {
    // Collect form data
    const orderData = {
        orderId: getFieldValue('orderId'),
        customerName: getFieldValue('customerName'),
        customerEmail: getFieldValue('customerEmail'),
        item: getFieldValue('item'),
        size: getFieldValue('size'),
        color: getFieldValue('color'),
        currency: getFieldValue('currency'),
        price: parseFloat(getFieldValue('price')),
        shipping: parseFloat(getFieldValue('shipping')),
        country: getFieldValue('country'),
        notes: getFieldValue('notes'),
        timestamp: new Date().toISOString(),
        createdBy: 'VA'
    };
    
    // Validate required fields
    if (!validateOrderData(orderData)) {
        return;
    }
    
    // Encrypt data
    try {
        const jsonData = JSON.stringify(orderData);
        const encrypted = CryptoJS.AES.encrypt(jsonData, CONFIG.SECRET_KEY).toString();
        const urlSafe = encodeURIComponent(encrypted);
        
        // Build POLICY URL (not view URL)
        const checkoutUrl = `${CONFIG.POLICY_URL}?data=${urlSafe}`;  // Changed this line
        
        // Display result
        displayResult(checkoutUrl);
        
        // Store for preview
        currentCheckoutUrl = checkoutUrl;
        
        console.log('✓ Checkout link generated successfully');
    } catch (error) {
        console.error('Encryption error:', error);
        showError('Failed to generate link. Please try again.');
    }
}

// =============================================
// Validation
// =============================================

function validateOrderData(data) {
    if (!data.orderId || !data.orderId.trim()) {
        showError('Order ID is required');
        return false;
    }
    
    if (!data.customerName || !data.customerName.trim()) {
        showError('Customer name is required');
        return false;
    }
    
    if (!data.item) {
        showError('Please select an item');
        return false;
    }
    
    if (!data.size) {
        showError('Please select a size');
        return false;
    }

        if (!data.currency) {  
        showError('Please select a currency');
        return false;
    }
    
    if (!data.price || isNaN(data.price) || data.price <= 0) {
        showError('Please enter a valid price');
        return false;
    }
    
    if (!data.shipping || isNaN(data.shipping) || data.shipping < 0) {
        showError('Please enter a valid shipping amount');
        return false;
    }
    
    if (!data.country || !data.country.trim()) {
        showError('Shipping country is required');
        return false;
    }
    
    return true;
}

// =============================================
// Display Functions
// =============================================

function displayResult(checkoutUrl) {
    document.getElementById('checkoutLink').textContent = checkoutUrl;
    document.getElementById('resultSection').classList.remove('hidden');
    
    // Scroll to result
    setTimeout(() => {
        document.getElementById('resultSection').scrollIntoView({ 
            behavior: 'smooth',
            block: 'nearest'
        });
    }, 100);
}

// =============================================
// Utility Functions
// =============================================

function getFieldValue(fieldId) {
    const field = document.getElementById(fieldId);
    return field ? field.value.trim() : '';
}

function copyLink(elementId) {
    const text = document.getElementById(elementId).textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        showSuccess('Link copied to clipboard!');
    }).catch(err => {
        console.error('Copy failed:', err);
        showError('Failed to copy. Please copy manually.');
    });
}

function openPreview() {
    if (currentCheckoutUrl) {
        window.open(currentCheckoutUrl, '_blank');
    }
}

function resetForm() {
    document.getElementById('orderForm').reset();
    document.getElementById('resultSection').classList.add('hidden');
    currentCheckoutUrl = '';
    
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function showError(message) {
    alert('❌ ' + message);
}

function showSuccess(message) {
    // Create temporary success notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #22c55e;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = '✓ ' + message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);