import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList, PieChart, Pie } from 'recharts';
import { Plus, Package, LogOut } from 'lucide-react';

const SIZES = ['5ml', '10ml', '100ml'];
const VIALS_PER_PACK = { '5ml': 5, '10ml': 5, '100ml': 1 };

// In-memory storage for artifact environment
const memoryStorage = {};
const storage = {
  async get(key) {
    return memoryStorage[key] ? { value: memoryStorage[key] } : null;
  },
  async set(key, value) {
    memoryStorage[key] = value;
  },
  async delete(key) {
    delete memoryStorage[key];
  }
};

const AuditTag = ({ createdBy, createdAt }) => {
  if (!createdBy && !createdAt) return null;
  const formatDateTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  return (
    <div className="text-xs text-gray-400 mt-1">
      {createdBy && <span className="font-medium">{createdBy}</span>}
      {createdBy && createdAt && <span> • </span>}
      {createdAt && <span>{formatDateTime(createdAt)}</span>}
    </div>
  );
};

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSize, setActiveSize] = useState('5ml');
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [pipelinePurchases, setPipelinePurchases] = useState([]);
  const [stockHolds, setStockHolds] = useState([]);
  const [stockAdjustments, setStockAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLogin();
    loadAllData();
  }, []);

  const checkLogin = async () => {
    try {
      const sessionData = await storage.get('current-session');
      if (sessionData) setCurrentUser(JSON.parse(sessionData.value));
    } catch (e) { console.log('No session'); }
  };

  const loadAllData = async () => {
    try {
      const [salesData, purchasesData, customersData, suppliersData, pipelineData, stockHoldsData, stockAdjustmentsData] = await Promise.all([
        storage.get('sales-data').catch(() => null),
        storage.get('purchases-data').catch(() => null),
        storage.get('customers-data').catch(() => null),
        storage.get('suppliers-data').catch(() => null),
        storage.get('pipeline-purchases-data').catch(() => null),
        storage.get('stock-holds-data').catch(() => null),
        storage.get('stock-adjustments-data').catch(() => null)
      ]);
      if (salesData) setSales(JSON.parse(salesData.value));
      if (purchasesData) setPurchases(JSON.parse(purchasesData.value));
      if (customersData) setCustomers(JSON.parse(customersData.value));
      if (suppliersData) setSuppliers(JSON.parse(suppliersData.value));
      if (pipelineData) setPipelinePurchases(JSON.parse(pipelineData.value));
      if (stockHoldsData) setStockHolds(JSON.parse(stockHoldsData.value));
      if (stockAdjustmentsData) setStockAdjustments(JSON.parse(stockAdjustmentsData.value));
    } catch (e) { console.log('Error loading data'); }
    setLoading(false);
  };

  const handleLogin = async (username, password) => {
    try {
      let users = [];
      try {
        const usersData = await storage.get('users');
        if (usersData) users = JSON.parse(usersData.value);
      } catch (e) {}
      if (users.length === 0) {
        users = [{ id: 'admin-1', username: 'admin', password: 'admin123', role: 'admin', name: 'Administrator', initials: 'ADM' }];
        await storage.set('users', JSON.stringify(users));
      }
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
      if (user) {
        const session = { id: user.id, username: user.username, role: user.role, name: user.name, initials: user.initials || user.username.substring(0, 3).toUpperCase() };
        setCurrentUser(session);
        await storage.set('current-session', JSON.stringify(session));
        return { success: true };
      }
      return { success: false, error: 'Invalid credentials' };
    } catch (e) { return { success: false, error: 'Login failed' }; }
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    await storage.delete('current-session').catch(() => {});
  };

  const saveData = async (key, data) => {
    await storage.set(key, JSON.stringify(data)).catch(() => {});
  };

  const addSale = async (sale) => {
    const auditInfo = { createdBy: currentUser?.initials || 'SYS', createdAt: new Date().toISOString() };
    const newSales = [...sales, { ...sale, ...auditInfo, id: Date.now(), date: new Date().toISOString() }];
    setSales(newSales);
    await saveData('sales-data', newSales);
  };

  const deleteSale = async (id) => {
    const newSales = sales.filter(s => s.id !== id);
    setSales(newSales);
    await saveData('sales-data', newSales);
  };

  const addPurchase = async (purchase) => {
    const auditInfo = { createdBy: currentUser?.initials || 'SYS', createdAt: new Date().toISOString() };
    const newPurchases = [...purchases, { ...purchase, ...auditInfo, id: Date.now(), date: new Date().toISOString() }];
    setPurchases(newPurchases);
    await saveData('purchases-data', newPurchases);
  };

  const deletePurchase = async (id) => {
    const newPurchases = purchases.filter(p => p.id !== id);
    setPurchases(newPurchases);
    await saveData('purchases-data', newPurchases);
  };

  const addCustomer = async (customer) => {
    const auditInfo = { createdBy: currentUser?.initials || 'SYS', createdAt: new Date().toISOString() };
    const newCustomers = [...customers, { ...customer, ...auditInfo, id: Date.now() }];
    setCustomers(newCustomers);
    await saveData('customers-data', newCustomers);
  };

  const deleteCustomer = async (id) => {
    const newCustomers = customers.filter(c => c.id !== id);
    setCustomers(newCustomers);
    await saveData('customers-data', newCustomers);
  };

  const addSupplier = async (supplier) => {
    const auditInfo = { createdBy: currentUser?.initials || 'SYS', createdAt: new Date().toISOString() };
    const newSuppliers = [...suppliers, { ...supplier, ...auditInfo, id: Date.now() }];
    setSuppliers(newSuppliers);
    await saveData('suppliers-data', newSuppliers);
  };

  const deleteSupplier = async (id) => {
    const newSuppliers = suppliers.filter(s => s.id !== id);
    setSuppliers(newSuppliers);
    await saveData('suppliers-data', newSuppliers);
  };

  const addPipelinePurchase = async (pp) => {
    const auditInfo = { createdBy: currentUser?.initials || 'SYS', createdAt: new Date().toISOString() };
    const newPP = [...pipelinePurchases, { ...pp, ...auditInfo, id: Date.now() }];
    setPipelinePurchases(newPP);
    await saveData('pipeline-purchases-data', newPP);
  };

  const deletePipelinePurchase = async (id) => {
    const newPP = pipelinePurchases.filter(p => p.id !== id);
    setPipelinePurchases(newPP);
    await saveData('pipeline-purchases-data', newPP);
  };

  const addStockHold = async (hold) => {
    const auditInfo = { createdBy: currentUser?.initials || 'SYS', createdAt: new Date().toISOString() };
    const newHolds = [...stockHolds, { ...hold, ...auditInfo, id: Date.now() }];
    setStockHolds(newHolds);
    await saveData('stock-holds-data', newHolds);
  };

  const deleteStockHold = async (id) => {
    const newHolds = stockHolds.filter(h => h.id !== id);
    setStockHolds(newHolds);
    await saveData('stock-holds-data', newHolds);
  };

  const addStockAdjustment = async (adjustment) => {
    const auditInfo = { createdBy: currentUser?.initials || 'SYS', createdAt: new Date().toISOString() };
    const newAdjustments = [...stockAdjustments, { ...adjustment, ...auditInfo, id: Date.now(), date: new Date().toISOString() }];
    setStockAdjustments(newAdjustments);
    await saveData('stock-adjustments-data', newAdjustments);
  };

  const deleteStockAdjustment = async (id) => {
    const newAdjustments = stockAdjustments.filter(a => a.id !== id);
    setStockAdjustments(newAdjustments);
    await saveData('stock-adjustments-data', newAdjustments);
  };

  // Verify user password for secure operations
  const verifyPassword = async (username, password) => {
    try {
      const usersData = await storage.get('users');
      if (!usersData) return false;
      const users = JSON.parse(usersData.value);
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
      return !!user;
    } catch (e) { return false; }
  };

  // Convert stock hold to sale
  const convertHoldToSale = async (holdId, saleDetails) => {
    const hold = stockHolds.find(h => h.id === holdId);
    if (!hold) return { success: false, error: 'Stock hold not found' };

    const auditInfo = { 
      createdBy: currentUser?.initials || 'SYS', 
      createdAt: new Date().toISOString(),
      convertedFrom: 'stockHold',
      originalHoldId: holdId,
      convertedBy: currentUser?.initials || 'SYS'
    };

    const newSale = {
      ...saleDetails,
      customer: hold.customer,
      country: hold.country,
      endDestination: hold.endDestination,
      size: hold.size,
      units: hold.units,
      vials: hold.vials,
      ...auditInfo,
      id: Date.now(),
      date: new Date().toISOString()
    };

    // Add the sale
    const newSales = [...sales, newSale];
    setSales(newSales);
    await saveData('sales-data', newSales);

    // Remove the stock hold
    const newHolds = stockHolds.filter(h => h.id !== holdId);
    setStockHolds(newHolds);
    await saveData('stock-holds-data', newHolds);

    return { success: true, saleId: newSale.id };
  };

  // Revert sale back to stock hold (Admin only)
  const revertSaleToHold = async (saleId) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return { success: false, error: 'Sale not found' };
    if (!sale.convertedFrom || sale.convertedFrom !== 'stockHold') {
      return { success: false, error: 'This sale was not converted from a stock hold' };
    }

    const auditInfo = { 
      createdBy: currentUser?.initials || 'SYS', 
      createdAt: new Date().toISOString(),
      revertedFrom: 'sale',
      originalSaleId: saleId,
      revertedBy: currentUser?.initials || 'SYS'
    };

    // Recreate the stock hold
    const newHold = {
      customer: sale.customer,
      country: sale.country,
      endDestination: sale.endDestination,
      size: sale.size,
      units: sale.units,
      vials: sale.vials || (sale.units * VIALS_PER_PACK[sale.size]),
      notes: `Reverted from sale on ${new Date().toLocaleDateString()}`,
      holdDate: new Date().toISOString().split('T')[0],
      ...auditInfo,
      id: Date.now()
    };

    // Add the stock hold back
    const newHolds = [...stockHolds, newHold];
    setStockHolds(newHolds);
    await saveData('stock-holds-data', newHolds);

    // Remove the sale
    const newSales = sales.filter(s => s.id !== saleId);
    setSales(newSales);
    await saveData('sales-data', newSales);

    return { success: true, holdId: newHold.id };
  };

  const calcMetrics = () => {
    const m = {};
    SIZES.forEach(size => {
      const ss = sales.filter(s => s.size === size);
      const ps = purchases.filter(p => p.size === size);
      const adj = stockAdjustments.filter(a => a.size === size);
      const sold = ss.reduce((a, s) => a + (parseFloat(s.units) || 0), 0);
      const purchased = ps.reduce((a, p) => a + (parseFloat(p.units) || 0), 0);
      const adjusted = adj.reduce((a, x) => a + (parseFloat(x.units) || 0), 0); // samples/adjustments taken out
      const adjustedValue = adj.reduce((a, x) => a + (parseFloat(x.units) || 0) * (parseFloat(x.costPerPack) || 0), 0);
      const revenue = ss.reduce((a, s) => a + (parseFloat(s.units) || 0) * (parseFloat(s.price) || 0), 0);
      const cost = ps.reduce((a, p) => a + (parseFloat(p.units) || 0) * (parseFloat(p.cost) || 0), 0);
      const avgCost = purchased > 0 ? cost / purchased : 0;
      const stock = purchased - sold - adjusted; // subtract samples from stock
      const vialsPerPack = VIALS_PER_PACK[size];
      const soldVials = sold * vialsPerPack;
      const purchasedVials = purchased * vialsPerPack;
      const adjustedVials = adjusted * vialsPerPack;
      const stockVials = stock * vialsPerPack;
      m[size] = { 
        stock, revenue, cost, sold, purchased, adjusted,
        stockValue: stock * avgCost, 
        margin: revenue - (sold * avgCost),
        adjustedValue,
        vialsPerPack,
        soldVials,
        purchasedVials,
        adjustedVials,
        stockVials
      };
    });
    return m;
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="text-lg">Loading...</div></div>;
  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;

  const isAdmin = currentUser.role === 'admin';
  const metrics = calcMetrics();
  const totalStock = SIZES.reduce((a, s) => a + metrics[s].stock, 0);
  const totalStockVials = SIZES.reduce((a, s) => a + metrics[s].stockVials, 0);
  const totalRevenue = SIZES.reduce((a, s) => a + metrics[s].revenue, 0);
  const totalMargin = SIZES.reduce((a, s) => a + metrics[s].margin, 0);
  const totalStockValue = SIZES.reduce((a, s) => a + metrics[s].stockValue, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="shadow-sm border-b" style={{ backgroundColor: '#ccd5ae' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Eurofolic<sup className="text-xs">®</sup> CIMS</h1>
            <p className="text-sm"><span className="bg-black text-yellow-400 px-2 py-0.5 font-medium">Customer & Inventory Management System</span></p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium">{currentUser.name}</div>
              <div className="text-xs text-gray-700">{isAdmin ? 'Administrator' : 'User'}</div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 flex space-x-1 border-b -mb-px">
          {['dashboard', 'sales', 'purchases', 'pipeline', 'reports', ...(isAdmin ? ['setup'] : [])].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium text-sm capitalize ${activeTab === tab ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' && <Dashboard metrics={metrics} totalStock={totalStock} totalStockVials={totalStockVials} totalRevenue={totalRevenue} totalMargin={totalMargin} totalStockValue={totalStockValue} sales={sales} purchases={purchases} stockAdjustments={stockAdjustments} />}
        {activeTab === 'sales' && <Sales sales={sales} addSale={addSale} deleteSale={deleteSale} stockHolds={stockHolds} addStockHold={addStockHold} deleteStockHold={deleteStockHold} stockAdjustments={stockAdjustments} addStockAdjustment={addStockAdjustment} deleteStockAdjustment={deleteStockAdjustment} convertHoldToSale={convertHoldToSale} revertSaleToHold={revertSaleToHold} verifyPassword={verifyPassword} currentUser={currentUser} activeSize={activeSize} setActiveSize={setActiveSize} isAdmin={isAdmin} customers={customers} purchases={purchases} />}
        {activeTab === 'purchases' && <Purchases purchases={purchases} addPurchase={addPurchase} deletePurchase={deletePurchase} activeSize={activeSize} setActiveSize={setActiveSize} isAdmin={isAdmin} suppliers={suppliers} />}
        {activeTab === 'pipeline' && <Pipeline pipelinePurchases={pipelinePurchases} addPipelinePurchase={addPipelinePurchase} deletePipelinePurchase={deletePipelinePurchase} isAdmin={isAdmin} suppliers={suppliers} />}
        {activeTab === 'reports' && <Reports sales={sales} purchases={purchases} stockAdjustments={stockAdjustments} />}
        {activeTab === 'setup' && isAdmin && <Setup customers={customers} addCustomer={addCustomer} deleteCustomer={deleteCustomer} suppliers={suppliers} addSupplier={addSupplier} deleteSupplier={deleteSupplier} onDataRestore={loadAllData} />}
      </div>
    </div>
  );
};

const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!username || !password) { setError('Enter credentials'); return; }
    const result = await onLogin(username, password);
    if (!result.success) setError(result.error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Eurofolic<sup className="text-xs">®</sup> CIMS</h1>
          <p className="text-sm mt-2"><span className="bg-black text-yellow-400 px-2 py-0.5 font-medium">Customer & Inventory Management System</span></p>
        </div>
        <div className="space-y-4">
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSubmit()} placeholder="Username" className="w-full border rounded-lg px-3 py-2" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSubmit()} placeholder="Password" className="w-full border rounded-lg px-3 py-2" />
          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <button onClick={handleSubmit} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Sign In</button>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ metrics, totalStock, totalStockVials, totalRevenue, totalMargin, totalStockValue, sales, purchases, stockAdjustments }) => {
  const [selectedYear, setSelectedYear] = useState('all');
  const chartData = SIZES.map(s => ({ name: s, packs: metrics[s].stock, vials: metrics[s].stockVials }));
  const years = [...new Set(sales.map(s => new Date(s.saleDate || s.date).getFullYear()))].sort((a, b) => b - a);
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];

  const totalAdjusted = SIZES.reduce((a, s) => a + (metrics[s].adjusted || 0), 0);
  const totalAdjustedVials = SIZES.reduce((a, s) => a + (metrics[s].adjustedVials || 0), 0);
  const totalAdjustedValue = SIZES.reduce((a, s) => a + (metrics[s].adjustedValue || 0), 0);

  const getCountrySales = () => {
    const filtered = selectedYear === 'all' ? sales : sales.filter(s => {
      const d = s.saleDate || s.date;
      return d && new Date(d).getFullYear() === parseInt(selectedYear);
    });
    
    const countryData = {};
    let total = 0;
    
    filtered.forEach(s => {
      const country = s.endDestination || s.country || 'Unknown';
      const value = (parseFloat(s.units) || 0) * (parseFloat(s.price) || 0);
      countryData[country] = (countryData[country] || 0) + value;
      total += value;
    });
    
    return {
      data: Object.entries(countryData)
        .map(([country, value]) => ({ country, value, percentage: total > 0 ? ((value / total) * 100).toFixed(1) : 0 }))
        .sort((a, b) => b.value - a.value),
      total
    };
  };
  
  const countrySales = getCountrySales();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Eurofolic<sup className="text-xs">®</sup> I-View</h3>
          <p className="text-xs text-gray-500 mt-1">5ml & 10ml: 5 vials per pack | 100ml: 1 vial per pack</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Purchased</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sold</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-orange-600 uppercase">Samples</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock (Packs)</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock (Vials)</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock Value</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-orange-600 uppercase">Samples Value</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {SIZES.map((size) => (
                <tr key={size} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{size}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-600">{metrics[size].purchased}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-600">{metrics[size].sold}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-orange-600">{metrics[size].adjusted || 0} <span className="text-xs text-orange-400">({metrics[size].adjustedVials || 0}v)</span></td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-bold">
                    <span className={metrics[size].stock <= 0 ? 'text-red-600' : 'text-green-600'}>{metrics[size].stock}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-bold">
                    <span className={metrics[size].stockVials <= 0 ? 'text-red-600' : 'text-green-600'}>{metrics[size].stockVials}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">€{metrics[size].stockValue.toFixed(2)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-orange-600">€{(metrics[size].adjustedValue || 0).toFixed(2)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-blue-600">€{metrics[size].revenue.toFixed(2)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-purple-600">€{metrics[size].margin.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="bg-green-100 font-bold">
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">TOTAL</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">{SIZES.reduce((a, s) => a + metrics[s].purchased, 0)}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">{SIZES.reduce((a, s) => a + metrics[s].sold, 0)}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-orange-600">{totalAdjusted} <span className="text-xs text-orange-500">({totalAdjustedVials}v)</span></td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">{totalStock}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">{totalStockVials}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">€{totalStockValue.toFixed(2)}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-orange-600">€{totalAdjustedValue.toFixed(2)}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-blue-600">€{totalRevenue.toFixed(2)}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-purple-600">€{totalMargin.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Stock by Size (Chart)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="packs" fill="#3b82f6" name="Packs">
              <LabelList dataKey="packs" position="top" fill="#3b82f6" fontWeight="bold" fontSize={12} />
            </Bar>
            <Bar dataKey="vials" fill="#10b981" name="Vials">
              <LabelList dataKey="vials" position="top" fill="#10b981" fontWeight="bold" fontSize={12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Sales by End Destination</h3>
            <p className="text-sm text-gray-500">Total: €{countrySales.total.toFixed(2)}</p>
          </div>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            <option value="all">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        
        {countrySales.data.length > 0 ? (
          <div className="p-6">
            <div className="mb-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={countrySales.data} cx="50%" cy="50%" labelLine={true} label={({ country, percentage }) => `${country}: ${percentage}%`} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="country">
                    {countrySales.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`€${value.toFixed(2)}`, 'Sales']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sales Value</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {countrySales.data.map((item, index) => (
                    <tr key={item.country} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                        {item.country}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-blue-600 font-semibold">€{item.value.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">{item.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">No sales data available {selectedYear !== 'all' ? `for ${selectedYear}` : ''}</div>
        )}
      </div>
    </div>
  );
};

const Sales = ({ sales, addSale, deleteSale, stockHolds, addStockHold, deleteStockHold, stockAdjustments, addStockAdjustment, deleteStockAdjustment, convertHoldToSale, revertSaleToHold, verifyPassword, currentUser, activeSize, setActiveSize, isAdmin, customers, purchases }) => {
  const [showForm, setShowForm] = useState(false);
  const [showHoldForm, setShowHoldForm] = useState(false);
  const [showSampleForm, setShowSampleForm] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [selectedHold, setSelectedHold] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [convertForm, setConvertForm] = useState({ batchNumber: '', pricePerVial: '', saleDate: new Date().toISOString().split('T')[0], password: '' });
  const [revertPassword, setRevertPassword] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [form, setForm] = useState({ customerId: '', customer: '', country: '', endDestination: '', batchNumber: '', vials: '', pricePerVial: '', saleDate: new Date().toISOString().split('T')[0] });
  const [holdForm, setHoldForm] = useState({ customerId: '', customer: '', country: '', endDestination: '', vials: '', notes: '', holdDate: new Date().toISOString().split('T')[0] });
  const [sampleForm, setSampleForm] = useState({ batchNumber: '', vials: '', reason: 'Retention Sample', recipient: '', notes: '', adjustmentDate: new Date().toISOString().split('T')[0] });

  const SAMPLE_REASONS = ['Retention Sample', 'Quality Testing', 'Customer Sample', 'Marketing Sample', 'Regulatory Sample', 'Other'];

  const getBatches = () => {
    const ps = purchases.filter(p => p.size === activeSize);
    const ss = sales.filter(s => s.size === activeSize);
    const adj = stockAdjustments.filter(a => a.size === activeSize);
    const batches = {};
    ps.forEach(p => { if (!batches[p.batchNumber]) batches[p.batchNumber] = { purchased: 0, sold: 0, adjusted: 0, supplier: p.supplier, expiryDate: p.expiryDate, cost: p.cost }; batches[p.batchNumber].purchased += parseFloat(p.units) || 0; });
    ss.forEach(s => { if (batches[s.batchNumber]) batches[s.batchNumber].sold += parseFloat(s.units) || 0; });
    adj.forEach(a => { if (batches[a.batchNumber]) batches[a.batchNumber].adjusted += parseFloat(a.units) || 0; });
    return Object.entries(batches).filter(([k, v]) => v.purchased - v.sold - v.adjusted > 0).map(([k, v]) => ({ batch: k, availablePacks: v.purchased - v.sold - v.adjusted, availableVials: (v.purchased - v.sold - v.adjusted) * VIALS_PER_PACK[activeSize], supplier: v.supplier, expiryDate: v.expiryDate, costPerPack: v.cost }));
  };

  // Get batch cost for samples (at cost price)
  const getBatchCost = (batchNumber) => {
    const purchase = purchases.find(p => p.batchNumber === batchNumber && p.size === activeSize);
    return purchase ? purchase.cost : 0; // cost per pack
  };

  const handleCustomer = (id) => {
    const c = customers.find(c => c.id === parseInt(id));
    setForm({ ...form, customerId: id, customer: c ? c.name : '', country: c ? c.country : '' });
  };

  const handleHoldCustomer = (id) => {
    const c = customers.find(c => c.id === parseInt(id));
    setHoldForm({ ...holdForm, customerId: id, customer: c ? c.name : '', country: c ? c.country : '' });
  };

  const handleSubmit = () => {
    if (!form.customer || !form.batchNumber || !form.vials || !form.pricePerVial || !form.endDestination) { alert('Fill all fields including End Destination'); return; }
    const vials = parseFloat(form.vials);
    const vialsPerPack = VIALS_PER_PACK[activeSize];
    const packs = vials / vialsPerPack;
    const pricePerPack = parseFloat(form.pricePerVial) * vialsPerPack;
    addSale({ ...form, size: activeSize, units: packs, price: pricePerPack });
    setForm({ customerId: '', customer: '', country: '', endDestination: '', batchNumber: '', vials: '', pricePerVial: '', saleDate: new Date().toISOString().split('T')[0] });
    setShowForm(false);
  };

  const handleHoldSubmit = () => {
    if (!holdForm.customer || !holdForm.vials || !holdForm.endDestination) { alert('Customer, vials, and End Destination are required'); return; }
    const vials = parseFloat(holdForm.vials);
    const vialsPerPack = VIALS_PER_PACK[activeSize];
    const packs = vials / vialsPerPack;
    addStockHold({ ...holdForm, size: activeSize, units: packs, vials: vials });
    setHoldForm({ customerId: '', customer: '', country: '', endDestination: '', vials: '', notes: '', holdDate: new Date().toISOString().split('T')[0] });
    setShowHoldForm(false);
  };

  const handleSampleSubmit = () => {
    if (!sampleForm.batchNumber || !sampleForm.vials || !sampleForm.reason) { 
      alert('Batch, vials, and reason are required'); 
      return; 
    }
    const vials = parseFloat(sampleForm.vials);
    const vialsPerPack = VIALS_PER_PACK[activeSize];
    const packs = vials / vialsPerPack;
    const costPerPack = getBatchCost(sampleForm.batchNumber);
    
    addStockAdjustment({ 
      ...sampleForm, 
      size: activeSize, 
      units: packs, 
      vials: vials,
      costPerPack: costPerPack,
      totalCost: packs * costPerPack
    });
    setSampleForm({ batchNumber: '', vials: '', reason: 'Retention Sample', recipient: '', notes: '', adjustmentDate: new Date().toISOString().split('T')[0] });
    setShowSampleForm(false);
  };

  // Open convert modal for a stock hold
  const openConvertModal = (hold) => {
    setSelectedHold(hold);
    setConvertForm({ batchNumber: '', pricePerVial: '', saleDate: new Date().toISOString().split('T')[0], password: '' });
    setModalError('');
    setShowConvertModal(true);
  };

  // Handle convert stock hold to sale
  const handleConvertToSale = async () => {
    if (!convertForm.batchNumber || !convertForm.pricePerVial || !convertForm.password) {
      setModalError('Please fill all fields including your password');
      return;
    }

    setModalLoading(true);
    setModalError('');

    // Verify password
    const isValid = await verifyPassword(currentUser.username, convertForm.password);
    if (!isValid) {
      setModalError('Invalid password. Please try again.');
      setModalLoading(false);
      return;
    }

    const vialsPerPack = VIALS_PER_PACK[selectedHold.size];
    const pricePerPack = parseFloat(convertForm.pricePerVial) * vialsPerPack;

    const result = await convertHoldToSale(selectedHold.id, {
      batchNumber: convertForm.batchNumber,
      price: pricePerPack,
      saleDate: convertForm.saleDate
    });

    setModalLoading(false);

    if (result.success) {
      setShowConvertModal(false);
      setSelectedHold(null);
      alert('Stock hold successfully converted to sale!');
    } else {
      setModalError(result.error || 'Failed to convert stock hold');
    }
  };

  // Open revert modal for a sale (Admin only)
  const openRevertModal = (sale) => {
    setSelectedSale(sale);
    setRevertPassword('');
    setModalError('');
    setShowRevertModal(true);
  };

  // Handle revert sale back to stock hold
  const handleRevertToHold = async () => {
    if (!revertPassword) {
      setModalError('Please enter your password');
      return;
    }

    setModalLoading(true);
    setModalError('');

    // Verify password
    const isValid = await verifyPassword(currentUser.username, revertPassword);
    if (!isValid) {
      setModalError('Invalid password. Please try again.');
      setModalLoading(false);
      return;
    }

    const result = await revertSaleToHold(selectedSale.id);

    setModalLoading(false);

    if (result.success) {
      setShowRevertModal(false);
      setSelectedSale(null);
      alert('Sale successfully reverted to stock hold!');
    } else {
      setModalError(result.error || 'Failed to revert sale');
    }
  };

  const filtered = sales.filter(s => s.size === activeSize);
  const filteredHolds = stockHolds.filter(h => h.size === activeSize);
  const filteredAdjustments = stockAdjustments.filter(a => a.size === activeSize);
  const batches = getBatches();
  const vialsPerPack = VIALS_PER_PACK[activeSize];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Sales</h2>
        <div className="flex gap-2">
          <button onClick={() => { setShowSampleForm(!showSampleForm); setShowForm(false); setShowHoldForm(false); }} className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"><Plus className="w-4 h-4" /> Record Sample</button>
          <button onClick={() => { setShowHoldForm(!showHoldForm); setShowForm(false); setShowSampleForm(false); }} className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600"><Plus className="w-4 h-4" /> Stock Hold</button>
          <button onClick={() => { setShowForm(!showForm); setShowHoldForm(false); setShowSampleForm(false); }} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"><Plus className="w-4 h-4" /> Add Sale</button>
        </div>
      </div>
      <div className="flex space-x-2 border-b">{SIZES.map(s => (<button key={s} onClick={() => setActiveSize(s)} className={`px-4 py-2 text-sm ${activeSize === s ? 'border-b-2 border-purple-500 text-purple-600' : 'text-gray-600'}`}>{s}</button>))}</div>
      
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h3 className="font-semibold">New Sale - {activeSize} <span className="text-sm font-normal text-gray-500">({vialsPerPack} vials per pack)</span></h3>
          <select value={form.customerId} onChange={(e) => handleCustomer(e.target.value)} className="w-full border rounded-lg px-3 py-2">
            <option value="">Select customer...</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.country}</option>)}
          </select>
          {form.customer && <div className="bg-blue-50 p-3 rounded text-sm">Selected: {form.customer} ({form.country})</div>}
          <div>
            <label className="block text-xs text-gray-500 mb-1">End Destination (Final Sales Country)</label>
            <input type="text" placeholder="Enter end destination country" value={form.endDestination} onChange={(e) => setForm({...form, endDestination: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Sale Date</label>
              <input type="date" value={form.saleDate} onChange={(e) => setForm({...form, saleDate: e.target.value})} className="border rounded-lg px-3 py-2 w-full" />
            </div>
            <select value={form.batchNumber} onChange={(e) => setForm({...form, batchNumber: e.target.value})} className="border rounded-lg px-3 py-2">
              <option value="">Select batch...</option>
              {batches.map(b => <option key={b.batch} value={b.batch}>{b.batch} - {b.availableVials} vials available</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input type="number" placeholder="Number of Vials" value={form.vials} onChange={(e) => setForm({...form, vials: e.target.value})} className="border rounded-lg px-3 py-2 w-full" />
              {form.vials && <p className="text-xs text-gray-500 mt-1">= {(parseFloat(form.vials) / vialsPerPack).toFixed(2)} packs</p>}
            </div>
            <div>
              <input type="number" placeholder="Price per vial €" step="0.01" value={form.pricePerVial} onChange={(e) => setForm({...form, pricePerVial: e.target.value})} className="border rounded-lg px-3 py-2 w-full" />
              {form.pricePerVial && <p className="text-xs text-gray-500 mt-1">= €{(parseFloat(form.pricePerVial) * vialsPerPack).toFixed(2)} per pack</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="bg-purple-600 text-white px-4 py-2 rounded-lg">Save</button>
            <button onClick={() => setShowForm(false)} className="bg-gray-200 px-4 py-2 rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {showHoldForm && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg shadow p-6 space-y-4">
          <h3 className="font-semibold text-amber-800">New Stock Hold - {activeSize}</h3>
          <p className="text-xs text-amber-600">Stock holds are for committed stock that has not yet been sold.</p>
          <select value={holdForm.customerId} onChange={(e) => handleHoldCustomer(e.target.value)} className="w-full border border-amber-300 rounded-lg px-3 py-2">
            <option value="">Select customer...</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.country}</option>)}
          </select>
          <input type="text" placeholder="Enter end destination country" value={holdForm.endDestination} onChange={(e) => setHoldForm({...holdForm, endDestination: e.target.value})} className="w-full border border-amber-300 rounded-lg px-3 py-2" />
          <div className="grid grid-cols-2 gap-4">
            <input type="date" value={holdForm.holdDate} onChange={(e) => setHoldForm({...holdForm, holdDate: e.target.value})} className="border border-amber-300 rounded-lg px-3 py-2" />
            <input type="number" placeholder="Number of Vials" value={holdForm.vials} onChange={(e) => setHoldForm({...holdForm, vials: e.target.value})} className="border border-amber-300 rounded-lg px-3 py-2" />
          </div>
          <input type="text" placeholder="Notes (optional)" value={holdForm.notes} onChange={(e) => setHoldForm({...holdForm, notes: e.target.value})} className="w-full border border-amber-300 rounded-lg px-3 py-2" />
          <div className="flex gap-2">
            <button onClick={handleHoldSubmit} className="bg-amber-500 text-white px-4 py-2 rounded-lg">Save Hold</button>
            <button onClick={() => setShowHoldForm(false)} className="bg-gray-200 px-4 py-2 rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {showSampleForm && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg shadow p-6 space-y-4">
          <h3 className="font-semibold text-orange-800">Record Sample/Stock Adjustment - {activeSize}</h3>
          <p className="text-xs text-orange-600">Samples are recorded at cost price and deducted from available stock.</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-orange-700 mb-1">Select Batch *</label>
              <select value={sampleForm.batchNumber} onChange={(e) => setSampleForm({...sampleForm, batchNumber: e.target.value})} className="w-full border border-orange-300 rounded-lg px-3 py-2">
                <option value="">Select batch...</option>
                {batches.map(b => (
                  <option key={b.batch} value={b.batch}>{b.batch} - {b.availableVials} vials available (€{(b.costPerPack / vialsPerPack).toFixed(2)}/vial)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-orange-700 mb-1">Number of Vials *</label>
              <input type="number" placeholder="Enter vials" value={sampleForm.vials} onChange={(e) => setSampleForm({...sampleForm, vials: e.target.value})} className="border border-orange-300 rounded-lg px-3 py-2 w-full" />
              {sampleForm.vials && sampleForm.batchNumber && (
                <p className="text-xs text-orange-600 mt-1">
                  = {(parseFloat(sampleForm.vials) / vialsPerPack).toFixed(2)} packs | 
                  Cost: €{((parseFloat(sampleForm.vials) / vialsPerPack) * getBatchCost(sampleForm.batchNumber)).toFixed(2)}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-orange-700 mb-1">Reason *</label>
              <select value={sampleForm.reason} onChange={(e) => setSampleForm({...sampleForm, reason: e.target.value})} className="w-full border border-orange-300 rounded-lg px-3 py-2">
                {SAMPLE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-orange-700 mb-1">Date</label>
              <input type="date" value={sampleForm.adjustmentDate} onChange={(e) => setSampleForm({...sampleForm, adjustmentDate: e.target.value})} className="border border-orange-300 rounded-lg px-3 py-2 w-full" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-orange-700 mb-1">Recipient (if giving to external party)</label>
            <input type="text" placeholder="e.g., Company name, Contact person" value={sampleForm.recipient} onChange={(e) => setSampleForm({...sampleForm, recipient: e.target.value})} className="w-full border border-orange-300 rounded-lg px-3 py-2" />
          </div>

          <div>
            <label className="block text-xs text-orange-700 mb-1">Notes</label>
            <input type="text" placeholder="Additional notes..." value={sampleForm.notes} onChange={(e) => setSampleForm({...sampleForm, notes: e.target.value})} className="w-full border border-orange-300 rounded-lg px-3 py-2" />
          </div>

          <div className="flex gap-2">
            <button onClick={handleSampleSubmit} className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600">Record Sample</button>
            <button onClick={() => setShowSampleForm(false)} className="bg-gray-200 px-4 py-2 rounded-lg">Cancel</button>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Dest.</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Packs</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vials</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map(s => (
              <tr key={s.id} className={s.convertedFrom === 'stockHold' ? 'bg-green-50' : ''}>
                <td className="px-4 py-3 text-sm">
                  {new Date(s.saleDate || s.date).toLocaleDateString()}
                  <AuditTag createdBy={s.createdBy} createdAt={s.createdAt} />
                  {s.convertedFrom === 'stockHold' && <span className="inline-block mt-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">From Hold</span>}
                </td>
                <td className="px-4 py-3 text-sm font-medium">{s.customer}</td>
                <td className="px-4 py-3 text-sm">{s.endDestination || s.country || '-'}</td>
                <td className="px-4 py-3 text-sm text-purple-600">{s.batchNumber}</td>
                <td className="px-4 py-3 text-sm">{s.units}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{s.units * vialsPerPack}</td>
                <td className="px-4 py-3 text-sm font-semibold">€{(s.units * s.price).toFixed(2)}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    {isAdmin && s.convertedFrom === 'stockHold' && (
                      <button onClick={() => openRevertModal(s)} className="text-orange-600 hover:text-orange-800 text-xs font-medium">Revert</button>
                    )}
                    {isAdmin && <button onClick={() => deleteSale(s.id)} className="text-red-600 hover:text-red-800">Delete</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-8 text-gray-500">No sales for {activeSize}</div>}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 bg-amber-100 border-b border-amber-200">
          <h3 className="font-semibold text-amber-800">Stock Holds</h3>
          <p className="text-xs text-amber-600">Click "Convert to Sale" to finalize a hold into an actual sale</p>
        </div>
        <table className="min-w-full divide-y divide-amber-200">
          <thead className="bg-amber-50">
            <tr><th className="px-4 py-3 text-left text-xs font-medium text-amber-700 uppercase">Date</th><th className="px-4 py-3 text-left text-xs font-medium text-amber-700 uppercase">Customer</th><th className="px-4 py-3 text-left text-xs font-medium text-amber-700 uppercase">End Dest.</th><th className="px-4 py-3 text-left text-xs font-medium text-amber-700 uppercase">Vials</th><th className="px-4 py-3 text-left text-xs font-medium text-amber-700 uppercase">Notes</th><th className="px-4 py-3 text-left text-xs font-medium text-amber-700 uppercase">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-amber-100">
            {filteredHolds.map(h => (
              <tr key={h.id}>
                <td className="px-4 py-3 text-sm text-amber-800">{new Date(h.holdDate || h.createdAt).toLocaleDateString()}<AuditTag createdBy={h.createdBy} createdAt={h.createdAt} /></td>
                <td className="px-4 py-3 text-sm font-medium text-amber-800">{h.customer}</td>
                <td className="px-4 py-3 text-sm text-amber-700">{h.endDestination || h.country || '-'}</td>
                <td className="px-4 py-3 text-sm text-amber-600">{h.vials}</td>
                <td className="px-4 py-3 text-sm text-amber-600">{h.notes || '-'}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <button onClick={() => openConvertModal(h)} className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">Convert to Sale</button>
                    {isAdmin && <button onClick={() => deleteStockHold(h.id)} className="text-red-600 hover:text-red-800 text-xs">Delete</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredHolds.length === 0 && <div className="text-center py-6 text-amber-600">No stock holds for {activeSize}</div>}
      </div>

      {/* Samples/Stock Adjustments Section */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 bg-orange-100 border-b border-orange-200">
          <h3 className="font-semibold text-orange-800">Samples & Stock Adjustments</h3>
          <p className="text-xs text-orange-600">Recorded at cost price - deducted from available stock</p>
        </div>
        <table className="min-w-full divide-y divide-orange-200">
          <thead className="bg-orange-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">Batch</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">Reason</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">Recipient</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">Vials</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">Cost Value</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">Notes</th>
              {isAdmin && <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-orange-100">
            {filteredAdjustments.map(a => (
              <tr key={a.id} className="bg-orange-50/50">
                <td className="px-4 py-3 text-sm text-orange-800">{new Date(a.adjustmentDate || a.date).toLocaleDateString()}<AuditTag createdBy={a.createdBy} createdAt={a.createdAt} /></td>
                <td className="px-4 py-3 text-sm font-medium text-orange-700">{a.batchNumber}</td>
                <td className="px-4 py-3 text-sm text-orange-600">{a.reason}</td>
                <td className="px-4 py-3 text-sm text-orange-600">{a.recipient || '-'}</td>
                <td className="px-4 py-3 text-sm text-orange-800">{a.vials} <span className="text-xs text-orange-500">({a.units?.toFixed(2)}pk)</span></td>
                <td className="px-4 py-3 text-sm font-semibold text-orange-700">€{(a.totalCost || 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-orange-600">{a.notes || '-'}</td>
                {isAdmin && <td className="px-4 py-3 text-sm"><button onClick={() => deleteStockAdjustment(a.id)} className="text-red-600 hover:text-red-800">Delete</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
        {filteredAdjustments.length === 0 && <div className="text-center py-6 text-orange-600">No samples recorded for {activeSize}</div>}
      </div>

      {/* Convert Stock Hold to Sale Modal */}
      {showConvertModal && selectedHold && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Convert Stock Hold to Sale</h3>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-amber-800 font-medium">Stock Hold Details:</p>
              <p className="text-sm text-amber-700">Customer: {selectedHold.customer}</p>
              <p className="text-sm text-amber-700">End Destination: {selectedHold.endDestination || selectedHold.country}</p>
              <p className="text-sm text-amber-700">Size: {selectedHold.size}</p>
              <p className="text-sm text-amber-700">Vials: {selectedHold.vials} ({selectedHold.units} packs)</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sale Date</label>
                <input type="date" value={convertForm.saleDate} onChange={(e) => setConvertForm({...convertForm, saleDate: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number *</label>
                <select value={convertForm.batchNumber} onChange={(e) => setConvertForm({...convertForm, batchNumber: e.target.value})} className="w-full border rounded-lg px-3 py-2">
                  <option value="">Select batch...</option>
                  {batches.map(b => <option key={b.batch} value={b.batch}>{b.batch} - {b.availableVials} vials available</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price per Vial (€) *</label>
                <input type="number" step="0.01" placeholder="0.00" value={convertForm.pricePerVial} onChange={(e) => setConvertForm({...convertForm, pricePerVial: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                {convertForm.pricePerVial && selectedHold && (
                  <p className="text-xs text-gray-500 mt-1">
                    Total: €{(parseFloat(convertForm.pricePerVial) * selectedHold.vials).toFixed(2)} 
                    (€{(parseFloat(convertForm.pricePerVial) * VIALS_PER_PACK[selectedHold.size]).toFixed(2)} per pack)
                  </p>
                )}
              </div>

              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-red-700 mb-1">🔒 Enter Your Password to Confirm *</label>
                <input type="password" placeholder="Your password" value={convertForm.password} onChange={(e) => setConvertForm({...convertForm, password: e.target.value})} className="w-full border border-red-300 rounded-lg px-3 py-2" />
                <p className="text-xs text-gray-500 mt-1">Password required for security verification</p>
              </div>

              {modalError && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{modalError}</div>}

              <div className="flex gap-2 pt-2">
                <button onClick={handleConvertToSale} disabled={modalLoading} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {modalLoading ? 'Converting...' : 'Convert to Sale'}
                </button>
                <button onClick={() => { setShowConvertModal(false); setSelectedHold(null); }} className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revert Sale to Stock Hold Modal (Admin Only) */}
      {showRevertModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-orange-700 mb-4">⚠️ Revert Sale to Stock Hold</h3>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-orange-800 font-medium">This will:</p>
              <ul className="text-sm text-orange-700 list-disc list-inside mt-2">
                <li>Remove this sale record</li>
                <li>Restore the stock hold</li>
                <li>Update all inventory metrics</li>
                <li>Update dashboard figures</li>
              </ul>
            </div>

            <div className="bg-gray-50 border rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-800 font-medium">Sale Details:</p>
              <p className="text-sm text-gray-700">Customer: {selectedSale.customer}</p>
              <p className="text-sm text-gray-700">Batch: {selectedSale.batchNumber}</p>
              <p className="text-sm text-gray-700">Amount: €{(selectedSale.units * selectedSale.price).toFixed(2)}</p>
              <p className="text-sm text-gray-700">Converted by: {selectedSale.convertedBy || 'Unknown'}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-red-700 mb-1">🔒 Admin Password Required *</label>
                <input type="password" placeholder="Enter admin password" value={revertPassword} onChange={(e) => setRevertPassword(e.target.value)} className="w-full border border-red-300 rounded-lg px-3 py-2" />
              </div>

              {modalError && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{modalError}</div>}

              <div className="flex gap-2 pt-2">
                <button onClick={handleRevertToHold} disabled={modalLoading} className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50">
                  {modalLoading ? 'Reverting...' : 'Revert to Hold'}
                </button>
                <button onClick={() => { setShowRevertModal(false); setSelectedSale(null); setRevertPassword(''); }} className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Purchases = ({ purchases, addPurchase, deletePurchase, activeSize, setActiveSize, isAdmin, suppliers }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ supplierId: '', supplier: '', batchNumber: '', expiryDate: '', vials: '', costPerVial: '', purchaseDate: new Date().toISOString().split('T')[0] });

  const handleSupplier = (id) => {
    const s = suppliers.find(s => s.id === parseInt(id));
    setForm({ ...form, supplierId: id, supplier: s ? s.name : '' });
  };

  const handleSubmit = () => {
    if (!form.supplier || !form.batchNumber || !form.expiryDate || !form.vials || !form.costPerVial) { alert('Fill all fields'); return; }
    const vials = parseFloat(form.vials);
    const vialsPerPack = VIALS_PER_PACK[activeSize];
    const packs = vials / vialsPerPack;
    const costPerPack = parseFloat(form.costPerVial) * vialsPerPack;
    addPurchase({ ...form, size: activeSize, units: packs, cost: costPerPack });
    setForm({ supplierId: '', supplier: '', batchNumber: '', expiryDate: '', vials: '', costPerVial: '', purchaseDate: new Date().toISOString().split('T')[0] });
    setShowForm(false);
  };

  const filtered = purchases.filter(p => p.size === activeSize);
  const vialsPerPack = VIALS_PER_PACK[activeSize];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Purchases</h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"><Plus className="w-4 h-4" /> Add Purchase</button>
      </div>
      <div className="flex space-x-2 border-b">{SIZES.map(s => (<button key={s} onClick={() => setActiveSize(s)} className={`px-4 py-2 text-sm ${activeSize === s ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-600'}`}>{s}</button>))}</div>
      
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h3 className="font-semibold">New Purchase - {activeSize} <span className="text-sm font-normal text-gray-500">({vialsPerPack} vials per pack)</span></h3>
          <select value={form.supplierId} onChange={(e) => handleSupplier(e.target.value)} className="w-full border rounded-lg px-3 py-2">
            <option value="">Select supplier...</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} - {s.country}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Batch Number *</label>
              <input type="text" placeholder="Enter batch number" value={form.batchNumber} onChange={(e) => setForm({...form, batchNumber: e.target.value})} className="border rounded-lg px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Batch Expiry Date *</label>
              <input type="date" value={form.expiryDate} onChange={(e) => setForm({...form, expiryDate: e.target.value})} className="border rounded-lg px-3 py-2 w-full" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Invoice Date *</label>
              <input type="date" value={form.purchaseDate} onChange={(e) => setForm({...form, purchaseDate: e.target.value})} className="border rounded-lg px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Number of Vials *</label>
              <input type="number" placeholder="Enter vials" value={form.vials} onChange={(e) => setForm({...form, vials: e.target.value})} className="border rounded-lg px-3 py-2 w-full" />
              {form.vials && <p className="text-xs text-gray-500 mt-1">= {(parseFloat(form.vials) / vialsPerPack).toFixed(2)} packs</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cost per Vial (€) *</label>
              <input type="number" placeholder="0.00" step="0.01" value={form.costPerVial} onChange={(e) => setForm({...form, costPerVial: e.target.value})} className="border rounded-lg px-3 py-2 w-full" />
              {form.costPerVial && <p className="text-xs text-gray-500 mt-1">= €{(parseFloat(form.costPerVial) * vialsPerPack).toFixed(2)} per pack</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="bg-green-600 text-white px-4 py-2 rounded-lg">Save</button>
            <button onClick={() => setShowForm(false)} className="bg-gray-200 px-4 py-2 rounded-lg">Cancel</button>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Packs</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vials</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>{isAdmin && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>}</tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map(p => {
              const exp = p.expiryDate ? new Date(p.expiryDate) : null;
              const isExp = exp && exp < new Date();
              return (
                <tr key={p.id} className={isExp ? 'bg-red-50' : ''}>
                  <td className="px-4 py-3 text-sm">{new Date(p.purchaseDate || p.date).toLocaleDateString()}<AuditTag createdBy={p.createdBy} createdAt={p.createdAt} /></td>
                  <td className="px-4 py-3 text-sm font-medium">{p.supplier}</td>
                  <td className="px-4 py-3 text-sm text-green-600">{p.batchNumber}</td>
                  <td className="px-4 py-3 text-sm">{p.expiryDate ? <span className={isExp ? 'text-red-600 font-bold' : ''}>{new Date(p.expiryDate).toLocaleDateString()}{isExp && ' (EXPIRED)'}</span> : '-'}</td>
                  <td className="px-4 py-3 text-sm">{p.units}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.units * vialsPerPack}</td>
                  <td className="px-4 py-3 text-sm font-semibold">€{(p.units * p.cost).toFixed(2)}</td>
                  {isAdmin && <td className="px-4 py-3 text-sm"><button onClick={() => deletePurchase(p.id)} className="text-red-600">Delete</button></td>}
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-8 text-gray-500">No purchases for {activeSize}</div>}
      </div>
    </div>
  );
};

const Pipeline = ({ pipelinePurchases, addPipelinePurchase, deletePipelinePurchase, isAdmin, suppliers }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ poNumber: '', supplier: '', size: '5ml', vials: '', pricePerVial: '', expectedDate: '', status: 'Ordered' });

  const handleSubmit = () => {
    if (!form.poNumber || !form.supplier || !form.vials || !form.pricePerVial || !form.expectedDate) { alert('Fill all fields'); return; }
    const vials = parseFloat(form.vials);
    const vialsPerPack = VIALS_PER_PACK[form.size];
    const packs = vials / vialsPerPack;
    const pricePerPack = parseFloat(form.pricePerVial) * vialsPerPack;
    addPipelinePurchase({ ...form, units: packs, price: pricePerPack, totalValue: packs * pricePerPack });
    setForm({ poNumber: '', supplier: '', size: '5ml', vials: '', pricePerVial: '', expectedDate: '', status: 'Ordered' });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Pipeline Orders</h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"><Plus className="w-4 h-4" /> Add Pipeline Order</button>
      </div>
      
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h3 className="font-semibold">New Pipeline Order</h3>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="PO Number" value={form.poNumber} onChange={(e) => setForm({...form, poNumber: e.target.value})} className="border rounded-lg px-3 py-2" />
            <select value={form.supplier} onChange={(e) => setForm({...form, supplier: e.target.value})} className="border rounded-lg px-3 py-2">
              <option value="">Select supplier...</option>
              {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <select value={form.size} onChange={(e) => setForm({...form, size: e.target.value})} className="border rounded-lg px-3 py-2">
              {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input type="number" placeholder="Number of Vials" value={form.vials} onChange={(e) => setForm({...form, vials: e.target.value})} className="border rounded-lg px-3 py-2" />
            <input type="number" placeholder="Price per vial €" step="0.01" value={form.pricePerVial} onChange={(e) => setForm({...form, pricePerVial: e.target.value})} className="border rounded-lg px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input type="date" value={form.expectedDate} onChange={(e) => setForm({...form, expectedDate: e.target.value})} className="border rounded-lg px-3 py-2" />
            <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} className="border rounded-lg px-3 py-2">
              <option value="Ordered">Ordered</option><option value="In Transit">In Transit</option><option value="Delayed">Delayed</option><option value="Received">Received</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="bg-orange-600 text-white px-4 py-2 rounded-lg">Save</button>
            <button onClick={() => setShowForm(false)} className="bg-gray-200 px-4 py-2 rounded-lg">Cancel</button>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO #</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Packs</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>{isAdmin && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>}</tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pipelinePurchases.map(p => (
              <tr key={p.id} className={p.status === 'Delayed' ? 'bg-red-50' : ''}>
                <td className="px-4 py-3 text-sm text-orange-600 font-mono">{p.poNumber}</td>
                <td className="px-4 py-3 text-sm">{p.supplier}</td>
                <td className="px-4 py-3 text-sm">{p.size}</td>
                <td className="px-4 py-3 text-sm">{p.units}</td>
                <td className="px-4 py-3 text-sm font-semibold">€{p.totalValue.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm">{new Date(p.expectedDate).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-sm"><span className={`px-2 py-1 rounded text-xs ${p.status === 'Received' ? 'bg-green-100 text-green-800' : p.status === 'Delayed' ? 'bg-red-100 text-red-800' : 'bg-gray-100'}`}>{p.status}</span></td>
                {isAdmin && <td className="px-4 py-3 text-sm"><button onClick={() => deletePipelinePurchase(p.id)} className="text-red-600">Delete</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
        {pipelinePurchases.length === 0 && <div className="text-center py-8 text-gray-500">No pipeline orders</div>}
      </div>
    </div>
  );
};

const Reports = ({ sales, purchases, stockAdjustments }) => {
  const [year, setYear] = useState('all');
  const [size, setSize] = useState('all');

  const years = [...new Set([
    ...sales.map(s => new Date(s.saleDate || s.date).getFullYear()),
    ...purchases.map(p => new Date(p.purchaseDate || p.date).getFullYear()),
    ...(stockAdjustments || []).map(a => new Date(a.adjustmentDate || a.date).getFullYear())
  ])].sort((a, b) => b - a);

  const filterByYearAndSize = (items, dateField) => items.filter(item => {
    const d = item[dateField] || item.date;
    const itemYear = d ? new Date(d).getFullYear() : null;
    return (year === 'all' || itemYear === parseInt(year)) && (size === 'all' || item.size === size);
  });

  const filteredSales = filterByYearAndSize(sales, 'saleDate');
  const filteredPurchases = filterByYearAndSize(purchases, 'purchaseDate');
  const filteredAdjustments = filterByYearAndSize(stockAdjustments || [], 'adjustmentDate');
  
  const totalAdjustmentsVials = filteredAdjustments.reduce((sum, a) => sum + (parseFloat(a.vials) || 0), 0);
  const totalAdjustmentsValue = filteredAdjustments.reduce((sum, a) => sum + (parseFloat(a.totalCost) || 0), 0);

  const exportToCSV = (data, filename, headers, rowMapper) => {
    const csvContent = [
      headers.join(','),
      ...data.map(item => rowMapper(item).map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${year === 'all' ? 'all-years' : year}_${size === 'all' ? 'all-sizes' : size}.csv`;
    link.click();
  };

  const exportSales = () => {
    exportToCSV(
      filteredSales,
      'sales_report',
      ['Date', 'Customer', 'Country', 'End Destination', 'Size', 'Batch', 'Packs', 'Vials', 'Price/Pack', 'Total'],
      s => [
        new Date(s.saleDate || s.date).toLocaleDateString(),
        s.customer,
        s.country || '',
        s.endDestination || '',
        s.size,
        s.batchNumber || '',
        s.units,
        s.units * VIALS_PER_PACK[s.size],
        s.price?.toFixed(2) || '',
        (s.units * s.price).toFixed(2)
      ]
    );
  };

  const exportPurchases = () => {
    exportToCSV(
      filteredPurchases,
      'purchases_report',
      ['Date', 'Supplier', 'Size', 'Batch', 'Expiry', 'Packs', 'Vials', 'Cost/Pack', 'Total'],
      p => [
        new Date(p.purchaseDate || p.date).toLocaleDateString(),
        p.supplier,
        p.size,
        p.batchNumber || '',
        p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : '',
        p.units,
        p.units * VIALS_PER_PACK[p.size],
        p.cost?.toFixed(2) || '',
        (p.units * p.cost).toFixed(2)
      ]
    );
  };

  const exportSamples = () => {
    exportToCSV(
      filteredAdjustments,
      'samples_report',
      ['Date', 'Batch', 'Size', 'Reason', 'Recipient', 'Vials', 'Packs', 'Cost Value', 'Notes'],
      a => [
        new Date(a.adjustmentDate || a.date).toLocaleDateString(),
        a.batchNumber || '',
        a.size,
        a.reason || '',
        a.recipient || '',
        a.vials,
        a.units?.toFixed(2) || '',
        (a.totalCost || 0).toFixed(2),
        a.notes || ''
      ]
    );
  };

  const exportAll = () => {
    exportSales();
    setTimeout(() => exportPurchases(), 100);
    setTimeout(() => exportSamples(), 200);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Annual Reports</h2>
        <button onClick={exportAll} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Export All to CSV
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Year</label>
            <select value={year} onChange={(e) => setYear(e.target.value)} className="w-full border rounded-lg px-3 py-2">
              <option value="all">All Years</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Size</label>
            <select value={size} onChange={(e) => setSize(e.target.value)} className="w-full border rounded-lg px-3 py-2">
              <option value="all">All Sizes</option>
              {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Sales Report ({filteredSales.length} records)</h3>
          <button onClick={exportSales} className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-purple-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-purple-800 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-purple-800 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-purple-800 uppercase">Size</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-purple-800 uppercase">Packs</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-purple-800 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSales.map(s => (
                <tr key={s.id} className="hover:bg-purple-50">
                  <td className="px-4 py-3 text-sm">{new Date(s.saleDate || s.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm font-medium">{s.customer}</td>
                  <td className="px-4 py-3 text-sm">{s.size}</td>
                  <td className="px-4 py-3 text-sm text-right">{s.units}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold">€{(s.units * s.price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSales.length === 0 && <div className="text-center py-8 text-gray-500">No sales data found</div>}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Purchases Report ({filteredPurchases.length} records)</h3>
          <button onClick={exportPurchases} className="text-sm text-green-600 hover:text-green-800 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-green-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-green-800 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-green-800 uppercase">Supplier</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-green-800 uppercase">Size</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-green-800 uppercase">Batch</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-green-800 uppercase">Packs</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-green-800 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPurchases.map(p => (
                <tr key={p.id} className="hover:bg-green-50">
                  <td className="px-4 py-3 text-sm">{new Date(p.purchaseDate || p.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm font-medium">{p.supplier}</td>
                  <td className="px-4 py-3 text-sm">{p.size}</td>
                  <td className="px-4 py-3 text-sm text-green-600">{p.batchNumber}</td>
                  <td className="px-4 py-3 text-sm text-right">{p.units}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold">€{(p.units * p.cost).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPurchases.length === 0 && <div className="text-center py-8 text-gray-500">No purchases data found</div>}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-orange-800">Samples & Stock Adjustments Report ({filteredAdjustments.length} records)</h3>
          <button onClick={exportSamples} className="text-sm text-orange-600 hover:text-orange-800 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-orange-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-orange-800 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-orange-800 uppercase">Batch</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-orange-800 uppercase">Size</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-orange-800 uppercase">Reason</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-orange-800 uppercase">Recipient</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-orange-800 uppercase">Vials</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-orange-800 uppercase">Cost Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAdjustments.map(a => (
                <tr key={a.id} className="hover:bg-orange-50">
                  <td className="px-4 py-3 text-sm">{new Date(a.adjustmentDate || a.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm font-medium text-orange-600">{a.batchNumber}</td>
                  <td className="px-4 py-3 text-sm">{a.size}</td>
                  <td className="px-4 py-3 text-sm">{a.reason}</td>
                  <td className="px-4 py-3 text-sm">{a.recipient || '-'}</td>
                  <td className="px-4 py-3 text-sm text-right">{a.vials}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold">€{(a.totalCost || 0).toFixed(2)}</td>
                </tr>
              ))}
              {filteredAdjustments.length > 0 && (
                <tr className="bg-orange-100 font-bold">
                  <td colSpan="5" className="px-4 py-3 text-sm text-orange-900">TOTAL SAMPLES</td>
                  <td className="px-4 py-3 text-sm text-right text-orange-900">{totalAdjustmentsVials}</td>
                  <td className="px-4 py-3 text-sm text-right text-orange-900">€{totalAdjustmentsValue.toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>
          {filteredAdjustments.length === 0 && <div className="text-center py-8 text-gray-500">No samples/adjustments data found</div>}
        </div>
      </div>
    </div>
  );
};

const Setup = ({ customers, addCustomer, deleteCustomer, suppliers, addSupplier, deleteSupplier, onDataRestore }) => {
  const [tab, setTab] = useState('customers');

  const handleBackup = async () => {
    try {
      const backupData = {};
      const keys = ['sales-data', 'purchases-data', 'customers-data', 'suppliers-data', 'pipeline-purchases-data', 'stock-holds-data', 'stock-adjustments-data', 'users'];
      
      for (const key of keys) {
        const data = await storage.get(key);
        if (data) backupData[key] = JSON.parse(data.value);
      }
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `eurofolic_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      alert('Backup downloaded successfully!');
    } catch (e) {
      alert('Backup failed: ' + e.message);
    }
  };

  const handleRestore = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!confirm('This will replace ALL current data. Are you sure you want to restore from this backup?')) {
      event.target.value = '';
      return;
    }
    
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      
      for (const [key, value] of Object.entries(backupData)) {
        await storage.set(key, JSON.stringify(value));
      }
      
      alert('Data restored successfully! The page will now reload.');
      event.target.value = '';
      if (onDataRestore) onDataRestore();
      window.location.reload();
    } catch (e) {
      alert('Restore failed: ' + e.message);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Setup</h2>
        <div className="flex gap-2">
          <button onClick={handleBackup} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Backup Data
          </button>
          <label className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Restore Data
            <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
          </label>
        </div>
      </div>
      <div className="flex space-x-2 border-b">
        {['customers', 'suppliers', 'users'].map(t => (<button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm capitalize ${tab === t ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-600'}`}>{t}</button>))}
      </div>
      {tab === 'customers' && <Customers customers={customers} addCustomer={addCustomer} deleteCustomer={deleteCustomer} />}
      {tab === 'suppliers' && <Suppliers suppliers={suppliers} addSupplier={addSupplier} deleteSupplier={deleteSupplier} />}
      {tab === 'users' && <Users />}
    </div>
  );
};

const Customers = ({ customers, addCustomer, deleteCustomer }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', country: '', contactPerson: '', email: '', phone: '' });

  const handleSubmit = () => {
    if (!form.name || !form.country || !form.email) { alert('Name, country and email required'); return; }
    addCustomer(form);
    setForm({ name: '', country: '', contactPerson: '', email: '', phone: '' });
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg"><Plus className="w-4 h-4" /> Add Customer</button>
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Name *" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="border rounded-lg px-3 py-2" />
            <input type="text" placeholder="Country *" value={form.country} onChange={(e) => setForm({...form, country: e.target.value})} className="border rounded-lg px-3 py-2" />
          </div>
          <input type="email" placeholder="Email *" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="border rounded-lg px-3 py-2 w-full" />
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Save</button>
            <button onClick={() => setShowForm(false)} className="bg-gray-200 px-4 py-2 rounded-lg">Cancel</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Country</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th></tr></thead>
          <tbody className="divide-y divide-gray-200">
            {customers.map(c => (
              <tr key={c.id}>
                <td className="px-4 py-3 text-sm font-medium">{c.name}</td>
                <td className="px-4 py-3 text-sm">{c.country}</td>
                <td className="px-4 py-3 text-sm">{c.email}</td>
                <td className="px-4 py-3 text-sm"><button onClick={() => deleteCustomer(c.id)} className="text-red-600">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && <div className="text-center py-8 text-gray-500">No customers</div>}
      </div>
    </div>
  );
};

const Suppliers = ({ suppliers, addSupplier, deleteSupplier }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', country: '', email: '', phone: '' });

  const handleSubmit = () => {
    if (!form.name || !form.country) { alert('Name and country required'); return; }
    addSupplier(form);
    setForm({ name: '', country: '', email: '', phone: '' });
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg"><Plus className="w-4 h-4" /> Add Supplier</button>
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Name *" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="border rounded-lg px-3 py-2" />
            <input type="text" placeholder="Country *" value={form.country} onChange={(e) => setForm({...form, country: e.target.value})} className="border rounded-lg px-3 py-2" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="bg-green-600 text-white px-4 py-2 rounded-lg">Save</button>
            <button onClick={() => setShowForm(false)} className="bg-gray-200 px-4 py-2 rounded-lg">Cancel</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Country</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th></tr></thead>
          <tbody className="divide-y divide-gray-200">
            {suppliers.map(s => (
              <tr key={s.id}>
                <td className="px-4 py-3 text-sm font-medium">{s.name}</td>
                <td className="px-4 py-3 text-sm">{s.country}</td>
                <td className="px-4 py-3 text-sm"><button onClick={() => deleteSupplier(s.id)} className="text-red-600">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {suppliers.length === 0 && <div className="text-center py-8 text-gray-500">No suppliers</div>}
      </div>
    </div>
  );
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', name: '', initials: '', role: 'user' });

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const data = await storage.get('users');
      if (data) setUsers(JSON.parse(data.value));
    } catch (e) {}
  };

  const addUser = async () => {
    if (!form.username || !form.password || !form.name) { alert('Fill all fields'); return; }
    const newUsers = [...users, { ...form, initials: form.initials || form.username.substring(0,3).toUpperCase(), id: Date.now() }];
    setUsers(newUsers);
    await storage.set('users', JSON.stringify(newUsers));
    setForm({ username: '', password: '', name: '', initials: '', role: 'user' });
    setShowForm(false);
  };

  const deleteUser = async (id) => {
    const newUsers = users.filter(u => u.id !== id && u.username !== 'admin');
    setUsers(newUsers);
    await storage.set('users', JSON.stringify(newUsers));
  };

  return (
    <div className="space-y-4">
      <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg"><Plus className="w-4 h-4" /> Add User</button>
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Username" value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} className="border rounded-lg px-3 py-2" />
            <input type="text" placeholder="Full Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="border rounded-lg px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="border rounded-lg px-3 py-2" />
            <select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} className="border rounded-lg px-3 py-2">
              <option value="user">User</option><option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={addUser} className="bg-indigo-600 text-white px-4 py-2 rounded-lg">Save</button>
            <button onClick={() => setShowForm(false)} className="bg-gray-200 px-4 py-2 rounded-lg">Cancel</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th></tr></thead>
          <tbody className="divide-y divide-gray-200">
            {users.map(u => (<tr key={u.id || u.username}><td className="px-4 py-3 text-sm font-medium">{u.username}</td><td className="px-4 py-3 text-sm">{u.name}</td><td className="px-4 py-3 text-sm"><span className={`px-2 py-1 rounded text-xs ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100'}`}>{u.role}</span></td><td className="px-4 py-3 text-sm">{u.username !== 'admin' && <button onClick={() => deleteUser(u.id)} className="text-red-600">Delete</button>}</td></tr>))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default App;
