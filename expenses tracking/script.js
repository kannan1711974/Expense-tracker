// Data storage
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let currentUser = localStorage.getItem('currentUser');

// Currency handling
let currentCurrency = localStorage.getItem('preferredCurrency') || 'INR';
const exchangeRate = 83; // 1 USD = 83 INR

function setCurrency(curr) {
    currentCurrency = curr;
    localStorage.setItem('preferredCurrency', curr);
    updateDisplay();
}

// Get users from localStorage or initialize with default
function getUsers() {
    const users = localStorage.getItem('users');
    if (users) {
        return JSON.parse(users);
    }
    // Default user
    const defaultUsers = [{
        username: 'admin',
        password: 'password123'
    }];
    localStorage.setItem('users', JSON.stringify(defaultUsers));
    return defaultUsers;
}

// Save users to localStorage
function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

// DOM Elements - Check if they exist before accessing
const loginSection = document.getElementById('login-section');
const registerSection = document.getElementById('register-section');
const appSection = document.getElementById('app-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');
const logoutBtn = document.getElementById('logout-btn');
const navBtns = document.querySelectorAll('.nav-btn');
const contentSections = document.querySelectorAll('.content-section');

// Event Listeners for toggling Login/Register forms
if (document.getElementById('show-register')) {
    document.getElementById('show-register').addEventListener('click', function(e) {
        e.preventDefault();
        loginSection.classList.remove('active');
        registerSection.classList.add('active');
    });
}

if (document.getElementById('show-login')) {
    document.getElementById('show-login').addEventListener('click', function(e) {
        e.preventDefault();
        registerSection.classList.remove('active');
        loginSection.classList.add('active');
    });
}

// Register Form Submit
if (registerForm) {
registerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    const confirmPassword = document.getElementById('reg-confirm-password').value.trim();
    
    // Clear previous messages
    registerError.classList.remove('show');
    
    // Validate password length
    if (password.length < 6) {
        registerError.textContent = 'Password must be at least 6 characters';
        registerError.classList.add('show');
        return;
    }
    
    // Get existing users
    const users = getUsers();
    
    // Check if username already exists
    const userExists = users.some(u => u.username.toLowerCase() === username.toLowerCase());
    if (userExists) {
        registerError.textContent = 'Username already exists';
        registerError.classList.add('show');
        return;
    }
    
    // Add new user
    users.push({ 
        username, 
        password, 
        plan: 'trial', 
        signupDate: new Date().toISOString() 
    });
    saveUsers(users);
    
    // Show success and switch to login
    showToast('Account created successfully! Redirecting to login...');
    registerForm.reset();
    
    // Switch to login after 2 seconds
    setTimeout(() => {
        if (loginSection && registerSection) {
            registerSection.classList.remove('active');
            loginSection.classList.add('active');
        } else {
            window.location.href = 'login.html';
        }
    }, 2000);
});
}

// Login Form Submit
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        
        // Get registered users
        const users = getUsers();
        
        // Check credentials against registered users (case-insensitive username, case-sensitive password)
        const validUser = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
        
        if (validUser) {
            currentUser = validUser.username;
            localStorage.setItem('currentUser', currentUser);
            loginError.classList.remove('show');
            transactions = JSON.parse(localStorage.getItem('transactions')) || [];
            loginForm.reset();
            if (currentUser === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'index.html';
            }
        } else {
            loginError.textContent = 'Invalid username or password';
            loginError.classList.add('show');
        }
    });
}

// Logout - using event delegation for dynamically loaded pages
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'logout-btn') {
        currentUser = null;
        localStorage.removeItem('currentUser');
        transactions = [];
        updateDisplay();
        window.location.href = 'login.html';
    }
});

// Navigation - for multi-section pages
if (navBtns.length > 0 && contentSections.length > 0) {
    navBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            if (!section) return;
            
            // Update nav buttons
            navBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding section
            contentSections.forEach(s => s.classList.remove('active'));
            document.getElementById(section).classList.add('active');
        });
    });
} 

// Income Form Submit
if (document.getElementById('income-form')) {
    document.getElementById('income-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const description = document.getElementById('income-description').value;
    const amount = parseFloat(document.getElementById('income-amount').value);
    const date = document.getElementById('income-date').value;

    const subInfo = getSubscriptionInfo();
    if (currentUser !== 'admin' && subInfo && subInfo.plan === 'trial' && subInfo.status === 'expired') {
        alert('Trial expired. Please upgrade to a plan.');
        window.location.href = 'pricing.html';
        return;
    }
    
    if (!currentUser) {
        alert('Session expired. Please login again.');
        window.location.href = 'login.html';
        return;
    }

    const transaction = {
        id: Date.now(),
        user: currentUser,
        type: 'income',
        description,
        amount,
        date
    };
    
    transactions.push(transaction);
    saveTransactions();
    updateDisplay();
    this.reset();
    // Set today's date as default
    document.getElementById('income-date').valueAsDate = new Date();
    });
}

// Expense Form Submit
if (document.getElementById('expense-form')) {
    document.getElementById('expense-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const description = document.getElementById('expense-description').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;
    const date = document.getElementById('expense-date').value;

    const subInfo = getSubscriptionInfo();
    if (currentUser !== 'admin' && subInfo && subInfo.plan === 'trial' && subInfo.status === 'expired') {
        alert('Trial expired. Please upgrade to a plan.');
        window.location.href = 'pricing.html';
        return;
    }
    
    if (!currentUser) {
        alert('Session expired. Please login again.');
        window.location.href = 'login.html';
        return;
    }

    const transaction = {
        id: Date.now(),
        user: currentUser,
        type: 'expense',
        description,
        amount,
        category,
        date
    };
    
    transactions.push(transaction);
    saveTransactions();
    updateDisplay();
    this.reset();
    // Set today's date as default
    document.getElementById('expense-date').valueAsDate = new Date();
    });
}

// Save transactions to localStorage
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Update all displays
function updateDisplay() {
    updateDashboard();
    updateIncomeList();
    updateExpenseList();
    if (typeof renderExpenseChart === 'function') renderExpenseChart();
}

// Update Dashboard
function updateDashboard() {
    const userTransactions = transactions.filter(t => t.user === currentUser);

    const totalIncome = userTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = userTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalBalance = totalIncome - totalExpense;
    
    if (document.getElementById('total-balance')) {
        document.getElementById('total-balance').textContent = formatCurrency(totalBalance);
    }
    if (document.getElementById('total-income')) {
        document.getElementById('total-income').textContent = formatCurrency(totalIncome);
    }
    if (document.getElementById('total-expense')) {
        document.getElementById('total-expense').textContent = formatCurrency(totalExpense);
    }

    // Trial status banner
    const subInfo = getSubscriptionInfo();
    const trialBanner = document.getElementById('trial-banner');
    if (trialBanner && subInfo && currentUser !== 'admin') {
        if (subInfo.plan === 'trial') {
            if (subInfo.status === 'active') {
                trialBanner.innerHTML = `<div style="background: #fff3cd; color: #856404; padding: 15px; text-align: center; border-radius: 8px; margin-bottom: 20px; border: 1px solid #ffeeba;">
                    Free Trial: <strong>${subInfo.daysLeft} days</strong> remaining. <a href="pricing.html" style="color: #856404; font-weight: bold; text-decoration: underline;">Upgrade to Pro</a>
                </div>`;
            } else {
                trialBanner.innerHTML = `<div style="background: #f8d7da; color: #721c24; padding: 15px; text-align: center; border-radius: 8px; margin-bottom: 20px; border: 1px solid #f5c6cb;">
                    Trial expired! <a href="pricing.html" style="color: #721c24; font-weight: bold; text-decoration: underline;">Choose a plan to continue tracking</a>
                </div>`;
            }
        }
    }
    
    // Recent transactions (last 5)
    const recentList = document.getElementById('recent-transactions-list');
    if (recentList) {
    const recentTransactions = userTransactions.slice(-5).reverse();
    
    if (recentTransactions.length === 0) {
        recentList.innerHTML = '<p class="no-transactions">No transactions yet</p>';
    } else {
        recentList.innerHTML = recentTransactions.map(t => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-description">${t.description}</div>
                    <div class="transaction-date">${formatDate(t.date)}</div>
                </div>
                <span class="transaction-amount ${t.type}">${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}</span>
            </div>
        `).join('');
    }
    }
}

// Update Income List
function updateIncomeList() {
    const incomeList = document.getElementById('income-list');
    if (!incomeList) return;
    const incomeTransactions = transactions.filter(t => t.type === 'income' && t.user === currentUser).reverse();
    
    if (incomeTransactions.length === 0) {
        incomeList.innerHTML = '<p class="no-transactions">No income records yet</p>';
    } else {
        incomeList.innerHTML = incomeTransactions.map(t => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-description">${t.description}</div>
                    <div class="transaction-date">${formatDate(t.date)}</div>
                </div>
                <span class="transaction-amount income">+${formatCurrency(t.amount)}</span>
                <button class="delete-btn" onclick="deleteTransaction(${t.id})">×</button>
            </div>
        `).join('');
    }
}

// Update Expense List
function updateExpenseList() {
    const expenseList = document.getElementById('expense-list');
    if (!expenseList) return;
    const expenseTransactions = transactions.filter(t => t.type === 'expense' && t.user === currentUser).reverse();
    
    if (expenseTransactions.length === 0) {
        expenseList.innerHTML = '<p class="no-transactions">No expense records yet</p>';
    } else {
        expenseList.innerHTML = expenseTransactions.map(t => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-description">${t.description}</div>
                    <div class="transaction-date">${formatDate(t.date)}</div>
                </div>
                <span class="transaction-amount expense">-${formatCurrency(t.amount)}</span>
                <span class="transaction-category">${t.category}</span>
                <button class="delete-btn" onclick="deleteTransaction(${t.id})">×</button>
            </div>
        `).join('');
    }
}

// Delete transaction
function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    updateDisplay();
}

// Format currency
function formatCurrency(amount) {
    if (currentCurrency === 'USD') {
        return '$' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }
    return '₹' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Set default dates
if (document.getElementById('income-date')) {
    document.getElementById('income-date').valueAsDate = new Date();
}
if (document.getElementById('expense-date')) {
    document.getElementById('expense-date').valueAsDate = new Date();
}

// Initialize
updateDisplay();

// Set currency selector value if it exists
if (document.getElementById('currency-selector')) {
    document.getElementById('currency-selector').value = currentCurrency;
}

// Admin Dashboard Logic
const adminUsersTable = document.getElementById('admin-users-body');
const adminTransactionsTable = document.getElementById('admin-transactions-body');

if (adminUsersTable || adminTransactionsTable) {
    if (currentUser !== 'admin') {
        window.location.href = 'login.html';
    } else {
        updateAdminDisplay();
    }
}

function updateAdminDisplay() {
    if (adminUsersTable) {
        const users = getUsers();
        adminUsersTable.innerHTML = users.map(u => `
            <tr>
                <td>${u.username}</td>
                <td>${u.password}</td>
                <td><span class="badge ${u.plan === 'trial' ? 'expense' : 'income'}">${u.plan || 'N/A'}</span></td>
            </tr>
        `).join('');
    }
    if (adminTransactionsTable) {
        adminTransactionsTable.innerHTML = transactions.map(t => `
            <tr>
                <td>${t.user || 'N/A'}</td>
                <td>${t.type}</td>
                <td>${t.description}</td>
                <td>${formatCurrency(t.amount)}</td>
                <td>${formatDate(t.date)}</td>
            </tr>
        `).join('');
    }
}

// Toast Notification
function showToast(message) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Subscription Logic
function getSubscriptionInfo() {
    const users = getUsers();
    const user = users.find(u => u.username === currentUser);
    if (!user) return null;
    
    if (user.plan && user.plan !== 'trial') {
        return { plan: user.plan, status: 'active' };
    }
    
    const signupDate = new Date(user.signupDate || Date.now());
    const now = new Date();
    const diffTime = now - signupDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 3) {
        return { plan: 'trial', status: 'active', daysLeft: 3 - diffDays };
    }
    return { plan: 'trial', status: 'expired' };
}

function processPayment(planName, method) {
    const prices = { 'Basic': 1, 'Pro': 3, 'Premium': 5 };
    const usdPrice = prices[planName];
    const inrPrice = usdPrice * exchangeRate;
    const paymentId = method === 'PayPal' ? 'igriseking' : 'gurucharu65@oksbi';
    
    let paymentUrl = '';
    let displayPrice = '';

    if (method === 'PayPal') {
        // Always use the exact dollar amount for PayPal redirection
        paymentUrl = `https://www.paypal.me/${paymentId}/${usdPrice}`;
        displayPrice = `$${usdPrice}`;
    } else {
        // Use the converted INR amount for GPay/UPI
        paymentUrl = `upi://pay?pa=${paymentId}&pn=ExpenseTracker&am=${inrPrice}&cu=INR`;
        displayPrice = `₹${inrPrice}`;
    }

    window.open(paymentUrl, '_blank');
    const confirmPay = confirm(`Opening ${method} in a new window...\n\nRecipient: ${paymentId}\nAmount: ${displayPrice}\n\nDid you complete the payment? Click OK to activate your ${planName} plan.`);
    
    if (confirmPay) {
        updatePlan(planName);
    }
}

function updatePlan(planName) {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.username === currentUser);
    if (userIndex !== -1) {
        users[userIndex].plan = planName;
        saveUsers(users);
        showToast(`Successfully upgraded to ${planName} plan!`);
        setTimeout(() => window.location.href = 'index.html', 1500);
    }
}

// Charts for higher amount plans (Pro and Premium)
function renderExpenseChart() {
    const chartCanvas = document.getElementById('expenseChart');
    if (!chartCanvas) return;

    const info = getSubscriptionInfo();
    const chartContainer = document.getElementById('chart-container');
    
    // Show charts for Pro ($3) and Premium ($5)
    if (info && (info.plan === 'Pro' || info.plan === 'Premium') && typeof Chart !== 'undefined') {
        chartContainer.style.display = 'block';
        
        const userTransactions = transactions.filter(t => t.user === currentUser && t.type === 'expense');
        const categories = {};
        userTransactions.forEach(t => {
            categories[t.category] = (categories[t.category] || 0) + t.amount;
        });

        if (window.myChart) window.myChart.destroy();
        
        window.myChart = new Chart(chartCanvas, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categories).map(c => c.charAt(0).toUpperCase() + c.slice(1)),
                datasets: [{
                    data: Object.values(categories),
                    backgroundColor: ['#4CAF50', '#2196F3', '#FFC107', '#E91E63', '#9C27B0', '#FF5722']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    } else {
        chartContainer.style.display = 'none';
    }
}
