// eslint-disable-next-line
!(function () {
  function Bunny(subdomain, token) {
    if (!token || !subdomain) {
      console.error("Subdomain, target and token are required.");
      return;
    }

    const initialize = (target, callback) => {
      const portalUrl = `https://${subdomain}.bunny.internal/portal`;

      // Message listener to send events from portal to the parent window
      window.addEventListener("message", (e) => {
        if (e.origin !== portalUrl) return;

        try {
          const response = JSON.parse(e.data);

          if (response.channel !== "bunny") return;

          callback?.(response.data);
        } catch (error) {
          return;
        }
      });
      console.log("portal", portalUrl);
      console.log("iframe", document.getElementById("bunny-iframe"));
      // Create the iframe element
      const iframe = document.createElement("iframe");

      // Set iframe attributes
      iframe.src = `${portalUrl}/subscriptions?token=${token}&isInIframe=true&isIframeOpen=true`;
      iframe.style.cssText =
        "border:none;margin:0;padding:0;position:fixed;top:0;left:0;width:100%;height:100%;z-index:999999;";
      iframe.id = "bunny-iframe";

      // Append the iframe to the target element
      document.body.appendChild(iframe);
    };

    return {
      initialize,
    };
  }

  window.Bunny = Bunny;
})();
