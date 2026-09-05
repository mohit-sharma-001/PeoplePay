import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { Logo } from '../../components/ui/Logo';
import { LoginLandscapeBackground } from './components/LoginLandscapeBackground';
import { User, Lock, Mail, Phone, Building, Briefcase, Eye, EyeOff, AlertCircle, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    department: '',
    job_position: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const departmentsList = ['Engineering', 'Product', 'HR', 'Finance', 'Sales', 'Operations'];

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(undefined);
    setFieldErrors({});

    const errors: Record<string, string> = {};

    if (!formData.username.trim()) errors.username = 'Username is required.';
    if (!formData.email.trim()) errors.email = 'Email address is required.';
    if (!formData.first_name.trim()) errors.first_name = 'First name is required.';
    if (!formData.last_name.trim()) errors.last_name = 'Last name is required.';
    if (!formData.password) errors.password = 'Password is required.';
    if (!formData.confirmPassword) errors.confirmPassword = 'Please confirm your password.';
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      const res = await register({
        username: formData.username.trim(),
        password: formData.password,
        email: formData.email.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim(),
        department: formData.department,
        job_position: formData.job_position.trim(),
      });

      if (res.success) {
        // If token returned, user logged in automatically -> redirect to dashboard
        if (res.data?.token) {
          navigate('/dashboard', { replace: true });
        } else {
          // Redirect to login page with success banner
          navigate('/login', {
            state: { message: res.message || 'Registration successful, please log in.' },
          });
        }
      } else {
        if (res.errors) {
          const apiFieldErrors: Record<string, string> = {};
          Object.keys(res.errors).forEach((key) => {
            const errList = res.errors![key];
            if (Array.isArray(errList) && errList.length > 0) {
              apiFieldErrors[key] = errList[0];
            }
          });
          setFieldErrors(apiFieldErrors);
        }
        setGeneralError(res.message || 'Registration failed. Please check form details.');
      }
    } catch {
      setGeneralError('An unexpected error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col justify-between p-4 sm:p-8 lg:p-12 relative overflow-y-auto select-none bg-[#EAE3DE]">
      <LoginLandscapeBackground />

      {/* TOP MINIMAL NAVIGATION */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full flex items-center justify-between mb-4"
      >
        <Logo variant="full" size="md" theme="light" />
        <div className="hidden sm:block text-[11px] font-mono tracking-widest text-[#175A67] font-semibold uppercase">
          PEOPLE OPERATIONS // HR & PAYROLL 360
        </div>
      </motion.header>

      {/* MAIN CONTAINER */}
      <motion.main
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-2xl mx-auto my-auto py-4"
      >
        <div className="text-center mb-6">
          <span className="text-xs font-mono font-bold tracking-[0.25em] uppercase text-[#175A67]">
            PEOPLEPAY360 SELF-SERVICE
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#175A67] mt-1">
            Create Employee Account
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[#2A707C] mt-1">
            Fill in your details below to register. Every new account is assigned Employee portal access.
          </p>
        </div>

        <div className="w-full p-6 sm:p-8 rounded-2xl bg-white/85 backdrop-blur-md border border-[#175A67]/20 shadow-2xl shadow-[#175A67]/10">
          <form onSubmit={handleSubmit} className="space-y-4 text-left" noValidate>
            {generalError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 font-medium flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{generalError}</span>
              </div>
            )}

            {/* Grid 1: First Name & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#175A67]">
                  FIRST NAME *
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  placeholder="e.g. Priya"
                  className={cn(
                    'w-full px-3.5 h-[46px] text-sm rounded-xl border bg-white/90 border-[#175A67]/25 text-[#175A67] placeholder:text-[#175A67]/45 focus:border-[#175A67] focus:ring-1 focus:ring-[#175A67] outline-none transition-all',
                    fieldErrors.first_name && 'border-rose-500'
                  )}
                />
                {fieldErrors.first_name && <p className="text-xs text-rose-600 font-medium">{fieldErrors.first_name}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#175A67]">
                  LAST NAME *
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  placeholder="e.g. Patel"
                  className={cn(
                    'w-full px-3.5 h-[46px] text-sm rounded-xl border bg-white/90 border-[#175A67]/25 text-[#175A67] placeholder:text-[#175A67]/45 focus:border-[#175A67] focus:ring-1 focus:ring-[#175A67] outline-none transition-all',
                    fieldErrors.last_name && 'border-rose-500'
                  )}
                />
                {fieldErrors.last_name && <p className="text-xs text-rose-600 font-medium">{fieldErrors.last_name}</p>}
              </div>
            </div>

            {/* Grid 2: Username & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#175A67]">
                  USERNAME *
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 absolute left-3.5 text-[#175A67]/60 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    placeholder="e.g. priya.patel"
                    className={cn(
                      'w-full pl-10 pr-3.5 h-[46px] text-sm rounded-xl border bg-white/90 border-[#175A67]/25 text-[#175A67] placeholder:text-[#175A67]/45 focus:border-[#175A67] focus:ring-1 focus:ring-[#175A67] outline-none transition-all',
                      fieldErrors.username && 'border-rose-500'
                    )}
                  />
                </div>
                {fieldErrors.username && <p className="text-xs text-rose-600 font-medium">{fieldErrors.username}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#175A67]">
                  EMAIL ADDRESS *
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 absolute left-3.5 text-[#175A67]/60 pointer-events-none" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="priya@company.com"
                    className={cn(
                      'w-full pl-10 pr-3.5 h-[46px] text-sm rounded-xl border bg-white/90 border-[#175A67]/25 text-[#175A67] placeholder:text-[#175A67]/45 focus:border-[#175A67] focus:ring-1 focus:ring-[#175A67] outline-none transition-all',
                      fieldErrors.email && 'border-rose-500'
                    )}
                  />
                </div>
                {fieldErrors.email && <p className="text-xs text-rose-600 font-medium">{fieldErrors.email}</p>}
              </div>
            </div>

            {/* Grid 3: Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#175A67]">
                  PASSWORD *
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 absolute left-3.5 text-[#175A67]/60 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="Create a strong password"
                    className={cn(
                      'w-full pl-10 pr-10 h-[46px] text-sm rounded-xl border bg-white/90 border-[#175A67]/25 text-[#175A67] placeholder:text-[#175A67]/45 focus:border-[#175A67] focus:ring-1 focus:ring-[#175A67] outline-none transition-all',
                      fieldErrors.password && 'border-rose-500'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[#175A67]/60 hover:text-[#175A67] focus:outline-none p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-xs text-rose-600 font-medium">{fieldErrors.password}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#175A67]">
                  CONFIRM PASSWORD *
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 absolute left-3.5 text-[#175A67]/60 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    placeholder="Re-enter password"
                    className={cn(
                      'w-full pl-10 pr-10 h-[46px] text-sm rounded-xl border bg-white/90 border-[#175A67]/25 text-[#175A67] placeholder:text-[#175A67]/45 focus:border-[#175A67] focus:ring-1 focus:ring-[#175A67] outline-none transition-all',
                      fieldErrors.confirmPassword && 'border-rose-500'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 text-[#175A67]/60 hover:text-[#175A67] focus:outline-none p-1 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && <p className="text-xs text-rose-600 font-medium">{fieldErrors.confirmPassword}</p>}
              </div>
            </div>

            {/* Grid 4: Phone, Department, Job Position */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#175A67]">
                  PHONE (OPTIONAL)
                </label>
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 absolute left-3.5 text-[#175A67]/60 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-3.5 h-[46px] text-sm rounded-xl border bg-white/90 border-[#175A67]/25 text-[#175A67] placeholder:text-[#175A67]/45 focus:border-[#175A67] focus:ring-1 focus:ring-[#175A67] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#175A67]">
                  DEPARTMENT
                </label>
                <div className="relative flex items-center">
                  <Building className="w-4 h-4 absolute left-3.5 text-[#175A67]/60 pointer-events-none" />
                  <select
                    value={formData.department}
                    onChange={(e) => handleChange('department', e.target.value)}
                    className="w-full pl-10 pr-3.5 h-[46px] text-sm rounded-xl border bg-white/90 border-[#175A67]/25 text-[#175A67] focus:border-[#175A67] focus:ring-1 focus:ring-[#175A67] outline-none transition-all cursor-pointer appearance-none"
                  >
                    <option value="">Select Department</option>
                    {departmentsList.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#175A67]">
                  JOB POSITION
                </label>
                <div className="relative flex items-center">
                  <Briefcase className="w-4 h-4 absolute left-3.5 text-[#175A67]/60 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.job_position}
                    onChange={(e) => handleChange('job_position', e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="w-full pl-10 pr-3.5 h-[46px] text-sm rounded-xl border bg-white/90 border-[#175A67]/25 text-[#175A67] placeholder:text-[#175A67]/45 focus:border-[#175A67] focus:ring-1 focus:ring-[#175A67] outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Submit Pill Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[52px] px-6 mt-4 rounded-full font-bold text-sm tracking-wider uppercase text-white bg-[#714B67] hover:bg-[#5B3D54] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#714B67]/25 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>REGISTER ACCOUNT</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Footer link to Login */}
            <div className="pt-3 text-center border-t border-[#175A67]/10">
              <p className="text-xs text-[#2A707C]">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-[#175A67] underline hover:text-[#714B67]">
                  Log in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </motion.main>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="relative z-10 w-full text-center text-[11px] text-[#2A707C] font-mono tracking-wider font-medium mt-4"
      >
        <span>PEOPLEPAY360 ENTERPRISE PLATFORM</span>
      </motion.footer>
    </div>
  );
};
