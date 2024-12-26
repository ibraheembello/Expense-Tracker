# Expense Tracker CLI

A command-line expense tracking application built with Node.js.

## Project Source

This project is based on the tutorial from:
[roadmap.sh/projects/expense-tracker](https://roadmap.sh/projects/expense-tracker)

## Features

- Add, update, and delete expenses
- List expenses with optional category filtering
- Monthly expense summaries
- Budget tracking with warnings
- Export expenses to CSV
- Category-based expense tracking

## Usage

```bash
# Add a new expense
node expense-tracker.js add --description "Groceries" --amount 50.00 --category "Food"

# List all expenses
node expense-tracker.js list

# Set monthly budget
node expense-tracker.js set-budget --amount 1000

# View expense summary
node expense-tracker.js summary
```
