import React, { useState } from 'react';
// import { BunnyPortal } from "@bunnyapp/components";

interface PortalButtonProps {
  axiosInstance: any;
}

const PortalButton: React.FC<PortalButtonProps> = ({ axiosInstance }) => {
  const [showPortal, setShowPortal] = useState(false);
  const [portalToken, setPortalToken] = useState<string | null>(null);

  const handlePortalClick = async () => {
    try {
      const response = await axiosInstance.get('/api/billing/portal-session');
      setPortalToken(response.data.token);
      setShowPortal(true);
    } catch (error) {
      console.error('Error opening portal:', error);
    }
  };

  return (
    <>
      <button
        onClick={handlePortalClick}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Portal
      </button>

      {showPortal && portalToken && (
        <div className="fixed inset-0 z-50 overflow-auto bg-gray-500 bg-opacity-75">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-lg w-full max-w-4xl">
              {/* <BunnyPortal
                token={portalToken}
                subdomain={process.env.REACT_APP_BUNNY_SUBDOMAIN || "subdomain"}
                onClose={() => setShowPortal(false)}
              /> */}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PortalButton;