import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Scissors, User, Calendar, DollarSign, Settings, 
  LayoutDashboard, Users, ShoppingBag, Plus, Trash2, 
  CheckCircle, Clock, Search, LogOut, ChevronRight,
  Menu, X, Printer, TrendingUp, Filter, Home, Wallet, CalendarDays, Lock, Unlock
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy, where, writeBatch, getDocs } from "firebase/firestore";

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

    const handlePinSubmit = () => {
        setError('');
        if (isSetupMode) {
            if (pinInput.length !== 4) {
                setError('PIN must be 4 digits.');
                return;
            }
            if (pinInput !== confirmPinInput) {
                setError('PINs do not match.');
                return;
            }
            onSetPin(pinInput);
        } else {
            if (pinInput === storedPin) {
                onPinVerified();
            } else {
                setError('Incorrect PIN.');
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
                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-4 text-center text-3xl font-bold tracking-widest mb-4 focus:border-yellow-500 outline-none"
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
                        className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-4 text-center text-3xl font-bold tracking-widest mb-6 focus:border-yellow-500 outline-none"
                        placeholder="Confirm ••••"
                    />
                )}
                
                {error && <p className="text-rose-500 text-sm mb-4">{error}</p>}

                <button
                    onClick={handlePinSubmit}
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 py-4 rounded-2xl font-black text-lg shadow-lg shadow-yellow-500/20 active:scale-95 transition-all"
                >
                    {isSetupMode ? "Set PIN" : "Verify PIN"}
                </button>
            </div>
        </div>
    );
};


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
                <div className="mt-2 text-xs text-slate-400">
                    {new Date(sale.createdAt).toLocaleString()}
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
);\nconst App = () => {\n    const [view, setView] = useState('pos');\n    const [cart, setCart] = useState([]);\n    const [selectedStylist, setSelectedStylist] = useState('');\n    const [showInvoice, setShowInvoice] = useState(null);\n    const [searchTerm, setSearchTerm] = useState('');\n    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Default to today\n    const [isPinVerified, setIsPinVerified] = useState(false);\n    const [pinSetting, updatePinSetting, setInitialPinSetting] = useSettings('appPin');\n    const [showPinSetup, setShowPinSetup] = useState(false);\n    const [showPinVerification, setShowPinVerification] = useState(false);\n\n    useEffect(() => {\n        if (pinSetting === null) {\n            setShowPinSetup(true);\n        } else {\n            setShowPinVerification(true);\n        }\n    }, [pinSetting]);\n\n\n    const [services] = useCollection('services');\n    const [staff] = useCollection('staff');\n    const [sales] = useCollection('sales');\n    const [expenses] = useCollection('expenses');\n\n    // Filter sales and expenses by selected date\n    const filteredSales = sales.filter(s => s.date === selectedDate);\n    const filteredExpenses = expenses.filter(e => e.date === selectedDate);\n    \n    const dailyRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);\n    const dailyExpenseAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);\n    const dailyNetProfit = dailyRevenue - dailyExpenseAmount;\n\n    const addToCart = (service) => setCart([...cart, service]);\n    const removeFromCart = (index) => setCart(cart.filter((_, i) => i !== index));\n    const cartTotal = cart.reduce((sum, item) => sum + Number(item.price), 0);\n\n    const handleCheckout = async () => {\n        if (cart.length === 0) return alert(\"Cart is empty!\");\n        if (!selectedStylist) return alert(\"Select a stylist!\");\n        \n        const today = new Date().toISOString().split('T')[0];\n        \n        const saleData = { date: today, createdAt: new Date().toISOString(), stylist: selectedStylist, services: cart, total: cartTotal };\n        const docRef = await addDoc(collection(db, DB_PREFIX + 'sales'), saleData);\n\n        // Add entry to daily ledger\n        await addDoc(collection(db, DB_PREFIX + 'dailyLedger'), {\n            saleId: docRef.id,\n            date: today,\n            createdAt: new Date().toISOString(),\n            stylist: selectedStylist,\n            total: cartTotal,\n            services: cart,\n            type: 'sale' // To distinguish from other potential ledger entries like expenses, etc.\n        });\n\n        setShowInvoice({ id: docRef.id, ...saleData });\n        setCart([]);\n    };\n\n    const handleAddService = (e) => {\n        e.preventDefault();\n        const { name, price } = e.target.elements;\n        if(name.value && price.value) {\n            addDoc(collection(db, DB_PREFIX + 'services'), { name: name.value, price: Number(price.value), createdAt: new Date().toISOString() });\n            e.target.reset();\n        }\n    };\n\n    const handleAddStaff = (e) => {\n        e.preventDefault();\n        if(e.target.name.value) {\n            addDoc(collection(db, DB_PREFIX + 'staff'), { name: e.target.name.value, role: 'Stylist', createdAt: new Date().toISOString() });\n            e.target.reset();\n        }\n    };\n\n    const handleAddExpense = (e) => {\n        e.preventDefault();\n        const { name, amount } = e.target.elements;\n        if(name.value && amount.value) {\n            addDoc(collection(db, DB_PREFIX + 'expenses'), { \n                description: name.value, \n                amount: Number(amount.value), \n                date: selectedDate, // Use the selected filter date for expenses so they can add to specific days\n                createdAt: new Date().toISOString() \n            });\n            e.target.reset();\n        }\n    };\n\n    const handleSetPin = async (newPin) => {\n        await setInitialPinSetting(newPin);\n        setShowPinSetup(false);\n        setIsPinVerified(true);\n    };\n\n    const handlePinVerifySuccess = () => {\n        setShowPinVerification(false);\n        setIsPinVerified(true);\n    };\n\n    const filteredServices = services.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));\n\n    const NavItem = ({ id, icon: Icon, label, requiresPin = false }) => {\n        const handleClick = () => {\n            if (requiresPin && !isPinVerified) {\n                setShowPinVerification(true);\n                return;\n            }\n            setView(id);\n        };\n        return (\n            <button onClick={handleClick} className={`w-full flex flex-col md:flex-row items-center md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all ${view === id ? 'text-yellow-500 font-bold bg-slate-800/50' : 'text-slate-400 hover:text-slate-200'}`}>\n                <Icon size={24} className="mb-1 md:mb-0" />\n                <span className="text-[10px] md:text-sm font-medium">{label}</span>\n            </button>\n        );\n    };\n\n    if (showPinSetup) {\n        return <PinScreen isSetupMode={true} onSetPin={handleSetPin} />;\n    }\n\n    if (showPinVerification) {\n        return <PinScreen isSetupMode={false} storedPin={pinSetting} onPinVerified={handlePinVerifySuccess} />;\n    }\n\n    return (\n        <div className=\"flex flex-col md:flex-row h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans\">\n            {/* MOBILE HEADER */}\n            <div className=\"md:hidden flex justify-between items-center p-4 bg-slate-900 border-b border-slate-800 z-50\">\n                <div className=\"flex items-center gap-2\">\n                    <div className=\"w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center text-slate-900\"><Scissors size={18} /></div>\n                    <span className=\"font-bold text-lg\">REHMAN</span>\n                </div>\n                <div className=\"text-xs font-bold text-slate-400\">{formatDate(selectedDate)}</div>\n            </div>\n\n            {/* SIDEBAR / BOTTOM NAV */}\n            <nav className=\"fixed bottom-0 w-full md:relative md:w-64 bg-slate-900 border-t md:border-r border-slate-800 flex md:flex-col justify-around md:justify-start p-2 md:p-6 z-40 gap-1 md:gap-2\">\n                <div className=\"hidden md:flex items-center gap-3 px-4 mb-8\">\n                    <div className=\"w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center text-slate-900 shadow-lg shadow-yellow-500/20\"><Scissors size={24} /></div>\n                    <div><h1 className=\"font-bold text-xl leading-none\">REHMAN</h1><span className=\"text-xs text-yellow-500 font-bold uppercase\">Salon Manager</span></div>\n                </div>\n                <NavItem id=\"pos\" icon={Scissors} label=\"Service\" />\n                <NavItem id=\"dashboard\" icon={LayoutDashboard} label=\"Stats\" />\n                <NavItem id=\"expenses\" icon={Wallet} label=\"Expenses\" />\n                <NavItem id=\"manage\" icon={Settings} label=\"Manage\" requiresPin={true} />\n            </nav>\n\n            {/* MAIN CONTENT */}\n            <main className=\"flex-1 flex flex-col h-full overflow-hidden relative pb-16 md:pb-0\">\n                <div className=\"absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-500/5 via-transparent to-transparent pointer-events-none\"></div>\n\n                {/* DATE FILTER HEADER (Visible on Dashboard & Expenses) */}\n                {(view === 'dashboard' || view === 'expenses') && (\n                    <div className=\"p-6 md:p-10 pb-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4\">\n                        <div>\n                            <h2 className=\"text-3xl font-bold text-white mb-1 capitalize\">{view}</h2>\n                            <p className=\"text-slate-500 text-sm\">Overview for {formatDate(selectedDate)}</p>\n                        </div>\n                        <div className=\"bg-slate-900 p-2 rounded-xl border border-slate-800 flex items-center gap-3\">\n                            <CalendarDays size={20} className=\"text-yellow-500 ml-2\" />\n                            <input \n                                type=\"date\" \n                                value={selectedDate} \n                                onChange={(e) => setSelectedDate(e.target.value)}\n                                className=\"bg-transparent text-white font-bold outline-none text-sm cursor-pointer\"\n                            />\n                        </div>\n                    </div>\n                )}\n\n                {view === 'pos' && (\n                    <div className=\"flex flex-col md:flex-row h-full\">\n                        {/* SERVICE GRID */}\n                        <div className=\"flex-1 p-4 md:p-8 overflow-y-auto\">\n                            <div className=\"relative mb-6\">\n                                <Search className=\"absolute left-4 top-3.5 text-slate-500\" size={20} />\n                                <input className=\"w-full bg-slate-900/80 border border-slate-800 text-white pl-12 pr-4 py-3 rounded-2xl focus:border-yellow-500 outline-none transition-all placeholder:text-slate-600\" placeholder=\"Search services...\" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />\n                            </div>\n                            <div className=\"grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 pb-24 md:pb-0\">\n                                {filteredServices.map(s => (\n                                    <button key={s.id} onClick={() => addToCart(s)} className=\"glass p-4 rounded-2xl text-left hover:bg-slate-800 hover:border-yellow-500/30 transition-all active:scale-95 group relative overflow-hidden\">\n                                        <div className=\"absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity\"/>\n                                        <h3 className=\"font-bold text-slate-200 mb-1 relative z-10\">{s.name}</h3>\n                                        <p className=\"text-yellow-500 font-bold text-lg relative z-10\">{formatCurrency(s.price)}</p>\n                                    </button>\n                                ))}\n                            </div>\n                        </div>\n\n                        {/* CART DRAWER */}\n                        <div className=\"fixed md:static bottom-16 md:bottom-auto left-0 w-full md:w-96 bg-slate-900 md:bg-slate-900/50 backdrop-blur-xl border-t md:border-l border-slate-800 p-4 md:p-6 flex flex-col shadow-2xl md:shadow-none z-30 h-auto md:h-full transition-transform\">\n                            {/* Stylist Selector */}\n                            <div className=\"mb-4\">\n                                <label className=\"text-xs font-bold text-slate-500 uppercase mb-2 block\">Stylist</label>\n                                <div className=\"flex gap-2 overflow-x-auto pb-2 scrollbar-hide\">\n                                    {staff.map(s => (\n                                        <button key={s.id} onClick={() => setSelectedStylist(s.name)} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${selectedStylist === s.name ? 'bg-yellow-500 text-slate-900 border-yellow-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>{s.name}</button>\n                                    ))}\n                                </div>\n                            </div>\n\n                            {/* Cart Items */}\n                            <div className=\"hidden md:flex flex-1 flex-col overflow-y-auto space-y-2 mb-4\">\n                                {cart.map((item, i) => (\n                                    <div key={i} className=\"flex justify-between items-center bg-slate-800 p-3 rounded-xl border border-slate-700/50\">\n                                        <span className=\"font-medium text-sm\">{item.name}</span>\n                                        <div className=\"flex items-center gap-3\">\n                                            <span className=\"text-yellow-500 font-bold text-sm\">{formatCurrency(item.price)}</span>\n                                            <button onClick={() => removeFromCart(i)} className=\"text-slate-500 hover:text-rose-500\"><X size={14}/></button>\n                                        </div>\n                                    </div>\n                                ))}\n                            </div>\n\n                            {/* Checkout Button */}\n                            <div className=\"mt-auto\">\n                                <button onClick={handleCheckout} className=\"w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 py-4 rounded-2xl font-black text-lg shadow-lg shadow-yellow-500/20 active:scale-95 transition-all flex items-center justify-between px-6\">\n                                    <div className=\"flex flex-col items-start leading-none\">\n                                        <span className=\"text-xs uppercase opacity-70 font-bold\">Total</span>\n                                        <span>{formatCurrency(cartTotal)}</span>\n                                    </div>\n                                    <div className=\"flex items-center gap-2 text-sm font-bold uppercase tracking-wider\">\n                                        Checkout <ChevronRight size={18} />\n                                    </div>\n                                </button>\n                            </div>\n                        </div>\n                    </div>\n                )}\n\n                {/* VIEW: DASHBOARD */}\n                {view === 'dashboard' && (\n                    <div className=\"p-6 md:p-10 pt-6 overflow-y-auto\">\n                        <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4 mb-8\">\n                            <div className=\"glass p-5 rounded-2xl border border-slate-800 bg-slate-900/50\">\n                                <p className=\"text-slate-400 text-xs font-bold uppercase mb-1\">Total Revenue</p>\n                                <p className=\"text-2xl md:text-3xl font-black text-emerald-400\">{formatCurrency(dailyRevenue)}</p>\n                            </div>\n                            <div className=\"glass p-5 rounded-2xl border border-slate-800 bg-slate-900/50\">\n                                <p className=\"text-slate-400 text-xs font-bold uppercase mb-1\">Total Expenses</p>\n                                <p className=\"text-2xl md:text-3xl font-black text-rose-400\">{formatCurrency(dailyExpenseAmount)}</p>\n                            </div>\n                            <div className=\"glass p-5 rounded-2xl border border-slate-800 bg-slate-900/50 col-span-2 md:col-span-2\">\n                                <p className=\"text-slate-400 text-xs font-bold uppercase mb-1\">Net Profit ({formatDate(selectedDate)})</p>\n                                <p className={`text-2xl md:text-3xl font-black ${dailyNetProfit >= 0 ? 'text-yellow-400' : 'text-rose-400'}`}>{formatCurrency(dailyNetProfit)}</p>\n                            </div>\n                        </div>\n                        <div className=\"glass p-6 rounded-2xl border border-slate-800\">\n                            <h3 className=\"font-bold text-lg mb-4 text-white\">Sales History ({formatDate(selectedDate)})</h3>\n                            <div className=\"space-y-3\">\n                                {filteredSales.length === 0 ? <p className=\"text-slate-500 text-sm italic\">No sales found for this date.</p> : filteredSales.map(s => (\n                                    <div key={s.id} className=\"flex justify-between items-center py-3 border-b border-slate-800 last:border-0\">\n                                        <div>\n                                            <p className=\"font-bold text-slate-200 text-sm\">{s.stylist}</p>\n                                            <p className=\"text-xs text-slate-500\">{new Date(s.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} • {s.services.length} items</p>\n                                        </div>\n                                        <div className=\"flex items-center gap-3\">\n                                            <p className=\"font-bold text-emerald-400\">{formatCurrency(s.total)}</p>\n                                            <button onClick={() => deleteDoc(doc(db, DB_PREFIX + 'sales', s.id))} className=\"text-slate-600 hover:text-rose-500\"><Trash2 size={14}/></button>\n                                        </div>\n                                    </div>\n                                ))}\n                            </div>\n                        </div>\n                    </div>\n                )}\n\n                {/* VIEW: EXPENSES */}\n                {view === 'expenses' && (\n                    <div className=\"p-6 md:p-10 pt-6 overflow-y-auto max-w-2xl mx-auto w-full pb-24\">\n                        <div className=\"glass p-6 rounded-3xl border border-slate-800 mb-8\">\n                            <h3 className=\"font-bold text-lg text-white mb-4 flex items-center gap-2\"><Wallet className=\"text-rose-500\"/> Add Expense</h3>\n                            <form onSubmit={handleAddExpense} className=\"flex gap-2 mb-4\">\n                                <input name=\"name\" required placeholder=\"Description (e.g. Tea, Bill)\" className=\"flex-1 bg-slate-950 border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500\" />\n                                <input name=\"amount\" type=\"number\" required placeholder=\"Amount\" className=\"w-24 bg-slate-950 border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500\" />\n                                <button className=\"bg-rose-500 text-white p-3 rounded-xl font-bold\"><Plus size={20}/></button>\n                            </form>\n                            <p className=\"text-xs text-slate-500\">* Expenses added will be for: <span className=\"text-white font-bold\">{formatDate(selectedDate)}</span></p>\n                        </div>\n                        \n                        <div className=\"space-y-3\">\n                            <h3 className=\"text-slate-500 text-sm font-bold uppercase tracking-wider mb-2\">Expenses for {formatDate(selectedDate)}</h3>\n                            {filteredExpenses.length === 0 ? (\n                                <p className=\"text-slate-600 text-center py-8\">No expenses recorded for this date.</p>\n                            ) : (\n                                filteredExpenses.map(e => (\n                                    <div key={e.id} className=\"glass p-4 rounded-2xl flex justify-between items-center border border-slate-800/50\">\n                                        <span className=\"font-medium text-slate-200\">{e.description}</span>\n                                        <div className=\"flex items-center gap-3\">\n                                            <span className=\"font-bold text-rose-400\">{formatCurrency(e.amount)}</span>\n                                            <button onClick={() => deleteDoc(doc(db, DB_PREFIX + 'expenses', e.id))} className=\"text-slate-600 hover:text-rose-500\"><Trash2 size={16}/></button>\n                                        </div>\n                                    </div>\n                                ))\n                            )}\n                        </div>\n                    </div>\n                )}\n\n                {/* VIEW: MANAGE */}\n                {view === 'manage' && isPinVerified && (\n                    <div className=\"p-6 md:p-10 overflow-y-auto max-w-2xl mx-auto w-full pb-24\">\n                        <div className=\"space-y-8\">\n                            {/* PIN Management */}\n                            <div className=\"glass p-6 rounded-3xl border border-slate-800\">\n                                <h3 className=\"font-bold text-lg text-white mb-4 flex items-center gap-2\"><Lock className=\"text-yellow-500\"/> PIN Security</h3>\n                                <p className=\"text-slate-400 text-sm mb-4\">Manage the security PIN for the application. Current PIN status: {pinSetting ? <span className=\"text-emerald-400\">Set</span> : <span className=\"text-rose-400\">Not Set</span>}</p>\n                                <button \n                                    onClick={() => setShowPinSetup(true)}\n                                    className=\"bg-yellow-500 text-slate-900 py-3 px-6 rounded-xl font-bold text-sm hover:bg-yellow-400 transition-colors flex items-center gap-2\"\n                                >\n                                    <Unlock size={18}/> {pinSetting ? "Change PIN" : "Set PIN"}\n                                </button>\n                            </div>\n\n                            <div className=\"glass p-6 rounded-3xl border border-slate-800\">\n                                <h3 className=\"font-bold text-lg text-white mb-4 flex items-center gap-2\"><Scissors className=\"text-yellow-500\"/> Add Service</h3>\n                                <form onSubmit={handleAddService} className=\"flex gap-2 mb-4\">\n                                    <input name=\"name\" required placeholder=\"Name\" className=\"flex-1 bg-slate-950 border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-yellow-500\" />\n                                    <input name=\"price\" type=\"number\" required placeholder=\"Price\" className=\"w-24 bg-slate-950 border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-yellow-500\" />\n                                    <button className=\"bg-yellow-500 text-slate-900 p-3 rounded-xl font-bold\"><Plus size={20}/></button>\n                                </form>\n                                <div className=\"space-y-2 max-h-48 overflow-y-auto pr-2\">\n                                    {services.map(s => (\n                                        <div key={s.id} className=\"flex justify-between items-center bg-slate-900/50 p-3 rounded-xl\">\n                                            <span className=\"text-sm font-medium\">{s.name}</span>\n                                            <div className=\"flex items-center gap-3\">\n                                                <span className=\"text-xs text-yellow-500 font-bold\">{formatCurrency(s.price)}</span>\n                                                <button onClick={() => deleteDoc(doc(db, DB_PREFIX + 'services', s.id))} className=\"text-slate-600 hover:text-rose-500\"><Trash2 size={14}/></button>\n                                            </div>\n                                        </div>\n                                    ))}\n                                </div>\n                            </div>\n\n                            <div className=\"glass p-6 rounded-3xl border border-slate-800\">\n                                <h3 className=\"font-bold text-lg text-white mb-4 flex items-center gap-2\"><User className=\"text-blue-500\"/> Add Staff</h3>\n                                <form onSubmit={handleAddStaff} className=\"flex gap-2 mb-4\">\n                                    <input name=\"name\" required placeholder=\"Staff Name\" className=\"flex-1 bg-slate-950 border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500\" />\n                                    <button className=\"bg-blue-600 text-white p-3 rounded-xl font-bold\"><Plus size={20}/></button>\n                                </form>\n                                <div className=\"space-y-2\">\n                                    {staff.map(s => (\n                                        <div key={s.id} className=\"flex justify-between items-center bg-slate-900/50 p-3 rounded-xl\">\n                                            <span className=\"text-sm font-medium\">{s.name}</span>\n                                            <button onClick={() => deleteDoc(doc(db, DB_PREFIX + 'staff', s.id))} className=\"text-slate-600 hover:text-rose-500\"><Trash2 size={14}/></button>\n                                        </div>\n                                    ))}\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n                )}\n            </main>\n\n            {/* INVOICE MODAL */}\n            {showInvoice && <InvoiceModal sale={showInvoice} onClose={() => setShowInvoice(null)} salonInfo={{ name: "Rehman Salon", address: "Main Market, City", phone: "0300-1234567" }} />}\n        </div>\n    );\n};\n\nconst root = createRoot(document.getElementById('root'));\nroot.render(<App />);\n