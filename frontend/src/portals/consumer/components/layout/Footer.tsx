import { Link } from 'react-router-dom';
import { Truck, RotateCcw, ShieldCheck, Phone, Mail, MapPin, CreditCard } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-bg-card border-t border-bg-border pt-12 pb-6 text-xs text-content-secondary">
      <div className="max-w-7xl mx-auto px-4 space-y-12">
        {/* Main Footer Links 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Col 1: Help & Contact Info */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="font-head font-extrabold text-xl text-primary-400">
              +880 1334-317864
            </h3>
            <div className="space-y-2 text-content-muted">
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-primary-400" /> Monday - Friday : 9:00 to 5:00
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-primary-400" /> Saturday : 9:00 to 3:00
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-primary-400" /> support@onemed.com
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary-400 shrink-0 mt-0.5" /> 99 Healthcare Tower, Gulshan-2, Dhaka, Bangladesh.
              </p>
            </div>
          </div>

          {/* Col 2: Get to know Us */}
          <div className="space-y-3">
            <h4 className="font-head font-bold text-content-primary text-sm">Get to know Us</h4>
            <ul className="space-y-2 text-content-muted">
              <li><Link to="/products" className="hover:text-content-primary transition-colors">About Us</Link></li>
              <li><Link to="/products" className="hover:text-content-primary transition-colors">Term & Policy</Link></li>
              <li><Link to="/products" className="hover:text-content-primary transition-colors">Careers</Link></li>
              <li><Link to="/products" className="hover:text-content-primary transition-colors">News & Blog</Link></li>
              <li><Link to="/products" className="hover:text-content-primary transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Col 3: Information */}
          <div className="space-y-3">
            <h4 className="font-head font-bold text-content-primary text-sm">Information</h4>
            <ul className="space-y-2 text-content-muted">
              <li><Link to="/products" className="hover:text-content-primary transition-colors">Help Center</Link></li>
              <li><Link to="/products" className="hover:text-content-primary transition-colors">Feedback</Link></li>
              <li><Link to="/products" className="hover:text-content-primary transition-colors">FAQs</Link></li>
              <li><Link to="/products" className="hover:text-content-primary transition-colors">Size Guide</Link></li>
              <li><Link to="/products" className="hover:text-content-primary transition-colors">Payments</Link></li>
            </ul>
          </div>

          {/* Col 4: Orders & Store */}
          <div className="space-y-3">
            <h4 className="font-head font-bold text-content-primary text-sm">Orders & Returns</h4>
            <ul className="space-y-2 text-content-muted">
              <li><Link to="/account/orders" className="hover:text-content-primary transition-colors">Track Order</Link></li>
              <li><Link to="/cart" className="hover:text-content-primary transition-colors">Delivery Options</Link></li>
              <li><Link to="/products" className="hover:text-content-primary transition-colors">Services</Link></li>
              <li><Link to="/account/orders" className="hover:text-content-primary transition-colors">Returns Policy</Link></li>
              <li><Link to="/products" className="hover:text-content-primary transition-colors">Exchanges</Link></li>
            </ul>
          </div>
        </div>

        {/* 3 Trust Feature Pills Strip (Matching Screenshot 05) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-bg-border">
          <div className="bg-bg-surface border border-bg-border rounded-2xl p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-600/20 text-primary-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-head font-bold text-content-primary text-xs">Free delivery over ৳1000</h5>
              <p className="text-[10px] text-content-muted">Express temperature controlled shipping</p>
            </div>
          </div>

          <div className="bg-bg-surface border border-bg-border rounded-2xl p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent-500/20 text-accent-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-head font-bold text-content-primary text-xs">Easy return policy</h5>
              <p className="text-[10px] text-content-muted">Hassle-free 7-day replacement</p>
            </div>
          </div>

          <div className="bg-bg-surface border border-bg-border rounded-2xl p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-head font-bold text-content-primary text-xs">100% Money back</h5>
              <p className="text-[10px] text-content-muted">Guaranteed authentic pharmaceuticals</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Payment Badges */}
        <div className="pt-6 border-t border-bg-border flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-content-muted">
          <div className="flex items-center gap-2">
            <img src="/onemed-logo.png" alt="OneMed" className="w-6 h-6 rounded-lg object-cover" />
            <span>© {new Date().getFullYear()} OneMed Consumer Portal. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-content-secondary mr-2">Secured Payments:</span>
            <span className="px-2 py-1 rounded bg-bg-surface border border-bg-border font-bold text-primary-400">bKash</span>
            <span className="px-2 py-1 rounded bg-bg-surface border border-bg-border font-bold text-accent-400">Nagad</span>
            <span className="px-2 py-1 rounded bg-bg-surface border border-bg-border font-bold text-content-primary">VISA</span>
            <span className="px-2 py-1 rounded bg-bg-surface border border-bg-border font-bold text-content-primary">MasterCard</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
