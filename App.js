import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Scissors, User, Calendar, DollarSign, Settings, 
  LayoutDashboard, Users, ShoppingBag, Plus, Trash2, 
  CheckCircle, Clock, Search, LogOut, ChevronRight,
  Menu, X, Printer, TrendingUp, Filter, Home, Wallet
} from 'lucide-react';
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy, where, writeBatch } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

// --- CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyAOFOgjdbdoUYBTldXOEEG636q1EM8EBfc", 
    authDomain: "leanaxis-accounts.firebaseapp.com",
    projectId: "leanaxis-accounts",
    storageBucket: "leanaxis-accounts.firebasestorage.app",
    messagingSenderId: "855221056961",
    appId: "1:855221056961:web:b4129012fa0f56f58a6b40"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const DB_PREFIX = "rehman_salon_";

// --- UTILS ---
const formatCurrency = (amount) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(amount);

// --- HOOKS ---
function useCollection(colName) {
    const [data, setData] = useState([]);
    useEffect(() => {
        const q = query(collection(db, DB_PREFIX + colName), orderBy("createdAt", "desc"));
        return onSnapshot(q, (snap) => setData(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, [colName]);
    return [data];
}

// --- COMPONENTS ---
const InvoiceModal = ({ sale, onClose, salonInfo }) => (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div id="printable-area" className="bg-white text-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center border-b border-dashed border-slate-300 bg-slate-50">
                <h1 className="text-2xl font-black tracking-tight mb-1 uppercase text-slate-800">{salonInfo.name}</h1>
                <p className="text-xs font-medium text-slate-500">{salonInfo.address}</p>
                <div className="flex justify-center gap-2 mt-4">
                    <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Invoice</span>
                    <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">#{sale.id.slice(-4)}</span>
                </div>
            </div>
            <div className="p-6 space-y-4">
                <div className="space-y-2">
                    {sale.services.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm items-center">
                            <span className="font-medium text-slate-700">{item.name}</span>
                            <span className="font-bold text-slate-900">{formatCurrency(item.price)}</span>
                        </div>
                    ))}
                </div>
                <div className="border-t-2 border-slate-900 pt-4 flex justify-between items-center text-xl font-black">
                    <span>TOTAL</span>
                    <span>{formatCurrency(sale.total)}</span>
                </div>
            </div>
            <div className="bg-slate-900 p-4 flex gap-3 print:hidden">
                <button onClick={onClose} className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition-colors">Close</button>
                <button onClick={() => window.print()} className="flex-1 py-3 bg-yellow-500 text-slate-900 rounded-xl font-bold text-sm hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20"><Printer size={18}/> Print</button>
            </div>
        </div>
    </div>
);

const App = () => {
    const [view, setView] = useState('pos');
    const [cart, setCart] = useState([]);
    const [selectedStylist, setSelectedStylist] = useState('');
    const [showInvoice, setShowInvoice] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [services] = useCollection('services');
    const [staff] = useCollection('staff');
    const [sales] = useCollection('sales');
    const [expenses] = useCollection('expenses'); // New Hook

    const today = new Date().toISOString().split('T')[0];
    const todaysSales = sales.filter(s => s.date === today);
    const todaysExpenses = expenses.filter(e => e.date === today);
    
    const totalRevenue = todaysSales.reduce((sum, s) => sum + s.total, 0);
    const totalExpenseAmount = todaysExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenseAmount;

    const addToCart = (service) => setCart([...cart, service]);
    const removeFromCart = (index) => setCart(cart.filter((_, i) => i !== index));
    const cartTotal = cart.reduce((sum, item) => sum + Number(item.price), 0);

    const handleCheckout = async () => {
        if (cart.length === 0) return alert("Cart is empty!");
        if (!selectedStylist) return alert("Select a stylist!");
        const saleData = { date: today, createdAt: new Date().toISOString(), stylist: selectedStylist, services: cart, total: cartTotal };
        const docRef = await addDoc(collection(db, DB_PREFIX + 'sales'), saleData);
        setShowInvoice({ id: docRef.id, ...saleData });
        setCart([]);
    };

    const handleAddService = (e) => {
        e.preventDefault();
        const { name, price } = e.target.elements;
        if(name.value && price.value) {
            addDoc(collection(db, DB_PREFIX + 'services'), { name: name.value, price: Number(price.value), createdAt: new Date().toISOString() });
            e.target.reset();
        }
    };

    const handleAddStaff = (e) => {
        e.preventDefault();
        if(e.target.name.value) {
            addDoc(collection(db, DB_PREFIX + 'staff'), { name: e.target.name.value, role: 'Stylist', createdAt: new Date().toISOString() });
            e.target.reset();
        }
    };

    // NEW: Handle Expense
    const handleAddExpense = (e) => {
        e.preventDefault();
        const { name, amount } = e.target.elements;
        if(name.value && amount.value) {
            addDoc(collection(db, DB_PREFIX + 'expenses'), { 
                description: name.value, 
                amount: Number(amount.value), 
                date: today,
                createdAt: new Date().toISOString() 
            });
            e.target.reset();
        }
    };

    const filteredServices = services.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const NavItem = ({ id, icon: Icon, label }) => (
        <button onClick={() => { setView(id); }} className={`w-full flex flex-col md:flex-row items-center md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all ${view === id ? 'text-yellow-500 font-bold bg-slate-800/50' : 'text-slate-400 hover:text-slate-200'}`}>
            <Icon size={24} className="mb-1 md:mb-0" />
            <span className="text-[10px] md:text-sm font-medium">{label}</span>
        </button>
    );

    return (
        <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
            {/* MOBILE HEADER */}
            <div className="md:hidden flex justify-between items-center p-4 bg-slate-900 border-b border-slate-800 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center text-slate-900"><Scissors size={18} /></div>
                    <span className="font-bold text-lg">REHMAN</span>
                </div>
                <div className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full">{formatCurrency(totalRevenue)}</div>
            </div>

            {/* SIDEBAR / BOTTOM NAV */}
            <nav className="fixed bottom-0 w-full md:relative md:w-64 bg-slate-900 border-t md:border-r border-slate-800 flex md:flex-col justify-around md:justify-start p-2 md:p-6 z-40 gap-1 md:gap-2">
                <div className="hidden md:flex items-center gap-3 px-4 mb-8">
                    <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center text-slate-900 shadow-lg shadow-yellow-500/20"><Scissors size={24} /></div>
                    <div><h1 className="font-bold text-xl leading-none">REHMAN</h1><span className="text-xs text-yellow-500 font-bold uppercase">Salon Manager</span></div>
                </div>
                <NavItem id="pos" icon={Scissors} label="Service" />
                <NavItem id="dashboard" icon={LayoutDashboard} label="Stats" />
                <NavItem id="expenses" icon={Wallet} label="Expenses" />
                <NavItem id="manage" icon={Settings} label="Manage" />
            </nav>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative pb-16 md:pb-0">
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-500/5 via-transparent to-transparent pointer-events-none"></div>

                {view === 'pos' && (
                    <div className="flex flex-col md:flex-row h-full">
                        {/* SERVICE GRID */}
                        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                            <div className="relative mb-6">
                                <Search className="absolute left-4 top-3.5 text-slate-500" size={20} />
                                <input className="w-full bg-slate-900/80 border border-slate-800 text-white pl-12 pr-4 py-3 rounded-2xl focus:border-yellow-500 outline-none transition-all placeholder:text-slate-600" placeholder="Search services..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 pb-24 md:pb-0">
                                {filteredServices.map(s => (
                                    <button key={s.id} onClick={() => addToCart(s)} className="glass p-4 rounded-2xl text-left hover:bg-slate-800 hover:border-yellow-500/30 transition-all active:scale-95 group relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
                                        <h3 className="font-bold text-slate-200 mb-1 relative z-10">{s.name}</h3>
                                        <p className="text-yellow-500 font-bold text-lg relative z-10">{formatCurrency(s.price)}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* CART DRAWER */}
                        <div className="fixed md:static bottom-16 md:bottom-auto left-0 w-full md:w-96 bg-slate-900 md:bg-slate-900/50 backdrop-blur-xl border-t md:border-l border-slate-800 p-4 md:p-6 flex flex-col shadow-2xl md:shadow-none z-30 h-auto md:h-full transition-transform">
                            {/* Stylist Selector */}
                            <div className="mb-4">
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Stylist</label>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {staff.map(s => (
                                        <button key={s.id} onClick={() => setSelectedStylist(s.name)} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${selectedStylist === s.name ? 'bg-yellow-500 text-slate-900 border-yellow-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>{s.name}</button>
                                    ))}
                                </div>
                            </div>

                            {/* Cart Items */}
                            <div className="hidden md:flex flex-1 flex-col overflow-y-auto space-y-2 mb-4">
                                {cart.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center bg-slate-800 p-3 rounded-xl border border-slate-700/50">
                                        <span className="font-medium text-sm">{item.name}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-yellow-500 font-bold text-sm">{formatCurrency(item.price)}</span>
                                            <button onClick={() => removeFromCart(i)} className="text-slate-500 hover:text-rose-500"><X size={14}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Checkout Button */}
                            <div className="mt-auto">
                                <button onClick={handleCheckout} className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 py-4 rounded-2xl font-black text-lg shadow-lg shadow-yellow-500/20 active:scale-95 transition-all flex items-center justify-between px-6">
                                    <div className="flex flex-col items-start leading-none">
                                        <span className="text-xs uppercase opacity-70 font-bold">Total</span>
                                        <span>{formatCurrency(cartTotal)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                                        Checkout <ChevronRight size={18} />
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW: DASHBOARD */}
                {view === 'dashboard' && (
                    <div className="p-6 md:p-10 overflow-y-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="glass p-5 rounded-2xl border border-slate-800 bg-slate-900/50">
                                <p className="text-slate-400 text-xs font-bold uppercase mb-1">Total Revenue</p>
                                <p className="text-2xl md:text-3xl font-black text-emerald-400">{formatCurrency(totalRevenue)}</p>
                            </div>
                            <div className="glass p-5 rounded-2xl border border-slate-800 bg-slate-900/50">
                                <p className="text-slate-400 text-xs font-bold uppercase mb-1">Total Expenses</p>
                                <p className="text-2xl md:text-3xl font-black text-rose-400">{formatCurrency(totalExpenseAmount)}</p>
                            </div>
                            <div className="glass p-5 rounded-2xl border border-slate-800 bg-slate-900/50 col-span-2 md:col-span-2">
                                <p className="text-slate-400 text-xs font-bold uppercase mb-1">Net Profit</p>
                                <p className={`text-2xl md:text-3xl font-black ${netProfit >= 0 ? 'text-yellow-400' : 'text-rose-400'}`}>{formatCurrency(netProfit)}</p>
                            </div>
                        </div>
                        <div className="glass p-6 rounded-2xl border border-slate-800">
                            <h3 className="font-bold text-lg mb-4 text-white">Recent Sales</h3>
                            <div className="space-y-3">
                                {sales.slice(0, 8).map(s => (
                                    <div key={s.id} className="flex justify-between items-center py-3 border-b border-slate-800 last:border-0">
                                        <div>
                                            <p className="font-bold text-slate-200 text-sm">{s.stylist}</p>
                                            <p className="text-xs text-slate-500">{new Date(s.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} • {s.services.length} items</p>
                                        </div>
                                        <p className="font-bold text-emerald-400">{formatCurrency(s.total)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW: EXPENSES */}
                {view === 'expenses' && (
                    <div className="p-6 md:p-10 overflow-y-auto max-w-2xl mx-auto w-full pb-24">
                        <div className="glass p-6 rounded-3xl border border-slate-800 mb-8">
                            <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2"><Wallet className="text-rose-500"/> Add Expense</h3>
                            <form onSubmit={handleAddExpense} className="flex gap-2 mb-4">
                                <input name="name" required placeholder="Description (e.g. Tea, Bill)" className="flex-1 bg-slate-950 border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500" />
                                <input name="amount" type="number" required placeholder="Amount" className="w-24 bg-slate-950 border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500" />
                                <button className="bg-rose-500 text-white p-3 rounded-xl font-bold"><Plus size={20}/></button>
                            </form>
                        </div>
                        
                        <div className="space-y-3">
                            <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">Today's Expenses</h3>
                            {todaysExpenses.length === 0 ? (
                                <p className="text-slate-600 text-center py-8">No expenses recorded today.</p>
                            ) : (
                                todaysExpenses.map(e => (
                                    <div key={e.id} className="glass p-4 rounded-2xl flex justify-between items-center border border-slate-800/50">
                                        <span className="font-medium text-slate-200">{e.description}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-rose-400">{formatCurrency(e.amount)}</span>
                                            <button onClick={() => deleteDoc(doc(db, DB_PREFIX + 'expenses', e.id))} className="text-slate-600 hover:text-rose-500"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* VIEW: MANAGE */}
                {view === 'manage' && (
                    <div className="p-6 md:p-10 overflow-y-auto max-w-2xl mx-auto w-full pb-24">
                        <div className="space-y-8">
                            <div className="glass p-6 rounded-3xl border border-slate-800">
                                <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2"><Scissors className="text-yellow-500"/> Add Service</h3>
                                <form onSubmit={handleAddService} className="flex gap-2 mb-4">
                                    <input name="name" required placeholder="Name" className="flex-1 bg-slate-950 border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-yellow-500" />
                                    <input name="price" type="number" required placeholder="Price" className="w-24 bg-slate-950 border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-yellow-500" />
                                    <button className="bg-yellow-500 text-slate-900 p-3 rounded-xl font-bold"><Plus size={20}/></button>
                                </form>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                    {services.map(s => (
                                        <div key={s.id} className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl">
                                            <span className="text-sm font-medium">{s.name}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-yellow-500 font-bold">{formatCurrency(s.price)}</span>
                                                <button onClick={() => deleteDoc(doc(db, DB_PREFIX + 'services', s.id))} className="text-slate-600 hover:text-rose-500"><Trash2 size={14}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="glass p-6 rounded-3xl border border-slate-800">
                                <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2"><User className="text-blue-500"/> Add Staff</h3>
                                <form onSubmit={handleAddStaff} className="flex gap-2 mb-4">
                                    <input name="name" required placeholder="Staff Name" className="flex-1 bg-slate-950 border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500" />
                                    <button className="bg-blue-600 text-white p-3 rounded-xl font-bold"><Plus size={20}/></button>
                                </form>
                                <div className="space-y-2">
                                    {staff.map(s => (
                                        <div key={s.id} className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl">
                                            <span className="text-sm font-medium">{s.name}</span>
                                            <button onClick={() => deleteDoc(doc(db, DB_PREFIX + 'staff', s.id))} className="text-slate-600 hover:text-rose-500"><Trash2 size={14}/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* INVOICE MODAL */}
            {showInvoice && <InvoiceModal sale={showInvoice} onClose={() => setShowInvoice(null)} salonInfo={{ name: "Rehman Salon", address: "Main Market, City", phone: "0300-1234567" }} />}
        </div>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);