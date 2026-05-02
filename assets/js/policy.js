// =============================================
// DemiEssence Policy Gate
// =============================================

const REFUND_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdSDgYoq0XtYlvCN8yqHsCzL9CYRonQ7iLgWfc5vmUBXa1qZw/viewform?usp=publish-editor';

// =============================================
// Initialize
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    const agreeCheckbox = document.getElementById('agreePolicy');
    const acceptBtn = document.getElementById('acceptBtn');
    
    // Enable accept button only when policy is agreed
    agreeCheckbox.addEventListener('change', function() {
        acceptBtn.disabled = !this.checked;
    });
    
    // Handle accept button click
    acceptBtn.addEventListener('click', handleAccept);
});

// =============================================
// Main Logic
// =============================================

function handleAccept() {
    const params = new URLSearchParams(window.location.search);
    const encryptedData = params.get('data');
    
    if (encryptedData) {
       
        localStorage.removeItem('DE-checkoutData');
        localStorage.setItem('DE-checkoutData', encryptedData);
        
    
        window.location.href = 'view.html';
    } else {
        window.location.href = REFUND_FORM_URL;
    }
}