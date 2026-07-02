import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SEO } from './SEO';

export const PrivacyPage: React.FC = () => {
  const navigate = useNavigate();

  const privacySchema = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    "name": "NariCare Privacy Policy",
    "description": "NariCare's data protection and health privacy policies covering tracking logs and user profiles.",
    "url": "https://www.naricaree.com/privacy",
    "author": {
      "@type": "Organization",
      "name": "NariCare"
    }
  };

  return (
    <div className="min-h-screen bg-[#fffdfd] relative py-20 px-6 sm:px-12 flex flex-col justify-between overflow-hidden">
      <SEO 
        title="Privacy Policy | NariCare"
        description="Learn how NariCare protects your biological tracking data and cycle history with zero-knowledge encryption and local-first policies."
        canonicalUrl="https://www.naricaree.com/privacy"
        schema={privacySchema}
      />
      {/* Background aurora decoration */}
      <div className="absolute top-[-10%] right-[-10%] w-[30rem] h-[30rem] rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[35rem] h-[35rem] rounded-full bg-[#ae9fc4]/5 blur-[150px]" />

      <main id="main-content" className="max-w-4xl mx-auto w-full relative z-10">
        <motion.button 
          onClick={() => navigate('/')}
          className="mb-8 flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest hover:translate-x-[-4px] transition-transform"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Sanctuary
        </motion.button>

        <h1 className="text-4xl sm:text-5xl font-black mb-8 tracking-tighter text-on-background leading-none">
          Privacy <span className="text-gradient">Policy</span>
        </h1>

        <div className="glass p-8 sm:p-12 rounded-[2.5rem] border border-outline-variant/10 shadow-xl flex flex-col gap-6 text-secondary text-sm sm:text-base leading-relaxed">
          <p className="font-bold text-on-background">Last Updated: July 2, 2026</p>
          <p>
            At NariCare, we believe your health parameters are deeply personal. We implement industry-leading encryption and strict local-first logging to guarantee your data stays entirely yours.
          </p>

          <h2 className="text-xl font-black text-on-background mt-4">1. Data Minimization</h2>
          <p>
            We only collect parameters necessary to render accurate predictions, such as cycle start dates, mood logs, and physiological indicators. We never request personally identifying tags beyond a username.
          </p>

          <h2 className="text-xl font-black text-on-background mt-4">2. Zero Third-Party Sharing</h2>
          <p>
            Your tracking data is never sold, shared, or distributed to insurers, marketers, or data brokers. All forecasting logic runs in secure sandboxed nodes.
          </p>

          <h2 className="text-xl font-black text-on-background mt-4">3. Data Portability & Deletion</h2>
          <p>
            You retain absolute command over your timeline logs. You can download your reports or wipe your records instantly from your Profile options.
          </p>
        </div>
      </main>

      <footer className="max-w-4xl mx-auto w-full border-t border-outline-variant/10 pt-8 mt-12 text-center text-xs text-secondary/50 font-bold relative z-10">
        © 2026 NariCare. Crafted with purpose.
      </footer>
    </div>
  );
};

export const TermsPage: React.FC = () => {
  const navigate = useNavigate();

  const termsSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "NariCare Terms of Service",
    "description": "General usage terms and guidelines for the NariCare platform.",
    "url": "https://www.naricaree.com/terms"
  };

  return (
    <div className="min-h-screen bg-[#fffdfd] relative py-20 px-6 sm:px-12 flex flex-col justify-between overflow-hidden">
      <SEO 
        title="Terms of Service | NariCare"
        description="Read the terms of service and conditions governing your use of NariCare's AI tracking models and metabolic forecasts."
        canonicalUrl="https://www.naricaree.com/terms"
        schema={termsSchema}
      />
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[30rem] h-[30rem] rounded-full bg-primary/5 blur-[120px]" />

      <main id="main-content" className="max-w-4xl mx-auto w-full relative z-10">
        <motion.button 
          onClick={() => navigate('/')}
          className="mb-8 flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest hover:translate-x-[-4px] transition-transform"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Sanctuary
        </motion.button>

        <h1 className="text-4xl sm:text-5xl font-black mb-8 tracking-tighter text-on-background leading-none">
          Terms of <span className="text-gradient">Service</span>
        </h1>

        <div className="glass p-8 sm:p-12 rounded-[2.5rem] border border-outline-variant/10 shadow-xl flex flex-col gap-6 text-secondary text-sm sm:text-base leading-relaxed">
          <p className="font-bold text-on-background">Last Updated: July 2, 2026</p>
          <p>
            By accessing or using the NariCare software application, you confirm your agreement to be bound by these service conditions.
          </p>

          <h2 className="text-xl font-black text-on-background mt-4">1. Non-Medical Advisory Platform</h2>
          <p>
            NariCare is designed to log cycle trends and offer analytical projections. Our software does not serve as clinical advice, contraceptive diagnostics, or medical therapy suggestions. Always verify cycle concerns with a registered practitioner.
          </p>

          <h2 className="text-xl font-black text-on-background mt-4">2. Account Responsibility</h2>
          <p>
            You are responsible for protecting the credentials used to log your wellness parameters. Keep your passwords secure to safeguard health files.
          </p>

          <h2 className="text-xl font-black text-on-background mt-4">3. Usage Eligibility</h2>
          <p>
            Users must be at least 16 years of age or have parental clearance to record physical trends.
          </p>
        </div>
      </main>

      <footer className="max-w-4xl mx-auto w-full border-t border-outline-variant/10 pt-8 mt-12 text-center text-xs text-secondary/50 font-bold relative z-10">
        © 2026 NariCare. Crafted with purpose.
      </footer>
    </div>
  );
};

export const ContactPage: React.FC = () => {
  const navigate = useNavigate();

  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Contact NariCare Support",
    "description": "Get in touch with NariCare support and feedback channels.",
    "url": "https://www.naricaree.com/contact"
  };

  return (
    <div className="min-h-screen bg-[#fffdfd] relative py-20 px-6 sm:px-12 flex flex-col justify-between overflow-hidden">
      <SEO 
        title="Contact Us | NariCare"
        description="Get in touch with NariCare. Send design feedback, request feature support, or ask developer questions."
        canonicalUrl="https://www.naricaree.com/contact"
        schema={contactSchema}
      />
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-10%] w-[30rem] h-[30rem] rounded-full bg-primary/5 blur-[120px]" />

      <main id="main-content" className="max-w-4xl mx-auto w-full relative z-10">
        <motion.button 
          onClick={() => navigate('/')}
          className="mb-8 flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest hover:translate-x-[-4px] transition-transform"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Sanctuary
        </motion.button>

        <h1 className="text-4xl sm:text-5xl font-black mb-8 tracking-tighter text-on-background leading-none">
          Contact <span className="text-gradient">Us</span>
        </h1>

        <div className="glass p-8 sm:p-12 rounded-[2.5rem] border border-outline-variant/10 shadow-xl flex flex-col gap-6 text-secondary text-sm sm:text-base leading-relaxed">
          <p className="font-bold text-on-background">Get In Touch</p>
          <p>
            Have ideas to make NariCare even better? Whether you are a designer, developer, health expert, or platform member, we would love to hear from you.
          </p>

          <div className="border-t border-outline-variant/10 pt-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl">mail</span>
              <span className="font-bold text-on-background">hello@naricaree.com</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl">forum</span>
              <span className="text-secondary">LinkedIn: </span>
              <a 
                href="https://www.linkedin.com/in/alokyadavdesigner/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-bold text-on-background hover:underline"
              >
                alokyadavdesigner
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-4xl mx-auto w-full border-t border-outline-variant/10 pt-8 mt-12 text-center text-xs text-secondary/50 font-bold relative z-10">
        © 2026 NariCare. Crafted with purpose.
      </footer>
    </div>
  );
};
