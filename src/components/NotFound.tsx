import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SEO } from './SEO';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#fffdfd] relative py-20 px-6 sm:px-12 flex flex-col justify-between items-center text-center overflow-hidden">
      <SEO 
        title="404 - Page Not Found | NariCare"
        description="The page you are looking for does not exist. Return to NariCare home for smart period tracking and body analytics."
        canonicalUrl="https://www.naricaree.com/404"
      />
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div></div>

      <main id="main-content" className="max-w-xl mx-auto w-full relative z-10 flex flex-col items-center justify-center">
        <motion.span 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="material-symbols-outlined text-8xl text-primary drop-shadow-[0_0_20px_rgba(165,53,86,0.2)] mb-6"
        >
          explore_off
        </motion.span>
        
        <h1 className="text-6xl sm:text-7xl font-black mb-4 tracking-tighter text-on-background leading-none">
          404
        </h1>
        <h2 className="text-xl font-bold text-secondary mb-6">
          The rhythm has drifted. Page not found.
        </h2>
        <p className="text-secondary text-sm leading-relaxed mb-8">
          The link you followed may be broken, or the page has been moved. Let's return to the homepage to realign.
        </p>

        <motion.button 
          onClick={() => navigate('/')}
          className="bg-primary text-on-primary px-8 py-3.5 rounded-full font-bold text-sm tracking-wide shadow-lg shadow-primary/20 border border-primary/20"
          whileHover={{ scale: 1.05, boxShadow: '0 8px 30px rgba(165,53,86,0.3)' }}
          whileTap={{ scale: 0.98 }}
        >
          Return to Sanctuary
        </motion.button>
      </main>

      <footer className="max-w-xl mx-auto w-full border-t border-outline-variant/10 pt-8 mt-12 text-center text-xs text-secondary/50 font-bold relative z-10">
        © 2026 NariCare. Crafted with purpose.
      </footer>
    </div>
  );
};
