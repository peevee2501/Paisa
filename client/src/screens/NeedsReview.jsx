import { useState } from 'react';

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

function getSessionId() {
  let id = localStorage.getItem('paisa_session_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('paisa_session_id', id);
  }
  return id;
}

function CheckmarkIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="24" r="22" stroke="#7A8C6E" strokeWidth="2" />
      <path
        d="M 15 24 L 21 30 L 33 18"
        stroke="#7A8C6E"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NeedsReview({ transactions, onUpdateTransaction }) {
  const needsReview = transactions.filter(tx => tx.needs_review);
  const [amountInputs, setAmountInputs] = useState({});

  const handleAmountChange = (id, value) => {
    setAmountInputs(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleDone = async (id) => {
    const amount = amountInputs[id];
    if (!amount) return;

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': getSessionId()
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          needs_review: false
        })
      });

      const updated = await response.json();
      onUpdateTransaction(updated);
      setAmountInputs(prev => {
        const newInputs = { ...prev };
        delete newInputs[id];
        return newInputs;
      });
    } catch (error) {
      console.error('Error updating amount:', error);
    }
  };

  const handleDismiss = async (id) => {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': getSessionId()
        },
        body: JSON.stringify({
          needs_review: false
        })
      });

      const updated = await response.json();
      onUpdateTransaction(updated);
    } catch (error) {
      console.error('Error dismissing review:', error);
    }
  };

  if (needsReview.length === 0) {
    return (
      <div
        style={{
          paddingBottom: '80px',
          textAlign: 'center',
          padding: '60px 16px 80px'
        }}
      >
        <CheckmarkIcon />
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700,
            fontSize: '18px',
            color: '#2C2C2C',
            marginTop: '16px'
          }}
        >
          You're all caught up.
        </div>
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 400,
            fontSize: '14px',
            color: '#6B6B6B',
            marginTop: '4px'
          }}
        >
          Nothing needs your attention right now.
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '80px' }}>
      <div style={{ padding: '20px 16px 0' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: '22px',
              color: '#2C2C2C'
            }}
          >
            Needs your attention
          </div>
          {needsReview.length > 0 && (
            <div
              style={{
                background: '#F59E0B',
                color: 'white',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700,
                fontSize: '13px',
                borderRadius: '12px',
                padding: '2px 10px'
              }}
            >
              {needsReview.length}
            </div>
          )}
        </div>
      </div>

      {needsReview.map(tx => (
        <div
          key={tx.id}
          style={{
            margin: '8px 16px',
            background: 'white',
            borderRadius: '12px',
            borderLeft: '4px solid #F59E0B',
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
          }}
        >
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: '15px',
              color: '#2C2C2C'
            }}
          >
            {tx.description}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: '8px',
              gap: '8px'
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: CATEGORY_COLORS[tx.category] || '#B0A898'
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
              {tx.category}
            </span>
          </div>

          {!tx.amount && (
            <>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 400,
                  fontSize: '13px',
                  color: '#6B6B6B',
                  margin: '8px 0 4px'
                }}
              >
                How much was it?
              </div>
              <input
                type="number"
                value={amountInputs[tx.id] || ''}
                onChange={(e) => handleAmountChange(tx.id, e.target.value)}
                placeholder="Amount"
                style={{
                  width: '100%',
                  border: '1.5px solid #E0D9CF',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 400,
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
              <button
                onClick={() => handleDone(tx.id)}
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
                  marginTop: '8px',
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            </>
          )}

          <div
            onClick={() => handleDismiss(tx.id)}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 400,
              fontSize: '12px',
              color: '#6B6B6B',
              display: 'block',
              textAlign: 'right',
              marginTop: '6px',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Dismiss
          </div>
        </div>
      ))}
    </div>
  );
}
