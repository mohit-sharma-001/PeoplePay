import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { Logo } from '../../components/ui/Logo';
import { LoginForm } from './components/LoginForm';
import { LoginLandscapeBackground } from './components/LoginLandscapeBackground';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const fromPath = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleLogin = async (emailOrUsername: string, pass: string) => {
    setIsLoading(true);
    setError(undefined);

    try {
      const success = await login(emailOrUsername, pass);
      if (success) {
        navigate(fromPath, { replace: true });
      } else {
        setError('Unable to sign in. Please check your credentials and try again.');
      }
    } catch {
      setError('An unexpected error occurred during authentication. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Motion variants for smooth staggered entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45 },
    },
  };

  const lineVariants = {
    hidden: { scaleX: 0, opacity: 0 },
    visible: {
      scaleX: 1,
      opacity: 1,
      transition: { duration: 0.5, delay: 0.25 },
    },
  };

  return (
    <div className="w-full h-screen h-[100dvh] flex flex-col justify-between p-6 sm:p-10 lg:p-14 relative overflow-hidden select-none bg-[#EAE3DE]">
      {/* Dedicated Birds + Scenery Video Background */}
      <LoginLandscapeBackground />

      {/* TOP MINIMAL NAVIGATION */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full flex items-center justify-between"
      >
        <Logo variant="full" size="md" theme="light" />
        <div className="hidden sm:block text-[11px] font-mono tracking-widest text-[#175A67] font-semibold uppercase">
          PEOPLE OPERATIONS // HR & PAYROLL 360
        </div>
      </motion.header>

      {/* MAIN HERO CENTRIC COMPOSITION */}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-xl mx-auto text-center flex flex-col items-center justify-center my-auto py-4"
      >
        {/* EYEBROW */}
        <motion.div variants={itemVariants} className="mb-2">
          <span className="text-xs font-mono font-bold tracking-[0.25em] uppercase text-[#175A67]">
            PEOPLEPAY360
          </span>
        </motion.div>

        {/* LARGE HEADLINE */}
        <motion.h1
          variants={itemVariants}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none text-[#175A67] drop-shadow-xs"
        >
          Welcome back
        </motion.h1>

        {/* DECORATIVE RULE */}
        <motion.div variants={lineVariants} className="w-12 h-0.5 bg-[#175A67]/40 rounded-full my-4 origin-center" />

        {/* SUPPORTING DESCRIPTION */}
        <motion.p variants={itemVariants} className="text-sm sm:text-base max-w-md font-medium text-[#2A707C] mb-6 leading-relaxed">
          Sign in to continue to your PeoplePay360 workspace.
        </motion.p>

        {/* FORM COMPONENT */}
        <motion.div variants={itemVariants} className="w-full">
          <LoginForm onSubmit={handleLogin} isLoading={isLoading} error={error} />
        </motion.div>
      </motion.main>

      {/* SUBTLE FOOTER DETAIL */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="relative z-10 w-full text-center text-[11px] text-[#2A707C] font-mono tracking-wider font-medium"
      >
        <span>PEOPLEPAY360 ENTERPRISE PLATFORM</span>
      </motion.footer>
    </div>
  );
};
