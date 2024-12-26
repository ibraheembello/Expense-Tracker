// expense-tracker.test.js

// Mock fs module
jest.mock('fs');

// Convert exec to Promise
const execPromise = util.promisify(exec);

// Helper to run CLI commands
const runCommand = async (command) => {
    const fullCommand = `node expense-tracker.js ${command}`;
    const { stdout, stderr } = await execPromise(fullCommand);
    return { stdout, stderr };
};

describe('Expense Tracker Tests', () => {
    const mockData = {
        expenses: [
            {
                id: 1,
                date: '2024-01-15',
                description: 'Groceries',
                amount: 50.00,
                category: 'Food'
            },
            {
                id: 2,
                date: '2024-02-01',
                description: 'Gas',
                amount: 30.00,
                category: 'Transportation'
            }
        ]
    };

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
        
        // Setup mock data
        fs.readFileSync.mockReturnValue(JSON.stringify(mockData));
        fs.existsSync.mockReturnValue(true);
    });

    // Utility Function Tests
    describe('Utility Functions', () => {
        test('formatCurrency formats number correctly', () => {
            expect(formatCurrency(10.5)).toBe('$10.50');
            expect(formatCurrency(100)).toBe('$100.00');
        });

        test('validateAmount handles valid amounts', () => {
            expect(validateAmount('10.50')).toBe(10.50);
            expect(validateAmount('100')).toBe(100);
        });

        test('validateAmount throws error for invalid amounts', () => {
            expect(() => validateAmount('-10')).toThrow();
            expect(() => validateAmount('abc')).toThrow();
        });
    });

    // Command Tests
    describe('Add Command', () => {
        test('successfully adds new expense', async () => {
            const result = await runCommand('add --description "Test" --amount 50 --category "Test"');
            expect(result.stdout).toContain('Expense added successfully');
            expect(fs.writeFileSync).toHaveBeenCalled();
        });
    });

    describe('Budget Management', () => {
        test('sets monthly budget successfully', async () => {
            const result = await runCommand('set-budget --amount 1000');
            expect(result.stdout).toContain('Monthly budget set to $1000.00');
        });

        test('shows warning when expenses exceed budget', async () => {
            await runCommand('set-budget --amount 40');
            const result = await runCommand('summary');
            expect(result.stdout).toContain('WARNING: Monthly expenses');
        });
    });

    describe('Export Functionality', () => {
        test('exports expenses to CSV', async () => {
            const result = await runCommand('export --output test-expenses.csv');
            expect(result.stdout).toContain('Expenses exported to test-expenses.csv');
            expect(fs.writeFileSync).toHaveBeenCalled();
        });
    });
});
