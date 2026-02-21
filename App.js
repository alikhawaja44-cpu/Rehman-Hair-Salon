setPinInput(value);
}
}}
                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-4 text-center text-3xl font-bold tracking-widest mb-4 focus:border-yellow-500 outline-none"
                    className="w-full bg-[var(--color-surface)] border-2 border-slate-700 rounded-xl p-4 text-center text-3xl font-bold tracking-widest mb-4 focus:border-[var(--color-primary)] outline-none text-[var(--color-text-light)]"
placeholder="••••"
/>
{isSetupMode && (
@@ -179,7 +179,7 @@ const PinScreen = ({ onPinVerified, onSetPin, isSetupMode, storedPin }) => {
setConfirmPinInput(value);
}
}}
                        className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-4 text-center text-3xl font-bold tracking-widest mb-6 focus:border-yellow-500 outline-none"
                        className="w-full bg-[var(--color-surface)] border-2 border-slate-700 rounded-xl p-4 text-center text-3xl font-bold tracking-widest mb-6 focus:border-[var(--color-primary)] outline-none text-[var(--color-text-light)]"
placeholder="Confirm ••••"
/>
)}
@@ -188,7 +188,7 @@ const PinScreen = ({ onPinVerified, onSetPin, isSetupMode, storedPin }) => {

<button
onClick={handlePinSubmit}
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 py-4 rounded-2xl font-black text-lg shadow-lg shadow-yellow-500/20 active:scale-95 transition-all"
                    className="w-full bg-[var(--color-primary)] hover:bg-yellow-400 text-slate-900 py-4 rounded-2xl font-black text-lg shadow-lg shadow-[var(--color-primary)]/20 active:scale-95 transition-all"
>
{isSetupMode ? "Set PIN" : "Verify PIN"}
</button>
@@ -200,13 +200,13 @@ const PinScreen = ({ onPinVerified, onSetPin, isSetupMode, storedPin }) => {

const InvoiceModal = ({ sale, onClose, salonInfo }) => (
<div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div id="printable-area" className="bg-white text-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div id="printable-area" className="bg-white text-[var(--color-background)] w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
<div className="p-6 text-center border-b border-dashed border-slate-300 bg-slate-50">
<h1 className="text-2xl font-black tracking-tight mb-1 uppercase text-slate-800">{salonInfo.name}</h1>
<p className="text-xs font-medium text-slate-500">{salonInfo.address}</p>
<div className="flex justify-center gap-2 mt-4">
<span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Invoice</span>
                    <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">#{sale.id.slice(-4)}</span>
                    <span className="bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-[10px] font-bold px-2 py-1 rounded-full uppercase">#{sale.id.slice(-4)}</span>
</div>
<div className="mt-2 text-xs text-slate-400">
{new Date(sale.createdAt).toLocaleString()}
@@ -217,19 +217,19 @@ const InvoiceModal = ({ sale, onClose, salonInfo }) => (
{sale.services.map((item, i) => (
<div key={i} className="flex justify-between text-sm items-center">
<span className="font-medium text-slate-700">{item.name}</span>
                            <span className="font-bold text-slate-900">{formatCurrency(item.price)}</span>
                            <span className="font-bold text-[var(--color-background)]">{formatCurrency(item.price)}</span>
</div>
))}

</div>
                <div className="border-t-2 border-slate-900 pt-4 flex justify-between items-center text-xl font-black">
                <div className="border-t-2 border-[var(--color-background)] pt-4 flex justify-between items-center text-xl font-black">
<span>TOTAL</span>
<span>{formatCurrency(sale.total)}</span>
</div>
</div>
            <div className="bg-slate-900 p-4 flex gap-3 print:hidden">
                <button onClick={onClose} className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition-colors">Close</button>
                <button onClick={() => window.print()} className="flex-1 py-3 bg-yellow-500 text-slate-900 rounded-xl font-bold text-sm hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20"><Printer size={18}/> Print</button>
            <div className="bg-[var(--color-background)] p-4 flex gap-3 print:hidden">
                <button onClick={onClose} className="flex-1 py-3 bg-[var(--color-surface)] text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition-colors">Close</button>
                <button onClick={() => window.print()} className="flex-1 py-3 bg-[var(--color-primary)] text-[var(--color-background)] rounded-xl font-bold text-sm hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[var(--color-primary)]/20"><Printer size={18}/> Print</button>
</div>
</div>
</div>
@@ -535,39 +535,80 @@ const App = () => {
</div>
</button>
</div>
                            </div>
</div>
                    </div>
                )}
                    )}

{/* VIEW: DASHBOARD */}
{view === 'dashboard' && (
                    <div className="p-6 md:p-10 pt-6 overflow-y-auto">
                    <div className="p-6 md:p-10 pt-6 overflow-y-auto custom-scrollbar">
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="glass p-5 rounded-2xl border border-slate-800 bg-slate-900/50">
                                <p className="text-slate-400 text-xs font-bold uppercase mb-1">Total Revenue</p>
                            <div className="glass p-5 rounded-2xl border border-slate-800 bg-[var(--color-surface)]/50">
                                <p className="text-[var(--color-text-dark)] text-xs font-bold uppercase mb-1">Total Revenue</p>
<p className="text-2xl md:text-3xl font-black text-emerald-400">{formatCurrency(dailyRevenue)}</p>
</div>
                            <div className="glass p-5 rounded-2xl border border-slate-800 bg-slate-900/50">
                                <p className="text-slate-400 text-xs font-bold uppercase mb-1">Total Expenses</p>
                            <div className="glass p-5 rounded-2xl border border-slate-800 bg-[var(--color-surface)]/50">
                                <p className="text-[var(--color-text-dark)] text-xs font-bold uppercase mb-1">Total Expenses</p>
<p className="text-2xl md:text-3xl font-black text-rose-400">{formatCurrency(dailyExpenseAmount)}</p>
</div>
                            <div className="glass p-5 rounded-2xl border border-slate-800 bg-slate-900/50 col-span-2 md:col-span-2">
                                <p className="text-slate-400 text-xs font-bold uppercase mb-1">Net Profit ({formatDate(selectedDate)})</p>
                                <p className={`text-2xl md:text-3xl font-black ${dailyNetProfit >= 0 ? 'text-yellow-400' : 'text-rose-400'}`}>{formatCurrency(dailyNetProfit)}</p>
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
                            <h3 className="font-bold text-lg mb-4 text-white">Sales History ({formatDate(selectedDate)})</h3>
                            <h3 className="font-bold text-lg mb-4 text-[var(--color-text-light)]">Sales History ({formatDate(selectedDate)})</h3>
<div className="space-y-3">
                                {filteredSales.length === 0 ? <p className="text-slate-500 text-sm italic">No sales found for this date.</p> : filteredSales.map(s => (
                                {filteredSales.length === 0 ? <p className="text-[var(--color-text-dark)] text-sm italic">No sales found for this date.</p> : filteredSales.map(s => (
<div key={s.id} className="flex justify-between items-center py-3 border-b border-slate-800 last:border-0">
<div>
                                            <p className="font-bold text-slate-200 text-sm">{s.stylist}</p>
                                            <p className="text-xs text-slate-500">{new Date(s.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} • {s.services.length} items</p>
                                            <p className="font-bold text-[var(--color-text-light)] text-sm">{s.stylist}</p>
                                            <p className="text-xs text-[var(--color-text-dark)]">{new Date(s.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} • {s.services.length} items</p>
</div>
<div className="flex items-center gap-3">
<p className="font-bold text-emerald-400">{formatCurrency(s.total)}</p>
                                            <button onClick={() => deleteDoc(doc(db, DB_PREFIX + 'sales', s.id))} className="text-slate-600 hover:text-rose-500"><Trash2 size={14}/></button>
                                            <button onClick={() => deleteDoc(doc(db, DB_PREFIX + 'sales', s.id))} className="text-slate-600 hover:text-rose-500 transition-colors"><Trash2 size={14}/></button>
</div>
</div>
))}
@@ -582,11 +623,11 @@ const App = () => {
<div className="glass p-6 rounded-3xl border border-slate-800 mb-8">
<h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2"><Wallet className="text-rose-500"/> Add Expense</h3>
<form onSubmit={handleAddExpense} className="flex gap-2 mb-4">
                                <input name="name" required placeholder="Description (e.g. Tea, Bill)" className="flex-1 bg-slate-950 border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500" />
                                <input name="amount" type="number" required placeholder="Amount" className="w-24 bg-slate-950 border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500" />
                                <button className="bg-rose-500 text-white p-3 rounded-xl font-bold"><Plus size={20}/></button>
                                <input name="name" required placeholder="Description (e.g. Tea, Bill)" className="flex-1 bg-[var(--color-background)] border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500 text-[var(--color-text-light)] placeholder:text-[var(--color-text-dark)]" />
                                <input name="amount" type="number" required placeholder="Amount" className="w-24 bg-[var(--color-background)] border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500 text-[var(--color-text-light)] placeholder:text-[var(--color-text-dark)]" />
                                <button className="bg-rose-500 text-white p-3 rounded-xl font-bold hover:bg-rose-600 transition-colors"><Plus size={20}/></button>
</form>
                            <p className="text-xs text-slate-500">* Expenses added will be for: <span className="text-white font-bold">{formatDate(selectedDate)}</span></p>
                            <p className="text-xs text-[var(--color-text-dark)]">* Expenses added will be for: <span className="text-[var(--color-text-light)] font-bold">{formatDate(selectedDate)}</span></p>
</div>

<div className="space-y-3">
@@ -625,36 +666,36 @@ const App = () => {
</div>

<div className="glass p-6 rounded-3xl border border-slate-800">
                                <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2"><Scissors className="text-yellow-500"/> Add Service</h3>
                                <h3 className="font-bold text-lg text-[var(--color-text-light)] mb-4 flex items-center gap-2"><Scissors className="text-[var(--color-primary)]"/> Add Service</h3>
<form onSubmit={handleAddService} className="flex gap-2 mb-4">
                                    <input name="name" required placeholder="Name" className="flex-1 bg-slate-950 border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-yellow-500" />
                                    <input name="price" type="number" required placeholder="Price" className="w-24 bg-slate-950 border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-yellow-500" />
                                    <button className="bg-yellow-500 text-slate-900 p-3 rounded-xl font-bold"><Plus size={20}/></button>
                                    <input name="name" required placeholder="Name" className="flex-1 bg-[var(--color-background)] border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-text-light)] placeholder:text-[var(--color-text-dark)]" />
                                    <input name="price" type="number" required placeholder="Price" className="w-24 bg-[var(--color-background)] border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-text-light)] placeholder:text-[var(--color-text-dark)]" />
                                    <button className="bg-[var(--color-primary)] text-slate-900 p-3 rounded-xl font-bold hover:bg-yellow-400 transition-colors"><Plus size={20}/></button>
</form>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
{services.map(s => (
                                        <div key={s.id} className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl">
                                            <span className="text-sm font-medium">{s.name}</span>
                                        <div key={s.id} className="flex justify-between items-center bg-[var(--color-surface)]/50 p-3 rounded-xl border border-slate-800/50">
                                            <span className="text-sm font-medium text-[var(--color-text-light)]">{s.name}</span>
<div className="flex items-center gap-3">
                                                <span className="text-xs text-yellow-500 font-bold">{formatCurrency(s.price)}</span>
                                                <button onClick={() => deleteDoc(doc(db, DB_PREFIX + 'services', s.id))} className="text-slate-600 hover:text-rose-500"><Trash2 size={14}/></button>
                                                <span className="text-xs text-[var(--color-primary)] font-bold">{formatCurrency(s.price)}</span>
                                                <button onClick={() => deleteDoc(doc(db, DB_PREFIX + 'services', s.id))} className="text-slate-600 hover:text-rose-500 transition-colors"><Trash2 size={14}/></button>
</div>
</div>
))}
</div>
</div>

<div className="glass p-6 rounded-3xl border border-slate-800">
                                <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2"><User className="text-blue-500"/> Add Staff</h3>
                                <h3 className="font-bold text-lg text-[var(--color-text-light)] mb-4 flex items-center gap-2"><User className="text-[var(--color-secondary)]"/> Add Staff</h3>
<form onSubmit={handleAddStaff} className="flex gap-2 mb-4">
                                    <input name="name" required placeholder="Staff Name" className="flex-1 bg-slate-950 border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500" />
                                    <button className="bg-blue-600 text-white p-3 rounded-xl font-bold"><Plus size={20}/></button>
                                    <input name="name" required placeholder="Staff Name" className="flex-1 bg-[var(--color-background)] border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--color-secondary)] text-[var(--color-text-light)] placeholder:text-[var(--color-text-dark)]" />
                                    <button className="bg-[var(--color-secondary)] text-slate-900 p-3 rounded-xl font-bold hover:bg-teal-500 transition-colors"><Plus size={20}/></button>
</form>
                                <div className="space-y-2">
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
{staff.map(s => (
                                        <div key={s.id} className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl">
                                            <span className="text-sm font-medium">{s.name}</span>
                                            <button onClick={() => deleteDoc(doc(db, DB_PREFIX + 'staff', s.id))} className="text-slate-600 hover:text-rose-500"><Trash2 size={14}/></button>
                                        <div key={s.id} className="flex justify-between items-center bg-[var(--color-surface)]/50 p-3 rounded-xl border border-slate-800/50">
                                            <span className="text-sm font-medium text-[var(--color-text-light)]">{s.name}</span>
                                            <button onClick={() => deleteDoc(doc(db, DB_PREFIX + 'staff', s.id))} className="text-slate-600 hover:text-rose-500 transition-colors"><Trash2 size={14}/></button>
</div>
))}
</div>