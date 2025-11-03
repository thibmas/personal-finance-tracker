import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Wallet, PiggyBank, BarChart2, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const NavBar: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const path = location.pathname.split('/')[1];
  
  const isActive = (route: string) => path === route;
  
  const navItems = [
    { name: t('navbar.home', 'Accueil'), path: '', icon: Home },
    { name: t('navbar.expenses', 'Dépenses'), path: 'expenses', icon: Wallet },
    { name: t('navbar.income', 'Revenus'), path: 'income', icon: PiggyBank },
    { name: t('navbar.budgets', 'Budgets'), path: 'budgets', icon: BarChart2 },
    { name: t('navbar.settings', 'Paramètres'), path: 'settings', icon: Settings },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg z-10">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={`/${item.path}`}
            className={`flex flex-col items-center justify-center w-full py-1 transition-all ${
              isActive(item.path) 
                ? 'text-primary-600 dark:text-primary-400 scale-110' 
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <item.icon size={20} className={`mb-1 ${isActive(item.path) ? 'animate-pulse-slow' : ''}`} />
            <span className="text-xs font-medium">{item.name}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default NavBar;