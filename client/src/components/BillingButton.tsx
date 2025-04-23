import { DownOutlined } from "@ant-design/icons";
import {
  BillingDetails,
  BunnyProvider,
  Quotes,
  Transactions,
  Subscriptions,
} from "@bunnyapp/components";
import { Dropdown, Modal } from "antd";
import React, { useState } from "react";

declare global {
  interface Window {
    Bunny: any;
  }
}

interface BillingButtonProps {
  axiosInstance: any;
}

const BillingButton: React.FC<BillingButtonProps> = ({ axiosInstance }) => {
  const [showTransactions, setShowTransactions] = useState(false);
  const [showQuotes, setShowQuotes] = useState(false);
  const [showBillingDetails, setShowBillingDetails] = useState(false);
  const [showSubscriptions, setShowSubscriptions] = useState(false);
  const [portalToken, setPortalToken] = useState<string | null>(null);

  const apiHost =
    process.env.REACT_APP_BUNNY_API_HOST || "https://validation.bunny.com";

  const handleBillingClick = async () => {
    try {
      // Request portal session token from server
      const response = await axiosInstance.get("/api/billing/portal-session");
      const token = response.data.token;

      // Initialize Bunny with subdomain and token
      const bunny = new window.Bunny(
        process.env.REACT_APP_BUNNY_SUBDOMAIN || "subdomain",
        token
      );

      // Open the portal
      bunny.popup({
        page: "subscriptions",
        callback: (response: any) => {
          if (response === "close") {
            // Handle portal close if needed
            console.log("Portal closed");
          }
        },
      });
    } catch (error) {
      console.error("Error opening billing portal:", error);
    }
  };

  const handleInvoicesClick = async () => {
    try {
      const response = await axiosInstance.get("/api/billing/portal-session");
      console.log(response);
      setPortalToken(response.data.token);
      setShowTransactions(true);
    } catch (error) {
      console.error("Error getting portal token:", error);
    }
  };

  const handleQuotesClick = async () => {
    try {
      const response = await axiosInstance.get("/api/billing/portal-session");
      setPortalToken(response.data.token);
      setShowQuotes(true);
    } catch (error) {
      console.error("Error getting portal token:", error);
    }
  };

  const handleBillingDetailsClick = async () => {
    try {
      const response = await axiosInstance.get("/api/billing/portal-session");
      setPortalToken(response.data.token);
      setShowBillingDetails(true);
    } catch (error) {
      console.error("Error getting portal token:", error);
    }
  };

  const handleSubscriptionsClick = async () => {
    try {
      const response = await axiosInstance.get("/api/billing/portal-session");
      setPortalToken(response.data.token);
      setShowSubscriptions(true);
    } catch (error) {
      console.error("Error getting portal token:", error);
    }
  };

  const menuItems = [
    {
      key: "1",
      label: "Invoices",
      onClick: handleInvoicesClick,
    },
    {
      key: "2",
      label: "Quotes",
      onClick: handleQuotesClick,
    },
    {
      key: "3",
      label: "Billing Details",
      onClick: handleBillingDetailsClick,
    },
    {
      key: "4",
      label: "Subscriptions",
      onClick: handleSubscriptionsClick,
    },
  ];

  return (
    <>
      <div className="flex flex-col items-start gap-2">
        <Dropdown.Button
          menu={{ items: menuItems }}
          icon={<DownOutlined />}
          onClick={handleBillingClick}
        >
          Billing Portal
        </Dropdown.Button>
      </div>

      {/* Transactions Component */}
      <Modal
        open={showTransactions}
        onCancel={() => setShowTransactions(false)}
        width="100VW"
        height="100VH"
        footer={false}
      >
        {portalToken && (
          <BunnyProvider token={portalToken} apiHost={apiHost}>
            <Transactions className="px-0" />
          </BunnyProvider>
        )}
      </Modal>
      <Modal
        open={showQuotes}
        onCancel={() => setShowQuotes(false)}
        width="100VW"
        height="100VH"
        footer={false}
      >
        {portalToken && (
          <BunnyProvider token={portalToken} apiHost={apiHost}>
            <Quotes />
          </BunnyProvider>
        )}
      </Modal>
      <Modal
        open={showBillingDetails}
        onCancel={() => setShowBillingDetails(false)}
        width="100VW"
        height="100VH"
        footer={false}
      >
        {portalToken && (
          <BunnyProvider token={portalToken} apiHost={apiHost}>
            <BillingDetails />
          </BunnyProvider>
        )}
      </Modal>
      <Modal
        open={showSubscriptions}
        onCancel={() => setShowSubscriptions(false)}
        width="100VW"
        height="100VH"
        footer={false}
      >
        {portalToken && (
          <BunnyProvider token={portalToken} apiHost={apiHost}>
            <Subscriptions
              handlePortalErrors={(error) => {
                console.log("Error", error);
              }}
              companyName="Test"
            />
          </BunnyProvider>
        )}
      </Modal>
    </>
  );
};

export default BillingButton;
