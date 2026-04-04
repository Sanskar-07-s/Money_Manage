const FINANCE_EVENT = 'money-manage:finance-update';

export const emitFinanceUpdate = (detail) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(FINANCE_EVENT, { detail }));
};

export const subscribeFinanceUpdates = (listener) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = (event) => {
    listener(event.detail);
  };

  window.addEventListener(FINANCE_EVENT, handler);

  return () => {
    window.removeEventListener(FINANCE_EVENT, handler);
  };
};
