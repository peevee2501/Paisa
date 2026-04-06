import { useState, useEffect } from 'react';
import { ThisMonth } from './screens/ThisMonth';
import { MoneyOwed } from './screens/MoneyOwed';
import { NeedsReview } from './screens/NeedsReview';

function getSessionId() {
  let id = localStorage.getItem('paisa_session_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('paisa_session_id', id);
  }
  return id;
}

const CATEGORY_COLORS = {
  'Food & Drinks': '#E8A87C',
  'Transport': '#7A8C6E',
  'Social & Relationships': '#6B8FA3',
  'Shopping': '#8B6F47',
  'Health & Fitness': '#7EC8A4',
  'Subscriptions': '#B5A8D4',
  'Reimbursable': '#E8C97A',
  'Savings & Investments': '#A8C897',
  'Miscellaneous': '#B0A898'
};

const VALID_CATEGORIES = [
  'Food & Drinks',
  'Transport',
  'Social & Relationships',
  'Shopping',
  'Health & Fitness',
  'Subscriptions',
  'Reimbursable',
  'Savings & Investments',
  'Miscellaneous'
];

const VALID_PAYMENT_METHODS = ['UPI', 'Cash', 'Card', 'Net Banking', 'Unknown'];

const EXAMPLE_CHIPS = [
  'Coffee 80 UPI',
  'Gave Rohan 500 cash',
  'Zomato 650 card'
];

const DEMO_INPUTS = [
  'Paid 180 for coffee at Blue Tokai UPI',
  'Gave 500 cash to Rohan he will pay me back',
  'bought shampoo',
  'Zomato 650 card'
];

function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);

  if (compareDate.getTime() === today.getTime()) {
    return 'Today';
  } else if (compareDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}

function groupByDate(transactions) {
  const groups = {};
  transactions.forEach(tx => {
    const dateKey = formatDate(tx.created_at);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(tx);
  });
  return groups;
}

function TransactionCard({ transaction, isEditing, onEdit, onSave, onCancel }) {
  const [editForm, setEditForm] = useState({
    description: transaction.description,
    amount: transaction.amount || '',
    category: transaction.category,
    payment_method: transaction.payment_method
  });

  const handleSave = () => {
    onSave(transaction.id, editForm);
  };

  return (
    <div
      style={{
        margin: '0 16px 8px',
        background: 'white',
        borderRadius: '12px',
        padding: '14px 16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        cursor: 'pointer'
      }}
    >
      <div
        onClick={() => onEdit(transaction.id)}
        style={{ cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: '15px',
              color: '#2C2C2C',
              flex: 1,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              marginRight: '8px'
            }}
          >
            {transaction.description}
          </div>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: '16px',
              color: '#7A8C6E',
              whiteSpace: 'nowrap'
            }}
          >
            {transaction.amount ? `₹${transaction.amount}` : '—'}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '6px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: CATEGORY_COLORS[transaction.category] || '#B0A898',
                marginRight: '6px'
              }}
            />
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 400,
                fontSize: '12px',
                color: '#6B6B6B'
              }}
            >
              {transaction.category}
            </span>
          </div>

          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 400,
              fontSize: '11px',
              color: '#6B8FA3',
              background: '#EBF2F7',
              borderRadius: '6px',
              padding: '2px 8px'
            }}
          >
            {transaction.payment_method}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '4px'
          }}
        >
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 400,
              fontSize: '11px',
              color: '#6B6B6B'
            }}
          >
            {formatTime(transaction.created_at)}
          </span>

          {transaction.needs_review && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#F59E0B',
                  marginRight: '4px'
                }}
              />
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 400,
                  fontSize: '11px',
                  color: '#B8860B'
                }}
              >
                Needs review
              </span>
            </div>
          )}
        </div>
      </div>

      {isEditing && (
        <div
          style={{
            borderTop: '1px solid #F0EBE0',
            paddingTop: '12px',
            marginTop: '8px'
          }}
        >
          <input
            type="text"
            value={editForm.description}
            onChange={(e) =>
              setEditForm({ ...editForm, description: e.target.value })
            }
            placeholder="Description"
            style={{
              width: '100%',
              background: 'white',
              border: '1.5px solid #E0D9CF',
              borderRadius: '8px',
              padding: '10px 12px',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 400,
              fontSize: '14px',
              color: '#2C2C2C',
              outline: 'none',
              marginBottom: '8px'
            }}
          />

          <input
            type="number"
            value={editForm.amount}
            onChange={(e) =>
              setEditForm({ ...editForm, amount: e.target.value })
            }
            placeholder="Amount"
            style={{
              width: '100%',
              background: 'white',
              border: '1.5px solid #E0D9CF',
              borderRadius: '8px',
              padding: '10px 12px',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 400,
              fontSize: '14px',
              color: '#2C2C2C',
              outline: 'none',
              marginBottom: '8px'
            }}
          />

          <select
            value={editForm.category}
            onChange={(e) =>
              setEditForm({ ...editForm, category: e.target.value })
            }
            style={{
              width: '100%',
              background: 'white',
              border: '1.5px solid #E0D9CF',
              borderRadius: '8px',
              padding: '10px 12px',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 400,
              fontSize: '14px',
              color: '#2C2C2C',
              outline: 'none',
              marginBottom: '8px'
            }}
          >
            {VALID_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={editForm.payment_method}
            onChange={(e) =>
              setEditForm({ ...editForm, payment_method: e.target.value })
            }
            style={{
              width: '100%',
              background: 'white',
              border: '1.5px solid #E0D9CF',
              borderRadius: '8px',
              padding: '10px 12px',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 400,
              fontSize: '14px',
              color: '#2C2C2C',
              outline: 'none',
              marginBottom: '8px'
            }}
          >
            {VALID_PAYMENT_METHODS.map(method => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>

          <button
            onClick={handleSave}
            style={{
              width: '100%',
              background: '#7A8C6E',
              color: 'white',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: '14px',
              borderRadius: '8px',
              padding: '10px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Save changes
          </button>

          <div
            onClick={onCancel}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 400,
              fontSize: '13px',
              color: '#6B6B6B',
              textAlign: 'center',
              display: 'block',
              marginTop: '8px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [transactions, setTransactions] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('log');
  const [editingId, setEditingId] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [showDemoPrompt, setShowDemoPrompt] = useState(false);
  const [amountPrompt, setAmountPrompt] = useState(null);
  const [amountInput, setAmountInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingDemo, setLoadingDemo] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses', {
        headers: {
          'x-session-id': getSessionId()
        }
      });
      const data = await response.json();
      setTransactions(data.records);
      setHasMore(data.hasMore);

      if (data.records.length === 0) {
        setShowDemoPrompt(true);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    setErrorMessage('');
    setAmountPrompt(null);

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': getSessionId()
        },
        body: JSON.stringify({ input: input.trim() })
      });

      const data = await response.json();

      if (data.not_expense) {
        setErrorMessage(data.message);
      } else if (data.message) {
        setErrorMessage(data.message);
      } else {
        setTransactions([data, ...transactions]);
        setInput('');
        setShowDemoPrompt(false);

        if (data.timeout) {
          setErrorMessage('Took a moment — saved it to Needs Review.');
        } else if (data.needs_review && !data.amount) {
          setAmountPrompt({ id: data.id });
        }
      }
    } catch (error) {
      setErrorMessage('Something went wrong — try again?');
      console.error('Error submitting expense:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAmountDone = async () => {
    if (!amountInput.trim()) {
      setAmountPrompt(null);
      return;
    }

    try {
      const response = await fetch(`/api/expenses/${amountPrompt.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': getSessionId()
        },
        body: JSON.stringify({
          amount: parseFloat(amountInput),
          needs_review: false
        })
      });

      const updated = await response.json();
      setTransactions(
        transactions.map(tx => (tx.id === updated.id ? updated : tx))
      );
      setAmountPrompt(null);
      setAmountInput('');
    } catch (error) {
      console.error('Error updating amount:', error);
    }
  };

  const handleEdit = (id) => {
    setEditingId(editingId === id ? null : id);
  };

  const handleSave = async (id, updates) => {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': getSessionId()
        },
        body: JSON.stringify(updates)
      });

      const updated = await response.json();
      setTransactions(
        transactions.map(tx => (tx.id === updated.id ? updated : tx))
      );
      setEditingId(null);
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  const handleLoadMore = async () => {
    try {
      const response = await fetch(
        `/api/expenses?offset=${transactions.length}`,
        {
          headers: {
            'x-session-id': getSessionId()
          }
        }
      );
      const data = await response.json();
      setTransactions([...transactions, ...data.records]);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Error loading more:', error);
    }
  };

  const handleLoadDemo = async () => {
    setLoadingDemo(true);
    try {
      for (let i = 0; i < DEMO_INPUTS.length; i++) {
        const response = await fetch('/api/expenses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-session-id': getSessionId()
          },
          body: JSON.stringify({ input: DEMO_INPUTS[i] })
        });

        const data = await response.json();
        if (!data.message && !data.not_expense) {
          setTransactions(prev => [data, ...prev]);
        }

        if (i < DEMO_INPUTS.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      setShowDemoPrompt(false);
    } catch (error) {
      console.error('Error loading demo data:', error);
    } finally {
      setLoadingDemo(false);
    }
  };

  const groupedTransactions = groupByDate(transactions);

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px' }}>
      {activeTab === 'log' && (
        <>
          <div style={{ padding: '20px 16px 12px' }}>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700,
                fontSize: '24px',
                color: '#7A8C6E'
              }}
            >
              Paisa
            </div>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 400,
                fontSize: '13px',
                color: '#6B6B6B',
                marginTop: '2px'
              }}
            >
              Where did it all go?
            </div>
          </div>

          <div style={{ padding: '0 16px 8px' }}>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Tell me what you spent..."
                autoFocus
                style={{
                  width: '100%',
                  background: 'white',
                  border: '1.5px solid #E0D9CF',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 400,
                  fontSize: '16px',
                  color: '#2C2C2C',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#7A8C6E';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E0D9CF';
                }}
              />

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  marginTop: '6px'
                }}
              >
                {EXAMPLE_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInput(chip)}
                    style={{
                      border: '1px solid #7A8C6E',
                      borderRadius: '20px',
                      padding: '4px 12px',
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 400,
                      fontSize: '12px',
                      color: '#6B6B6B',
                      background: 'transparent',
                      cursor: 'pointer',
                      margin: '6px 6px 0 0'
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {showDemoPrompt && transactions.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    marginTop: '16px'
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 400,
                      fontSize: '13px',
                      color: '#6B6B6B'
                    }}
                  >
                    First time here? See how it works.
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadDemo}
                    disabled={loadingDemo}
                    style={{
                      border: '1px solid #7A8C6E',
                      color: '#7A8C6E',
                      background: 'transparent',
                      borderRadius: '20px',
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 400,
                      fontSize: '14px',
                      padding: '8px 20px',
                      cursor: loadingDemo ? 'default' : 'pointer',
                      marginTop: '8px',
                      opacity: loadingDemo ? 0.6 : 1
                    }}
                  >
                    {loadingDemo ? 'Loading...' : 'Load example data'}
                  </button>
                </div>
              )}

              {errorMessage && (
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 400,
                    fontSize: '13px',
                    color: '#B8860B',
                    marginTop: '8px'
                  }}
                >
                  {errorMessage}
                </div>
              )}

              {amountPrompt && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: '#FEF3C7',
                    borderRadius: '8px'
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 400,
                      fontSize: '13px',
                      color: '#92400E',
                      marginBottom: '8px'
                    }}
                  >
                    Got it. How much was it?
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      placeholder="Amount"
                      style={{
                        flex: 1,
                        background: 'white',
                        border: '1.5px solid #E0D9CF',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 400,
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAmountDone}
                      style={{
                        background: '#7A8C6E',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      Done
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAmountPrompt(null);
                        setAmountInput('');
                      }}
                      style={{
                        background: 'transparent',
                        color: '#6B6B6B',
                        border: 'none',
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 400,
                        fontSize: '13px',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Skip
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: '#7A8C6E',
                  color: 'white',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: '15px',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  border: 'none',
                  marginTop: '8px',
                  cursor: loading ? 'default' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Give me a sec...' : 'Add expense'}
              </button>
            </form>
          </div>

          <div>
            {Object.entries(groupedTransactions).map(([date, txs]) => (
              <div key={date}>
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    color: '#6B6B6B',
                    padding: '16px 16px 8px'
                  }}
                >
                  {date}
                </div>
                {txs.map(tx => (
                  <TransactionCard
                    key={tx.id}
                    transaction={tx}
                    isEditing={editingId === tx.id}
                    onEdit={handleEdit}
                    onSave={handleSave}
                    onCancel={() => setEditingId(null)}
                  />
                ))}
              </div>
            ))}

            {hasMore && transactions.length > 0 && (
              <button
                onClick={handleLoadMore}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 400,
                  fontSize: '14px',
                  color: '#6B6B6B',
                  textAlign: 'center',
                  padding: '16px',
                  cursor: 'pointer'
                }}
              >
                Load more
              </button>
            )}
          </div>
        </>
      )}

      {activeTab === 'thisMonth' && <ThisMonth />}

      {activeTab === 'moneyOwed' && (
        <MoneyOwed
          transactions={transactions}
          onUpdateTransaction={(updated) =>
            setTransactions(
              transactions.map(tx => (tx.id === updated.id ? updated : tx))
            )
          }
        />
      )}

      {activeTab === 'needsReview' && (
        <NeedsReview
          transactions={transactions}
          onUpdateTransaction={(updated) =>
            setTransactions(
              transactions.map(tx => (tx.id === updated.id ? updated : tx))
            )
          }
        />
      )}

      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          maxWidth: '390px',
          margin: '0 auto',
          background: 'white',
          borderTop: '1px solid #E0D9CF',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '8px 0 4px',
          zIndex: 100
        }}
      >
        {['log', 'thisMonth', 'moneyOwed', 'needsReview'].map((tab) => {
          const labels = {
            log: 'Log',
            thisMonth: 'This Month',
            moneyOwed: 'Money Owed',
            needsReview: 'Needs Review'
          };

          const needsReviewCount = transactions.filter(tx => tx.needs_review).length;

          return (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700,
                fontSize: '11px',
                color: activeTab === tab ? '#7A8C6E' : '#6B6B6B',
                cursor: 'pointer',
                padding: '4px 8px',
                position: 'relative'
              }}
            >
              {labels[tab]}
              {tab === 'needsReview' && needsReviewCount > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '0px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#F59E0B',
                    color: 'white',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {needsReviewCount}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
