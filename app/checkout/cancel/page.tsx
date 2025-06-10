// app/checkout/cancel/page.tsx
export default function CancelPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center', padding: '20px' }}>
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '20px' }}>
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
        Payment Canceled
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#4b5563', marginBottom: '2rem' }}>
        Your payment was canceled. Please try again if you wish to subscribe.
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <a
          href="/#pricing"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#6b7280', /* Gray */
            color: 'white',
            textDecoration: 'none',
            borderRadius: '0.5rem',
            fontWeight: '600',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
          }}
        >
          View Pricing
        </a>
        <a
          href="/"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#ec4899', /* Pink */
            color: 'white',
            textDecoration: 'none',
            borderRadius: '0.5rem',
            fontWeight: '600',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
          }}
        >
          Go to Homepage
        </a>
      </div>
    </div>
  );
}
