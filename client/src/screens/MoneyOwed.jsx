import { useState } from 'react';

function getSessionId() {
  let id = localStorage.getItem('paisa_session_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('paisa_session_id', id);
  }
  return id;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function MoneyOwed({ transactions, onUpdateTransaction }) {
  const [showSettled, setShowSettled] = useState(false);

  const owedToMe = transactions.filter(
    tx => tx.reimbursable_direction === 'owed_to_me' && !tx.settled
  );

  const iOwe = transactions.filter(
    tx => tx.reimbursable_direction === 'i_owe' && !tx.settled
  );

  const settled = transactions.filter(
    tx => tx.settled && tx.is_reimbursable
  );

  const owedToMeTotal = owedToMe.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
  const iOweTotal = iOwe.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);

  const handleMarkSettled = async (id) => {
    try {
      const response = await fetch(`/api/expenses/${id}/settle`, {
        method: 'PATCH',
        headers: {
          'x-session-id': getSessionId()
        }
      });

      const updated = await response.json();
      onUpdateTransaction(updated);
    } catch (error) {
      console.error('Error marking settled:', error);
    }
  };

  return (
    <div style={{ paddingBottom: '80px' }}>
      {owedToMe.length > 0 || iOwe.length > 0 || settled.length > 0 ? (
        <>
          {owedToMe.length > 0 && (
            <div style={{ padding: '20px 0' }}>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: '15px',
                  color: '#7A8C6E',
                  padding: '16px 16px 8px'
                }}
              >
                People owe me
              </div>

              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: '20px',
                  color: '#2C2C2C',
                  padding: '0 16px 12px'
                }}
              >
                ₹{Math.round(owedToMeTotal)} owed to you
              </div>

              {owedToMe.map(tx => (
                <div
                  key={tx.id}
                  style={{
                    margin: '0 16px 8px',
                    background: 'white',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
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
                        fontSize: '15px',
                        color: '#2C2C2C'
                      }}
                    >
                      {tx.description}
                    </div>
                    <div
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 700,
                        fontSize: '16px',
                        color: '#7A8C6E'
                      }}
                    >
                      ₹{tx.amount}
                    </div>
                  </div>

                  {tx.reimbursable_person && (
                    <div
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 400,
                        fontSize: '13px',
                        color: '#6B6B6B',
                        marginTop: '4px'
                      }}
                    >
                      from {tx.reimbursable_person}
                    </div>
                  )}

                  <div
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 400,
                      fontSize: '11px',
                      color: '#6B6B6B',
                      marginTop: tx.reimbursable_person ? '2px' : '4px'
                    }}
                  >
                    {formatDate(tx.created_at)}
                  </div>

                  <button
                    onClick={() => handleMarkSettled(tx.id)}
                    style={{
                      border: '1px solid #7A8C6E',
                      color: '#7A8C6E',
                      background: 'transparent',
                      borderRadius: '20px',
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 400,
                      fontSize: '12px',
                      padding: '4px 12px',
                      marginTop: '8px',
                      minHeight: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    Mark settled
                  </button>
                </div>
              ))}
            </div>
          )}

          {owedToMe.length === 0 && (
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: '400',
                fontSize: '14px',
                color: '#6B6B6B',
                textAlign: 'center',
                padding: '16px'
              }}
            >
              You're all square here.
            </div>
          )}

          {iOwe.length > 0 && (
            <div style={{ padding: '20px 0' }}>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: '15px',
                  color: '#7A8C6E',
                  padding: '16px 16px 8px'
                }}
              >
                I owe people
              </div>

              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: '20px',
                  color: '#2C2C2C',
                  padding: '0 16px 12px'
                }}
              >
                You owe ₹{Math.round(iOweTotal)}
              </div>

              {iOwe.map(tx => (
                <div
                  key={tx.id}
                  style={{
                    margin: '0 16px 8px',
                    background: 'white',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
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
                        fontSize: '15px',
                        color: '#2C2C2C'
                      }}
                    >
                      {tx.description}
                    </div>
                    <div
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 700,
                        fontSize: '16px',
                        color: '#7A8C6E'
                      }}
                    >
                      ₹{tx.amount}
                    </div>
                  </div>

                  {tx.reimbursable_person && (
                    <div
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 400,
                        fontSize: '13px',
                        color: '#6B6B6B',
                        marginTop: '4px'
                      }}
                    >
                      to {tx.reimbursable_person}
                    </div>
                  )}

                  <div
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 400,
                      fontSize: '11px',
                      color: '#6B6B6B',
                      marginTop: tx.reimbursable_person ? '2px' : '4px'
                    }}
                  >
                    {formatDate(tx.created_at)}
                  </div>

                  <button
                    onClick={() => handleMarkSettled(tx.id)}
                    style={{
                      border: '1px solid #7A8C6E',
                      color: '#7A8C6E',
                      background: 'transparent',
                      borderRadius: '20px',
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 400,
                      fontSize: '12px',
                      padding: '4px 12px',
                      marginTop: '8px',
                      minHeight: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    Mark settled
                  </button>
                </div>
              ))}
            </div>
          )}

          {iOwe.length === 0 && (
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: '400',
                fontSize: '14px',
                color: '#6B6B6B',
                textAlign: 'center',
                padding: '16px'
              }}
            >
              Nothing to pay back.
            </div>
          )}

          {settled.length > 0 && (
            <div style={{ padding: '20px 0' }}>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 400,
                  fontSize: '13px',
                  color: '#6B6B6B',
                  textAlign: 'center',
                  padding: '16px',
                  cursor: 'pointer'
                }}
                onClick={() => setShowSettled(!showSettled)}
              >
                Show settled ({settled.length})
              </div>

              {showSettled && (
                <div>
                  {settled.map(tx => (
                    <div
                      key={tx.id}
                      style={{
                        margin: '0 16px 8px',
                        background: 'white',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                        opacity: 0.5
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
                            fontSize: '15px',
                            color: '#2C2C2C'
                          }}
                        >
                          {tx.description}{' '}
                          <span
                            style={{
                              fontFamily: "'DM Sans', sans-serif",
                              fontWeight: 400,
                              fontSize: '11px',
                              color: '#6B6B6B'
                            }}
                          >
                            Settled ✓
                          </span>
                        </div>
                        <div
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 700,
                            fontSize: '16px',
                            color: '#7A8C6E'
                          }}
                        >
                          ₹{tx.amount}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '80px 16px'
          }}
        >
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 400,
              fontSize: '15px',
              color: '#6B6B6B'
            }}
          >
            No reimbursements tracked yet.
          </div>
        </div>
      )}
    </div>
  );
}
