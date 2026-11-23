import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  // Load saved cart from localStorage
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('rythu_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Slide-over cart drawer state
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Delivery Address
  const [deliveryAddress, setDeliveryAddress] = useState(() => {
    try {
      const saved = localStorage.getItem('rythu_delivery_address');
      return saved ? JSON.parse(saved) : {
        type: 'Home',
        houseNo: 'Flat 402, Green Acres Apt',
        area: 'Road No. 12, Banjara Hills',
        city: 'Hyderabad',
        pincode: '500034',
        landmark: 'Near KBR National Park',
        contactName: 'Aditya K.',
        contactPhone: '9848012345'
      };
    } catch (e) {
      return null;
    }
  });

  // Orders history
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('rythu_orders');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Current active tracking order
  const [activeTrackingOrder, setActiveTrackingOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('rythu_active_order');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem('rythu_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Sync address to localStorage
  useEffect(() => {
    if (deliveryAddress) {
      localStorage.setItem('rythu_delivery_address', JSON.stringify(deliveryAddress));
    }
  }, [deliveryAddress]);

  // Sync orders to localStorage
  useEffect(() => {
    localStorage.setItem('rythu_orders', JSON.stringify(orders));
  }, [orders]);

  // Add item or increment
  const addToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // Decrement or remove item
  const removeFromCart = (productId) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === productId);
      if (!existing) return prev;
      if (existing.quantity === 1) {
        return prev.filter((item) => item.id !== productId);
      }
      return prev.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  };

  // Get item quantity
  const getItemQuantity = (productId) => {
    const item = cartItems.find((i) => i.id === productId);
    return item ? item.quantity : 0;
  };

  // Delete item completely
  const deleteItem = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  // Clear all items
  const clearCart = () => {
    setCartItems([]);
  };

  // Computations
  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const totalOriginalPrice = cartItems.reduce(
    (acc, item) => acc + (item.originalPrice || item.price * 1.3) * item.quantity,
    0
  );

  const totalSavings = Math.max(0, Math.round(totalOriginalPrice - subtotal));

  // Delivery fee is FREE above ₹199, else ₹15
  const deliveryFee = subtotal >= 199 || subtotal === 0 ? 0 : 15;
  const handlingFee = subtotal > 0 ? 4 : 0;
  const finalTotal = subtotal > 0 ? subtotal + deliveryFee + handlingFee : 0;

  // Place a new order
  const placeOrder = ({ paymentMethod, deliverySlot = 'Instant (15-20 mins)' }) => {
    const orderId = 'RD-' + Math.floor(100000 + Math.random() * 900000);
    const newOrder = {
      orderId,
      items: [...cartItems],
      subtotal,
      deliveryFee,
      handlingFee,
      totalSavings,
      finalTotal,
      paymentMethod,
      deliveryAddress,
      deliverySlot,
      status: 'CONFIRMED', // CONFIRMED -> PACKED -> OUT_FOR_DELIVERY -> DELIVERED
      createdAt: new Date().toISOString(),
      etaMinutes: 18,
      rider: {
        name: 'Ramesh Goud',
        phone: '+91 98480 98765',
        vehicleNumber: 'TS 09 AB 4521',
        rating: 4.9,
        trips: 1420
      }
    };

    setOrders((prev) => [newOrder, ...prev]);
    setActiveTrackingOrder(newOrder);
    localStorage.setItem('rythu_active_order', JSON.stringify(newOrder));
    clearCart();
    setIsCartOpen(false);

    return newOrder;
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        deleteItem,
        clearCart,
        getItemQuantity,
        totalItemsCount,
        subtotal,
        totalOriginalPrice,
        totalSavings,
        deliveryFee,
        handlingFee,
        finalTotal,
        deliveryAddress,
        setDeliveryAddress,
        orders,
        activeTrackingOrder,
        setActiveTrackingOrder,
        placeOrder
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
