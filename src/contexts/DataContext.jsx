
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const { user, session } = useAuth();
  const [partners, setPartners] = useState([]);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [bankDeposits, setBankDeposits] = useState([]);
  const [standardOrders, setStandardOrders] = useState([]);
  const [partnerDeliveryFees, setPartnerDeliveryFees] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (!user) {
      setLoading(false);
      return;
    }
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const [
        { data: partnersData, error: partnersError },
        { data: productsData, error: productsError },
        { data: transactionsData, error: transactionsError },
        { data: deliveriesData, error: deliveriesError },
        { data: stockMovementsData, error: stockMovementsError },
        { data: bankDepositsData, error: bankDepositsError },
        { data: standardOrdersData, error: standardOrdersError },
        { data: partnerDeliveryFeesData, error: partnerDeliveryFeesError },
        { data: salariesData, error: salariesError },
      ] = await Promise.all([
        supabase.from('partners').select('*'),
        supabase.from('products').select('*'),
        supabase.from('transactions').select('*'),
        supabase.from('deliveries').select('*'),
        supabase.from('stock_movements').select('*').order('created_at', { ascending: false }),
        supabase.from('bank_deposits').select('*'),
        supabase.from('standard_orders').select('*'),
        supabase.from('partner_delivery_fees').select('*'),
        supabase.from('salaries').select('*'),
      ]);

      if (partnersError) throw partnersError;
      if (productsError) throw productsError;
      if (transactionsError) throw transactionsError;
      if (deliveriesError) throw deliveriesError;
      if (stockMovementsError) throw stockMovementsError;
      if (bankDepositsError) throw bankDepositsError;
      if (standardOrdersError) throw standardOrdersError;
      if (partnerDeliveryFeesError) throw partnerDeliveryFeesError;
      if (salariesError) throw salariesError;

      setPartners(partnersData || []);
      setProducts(productsData || []);
      setTransactions(transactionsData || []);
      setDeliveries(deliveriesData || []);
      setStockMovements(stockMovementsData || []);
      setBankDeposits(bankDepositsData || []);
      setStandardOrders(standardOrdersData || []);
      setPartnerDeliveryFees(partnerDeliveryFeesData || []);
      setSalaries(salariesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (session) {
      fetchData();
      const interval = setInterval(() => {
        fetchData();
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [session, fetchData]);

  useEffect(() => {
    if (!session) return;

    const handleInserts = (payload, setter) => {
      setter(prev => [...prev, payload.new]);
    };

    const handleUpdates = (payload, setter) => {
      setter(prev => prev.map(item => item.id === payload.new.id ? payload.new : item));
    };

    const handleDeletes = (payload, setter) => {
      setter(prev => prev.filter(item => item.id !== payload.old.id));
    };

    const createSubscription = (table, setter) => {
      return supabase.channel(`public:${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, payload => {
          if (payload.eventType === 'INSERT') handleInserts(payload, setter);
          if (payload.eventType === 'UPDATE') handleUpdates(payload, setter);
          if (payload.eventType === 'DELETE') handleDeletes(payload, setter);
        }).subscribe();
    };
    
    const stockMovementsSubscription = supabase.channel('public:stock_movements')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stock_movements' }, payload => {
        setStockMovements(prev => [payload.new, ...prev]);
      }).subscribe();
    
    const activityLogSubscription = supabase.channel('public:activity_log')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_log' }, () => {
        // This is handled in the component itself for real-time updates.
      }).subscribe();

    const subscriptions = [
      createSubscription('partners', setPartners),
      createSubscription('products', setProducts),
      createSubscription('transactions', setTransactions),
      createSubscription('deliveries', setDeliveries),
      createSubscription('bank_deposits', setBankDeposits),
      createSubscription('standard_orders', setStandardOrders),
      createSubscription('partner_delivery_fees', setPartnerDeliveryFees),
      createSubscription('salaries', setSalaries),
      stockMovementsSubscription,
      activityLogSubscription
    ];

    return () => {
      subscriptions.forEach(sub => supabase.removeChannel(sub));
    };
  }, [session]);

  const addPartner = async (partner) => {
    const { data: partnerCodeData, error: partnerCodeError } = await supabase.rpc('generate_partner_code');
    if (partnerCodeError) throw partnerCodeError;
    const newPartnerCode = partnerCodeData;

    const newPartnerData = { ...partner, id: newPartnerCode, partner_code: newPartnerCode };
    
    const { data, error } = await supabase
      .from('partners')
      .insert([newPartnerData])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updatePartner = async (partnerId, updates) => {
    const { data, error } = await supabase.from('partners').update(updates).eq('id', partnerId).select();
    if (error) throw error;
  };

  const deletePartner = async (partnerId) => {
    const { error } = await supabase.rpc('delete_partner_and_dependents', { partner_id_to_delete: partnerId });
    if (error) throw error;
  };

  const addProduct = async (product) => {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select();
    if (error) throw error;
    return data[0];
  };

  const updateProduct = async (productId, updates) => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select();
    if (error) throw error;
  };

  const deleteProduct = async (productId) => {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) throw error;
  };

  const addTransaction = async (transaction) => {
    const { data, error } = await supabase
      .from('transactions')
      .insert([transaction])
      .select();
    if (error) throw error;
    return data[0];
  };

  const updateTransaction = async (transactionId, updates) => {
    const { data, error } = await supabase.from('transactions').update(updates).eq('id', transactionId).select();
    if (error) throw error;
  };

  const deleteTransaction = async (transactionId) => {
    const { error } = await supabase.from('transactions').delete().eq('id', transactionId);
    if (error) throw error;
  };

  const addDelivery = async (delivery) => {
    const { data, error } = await supabase
      .from('deliveries')
      .insert([delivery])
      .select();
    if (error) throw error;
    return data[0];
  };

  const addStandardOrder = async (order) => {
    const { data, error } = await supabase.from('standard_orders').insert([order]).select();
    if (error) throw error;
    return data[0];
  };

  const updateStandardOrder = async (id, updates) => {
    const { data, error } = await supabase.from('standard_orders').update(updates).eq('id', id).select();
    if (error) throw error;
  };

  const deleteStandardOrder = async (id) => {
    const { error } = await supabase.from('standard_orders').delete().eq('id', id);
    if (error) throw error;
  };

  const addPartnerDeliveryFee = async (fee) => {
    const { data, error } = await supabase.from('partner_delivery_fees').insert([fee]).select();
    if (error) throw error;
    return data[0];
  };

  const updatePartnerDeliveryFee = async (id, updates) => {
    const { data, error } = await supabase.from('partner_delivery_fees').update(updates).eq('id', id).select();
    if (error) throw error;
  };

  const deletePartnerDeliveryFee = async (id) => {
    const { error } = await supabase.from('partner_delivery_fees').delete().eq('id', id);
    if (error) throw error;
  };

  const addStockMovement = async (movement) => {
    const { data, error } = await supabase
      .from('stock_movements')
      .insert([movement])
      .select();
    if (error) throw error;
    return data[0];
  };

  const addBankDeposit = async (deposit) => {
    const { data, error } = await supabase
      .from('bank_deposits')
      .insert([deposit])
      .select();
    if (error) throw error;
    return data[0];
  };

  const addSalary = async (salary) => {
    const { data, error } = await supabase.from('salaries').insert([salary]).select();
    if (error) throw error;
    return data[0];
  };

  const updateSalary = async (salaryId, updates) => {
    const { data, error } = await supabase.from('salaries').update(updates).eq('id', salaryId).select();
    if (error) throw error;
  };

  const deleteSalary = async (salaryId) => {
    const { error } = await supabase.from('salaries').delete().eq('id', salaryId);
    if (error) throw error;
  };

  const resetAccounting = async () => {
    const { error } = await supabase.rpc('reset_accounting_data');
    if (error) throw error;
    await fetchData();
  };

  const value = {
    partners,
    products,
    transactions,
    deliveries,
    stockMovements,
    bankDeposits,
    standardOrders,
    partnerDeliveryFees,
    salaries,
    addPartner,
    updatePartner,
    deletePartner,
    addProduct,
    updateProduct,
    deleteProduct,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addDelivery,
    addStandardOrder,
    updateStandardOrder,
    deleteStandardOrder,
    addPartnerDeliveryFee,
    updatePartnerDeliveryFee,
    deletePartnerDeliveryFee,
    addStockMovement,
    addBankDeposit,
    addSalary,
    updateSalary,
    deleteSalary,
    resetAccounting,
    loading,
    isRefreshing,
    refreshData: () => fetchData(true),
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
