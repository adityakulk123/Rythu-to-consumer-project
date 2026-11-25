import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  Bike, 
  ShieldCheck, 
  ChevronRight, 
  ArrowLeft,
  PackageCheck,
  Sparkles,
  ShoppingBag
} from 'lucide-react';

const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const { activeTrackingOrder, orders } = useCart();

  // Find the order
  const order = activeTrackingOrder?.orderId === orderId 
    ? activeTrackingOrder 
    : orders.find((o) => o.orderId === orderId) || activeTrackingOrder;

  // Tracking Stage: 1: CONFIRMED, 2: PACKED, 3: OUT_FOR_DELIVERY, 4: DELIVERED
  const [stage, setStage] = useState(3); // Start Out for Delivery for real-time exciting demo
  const [eta, setEta] = useState(16);

  useEffect(() => {
    // Countdown simulation
    const interval = setInterval(() => {
      setEta((prev) => (prev > 1 ? prev - 1 : 1));
    }, 25000);
    return () => clearInterval(interval);
  }, []);

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm">
          <p className="text-sm font-bold text-slate-800">No active order found.</p>
          <Link to="/store" className="mt-4 inline-block text-xs font-bold text-emerald-700 underline">
            Go to Fresh Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-4">
        
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link to="/store" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Store</span>
          </Link>
          <span className="text-xs font-mono font-bold text-slate-500">
            ORDER ID: #{order.orderId}
          </span>
        </div>

        {/* Live Delivery Status Card (Blinkit Style) */}
        <div className="bg-gradient-to-br from-emerald-800 to-green-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-[11px] font-bold text-[#E9C46A]">
                <Clock className="w-3.5 h-3.5 animate-spin" /> Live Express Delivery
              </span>
              <div className="text-right">
                <span className="text-xs text-emerald-200 block">Delivery OTP</span>
                <span className="text-lg font-black tracking-widest text-[#E9C46A] font-mono">4821</span>
              </div>
            </div>

            <div className="mb-6">
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Arriving in {eta} Mins</span>
              </h1>
              <p className="text-xs text-emerald-100 mt-1">
                Your farm produce has been harvested, quality-checked, and is out for delivery!
              </p>
            </div>

            {/* Stepper Progress Bar */}
            <div className="relative pt-2">
              <div className="h-2 bg-emerald-950/60 rounded-full overflow-hidden mb-4">
                <div 
                  className="h-full bg-gradient-to-r from-[#E9C46A] to-lime-400 transition-all duration-1000"
                  style={{ width: `${(stage / 4) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-4 text-center text-[10px] sm:text-xs font-bold text-emerald-200">
                <div className={stage >= 1 ? 'text-white' : 'opacity-50'}>
                  <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-[#E9C46A]" />
                  <span>Placed at Farm</span>
                </div>
                <div className={stage >= 2 ? 'text-white' : 'opacity-50'}>
                  <PackageCheck className="w-4 h-4 mx-auto mb-1 text-[#E9C46A]" />
                  <span>Quality Inspected</span>
                </div>
                <div className={stage >= 3 ? 'text-white font-black' : 'opacity-50'}>
                  <Bike className="w-4 h-4 mx-auto mb-1 text-[#E9C46A] animate-bounce" />
                  <span>Out for Delivery</span>
                </div>
                <div className={stage >= 4 ? 'text-white' : 'opacity-50'}>
                  <MapPin className="w-4 h-4 mx-auto mb-1 text-[#E9C46A]" />
                  <span>Delivered</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Live Map Route Simulation */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 relative overflow-hidden">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-emerald-700" />
            <span>Live Route GPS Tracking</span>
          </h3>

          <div className="relative h-44 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center">
            {/* SVG Simulated Route Canvas */}
            <svg className="w-full h-full absolute inset-0" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E2E8F0" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Route line */}
              <path 
                d="M 50 120 Q 150 40 280 80 T 520 70" 
                fill="none" 
                stroke="#10B981" 
                strokeWidth="5" 
                strokeDasharray="8 4"
                className="animate-pulse"
              />
            </svg>

            {/* Farm Origin Pin */}
            <div className="absolute left-8 bottom-6 flex flex-col items-center">
              <span className="text-xl">🚜</span>
              <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-md shadow border text-emerald-800">
                Farm Hub
              </span>
            </div>

            {/* Live Delivery Rider Pin */}
            <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-lg border-2 border-white">
                <Bike className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black bg-emerald-900 text-white px-2 py-0.5 rounded-full shadow-md mt-1">
                Ramesh (3 km away)
              </span>
            </div>

            {/* Destination Pin */}
            <div className="absolute right-8 top-6 flex flex-col items-center">
              <span className="text-xl">🏠</span>
              <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-md shadow border text-slate-800">
                Your Home
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <span>Deliver to: {order.deliveryAddress?.houseNo ? `${order.deliveryAddress.houseNo}, ` : ''}{order.deliveryAddress?.area || order.deliveryAddress?.city || 'Selected Address'}</span>
            </span>
            <span className="font-semibold text-emerald-700">Distance: 3.2 km</span>
          </div>
        </div>

        {/* Delivery Partner Profile Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-13 h-13 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl font-bold border border-emerald-200">
              🛵
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-slate-900">{order.rider?.name || 'Ramesh Goud'}</h4>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md font-bold">
                  ★ {order.rider?.rating || '4.9'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Vehicle: <strong className="text-slate-700 font-mono">{order.rider?.vehicleNumber || 'TS 09 AB 4521'}</strong>
              </p>
              <p className="text-[10px] text-emerald-700 font-medium">Vaccinated & Certified Farm Courier</p>
            </div>
          </div>

          <a
            href={`tel:${order.rider?.phone || '9848098765'}`}
            className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-600 text-emerald-800 font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call Partner</span>
          </a>
        </div>

        {/* Order Details & Receipt */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
          <h3 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
            <span>Items in this Order ({order.items?.length || 0})</span>
            <span className="text-xs text-emerald-700 font-bold">Paid via {order.paymentMethod}</span>
          </h3>

          <div className="divide-y divide-slate-100 py-2 text-xs">
            {order.items?.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                  <div>
                    <p className="font-bold text-slate-800">{item.name}</p>
                    <p className="text-[10px] text-slate-400">{item.unit} × {item.quantity}</p>
                  </div>
                </div>
                <span className="font-bold text-slate-900">
                  ₹{item.price * item.quantity}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>{order.deliveryFee === 0 ? <strong className="text-emerald-700">FREE</strong> : `₹${order.deliveryFee}`}</span>
            </div>
            <div className="flex justify-between">
              <span>Handling Fee</span>
              <span>₹{order.handlingFee}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-slate-900 text-sm">
              <span>Total Paid</span>
              <span className="text-emerald-800 font-mono text-base">₹{order.finalTotal}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default OrderTrackingPage;
