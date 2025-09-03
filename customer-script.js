// Data storage - These will be populated by the admin
let products = {};
let issues = {};
let supportTickets = [];

let currentSession = {
    step: 'greeting',
    product: null,
    customerData: {},
    issue: null,
    ticketId: null
};

// Load data from localStorage if available
function loadData() {
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
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('chatbot_products', JSON.stringify(products));
    localStorage.setItem('chatbot_issues', JSON.stringify(issues));
    localStorage.setItem('chatbot_tickets', JSON.stringify(supportTickets));
}

// Initialize the chatbot
function initializeChatbot() {
    loadData();
    
    // Check if there are any products configured
    if (Object.keys(products).length === 0) {
        addBotMessage("Hello! I'm sorry, but our support system is currently being configured. Please check back shortly or contact our support team directly. Thank you for your patience! 🙏");
        return;
    }
    
    addBotMessage("Hello! Welcome to our Customer Support. I'm here to help you resolve any issues you might have with our products. 😊");
    showProductSelection();
}

// Chat functionality
function addBotMessage(message, options = null, form = null) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';
    messageDiv.innerHTML = message;
    
    if (options) {
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'option-buttons';
        options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = option.text;
            button.onclick = option.action;
            optionsDiv.appendChild(button);
        });
        messageDiv.appendChild(optionsDiv);
    }
    
    if (form) {
        messageDiv.appendChild(form);
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addUserMessage(message) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';
    messageDiv.textContent = message;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        if (message) {
            addUserMessage(message);
            input.value = '';
            handleUserInput(message);
        }
    }
}

function handleUserInput(message) {
    if (currentSession.step === 'awaiting_other_issue') {
        handleOtherIssueDescription(message);
    }
}

// Product selection
function showProductSelection() {
    const productKeys = Object.keys(products);
    
    if (productKeys.length === 0) {
        addBotMessage("I'm sorry, but no products are currently available for support. Please contact our support team directly.");
        return;
    }
    
    const options = productKeys.map(key => ({
        text: products[key].name,
        action: () => selectProduct(key)
    }));
    
    addBotMessage("Please select the product you need help with:", options);
    currentSession.step = 'product_selection';
}

function selectProduct(productKey) {
    currentSession.product = productKey;
    const productName = products[productKey].name;
    addUserMessage(productName);
    addBotMessage(`Great! You've selected ${productName}. Now I need to verify your identity to ensure we can provide you with the best support.`);
    showIdentityForm();
}

// Identity verification
function showIdentityForm() {
    const product = products[currentSession.product];
    const form = document.createElement('div');
    
    let formHTML = '<div class="form-group">';
    product.fields.forEach(field => {
        formHTML += `
            <label class="form-label">${field}:</label>
            <input type="text" class="form-input" data-field="${field}" required>
        `;
    });
    formHTML += '<button class="submit-btn" onclick="submitIdentityForm()">Verify Identity</button></div>';
    
    form.innerHTML = formHTML;
    addBotMessage("Please provide the following information:", null, form);
    currentSession.step = 'identity_verification';
}

function submitIdentityForm() {
    const inputs = document.querySelectorAll('.form-input[data-field]');
    let allFilled = true;
    
    currentSession.customerData = {};
    
    inputs.forEach(input => {
        const field = input.getAttribute('data-field');
        const value = input.value.trim();
        if (value) {
            currentSession.customerData[field] = value;
        } else {
            allFilled = false;
        }
    });
    
    if (!allFilled) {
        addBotMessage("Please fill in all required fields to proceed.");
        return;
    }
    
    // Display submitted data as user message
    const dataEntries = Object.entries(currentSession.customerData)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    addUserMessage(`Identity verification: ${dataEntries}`);
    
    addBotMessage("Thank you! Your identity has been verified. Now, let's identify the issue you're experiencing.");
    showIssueSelection();
}

// Issue selection
function showIssueSelection() {
    const productIssues = issues[currentSession.product] || [];
    const options = productIssues.map(issue => ({
        text: issue.name,
        action: () => selectIssue(issue)
    }));
    
    options.push({
        text: 'Other (describe your issue)',
        action: () => selectOtherIssue()
    });
    
    addBotMessage("What issue are you experiencing with your device?", options);
    currentSession.step = 'issue_selection';
}

function selectIssue(issue) {
    currentSession.issue = issue.name;
    addUserMessage(issue.name);
    
    const solutionHTML = `
        <div class="solution-steps">
            <h4>Solution Steps:</h4>
            <ol>
                ${issue.solution.map(step => `<li>${step}</li>`).join('')}
            </ol>
        </div>
    `;
    
    addBotMessage(`I can help you with that! Here's how to resolve "${issue.name}":${solutionHTML}`);
    
    // Log the ticket
    logSupportTicket('resolved');
    
    setTimeout(() => {
        addBotMessage("Was this solution helpful? If you need further assistance, please don't hesitate to reach out. Have a great day! 🌟");
        setTimeout(() => {
            resetChat();
        }, 4000);
    }, 2000);
}

function selectOtherIssue() {
    addUserMessage("Other (describe your issue)");
    addBotMessage("I understand you're experiencing a unique issue. Please describe your problem in detail so I can connect you with a specialist who can provide the best assistance.");
    currentSession.step = 'awaiting_other_issue';
}

function handleOtherIssueDescription(description) {
    currentSession.issue = description;
    
    const ticketId = generateTicketId();
    currentSession.ticketId = ticketId;
    
    const ticketHTML = `
        <div class="ticket-info">
            <strong>Support Ticket Created: #${ticketId}</strong><br><br>
            A specialist will contact you within 24 hours regarding your issue. 
            Please keep this ticket number for reference.
        </div>
    `;
    
    addBotMessage(`Thank you for providing those details. I apologize that I couldn't resolve this issue immediately.${ticketHTML}`);
    
    // Log the ticket
    logSupportTicket('escalated');
    
    setTimeout(() => {
        addBotMessage("Is there anything else I can help you with today?");
        setTimeout(() => {
            resetChat();
        }, 4000);
    }, 2000);
}

// Support ticket management
function generateTicketId() {
    return 'SUP' + Date.now().toString().slice(-6);
}

function logSupportTicket(status) {
    const ticket = {
        id: currentSession.ticketId || generateTicketId(),
        timestamp: new Date().toLocaleString(),
        product: products[currentSession.product].name,
        customerData: { ...currentSession.customerData },
        issue: currentSession.issue,
        status: status
    };
    
    supportTickets.push(ticket);
    saveData();
}

function resetChat() {
    currentSession = {
        step: 'greeting',
        product: null,
        customerData: {},
        issue: null,
        ticketId: null
    };
    
    setTimeout(() => {
        document.getElementById('chatMessages').innerHTML = '';
        initializeChatbot();
    }, 1000);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeChatbot();
});
