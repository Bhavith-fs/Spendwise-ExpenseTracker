// SpendWise - Daily Expense Tracker
class ExpenseTracker {
    constructor() {
        this.expenses = [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.loadExpenses();
        this.setupEventListeners();
        this.setDefaultDate();
        this.renderExpenses();
        this.updateSummary();
        this.updateCategoryBreakdown();
        this.loadDarkMode();
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('expenseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExpense();
        });

        // Category filter
        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.renderExpenses();
        });

        // Clear all expenses
        document.getElementById('clearAllBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete all expenses? This action cannot be undone.')) {
                this.clearAllExpenses();
            }
        });

        // Dark mode toggle
        document.getElementById('darkModeToggle').addEventListener('click', () => {
            this.toggleDarkMode();
        });
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    }

    addExpense() {
        const title = document.getElementById('title').value.trim();
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('category').value;
        const date = document.getElementById('date').value;

        // Validation
        if (!amount || amount <= 0) {
            this.showError('Please enter a valid amount greater than 0');
            return;
        }

        if (!category) {
            this.showError('Please select a category');
            return;
        }

        if (!date) {
            this.showError('Please select a date');
            return;
        }

        // Create expense object
        const expense = {
            id: Date.now().toString(),
            title: title || 'Untitled Expense',
            amount: amount,
            category: category,
            date: date,
            timestamp: new Date().toISOString()
        };

        // Add to expenses array
        this.expenses.unshift(expense);

        // Save to localStorage
        this.saveExpenses();

        // Reset form
        document.getElementById('expenseForm').reset();
        this.setDefaultDate();

        // Update UI
        this.renderExpenses();
        this.updateSummary();
        this.updateCategoryBreakdown();

        // Show success message
        this.showSuccess('Expense added successfully!');
    }

    deleteExpense(id) {
        if (confirm('Are you sure you want to delete this expense?')) {
            this.expenses = this.expenses.filter(expense => expense.id !== id);
            this.saveExpenses();
            this.renderExpenses();
            this.updateSummary();
            this.updateCategoryBreakdown();
            this.showSuccess('Expense deleted successfully!');
        }
    }

    clearAllExpenses() {
        this.expenses = [];
        this.saveExpenses();
        this.renderExpenses();
        this.updateSummary();
        this.updateCategoryBreakdown();
        this.showSuccess('All expenses cleared!');
    }

    getFilteredExpenses() {
        if (this.currentFilter === 'all') {
            return this.expenses;
        }
        return this.expenses.filter(expense => expense.category === this.currentFilter);
    }

    renderExpenses() {
        const expensesList = document.getElementById('expensesList');
        const filteredExpenses = this.getFilteredExpenses();

        if (filteredExpenses.length === 0) {
            expensesList.innerHTML = '<p class="no-expenses">No expenses found. Add your first expense above!</p>';
            return;
        }

        const expensesHTML = filteredExpenses.map(expense => `
            <div class="expense-item">
                <div class="expense-details">
                    <div class="expense-title">${this.escapeHtml(expense.title)}</div>
                    <div class="expense-meta">
                        <span class="expense-amount">$${expense.amount.toFixed(2)}</span>
                        <span class="expense-category">${this.getCategoryIcon(expense.category)} ${expense.category}</span>
                        <span class="expense-date">${this.formatDate(expense.date)}</span>
                    </div>
                </div>
                <div class="expense-actions">
                    <button class="btn btn-delete" onclick="expenseTracker.deleteExpense('${expense.id}')">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');

        expensesList.innerHTML = expensesHTML;
    }

    updateSummary() {
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const todayTotal = this.expenses
            .filter(expense => expense.date === today)
            .reduce((sum, expense) => sum + expense.amount, 0);

        const monthlyTotal = this.expenses
            .filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
            })
            .reduce((sum, expense) => sum + expense.amount, 0);

        document.getElementById('todayTotal').textContent = `$${todayTotal.toFixed(2)}`;
        document.getElementById('monthlyTotal').textContent = `$${monthlyTotal.toFixed(2)}`;
    }

    updateCategoryBreakdown() {
        const categoryTotals = {};
        const categories = ['Food', 'Travel', 'Bills', 'Shopping', 'Other'];

        // Initialize categories
        categories.forEach(category => {
            categoryTotals[category] = 0;
        });

        // Calculate totals
        this.expenses.forEach(expense => {
            if (categoryTotals.hasOwnProperty(expense.category)) {
                categoryTotals[expense.category] += expense.amount;
            }
        });

        // Find max amount for scaling
        const maxAmount = Math.max(...Object.values(categoryTotals), 1);

        // Generate category bars HTML
        const categoryBarsHTML = Object.entries(categoryTotals)
            .filter(([_, amount]) => amount > 0)
            .map(([category, amount]) => {
                const percentage = (amount / maxAmount) * 100;
                return `
                    <div class="category-bar">
                        <div class="category-label">${this.getCategoryIcon(category)} ${category}</div>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: ${percentage}%">
                                <span class="bar-amount">$${amount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

        const categoryBarsElement = document.getElementById('categoryBars');
        
        if (categoryBarsHTML) {
            categoryBarsElement.innerHTML = `<div class="category-bars">${categoryBarsHTML}</div>`;
        } else {
            categoryBarsElement.innerHTML = '<p class="no-expenses">No expenses to display</p>';
        }
    }

    getCategoryIcon(category) {
        const icons = {
            'Food': '🍔',
            'Travel': '✈️',
            'Bills': '📄',
            'Shopping': '🛍️',
            'Other': '📦'
        };
        return icons[category] || '📦';
    }

    formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveExpenses() {
        localStorage.setItem('spendwise_expenses', JSON.stringify(this.expenses));
    }

    loadExpenses() {
        const saved = localStorage.getItem('spendwise_expenses');
        if (saved) {
            try {
                this.expenses = JSON.parse(saved);
            } catch (e) {
                console.error('Error loading expenses:', e);
                this.expenses = [];
            }
        }
    }

    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('spendwise_darkmode', isDarkMode);
        
        // Update toggle button
        const toggleBtn = document.getElementById('darkModeToggle');
        toggleBtn.textContent = isDarkMode ? '☀️' : '🌙';
    }

    loadDarkMode() {
        const isDarkMode = localStorage.getItem('spendwise_darkmode') === 'true';
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            document.getElementById('darkModeToggle').textContent = '☀️';
        }
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type) {
        // Remove existing messages
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = `message message-${type}`;
        messageElement.textContent = message;
        messageElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            ${type === 'error' ? 'background-color: #ef4444;' : 'background-color: #10b981;'}
        `;

        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);

        // Add to DOM
        document.body.appendChild(messageElement);

        // Remove after 3 seconds
        setTimeout(() => {
            messageElement.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                messageElement.remove();
            }, 300);
        }, 3000);
    }
}

// Initialize the app
const expenseTracker = new ExpenseTracker();

// Add some sample data for demonstration (optional)
if (expenseTracker.expenses.length === 0) {
    const sampleExpenses = [
        {
            id: '1',
            title: 'Morning Coffee',
            amount: 4.50,
            category: 'Food',
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString()
        },
        {
            id: '2',
            title: 'Uber Ride',
            amount: 12.00,
            category: 'Travel',
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString()
        },
        {
            id: '3',
            title: 'Electric Bill',
            amount: 85.00,
            category: 'Bills',
            date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            timestamp: new Date(Date.now() - 86400000).toISOString()
        }
    ];
    
    // Uncomment the line below to add sample data on first load
    // expenseTracker.expenses = sampleExpenses;
    // expenseTracker.saveExpenses();
    // expenseTracker.renderExpenses();
    // expenseTracker.updateSummary();
    // expenseTracker.updateCategoryBreakdown();
}
