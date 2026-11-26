import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { 
  ShieldCheck, 
  MapPin, 
  Clock, 
  CreditCard, 
  Smartphone, 
  Banknote, 
  ArrowLeft, 
  CheckCircle2, 
  Bike,
  Sparkles,
  Lock,
  PackageCheck,
  ArrowRight,
  ShoppingBag
} from 'lucide-react';

const CheckoutPage = ({ onOpenAddressModal }) => {
  const { 
    cartItems, 
    subtotal, 
    deliveryFee, 
    handlingFee, 
    finalTotal, 
    totalSavings, 
    totalItemsCount,
    deliveryAddress,
    placeOrder
  } = useCart();

  const navigate = useNavigate();

  // Payment states
  const [selectedPayment, setSelectedPayment] = useState('paytm');
  const [paytmType, setPaytmType] = useState('upi'); // upi | wallet | postpaid
  const [upiId, setUpiId] = useState('');
  const [deliverySlot, setDeliverySlot] = useState('Instant (15-20 mins)');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(null);
  const [countdown, setCountdown] = useState(8);

  // Auto-redirect timer after successful order placement
  useEffect(() => {
    if (!orderConfirmed) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate(`/order-tracking/${orderConfirmed.orderId}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [orderConfirmed, navigate]);

  // If order was confirmed, display authentic Swiggy / Amazon / Blinkit celebration screen
  if (orderConfirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-slate-50 to-white flex items-center justify-center p-4 sm:p-6 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden text-center relative animate-fade-in">
          
          {/* Confetti & Celebration Top Banner */}
          <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-green-600 px-6 pt-8 pb-10 text-white relative">
            <div className="absolute top-3 left-4 text-emerald-200/50 text-xs font-mono">
              RythuDirect 15m Express
            </div>
            <div className="absolute top-3 right-4 flex items-center gap-1 text-[11px] bg-emerald-800/80 px-2 py-0.5 rounded-full font-bold text-emerald-200">
              <Sparkles className="w-3 h-3 text-[#E9C46A]" />
              <span>Verified Payment</span>
            </div>

            {/* Pulsing Animated Checkmark Circle */}
            <div className="w-20 h-20 mx-auto rounded-full bg-white/20 backdrop-blur-md p-2 flex items-center justify-center shadow-xl ring-8 ring-white/10 mb-4 animate-bounce">
              <div className="w-16 h-16 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-11 h-11 text-emerald-600 stroke-[2.5]" />
              </div>
            </div>

            <h1 className="text-2xl font-black text-white tracking-tight">
              Order Placed Successfully! 🎉
            </h1>
            <p className="text-sm font-semibold text-emerald-100 mt-1">
              ఆర్డర్ విజయవంతంగా నమోదైంది!
            </p>
            <p className="text-xs text-emerald-200/90 mt-2 max-w-xs mx-auto">
              Direct from local Telangana farmers to your doorstep in 15-20 minutes.
            </p>
          </div>

          {/* Order Details Body */}
          <div className="p-6 text-left space-y-4">
            
            {/* Order Summary Strip */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Order ID</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  #{orderConfirmed.orderId}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Amount Paid</span>
                <span className="font-black text-emerald-800 text-sm">
                  ₹{orderConfirmed.finalTotal}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Payment Method</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  {orderConfirmed.paymentMethod}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Estimated Delivery</span>
                <span className="font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  15-20 Mins
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Assigned Delivery Hero</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Bike className="w-3.5 h-3.5 text-blue-600" />
                  Ramesh Goud (TS 09 AB 4521)
                </span>
              </div>

              {orderConfirmed.deliveryAddress && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Delivery Address</span>
                  <p className="text-slate-700 font-medium truncate">
                    {orderConfirmed.deliveryAddress.houseNo ? `${orderConfirmed.deliveryAddress.houseNo}, ` : ''}
                    {orderConfirmed.deliveryAddress.area}, {orderConfirmed.deliveryAddress.city}
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Contact: {orderConfirmed.deliveryAddress.contactName} ({orderConfirmed.deliveryAddress.contactPhone})
                  </p>
                </div>
              )}
            </div>

            {/* Farm Fresh Guarantee Note */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3">
              <PackageCheck className="w-5 h-5 text-emerald-700 shrink-0" />
              <p className="text-[11px] text-emerald-900 leading-snug">
                <strong>Packaged with Zero Chemical Sprays:</strong> Your produce was harvested less than 6 hours ago from verified local farms.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => navigate(`/order-tracking/${orderConfirmed.orderId}`)}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/25 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Bike className="w-5 h-5 animate-pulse" />
                <span>Track Live Delivery (16 Mins)</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <Link
                to="/store"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition text-center"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Continue Shopping</span>
              </Link>
            </div>

            {/* Countdown Helper */}
            <p className="text-[11px] text-center text-slate-400">
              Auto-navigating to live delivery route in <strong className="text-emerald-700">{countdown}s</strong>...
            </p>

          </div>
        </div>
      </div>
    );
  }

  // Cart empty guard (only when not in confirmed order state)
  if (cartItems.length === 0 && !orderConfirmed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm w-full">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 text-2xl">
            🛒
          </div>
          <h2 className="text-xl font-bold text-slate-900">Your basket is empty</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Please add fresh vegetables, fruits, or farm staples to proceed with checkout.
          </p>
          <Link
            to="/store"
            className="block py-3 px-6 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition"
          >
            Browse Fresh Produce
          </Link>
        </div>
      </div>
    );
  }

  const handleCompletePayment = () => {
    if (!deliveryAddress || !deliveryAddress.area || !deliveryAddress.contactPhone) {
      alert("Please enter your delivery address and contact number before proceeding.");
      onOpenAddressModal();
      return;
    }

    setIsProcessing(true);

    // Simulate instant secure gateway transaction
    setTimeout(() => {
      const paymentLabel = 
        selectedPayment === 'paytm' ? `Paytm (${paytmType.toUpperCase()})` :
        selectedPayment === 'upi' ? `UPI (${upiId || 'GPay/PhonePe'})` :
        selectedPayment === 'card' ? 'Credit/Debit Card' : 'Cash on Delivery';

      const order = placeOrder({
        paymentMethod: paymentLabel,
        deliverySlot
      });

      setIsProcessing(false);
      setOrderConfirmed(order);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Back Link */}
        <div className="mb-4">
          <Link to="/store" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Fresh Mart</span>
          </Link>
        </div>

        <h1 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
          <span>Checkout & Payment</span>
          <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
            100% Safe & Encrypted
          </span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Address, Delivery Slot & Payment Modes */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Delivery Address Card */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-700" />
                  <h3 className="font-bold text-sm text-slate-900">
                    Delivery Address {deliveryAddress?.type ? `(${deliveryAddress.type})` : ''}
                  </h3>
                </div>
                <button
                  onClick={onOpenAddressModal}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  {deliveryAddress && deliveryAddress.area ? 'Change' : '+ Add Address'}
                </button>
              </div>

              {deliveryAddress && deliveryAddress.area ? (
                <div className="pt-3 text-xs text-slate-600 space-y-1">
                  <p className="font-bold text-slate-900 text-sm">
                    {deliveryAddress.contactName} • {deliveryAddress.contactPhone}
                  </p>
                  <p>{deliveryAddress.houseNo ? `${deliveryAddress.houseNo}, ` : ''}{deliveryAddress.area}</p>
                  <p>{deliveryAddress.city} - {deliveryAddress.pincode}</p>
                  {deliveryAddress.landmark && (
                    <p className="text-slate-400">Landmark: {deliveryAddress.landmark}</p>
                  )}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-xs font-semibold text-amber-800 mb-2">No delivery address entered yet.</p>
                  <button
                    onClick={onOpenAddressModal}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
                  >
                    + Enter Delivery Address
                  </button>
                </div>
              )}
            </div>

            {/* Delivery Slot Selection */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-sm text-slate-900">Choose Delivery Slot</h3>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <label 
                  className={`p-3 rounded-2xl border cursor-pointer flex flex-col justify-between transition ${
                    deliverySlot === 'Instant (15-20 mins)' 
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold' 
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-emerald-800">
                      ⚡ Instant Express
                    </span>
                    <input
                      type="radio"
                      name="slot"
                      checked={deliverySlot === 'Instant (15-20 mins)'}
                      onChange={() => setDeliverySlot('Instant (15-20 mins)')}
                      className="accent-emerald-700"
                    />
                  </div>
                  <p className="text-[11px] mt-1 font-normal">Arrives in 15-20 mins</p>
                </label>

                <label 
                  className={`p-3 rounded-2xl border cursor-pointer flex flex-col justify-between transition ${
                    deliverySlot === 'Tomorrow Morning (6 AM - 8 AM)' 
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold' 
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-emerald-800">
                      🌅 Morning Harvest
                    </span>
                    <input
                      type="radio"
                      name="slot"
                      checked={deliverySlot === 'Tomorrow Morning (6 AM - 8 AM)'}
                      onChange={() => setDeliverySlot('Tomorrow Morning (6 AM - 8 AM)')}
                      className="accent-emerald-700"
                    />
                  </div>
                  <p className="text-[11px] mt-1 font-normal">Tomorrow 6:00 - 8:00 AM</p>
                </label>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-700" />
                  <span>Select Payment Method</span>
                </h3>
                <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> 100% Secure
                </span>
              </div>

              {/* Option 1: PAYTM (Featured as requested) */}
              <div className={`p-4 rounded-2xl border transition ${
                selectedPayment === 'paytm' ? 'border-sky-500 bg-sky-50/40' : 'border-slate-200'
              }`}>
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#002E6E] text-white flex items-center justify-center font-black text-xs tracking-tighter shadow-sm">
                      Pay<span className="text-[#00BAF2]">tm</span>
                    </div>
                    <div>
                      <p className="font-black text-sm text-slate-900">Paytm Payment Gateway</p>
                      <p className="text-[11px] text-slate-500">Paytm UPI • Paytm Wallet • Postpaid</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedPayment === 'paytm'}
                    onChange={() => setSelectedPayment('paytm')}
                    className="accent-sky-600 w-4 h-4"
                  />
                </label>

                {selectedPayment === 'paytm' && (
                  <div className="mt-3 pt-3 border-t border-sky-100 flex gap-2 text-xs">
                    {[
                      { id: 'upi', label: 'Paytm UPI Fast' },
                      { id: 'wallet', label: 'Paytm Wallet' },
                      { id: 'postpaid', label: 'Paytm Postpaid' }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setPaytmType(mode.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition ${
                          paytmType === mode.id
                            ? 'bg-[#002E6E] text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-600'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Option 2: Other UPI (GPay, PhonePe) */}
              <div className={`p-4 rounded-2xl border transition ${
                selectedPayment === 'upi' ? 'border-emerald-600 bg-emerald-50/40' : 'border-slate-200'
              }`}>
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold text-xs">
                      UPI
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900">Google Pay / PhonePe / BHIM</p>
                      <p className="text-[11px] text-slate-500">Instant approval via your UPI app</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedPayment === 'upi'}
                    onChange={() => setSelectedPayment('upi')}
                    className="accent-emerald-700 w-4 h-4"
                  />
                </label>

                {selectedPayment === 'upi' && (
                  <div className="mt-3 pt-3 border-t border-emerald-100">
                    <input
                      type="text"
                      placeholder="Enter UPI ID (e.g. mobile@upi)"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-emerald-700"
                    />
                  </div>
                )}
              </div>

              {/* Option 3: Credit/Debit Cards */}
              <div className={`p-4 rounded-2xl border transition ${
                selectedPayment === 'card' ? 'border-emerald-600 bg-emerald-50/40' : 'border-slate-200'
              }`}>
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-emerald-300" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900">Credit / Debit Card</p>
                      <p className="text-[11px] text-slate-500">Visa, Mastercard, RuPay, Maestro</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedPayment === 'card'}
                    onChange={() => setSelectedPayment('card')}
                    className="accent-emerald-700 w-4 h-4"
                  />
                </label>
              </div>

              {/* Option 4: Cash on Delivery */}
              <div className={`p-4 rounded-2xl border transition ${
                selectedPayment === 'cod' ? 'border-emerald-600 bg-emerald-50/40' : 'border-slate-200'
              }`}>
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900">Cash / UPI on Delivery</p>
                      <p className="text-[11px] text-slate-500">Pay cash or scan QR when rider arrives</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedPayment === 'cod'}
                    onChange={() => setSelectedPayment('cod')}
                    className="accent-emerald-700 w-4 h-4"
                  />
                </label>
              </div>

            </div>

          </div>

          {/* Right Column: Order Items Summary & Final Bill */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
              <h3 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100">
                Order Items ({totalItemsCount})
              </h3>

              {/* Compact Items List */}
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 py-1 text-xs">
                {cartItems.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden pr-2">
                      <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                      <div className="truncate">
                        <p className="font-bold text-slate-800 truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-400">{item.unit} × {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 shrink-0">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Savings callout */}
              {totalSavings > 0 && (
                <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-semibold">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>You saved ₹{totalSavings} direct from farm!</span>
                </div>
              )}

              {/* Final Bill */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Item Subtotal</span>
                  <span className="font-semibold text-slate-900">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Fee</span>
                  <span>{deliveryFee === 0 ? <strong className="text-emerald-700">FREE</strong> : `₹${deliveryFee}`}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Packaging & Handling</span>
                  <span className="font-semibold text-slate-900">₹{handlingFee}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-slate-900 text-base">
                  <span>Grand Total</span>
                  <span className="text-emerald-800 font-mono text-lg">₹{finalTotal}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleCompletePayment}
                disabled={isProcessing}
                className="w-full mt-5 py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/25 transition-all hover:scale-[1.01] disabled:opacity-75"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Processing Secure Payment...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span>Pay ₹{finalTotal} & Confirm Order</span>
                  </span>
                )}
              </button>

              <p className="text-[10px] text-center text-slate-400 mt-2">
                🔒 Secured with 256-Bit SSL Bank Grade Encryption
              </p>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default CheckoutPage;
