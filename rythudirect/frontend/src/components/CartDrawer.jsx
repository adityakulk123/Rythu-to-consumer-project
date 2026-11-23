import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  Clock, 
  MapPin, 
  Sparkles, 
  ChevronRight, 
  ShieldCheck,
  CheckCircle2,
  Bike
} from 'lucide-react';

const CartDrawer = ({ onOpenAddressModal }) => {
  const {
    isCartOpen,
    setIsCartOpen,
    cartItems,
    addToCart,
    removeFromCart,
    deleteItem,
    totalItemsCount,
    subtotal,
    totalSavings,
    deliveryFee,
    handlingFee,
    finalTotal,
    deliveryAddress
  } = useCart();

  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  if (!isCartOpen) return null;

  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'RYTHU50' || promoCode.trim().toUpperCase() === 'FIRSTFARM') {
      setPromoApplied(true);
    } else {
      alert('Invalid coupon code. Try "RYTHU50" or "FIRSTFARM"');
    }
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white text-slate-800 shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-4 bg-emerald-800 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-700/80 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <h2 className="font-bold text-base leading-tight">My Farm Cart</h2>
                <p className="text-xs text-emerald-200 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Delivery in 15-20 Mins</span>
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-full hover:bg-emerald-700 text-emerald-100 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Delivery Address Bar */}
          <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 overflow-hidden pr-2">
              <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
              <div className="truncate">
                <span className="font-bold text-emerald-950">
                  Deliver to {deliveryAddress?.type || 'Home'}:
                </span>{' '}
                <span className="text-emerald-800 truncate">
                  {deliveryAddress?.area || 'Banjara Hills, Hyderabad'}
                </span>
              </div>
            </div>
            <button 
              onClick={onOpenAddressModal}
              className="text-emerald-700 font-bold hover:underline shrink-0"
            >
              Change
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cartItems.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                  <ShoppingBag className="w-10 h-10 text-emerald-400 stroke-1" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg">Your cart is empty</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Fill your basket with fresh morning vegetables, exotic fruits, and organic leafy greens directly from local farmers!
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 shadow-md transition"
                >
                  Start Shopping Fresh
                </button>
              </div>
            ) : (
              <>
                {/* Savings Pill */}
                {totalSavings > 0 && (
                  <div className="p-2.5 rounded-xl bg-emerald-100/70 border border-emerald-200 text-emerald-900 flex items-center gap-2 text-xs font-semibold">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 animate-bounce" />
                    <span>You are saving ₹{totalSavings} by buying directly from farmgate!</span>
                  </div>
                )}

                {/* Items List */}
                <div className="divide-y divide-slate-100">
                  {cartItems.map((item) => (
                    <div key={item.id} className="py-3 flex items-center gap-3">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-16 h-16 rounded-xl object-cover border border-slate-100 shadow-xs"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 truncate leading-snug">
                          {item.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">{item.unit}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-bold text-slate-900 text-sm">
                            ₹{item.price * item.quantity}
                          </span>
                          {item.originalPrice && (
                            <span className="text-xs text-slate-400 line-through">
                              ₹{item.originalPrice * item.quantity}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-emerald-600 rounded-lg overflow-hidden bg-emerald-50 shadow-xs">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1.5 hover:bg-emerald-600 hover:text-white text-emerald-800 transition"
                          title="Decrease"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-emerald-950 font-mono">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => addToCart(item)}
                          className="p-1.5 hover:bg-emerald-600 hover:text-white text-emerald-800 transition"
                          title="Increase"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Promo Code Box */}
                <form onSubmit={handleApplyPromo} className="pt-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter Coupon (e.g. RYTHU50)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl uppercase outline-emerald-600 font-medium"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
                    >
                      Apply
                    </button>
                  </div>
                  {promoApplied && (
                    <p className="text-[11px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Coupon RYTHU50 Applied! Extra ₹20 off!
                    </p>
                  )}
                </form>

                {/* Bill Breakdown */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-900 text-sm pb-1.5 border-b border-slate-200">
                    Bill Summary
                  </h4>
                  <div className="flex justify-between text-slate-600">
                    <span>Item Total ({totalItemsCount} items)</span>
                    <span className="font-semibold text-slate-900">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="flex items-center gap-1">
                      <Bike className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Delivery Partner Fee</span>
                    </span>
                    <span>
                      {deliveryFee === 0 ? (
                        <span className="text-emerald-600 font-bold">FREE</span>
                      ) : (
                        `₹${deliveryFee}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Handling & Packaging Charge</span>
                    <span className="font-semibold text-slate-900">₹{handlingFee}</span>
                  </div>
                  {promoApplied && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Promo Discount</span>
                      <span>-₹20</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-slate-900 text-sm">
                    <span>To Pay</span>
                    <span className="text-emerald-700 font-mono text-base">
                      ₹{promoApplied ? Math.max(0, finalTotal - 20) : finalTotal}
                    </span>
                  </div>
                </div>

                {/* Quality & Safety Assurance */}
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-2.5 text-[11px] text-emerald-800">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p>100% Quality Check Guaranteed. No questions asked return at delivery.</p>
                </div>
              </>
            )}
          </div>

          {/* Footer Checkout Bar */}
          {cartItems.length > 0 && (
            <div className="p-4 bg-white border-t border-slate-100 shadow-xl space-y-2">
              <button
                onClick={handleProceedToCheckout}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm flex items-center justify-between shadow-lg shadow-emerald-700/20 transition-all hover:scale-[1.01]"
              >
                <div className="text-left">
                  <span className="block text-xs font-medium text-emerald-200">
                    {totalItemsCount} ITEMS
                  </span>
                  <span className="text-base font-black">
                    ₹{promoApplied ? Math.max(0, finalTotal - 20) : finalTotal}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold">
                  <span>Proceed to Pay</span>
                  <ChevronRight className="w-5 h-5" />
                </div>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
