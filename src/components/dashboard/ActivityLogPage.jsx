import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, User, Clock, Filter, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ActivityLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ userId: 'all', actionType: 'all' });
  const { toast } = useToast();

  const fetchLogs = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    
    const { data: logsData, error: logsError } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (logsError) {
      toast({ title: "❌ Erreur", description: "Impossible de charger le journal d'activités.", variant: "destructive" });
    } else {
      setLogs(logsData || []);
    }

    if (isManualRefresh) {
      setIsRefreshing(false);
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      await fetchLogs();

      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name');
      
      if (usersError) {
        toast({ title: "❌ Erreur", description: "Impossible de charger la liste des utilisateurs.", variant: "destructive" });
      } else {
        setUsers(usersData || []);
      }

      setLoading(false);
    };

    fetchInitialData();

    const channel = supabase
      .channel('public:activity_log')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_log' }, (payload) => {
        setLogs((prevLogs) => [payload.new, ...prevLogs]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const actionTypes = useMemo(() => {
    const allTypes = logs.map(log => log.action);
    return [...new Set(allTypes)];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const userMatch = filters.userId === 'all' || log.user_id === filters.userId;
      const actionMatch = filters.actionType === 'all' || log.action === filters.actionType;
      return userMatch && actionMatch;
    });
  }, [logs, filters]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Journal d'Activités</h1>
          <p className="text-gray-400">Historique en temps réel des actions sur la plateforme.</p>
        </div>
        <button
          onClick={() => fetchLogs(true)}
          disabled={isRefreshing}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 glass-effect text-white hover:bg-gray-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Actualisation...' : 'Actualiser'}
        </button>
      </motion.div>

      <Card className="glass-effect">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="text-white flex items-center gap-2"><BookOpen />Activités Récentes</CardTitle>
            <div className="flex flex-wrap items-center gap-4">
              <Filter className="text-gray-400" />
              <Select value={filters.userId} onValueChange={(value) => setFilters(prev => ({ ...prev, userId: value }))}>
                <SelectTrigger className="w-[180px] glass-effect text-white">
                  <SelectValue placeholder="Filtrer par utilisateur" />
                </SelectTrigger>
                <SelectContent className="glass-effect">
                  <SelectItem value="all">Tous les utilisateurs</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.actionType} onValueChange={(value) => setFilters(prev => ({ ...prev, actionType: value }))}>
                <SelectTrigger className="w-[180px] glass-effect text-white">
                  <SelectValue placeholder="Filtrer par action" />
                </SelectTrigger>
                <SelectContent className="glass-effect">
                  <SelectItem value="all">Toutes les actions</SelectItem>
                  {actionTypes.map(action => (
                    <SelectItem key={action} value={action}>{action}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {filteredLogs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  layout
                  className="flex items-start space-x-4 p-4 bg-gray-800/50 rounded-lg"
                >
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-grow">
                    <p className="text-white">
                      <span className="font-bold">{log.user_full_name || 'Système'}</span> a effectué l'action : <span className="font-semibold text-green-400">{log.action}</span>
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {log.details && Object.entries(log.details).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(' | ')}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500 flex-shrink-0 text-right">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(log.created_at), 'dd MMM yyyy, HH:mm:ss', { locale: fr })}
                    </div>
                  </div>
                </motion.div>
              ))}
              {filteredLogs.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-4" />
                  <p>Aucune activité correspondant aux filtres actuels.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityLogPage;