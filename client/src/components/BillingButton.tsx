import React, { useState } from 'react';
import axios from 'axios';
import { BunnyProvider, Transactions } from "@bunnyapp/components";

declare global {
  interface Window {
    Bunny: any;
  }
}

interface BillingButtonProps {
  axiosInstance: any;
}

const BillingButton: React.FC<BillingButtonProps> = ({ axiosInstance }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [portalToken, setPortalToken] = useState<string | null>(null);

  const handleBillingClick = async () => {
    try {
      // Request portal session token from server
      const response = await axiosInstance.get('/api/billing/portal-session');
      const token = response.data.token;

      // Initialize Bunny with subdomain and token
      const bunny = new window.Bunny(process.env.REACT_APP_BUNNY_SUBDOMAIN || "subdomain", token);

      // Open the portal
      bunny.popup({
        page: "subscriptions",
        callback: (response: any) => {
          if (response === "close") {
            // Handle portal close if needed
            console.log("Portal closed");
          }
        }
      });
    } catch (error) {
      console.error('Error opening billing portal:', error);
    }
  };

  const handleInvoicesClick = async () => {
    try {
      const response = await axiosInstance.get('/api/billing/portal-session');
      setPortalToken(response.data.token);
      setShowTransactions(true);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error getting portal token:', error);
    }
  };

  return (
    <>
      <div className="relative">
        <div className="inline-flex rounded-lg shadow-sm">
          <button
            onClick={handleBillingClick}
            className="inline-flex items-center px-4 py-2 rounded-l-lg border border-transparent text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Billing
          </button>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="inline-flex items-center px-2 py-2 rounded-r-lg border border-l-0 border-transparent text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
            <div className="py-1" role="menu">
              <button
                onClick={handleInvoicesClick}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                role="menuitem"
              >
                Invoices
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transactions Component */}
      {showTransactions && portalToken && (
        <div className="fixed inset-0 bg-white z-50 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
              <button
                onClick={() => setShowTransactions(false)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </button>
            </div>
            <BunnyProvider
              token={portalToken}
              apiHost={process.env.REACT_APP_BUNNY_API_HOST || "https://api.bunny.com"}
            >
            {/*  <Transactions entityId={entityId} /> */}
            <div></div>
            </BunnyProvider>
          </div>
        </div>
      )}
    </>
  );
};

export default BillingButton;