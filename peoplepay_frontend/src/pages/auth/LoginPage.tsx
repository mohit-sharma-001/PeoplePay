import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, Users, Banknote } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Logo } from '../../components/ui/Logo';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('admin@peoplepay360.io');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both work email and password.');
      return;
    }

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid credentials. Please verify your work email.');
      }
    } catch (err) {
      setError('An error occurred while signing in. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAFAF9] flex items-center justify-center p-4 lg:p-8 font-sans">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* LEFT PANEL: Purple Brand Visual Identity */}
        <div className="lg:col-span-5 bg-[#714B67] text-white p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Background Glow Elements */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#5B3D54] rounded-full blur-2xl opacity-60 pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#F59E0B]/20 rounded-full blur-2xl pointer-events-none" />

          {/* Top Brand Logo */}
          <div className="relative z-10">
            <Logo variant="full" size="lg" theme="dark" />
          </div>

          {/* Middle Product Value Proposition */}
          <div className="relative z-10 my-8 space-y-6">
            <div>
              <span className="inline-block px-2.5 py-1 rounded-md bg-[#5B3D54] text-[#F59E0B] text-xs font-bold uppercase tracking-wider mb-3">
                Enterprise HR & Payroll
              </span>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-white leading-tight">
                Streamline workforce management & payroll with confidence.
              </h2>
            </div>

            <div className="space-y-3 text-xs text-stone-200">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#F59E0B] shrink-0" />
                <span>Centralized Employee & Contract Repository</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#F59E0B] shrink-0" />
                <span>Automated Payroll Execution & Tax Withholding</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#F59E0B] shrink-0" />
                <span>Integrated Attendance & Leave Allocations</span>
              </div>
            </div>
          </div>

          {/* Bottom Security Footer */}
          <div className="relative z-10 pt-4 border-t border-[#8A5F80] flex items-center gap-2 text-[11px] text-stone-300">
            <ShieldCheck className="w-4 h-4 text-[#F59E0B]" />
            <span>256-Bit Encrypted Odoo Hackathon Engine</span>
          </div>
        </div>

        {/* RIGHT PANEL: Login Form */}
        <div className="lg:col-span-7 p-8 lg:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-stone-900 tracking-tight">Sign In to Account</h3>
              <p className="text-xs text-stone-500 mt-1">Enter your work credentials to access the portal.</p>
            </div>

            {/* Demo Credential Preset Helper */}
            <div className="p-3 bg-[#F3EDF2] rounded-lg border border-[#E3D4E0] text-xs text-stone-700 flex items-center justify-between">
              <span className="font-semibold text-[#714B67]">Demo Admin:</span>
              <span className="font-mono text-stone-900 font-bold">admin@peoplepay360.io</span>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Work Email Address"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Input
                label="Password"
                isPassword
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <div className="flex items-center justify-between text-xs my-1">
                <label className="flex items-center gap-2 cursor-pointer text-stone-600 select-none">
                  <input type="checkbox" className="rounded text-[#714B67] border-stone-300 focus:ring-[#714B67]" defaultChecked />
                  Remember me
                </label>
                <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-[#714B67] hover:underline font-semibold">
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full mt-2"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In to Dashboard
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
