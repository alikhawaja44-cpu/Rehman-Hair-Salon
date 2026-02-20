import React, { useState, useEffect, useMemo, useRef, createContext, useContext } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Scissors, User, Calendar, DollarSign, Settings, 
  LayoutDashboard, Users, ShoppingBag, Plus, Trash2, 
  CheckCircle, Clock, Search, LogOut, ChevronRight,
  Menu, X, Printer, TrendingUp, Filter, Home, Wallet, CalendarDays, Lock, Unlock, Info, XCircle, CheckCircle2
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy, where, writeBatch, getDocs } from "firebase/firestore";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// --- TOAST CONTEXT ---
const ToastContext = createContext();

const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = (message, type = 'info', duration = 3000) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, duration);
    };

    return (
        <ToastContext.Provider value={showToast}>
            {children}
            <div className="fixed bottom-4 right-4 z-[1000] space-y-2 w-full max-w-xs">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`p-4 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in-up ${
                            toast.type === 'success' ? 'bg-emerald-600 text-white' :
                            toast.type === 'error' ? 'bg-rose-600 text-white' :
                            'bg-slate-800 text-slate-100'
                        }`}
                    >
                        {toast.type === 'success' && <CheckCircle2 size={20} />}
                        {toast.type === 'error' && <XCircle size={20} />}
                        {toast.type === 'info' && <Info size={20} />}
                        <span className="text-sm font-medium">{toast.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

const useToast = () => useContext(ToastContext);

// --- HOOKS ---
function useCollection(colName) {
    const [data, setData] = useState([]);
    useEffect(() => {
        const q = query(collection(db, DB_PREFIX + colName), orderBy("createdAt", "desc"));
        return onSnapshot(q, (snap) => setData(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, [colName]);
    return [data];
}

function useSettings(settingName) {
    const [setting, setSetting] = useState(null);
    const settingDocRef = useMemo(() => doc(db, DB_PREFIX + 'settings', settingName), [settingName]);

    useEffect(() => {
        return onSnapshot(settingDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setSetting(docSnap.data().value);
            } else {
                setSetting(null);
            }
        });
    }, [settingDocRef]);

    const updateSetting = async (value) => {
        await updateDoc(settingDocRef, { value }, { merge: true });
    };

    const setInitialSetting = async (value) => {
        const docSnap = await getDocs(query(collection(db, DB_PREFIX + 'settings'), where("__name__", "==", settingName)));
        if (docSnap.empty) {
            await addDoc(collection(db, DB_PREFIX + 'settings'), { id: settingName, value });
        } else {
            // Document exists, update it instead of creating a new one with an auto-generated ID
            const existingDocId = docSnap.docs[0].id;
            await updateDoc(doc(db, DB_PREFIX + 'settings', existingDocId), { value });
        }
    };


    return [setting, updateSetting, setInitialSetting];
}

// --- COMPONENTS ---
const PinScreen = ({ onPinVerified, onSetPin, isSetupMode, storedPin }) => {
    const [pinInput, setPinInput] = useState('');
    const [confirmPinInput, setConfirmPinInput] = useState('');
    const [error, setError] = useState('');
    const showToast = useToast();

    const handlePinSubmit = () => {
        setError('');
        if (isSetupMode) {
            if (pinInput.length !== 4) {
                setError('PIN must be 4 digits.');
                showToast('PIN must be 4 digits.', 'error');
                return;
            }
            if (pinInput !== confirmPinInput) {
                setError('PINs do not match.');
                showToast('PINs do not match.', 'error');
                return;
            }
            onSetPin(pinInput);
            showToast('PIN set successfully!', 'success');
        } else {
            if (pinInput === storedPin) {
                onPinVerified();
                showToast('PIN verified!', 'success');
            } else {
                setError('Incorrect PIN.');
                showToast('Incorrect PIN.', 'error');
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-[100] p-4 text-white">
            <div className="glass p-8 rounded-3xl text-center max-w-sm w-full">
                <Lock size={48} className="mx-auto text-yellow-500 mb-6" />
                <h2 className="text-3xl font-bold mb-2">{isSetupMode ? "Set Your PIN" : "Enter PIN"}</h2>
                <p className="text-slate-400 mb-6">{isSetupMode ? "This PIN will be used for secure access." : "Enter the 4-digit PIN to proceed."}</p>
                
                <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength="4"
                    value={pinInput}
                    onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*$/.test(value) && value.length <= 4) {
                            setPinInput(value);
                        }
                    }}
                    className="w-full bg-[var(--color-surface)] border-2 border-slate-700 rounded-xl p-4 text-center text-3xl font-bold tracking-widest mb-4 focus:border-[var(--color-primary)] outline-none text-[var(--color-text-light)]"
                    placeholder="••••"
                />
                {isSetupMode && (
                    <input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength="4"
                        value={confirmPinInput}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value) && value.length <= 4) {
                                setConfirmPinInput(value);
                            }
                        }}
                        className="w-full bg-[var(--color-surface)] border-2 border-slate-700 rounded-xl p-4 text-center text-3xl font-bold tracking-widest mb-6 focus:border-[var(--color-primary)] outline-none text-[var(--color-text-light)]"
                        placeholder="Confirm ••••"
                    />
                )}
                
                {error && <p className="text-rose-500 text-sm mb-4">{error}</p>}

                <button
                    onClick={handlePinSubmit}
                    className="w-full bg-[var(--color-primary)] hover:bg-yellow-400 text-slate-900 py-4 rounded-2xl font-black text-lg shadow-lg shadow-[var(--color-primary)]/20 active:scale-95 transition-all"
                >
                    {isSetupMode ? "Set PIN" : "Verify PIN"}
                </button>
            </div>
        </div>
    );
};


const InvoiceModal = ({ sale, onClose, salonInfo }) => (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div id="printable-area" className="bg-white text-[var(--color-background)] w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center border-b border-dashed border-slate-300 bg-slate-50">
                <h1 className="text-2xl font-black tracking-tight mb-1 uppercase text-slate-800">{salonInfo.name}</h1>
                <p className="text-xs font-medium text-slate-500">{salonInfo.address}</p>
                <div className="flex justify-center gap-2 mt-4">
                    <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Invoice</span>
                    <span className="bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-[10px] font-bold px-2 py-1 rounded-full uppercase">#{sale.id.slice(-4)}</span>
                </div>
                <div className="mt-2 text-xs text-slate-400">
                    {new Date(sale.createdAt).toLocaleString()}
                </div>
            </div>
            <div className="p-6 space-y-4">
                <div className="space-y-2">
                    {sale.services.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm items-center">
                            <span className="font-medium text-slate-700">{item.name}</span>
                            <span className="font-bold text-[var(--color-background)]">{formatCurrency(item.price)}</span>
                        </div>
                    ))}

                </div>
                <div className="border-t-2 border-[var(--color-background)] pt-4 flex justify-between items-center text-xl font-black">
                    <span>TOTAL</span>
                    <span>{formatCurrency(sale.total)}</span>
                </div>
            </div>
            <div className="bg-[var(--color-background)] p-4 flex gap-3 print:hidden">
                <button onClick={onClose} className="flex-1 py-3 bg-[var(--color-surface)] text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition-colors">Close</button>
                <button onClick={() => window.print()} className="flex-1 py-3 bg-[var(--color-primary)] text-[var(--color-background)] rounded-xl font-bold text-sm hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[var(--color-primary)]/20"><Printer size={18}/> Print</button>
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
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
    const [isPinVerified, setIsPinVerified] = useState(false);
    const [pinSetting, updatePinSetting, setInitialPinSetting] = useSettings('appPin');
    const [showPinSetup, setShowPinSetup] = useState(false);
    const [showPinVerification, setShowPinVerification] = useState(false);
    const showToast = useToast();

    useEffect(() => {
        if (pinSetting === null) {
            setShowPinSetup(true);
        } else {
            setShowPinVerification(true);
        }
    }, [pinSetting]);


    const [services] = useCollection('services');
    const [staff] = useCollection('staff');
    const [sales] = useCollection('sales');
    const [expenses] = useCollection('expenses');

    // Filter sales and expenses by selected date
    const filteredSales = sales.filter(s => s.date === selectedDate);
    const filteredExpenses = expenses.filter(e => e.date === selectedDate);
    
    const dailyRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
    const dailyExpenseAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const dailyNetProfit = dailyRevenue - dailyExpenseAmount;

    const addToCart = (service) => {
        setCart([...cart, service]);
        showToast(`${service.name} added to cart!`, 'info');
    };
    const removeFromCart = (index) => {
        const removedItem = cart[index];
        setCart(cart.filter((_, i) => i !== index));
        showToast(`${removedItem.name} removed from cart.`, 'info');
    };
    const cartTotal = cart.reduce((sum, item) => sum + Number(item.price), 0);

    const handleCheckout = async () => {
        if (cart.length === 0) {
            showToast("Cart is empty!", 'error');
            return;
        }
        if (!selectedStylist) {
            showToast("Please select a stylist!", 'error');
            return;
        }
        
        const today = new Date().toISOString().split('T')[0];
        
        const saleData = { date: today, createdAt: new Date().toISOString(), stylist: selectedStylist, services: cart, total: cartTotal };
        const docRef = await addDoc(collection(db, DB_PREFIX + 'sales'), saleData);

        // Add entry to daily ledger
        await addDoc(collection(db, DB_PREFIX + 'dailyLedger'), {
            saleId: docRef.id,
            date: today,
            createdAt: new Date().toISOString(),
            stylist: selectedStylist,
            total: cartTotal,
            services: cart,
            type: 'sale' // To distinguish from other potential ledger entries like expenses, etc.
        });

        setShowInvoice({ id: docRef.id, ...saleData });
        setCart([]);
        showToast('Checkout successful!', 'success');
    };

    const handleAddService = async (e) => {
        e.preventDefault();
        const { name, price } = e.target.elements;
        if(name.value && price.value) {
            await addDoc(collection(db, DB_PREFIX + 'services'), { name: name.value, price: Number(price.value), createdAt: new Date().toISOString() });
            e.target.reset();
            showToast('Service added!', 'success');
        } else {
            showToast('Please fill all fields for service.', 'error');
        }
    };

    const handleAddStaff = async (e) => {
        e.preventDefault();
        if(e.target.name.value) {
            await addDoc(collection(db, DB_PREFIX + 'staff'), { name: e.target.name.value, role: 'Stylist', createdAt: new Date().toISOString() });
            e.target.reset();
            showToast('Staff member added!', 'success');
        } else {
            showToast('Please enter staff name.', 'error');
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        const { name, amount } = e.target.elements;
        if(name.value && amount.value) {
            await addDoc(collection(db, DB_PREFIX + 'expenses'), { 
                description: name.value, 
                amount: Number(amount.value), 
                date: selectedDate, // Use the selected filter date for expenses so they can add to specific days
                createdAt: new Date().toISOString() 
            });
            e.target.reset();
            showToast('Expense added!', 'success');
        } else {
            showToast('Please fill all fields for expense.', 'error');
        }
    };

    const handleSetPin = async (newPin) => {
        await setInitialPinSetting(newPin);
        setShowPinSetup(false);
        setIsPinVerified(true);
        showToast('PIN set successfully!', 'success');
    };

    const handlePinVerifySuccess = () => {
        setShowPinVerification(false);
        setIsPinVerified(true);
        showToast('PIN verified!', 'success');
    };

    const filteredServices = services.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const NavItem = ({ id, icon: Icon, label, requiresPin = false }) => {
        const handleClick = () => {
            if (requiresPin && !isPinVerified) {
                setShowPinVerification(true);
                return;
            }
            setView(id);
        };
        return (
            <button onClick={handleClick} className={`w-full flex flex-col md:flex-row items-center md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all ${view === id ? 'text-yellow-500 font-bold bg-slate-800/50' : 'text-slate-400 hover:text-slate-200'}`}>
                <Icon size={24} className="mb-1 md:mb-0" />
                <span className="text-[10px] md:text-sm font-medium">{label}</span>
            </button>
        );
    };

    if (showPinSetup) {
        return <PinScreen isSetupMode={true} onSetPin={handleSetPin} />;
    }

    if (showPinVerification) {
        return <PinScreen isSetupMode={false} storedPin={pinSetting} onPinVerified={handlePinVerifySuccess} />;
    }

    // Dashboard Chart Data
    const chartData = useMemo(() => {
        // Group sales and expenses by date to show trends
        const dailyData = {};

        filteredSales.forEach(sale => {
            if (!dailyData[sale.date]) dailyData[sale.date] = { date: sale.date, sales: 0, expenses: 0 };
            dailyData[sale.date].sales += sale.total;
        });

        filteredExpenses.forEach(expense => {
            if (!dailyData[expense.date]) dailyData[expense.date] = { date: expense.date, sales: 0, expenses: 0 };
            dailyData[expense.date].expenses += expense.amount;
        });

        // Convert to array and sort by date for the chart
        return Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [filteredSales, filteredExpenses]);


    return (
        <ToastProvider>
            <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[var(--color-background)] text-[var(--color-text-light)] font-sans">
                {/* MOBILE HEADER */}
                <div className="md:hidden flex justify-between items-center p-4 bg-[var(--color-surface)] border-b border-slate-800 z-50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[var(--color-primary)] rounded-lg flex items-center justify-center text-slate-900"><Scissors size={18} /></div>
                        <span className="font-bold text-lg">REHMAN</span>
                    </div>
                    <div className="text-xs font-bold text-[var(--color-text-dark)]">{formatDate(selectedDate)}</div>
                </div>

                {/* SIDEBAR / BOTTOM NAV */}
                <nav className="fixed bottom-0 w-full md:relative md:w-64 bg-[var(--color-surface)] border-t md:border-r border-slate-800 flex md:flex-col justify-around md:justify-start p-2 md:p-6 z-40 gap-1 md:gap-2">
                    <div className="hidden md:flex items-center gap-3 px-4 mb-8">
                        <div className="w-10 h-10 bg-[var(--color-primary)] rounded-xl flex items-center justify-center text-slate-900 shadow-lg shadow-[var(--color-primary)]/20"><Scissors size={24} /></div>
                        <div><h1 className="font-bold text-xl leading-none">REHMAN</h1><span className="text-xs text-[var(--color-primary)] font-bold uppercase">Salon Manager</span></div>
                    </div>
                    <NavItem id="pos" icon={Scissors} label="Service" />
                    <NavItem id="dashboard" icon={LayoutDashboard} label="Stats" />
                    <NavItem id="expenses" icon={Wallet} label="Expenses" />
                    <NavItem id="manage" icon={Settings} label="Manage" requiresPin={true} />
                </nav>

                {/* MAIN CONTENT */}
                <main className="flex-1 flex flex-col h-full overflow-hidden relative pb-16 md:pb-0">
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[var(--color-primary)]/5 via-transparent to-transparent pointer-events-none"></div>

                    {/* DATE FILTER HEADER (Visible on Dashboard & Expenses) */}
                    {(view === 'dashboard' || view === 'expenses') && (
                        <div className="p-6 md:p-10 pb-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-1 capitalize">{view}</h2>
                                <p className="text-[var(--color-text-dark)] text-sm">Overview for {formatDate(selectedDate)}</p>
                            </div>
                            <div className="bg-[var(--color-surface)] p-2 rounded-xl border border-slate-800 flex items-center gap-3">
                                <CalendarDays size={20} className="text-[var(--color-primary)] ml-2" />
                                <input 
                                    type="date" 
                                    value={selectedDate} 
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="bg-transparent text-white font-bold outline-none text-sm cursor-pointer"
                                />
                            </div>
                        </div>
                    )}


                {view === 'pos' && (
                    <div className="flex flex-col md:flex-row h-full">
                        {/* SERVICE GRID */}
                        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                            <div className="relative mb-6">
                                <Search className="absolute left-4 top-3.5 text-[var(--color-text-dark)]" size={20} />
                                <input 
                                    className="w-full bg-[var(--color-surface)] border border-[var(--color-surface)] text-[var(--color-text-light)] pl-12 pr-4 py-3 rounded-2xl focus:border-[var(--color-primary)] outline-none transition-all placeholder:text-[var(--color-text-dark)]"
                                    placeholder="Search services..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 pb-24 md:pb-0">
                                {filteredServices.map(s => (
                                    <button 
                                        key={s.id} 
                                        onClick={() => addToCart(s)}
                                        className="glass p-4 rounded-2xl text-left hover:bg-[var(--color-surface)] hover:border-[var(--color-primary)]/30 transition-all active:scale-95 group relative overflow-hidden flex flex-col justify-between h-32"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
                                        <h3 className="font-bold text-[var(--color-text-light)] mb-1 relative z-10 text-lg">{s.name}</h3>
                                        <p className="text-[var(--color-primary)] font-bold text-xl relative z-10">{formatCurrency(s.price)}</p>
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
                                        <button 
                                            key={s.id} 
                                            onClick={() => setSelectedStylist(s.name)}
                                            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${selectedStylist === s.name ? 'bg-[var(--color-primary)] text-slate-900 border-[var(--color-primary)]' : 'bg-slate-800 text-[var(--color-text-dark)] border-slate-700 hover:border-slate-600'}`}
                                        >{s.name}</button>
                                    ))}
                                </div>
                            </div>

                                {/* Cart Items */}
                                <div className="flex-1 flex flex-col overflow-y-auto space-y-2 mb-4 custom-scrollbar">
                                    {cart.length === 0 ? (
                                        <div className="text-center text-[var(--color-text-dark)] py-8">
                                            <ShoppingBag size={48} className="mx-auto mb-4" />
                                            <p className="font-medium">Your cart is empty.</p>
                                            <p className="text-sm">Add services to get started!</p>
                                        </div>
                                    ) : (
                                        cart.map((item, i) => (
                                            <div key={i} className="flex justify-between items-center bg-slate-800 p-3 rounded-xl border border-slate-700/50">
                                                <span className="font-medium text-sm text-[var(--color-text-light)]">{item.name}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[var(--color-primary)] font-bold text-sm">{formatCurrency(item.price)}</span>
                                                    <button onClick={() => removeFromCart(i)} className="text-slate-500 hover:text-rose-500 transition-colors"><X size={14}/></button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Checkout Button */}
                                <div className="mt-auto">
                                    <button onClick={handleCheckout} className="w-full bg-[var(--color-primary)] hover:bg-yellow-400 text-slate-900 py-4 rounded-2xl font-black text-lg shadow-lg shadow-[var(--color-primary)]/20 active:scale-95 transition-all flex items-center justify-between px-6">
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
                    <div className="p-6 md:p-10 pt-6 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="glass p-5 rounded-2xl border border-slate-800 bg-[var(--color-surface)]/50">
                                <p className="text-[var(--color-text-dark)] text-xs font-bold uppercase mb-1">Total Revenue</p>
                                <p className="text-2xl md:text-3xl font-black text-emerald-400">{formatCurrency(dailyRevenue)}</p>
                            </div>
                            <div className="glass p-5 rounded-2xl border border-slate-800 bg-[var(--color-surface)]/50">
                                <p className="text-[var(--color-text-dark)] text-xs font-bold uppercase mb-1">Total Expenses</p>
                                <p className="text-2xl md:text-3xl font-black text-rose-400">{formatCurrency(dailyExpenseAmount)}</p>
                            </div>
                            <div className="glass p-5 rounded-2xl border border-slate-800 bg-[var(--color-surface)]/50 col-span-2 md:col-span-2">
                                <p className="text-[var(--color-text-dark)] text-xs font-bold uppercase mb-1">Net Profit ({formatDate(selectedDate)})</p>
                                <p className={`text-2xl md:text-3xl font-black ${dailyNetProfit >= 0 ? 'text-[var(--color-primary)]' : 'text-rose-400'}`}>{formatCurrency(dailyNetProfit)}</p>
                            </div>
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            <div className="glass p-6 rounded-2xl border border-slate-800 h-80">
                                <h3 className="font-bold text-lg mb-4 text-[var(--color-text-light)]">Daily Sales</h3>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="date" stroke="#94a3b8" tickFormatter={(tick) => new Date(tick).getDate()} />
                                        <YAxis stroke="#94a3b8" tickFormatter={(tick) => formatCurrency(tick, 0)} />
                                        <Tooltip 
                                            cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                                            formatter={(value) => formatCurrency(value, 0)}
                                            labelFormatter={(label) => `Date: ${formatDate(label)}`}
                                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                                            itemStyle={{ color: '#e2e8f0' }}
                                        />
                                        <Bar dataKey="sales" fill="var(--color-primary)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="glass p-6 rounded-2xl border border-slate-800 h-80">
                                <h3 className="font-bold text-lg mb-4 text-[var(--color-text-light)]">Daily Expenses</h3>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="date" stroke="#94a3b8" tickFormatter={(tick) => new Date(tick).getDate()} />
                                        <YAxis stroke="#94a3b8" tickFormatter={(tick) => formatCurrency(tick, 0)} />
                                        <Tooltip 
                                            cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                                            formatter={(value) => formatCurrency(value, 0)}
                                            labelFormatter={(label) => `Date: ${formatDate(label)}`}
                                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                                            itemStyle={{ color: '#e2e8f0' }}
                                        />
                                        <Bar dataKey="expenses" fill="#ef4444" /> {/* Rose-500 */}
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        
                        <div className="glass p-6 rounded-2xl border border-slate-800">
                            <h3 className="font-bold text-lg mb-4 text-[var(--color-text-light)]">Sales History ({formatDate(selectedDate)})</h3>
                            <div className="space-y-3">
                                {filteredSales.length === 0 ? <p className="text-[var(--color-text-dark)] text-sm italic">No sales found for this date.</p> : filteredSales.map(s => (
                                    <div key={s.id} className="flex justify-between items-center py-3 border-b border-slate-800 last:border-0">
                                        <div>
                                            <p className="font-bold text-[var(--color-text-light)] text-sm">{s.stylist}</p>
                                            <p className="text-xs text-[var(--color-text-dark)]">{new Date(s.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} • {s.services.length} items</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <p className="font-bold text-emerald-400">{formatCurrency(s.total)}</p>
                                            <button onClick={() => deleteDoc(doc(db, DB_PREFIX + 'sales', s.id))} className="text-slate-600 hover:text-rose-500 transition-colors"><Trash2 size={14}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW: EXPENSES */}
                {view === 'expenses' && (
                    <div className="p-6 md:p-10 pt-6 overflow-y-auto max-w-2xl mx-auto w-full pb-24">
                        <div className="glass p-6 rounded-3xl border border-slate-800 mb-8">
                            <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2"><Wallet className="text-rose-500"/> Add Expense</h3>
                            <form onSubmit={handleAddExpense} className="flex gap-2 mb-4">
                                <input name="name" required placeholder="Description (e.g. Tea, Bill)" className="flex-1 bg-[var(--color-background)] border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500 text-[var(--color-text-light)] placeholder:text-[var(--color-text-dark)]" />
                                <input name="amount" type="number" required placeholder="Amount" className="w-24 bg-[var(--color-background)] border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500 text-[var(--color-text-light)] placeholder:text-[var(--color-text-dark)]" />
                                <button className="bg-rose-500 text-white p-3 rounded-xl font-bold hover:bg-rose-600 transition-colors"><Plus size={20}/></button>
                            </form>
                            <p className="text-xs text-[var(--color-text-dark)]">* Expenses added will be for: <span className="text-[var(--color-text-light)] font-bold">{formatDate(selectedDate)}</span></p>
                        </div>
                        
                        <div className="space-y-3">
                            <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">Expenses for {formatDate(selectedDate)}</h3>
                            {filteredExpenses.length === 0 ? (
                                <p className="text-slate-600 text-center py-8">No expenses recorded for this date.</p>
                            ) : (
                                filteredExpenses.map(e => (
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
                {view === 'manage' && isPinVerified && (
                    <div className="p-6 md:p-10 overflow-y-auto max-w-2xl mx-auto w-full pb-24">
                        <div className="space-y-8">
                            {/* PIN Management */}
                            <div className="glass p-6 rounded-3xl border border-slate-800">
                                <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2"><Lock className="text-yellow-500"/> PIN Security</h3>
                                <p className="text-slate-400 text-sm mb-4">Manage the security PIN for the application. Current PIN status: {pinSetting ? <span className="text-emerald-400">Set</span> : <span className="text-rose-400">Not Set</span>}</p>
                                <button 
                                    onClick={() => setShowPinSetup(true)}
                                    className="bg-yellow-500 text-slate-900 py-3 px-6 rounded-xl font-bold text-sm hover:bg-yellow-400 transition-colors flex items-center gap-2"
                                >
                                    <Unlock size={18}/> {pinSetting ? "Change PIN" : "Set PIN"}
                                </button>
                            </div>

                            <div className="glass p-6 rounded-3xl border border-slate-800">
                                <h3 className="font-bold text-lg text-[var(--color-text-light)] mb-4 flex items-center gap-2"><Scissors className="text-[var(--color-primary)]"/> Add Service</h3>
                                <form onSubmit={handleAddService} className="flex gap-2 mb-4">
                                    <input name="name" required placeholder="Name" className="flex-1 bg-[var(--color-background)] border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-text-light)] placeholder:text-[var(--color-text-dark)]" />
                                    <input name="price" type="number" required placeholder="Price" className="w-24 bg-[var(--color-background)] border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-text-light)] placeholder:text-[var(--color-text-dark)]" />
                                    <button className="bg-[var(--color-primary)] text-slate-900 p-3 rounded-xl font-bold hover:bg-yellow-400 transition-colors"><Plus size={20}/></button>
                                </form>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {services.map(s => (
                                        <div key={s.id} className="flex justify-between items-center bg-[var(--color-surface)]/50 p-3 rounded-xl border border-slate-800/50">
                                            <span className="text-sm font-medium text-[var(--color-text-light)]">{s.name}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-[var(--color-primary)] font-bold">{formatCurrency(s.price)}</span>
                                                <button onClick={() => deleteDoc(doc(db, DB_PREFIX + 'services', s.id))} className="text-slate-600 hover:text-rose-500 transition-colors"><Trash2 size={14}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="glass p-6 rounded-3xl border border-slate-800">
                                <h3 className="font-bold text-lg text-[var(--color-text-light)] mb-4 flex items-center gap-2"><User className="text-[var(--color-secondary)]"/> Add Staff</h3>
                                <form onSubmit={handleAddStaff} className="flex gap-2 mb-4">
                                    <input name="name" required placeholder="Staff Name" className="flex-1 bg-[var(--color-background)] border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--color-secondary)] text-[var(--color-text-light)] placeholder:text-[var(--color-text-dark)]" />
                                    <button className="bg-[var(--color-secondary)] text-slate-900 p-3 rounded-xl font-bold hover:bg-teal-500 transition-colors"><Plus size={20}/></button>
                                </form>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {staff.map(s => (
                                        <div key={s.id} className="flex justify-between items-center bg-[var(--color-surface)]/50 p-3 rounded-xl border border-slate-800/50">
                                            <span className="text-sm font-medium text-[var(--color-text-light)]">{s.name}</span>
                                            <button onClick={() => deleteDoc(doc(db, DB_PREFIX + 'staff', s.id))} className="text-slate-600 hover:text-rose-500 transition-colors"><Trash2 size={14}/></button>
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
        </ToastProvider>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
