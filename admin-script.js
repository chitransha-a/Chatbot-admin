// Data structures - Start empty as requested
let products = {};
let issues = {};
let supportTickets = [];
let editingProductKey = null;

// Load data from localStorage
function loadData() {
    try {
        const savedProducts = localStorage.getItem('chatbot_products');
        const savedIssues = localStorage.getItem('chatbot_issues');
        const savedTickets = localStorage.getItem('chatbot_tickets');
        
        if (savedProducts) {
            products = JSON.parse(savedProducts);
        }
        if (savedIssues) {
            issues = JSON.parse(savedIssues);
        }
        if (savedTickets) {
            supportTickets = JSON.parse(savedTickets);
        }
    } catch (error) {
        console.error('Error loading data:', error);
        // Reset to empty if corrupted
        products = {};
        issues = {};
        supportTickets = [];
    }
}

// Save data to localStorage
function saveData() {
    try {
        localStorage.setItem('chatbot_products', JSON.stringify(products));
        localStorage.setItem('chatbot_issues', JSON.stringify(issues));
        localStorage.setItem('chatbot_tickets', JSON.stringify(supportTickets));
    } catch (error) {
        console.error('Error saving data:', error);
        alert('Error saving data. Please try again.');
    }
}

// Product management functions
function addProduct() {
    const nameInput = document.getElementById('productName');
    const fieldsInput = document.getElementById('productFields');
    const submitBtn = document.getElementById('productSubmitBtn');
    
    const name = nameInput.value.trim();
    const fieldsText = fieldsInput.value.trim();
    
    if (!name) {
        alert('Please enter a product name.');
        return;
    }
    
    if (!fieldsText) {
        alert('Please enter at least one customer field.');
        return;
    }
    
    const fields = fieldsText.split(',').map(f => f.trim()).filter(f => f);
    
    if (fields.length === 0) {
        alert('Please enter at least one valid customer field.');
        return;
    }
    
    let key;
    let isEditing = editingProductKey !== null;
    
    if (isEditing) {
        // We're editing an existing product
        key = editingProductKey;
    } else {
        // Create a unique key for the new product
        key = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        
        // Check if product already exists (only for new products)
        if (products[key]) {
            alert(`A product with the name "${name}" already exists. Please choose a different name or edit the existing product.`);
            return;
        }
    }
    
    products[key] = { name, fields };
    
    // Initialize issues array if it doesn't exist
    if (!issues[key]) {
        issues[key] = [];
    }
    
    // Clear inputs and reset form
    nameInput.value = '';
    fieldsInput.value = '';
    resetProductForm();
    
    // Save and update display
    saveData();
    updateAdminPanel();
    
    const action = isEditing ? 'updated' : 'added';
    alert(`Product "${name}" has been ${action} successfully!`);
}

function editProduct(key) {
    const product = products[key];
    if (!product) return;
    
    // Set editing mode
    editingProductKey = key;
    
    // Fill the form with existing data
    document.getElementById('productName').value = product.name;
    document.getElementById('productFields').value = product.fields.join(', ');
    
    // Update UI to show editing mode
    const submitBtn = document.getElementById('productSubmitBtn');
    const cancelBtn = document.getElementById('productCancelBtn');
    
    submitBtn.textContent = 'Update Product';
    submitBtn.className = 'admin-btn warning';
    cancelBtn.style.display = 'inline-block';
    
    // Scroll to form
    document.getElementById('productName').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('productName').focus();
}

function cancelProductEdit() {
    resetProductForm();
    
    // Clear inputs
    document.getElementById('productName').value = '';
    document.getElementById('productFields').value = '';
}

function resetProductForm() {
    editingProductKey = null;
    
    // Reset UI to add mode
    const submitBtn = document.getElementById('productSubmitBtn');
    const cancelBtn = document.getElementById('productCancelBtn');
    
    submitBtn.textContent = 'Add Product';
    submitBtn.className = 'admin-btn primary';
    cancelBtn.style.display = 'none';
}

function deleteProduct(key) {
    const product = products[key];
    if (!product) return;
    
    // Don't allow deletion if currently editing this product
    if (editingProductKey === key) {
        alert('Cannot delete a product that is currently being edited. Please cancel the edit first.');
        return;
    }
    
    if (confirm(`Are you sure you want to delete "${product.name}" and all its associated issues?`)) {
        delete products[key];
        delete issues[key];
        
        saveData();
        updateAdminPanel();
        
        alert(`Product "${product.name}" has been deleted successfully!`);
    }
}

// Issue management functions
function addIssue() {
    const productSelect = document.getElementById('issueProduct');
    const nameInput = document.getElementById('issueName');
    const solutionInput = document.getElementById('issueSolution');
    
    const productKey = productSelect.value;
    const name = nameInput.value.trim();
    const solutionText = solutionInput.value.trim();
    
    if (!productKey) {
        alert('Please select a product first.');
        return;
    }
    
    if (!name) {
        alert('Please enter an issue name.');
        return;
    }
    
    if (!solutionText) {
        alert('Please enter solution steps.');
        return;
    }
    
    const solution = solutionText.split('\n').map(s => s.trim()).filter(s => s);
    
    if (solution.length === 0) {
        alert('Please enter at least one solution step.');
        return;
    }
    
    // Check if issue already exists for this product
    if (issues[productKey].some(issue => issue.name.toLowerCase() === name.toLowerCase())) {
        if (!confirm(`Issue "${name}" already exists for this product. Do you want to update it?`)) {
            return;
        }
        // Remove existing issue
        issues[productKey] = issues[productKey].filter(issue => issue.name.toLowerCase() !== name.toLowerCase());
    }
    
    // Add the new issue
    issues[productKey].push({ name, solution });
    
    // Clear inputs
    nameInput.value = '';
    solutionInput.value = '';
    
    // Save and update display
    saveData();
    updateAdminPanel();
    
    alert(`Issue "${name}" has been added successfully!`);
}

function deleteIssue(productKey, issueIndex) {
    const issue = issues[productKey][issueIndex];
    if (!issue) return;
    
    if (confirm(`Are you sure you want to delete the issue "${issue.name}"?`)) {
        issues[productKey].splice(issueIndex, 1);
        
        saveData();
        updateAdminPanel();
        
        alert(`Issue "${issue.name}" has been deleted successfully!`);
    }
}

// Update admin panel displays
function updateAdminPanel() {
    updateProductsList();
    updateIssueProductSelect();
    updateIssuesList();
    updateTicketsList();
}

function updateProductsList() {
    const list = document.getElementById('productsList');
    list.innerHTML = '';
    
    const productKeys = Object.keys(products);
    
    if (productKeys.length === 0) {
        list.innerHTML = '<div class="empty-state">No products configured yet</div>';
        return;
    }
    
    productKeys.forEach(key => {
        const product = products[key];
        const item = document.createElement('div');
        item.className = 'admin-item';
        item.innerHTML = `
            <div class="admin-item-content">
                <div class="admin-item-title">${product.name}</div>
                <div class="admin-item-details">
                    Required fields: ${product.fields.join(', ')}<br>
                    Issues configured: ${issues[key] ? issues[key].length : 0}
                </div>
            </div>
            <div style="display: flex; gap: 8px; flex-shrink: 0;">
                <button class="admin-btn edit" onclick="editProduct('${key}')">Edit</button>
                <button class="admin-btn danger" onclick="deleteProduct('${key}')">Delete</button>
            </div>
        `;
        list.appendChild(item);
    });
}

function updateIssueProductSelect() {
    const select = document.getElementById('issueProduct');
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">Select a product first</option>';
    
    Object.entries(products).forEach(([key, product]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = product.name;
        if (key === currentValue) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

function updateIssuesList() {
    const list = document.getElementById('issuesList');
    list.innerHTML = '';
    
    let hasIssues = false;
    
    Object.entries(issues).forEach(([productKey, productIssues]) => {
        if (productIssues && productIssues.length > 0) {
            hasIssues = true;
            productIssues.forEach((issue, index) => {
                const item = document.createElement('div');
                item.className = 'admin-item';
                item.innerHTML = `
                    <div class="admin-item-content">
                        <div class="admin-item-title">${products[productKey].name}: ${issue.name}</div>
                        <div class="admin-item-details">
                            Solution steps: ${issue.solution.length}<br>
                            Preview: ${issue.solution[0].substring(0, 50)}${issue.solution[0].length > 50 ? '...' : ''}
                        </div>
                    </div>
                    <button class="admin-btn danger" onclick="deleteIssue('${productKey}', ${index})">Delete</button>
                `;
                list.appendChild(item);
            });
        }
    });
    
    if (!hasIssues) {
        list.innerHTML = '<div class="empty-state">No issues configured yet</div>';
    }
}

function updateTicketsList() {
    const list = document.getElementById('ticketsList');
    list.innerHTML = '';
    
    if (supportTickets.length === 0) {
        list.innerHTML = '<div class="empty-state">No support tickets yet</div>';
        return;
    }
    
    // Show latest 20 tickets, most recent first
    const recentTickets = supportTickets.slice(-20).reverse();
    
    recentTickets.forEach(ticket => {
        const item = document.createElement('div');
        item.className = `ticket-item ${ticket.status}`;
        
        const customerInfo = Object.entries(ticket.customerData)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
        
        item.innerHTML = `
            <div class="ticket-header">
                <span class="ticket-id">#${ticket.id}</span>
                <span class="ticket-status ${ticket.status}">${ticket.status}</span>
            </div>
            <div class="ticket-details">
                <strong>Product:</strong> ${ticket.product}<br>
                <strong>Customer:</strong> ${customerInfo}<br>
                <strong>Timestamp:</strong> ${ticket.timestamp}
            </div>
            <div class="ticket-issue">
                <strong>Issue:</strong> ${ticket.issue}
            </div>
        `;
        list.appendChild(item);
    });
}

// Utility functions
function clearAllTickets() {
    if (confirm('Are you sure you want to clear all support tickets? This action cannot be undone.')) {
        supportTickets = [];
        saveData();
        updateTicketsList();
        alert('All support tickets have been cleared.');
    }
}

function exportTickets() {
    if (supportTickets.length === 0) {
        alert('No tickets to export.');
        return;
    }
    
    const csvContent = [
        ['Ticket ID', 'Product', 'Status', 'Timestamp', 'Customer Info', 'Issue'],
        ...supportTickets.map(ticket => [
            ticket.id,
            ticket.product,
            ticket.status,
            ticket.timestamp,
            Object.entries(ticket.customerData).map(([k, v]) => `${k}: ${v}`).join('; '),
            ticket.issue.replace(/\n/g, ' ')
        ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `support_tickets_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

function exportAllData() {
    const data = {
        products,
        issues,
        supportTickets,
        exportDate: new Date().toISOString()
    };
    
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chatbot_data_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
}

function clearAllData() {
    if (confirm('Are you sure you want to reset all data? This will delete all products, issues, and tickets. This action cannot be undone.')) {
        if (confirm('This is your final warning. All data will be permanently deleted. Are you absolutely sure?')) {
            products = {};
            issues = {};
            supportTickets = [];
            
            // Reset any editing state
            resetProductForm();
            
            // Clear localStorage
            localStorage.removeItem('chatbot_products');
            localStorage.removeItem('chatbot_issues');
            localStorage.removeItem('chatbot_tickets');
            
            updateAdminPanel();
            alert('All data has been reset successfully.');
        }
    }
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    updateAdminPanel();
});
