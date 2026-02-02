/**
 * Send data back to the Telegram bot from the WebApp.
 */
export function sendDataToBot(data: Record<string, unknown>): void {
  const tgWebApp = (window as any).Telegram?.WebApp;
  if (tgWebApp?.sendData) {
    tgWebApp.sendData(JSON.stringify(data));
  }
}

/**
 * Close the Telegram WebApp.
 */
export function closeWebApp(): void {
  const tgWebApp = (window as any).Telegram?.WebApp;
  if (tgWebApp?.close) {
    tgWebApp.close();
  }
}

/**
 * Send subscription purchase confirmation to bot and close WebApp.
 */
export function notifySubscriptionPurchased(tier: string): void {
  sendDataToBot({
    action: 'subscription_purchased',
    tier,
    timestamp: new Date().toISOString(),
  });
  closeWebApp();
}

/**
 * Send subscription cancellation notification to bot and close WebApp.
 */
export function notifySubscriptionCanceled(): void {
  sendDataToBot({
    action: 'subscription_canceled',
    timestamp: new Date().toISOString(),
  });
  closeWebApp();
}
