import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Auth from './components/Auth';
import ResetPassword from './components/ResetPassword';
import SetupScreen from './components/SetupScreen';
import BudgetPlanner from './components/BudgetPlanner';
import SpendingTracker from './components/SpendingTracker';
import AnalysisDashboard from './components/AnalysisDashboard';
import HealthSidebar from './components/HealthSidebar';
import Navbar from './components/Navbar';
import defaultCategories from './data/defaultCategories';
import { calculateRecommended } from './utils/financeHelpers';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('setup');
  const [income, setIncome] = useState(0);
  const [savings, setSavings] = useState(0);
  const [savingsGoal, setSavingsGoal] = useState(0);
  const [categories, setCategories] = useState(defaultCategories);
  const [excludedCategories, setExcludedCategories] = useState([]);
  const [isRecovery, setIsRecovery] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadBudget(userId) {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      setCurrentPage('setup');
      return;
    }

    if (data) {
      setIncome(data.income);
      setSavings(data.savings);
      setSavingsGoal(data.savings_goal);
      const excluded = data.excluded_categories || [];
      setExcludedCategories(excluded);
      let cats = data.categories;
      cats = await syncWhatsappCategories(userId, cats, excluded);
      setCategories(cats);
      setCurrentPage('budget');
    }
  }

  // Pull in any categories added via WhatsApp ("add category X") and
  // merge them into the existing categories list, avoiding duplicates.
  async function syncWhatsappCategories(userId, currentCategories, excluded = excludedCategories) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', userId)
      .single();

    console.log('DEBUG profile:', profile, 'error:', profileError);

    if (!profile?.phone) return currentCategories;

    const { data: newCats, error: catsError } = await supabase
      .from('user_categories')
      .select('*')
      .eq('phone', profile.phone);

    console.log('DEBUG newCats:', newCats, 'error:', catsError);

    if (!newCats || newCats.length === 0) return currentCategories;

    const existingNames = new Set(
      currentCategories.map(c => c.name.toLowerCase())
    );
    const excludedSet = new Set((excluded || []).map(n => n.toLowerCase()));

    console.log('DEBUG existingNames:', [...existingNames]);
    console.log('DEBUG excludedSet:', [...excludedSet]);

    const toAdd = newCats
      .filter(nc => !existingNames.has(nc.name.toLowerCase()))
      .filter(nc => !excludedSet.has(nc.name.toLowerCase()))
      .map(nc => ({
        id: Date.now() + Math.random(),
        name: nc.name,
        icon: nc.icon || '📦',
        budget: Number(nc.budget) || 0,
        recommended: 0,
        actual: 0,
      }));

    console.log('DEBUG toAdd:', toAdd);

    if (toAdd.length === 0) return currentCategories;

    const merged = [...currentCategories, ...toAdd];

    // Save merged categories back to the budget
    await supabase.from('budgets').update({
      categories: merged,
      updated_at: new Date(),
    }).eq('user_id', userId);

    return merged;
  }

  useEffect(() => {
    // Check for recovery in URL hash on load
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !hash.includes('type=recovery')) {
        setUser(session.user);
        loadBudget(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          // User clicked reset link — show reset form, do NOT log in
          setIsRecovery(true);
          setUser(null);
          setLoading(false);
          return;
        }

        if (event === 'SIGNED_IN' && isRecovery) {
          // Still in recovery flow — don't redirect to app
          return;
        }

        if (session) {
          setUser(session.user);
          loadBudget(session.user.id).finally(() => setLoading(false));
        } else {
          setUser(null);
          setCurrentPage('setup');
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function saveBudget(data) {
    const { error } = await supabase.from('budgets').upsert({
      user_id: user.id,
      income: data.income,
      savings: data.savings,
      savings_goal: data.savingsGoal,
      categories: data.categories,
      excluded_categories: data.excludedCategories ?? excludedCategories,
      updated_at: new Date()
    }, { onConflict: 'user_id' });

    if (error) {
      console.log('Save error:', error.message);
    }
  }

  function handleSetupComplete(data) {
    setIncome(data.income);
    setSavings(data.savings);
    setSavingsGoal(data.goal);
    const updated = defaultCategories.map(cat => ({
      ...cat,
      recommended: calculateRecommended(data.income, cat.name),
      budget: calculateRecommended(data.income, cat.name)
    }));
    setCategories(updated);
    setCurrentPage('budget');
    saveBudget({
      income: data.income,
      savings: data.savings,
      savingsGoal: data.goal,
      categories: updated
    });
  }

  async function handleSyncCategories() {
    const merged = await syncWhatsappCategories(user.id, categories, excludedCategories);
    setCategories(merged);
  }

  function updateBudget(id, amount) {
    const updated = categories.map(c =>
      c.id === id ? { ...c, budget: amount } : c
    );
    setCategories(updated);
    saveBudget({ income, savings, savingsGoal, categories: updated });
  }

  function updateActual(id, amount) {
    const updated = categories.map(c =>
      c.id === id ? { ...c, actual: amount } : c
    );
    setCategories(updated);
    saveBudget({ income, savings, savingsGoal, categories: updated });
  }

  function addCategory(cat) {
    const updated = [...categories,
      { ...cat, id: Date.now(), budget: 0, actual: 0 }];
    setCategories(updated);
    saveBudget({ income, savings, savingsGoal, categories: updated });
  }

  async function removeCategory(id) {
    const removed = categories.find(c => c.id === id);
    const updated = categories.filter(c => c.id !== id);
    setCategories(updated);

    let newExcluded = excludedCategories;
    if (removed) {
      newExcluded = [...new Set([...excludedCategories, removed.name.toLowerCase()])];
      setExcludedCategories(newExcluded);
    }

    saveBudget({ income, savings, savingsGoal, categories: updated, excludedCategories: newExcluded });

    // Also permanently delete from user_categories (in case it was
    // added via WhatsApp), so it doesn't clutter the database.
    if (removed) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', user.id)
        .single();

      if (profile?.phone) {
        await supabase
          .from('user_categories')
          .delete()
          .eq('phone', profile.phone)
          .ilike('name', removed.name);
      }
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setIsRecovery(false);
    setCurrentPage('setup');
    setIncome(0);
    setSavings(0);
    setSavingsGoal(0);
    setCategories(defaultCategories);
    setExcludedCategories([]);
  }

  // Show a blank/loading screen while checking session — avoids flashing
  // the Auth or SetupScreen on reload before the session check resolves.
  if (loading) {
    return (
      <div className='app-layout' style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg)'
      }}>
        <div style={{
          color: 'var(--silver)',
          fontSize: '0.85rem',
          fontFamily: "'Space Grotesk', sans-serif",
          letterSpacing: '0.04em'
        }}>
          Loading…
        </div>
      </div>
    );
  }

  // Show reset password page
  if (isRecovery) {
    return <ResetPassword onDone={() => {
      setIsRecovery(false);
      setUser(null);
      window.location.hash = '';
    }} />;
  }

  // Show login page if not logged in
  if (!user) {
    return <Auth onLogin={(u) => {
      setUser(u);
      setLoading(true);
      loadBudget(u.id).finally(() => setLoading(false));
    }} />;
  }

  // Show setup if no income set
  if (currentPage === 'setup') {
    return <SetupScreen onComplete={handleSetupComplete} />;
  }

  return (
    <div className='app-layout'>
      <Navbar
        currentPage={currentPage}
        setPage={setCurrentPage}
        onLogout={handleLogout}
        userName={user.user_metadata?.name || user.email}
      />
      <div className='main-area'>
        <div className='content'>
          {currentPage === 'budget' && (
            <BudgetPlanner
              income={income}
              categories={categories}
              onUpdateBudget={updateBudget}
              onAddCategory={addCategory}
              onRemoveCategory={removeCategory}
              onSyncWhatsapp={handleSyncCategories}
            />
          )}
          {currentPage === 'tracker' && (
            <SpendingTracker
              categories={categories}
              user={user}
            />
          )}
          {currentPage === 'analysis' && (
            <AnalysisDashboard
              income={income}
              categories={categories}
              user={user}
            />
          )}
        </div>
        <HealthSidebar
          income={income}
          savings={savings}
          savingsGoal={savingsGoal}
          categories={categories}
          user={user}
        />
      </div>
    </div>
  );
}

export default App;
