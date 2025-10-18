import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { 
  Home, 
  Users, 
  Package, 
  Calculator, 
  Bell,
  Settings,
  LogOut,
  FileDown,
  UserCog,
  Wallet,
  X,
  BarChart3,
  BookOpen,
  User as UserIcon,
  Folder,
} from 'lucide-react';
import { Button } from './ui/button';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, signOut } = useAuth();
  const { getUnreadCount } = useNotifications();
  const location = useLocation();
  const unreadCount = getUnreadCount();
  const userRole = user?.user_metadata?.role;

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const getMenuItems = () => {
    const baseItems = [
      { icon: Home, label: 'Accueil', path: '/dashboard', roles: ['ceo', 'accountant', 'secretary', 'partner'] }
    ];

    const roleSpecificItems = {
      ceo: [
        { icon: BarChart3, label: 'Statistiques', path: '/dashboard/statistics' },
        { icon: Calculator, label: 'Comptabilité', path: '/dashboard/accounting' },
        { icon: Folder, label: 'Dossiers', path: '/dashboard/documents' },
        { icon: Wallet, label: 'Salaires', path: '/dashboard/salaries' },
        { icon: UserCog, label: 'Utilisateurs', path: '/dashboard/users' },
        { icon: Users, label: 'Partenaires', path: '/dashboard/partners' },
        { icon: Package, label: 'Stock', path: '/dashboard/stock' },
        { icon: Bell, label: 'Notifications', path: '/dashboard/notifications', badge: unreadCount },
        { icon: BookOpen, label: 'Journal', path: '/dashboard/activity-log' },
        { icon: FileDown, label: 'Exporter', path: '/dashboard/export' },
        { icon: Settings, label: 'Paramètres', path: '/dashboard/settings' }
      ],
      accountant: [
        { icon: Calculator, label: 'Comptabilité', path: '/dashboard/accounting' },
        { icon: Folder, label: 'Dossiers', path: '/dashboard/documents' },
        { icon: Wallet, label: 'Salaires', path: '/dashboard/salaries' },
        { icon: Package, label: 'Stock', path: '/dashboard/stock' },
        { icon: Bell, label: 'Notifications', path: '/dashboard/notifications', badge: unreadCount }
      ],
      secretary: [
        { icon: Users, label: 'Partenaires', path: '/dashboard/partners' },
        { icon: Bell, label: 'Notifications', path: '/dashboard/notifications', badge: unreadCount }
      ],
      partner: [
        { icon: Package, label: 'Mon Stock', path: '/dashboard/partner-view' },
        { icon: Bell, label: 'Notifications', path: '/dashboard/notifications', badge: unreadCount }
      ]
    };

    return [...baseItems, ...(roleSpecificItems[userRole] || [])];
  };

  const menuItems = getMenuItems();
  const profilePath = '/dashboard/profile';

  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: '-100%' },
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={onClose}></div>}
      <motion.div
        variants={sidebarVariants}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-64 sidebar-gradient shadow-2xl flex flex-col fixed lg:relative h-full z-40"
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="https://horizons-cdn.hostinger.com/e3bf3fca-eb78-4718-9ff8-e58f202bb4d5/23d6fa77a496b438d2f61d99b3149c2d.png" alt="Eno Livraison Logo" className="w-12 h-12" />
            <div>
              <span className="text-xl font-bold gradient-text">Eno Livraison</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden text-white" onClick={onClose}>
            <X className="w-6 h-6" />
          </Button>
        </div>

        <nav className="mt-8 px-4 flex-grow overflow-y-auto scrollbar-hide">
          <ul className="space-y-2">
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <motion.li
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={item.path}
                    onClick={handleLinkClick}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? 'bg-green-500/20 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-green-500/10 hover:text-white'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                    <span className="font-medium">{item.label}</span>
                    {item.badge > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1 notification-pulse">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </nav>

        <div className="px-4 pb-6">
           <Link
            to={profilePath}
            onClick={handleLinkClick}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 w-full mb-2 ${
              location.pathname === profilePath
                ? 'bg-green-500/20 text-white shadow-lg'
                : 'text-gray-300 hover:bg-green-500/10 hover:text-white'
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="font-medium">Mon Profil</span>
          </Link>
          <button
            onClick={() => {
              signOut();
              handleLinkClick();
            }}
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200 w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Déconnexion</span>
          </button>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;