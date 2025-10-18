import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Bell, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = ({ onMenuClick }) => {
  const { user, signOut } = useAuth();
  const { getUnreadCount } = useNotifications();
  const unreadCount = getUnreadCount();

  const getRoleDisplayName = (role) => {
    const roleNames = {
      ceo: 'CEO',
      accountant: 'Comptable',
      secretary: 'Secrétaire',
      partner: 'Partenaire'
    };
    return roleNames[role] || role;
  };

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-gray-900/80 backdrop-blur-md border-b border-gray-700 px-4 sm:px-6 py-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
           <Button
            variant="ghost"
            size="icon"
            className="text-gray-300 hover:bg-gray-700 lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="w-6 h-6" />
          </Button>
          <div>
            <span className="text-xl sm:text-2xl font-bold text-white">Dashboard</span>
            <p className="text-gray-400 text-xs sm:text-sm">Bienvenue, {user?.user_metadata?.full_name}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <Link to="/dashboard/notifications">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-300 hover:bg-gray-700 relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center notification-pulse">
                  {unreadCount}
                </span>
              )}
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.full_name} />
                  <AvatarFallback className="bg-green-500 text-white">
                    {user?.user_metadata?.full_name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 glass-effect border-gray-700" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-white">{user?.user_metadata?.full_name}</p>
                  <p className="text-xs leading-none text-gray-400">
                    {getRoleDisplayName(user?.user_metadata?.role)}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem asChild className="cursor-pointer text-gray-300 focus:bg-gray-700 focus:text-white">
                <Link to="/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </Link>
              </DropdownMenuItem>
              {user?.user_metadata?.role === 'ceo' && (
                <DropdownMenuItem asChild className="cursor-pointer text-gray-300 focus:bg-gray-700 focus:text-white">
                  <Link to="/dashboard/settings">
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Paramètres</span>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem onClick={signOut} className="cursor-pointer text-red-400 focus:bg-red-500/20 focus:text-red-400">
                <span>Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;