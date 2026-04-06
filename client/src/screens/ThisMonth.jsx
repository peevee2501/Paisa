import { useState, useEffect } from 'react';

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

function getCurrentMonth() {
  const d = new Date();
  return `${d.toLocaleString('en-US', { month: 'short' })} ${d.getFullYear()}`;
}

function getMonthName(monthStr) {
  const [month, year] = monthStr.split(' ');
  const monthIndex = new Date(`${month} 1, 2000`).getMonth();
  const monthFull = new Date(2000, monthIndex).toLocaleString('en-US', { month: 'long' });
  return `${monthFull} ${year}`;
}

function getPreviousMonth(monthStr) {
  const [month, year] = monthStr.split(' ');
  const date = new Date(`${month} 1, ${year}`);
  date.setMonth(date.getMonth() - 1);
  return `${date.toLocaleString('en-US', { month: 'short' })} ${date.getFullYear()}`;
}

function getNextMonth(monthStr) {
  const [month, year] = monthStr.split(' ');
  const date = new Date(`${month} 1, ${year}`);
  date.setMonth(date.getMonth() + 1);
  return `${date.toLocaleString('en-US', { month: 'short' })} ${date.getFullYear()}`;
}

export function ThisMonth() {
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, [currentMonth]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/expenses/summary?month=${encodeURIComponent(currentMonth)}`,
        {
          headers: {
            'x-session-id': getSessionId()
          }
        }
      );
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(getPreviousMonth(currentMonth));
  };

  const handleNextMonth = () => {
    const current = getCurrentMonth();
    if (currentMonth !== current) {
      setCurrentMonth(getNextMonth(currentMonth));
    }
  };

  const isCurrentMonth = currentMonth === getCurrentMonth();
  const monthName = getMonthName(currentMonth);

  return (
    <div style={{ paddingBottom: '80px' }}>
      <div style={{ padding: '20px 16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '24px'
          }}
        >
          <button
            onClick={handlePrevMonth}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#6B6B6B',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '8px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ←
          </button>

          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: '18px',
              color: '#2C2C2C',
              textAlign: 'center',
              flex: 1
            }}
          >
            {monthName}
          </div>

          <button
            onClick={handleNextMonth}
            disabled={isCurrentMonth}
            style={{
              background: 'transparent',
              border: 'none',
              color: isCurrentMonth ? '#D1D5DB' : '#6B6B6B',
              fontSize: '24px',
              cursor: isCurrentMonth ? 'default' : 'pointer',
              padding: '8px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isCurrentMonth ? 0.5 : 1
            }}
          >
            →
          </button>
        </div>

        {summary && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: '40px',
                  color: '#2C2C2C'
                }}
              >
                ₹{Math.round(summary.total_amount)}
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
                spent in {monthName.split(' ')[0].toLowerCase()}
              </div>
            </div>

            {summary.categories.length > 0 ? (
              <>
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: '15px',
                    color: '#2C2C2C',
                    padding: '0 16px',
                    marginBottom: '8px'
                  }}
                >
                  Where it went
                </div>

                {summary.categories.map(cat => (
                  <div
                    key={cat.category}
                    style={{
                      margin: '0 16px 8px',
                      background: 'white',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      borderLeft: `4px solid ${CATEGORY_COLORS[cat.category] || '#B0A898'}`
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontWeight: 700,
                          fontSize: '14px',
                          color: '#2C2C2C'
                        }}
                      >
                        {cat.category}
                      </div>
                      <div
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontWeight: 700,
                          fontSize: '16px',
                          color: '#7A8C6E'
                        }}
                      >
                        ₹{Math.round(cat.total)}
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 400,
                        fontSize: '13px',
                        color: '#6B6B6B',
                        marginTop: '4px'
                      }}
                    >
                      {cat.percentage.toFixed(1)}% of total
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 400,
                  fontSize: '15px',
                  color: '#6B6B6B',
                  textAlign: 'center',
                  padding: '40px 16px'
                }}
              >
                Nothing logged in {monthName.split(' ')[0].toLowerCase()} yet. Start by telling me what you spent.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
