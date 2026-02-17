import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Scissors, User, Calendar, DollarSign, Settings, 
  LayoutDashboard, Users, ShoppingBag, Plus, Trash2, 
  CheckCircle, Clock, Search, LogOut, ChevronRight,
  Menu, X, Printer, TrendingUp, Filter
} from 'lucide-react';
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy, where, writeBatch } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

// --- CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyAOFOgjdbdoUYBTldXOEEG636q1EM8EBfc", // Reusing your existing key for demo; replace for prod
    authDomain: "leanaxis-accounts.firebaseapp.com",
    projectId: "leanaxis-accounts",
    storageBucket: "leanaxis-accounts.firebasestorage.app",
    messagingSenderId: "855221056961",
    appId: "1:855221056961:web:b4129012fa0f56f58a6b40"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Prefix for collections to keep data separate from your other apps
const DB_PREFIX = "rehman_salon_";

// --- UTILS ---
const formatCurrency = (amount) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(amount);
const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// --- HOOKS ---
function useCollection(colName) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const q = query(collection(db, DB_PREFIX + colName), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            setData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return () => unsub();
    }, [colName]);
    return [data, loading];
}

// --- COMPONENTS ---

const InvoiceModal = ({ sale, onClose, salonInfo }) => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:p-0 print:bg-white">
        <div id="printable-area" className="bg-white text-slate-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 text-center border-b border-dashed border-slate-300">
                <h1 className="text-2xl font-bold tracking-tight mb-1 uppercase">{salonInfo.name}</h1>
                <p className="text-xs text-slate-500">{salonInfo.address}</p>
                <p className="text-xs text-slate-500 mb-4">{salonInfo.phone}</p>
                <div className="flex justify-between text-xs font-mono text-slate-500 mt-4">
                    <span>Inv: #{sale.id.slice(-6).toUpperCase()}</span>
                    <span>{new Date(sale.createdAt).toLocaleString()}</span>
                </div>
            </div>
            <div className="p-6">
                <div className="space-y-3 mb-6">
                    {sale.services.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                            <span className="font-medium text-slate-700">{item.name}</span>
                            <span className="font-bold text-slate-900">{formatCurrency(item.price)}</span>
                        </div>
                    ))}
                </div>
                <div className="border-t-2 border-slate-900 pt-4 flex justify-between items-center text-xl font-bold">
                    <span>TOTAL</span>
                    <span>{formatCurrency(sale.total)}</span>
                </div>
                <div className="mt-2 flex justify-between text-sm text-slate-500">
                    <span>Served by:</span>
                    <span className="font-medium text-slate-700">{sale.stylist}</span>
                </div>
            </div>
            <div className="bg-slate-100 p-4 text-center text-xs text-slate-500 print:hidden">
                <p className="mb-4">Thank you for visiting!</p>
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 py-3 bg-white border border-slate-300 rounded-xl font-bold hover:bg-slate-50">Close</button>
                    <button onClick={() => window.print()} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 flex items-center justify-center gap-2"><Printer size={16}/> Print</button>
                </div>
            </div>
        </div>
    </div>
);

const App = () => {
    const [view, setView] = useState('pos');
    const [cart, setCart] = useState([]);
    const [selectedStylist, setSelectedStylist] = useState('');
    const [customerName, setSelectedCustomer] = useState('Walk-in');
    const [showInvoice, setShowInvoice] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Data
    const [services] = useCollection('services');
    const [staff] = useCollection('staff');
    const [sales] = useCollection('sales');
    const [expenses] = useCollection('expenses');

    // Stats
    const today = new Date().toISOString().split('T')[0];
    const todaysSales = sales.filter(s => s.date === today);
    const totalRevenue = todaysSales.reduce((sum, s) => sum + s.total, 0);
    const totalCustomers = todaysSales.length;

    // Actions
    const addToCart = (service) => setCart([...cart, service]);
    const removeFromCart = (index) => setCart(cart.filter((_, i) => i !== index));
    const cartTotal = cart.reduce((sum, item) => sum + Number(item.price), 0);

    const handleCheckout = async () => {
        if (cart.length === 0) return alert("Cart is empty!");
        if (!selectedStylist) return alert("Please select a stylist!");

        const saleData = {
            date: today,
            createdAt: new Date().toISOString(),
            customer: customerName,
            stylist: selectedStylist,
            services: cart,
            total: cartTotal,
            status: 'Completed'
        };

        try {
            const docRef = await addDoc(collection(db, DB_PREFIX + 'sales'), saleData);
            setShowInvoice({ id: docRef.id, ...saleData });
            setCart([]);
            setSelectedCustomer('Walk-in');
        } catch (e) {
            console.error(e);
            alert("Error saving sale");
        }
    };

    const handleAddService = async (e) => {
        e.preventDefault();
        const name = e.target.name.value;
        const price = Number(e.target.price.value);
        const category = e.target.category.value;
        if(name && price) {
            await addDoc(collection(db, DB_PREFIX + 'services'), { name, price, category, createdAt: new Date().toISOString() });
            e.target.reset();
        }
    };

    const handleAddStaff = async (e) => {
        e.preventDefault();
        const name = e.target.name.value;
        if(name) {
            await addDoc(collection(db, DB_PREFIX + 'staff'), { name, role: 'Stylist', createdAt: new Date().toISOString() });
            e.target.reset();
        }
    };

    // Filter services
    const filteredServices = services.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="flex h-screen overflow-hidden text-slate-100 font-sans selection:bg-yellow-500 selection:text-black">
            
            {/* SIDEBAR */}
            <aside className="w-20 lg:w-64 bg-slate-900 border-r border-slate-800 flex flex-col items-center lg:items-start py-8 transition-all">
                <div className="px-6 mb-10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center text-slate-900 shadow-lg shadow-yellow-500/20">
                        <Scissors size={24} />
                    </div>
                    <div className="hidden lg:block">
                        <h1 className="font-bold text-xl leading-none">REHMAN</h1>
                        <span className="text-xs text-yellow-500 font-bold tracking-widest uppercase">Hair Salon</span>
                    </div>
                </div>

                <nav className="w-full space-y-2 px-3">
                    {[
                        { id: 'pos', icon: ShoppingBag, label: 'New Sale' },
                        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                        { id: 'sales', icon: Clock, label: 'History' },
                        { id: 'manage', icon: Settings, label: 'Manage Shop' },
                    ].map(item => (
                        <button 
                            key={item.id}
                            onClick={() => setView(item.id)}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${view === item.id ? 'bg-yellow-500 text-slate-900 font-bold shadow-lg shadow-yellow-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                        >
                            <item.icon size={22} />
                            <span className="hidden lg:block text-sm">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            {/* MAIN AREA */}
            <main className="flex-1 flex flex-col h-full bg-slate-950 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none"></div>

                {/* VIEW: POS (NEW SALE) */}
                {view === 'pos' && (
                    <div className="flex h-full">
                        {/* SERVICE MENU */}
                        <div className="flex-1 p-6 lg:p-10 overflow-y-auto">
                            <header className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-1">Select Services</h2>
                                    <p className="text-slate-500 text-sm">Tap to add to bill</p>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
                                    <input 
                                        className="bg-slate-900 border border-slate-800 text-white pl-12 pr-4 py-3 rounded-xl focus:border-yellow-500 outline-none w-64 transition-all"
                                        placeholder="Search services..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </header>

                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredServices.map(s => (
                                    <button 
                                        key={s.id} 
                                        onClick={() => addToCart(s)}
                                        className="glass p-5 rounded-2xl text-left hover:border-yellow-500/50 hover:bg-slate-800/50 transition-all group active:scale-95"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-yellow-500 group-hover:text-slate-900 transition-colors">
                                            <Scissors size={18} />
                                        </div>
                                        <h3 className="font-bold text-slate-200 mb-1">{s.name}</h3>
                                        <p className="text-yellow-500 font-bold">{formatCurrency(s.price)}</p>
                                    </button>
                                ))}
                                <button onClick={() => setView('manage')} className="border-2 border-dashed border-slate-800 p-5 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:text-white hover:border-slate-600 transition-all">
                                    <Plus size={24} className="mb-2"/>
                                    <span className="text-xs font-bold uppercase">Add New Service</span>
                                </button>
                            </div>
                        </div>

                        {/* CART / BILLING SIDEBAR */}
                        <div className="w-96 bg-slate-900/80 backdrop-blur-xl border-l border-slate-800 p-6 flex flex-col">
                            <h3 className="font-bold text-xl text-white mb-6 flex items-center gap-2"><ShoppingBag size={20} className="text-yellow-500"/> Current Bill</h3>
                            
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Customer Name</label>
                                    <input 
                                        className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white focus:border-yellow-500 outline-none"
                                        value={customerName}
                                        onChange={e => setSelectedCustomer(e.target.value)}
                                        onFocus={e => e.target.select()}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Stylist / Barber</label>
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                                        {staff.map(s => (
                                            <button 
                                                key={s.id}
                                                onClick={() => setSelectedStylist(s.name)}
                                                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${selectedStylist === s.name ? 'bg-yellow-500 text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                                            >
                                                {s.name}
                                            </button>
                                        ))}
                                        {staff.length === 0 && <button onClick={() => setView('manage')} className="text-xs text-yellow-500 underline">Add Staff +</button>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                                {cart.length === 0 ? (
                                    <div className="text-center text-slate-600 mt-10">
                                        <p className="text-sm">No items selected</p>
                                    </div>
                                ) : (
                                    cart.map((item, i) => (
                                        <div key={i} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                                            <div>
                                                <p className="text-sm font-bold text-white">{item.name}</p>
                                                <p className="text-xs text-yellow-500">{formatCurrency(item.price)}</p>
                                            </div>
                                            <button onClick={() => removeFromCart(i)} className="text-slate-500 hover:text-rose-500 p-1"><X size={16}/></button>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="border-t border-slate-800 pt-6">
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-slate-400">Total</span>
                                    <span className="text-3xl font-bold text-white">{formatCurrency(cartTotal)}</span>
                                </div>
                                <button 
                                    onClick={handleCheckout}
                                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 py-4 rounded-xl font-bold text-lg shadow-lg shadow-yellow-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={20} /> Checkout & Print
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW: DASHBOARD */}
                {view === 'dashboard' && (
                    <div className="p-10 overflow-y-auto">
                        <h2 className="text-3xl font-bold text-white mb-8">Daily Overview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                            <div className="glass p-6 rounded-2xl border-l-4 border-emerald-500">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Today's Revenue</p>
                                <p className="text-4xl font-bold text-emerald-400">{formatCurrency(totalRevenue)}</p>
                            </div>
                            <div className="glass p-6 rounded-2xl border-l-4 border-yellow-500">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Customers Served</p>
                                <p className="text-4xl font-bold text-yellow-400">{totalCustomers}</p>
                            </div>
                            <div className="glass p-6 rounded-2xl border-l-4 border-blue-500">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Active Stylists</p>
                                <p className="text-4xl font-bold text-blue-400">{staff.length}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="glass p-8 rounded-2xl">
                                <h3 className="font-bold text-lg text-white mb-6">Recent Transactions</h3>
                                <div className="space-y-4">
                                    {sales.slice(0, 5).map(s => (
                                        <div key={s.id} className="flex justify-between items-center border-b border-slate-800 pb-3">
                                            <div>
                                                <p className="font-bold text-slate-200">{s.customer}</p>
                                                <p className="text-xs text-slate-500">{s.services.length} items • Served by {s.stylist}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-yellow-500">{formatCurrency(s.total)}</p>
                                                <p className="text-xs text-slate-500">{new Date(s.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="glass p-8 rounded-2xl">
                                <h3 className="font-bold text-lg text-white mb-6">Stylist Performance (Today)</h3>
                                <div className="space-y-4">
                                    {staff.map(st => {
                                        const mySales = todaysSales.filter(s => s.stylist === st.name);
                                        const myTotal = mySales.reduce((a,b) => a + b.total, 0);
                                        return (
                                            <div key={st.id} className="bg-slate-800/50 p-4 rounded-xl flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs">{st.name.charAt(0)}</div>
                                                    <span className="font-medium">{st.name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-emerald-400">{formatCurrency(myTotal)}</p>
                                                    <p className="text-xs text-slate-500">{mySales.length} clients</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW: MANAGE (SETTINGS) */}
                {view === 'manage' && (
                    <div className="p-10 overflow-y-auto max-w-4xl mx-auto w-full">
                        <h2 className="text-3xl font-bold text-white mb-8">Shop Management</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* ADD SERVICE */}
                            <div className="glass p-8 rounded-2xl">
                                <h3 className="font-bold text-lg text-yellow-500 mb-4 flex items-center gap-2"><Scissors size={20}/> Add Service</h3>
                                <form onSubmit={handleAddService} className="space-y-4">
                                    <input name="name" required placeholder="Service Name (e.g. Haircut)" className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-white outline-none focus:border-yellow-500" />
                                    <div className="flex gap-4">
                                        <input name="price" type="number" required placeholder="Price (PKR)" className="flex-1 bg-slate-900 border border-slate-700 p-3 rounded-lg text-white outline-none focus:border-yellow-500" />
                                        <select name="category" className="bg-slate-900 border border-slate-700 p-3 rounded-lg text-white outline-none">
                                            <option>Hair</option><option>Beard</option><option>Face</option><option>Other</option>
                                        </select>
                                    </div>
                                    <button className="w-full bg-slate-800 text-white py-3 rounded-lg font-bold hover:bg-slate-700 transition-colors">Save Service</button>
                                </form>
                                
                                <div className="mt-6 max-h-60 overflow-y-auto space-y-2">
                                    {services.map(s => (
                                        <div key={s.id} className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                                            <span>{s.name}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-yellow-500">{formatCurrency(s.price)}</span>
                                                <button onClick={() => deleteDoc(doc(db, DB_PREFIX + 'services', s.id))} className="text-rose-500 hover:bg-rose-500/10 p-1 rounded"><Trash2 size={14}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ADD STAFF */}
                            <div className="glass p-8 rounded-2xl">
                                <h3 className="font-bold text-lg text-yellow-500 mb-4 flex items-center gap-2"><User size={20}/> Manage Staff</h3>
                                <form onSubmit={handleAddStaff} className="space-y-4">
                                    <input name="name" required placeholder="Stylist Name" className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-white outline-none focus:border-yellow-500" />
                                    <button className="w-full bg-slate-800 text-white py-3 rounded-lg font-bold hover:bg-slate-700 transition-colors">Add Staff Member</button>
                                </form>

                                <div className="mt-6 space-y-2">
                                    {staff.map(s => (
                                        <div key={s.id} className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                                            <span className="font-medium">{s.name}</span>
                                            <button onClick={() => deleteDoc(doc(db, DB_PREFIX + 'staff', s.id))} className="text-rose-500 hover:bg-rose-500/10 p-1 rounded"><Trash2 size={14}/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* INVOICE MODAL */}
            {showInvoice && (
                <InvoiceModal 
                    sale={showInvoice} 
                    onClose={() => setShowInvoice(null)} 
                    salonInfo={{ name: "Rehman Hair Salon", address: "Main Market, City", phone: "0300-1234567" }}
                />
            )}
        </div>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);