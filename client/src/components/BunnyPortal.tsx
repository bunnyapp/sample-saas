import React from 'react';

interface BunnyPortalProps {
  token: string;
  subdomain: string;
  onClose: () => void;
}

const BunnyPortal: React.FC<BunnyPortalProps> = ({ token, subdomain, onClose }) => {
  const portalUrl = `https://${subdomain}.bunny.com/portal/subscriptions?token=${token}`;

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
        aria-label="Close portal"
      >
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Portal iframe */}
      <iframe
        src={portalUrl}
        className="w-full h-full border-0"
        title="Bunny Portal"
        allow="payment; fullscreen"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
      />
    </div>
  );
};

export default BunnyPortal;
