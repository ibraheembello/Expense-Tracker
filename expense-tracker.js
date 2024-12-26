// expense-tracker.js
const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const program = new Command();
const DATA_FILE = path.join(__dirname, 'expenses.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ expenses: [] }));
}

// Utility functions
function loadData() {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function formatCurrency(amount) {
    return `$${parseFloat(amount).toFixed(2)}`;
}

function validateAmount(amount) {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
        throw new Error('Amount must be a positive number');
    }
    return parsedAmount;
}

function getBudget() {
    const data = loadData();
    return data.budget || 0;
}

function checkBudgetWarning(expenses, month) {
    const budget = getBudget();
    if (!budget) return null;
    
    const currentMonth = month || new Date().getMonth() + 1;
    const monthlyExpenses = expenses.filter(e => {
        const expenseMonth = new Date(e.date).getMonth() + 1;
        return expenseMonth === currentMonth;
    });
    
    const total = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    if (total > budget) {
        return `WARNING: Monthly expenses (${formatCurrency(total)}) exceed budget (${formatCurrency(budget)})`;
    }
    return null;
}

// Command implementations
program
    .name('expense-tracker')
    .description('CLI expense tracker application')
    .version('1.0.0');

program
    .command('add')
    .description('Add a new expense')
    .requiredOption('--description <description>', 'Expense description')
    .requiredOption('--amount <amount>', 'Expense amount')
    .option('--category <category>', 'Expense category')
    .action((options) => {
        try {
            const amount = validateAmount(options.amount);
            const data = loadData();
            const newExpense = {
                id: data.expenses.length > 0 ? Math.max(...data.expenses.map(e => e.id)) + 1 : 1,
                date: new Date().toISOString().split('T')[0],
                description: options.description,
                amount: amount,
                category: options.category || 'Uncategorized'
            };
            data.expenses.push(newExpense);
            saveData(data);
            console.log(`Expense added successfully (ID: ${newExpense.id})`);
        } catch (error) {
            console.error('Error:', error.message);
        }
    });

program
    .command('list')
    .description('List all expenses')
    .option('--category <category>', 'Filter by category')
    .action((options) => {
        const data = loadData();
        let expenses = data.expenses;
        
        if (options.category) {
            expenses = expenses.filter(e => e.category === options.category);
        }

        if (expenses.length === 0) {
            console.log('No expenses found');
            return;
        }

        console.log('ID  Date        Description  Category       Amount');
        console.log('------------------------------------------------');
        expenses.forEach(expense => {
            console.log(
                `${expense.id.toString().padEnd(4)}${expense.date}  ` +
                `${expense.description.padEnd(12)}${expense.category.padEnd(14)}${formatCurrency(expense.amount)}`
            );
        });
    });

program
    .command('update')
    .description('Update an expense')
    .requiredOption('--id <id>', 'Expense ID')
    .option('--description <description>', 'New description')
    .option('--amount <amount>', 'New amount')
    .option('--category <category>', 'New category')
    .action((options) => {
        try {
            const data = loadData();
            const expenseIndex = data.expenses.findIndex(e => e.id === parseInt(options.id));
            
            if (expenseIndex === -1) {
                console.error('Error: Expense not found');
                return;
            }

            if (options.amount) {
                options.amount = validateAmount(options.amount);
            }

            data.expenses[expenseIndex] = {
                ...data.expenses[expenseIndex],
                description: options.description || data.expenses[expenseIndex].description,
                amount: options.amount || data.expenses[expenseIndex].amount,
                category: options.category || data.expenses[expenseIndex].category
            };

            saveData(data);
            console.log('Expense updated successfully');
        } catch (error) {
            console.error('Error:', error.message);
        }
    });

program
    .command('delete')
    .description('Delete an expense')
    .requiredOption('--id <id>', 'Expense ID')
    .action((options) => {
        const data = loadData();
        const expenseIndex = data.expenses.findIndex(e => e.id === parseInt(options.id));
        
        if (expenseIndex === -1) {
            console.error('Error: Expense not found');
            return;
        }

        data.expenses.splice(expenseIndex, 1);
        saveData(data);
        console.log('Expense deleted successfully');
    });

program
    .command('summary')
    .description('Show expense summary')
    .option('--month <month>', 'Month number (1-12)')
    .option('--category <category>', 'Filter by category')
    .action((options) => {
        const data = loadData();
        let expenses = data.expenses;

        if (options.month) {
            const month = parseInt(options.month);
            if (month < 1 || month > 12) {
                console.error('Error: Month must be between 1 and 12');
                return;
            }
            expenses = expenses.filter(e => {
                const expenseMonth = new Date(e.date).getMonth() + 1;
                return expenseMonth === month;
            });
        }

        if (options.category) {
            expenses = expenses.filter(e => e.category === options.category);
        }

        const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        
        if (options.month) {
            const monthName = new Date(2024, options.month - 1).toLocaleString('default', { month: 'long' });
            console.log(`Total expenses for ${monthName}: ${formatCurrency(total)}`);
        } else {
            console.log(`Total expenses: ${formatCurrency(total)}`);
        }

        // Show category breakdown
        if (!options.category) {
            const categoryTotals = expenses.reduce((acc, expense) => {
                acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
                return acc;
            }, {});

            console.log('\nCategory Breakdown:');
            Object.entries(categoryTotals).forEach(([category, amount]) => {
                console.log(`${category}: ${formatCurrency(amount)}`);
            });
        }

        // Add budget warning
        const warning = checkBudgetWarning(expenses, options.month ? parseInt(options.month) : null);
        if (warning) {
            console.log('\n' + warning);
        }
    });

program
    .command('set-budget')
    .description('Set monthly budget')
    .requiredOption('--amount <amount>', 'Budget amount')
    .action((options) => {
        try {
            const budget = validateAmount(options.amount);
            const data = loadData();
            data.budget = budget;
            saveData(data);
            console.log(`Monthly budget set to ${formatCurrency(budget)}`);
        } catch (error) {
            console.error('Error:', error.message);
        }
    });

program
    .command('export')
    .description('Export expenses to CSV')
    .option('--output <filepath>', 'Output file path', 'expenses.csv')
    .action(async (options) => {
        try {
            const data = loadData();
            const csvWriter = createCsvWriter({
                path: options.output,
                header: [
                    {id: 'id', title: 'ID'},
                    {id: 'date', title: 'Date'},
                    {id: 'description', title: 'Description'},
                    {id: 'amount', title: 'Amount'},
                    {id: 'category', title: 'Category'}
                ]
            });
            
            await csvWriter.writeRecords(data.expenses);
            console.log(`Expenses exported to ${options.output}`);
        } catch (error) {
            console.error('Error:', error.message);
        }
    });

program.parse(process.argv);