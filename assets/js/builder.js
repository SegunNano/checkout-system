// =============================================
// DemiEssence Checkout Link Builder
// =============================================

// Configuration
const CONFIG = {
    VA_PASSWORD: 'demi2026admin',
    SECRET_KEY: 'DemiEssence2026SecretKey!@#',
    POLICY_URL: 'https://segunnano.github.io/checkout-system/policy.html',
    LINK_EXPIRY_MINUTES: 5
};

// State
let currentCheckoutUrl = '';
let itemCounter = 1;

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
// Item Management
// =============================================

function addItemRow() {
    itemCounter++;
    
    const container = document.getElementById('itemsContainer');
    const newRow = document.createElement('div');
    newRow.className = 'item-row';
    newRow.setAttribute('data-item-index', itemCounter);
    
    newRow.innerHTML = `
        <div class="item-row-header">
            <span class="item-row-label">Item ${itemCounter}</span>
            <button type="button" class="btn-remove-item" onclick="removeItem(${itemCounter})">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                Remove
            </button>
        </div>

        <div class="form-grid">
            <div class="form-group">
                <label>Style</label>
                <select class="input-field item-style" required>
                    <option value="">Select style</option>
                    <option value="Rhena">Rhena</option>
                    <option value="Rheve">Rheve</option>
                    <option value="Miel">Miel</option>
                    <option value="Milani">Milani</option>
                    <option value="Lunara">Lunara</option>
                    <option value="Custom-made">Custom-made</option>
                </select>
            </div>

            <div class="form-group">
                <label>Size</label>
                <select class="input-field item-size" required>
                    <option value="">Select size</option>
                    <option value="6">Size 6</option>
                    <option value="8">Size 8</option>
                    <option value="10">Size 10</option>
                    <option value="12">Size 12</option>
                    <option value="14">Size 14</option>
                    <option value="16">Size 16</option>
                    <option value="18">Size 18</option>
                </select>
            </div>
        </div>

        <div class="form-grid">
            <div class="form-group">
                <label>Quantity</label>
                <input 
                    type="number" 
                    class="input-field item-quantity"
                    placeholder="1"
                    min="1"
                    value="1"
                    required
                >
            </div>

            <div class="form-group">
                <label>Price (per item)</label>
                <input 
                    type="number" 
                    class="input-field item-price"
                    placeholder="145.00"
                    step="0.01"
                    required
                >
            </div>
        </div>

        <div class="form-group">
            <label>Color / Customizations (Optional)</label>
            <input 
                type="text" 
                class="input-field item-customizations"
                placeholder="e.g., Red fabric, extra length"
            >
        </div>
    `;
    
    container.appendChild(newRow);
    updateRemoveButtons();
}

function removeItem(index) {
    const row = document.querySelector(`[data-item-index="${index}"]`);
    if (row) {
        row.remove();
        updateRemoveButtons();
        renumberItems();
    }
}

function updateRemoveButtons() {
    const rows = document.querySelectorAll('.item-row');
    rows.forEach((row, index) => {
        const removeBtn = row.querySelector('.btn-remove-item');
        if (rows.length === 1) {
            removeBtn.style.display = 'none';
        } else {
            removeBtn.style.display = 'inline-flex';
        }
    });
}

function renumberItems() {
    const rows = document.querySelectorAll('.item-row');
    rows.forEach((row, index) => {
        const label = row.querySelector('.item-row-label');
        label.textContent = `Item ${index + 1}`;
    });
}

// =============================================
// Form Handling
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('orderForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            generateLink();
        });
    }
    
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
    // Collect items array
    const items = [];
    const itemRows = document.querySelectorAll('.item-row');
    
    itemRows.forEach((row, index) => {
        const style = row.querySelector('.item-style').value;
        const size = row.querySelector('.item-size').value;
        const quantity = parseInt(row.querySelector('.item-quantity').value);
        const price = parseFloat(row.querySelector('.item-price').value);
        const customizations = row.querySelector('.item-customizations').value.trim();
        
        if (!style || !size || !quantity || !price) {
            throw new Error(`Item ${index + 1}: Missing required fields`);
        }
        
        const item = {
            style: style,
            size: size,
            quantity: quantity,
            price: price
        };
        
        if (customizations) {
            item.customizations = customizations;
        }
        
        items.push(item);
    });
    
    // Collect order data
    const orderData = {
        orderId: getFieldValue('orderId'),
        customerName: getFieldValue('customerName'),
        customerEmail: getFieldValue('customerEmail'),
        currency: getFieldValue('currency'),
        items: items,
        shipping: parseFloat(getFieldValue('shipping')),
        country: getFieldValue('country'),
        notes: getFieldValue('notes'),
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + CONFIG.LINK_EXPIRY_MINUTES * 60 * 1000).toISOString(),
        createdBy: 'VA'
    };
    
    if (!validateOrderData(orderData)) {
        return;
    }
    
    try {
        const jsonData = JSON.stringify(orderData);
        const encrypted = CryptoJS.AES.encrypt(jsonData, CONFIG.SECRET_KEY).toString();
        const urlSafe = encodeURIComponent(encrypted);
        
        const checkoutUrl = `${CONFIG.POLICY_URL}?data=${urlSafe}`;
        
        displayResult(checkoutUrl);
        currentCheckoutUrl = checkoutUrl;
        
        // console.log('✓ Policy link generated successfully');
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
    
    if (!data.currency) {
        showError('Please select a currency');
        return false;
    }
    
    if (!data.items || data.items.length === 0) {
        showError('At least one item is required');
        return false;
    }
    
    if (isNaN(data.shipping) || data.shipping < 0) {
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
    
    // Reset to single item
    const container = document.getElementById('itemsContainer');
    const allRows = container.querySelectorAll('.item-row');
    allRows.forEach((row, index) => {
        if (index > 0) row.remove();
    });
    itemCounter = 1;
    updateRemoveButtons();
    
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function showError(message) {
    alert('❌ ' + message);
}

function showSuccess(message) {
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