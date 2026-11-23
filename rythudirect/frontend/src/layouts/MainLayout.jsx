import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CartDrawer from '../components/CartDrawer';
import AddressModal from '../components/AddressModal';

const MainLayout = () => {
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#1F2937]">
      <Navbar onOpenAddressModal={() => setAddressModalOpen(true)} />
      <main className="flex-1">
        <Outlet context={{ onOpenAddressModal: () => setAddressModalOpen(true) }} />
      </main>
      <Footer />

      {/* Global Slide-over Cart Drawer (Blinkit Style) */}
      <CartDrawer onOpenAddressModal={() => setAddressModalOpen(true)} />

      {/* Global Address Selection & Editing Modal */}
      <AddressModal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
      />
    </div>
  );
};

export default MainLayout;
