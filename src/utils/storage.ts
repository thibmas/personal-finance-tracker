import { AppData } from '../types';

const STORAGE_KEY = 'finance_tracker_data';

// Default categories
export const defaultCategories = [
  { id: '1', name: 'Solde initial', type: 'income' as const, color: '#EF4444', icon: '' },
  { id: '2', name: 'Revenus professionnels', type: 'income' as const, color: '#F59E0B', icon: '' },
  { id: '3', name: 'Prime', type: 'income' as const, color: '#1ab783', icon: '' },
  { id: '4', name: 'Achat', type: 'expense' as const, color: '#f27379', icon: '' },
  { id: '5', name: 'Course Alimentation', type: 'expense' as const, color: '#deafe4', icon: '' },
  { id: '6', name: 'Numérique Téléphonie', type: 'expense' as const, color: '#f7ef97', icon: '' },
  { id: '7', name: 'Sortie', type: 'expense' as const, color: '#ff8e7a', icon: '' },
  { id: '8', name: 'Voiture', type: 'expense' as const, color: '#f28073', icon: '' },
  { id: '9', name: 'Bébé', type: 'expense' as const, color: '#f0a3d4', icon: '' },
  { id: '10', name: 'Santé', type: 'expense' as const, color: '#ffcfa8', icon: '' },
  { id: '11', name: 'Epargne', type: 'expense' as const, color: '#a76fec', icon: '' },
  { id: '12', name: 'Assurance', type: 'expense' as const, color: '#ff99bd', icon: '' },
  { id: '13', name: 'Restaurant', type: 'expense' as const, color: '#f0d589', icon: '' },
  { id: '14', name: 'Essence', type: 'expense' as const, color: '#b1c8ec', icon: '' },
  { id: '15', name: 'Logement', type: 'expense' as const, color: '#a6f995', icon: '' },
  { id: '16', name: 'Frais compte', type: 'expense' as const, color: '#91a3ee', icon: '' },
  { id: '17', name: 'Hors Budget', type: 'expense' as const, color: '#afe8f3', icon: '' },
  { id: '18', name: 'Energie', type: 'expense' as const, color: '#b795e9', icon: '' },
  { id: '19', name: 'Impôts', type: 'expense' as const, color: '#a8e1b9', icon: '' },
  { id: '02d193b1-3276-40c4-8aeb-c8449a399ed9', name: 'Début de mois', type: 'expense' as const, color: '#f5b3d6', icon: '' },
];

// Default settings
const defaultSettings = {
  currency: 'USD',
  firstDayOfMonth: 1,
  theme: 'system' as 'system',
};

// Initial app data
const initialData: AppData = {
  transactions: [],
  budgets: [],
  categories: defaultCategories,
  settings: defaultSettings,
};

// Load data from localStorage
export const loadData = (): AppData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return initialData;
  } catch (error) {
    console.error('Error loading data from localStorage:', error);
    return initialData;
  }
};

// Save data to localStorage
export const saveData = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data to localStorage:', error);
  }
};

// Export data as JSON file
export const exportData = (): void => {
  try {
    const data = loadData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `finance_tracker_backup_${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting data:', error);
  }
};

// Import data from JSON file
export const importData = (file: File): Promise<AppData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        if (event.target?.result) {
          const importedData = JSON.parse(event.target.result as string) as AppData;
          saveData(importedData);
          resolve(importedData);
        }
      } catch (error) {
        reject(new Error('Invalid file format'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file);
  });
};

// Export data as CSV
export const exportCSV = (type: 'transactions' | 'budgets'): void => {
  try {
    const data = loadData();
    let csv = '';
    let filename = '';
    
    if (type === 'transactions') {
      // Create headers
      csv = 'ID,Type,Amount,Date,Category,Description,Notes\n';
      
      // Add rows
      data.transactions.forEach((t) => {
        csv += `${t.id},${t.type},${t.amount},${t.date},${t.category},${t.description},${t.notes || ''}\n`;
      });
      
      filename = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'budgets') {
      // Create headers
      csv = 'ID,Category,Amount,Period,Start Date,Notes\n';
      
      // Add rows
      data.budgets.forEach((b) => {
        csv += `${b.id},${b.category},${b.amount},${b.period},${b.startDate},${b.notes || ''}\n`;
      });
      
      filename = `budgets_${new Date().toISOString().split('T')[0]}.csv`;
    }
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting CSV:', error);
  }
};