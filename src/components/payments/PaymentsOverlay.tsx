'use client';

import { useSite } from '@/context/SiteContext';
import CartModal from './CartModal';
import PaymentPage from './PaymentPage';

export default function PaymentsOverlay() {
  const { config } = useSite();
  const payments = config?.settings?.payments;
  const cartActive = payments?.cartActive === true;

  if (!cartActive) return null;

  return (
    <>
      <CartModal />
      <PaymentPage />
    </>
  );
}

