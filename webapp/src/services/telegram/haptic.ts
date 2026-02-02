function getHaptic() {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
    return window.Telegram.WebApp.HapticFeedback;
  }
  return null;
}

export function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'light') {
  getHaptic()?.impactOccurred(style);
}

export function hapticNotification(type: 'error' | 'success' | 'warning') {
  getHaptic()?.notificationOccurred(type);
}

export function hapticSelection() {
  getHaptic()?.selectionChanged();
}
