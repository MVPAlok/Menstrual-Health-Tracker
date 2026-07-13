import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  AnimatePresence,
  type Variants,
} from 'framer-motion';

/* ─────────────────────────────────────────────
   Reusable Animation Components & Variants
   ───────────────────────────────────────────── */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, delay: i * 0.12, type: 'spring', stiffness: 100, damping: 15 },
  }),
};

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

function RevealOnScroll({
  children,
  className = '',
  variants = fadeUp,
  custom = 0,
  once = true,
  amount = 0.15,
}: {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
  custom?: number;
  once?: boolean;
  amount?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants}
      custom={custom}
      className={className}
    >
      {children}
    </motion.div>
  );
}

import { SEO } from './components/SEO';

// Pre-calculate tick mark coordinates for the outer rotating ring to prevent on-render calculations
const NEURAL_TICK_MARKS = Array.from({ length: 36 }).map((_, i) => {
  const angle = (i * 10) * (Math.PI / 180);
  const r = 96;
  return {
    x1: 100 + (r - 2) * Math.cos(angle),
    y1: 100 + (r - 2) * Math.sin(angle),
    x2: 100 + (r + 2) * Math.cos(angle),
    y2: 100 + (r + 2) * Math.sin(angle),
  };
});

/* ─────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────── */

export default function LandingPage({ scrollTarget }: { scrollTarget?: string }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Memoize random particle properties to prevent layout recalculation on each render
  const predictionParticles = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      width: 1.5 + Math.random() * 2.5,
      height: 1.5 + Math.random() * 2.5,
      left: Math.random() * 100,
      top: Math.random() * 100,
      background: i % 3 === 0 ? '#a53556' : i % 3 === 1 ? '#ff7b9c' : '#ae9fc4',
      opacity: 0.2 + Math.random() * 0.3,
      delay: Math.random() * 8,
      duration: 6 + Math.random() * 6,
    }));
  }, []);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activePhase, setActivePhase] = useState('follicular');
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Scroll to targeted anchors on page load or route transition
  useEffect(() => {
    if (scrollTarget) {
      setTimeout(() => {
        let elementId = scrollTarget;
        if (scrollTarget === 'about') {
          elementId = 'rhythms';
        }
        const element = document.getElementById(elementId);
        if (element) {
          try {
            if ((window as any).lenis) {
              (window as any).lenis.scrollTo(element, { offset: -50, duration: 1.5 });
            } else {
              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          } catch (err) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }, 200);
    }
  }, [scrollTarget]);

  // Determine SEO metadata dynamically
  const getSEOMetadata = () => {
    if (scrollTarget === 'about') {
      return {
        title: "About Us | NariCare",
        description: "Meet the team and view the technical design philosophy behind NariCare's AI women's health platform.",
        canonicalUrl: "https://www.naricaree.com/about",
        schema: {
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": "About NariCare",
          "description": "Learn more about the creators, developers and vision behind NariCare."
        }
      };
    }
    if (scrollTarget === 'experience') {
      return {
        title: "Platform Features | NariCare",
        description: "Explore NariCare's smart period logs, LH ovulation predictions, neural symptom mapping, and private vault features.",
        canonicalUrl: "https://www.naricaree.com/features",
        schema: {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "NariCare Platform Features",
          "description": "Details about biological logging, predictive graphs, and cycle calendars."
        }
      };
    }
    // Default home page metadata
    return {
      title: "AI Period Tracker & Menstrual Cycle Calendar | NariCare",
      description: "NariCare is the premier AI period tracker and menstrual cycle calendar. Track your period, predict symptoms, and log hormonal patterns dynamically with 100% privacy.",
      canonicalUrl: "https://www.naricaree.com/",
      schema: [
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          "@id": "https://www.naricaree.com/#organization",
          "name": "NariCare",
          "url": "https://www.naricaree.com",
          "logo": "https://www.naricaree.com/favicon.svg",
          "sameAs": [
            "https://www.linkedin.com/in/alokyadavdesigner/",
            "https://github.com/MVPAlok"
          ],
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer support",
            "email": "hello@naricaree.com"
          }
        },
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": "https://www.naricaree.com/#website",
          "name": "NariCare",
          "url": "https://www.naricaree.com",
          "publisher": {
            "@id": "https://www.naricaree.com/#organization"
          },
          "creator": {
            "@id": "https://www.naricaree.com/#creator"
          },
          "author": {
            "@id": "https://www.naricaree.com/#creator"
          },
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://www.naricaree.com/?s={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        },
        {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "@id": "https://www.naricaree.com/#software",
          "name": "NariCare",
          "url": "https://www.naricaree.com",
          "operatingSystem": "All",
          "applicationCategory": "HealthApplication",
          "description": "NariCare is an AI-powered biological intelligence platform and period tracker helping women understand cycles, predict symptoms, and track health patterns dynamically.",
          "offers": {
            "@type": "Offer",
            "price": "0"
          },
          "publisher": {
            "@id": "https://www.naricaree.com/#organization"
          },
          "creator": {
            "@id": "https://www.naricaree.com/#creator"
          },
          "author": {
            "@id": "https://www.naricaree.com/#creator"
          }
        },
        {
          "@context": "https://schema.org",
          "@type": "MedicalWebPage",
          "name": "NariCare AI Women's Health Platform",
          "description": "AI-powered period tracker, cycle prediction, metabolic analysis, and women's health loggers."
        },
        {
          "@context": "https://schema.org",
          "@type": "Person",
          "@id": "https://www.naricaree.com/#creator",
          "name": "Alok Yadav",
          "jobTitle": "UI/UX Designer & Product Designer & Frontend Developer",
          "url": "https://www.linkedin.com/in/alokyadavdesigner/",
          "image": "https://www.naricaree.com/trust-bg.png",
          "sameAs": [
            "https://www.linkedin.com/in/alokyadavdesigner/",
            "https://github.com/MVPAlok",
            "https://contra.com/alokyadav"
          ],
          "knowsAbout": [
            "UI/UX Design",
            "Product Design",
            "Frontend Development",
            "Menstrual Health Technology",
            "Women's Wellness Applications"
          ],
          "worksFor": {
            "@id": "https://www.naricaree.com/#organization"
          }
        }
      ]
    };
  };

  const seoMeta = getSEOMetadata();

  const languages = [
    { code: 'en', label: 'English', flag: '🇮🇳' },
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
    { code: 'bn', label: 'বাংলা', flag: '🇮🇳' },
    { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te', label: 'తెలుగు', flag: '🇮🇳' },
    { code: 'mr', label: 'मराठी', flag: '🇮🇳' }
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      try {
        if ((window as any).lenis) {
          (window as any).lenis.scrollTo(element, { offset: -50, duration: 1.5 });
        } else {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } catch (err) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  /* Scroll progress for parallax */
  const { scrollY } = useScroll();
  const heroParallax = useTransform(scrollY, [0, 800], [0, -120]);
  const heroParallaxSpring = useSpring(heroParallax, { stiffness: 50, damping: 20 });

  /* Phase data */
  const phaseData: Record<string, { num: string; title: string; desc: string; energy: string }> = {
    menstrual: {
      num: `${t('rhythms.phase')} 01 / 04`,
      title: t('rhythms.menstrualTitle'),
      desc: t('rhythms.menstrualDesc'),
      energy: `${t('rhythms.energy')}: 40%`
    },
    follicular: {
      num: `${t('rhythms.phase')} 02 / 04`,
      title: t('rhythms.follicularTitle'),
      desc: t('rhythms.follicularDesc'),
      energy: `${t('rhythms.energy')}: 88%`
    },
    ovulation: {
      num: `${t('rhythms.phase')} 03 / 04`,
      title: t('rhythms.ovulationTitle'),
      desc: t('rhythms.ovulationDesc'),
      energy: `${t('rhythms.energy')}: 98%`
    },
    luteal: {
      num: `${t('rhythms.phase')} 04 / 04`,
      title: t('rhythms.lutealTitle'),
      desc: t('rhythms.lutealDesc'),
      energy: `${t('rhythms.energy')}: 65%`
    }
  };

  /* Navigation scroll effect */
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* WebGL Shader Animation */
  useEffect(() => {
    const canvas = document.getElementById('shader-canvas-ANIMATION_11') as HTMLCanvasElement;
    if (!canvas) return;
    const rawGl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!rawGl) return;
    const gl = rawGl as WebGLRenderingContext;
    let renderId: number;

    function syncSize() {
      const w = canvas.clientWidth || window.innerWidth || 1280;
      const h = canvas.clientHeight || window.innerHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    const resizeObserver = new ResizeObserver(syncSize);
    resizeObserver.observe(canvas);
    syncSize();

    const vs = `attribute vec2 a_position;
    varying vec2 v_texCoord;
    void main() {
      v_texCoord = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }`;
    const fs = `precision highp float;

    varying vec2 v_texCoord;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

    float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }

    void main() {
        vec2 uv = v_texCoord;
        vec2 center = vec2(0.5, 0.5);
        vec2 mouse = u_mouse / u_resolution;
        float noiseScale = 1.8;
        float timeScale = u_time * 0.15;
        float noise = snoise(uv * noiseScale + timeScale) * 0.12;
        noise += snoise(uv * noiseScale * 2.5 - timeScale * 1.2) * 0.05;
        float dist = distance(uv, center);
        float mouseDist = distance(uv, mouse);
        float mouseInfluence = smoothstep(0.4, 0.0, mouseDist) * 0.03;
        float orbRadius = 0.32 + noise + mouseInfluence;
        float mask = smoothstep(orbRadius, orbRadius - 0.15, dist);
        vec3 rosePink = vec3(1.0, 0.36, 0.56);
        vec3 lavender = vec3(0.86, 0.78, 1.0);
        vec3 softPeach = vec3(1.0, 0.85, 0.78);
        float aurora1 = snoise(uv * 1.2 + u_time * 0.1) * 0.5 + 0.5;
        float aurora2 = snoise(uv * 2.0 - u_time * 0.08) * 0.5 + 0.5;
        vec3 color = mix(rosePink, lavender, aurora1);
        color = mix(color, softPeach, aurora2 * 0.6);
        float innerGlow = (1.0 - dist * 2.0) * 0.4;
        color += innerGlow * rosePink;
        vec3 bgAurora = mix(vec3(1.0, 0.97, 0.97), color, 0.15);
        vec3 finalColor = mix(bgAurora, color, mask);
        float shimmer = pow(1.0 - abs(dist - orbRadius), 8.0) * 0.15;
        finalColor += shimmer * lavender;
        gl_FragColor = vec4(finalColor, 1.0);
    }`;

    function cs(type: number, src: string) {
      const s = gl.createShader(type);
      if (s) {
        gl.shaderSource(s, src);
        gl.compileShader(s);
      }
      return s;
    }

    const prog = gl.createProgram();
    if (prog) {
      const vsShader = cs(gl.VERTEX_SHADER, vs);
      const fsShader = cs(gl.FRAGMENT_SHADER, fs);
      if (vsShader && fsShader) {
        gl.attachShader(prog, vsShader);
        gl.attachShader(prog, fsShader);
        gl.linkProgram(prog);
        gl.useProgram(prog);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const pos = gl.getAttribLocation(prog, 'a_position');
        gl.enableVertexAttribArray(pos);
        gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

        const uTime = gl.getUniformLocation(prog, 'u_time');
        const uRes = gl.getUniformLocation(prog, 'u_resolution');
        const uMouse = gl.getUniformLocation(prog, 'u_mouse');

        const mouse = { x: canvas.width / 2, y: canvas.height / 2 };

        const handleMouse = (event: MouseEvent) => {
          const rect = canvas.getBoundingClientRect();
          if (rect.width && rect.height) {
            const nx = (event.clientX - rect.left) / rect.width;
            const ny = 1.0 - (event.clientY - rect.top) / rect.height;
            mouse.x = nx * canvas.width;
            mouse.y = ny * canvas.height;
          }
        };
        window.addEventListener('mousemove', handleMouse);

        function render(t: number) {
          syncSize();
          gl.viewport(0, 0, canvas.width, canvas.height);
          if (uTime) gl.uniform1f(uTime, t * 0.001);
          if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
          if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          renderId = requestAnimationFrame(render);
        }
        render(0);

        return () => {
          cancelAnimationFrame(renderId);
          resizeObserver.disconnect();
          window.removeEventListener('mousemove', handleMouse);
        };
      }
    }
  }, []);



  /* ─────────── Mobile Menu Variants ─────────── */
  const menuVariants: Variants = {
    closed: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
    },
    open: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const menuItemVariants: Variants = {
    closed: { opacity: 0, x: -20 },
    open: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  return (
    <>
      <SEO {...seoMeta} />
{/* ═══════════════ TOP NAVIGATION ═══════════════ */}
<motion.header
  className="fixed top-0 w-full z-50 pt-6 pb-2 px-4 md:px-8"
  initial={{ y: -100, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
>
  <div
    className={`flex justify-between items-center px-4 md:px-8 py-3 md:py-4 mx-auto w-full max-w-7xl relative z-50 transition-all duration-500 rounded-full border ${
      scrolled
        ? 'bg-white/80 backdrop-blur-2xl shadow-[0_4px_40px_rgba(165,53,86,0.10)] border-white/70'
        : 'bg-transparent border-transparent'
    }`}
  >
    <motion.div
      className="font-headline-md text-headline-md text-primary tracking-tight font-extrabold text-xl md:text-2xl select-none"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      NariCare
    </motion.div>

    <div className="hidden md:flex gap-8 items-center">
      {[
        { name: 'Rhythms', key: 'rhythms' },
        { name: 'Science', key: 'science' },
        { name: 'Insights', key: 'insights' },
        { name: 'Experience', key: 'experience' }
      ].map((item, i) => (
        <motion.a
          key={item.key}
          className={`${i === 0 ? 'text-primary font-bold' : 'text-secondary hover:text-primary font-semibold'} text-xs tracking-widest uppercase transition-colors duration-300`}
          href={`#${item.key}`}
          onClick={(e) => handleNavClick(e, item.key)}
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {t(`nav.${item.key}`)}
        </motion.a>
      ))}

      {/* Language Selector */}
      <div className="relative" ref={dropdownRef}>
        <motion.button
          onClick={() => setLangDropdownOpen(!langDropdownOpen)}
          className="flex items-center gap-1.5 text-secondary hover:text-primary font-semibold text-xs tracking-widest uppercase transition-colors duration-300 py-1.5 px-3 rounded-full hover:bg-white/40 border border-transparent hover:border-white/20"
          whileHover={{ y: -1 }}
        >
          <span>🌐</span>
          <span>{languages.find(l => l.code === (i18n.language?.substring(0, 2) || 'en'))?.label || 'English'}</span>
          <span className="text-[10px]">▼</span>
        </motion.button>
        <AnimatePresence>
          {langDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-48 rounded-2xl bg-white/90 backdrop-blur-2xl border border-white/60 p-2 shadow-xl z-50 flex flex-col gap-1"
            >
              {languages.map((lang) => {
                const isSelected = (i18n.language?.substring(0, 2) || 'en') === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      i18n.changeLanguage(lang.code);
                      setLangDropdownOpen(false);
                    }}
                    className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-left text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-primary/10 text-primary'
                        : 'text-secondary hover:bg-primary/5 hover:text-primary'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </span>
                    {isSelected && <span className="material-symbols-outlined text-[16px] text-primary">check</span>}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>

    <div className="flex items-center gap-3">
      <motion.button
        className="hidden sm:block bg-primary text-on-primary px-4 md:px-6 py-2 md:py-2.5 rounded-full font-bold text-xs md:text-sm tracking-wide shadow-lg shadow-primary/30"
        whileHover={{ scale: 1.05, boxShadow: '0 8px 30px rgba(165,53,86,0.4)' }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/welcome')}
      >
        {t('nav.joinNow')}
      </motion.button>

      <motion.button
        id="mobile-menu-btn"
        className="md:hidden flex items-center justify-center w-10 h-10 rounded-full glass border border-primary/20 text-primary"
        aria-label="Toggle Menu"
        onClick={() => setMenuOpen(!menuOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
      >
        <motion.span
          className="material-symbols-outlined text-[24px]"
          animate={{ rotate: menuOpen ? 90 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {menuOpen ? 'close' : 'menu'}
        </motion.span>
      </motion.button>
    </div>
  </div>

  {/* Mobile Menu */}
  <AnimatePresence>
    {menuOpen && (
      <motion.div
        className="absolute top-[calc(100%-8px)] left-4 right-4 bg-white/95 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(165,53,86,0.15)] border border-white/80 p-8 flex flex-col gap-6 z-40"
        variants={menuVariants}
        initial="closed"
        animate="open"
        exit="closed"
      >
        <div className="flex flex-col gap-5 text-center mt-2">
          {[
            { name: 'Rhythms', key: 'rhythms' },
            { name: 'Science', key: 'science' },
            { name: 'Insights', key: 'insights' },
            { name: 'Experience', key: 'experience' }
          ].map((item, i) => (
            <motion.a
              key={item.key}
              className={`${i === 0 ? 'text-primary' : 'text-secondary hover:text-primary'} font-bold text-base tracking-widest uppercase py-3 border-b border-primary/5 transition-colors`}
              href={`#${item.key}`}
              variants={menuItemVariants}
              custom={i}
              onClick={(e) => {
                setMenuOpen(false);
                handleNavClick(e, item.key);
              }}
            >
              {t(`nav.${item.key}`)}
            </motion.a>
          ))}

          {/* Mobile Language Selector */}
          <div className="flex flex-col gap-2 py-3 border-b border-primary/5">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary/50 mb-2">🌐 {t('nav.language')}</span>
            <div className="grid grid-cols-3 gap-2">
              {languages.map((lang) => {
                const isSelected = (i18n.language?.substring(0, 2) || 'en') === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      i18n.changeLanguage(lang.code);
                      setMenuOpen(false);
                    }}
                    className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition-all ${
                      isSelected
                        ? 'bg-primary/10 border-primary/20 text-primary'
                        : 'bg-white/40 border-primary/5 text-secondary hover:text-primary'
                    }`}
                  >
                    {lang.flag} {lang.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <motion.button
          className="bg-primary text-on-primary w-full py-4 rounded-full font-bold text-sm tracking-wide shadow-lg shadow-primary/30"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setMenuOpen(false);
            navigate('/welcome');
          }}
        >
          {t('nav.joinSanctuary')}
        </motion.button>
      </motion.div>
    )}
  </AnimatePresence>
</motion.header>

{/* ═══════════════ HERO SECTION ═══════════════ */}
<section className="fixed top-0 left-0 w-full flex items-center justify-center pt-16 sm:pt-24 overflow-hidden z-0" style={{ height: '100dvh' }}>
  {/* Shader Background */}
  <div className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
    <div className="absolute inset-0 w-full h-full" style={{ display: 'block' }}>
      <canvas id="shader-canvas-ANIMATION_11" style={{ display: 'block', width: '100%', height: '100%', position: 'absolute', inset: '0' }}></canvas>
    </div>
  </div>

  {/* Background Particles with parallax */}
  <motion.div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-40" style={{ y: heroParallaxSpring }}>
    <motion.div
      className="absolute top-[20%] left-[15%] w-3 h-3 rounded-full bg-primary/40 blur-[2px]"
      animate={{ y: [0, -30, 0], x: [0, 15, 0], scale: [1, 1.3, 1] }}
      transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute top-[60%] right-[20%] w-4 h-4 rounded-full bg-primary/30 blur-[3px]"
      animate={{ y: [0, -20, 0], x: [0, -25, 0], scale: [1.1, 0.9, 1.1] }}
      transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute bottom-[30%] left-[30%] w-2 h-2 rounded-full bg-tertiary/50 blur-[1px]"
      animate={{ y: [0, 25, 0], x: [0, 20, 0], scale: [0.95, 1.4, 0.95] }}
      transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
    />
  </motion.div>

  <div className="relative z-10 text-center max-w-5xl px-container-padding-mobile mx-auto mt-4 sm:mt-10">
    {/* Visually stunning SEO pill badge */}
    <motion.div
      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/[0.03] text-primary text-[10px] sm:text-xs font-black tracking-widest uppercase mb-5 sm:mb-8"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#a53556]"></span>
      <span>{t('hero.badge')}</span>
    </motion.div>

    <motion.h1
      className="font-hero-display-mobile md:font-hero-display text-[32px] xs:text-[38px] sm:text-5xl md:text-hero-display mb-4 sm:mb-6 tracking-tighter text-on-background drop-shadow-sm"
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
    >
      {t('hero.title')} <br className="hidden md:block" />
      <motion.span
        className="text-gradient"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.7 }}
      >
        {t('hero.subtitle')}
      </motion.span>
    </motion.h1>

    <motion.p
      className="font-body-lg text-sm sm:text-base md:text-body-lg text-secondary max-w-2xl mx-auto mb-8 sm:mb-12 opacity-90"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.9 }}
    >
      {t('hero.desc')}
    </motion.p>

    <motion.div
      className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-16"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 1.1 }}
    >
      <motion.button
        className="bg-primary text-on-primary px-5 py-2.5 sm:px-6 sm:py-3 md:px-10 md:py-5 rounded-full font-bold text-sm sm:text-base md:text-lg border border-primary/50 w-full sm:w-auto"
        whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(165,53,86,0.5)' }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/welcome')}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {t('hero.startTracking')}
      </motion.button>
      <motion.button
        className="glass px-5 py-2.5 sm:px-6 sm:py-3 md:px-10 md:py-5 rounded-full font-bold text-sm sm:text-base md:text-lg text-primary w-full sm:w-auto"
        whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.9)', boxShadow: '0 8px 30px rgba(0,0,0,0.05)' }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => handleNavClick(e, 'experience')}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {t('hero.exploreExperience')}
      </motion.button>
    </motion.div>

    {/* Floating Glass Pills */}
    <motion.div
      className="flex flex-wrap justify-center gap-1.5 sm:gap-2 md:gap-4 px-2 md:px-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 1.3 }}
    >
      {[
        { icon: 'ssid_chart', label: t('hero.neuralMapping') },
        { icon: 'biotech', label: t('hero.hormonalLogic') },
        { icon: 'shield_person', label: t('hero.privacyFirst') },
      ].map((pill, i) => (
        <motion.div
          key={pill.label}
          className="glass px-3 py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-3 rounded-full flex items-center gap-1.5 sm:gap-2 cursor-default text-[10px] sm:text-xs md:text-sm"
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 6 + i * 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.6)' }}
        >
          <span className="material-symbols-outlined text-primary text-xs sm:text-sm md:text-base">{pill.icon}</span>
          <span className="font-semibold text-secondary tracking-wider">{pill.label}</span>
        </motion.div>
      ))}
    </motion.div>
  </div>
</section>

{/* ═══════════════ CONTENT WRAPPER ═══════════════ */}
<div className="relative z-10 bg-[#fffdfd] rounded-t-[3rem] md:rounded-t-[4rem] shadow-[0_-40px_80px_rgba(165,53,86,0.08)] border-t border-white/50" style={{ isolation: 'isolate', marginTop: '100dvh' }}>
  <main id="main-content">

{/* ═══════════════ SECTION 2: LIVING RHYTHM ═══════════════ */}
<section id="rhythms" className="py-16 sm:py-20 md:py-section-gap relative min-h-[80vh] md:min-h-screen flex flex-col items-center justify-center bg-[#fffdfd] overflow-hidden">
  <RevealOnScroll className="text-center max-w-3xl mx-auto mb-10 md:mb-20 px-container-padding-mobile">
    <h2 className="text-4xl sm:text-5xl md:text-7xl font-black mb-4 md:mb-6 tracking-tighter text-on-background">{t('rhythms.title')}</h2>
    <p className="text-base sm:text-lg md:text-xl text-secondary">{t('rhythms.desc')}</p>
  </RevealOnScroll>

  {/* Giant Interactive Cycle Ring */}
  <RevealOnScroll className="relative w-full max-w-[320px] sm:max-w-[420px] md:max-w-4xl aspect-square flex items-center justify-center px-4 sm:px-container-padding-mobile" variants={scaleIn}>
    {/* SVG Ring */}
    <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-[0_0_24px_rgba(165,53,86,0.1)]" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="gradient-menstrual" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF5D8F" />
          <stop offset="100%" stopColor="#ff7b9c" />
        </linearGradient>
        <linearGradient id="gradient-follicular" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff7b9c" />
          <stop offset="100%" stopColor="#FFD8C7" />
        </linearGradient>
        <linearGradient id="gradient-ovulation" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFD8C7" />
          <stop offset="100%" stopColor="#DCC8FF" />
        </linearGradient>
        <linearGradient id="gradient-luteal" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#DCC8FF" />
          <stop offset="100%" stopColor="#a53556" />
        </linearGradient>
        <filter id="ring-glow-filter" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComponentTransfer in="blur" result="glow">
            <feFuncA type="linear" slope="0.6" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx="50" cy="50" r="38" fill="none" stroke="#eae7e7" strokeWidth="8.5" opacity="0.6" />
      {[
        { id: 'menstrual', gradient: 'gradient-menstrual', dasharray: '42.63 238.76', offset: '0' },
        { id: 'follicular', gradient: 'gradient-follicular', dasharray: '59.69 238.76', offset: '-42.63' },
        { id: 'ovulation', gradient: 'gradient-ovulation', dasharray: '34.11 238.76', offset: '-102.32' },
        { id: 'luteal', gradient: 'gradient-luteal', dasharray: '102.33 238.76', offset: '-136.43' },
      ].map((phase) => (
        <motion.circle
          key={phase.id}
          id={`ring-${phase.id}`}
          className="cursor-pointer origin-center"
          cx="50" cy="50" r="38" fill="none"
          stroke={`url(#${phase.gradient})`}
          strokeLinecap="round"
          strokeDasharray={phase.dasharray}
          strokeDashoffset={phase.offset}
          filter="url(#ring-glow-filter)"
          data-phase={phase.id}
          animate={{ strokeWidth: activePhase === phase.id ? 11.5 : 8.5 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          whileHover={{ strokeWidth: 12 }}
          onClick={() => setActivePhase(phase.id)}
          onMouseEnter={() => setActivePhase(phase.id)}
        />
      ))}
    </svg>

    {/* Center Phase Display */}
    <motion.div
      className="relative glass-card rounded-full w-[70%] h-[70%] md:w-[62%] md:h-[62%] flex flex-col items-center justify-center text-center p-6 md:p-12 shadow-[0_40px_100px_-20px_rgba(165,53,86,0.16)] group z-20"
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 150, damping: 15 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activePhase}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center"
        >
          <span className="text-primary font-black text-[9px] sm:text-[10px] md:text-xs tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-1 sm:mb-2 md:mb-3">{phaseData[activePhase].num}</span>
          <h3 className="text-xl sm:text-3xl md:text-5xl font-black text-on-background mb-1 sm:mb-2 md:mb-4">{t('rhythms.' + activePhase + 'Short')}</h3>
          <p className="text-secondary text-[10px] sm:text-sm md:text-base leading-relaxed max-w-sm hidden sm:block">{phaseData[activePhase].desc}</p>
        </motion.div>
      </AnimatePresence>
      <div className="absolute bottom-4 md:bottom-10 glass px-4 py-1.5 md:px-6 md:py-2.5 rounded-full shadow-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[18px]">bolt</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={activePhase + '-energy'}
              className="font-bold text-xs uppercase tracking-wider text-secondary"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              {phaseData[activePhase].energy}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>

    {/* Phase Labels */}
    {[
      { id: 'menstrual', pos: 'top-0 md:top-4 left-1/2 -translate-x-1/2' },
      { id: 'follicular', pos: 'right-0 md:right-4 top-1/2 -translate-y-1/2' },
      { id: 'ovulation', pos: 'bottom-0 md:bottom-4 left-1/2 -translate-x-1/2' },
      { id: 'luteal', pos: 'left-0 md:left-4 top-1/2 -translate-y-1/2' },
    ].map((label, i) => (
      <motion.div
        key={label.id}
        data-phase={label.id}
        className={`absolute ${label.pos} glass px-4 py-2 md:px-8 md:py-4 rounded-full font-black text-[10px] md:text-xs tracking-widest uppercase cursor-pointer z-30 hidden sm:block transition-colors duration-300 ${
          activePhase === label.id ? 'border border-primary/20 text-primary' : 'text-secondary hover:text-primary'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setActivePhase(label.id)}
        onMouseEnter={() => setActivePhase(label.id)}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 + i * 0.1, type: 'spring', stiffness: 200, damping: 15 }}
      >
        {t('rhythms.' + label.id + 'Short')}
      </motion.div>
    ))}
  </RevealOnScroll>
</section>

{/* ═══════════════ SECTION 3: INVISIBLE SHIFTS ═══════════════ */}
<section id="science" className="py-16 sm:py-20 md:py-section-gap px-container-padding-mobile md:px-container-padding-desktop overflow-hidden bg-[#fffdfd]">
  <div className="grid lg:grid-cols-2 gap-12 sm:gap-16 md:gap-24 lg:gap-32 items-center max-w-7xl mx-auto">
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={staggerContainer}
    >
      <motion.h2 variants={staggerItem} className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter mb-6 md:mb-10 leading-none">{t('science.title')}</motion.h2>
      <motion.p variants={staggerItem} className="text-base sm:text-lg md:text-xl text-secondary leading-relaxed mb-8 md:mb-12">{t('science.desc')}</motion.p>
      <motion.button variants={staggerItem} className="group flex items-center gap-4 font-black text-primary uppercase tracking-widest text-sm" whileHover={{ x: 5 }}>
        {t('science.cta')}
        <motion.span className="material-symbols-outlined" whileHover={{ x: 8 }} transition={{ type: 'spring', stiffness: 300 }}>arrow_forward</motion.span>
      </motion.button>
    </motion.div>

    {/* Mobile Grid (visible only on mobile) */}
    <div className="grid grid-cols-2 gap-4 w-full md:hidden mt-8">
      {[
        { icon: 'healing', title: t('science.recovery'), desc: t('science.recoveryDesc') },
        { icon: 'bedtime', title: t('science.sleep'), desc: t('science.sleepDesc') },
        { icon: 'spa', title: t('science.stress'), desc: t('science.stressDesc') },
        { icon: 'sentiment_satisfied', title: t('science.mood'), desc: t('science.moodDesc') },
        { icon: 'psychology', title: t('science.focus'), desc: t('science.focusDesc') },
        { icon: 'bolt', title: t('science.energy'), desc: t('science.energyDesc') },
      ].map((card) => (
        <div
          key={card.title}
          className="glass p-4 rounded-xl flex flex-col gap-1.5 shadow-md border border-primary/5 text-left"
        >
          <span className="material-symbols-outlined text-primary text-xl">{card.icon}</span>
          <h4 className="font-black text-xs text-on-background">{card.title}</h4>
          <p className="text-[9px] leading-snug text-secondary">{card.desc}</p>
        </div>
      ))}
    </div>

    {/* Floating Panels */}
    <RevealOnScroll className="relative h-[280px] sm:h-[400px] md:h-[650px] w-full flex items-center justify-center scale-[0.45] sm:scale-[0.7] md:scale-100 origin-center hidden md:flex" variants={scaleIn}>
      {/* SVG Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" viewBox="0 0 600 600" preserveAspectRatio="none">
        <defs>
          <linearGradient id="shift-line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a53556" />
            <stop offset="100%" stopColor="#ff7b9c" />
          </linearGradient>
        </defs>
        {['M 300 300 L 100 100', 'M 300 300 L 500 100', 'M 300 300 L 60 300', 'M 300 300 L 540 300', 'M 300 300 L 100 500', 'M 300 300 L 500 500'].map((d, i) => (
          <path key={i} className="pulse-line" d={d} stroke="url(#shift-line-grad)" strokeWidth="1.5" fill="none" />
        ))}
      </svg>

      {/* Central Orb */}
      <motion.div
        className="relative z-20 w-36 h-36 rounded-full bg-gradient-to-tr from-primary via-primary-container to-tertiary-container blur-[15px] opacity-80"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute z-30 w-28 h-28 rounded-full bg-gradient-to-tr from-primary to-primary-container border-2 border-white/50 shadow-[0_0_60px_rgba(165,53,86,0.4)] flex items-center justify-center">
        <motion.span
          className="material-symbols-outlined text-white text-4xl"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          biotech
        </motion.span>
      </div>

      {/* Floating Cards */}
      {[
        { icon: 'healing', title: t('science.recovery'), desc: t('science.recoveryDesc'), pos: 'top-[8%] left-[2%]', delay: 0 },
        { icon: 'bedtime', title: t('science.sleep'), desc: t('science.sleepDesc'), pos: 'top-[8%] right-[2%]', delay: 1.5 },
        { icon: 'spa', title: t('science.stress'), desc: t('science.stressDesc'), pos: 'top-[42%] left-[-8%]', delay: 3 },
        { icon: 'sentiment_satisfied', title: t('science.mood'), desc: t('science.moodDesc'), pos: 'top-[42%] right-[-8%]', delay: 0.8 },
        { icon: 'psychology', title: t('science.focus'), desc: t('science.focusDesc'), pos: 'bottom-[8%] left-[2%]', delay: 2.2 },
        { icon: 'bolt', title: t('science.energy'), desc: t('science.energyDesc'), pos: 'bottom-[8%] right-[2%]', delay: 1.1 },
      ].map((card) => (
        <motion.div
          key={card.title}
          className={`absolute ${card.pos} w-40 glass p-5 rounded-2xl flex flex-col gap-2 shadow-lg`}
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: card.delay }}
          whileHover={{ scale: 1.08, backgroundColor: 'rgba(255,255,255,0.7)' }}
        >
          <span className="material-symbols-outlined text-primary text-2xl">{card.icon}</span>
          <div>
            <h4 className="font-black text-sm text-on-background">{card.title}</h4>
            <p className="text-[10px] text-secondary">{card.desc}</p>
          </div>
        </motion.div>
      ))}
    </RevealOnScroll>
  </div>
</section>

{/* ═══════════════ SECTION 4: NEURAL MAP ═══════════════ */}
<section id="neural-map" className="py-16 sm:py-20 md:py-section-gap relative overflow-hidden bg-[#fff8fb]">
  <div className="px-container-padding-mobile md:px-container-padding-desktop max-w-full mx-auto">
    <RevealOnScroll className="text-center mb-8 md:mb-16">
      <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter mb-4 md:mb-6 text-on-background">{t('neuralMap.title')}</h2>
      <p className="text-base sm:text-lg md:text-xl text-secondary max-w-2xl mx-auto">{t('neuralMap.desc')}</p>
    </RevealOnScroll>

    {/* Mobile Neural Grid (visible only on mobile) */}
    <div className="grid grid-cols-2 gap-3 w-full md:hidden mt-6">
      {[
        { label: t('neuralMap.stressSync'), desc: t('neuralMap.stressSyncDesc'), color: 'bg-primary' },
        { label: t('neuralMap.cognitiveFlow'), desc: t('neuralMap.cognitiveFlowDesc'), color: 'bg-[#ff7b9c]' },
        { label: t('neuralMap.estrogenWave'), desc: t('neuralMap.estrogenWaveDesc'), color: 'bg-[#ae9fc4]' },
        { label: t('neuralMap.moodBias'), desc: t('neuralMap.moodBiasDesc'), color: 'bg-primary' },
        { label: t('neuralMap.cravingsShift'), desc: t('neuralMap.cravingsShiftDesc'), color: 'bg-[#ff7b9c]' },
        { label: t('neuralMap.hrvCorrelation'), desc: t('neuralMap.hrvCorrelationDesc'), color: 'bg-[#ae9fc4]' },
        { label: t('neuralMap.recoveryIndex'), desc: t('neuralMap.recoveryIndexDesc'), color: 'bg-primary' },
        { label: t('neuralMap.sleepStage'), desc: t('neuralMap.sleepStageDesc'), color: 'bg-primary' },
      ].map((node) => (
        <div
          key={node.label}
          className="glass px-3.5 py-3 rounded-xl flex items-center gap-2 shadow-sm border border-primary/5 text-left"
        >
          <span className={`w-2 h-2 rounded-full ${node.color} shrink-0`}></span>
          <div>
            <span className="font-black text-[10px] text-on-background uppercase tracking-wider block leading-tight">{node.label}</span>
            <span className="text-[8px] leading-tight text-secondary block mt-0.5">{node.desc}</span>
          </div>
        </div>
      ))}
    </div>

    <RevealOnScroll className="relative h-[250px] sm:h-[380px] md:h-[650px] w-full flex items-center justify-center overflow-hidden max-w-7xl mx-auto scale-[0.3] sm:scale-[0.55] md:scale-100 origin-center neural-map-scale hidden md:flex" variants={scaleIn}>
      {/* SVG Mesh */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50" viewBox="0 0 1200 600" preserveAspectRatio="none">
        <defs>
          <filter id="synapse-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {['M 120 120 L 400 80', 'M 400 80 L 800 80', 'M 800 80 L 1080 120', 'M 120 528 L 400 570', 'M 400 570 L 800 570', 'M 800 570 L 1080 528', 'M 120 120 L 120 528', 'M 1080 120 L 1080 528'].map((d, i) => (
          <path key={`mesh-${i}`} d={d} stroke="rgba(165,53,86,0.12)" strokeWidth="1.5" strokeDasharray="6 6" fill="none" />
        ))}
        {['M 600 300 L 120 120', 'M 600 300 L 400 80', 'M 600 300 L 800 80', 'M 600 300 L 1080 120', 'M 600 300 L 120 528', 'M 600 300 L 400 570', 'M 600 300 L 800 570', 'M 600 300 L 1080 528'].map((d, i) => (
          <path key={`hub-${i}`} d={d} stroke="rgba(165,53,86,0.2)" strokeWidth="1.5" fill="none" />
        ))}
        {[
          { color: '#a53556', dur: '4s', path: 'M 600 300 L 120 120' },
          { color: '#ff7b9c', dur: '3s', path: 'M 600 300 L 800 80' },
          { color: '#ae9fc4', dur: '5s', path: 'M 600 300 L 1080 120' },
          { color: '#FF5D8F', dur: '3.5s', path: 'M 600 300 L 120 528' },
          { color: '#a53556', dur: '4.5s', path: 'M 600 300 L 800 570' },
        ].map((dot, i) => (
          <circle key={`dot-${i}`} r="4" fill={dot.color} filter="url(#synapse-glow)">
            <animateMotion dur={dot.dur} repeatCount="indefinite" path={dot.path} />
          </circle>
        ))}
      </svg>

      {/* Central Hub */}
      <motion.div
        className="relative z-20 w-44 h-44 rounded-full bg-primary/20 flex items-center justify-center"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center shadow-[0_0_80px_rgba(165,53,86,0.55)] border border-white/30">
          <motion.span className="material-symbols-outlined text-white text-5xl" animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}>hub</motion.span>
        </div>
        <div className="absolute inset-0 rounded-full border border-primary node-pulse"></div>
        <div className="absolute inset-0 rounded-full border border-primary node-pulse" style={{ animationDelay: '1.5s' }}></div>
      </motion.div>

      {/* Neural Nodes */}
      {[
        { label: t('neuralMap.stressSync'), desc: t('neuralMap.stressSyncDesc'), color: 'bg-primary animate-pulse', pos: 'top-[10%] left-[2%]' },
        { label: t('neuralMap.cognitiveFlow'), desc: t('neuralMap.cognitiveFlowDesc'), color: 'bg-[#ff7b9c]', pos: 'top-[2%] left-[28%]' },
        { label: t('neuralMap.estrogenWave'), desc: t('neuralMap.estrogenWaveDesc'), color: 'bg-[#ae9fc4]', pos: 'top-[2%] right-[28%]' },
        { label: t('neuralMap.moodBias'), desc: t('neuralMap.moodBiasDesc'), color: 'bg-primary animate-pulse', pos: 'top-[10%] right-[2%]' },
        { label: t('neuralMap.cravingsShift'), desc: t('neuralMap.cravingsShiftDesc'), color: 'bg-[#ff7b9c]', pos: 'bottom-[10%] left-[2%]' },
        { label: t('neuralMap.hrvCorrelation'), desc: t('neuralMap.hrvCorrelationDesc'), color: 'bg-[#ae9fc4]', pos: 'bottom-[2%] left-[28%]' },
        { label: t('neuralMap.recoveryIndex'), desc: t('neuralMap.recoveryIndexDesc'), color: 'bg-primary', pos: 'bottom-[2%] right-[28%]' },
        { label: t('neuralMap.sleepStage'), desc: t('neuralMap.sleepStageDesc'), color: 'bg-primary animate-pulse', pos: 'bottom-[10%] right-[2%]' },
      ].map((node, i) => (
        <motion.div
          key={node.label}
          className={`absolute ${node.pos} glass px-6 py-4 rounded-2xl flex items-center gap-4 shadow-md cursor-pointer border border-primary/5 group`}
          style={{ width: '220px' }}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08, type: 'spring', stiffness: 120, damping: 15 }}
          whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.8)' }}
        >
          <span className={`w-3 h-3 rounded-full ${node.color} shrink-0`}></span>
          <div className="text-left">
            <span className="font-black text-xs text-on-background uppercase tracking-wider block">{node.label}</span>
            <span className="text-[10px] text-secondary">{node.desc}</span>
          </div>
        </motion.div>
      ))}
    </RevealOnScroll>
  </div>
</section>

{/* ═══════════════ SECTION 5: PREDICTION CORE — NEURAL PIPELINE ═══════════════ */}
<section id="insights" className="py-16 md:py-section-gap bg-on-background text-on-primary relative overflow-hidden">
  {/* ── Layered Background System ── */}
  <div className="absolute inset-0 bg-gradient-to-b from-[#0d0a0f] via-[#1b1c1c] to-[#0f0a12] z-0"></div>
  <div className="absolute inset-0 sci-fi-grid opacity-[0.08] pointer-events-none z-0"></div>

  {/* Volumetric gradient blobs */}
  <motion.div
    className="absolute top-[10%] left-[5%] w-[500px] h-[500px] rounded-full z-0 pointer-events-none will-change-transform transform-gpu"
    style={{
      background: 'radial-gradient(circle, rgba(165, 53, 86, 0.15) 0%, rgba(165, 53, 86, 0) 70%)',
      willChange: 'transform, opacity'
    }}
    animate={{ scale: [1, 1.3, 1], opacity: [0.12, 0.2, 0.12] }}
    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
  />
  <motion.div
    className="absolute top-[40%] right-[10%] w-[600px] h-[600px] rounded-full z-0 pointer-events-none will-change-transform transform-gpu"
    style={{
      background: 'radial-gradient(circle, rgba(174, 159, 196, 0.12) 0%, rgba(174, 159, 196, 0) 70%)',
      willChange: 'transform, opacity'
    }}
    animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.18, 0.1] }}
    transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
  />
  <motion.div
    className="absolute bottom-[5%] left-[30%] w-[400px] h-[400px] rounded-full z-0 pointer-events-none will-change-transform transform-gpu"
    style={{
      background: 'radial-gradient(circle, rgba(255, 123, 156, 0.1) 0%, rgba(255, 123, 156, 0) 70%)',
      willChange: 'transform, opacity'
    }}
    animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.15, 0.08] }}
    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
  />

  {/* Floating background particles */}
  <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden transform-gpu" style={{ willChange: 'transform' }}>
    {predictionParticles.map((p, i) => (
      <div
        key={`particle-${i}`}
        className="absolute rounded-full prediction-particle"
        style={{
          width: `${p.width}px`,
          height: `${p.height}px`,
          left: `${p.left}%`,
          top: `${p.top}%`,
          background: p.background,
          opacity: p.opacity,
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.duration}s`,
        }}
      />
    ))}
  </div>

  {/* Subtle noise overlay */}
  <div
    className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none transform-gpu"
    style={{
      backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
      backgroundSize: '128px 128px',
      willChange: 'transform'
    }}
  />

  <div className="px-container-padding-mobile md:px-container-padding-desktop max-w-[1400px] mx-auto w-full relative z-10">

    {/* ── Section Header ── */}
    <RevealOnScroll className="text-center mb-12 md:mb-20">

      <h2 className="text-3xl sm:text-5xl md:text-7xl font-black mb-4 md:mb-6 tracking-tighter text-white hero-glow-text">{t('prediction.title')}</h2>
      <p className="text-white/50 text-sm sm:text-base md:text-lg max-w-2xl mx-auto">{t('prediction.desc')}</p>
    </RevealOnScroll>

    {/* ── Three-Column Layout ── */}
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_280px] gap-6 lg:gap-8 items-start mb-16 md:mb-24">

      {/* ─── LEFT: Pipeline Stages ─── */}
      <motion.div
        className="flex lg:flex-col gap-3 lg:gap-0 overflow-x-auto lg:overflow-visible pb-3 lg:pb-0 no-scrollbar order-2 lg:order-1"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
      >
        {[
          { icon: 'sensors', title: 'Body Signals', desc: 'Biometric inputs collected', status: 'ACTIVE', color: '#ff7b9c' },
          { icon: 'memory', title: 'Data Processing', desc: 'Normalizing health vectors', status: 'RUNNING', color: '#ffb1c1' },
          { icon: 'hub', title: 'Pattern Recognition', desc: 'Neural correlation mapping', status: 'LEARNING', color: '#ae9fc4' },
          { icon: 'psychology', title: 'Prediction Engine', desc: 'Bayesian state projection', status: 'PREDICTING', color: '#d0c0e7' },
          { icon: 'timeline', title: 'Future Timeline', desc: 'Health trajectory mapped', status: 'COMPLETE', color: '#a53556' },
        ].map((stage, i) => (
          <motion.div key={stage.title} variants={staggerItem} custom={i}>
            {/* Stage card */}
            <motion.div
              className="dark-glass min-w-[200px] lg:min-w-0 p-4 lg:p-5 rounded-2xl flex items-start gap-3 lg:gap-4 cursor-default group relative overflow-hidden"
              whileHover={{ borderColor: 'rgba(165,53,86,0.3)', backgroundColor: 'rgba(30,25,30,0.9)' }}
              transition={{ duration: 0.3 }}
            >
              {/* Glow accent on hover */}
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full transition-all duration-500 group-hover:h-12 group-hover:opacity-100 opacity-50" style={{ background: stage.color, boxShadow: `0 0 15px ${stage.color}40` }}></div>

              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${stage.color}15` }}>
                <motion.span
                  className="material-symbols-outlined text-[18px] lg:text-[20px]"
                  style={{ color: stage.color }}
                  animate={i <= 3 ? { opacity: [0.6, 1, 0.6] } : {}}
                  transition={{ duration: 2 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
                >{stage.icon}</motion.span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-black text-[11px] lg:text-xs text-white uppercase tracking-wider">{stage.title}</span>
                  <span className="px-1.5 py-0.5 rounded text-[7px] lg:text-[8px] font-black tracking-widest uppercase shrink-0" style={{ color: stage.color, background: `${stage.color}15` }}>{stage.status}</span>
                </div>
                <p className="text-[10px] lg:text-[11px] text-white/35 leading-snug">{stage.desc}</p>
              </div>
            </motion.div>

            {/* Connector between stages */}
            {i < 4 && (
              <div className="hidden lg:flex items-center justify-center py-1.5">
                <div className="relative h-6 w-[2px]">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-white/5 rounded-full"></div>
                  <motion.div
                    className="absolute w-1.5 h-1.5 rounded-full left-1/2 -translate-x-1/2"
                    style={{ background: stage.color, boxShadow: `0 0 6px ${stage.color}60` }}
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* ─── CENTER: Neural Core Visualization ─── */}
      <RevealOnScroll className="relative flex items-center justify-center order-1 lg:order-2 min-h-[350px] sm:min-h-[450px] lg:min-h-[580px]" variants={scaleIn}>
        <div className="relative w-full h-full flex items-center justify-center neural-core-viz">

          {/* Outer rotating ring 1 */}
          <svg className="absolute w-[340px] h-[340px] sm:w-[440px] sm:h-[440px] lg:w-[520px] lg:h-[520px] ring-breathe transform-gpu" viewBox="0 0 200 200" style={{ animationDuration: '5s', willChange: 'transform, opacity' }}>
            <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(165,53,86,0.12)" strokeWidth="0.5" strokeDasharray="3 12" />
          </svg>

          {/* Outer rotating ring 2 */}
          <svg className="absolute w-[310px] h-[310px] sm:w-[400px] sm:h-[400px] lg:w-[470px] lg:h-[470px] animate-spin-slow transform-gpu" viewBox="0 0 200 200" style={{ willChange: 'transform' }}>
            <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(255,93,143,0.15)" strokeWidth="0.75" strokeDasharray="6 18 2 12" />
            {/* Tick marks */}
            {NEURAL_TICK_MARKS.map((tick, i) => (
              <line key={i} x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
            ))}
          </svg>

          {/* Middle ring — counter-rotating */}
          <svg className="absolute w-[260px] h-[260px] sm:w-[340px] sm:h-[340px] lg:w-[400px] lg:h-[400px] animate-spin-reverse transform-gpu" viewBox="0 0 200 200" style={{ willChange: 'transform' }}>
            <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(174,159,196,0.2)" strokeWidth="1" strokeDasharray="20 8 4 8" />
          </svg>

          {/* Inner scanning ring */}
          <svg className="absolute w-[200px] h-[200px] sm:w-[260px] sm:h-[260px] lg:w-[310px] lg:h-[310px] ring-breathe transform-gpu" viewBox="0 0 200 200" style={{ animationDuration: '3.5s', animationDelay: '1s', willChange: 'transform, opacity' }}>
            <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(255,177,193,0.15)" strokeWidth="1.5" />
          </svg>

          {/* Radar sweep */}
          <div className="absolute w-[200px] h-[200px] sm:w-[260px] sm:h-[260px] lg:w-[310px] lg:h-[310px] rounded-full overflow-hidden radar-line transform-gpu" style={{ animationDuration: '6s', willChange: 'transform' }}>
            <div className="absolute inset-0" style={{ background: 'conic-gradient(from 0deg, transparent 0deg, transparent 340deg, rgba(165,53,86,0.15) 350deg, rgba(165,53,86,0.25) 358deg, transparent 360deg)' }}></div>
          </div>

          {/* Neural connection lines (SVG mesh) */}
          <svg className="absolute w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] lg:w-[440px] lg:h-[440px] pointer-events-none transform-gpu" viewBox="0 0 200 200" style={{ willChange: 'transform' }}>
            <defs>
              <linearGradient id="neural-line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a53556" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#ae9fc4" stopOpacity="0.1"/>
              </linearGradient>
            </defs>
            {/* Connection lines between nodes */}
            {[
              'M 100 30 Q 130 65 100 100', 'M 100 170 Q 70 135 100 100',
              'M 30 80 Q 65 90 100 100', 'M 170 120 Q 135 110 100 100',
              'M 40 150 Q 70 125 100 100', 'M 160 50 Q 130 75 100 100',
              'M 50 40 Q 75 70 100 100', 'M 150 160 Q 125 130 100 100',
              'M 30 130 L 60 110', 'M 170 70 L 140 90',
              'M 50 40 L 30 80', 'M 160 50 L 170 70',
              'M 40 150 L 30 130', 'M 150 160 L 170 120',
            ].map((d, i) => (
              <path key={`conn-${i}`} d={d} stroke="url(#neural-line-grad)" strokeWidth="0.6" fill="none" className="connection-line" style={{ animationDelay: `${i * 0.3}s` }} />
            ))}

            {/* Animated data packets along connections */}
            {[
              { path: 'M 100 30 Q 130 65 100 100', dur: '3s', color: '#ff7b9c' },
              { path: 'M 30 80 Q 65 90 100 100', dur: '4s', color: '#ae9fc4' },
              { path: 'M 170 120 Q 135 110 100 100', dur: '3.5s', color: '#a53556' },
              { path: 'M 100 170 Q 70 135 100 100', dur: '4.5s', color: '#ffb1c1' },
              { path: 'M 40 150 Q 70 125 100 100', dur: '5s', color: '#d0c0e7' },
              { path: 'M 160 50 Q 130 75 100 100', dur: '3.8s', color: '#ff7b9c' },
            ].map((packet, i) => (
              <circle key={`packet-${i}`} r="2" fill={packet.color} opacity="0.7">
                <animateMotion dur={packet.dur} repeatCount="indefinite" path={packet.path} />
              </circle>
            ))}

            {/* Neural nodes at fixed positions */}
            {[
              { cx: 100, cy: 30, r: 3 }, { cx: 100, cy: 170, r: 3 },
              { cx: 30, cy: 80, r: 2.5 }, { cx: 170, cy: 120, r: 2.5 },
              { cx: 40, cy: 150, r: 2 }, { cx: 160, cy: 50, r: 2 },
              { cx: 50, cy: 40, r: 2 }, { cx: 150, cy: 160, r: 2 },
              { cx: 30, cy: 130, r: 1.5 }, { cx: 170, cy: 70, r: 1.5 },
              { cx: 60, cy: 110, r: 1.5 }, { cx: 140, cy: 90, r: 1.5 },
            ].map((node, i) => (
              <g key={`node-${i}`}>
                <circle
                  cx={node.cx}
                  cy={node.cy}
                  r={node.r * 2.5}
                  fill={i % 3 === 0 ? '#a53556' : i % 3 === 1 ? '#ff7b9c' : '#ae9fc4'}
                  className="node-outer-anim"
                  style={{
                    animationDuration: `${3 + i * 0.5}s`,
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
                <circle
                  cx={node.cx}
                  cy={node.cy}
                  r={node.r}
                  fill={i % 3 === 0 ? '#a53556' : i % 3 === 1 ? '#ff7b9c' : '#ae9fc4'}
                  className="node-inner-anim"
                  style={{
                    animationDuration: `${2 + i * 0.3}s`,
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              </g>
            ))}
          </svg>

          {/* Central Core */}
          <div className="relative z-20 flex items-center justify-center">
            {/* Pulse rings expanding outward */}
            <div className="absolute w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-full border border-primary/40 core-pulse"></div>
            <div className="absolute w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-full border border-[#ae9fc4]/30 core-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-full border border-[#ff7b9c]/20 core-pulse" style={{ animationDelay: '2s' }}></div>

            {/* Core glow */}
            <motion.div
              className="absolute w-20 h-20 sm:w-28 sm:h-28 lg:w-36 lg:h-36 rounded-full bg-gradient-to-tr from-primary/40 via-primary-container/30 to-[#ae9fc4]/20 blur-[25px]"
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.7, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Core sphere */}
            <motion.div
              className="relative w-16 h-16 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full bg-gradient-to-br from-primary via-primary-container to-[#ae9fc4] shadow-[0_0_60px_rgba(165,53,86,0.5)] flex items-center justify-center border border-white/20 overflow-hidden"
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <motion.span
                className="material-symbols-outlined text-white/60 text-[28px] sm:text-[40px] lg:text-[48px]"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              >neurology</motion.span>
              {/* Scanline overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0)_97%,rgba(255,255,255,0.1)_97%)] bg-[length:100%_6px] opacity-30 pointer-events-none"></div>
            </motion.div>
          </div>

          {/* Floating telemetry labels near the neural mesh */}
          {[
            { label: 'ESTROGEN', value: '↑ 12%', pos: 'top-[8%] left-[5%] sm:top-[5%] sm:left-[8%]' },
            { label: 'CORTISOL', value: '↓ LOW', pos: 'top-[8%] right-[5%] sm:top-[5%] sm:right-[8%]' },
            { label: 'HRV', value: '68 ms', pos: 'bottom-[8%] left-[5%] sm:bottom-[5%] sm:left-[8%]' },
            { label: 'TEMP', value: '36.6°', pos: 'bottom-[8%] right-[5%] sm:bottom-[5%] sm:right-[8%]' },
          ].map((tag, i) => (
            <motion.div
              key={tag.label}
              className={`absolute ${tag.pos} hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm`}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 + i * 0.2, duration: 0.6 }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: i % 2 === 0 ? '#ff7b9c' : '#ae9fc4' }}></span>
              <span className="text-[9px] font-black uppercase tracking-widest text-white/30">{tag.label}</span>
              <span className="text-[10px] font-bold text-white/60">{tag.value}</span>
            </motion.div>
          ))}
        </div>
      </RevealOnScroll>

      {/* ─── RIGHT: Live Prediction Feed ─── */}
      <motion.div
        className="flex flex-col gap-3 order-3"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={staggerContainer}
      >
        {/* Feed header */}
        <motion.div variants={staggerItem} className="flex items-center justify-between mb-1 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ff7b9c] animate-pulse shadow-[0_0_8px_#ff7b9c]"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Live Predictions</span>
          </div>
          <span className="text-[9px] font-bold text-white/25 uppercase tracking-wider">Real-time</span>
        </motion.div>

        {/* Prediction cards */}
        {[
          { icon: 'cycle', label: 'Cycle Probability', value: '96%', visual: 'bar', barWidth: '96%', barColor: '#a53556' },
          { icon: 'balance', label: 'Hormonal Stability', value: 'Moderate', visual: 'dot', dotColor: '#ffb1c1' },
          { icon: 'bedtime', label: 'Sleep Recovery', value: 'Improving', visual: 'trend', trendUp: true },
          { icon: 'bolt', label: 'Energy Projection', value: 'High Tomorrow', visual: 'dot', dotColor: '#ff7b9c' },
          { icon: 'spa', label: 'Stress Forecast', value: 'Low', visual: 'bar', barWidth: '22%', barColor: '#ae9fc4' },
          { icon: 'water_drop', label: 'Hydration Impact', value: 'Detected', visual: 'dot', dotColor: '#d0c0e7' },
          { icon: 'egg_alt', label: 'Ovulation Window', value: 'Approaching', visual: 'trend', trendUp: true },
          { icon: 'shield', label: 'Prediction Confidence', value: '92%', visual: 'bar', barWidth: '92%', barColor: '#a53556' },
        ].map((pred, i) => (
          <motion.div
            key={pred.label}
            variants={staggerItem}
            custom={i}
            className="dark-glass p-3 sm:p-3.5 rounded-xl flex items-center gap-3 group cursor-default"
            whileHover={{ borderColor: 'rgba(255,93,143,0.2)', backgroundColor: 'rgba(30,25,30,0.85)' }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(165,53,86,0.1)' }}>
              <span className="material-symbols-outlined text-[16px] text-[#ff7b9c]">{pred.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white/35 block truncate">{pred.label}</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs sm:text-sm font-black text-white/90">{pred.value}</span>
                {pred.visual === 'trend' && (
                  <span className="material-symbols-outlined text-[12px]" style={{ color: pred.trendUp ? '#4ade80' : '#ff7b9c' }}>
                    {pred.trendUp ? 'trending_up' : 'trending_down'}
                  </span>
                )}
                {pred.visual === 'dot' && (
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: pred.dotColor }}></span>
                )}
              </div>
              {pred.visual === 'bar' && (
                <div className="w-full h-1 bg-white/5 rounded-full mt-1.5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: pred.barColor, width: 0 }}
                    whileInView={{ width: pred.barWidth }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, delay: 0.5 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {/* Confidence summary */}
        <motion.div
          variants={staggerItem}
          className="mt-2 p-3.5 rounded-xl border border-primary/15 bg-primary/[0.04] backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">Overall Confidence</span>
            <motion.span
              className="text-sm font-black text-primary"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1.8, duration: 0.5 }}
            >92%</motion.span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-[#ff7b9c]"
              style={{ width: 0, boxShadow: '0 0 12px rgba(165,53,86,0.4)' }}
              whileInView={{ width: '92%' }}
              viewport={{ once: true }}
              transition={{ duration: 2, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>

    {/* ── Bottom: Horizontal Pipeline Process Bar ── */}
    <RevealOnScroll className="w-full">
      <div className="relative border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm rounded-2xl p-5 sm:p-6 md:p-8 overflow-hidden">
        {/* Subtle top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 sm:gap-2">
          {[
            { icon: 'favorite', label: 'Health Data', color: '#ff7b9c' },
            { icon: 'memory', label: 'AI Processing', color: '#a53556' },
            { icon: 'psychology', label: 'Pattern Learning', color: '#ae9fc4' },
            { icon: 'auto_awesome', label: 'Prediction Generated', color: '#ffb1c1' },
            { icon: 'person_check', label: 'Recommendation', color: '#d0c0e7' },
          ].map((step, i, arr) => (
            <div key={step.label} className="flex items-center gap-2 sm:gap-3 flex-1 min-w-[130px] sm:min-w-0">
              {/* Step */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <motion.div
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border border-white/[0.06]"
                  style={{ background: `${step.color}12` }}
                  whileInView={{ scale: [0.8, 1] }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, type: 'spring', stiffness: 200 }}
                >
                  <motion.span
                    className="material-symbols-outlined text-[16px] sm:text-[18px]"
                    style={{ color: step.color }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2 + i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
                  >{step.icon}</motion.span>
                </motion.div>
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white/40 whitespace-nowrap">{step.label}</span>
              </div>

              {/* Connector arrow */}
              {i < arr.length - 1 && (
                <div className="hidden sm:flex flex-1 items-center justify-center px-1">
                  <div className="flex-1 h-[1px] bg-gradient-to-r from-white/10 to-white/5 relative">
                    <motion.div
                      className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                      style={{ background: step.color, boxShadow: `0 0 6px ${step.color}50` }}
                      animate={{ left: ['0%', '100%'] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
                    />
                  </div>
                  <span className="material-symbols-outlined text-[12px] text-white/15 mx-1">chevron_right</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </RevealOnScroll>
  </div>
</section>

{/* ═══════════════ SECTION 6: BODY INSIGHTS ═══════════════ */}
<section id="body-communicating" className="py-section-gap relative bg-gradient-to-b from-[#fcf9f8] to-[#fff5f7] overflow-hidden" style={{ isolation: 'isolate', backgroundColor: '#fcf9f8' }}>
  <RevealOnScroll className="px-container-padding-mobile text-center mb-16">
    <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full glass border border-primary/10 text-primary font-bold text-xs tracking-[0.2em] mb-6">
      <motion.span className="material-symbols-outlined text-[16px]" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>analytics</motion.span>
      {t('biometrics.badge')}
    </div>
    <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter text-on-background">{t('biometrics.title')}</h2>
    <p className="text-xl text-secondary max-w-2xl mx-auto">{t('biometrics.desc')}</p>
  </RevealOnScroll>

  <motion.div
    className="grid md:grid-cols-2 gap-6 md:gap-10 max-w-7xl mx-auto px-container-padding-mobile px-container-padding-desktop"
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.1 }}
    variants={staggerContainer}
  >
    {/* Card 1: Energy */}
    <motion.div variants={staggerItem} className="glass-card p-6 sm:p-10 rounded-3xl sm:rounded-[2.5rem] flex flex-col justify-between cursor-pointer" whileHover={{ y: -8, boxShadow: '0 30px 60px -15px rgba(165,53,86,0.1)' }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
      <div>
        <div className="flex justify-between items-center mb-6">
          <span className="text-primary font-black text-xs tracking-widest uppercase">{t('biometrics.energyWaveform')}</span>
          <span className="material-symbols-outlined text-primary text-2xl">bolt</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-black text-on-background mb-4">{t('biometrics.energyTitle')}</h3>
        <p className="text-secondary text-sm sm:text-base leading-relaxed mb-8">{t('biometrics.energyDesc')}</p>
      </div>
      <div className="glass p-4 sm:p-6 rounded-2xl flex items-center justify-between gap-4 sm:gap-6 border border-primary/5">
        <div className="w-full">
          <div className="flex justify-between text-[11px] text-secondary font-bold uppercase mb-2">
            <span>{t('biometrics.estrogenCurve')}</span>
            <span className="text-primary">{t('biometrics.peakDay')}</span>
          </div>
          <svg className="w-full h-14" viewBox="0 0 240 60" preserveAspectRatio="none">
            <path d="M 0 45 Q 40 40, 80 48 T 120 10 T 160 48 T 240 50" fill="none" stroke="#ff7b9c" strokeWidth="3" strokeLinecap="round" />
            <path d="M 0 45 Q 40 40, 80 48 T 120 10 T 160 48 T 240 50" fill="none" stroke="#ff7b9c" strokeWidth="8" strokeLinecap="round" opacity="0.15" />
            <path d="M 0 42 Q 60 50, 120 30 T 240 25" fill="none" stroke="#ae9fc4" strokeWidth="1.5" strokeDasharray="4 4" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </motion.div>

    {/* Card 2: Mood */}
    <motion.div variants={staggerItem} className="glass-card p-6 sm:p-10 rounded-3xl sm:rounded-[2.5rem] flex flex-col justify-between cursor-pointer" whileHover={{ y: -8, boxShadow: '0 30px 60px -15px rgba(165,53,86,0.1)' }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
      <div>
        <div className="flex justify-between items-center mb-6">
          <span className="text-primary font-black text-xs tracking-widest uppercase">{t('biometrics.hormonalTemp')}</span>
          <span className="material-symbols-outlined text-primary text-2xl">sentiment_satisfied</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-black text-on-background mb-4">{t('biometrics.moodTitle')}</h3>
        <p className="text-secondary text-sm sm:text-base leading-relaxed mb-8">{t('biometrics.moodDesc')}</p>
      </div>
      <div className="glass p-4 sm:p-6 rounded-2xl flex flex-col gap-4 border border-primary/5">
        <div className="flex justify-between text-[11px] text-secondary font-bold uppercase">
          <span>{t('biometrics.autonomicSeasons')}</span>
          <span className="text-primary">{t('biometrics.currentSpring')}</span>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-black">
          <div className="p-2 rounded-xl bg-secondary-container/40 text-secondary">{t('biometrics.quiet').toUpperCase()}<br/><span className="text-[9px] font-normal">{t('rhythms.menstrualShort')}</span></div>
          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">{t('biometrics.alert').toUpperCase()}<br/><span className="text-[9px] font-normal">{t('rhythms.follicularShort')}</span></div>
          <div className="p-2 rounded-xl bg-[#ffd8c7]/50 text-[#760e34]">{t('biometrics.social').toUpperCase()}<br/><span className="text-[9px] font-normal">{t('rhythms.ovulationShort')}</span></div>
          <div className="p-2 rounded-xl bg-[#ecdcff]/40 text-[#413555]">{t('biometrics.calm').toUpperCase()}<br/><span className="text-[9px] font-normal">{t('rhythms.lutealShort')}</span></div>
        </div>
      </div>
    </motion.div>

    {/* Card 3: Sleep */}
    <motion.div variants={staggerItem} className="glass-card p-6 sm:p-10 rounded-3xl sm:rounded-[2.5rem] flex flex-col justify-between cursor-pointer" whileHover={{ y: -8, boxShadow: '0 30px 60px -15px rgba(165,53,86,0.1)' }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
      <div>
        <div className="flex justify-between items-center mb-6">
          <span className="text-primary font-black text-xs tracking-widest uppercase">{t('biometrics.restorativeStage')}</span>
          <span className="material-symbols-outlined text-primary text-2xl">bedtime</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-black text-on-background mb-4">{t('biometrics.sleepTitle')}</h3>
        <p className="text-secondary text-sm sm:text-base leading-relaxed mb-8">{t('biometrics.sleepDesc')}</p>
      </div>
      <div className="glass p-4 sm:p-6 rounded-2xl flex flex-col gap-3 border border-primary/5">
        <div className="flex justify-between text-[11px] text-secondary font-bold uppercase">
          <span>{t('biometrics.deepSleepQuality')}</span>
          <span className="text-primary">7.8h {t('biometrics.restored').toUpperCase()}</span>
        </div>
        <div className="h-5 w-full bg-secondary-container/30 rounded-full overflow-hidden flex">
          <div className="h-full bg-primary/20" style={{ width: '15%' }}></div>
          <div className="h-full bg-[#ae9fc4]" style={{ width: '25%' }}></div>
          <div className="h-full bg-[#ff7b9c]" style={{ width: '40%' }}></div>
          <div className="h-full bg-primary" style={{ width: '20%' }}></div>
        </div>
        <div className="flex justify-between text-[9px] font-semibold text-secondary/60">
          <span>Awake (15%)</span><span>REM (25%)</span><span>Core (40%)</span><span>Deep (20%)</span>
        </div>
      </div>
    </motion.div>

    {/* Card 4: Symptoms */}
    <motion.div variants={staggerItem} className="glass-card p-6 sm:p-10 rounded-3xl sm:rounded-[2.5rem] flex flex-col justify-between cursor-pointer" whileHover={{ y: -8, boxShadow: '0 30px 60px -15px rgba(165,53,86,0.1)' }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
      <div>
        <div className="flex justify-between items-center mb-6">
          <span className="text-primary font-black text-xs tracking-widest uppercase">{t('biometrics.autonomicCorrelations')}</span>
          <span className="material-symbols-outlined text-primary text-2xl">healing</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-black text-on-background mb-4">{t('biometrics.symptomTitle')}</h3>
        <p className="text-secondary text-sm sm:text-base leading-relaxed mb-8">{t('biometrics.symptomDesc')}</p>
      </div>
      <div className="glass p-4 sm:p-6 rounded-2xl border border-primary/5">
        <div className="flex flex-col gap-3 text-xs">
          <div className="flex justify-between items-center border-b border-outline-variant/10 pb-2">
            <span className="font-bold text-secondary">{t('biometrics.caffeineLuteal')}</span>
            <span className="text-primary font-black">+{t('biometrics.crampingRisk')}</span>
          </div>
          <div className="flex justify-between items-center border-b border-outline-variant/10 pb-2">
            <span className="font-bold text-secondary">{t('biometrics.hydrationBaseline')}</span>
            <span className="text-green-700 font-black">-{t('biometrics.bloatingIndex')}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-secondary">{t('biometrics.magnesiumSync')}</span>
            <span className="text-green-700 font-black">-{t('biometrics.crampDuration')}</span>
          </div>
        </div>
      </div>
    </motion.div>
  </motion.div>
</section>

{/* ═══════════════ SECTION 7: MOBILE EXPERIENCE ═══════════════ */}
<section id="experience" className="py-section-gap bg-[#fffdfd] overflow-hidden relative">
  {/* Ambient glows */}
  <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full max-w-[800px] h-[800px] rounded-full pointer-events-none z-0 overflow-hidden md:overflow-visible">
    <motion.div className="absolute top-1/4 left-1/4 w-[300px] md:w-[400px] h-[300px] md:h-[400px] rounded-full bg-[#ff7b9c]/20 blur-[80px] md:blur-[100px] mix-blend-multiply" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
    <motion.div className="absolute bottom-1/4 left-[40%] w-[350px] md:w-[450px] h-[350px] md:h-[450px] rounded-full bg-[#ae9fc4]/20 blur-[100px] md:blur-[120px] mix-blend-multiply" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }} />
    <motion.div className="absolute top-1/2 left-[10%] w-[200px] md:w-[300px] h-[200px] md:h-[300px] rounded-full bg-[#ffd8c7]/20 blur-[70px] md:blur-[90px] mix-blend-multiply" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />
    <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[400px] md:w-[600px] h-[400px] md:h-[600px] rounded-full bg-[#FF5D8F]/5 blur-[100px] md:blur-[150px]"></div>
    <div className="absolute top-[10%] left-[30%] w-[200px] md:w-[300px] h-[400px] md:h-[600px] bg-white/40 blur-[60px] md:blur-[80px] rotate-[15deg]"></div>
  </div>

  <div className="px-container-padding-mobile md:px-container-padding-desktop max-w-7xl mx-auto relative z-10">
    <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
      {/* Phone Composition */}
      <RevealOnScroll className="relative h-[600px] md:h-[800px] w-full flex items-center justify-center [perspective:2000px] group/presentation iphones-container" variants={scaleIn}>
        {/* Orbit Ellipses */}
        <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center scale-[0.6] md:scale-100">
          <svg className="absolute w-[800px] h-[800px] opacity-60 animate-spin-slow" viewBox="0 0 800 800">
            <ellipse cx="400" cy="400" rx="350" ry="180" fill="none" stroke="rgba(255, 123, 156, 0.4)" strokeWidth="1.5" strokeDasharray="8 24" transform="rotate(25 400 400)"/>
            <ellipse cx="400" cy="400" rx="280" ry="240" fill="none" stroke="rgba(174, 159, 196, 0.5)" strokeWidth="1" strokeDasharray="4 12" transform="rotate(-15 400 400)"/>
            <ellipse cx="400" cy="400" rx="400" ry="120" fill="none" stroke="rgba(255, 216, 199, 0.3)" strokeWidth="2" strokeDasharray="2 30" transform="rotate(45 400 400)"/>
          </svg>
          <motion.div className="absolute w-2 h-2 rounded-full bg-primary shadow-[0_0_12px_#a53556] z-30" style={{ left: '20%', top: '30%' }} animate={{ y: [0, -20, 0], x: [0, 10, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.div className="absolute w-1.5 h-1.5 rounded-full bg-[#ff7b9c] shadow-[0_0_10px_#ff7b9c] z-30" style={{ right: '15%', top: '45%' }} animate={{ y: [0, 15, 0], x: [0, -15, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.div className="absolute w-2.5 h-2.5 rounded-full bg-[#ae9fc4] shadow-[0_0_15px_#ae9fc4] z-30" style={{ left: '30%', bottom: '20%' }} animate={{ y: [0, -25, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
        </div>

        {/* Phones */}
        <div className="relative w-full max-w-[600px] h-full flex items-center justify-center [transform-style:preserve-3d] group-hover/presentation:rotate-y-[5deg] group-hover/presentation:rotate-x-[2deg] transition-transform duration-[2s] ease-out scale-[0.6] sm:scale-[0.7] md:scale-[0.8] lg:scale-[0.75] xl:scale-[0.85] iphones-scale">
          {/* Left Phone */}
          <motion.div
            className="absolute left-[2%] md:-left-[10%] top-[20%] w-[210px] md:w-[240px] z-10"
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transform: 'translateZ(-250px) rotateY(30deg) rotateX(8deg) rotateZ(-4deg)', filter: 'blur(2px) brightness(0.85)' }}
          >
            <div className="iphone-device rounded-[38px] bg-neutral-900 p-2 shadow-[30px_40px_60px_-10px_rgba(0,0,0,0.5)] border-2 border-neutral-800 ring-1 ring-white/10 relative overflow-hidden h-[480px] md:h-[520px]">
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-full z-50"></div>
              <div className="w-full h-full rounded-[30px] bg-[#fff8f8] overflow-hidden relative p-4 flex flex-col justify-between iphone-reflection">
                <div className="flex justify-between items-center text-[9px] text-secondary font-black">
                  <span>NariCare</span>
                  <span className="material-symbols-outlined text-[10px] text-primary">wifi</span>
                </div>
                <div className="flex-grow flex flex-col items-center justify-center text-center mt-4">
                  <span className="text-primary font-black text-[8px] tracking-widest uppercase mb-1">{t('landingShowcase.lutealPhase')}</span>
                  <h4 className="text-xl font-black text-on-background mb-3">{t('landingShowcase.day', { num: 22 })}</h4>
                  <div className="relative w-24 h-24 flex items-center justify-center mb-4">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="16" fill="none" stroke="#f3ded9" strokeWidth="2.5"></circle>
                      <circle cx="18" cy="18" r="16" fill="none" stroke="#a53556" strokeWidth="2.5" strokeDasharray="100" strokeDashoffset="30" strokeLinecap="round"></circle>
                    </svg>
                    <div className="absolute text-center">
                      <span className="font-black text-[10px] text-primary">{t('landingShowcase.days', { num: 4 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Phone */}
          <motion.div
            className="absolute right-[2%] md:-right-[1%] top-[12%] w-[220px] md:w-[230px] z-20"
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
            style={{ transform: 'translateZ(-120px) rotateY(-25deg) rotateX(5deg) rotateZ(3deg)', filter: 'blur(0.8px) brightness(0.92)' }}
          >
            <div className="iphone-device rounded-[40px] bg-neutral-900 p-2 shadow-[-20px_30px_50px_-10px_rgba(0,0,0,0.4)] border-2 border-neutral-800 ring-1 ring-white/10 relative overflow-hidden h-[500px] md:h-[540px]">
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-full z-50"></div>
              <div className="w-full h-full rounded-[32px] bg-[#fffdfd] overflow-hidden relative p-4 flex flex-col justify-between iphone-reflection">
                <div className="flex justify-between items-center text-[9px] text-secondary font-black">
                  <span>{t('landingShowcase.logging')}</span>
                  <span className="text-secondary/60">{t('landingShowcase.active')}</span>
                </div>
                <div className="flex-grow flex flex-col text-left mt-6">
                  <h4 className="text-base font-black text-on-background mb-4">{t('landingShowcase.logBiometrics')}</h4>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-secondary/10 text-[8px] font-bold">
                      <span className="text-secondary flex items-center gap-1.5"><span className="material-symbols-outlined text-primary text-[10px]">bolt</span>{t('logger.energy')}</span>
                      <span className="bg-[#ffd9df] text-primary px-1.5 py-0.5 rounded-full">{t('landingShowcase.high')}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-secondary/10 text-[8px] font-bold">
                      <span className="text-secondary flex items-center gap-1.5"><span className="material-symbols-outlined text-primary text-[10px]">healing</span>{t('biometrics.symptomTitle').split(' ')[0]}</span>
                      <span className="bg-secondary-container text-secondary px-1.5 py-0.5 rounded-full">{t('landingShowcase.none')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Center Phone */}
          <motion.div
            className="absolute left-1/2 top-[5%] md:top-0 -translate-x-1/2 w-[260px] md:w-[300px] z-40"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            style={{ transform: 'translateZ(80px)' }}
          >
            <div className="absolute inset-[-60px] bg-white/40 blur-[60px] rounded-[60px] pointer-events-none group-hover/presentation:bg-white/60 transition-colors duration-1000"></div>
            <div className="iphone-device rounded-[48px] bg-black p-2.5 md:p-3 shadow-[0_60px_120px_-20px_rgba(165,53,86,0.4)] border-[3px] md:border-[4px] border-neutral-800 ring-1 ring-white/30 relative overflow-hidden h-[560px] md:h-[620px] group-hover/presentation:-translate-y-4 transition-transform duration-1000 ease-out">
              <div className="absolute top-3.5 md:top-4 left-1/2 -translate-x-1/2 w-20 md:w-24 h-5 md:h-6 bg-black rounded-full z-50"></div>
              <div className="w-full h-full rounded-[38px] bg-[#fcf9f8] overflow-hidden relative p-5 flex flex-col justify-between iphone-reflection">
                <div className="flex justify-between items-center text-[10px] text-secondary font-black">
                  <span className="text-primary font-black tracking-widest">LUNA PRO</span>
                  <span className="text-secondary/80">10:09 AM</span>
                </div>
                <div className="flex-grow flex flex-col text-left mt-8">
                  <p className="text-[10px] text-secondary font-bold uppercase tracking-wider mb-1">{t('dashboard.greetingMorning')},</p>
                  <h4 className="text-2xl font-black text-on-background mb-5">Clara</h4>
                  <div className="glass bg-white/80 p-4 rounded-2xl mb-4 border border-primary/10 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-xl"></div>
                    <span className="text-primary font-black text-[9px] uppercase tracking-wider mb-2 block">{t('landingShowcase.dailySanctuary')}</span>
                    <p className="text-[11px] text-on-background font-bold leading-relaxed">{t('landingShowcase.estrogenMsg')}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-secondary/5 flex flex-col gap-3 shadow-sm">
                    <div className="flex justify-between text-[9px] font-bold text-secondary">
                      <span>{t('landingShowcase.focusState')}</span>
                      <span className="text-primary">{t('landingShowcase.optimized')}</span>
                    </div>
                    <div className="h-10 flex items-end gap-1.5 justify-between px-1">
                      <div className="w-full h-[30%] bg-secondary-fixed rounded-sm"></div>
                      <div className="w-full h-[40%] bg-secondary-fixed rounded-sm"></div>
                      <div className="w-full h-[60%] bg-secondary-fixed rounded-sm"></div>
                      <div className="w-full h-[100%] bg-primary rounded-sm shadow-[0_0_10px_rgba(165,53,86,0.4)]"></div>
                      <div className="w-full h-[80%] bg-primary/80 rounded-sm"></div>
                      <div className="w-full h-[50%] bg-secondary-fixed rounded-sm"></div>
                    </div>
                  </div>
                </div>
                <div className="h-10 border-t border-secondary/10 flex justify-around items-center pt-2">
                  <span className="material-symbols-outlined text-[18px] text-secondary/40">calendar_month</span>
                  <span className="material-symbols-outlined text-[18px] text-secondary/40">add_circle</span>
                  <span className="material-symbols-outlined text-[18px] text-primary drop-shadow-[0_0_8px_rgba(165,53,86,0.5)]">insights</span>
                </div>
              </div>
            </div>

            {/* Floating cards around center phone */}
            <motion.div
              className="absolute -right-[20px] md:-right-[80px] top-[15%] w-[180px] md:w-[210px] glass-card p-4 rounded-2xl border border-white/50 shadow-[0_30px_60px_-15px_rgba(165,53,86,0.2)] [transform-style:preserve-3d] z-50"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              whileHover={{ scale: 1.05, x: 6, y: -3 }}
              style={{ transform: 'translateZ(120px) rotateY(-5deg)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 rounded-2xl pointer-events-none"></div>
              <div className="flex items-center gap-3 mb-2 relative z-10">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[14px]">calendar_month</span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-primary">{t('landingShowcase.prediction')}</span>
              </div>
              <p className="text-on-background font-black text-sm md:text-base leading-tight relative z-10">{t('landingShowcase.ovulationTime')}</p>
              <p className="text-[10px] text-secondary mt-1 font-semibold relative z-10">{t('landingShowcase.confidence', { rate: 98.4 })}</p>
            </motion.div>

            <motion.div
              className="absolute -left-[20px] md:-left-[100px] top-[45%] w-[160px] md:w-[180px] glass-card p-4 rounded-2xl border border-white/50 shadow-[0_30px_60px_-15px_rgba(174,159,196,0.3)] [transform-style:preserve-3d] z-50"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
              whileHover={{ scale: 1.05, x: -5, y: 2 }}
              style={{ transform: 'translateZ(90px) rotateY(8deg)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-[#ecdcff]/40 to-white/10 rounded-2xl pointer-events-none"></div>
              <div className="flex items-center gap-3 mb-2 relative z-10">
                <div className="w-8 h-8 rounded-full bg-[#ae9fc4]/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#413555] text-[14px]">sentiment_satisfied</span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-[#413555]">{t('landingShowcase.insight')}</span>
              </div>
              <p className="text-on-background font-black text-sm leading-tight relative z-10">{t('landingShowcase.sereneFocus')}</p>
              <div className="w-full h-1.5 bg-secondary-container mt-3 rounded-full overflow-hidden relative z-10">
                <div className="w-[85%] h-full bg-[#ae9fc4] rounded-full shadow-[0_0_8px_#ae9fc4]"></div>
              </div>
            </motion.div>

            <motion.div
              className="absolute -right-[10px] md:-right-[60px] bottom-[25%] w-[140px] md:w-[160px] glass-card p-3 md:p-4 rounded-2xl border border-white/50 shadow-[0_30px_60px_-15px_rgba(165,53,86,0.25)] [transform-style:preserve-3d] z-50"
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
              whileHover={{ scale: 1.05, x: 4 }}
              style={{ transform: 'translateZ(140px) rotateY(-10deg) rotateX(5deg)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[#ffd9df]/40 to-transparent rounded-2xl pointer-events-none"></div>
              <div className="flex justify-between items-center mb-1 relative z-10">
                <span className="material-symbols-outlined text-primary text-[20px] drop-shadow-[0_0_5px_rgba(165,53,86,0.5)]">bolt</span>
                <span className="text-primary font-black text-sm md:text-base">88%</span>
              </div>
              <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-primary block mt-1 relative z-10">{t('landingShowcase.energyWave')}</span>
              <p className="text-[10px] md:text-[11px] font-bold text-on-background mt-0.5 relative z-10">{t('landingShowcase.peakStamina')}</p>
            </motion.div>

            <motion.div
              className="absolute -left-[5px] md:-left-[60px] bottom-[15%] w-[130px] md:w-[140px] glass-card p-3 rounded-2xl border border-white/50 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] [transform-style:preserve-3d] z-50"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
              whileHover={{ scale: 1.05, x: -3 }}
              style={{ transform: 'translateZ(100px) rotateY(12deg)' }}
            >
              <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-secondary block mb-2">{t('landingShowcase.trackedInput')}</span>
              <div className="flex gap-2 relative z-10">
                <motion.div className="w-7 h-7 rounded-full bg-[#ffd9df] flex items-center justify-center border border-[#ffb1c1] shadow-[0_4px_10px_rgba(165,53,86,0.2)]" whileHover={{ scale: 1.15 }}>
                  <span className="material-symbols-outlined text-[14px] text-primary">healing</span>
                </motion.div>
                <motion.div className="w-7 h-7 rounded-full bg-[#ecdcff] flex items-center justify-center border border-[#d0c0e7] shadow-[0_4px_10px_rgba(174,159,196,0.2)]" whileHover={{ scale: 1.15 }}>
                  <span className="material-symbols-outlined text-[14px] text-[#413555]">water_drop</span>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </RevealOnScroll>

      {/* Right Column - Features */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerContainer}
      >
        <motion.h2 variants={staggerItem} className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 md:mb-10 tracking-tighter leading-none text-on-background">{t('features.title1')}</motion.h2>
        <motion.p variants={staggerItem} className="text-base sm:text-lg md:text-xl text-secondary mb-8 md:mb-12">{t('features.desc1')}</motion.p>
        <div className="space-y-8 md:space-y-10">
          {[
            { icon: 'calendar_month', title: t('features.calendarTitle'), desc: t('features.calendarDesc') },
            { icon: 'add_notes', title: t('features.loggingTitle'), desc: t('features.loggingDesc') },
            { icon: 'lock_person', title: t('features.vaultTitle'), desc: t('features.vaultDesc') },
          ].map((feature, i) => (
            <motion.div key={feature.title} variants={staggerItem} className="flex items-start gap-4 sm:gap-8">
              <motion.div
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-primary/10 flex items-center justify-center shrink-0"
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(165,53,86,0.15)' }}
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, type: 'spring', stiffness: 200 }}
              >
                <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl">{feature.icon}</span>
              </motion.div>
              <div>
                <h5 className="text-lg sm:text-2xl font-black mb-2 text-on-background">{feature.title}</h5>
                <p className="text-secondary text-sm sm:text-lg">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  </div>
</section>

{/* ═══════════════ SECTION 8: PERSONALIZED INTELLIGENCE ═══════════════ */}
<section id="listen-to-your-body" className="py-section-gap px-container-padding-mobile bg-[#fff5f7] overflow-hidden">
  <div className="max-w-7xl mx-auto text-center">
    <RevealOnScroll>
      <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full glass border border-primary/10 text-primary font-bold text-xs tracking-[0.2em] mb-6">
        <motion.span className="material-symbols-outlined text-[16px]" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>chat</motion.span>
        {t('wisdom.badge')}
      </div>
      <h2 className="text-3xl sm:text-4xl md:text-6xl font-black mb-8 md:mb-16 tracking-tighter text-on-background">{t('wisdom.title')}</h2>
    </RevealOnScroll>

    <motion.div
      className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 text-left"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.05 }}
      variants={staggerContainer}
    >
      {/* Card 1: Today's Wisdom */}
      <motion.div variants={staggerItem} className="glass p-6 sm:p-10 md:p-12 rounded-3xl sm:rounded-[2.5rem] md:col-span-2 flex flex-col justify-between shadow-xl border border-primary/5 cursor-pointer relative group" whileHover={{ y: -8, backgroundColor: 'rgba(255,255,255,0.7)', boxShadow: '0 30px 60px rgba(165,53,86,0.08)' }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
        <div>
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <p className="text-primary font-black uppercase tracking-widest text-[10px] sm:text-xs">{t('wisdom.wisdomTitle')}</p>
            <span className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-primary/10 text-primary font-bold text-[8px] sm:text-[9px] uppercase tracking-wider">{t('rhythms.lutealShort')} • Day 26</span>
          </div>
          <h4 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4 md:mb-6 text-on-background group-hover:text-primary transition-colors leading-tight">{t('wisdom.magnesiumTip')}</h4>
          <p className="text-secondary text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl">{t('wisdom.magnesiumTipDesc')}</p>
        </div>
        <div className="mt-6 md:mt-8 flex items-center gap-3 text-secondary/60 text-[10px] sm:text-xs font-bold uppercase">
          <span className="material-symbols-outlined text-primary text-[18px]">info</span>
          <span>{t('wisdom.magnesiumFooter')}</span>
        </div>
      </motion.div>

      {/* Cards 2-5 */}
      {[
        { badge: t('wisdom.forecastTitle'), phase: `${t('rhythms.follicularShort')} • Day 9`, phaseBg: 'bg-[#ffd8c7]/50 text-[#760e34]', title: t('wisdom.forecastText'), desc: t('wisdom.forecastDesc'), icon: 'bolt', footer: t('wisdom.forecastFooter') },
        { badge: t('wisdom.socialTitle'), phase: `${t('rhythms.ovulationShort')} • Day 14`, phaseBg: 'bg-[#ff7b9c]/20 text-primary', title: t('wisdom.socialText'), desc: t('wisdom.socialDesc'), icon: 'forum', footer: t('wisdom.socialFooter') },
        { badge: t('wisdom.recoveryTitle'), phase: `${t('rhythms.lutealShort')} • Day 20`, phaseBg: 'bg-[#ecdcff] text-[#413555]', title: t('wisdom.recoveryText'), desc: t('wisdom.recoveryDesc'), icon: 'healing', footer: t('wisdom.recoveryFooter') },
        { badge: t('wisdom.sleepPrepTitle'), phase: `${t('rhythms.menstrualShort')} • Day 2`, phaseBg: 'bg-secondary-container text-secondary', title: t('wisdom.sleepPrepText'), desc: t('wisdom.sleepPrepDesc'), icon: 'bedtime', footer: t('wisdom.sleepPrepFooter') },
      ].map((card) => (
        <motion.div key={card.badge} variants={staggerItem} className="glass p-6 sm:p-10 md:p-12 rounded-3xl sm:rounded-[2.5rem] flex flex-col justify-between shadow-xl border border-primary/5 cursor-pointer group" whileHover={{ y: -8, backgroundColor: 'rgba(255,255,255,0.7)', boxShadow: '0 30px 60px rgba(165,53,86,0.08)' }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
          <div>
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <p className="text-primary font-black uppercase tracking-widest text-[10px] sm:text-xs">{card.badge}</p>
              <span className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full ${card.phaseBg} font-bold text-[8px] sm:text-[9px] uppercase tracking-wider`}>{card.phase}</span>
            </div>
            <h4 className="text-xl sm:text-2xl font-black mb-4 text-on-background group-hover:text-primary transition-colors leading-snug">{card.title}</h4>
            <p className="text-secondary text-sm sm:text-base leading-relaxed">{card.desc}</p>
          </div>
          <div className="mt-6 md:mt-8 flex items-center gap-2 text-secondary/60 text-[10px] sm:text-xs font-bold uppercase">
            <span className="material-symbols-outlined text-primary text-[18px]">{card.icon}</span>
            <span>{card.footer}</span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  </div>
</section>

{/* ═══════════════ SECTION 9: SOCIAL PROOF ═══════════════ */}
<section className="py-section-gap bg-[#fcf9f8] overflow-hidden relative border-t border-b border-outline-variant/10">
  <div className="px-container-padding-mobile max-w-7xl mx-auto w-full text-center relative z-10">
    <RevealOnScroll className="mb-12">
      <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full glass border border-primary/10 text-primary font-bold text-xs tracking-[0.2em]">
        <motion.span className="material-symbols-outlined text-[16px]" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>shield_health</motion.span>
        {t('metrics.badge').toUpperCase()}
      </div>
    </RevealOnScroll>

    <motion.div
      className="flex flex-col md:flex-row justify-center items-stretch gap-6 md:gap-10 max-w-6xl mx-auto mb-20"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={staggerContainer}
    >
      {[
        { stat: '98%', title: t('metrics.widget1Title'), desc: t('metrics.widget1Desc'), visual: 'sparkline' },
        { stat: '100K+', title: t('metrics.widget2Title'), desc: t('metrics.widget2Desc'), visual: 'nodes' },
        { stat: '4.9/5', title: t('metrics.widget3Title'), desc: t('metrics.widget3Desc'), visual: 'stars' },
      ].map((widget) => (
        <motion.div
          key={widget.title}
          variants={staggerItem}
          className="glass-card flex-1 p-6 sm:p-10 rounded-3xl sm:rounded-[2.5rem] text-left relative overflow-hidden border border-primary/5 shadow-2xl"
          whileHover={{ y: -8, boxShadow: '0 30px 60px -15px rgba(165,53,86,0.12)' }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
          <span className="text-primary font-black text-6xl md:text-7xl block tracking-tighter mb-4">{widget.stat}</span>
          <h4 className="font-black text-xl text-on-background mb-3">{widget.title}</h4>
          <p className="text-secondary text-sm leading-relaxed mb-6">{widget.desc}</p>
          {widget.visual === 'sparkline' && (
            <svg className="w-full h-10 opacity-70" viewBox="0 0 200 40">
              <path d="M 0 35 L 40 30 L 80 20 L 120 15 L 160 5 L 200 2" fill="none" stroke="#a53556" strokeWidth="2.5" strokeLinecap="round"/>
              <path className="pulse-line" d="M 0 35 L 40 30 L 80 20 L 120 15 L 160 5 L 200 2" fill="none" stroke="#ff7b9c" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          )}
          {widget.visual === 'nodes' && (
            <div className="flex gap-2 items-center justify-start h-10 opacity-60">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              <div className="w-10 h-0.5 bg-primary/20"></div>
              <motion.span className="w-2.5 h-2.5 rounded-full bg-[#ae9fc4]" animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }} />
              <div className="w-14 h-0.5 bg-primary/20"></div>
              <span className="w-2 h-2 rounded-full bg-[#ff7b9c]"></span>
            </div>
          )}
          {widget.visual === 'stars' && (
            <div className="flex gap-1.5 text-[#ff7b9c] h-10 items-center">
              {[0, 1, 2, 3, 4].map(s => (
                <motion.span
                  key={s}
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: s * 0.1, type: 'spring', stiffness: 200 }}
                >
                  star
                </motion.span>
              ))}
            </div>
          )}
        </motion.div>
      ))}
    </motion.div>

    {/* Marquee */}
    <div className="flex flex-col gap-6 opacity-85">
      <div className="flex gap-6 animate-[marquee_50s_linear_infinite]">
        {[
          t('reviews.review1'),
          t('reviews.review2'),
          t('reviews.review3'),
          t('reviews.review4'),
          t('reviews.review5')
        ].map((review, i) => (
          <div key={i} className="glass px-8 py-4 rounded-full whitespace-nowrap font-black text-sm text-secondary">{review}</div>
        ))}
      </div>
    </div>
  </div>
</section>

{/* ═══════════════ SECTION 10: FINAL CTA ═══════════════ */}
<section className="relative min-h-[80vh] w-full flex flex-col items-center justify-center overflow-hidden py-16 sm:py-24 trust-section-bg">
  <div className="absolute inset-0 z-0 pointer-events-none">
    <motion.div className="absolute top-[20%] left-[10%] w-[15rem] sm:w-[30rem] h-[15rem] sm:h-[30rem] rounded-full bg-primary/5 sm:bg-primary/10 blur-[80px] sm:blur-[120px]" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
    <motion.div className="absolute bottom-[10%] right-[10%] w-[20rem] sm:w-[40rem] h-[20rem] sm:h-[40rem] rounded-full bg-[#ae9fc4]/5 sm:bg-[#ae9fc4]/10 blur-[90px] sm:blur-[140px]" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 3 }} />
  </div>

  <div className="relative z-10 text-center px-container-padding-mobile max-w-5xl mx-auto flex flex-col items-center py-10 sm:py-20">


    <RevealOnScroll>
      {(() => {
        const titleParts = t('trust.title').split(/[.।]/);
        const sep = i18n.language === 'hi' || i18n.language === 'bn' ? '।' : '.';
        return (
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-4 sm:mb-6 leading-[1.1] tracking-tighter">
            {titleParts[0]?.trim()}{sep}{' '}
            <motion.span className="text-gradient bg-gradient-to-r from-primary to-primary-container" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.8 }}>
              {titleParts[1]?.trim()}{sep}
            </motion.span>
          </h2>
        );
      })()}
    </RevealOnScroll>

    <RevealOnScroll custom={1}>
      <p className="font-body-lg text-sm sm:text-base md:text-lg text-white/70 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
        {t('trust.desc')}
      </p>
    </RevealOnScroll>

    <RevealOnScroll custom={2} className="w-full max-w-md mb-12 sm:mb-16">
      <motion.button
        onClick={() => navigate('/welcome')}
        className="relative overflow-hidden group w-full sm:w-auto bg-white hover:bg-transparent text-on-background hover:text-white px-8 py-4 sm:px-12 sm:py-5 rounded-full font-black text-lg sm:text-xl border-2 border-white transition-all duration-500 shadow-xl"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="relative z-10 transition-colors duration-500">{t('trust.buttonText')}</span>
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-container opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>
      </motion.button>
    </RevealOnScroll>

    {/* Trust Cards */}
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl w-full text-left"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={staggerContainer}
    >
      {[
        { icon: 'lock', title: t('trust.card1Title'), desc: t('trust.card1Desc') },
        { icon: 'biotech', title: t('trust.card2Title'), desc: t('trust.card2Desc') },
        { icon: 'shield_person', title: t('trust.card3Title'), desc: t('trust.card3Desc') },
        { icon: 'query_stats', title: t('trust.card4Title'), desc: t('trust.card4Desc') },
        { icon: 'spa', title: t('trust.card5Title'), desc: t('trust.card5Desc') },
        { icon: 'groups', title: t('trust.card6Title'), desc: t('trust.card6Desc') },
      ].map((card) => (
        <motion.div
          key={card.title}
          variants={staggerItem}
          className="dark-glass p-5 sm:p-6 rounded-2xl flex flex-col gap-2 shadow-lg"
          whileHover={{ y: -4, borderColor: 'rgba(255,93,143,0.25)' }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div className="flex items-center gap-2.5 text-primary">
            <span className="material-symbols-outlined text-lg">{card.icon}</span>
            <h4 className="text-white font-bold text-sm">{card.title}</h4>
          </div>
          <p className="text-white/60 text-[11px] leading-relaxed">{card.desc}</p>
        </motion.div>
      ))}
    </motion.div>

    <RevealOnScroll custom={4} className="mt-12">
      <p className="text-white/30 italic font-medium text-xs">
        {t('trust.footerQuote')}
      </p>
    </RevealOnScroll>
  </div>
</section>
</main>

{/* ═══════════════ FOOTER ═══════════════ */}
<footer className="premium-footer border-t border-outline-variant/15 pt-20 pb-12 relative z-10">
  
  {/* Cinematic Background Elements */}
  <div className="aurora-glow-footer top-0 left-1/4"></div>
  <div className="aurora-glow-footer bottom-0 right-1/4" style={{ animationDelay: '-12s' }}></div>

  {/* Biological wave lines */}
  <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
    <path className="biological-wave-line" d="M -100,150 C 200,50 300,250 600,150 C 900,50 1000,250 1300,150" fill="none" stroke="rgba(165,53,86,0.1)" strokeWidth="1.5" />
    <path className="biological-wave-line" d="M -50,250 C 250,150 350,350 650,250 C 950,150 1050,350 1350,250" fill="none" stroke="rgba(174,159,196,0.08)" strokeWidth="1.2" style={{ animationDelay: '-15s' }} />
    <path className="biological-wave-line" d="M 0,350 C 300,250 400,450 700,350 C 1000,250 1100,450 1400,350" fill="none" stroke="rgba(255,123,156,0.06)" strokeWidth="1" style={{ animationDelay: '-30s' }} />
  </svg>

  <div className="relative z-10 max-w-7xl mx-auto px-container-padding-mobile md:px-container-padding-desktop">
    
    {/* ─── LAYER 1: BRAND STATEMENT (Hero Element) ─── */}
    <div className="relative w-full flex flex-col items-center justify-center py-10 md:py-16 overflow-hidden select-none border-b border-outline-variant/10 mb-16">
      
      {/* Heartbeat waveform flowing through typography */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] mix-blend-screen">
        <svg className="w-full h-40 text-primary" viewBox="0 0 1000 100" preserveAspectRatio="none">
          <path
            className="heartbeat-path"
            d="M0 50 L250 50 L270 42 L290 58 L310 50 L350 50 L370 15 L390 85 L405 50 L425 50 L445 35 L465 65 L485 50 L1000 50"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Massive NariCare wordmark */}
      <motion.h1 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="text-[12vw] font-black tracking-[-0.05em] text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#ff7b9c] to-[#ae9fc4] drop-shadow-[0_4px_30px_rgba(165,53,86,0.12)] leading-none text-center relative z-10"
      >
        NariCare
      </motion.h1>

      <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] font-black text-secondary/60 mt-4 relative z-10">
        Women's health, understood beautifully.
      </p>
    </div>

    {/* Main Grid: Layers 2, 3, 4 */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16 mb-16">
      
      {/* ─── LAYER 2: BRAND STORY & NEWSLETTER ─── */}
      <div className="flex flex-col gap-10">
        {/* Brand details */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <span className="font-headline-md text-2xl text-primary font-black tracking-tighter select-none">
              NariCare
            </span>
          </div>
          <p className="text-secondary text-sm leading-relaxed max-w-sm">
            NariCare combines AI, biological science, and thoughtful design to help women understand their body's natural rhythms with confidence.
          </p>
          {/* Rounded Badges */}
          <div className="flex flex-wrap gap-2 pt-2">
            {['AI Powered', 'Privacy First', 'Made in India', 'Research Driven'].map(badge => (
              <span key={badge} className="footer-badge px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-wider cursor-default">
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="glass p-6 sm:p-8 rounded-[2rem] border border-outline-variant/10 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
          <h5 className="font-black text-primary uppercase tracking-widest text-xs mb-2">Stay in Rhythm.</h5>
          <p className="text-secondary text-xs leading-relaxed mb-6">
            Receive product updates, AI research insights, and women's health innovations.
          </p>
          
          {subscribed ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="flex flex-col items-center justify-center py-6 text-center text-primary font-bold"
            >
              <span className="material-symbols-outlined text-3xl mb-2 text-primary">check_circle</span>
              <p className="text-xs">You have joined the Sanctuary.</p>
            </motion.div>
          ) : (
            <form 
              onSubmit={(e) => { e.preventDefault(); if (email) setSubscribed(true); }} 
              className="flex flex-col gap-3 w-full"
            >
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="newsletter-input w-full px-5 py-3 rounded-full bg-white/50 border border-outline-variant/30 text-xs font-semibold focus:outline-none"
              />
              <motion.button
                type="submit"
                className="bg-primary text-on-primary w-full py-3.5 rounded-full font-bold text-xs shadow-md shadow-primary/10 tracking-wider hover:shadow-lg hover:shadow-primary/20 transition-all shrink-0"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Join Community
              </motion.button>
            </form>
          )}
        </div>
      </div>

      {/* ─── LAYER 3: QUICK LINKS ─── */}
      <div className="grid grid-cols-3 gap-4 sm:gap-6">
        <div>
          <h5 className="font-black text-primary uppercase tracking-widest text-[10px] sm:text-[11px] mb-6">Product</h5>
          <ul className="space-y-4 text-xs font-bold text-secondary">
            {[
              { label: 'Dashboard', href: '/welcome' },
              { label: 'Predictions', href: '#science' },
              { label: 'Calendar', href: '/welcome' },
              { label: 'Insights', href: '#insights' },
              { label: 'Health Logger', href: '/welcome' }
            ].map(item => (
              <li key={item.label}>
                <a className="premium-link hover:text-primary transition-colors py-0.5" href={item.href}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h5 className="font-black text-primary uppercase tracking-widest text-[10px] sm:text-[11px] mb-6">Resources</h5>
          <ul className="space-y-4 text-xs font-bold text-secondary">
            {[
              { label: 'Documentation', href: '#' },
              { label: 'Science', href: '#science' },
              { label: 'Privacy', href: '#' },
              { label: 'Security', href: '#' },
              { label: 'FAQ', href: '#' }
            ].map(item => (
              <li key={item.label}>
                <a className="premium-link hover:text-primary transition-colors py-0.5" href={item.href}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h5 className="font-black text-primary uppercase tracking-widest text-[10px] sm:text-[11px] mb-6">Company</h5>
          <ul className="space-y-4 text-xs font-bold text-secondary">
            {[
              { label: 'About', href: '#' },
              { label: 'Contact', href: '#' },
              { label: 'Roadmap', href: '#' },
              { label: 'Careers', href: '#' }
            ].map(item => (
              <li key={item.label}>
                <a className="premium-link hover:text-primary transition-colors py-0.5" href={item.href}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ─── LAYER 4: CREATOR SECTION & SOCIALS ─── */}
      <div className="flex flex-col gap-8 md:col-span-2 lg:col-span-1">
        
        {/* Creator Card */}
        <div className="founder-card p-6 rounded-[2rem] flex flex-col gap-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 block mb-1">
              Designed & Developed by
            </span>
            <h4 className="text-xl font-black text-on-background tracking-tight">Alok Yadav</h4>
            <p className="text-[11px] font-bold text-secondary/80 mt-1 leading-tight flex flex-wrap gap-x-1.5 gap-y-0.5">
              <span>UI/UX Designer</span>
              <span className="text-primary">•</span>
              <span>Frontend Developer</span>
              <span className="text-primary">•</span>
              <span>Product Designer</span>
            </p>
          </div>
          <p className="text-secondary text-xs leading-relaxed mt-2 border-t border-outline-variant/10 pt-3 italic">
            "Passionate about crafting meaningful digital experiences that combine thoughtful design with intelligent technology."
          </p>
        </div>

        {/* Social Cards */}
        <div className="flex flex-col gap-3">
          {[
            {
              name: 'LinkedIn',
              sub: 'Professional Profile',
              icon: 'link',
              url: 'https://www.linkedin.com/in/alokyadavdesigner/',
              hoverColor: 'hover:border-[#0077b5]/30 hover:text-[#0077b5]'
            },
            {
              name: 'GitHub',
              sub: 'Open Source Projects',
              icon: 'code',
              url: 'https://github.com/MVPAlok',
              hoverColor: 'hover:border-[#24292e]/30 hover:text-[#24292e]'
            },
            {
              name: 'Contra',
              sub: 'Design Portfolio',
              icon: 'palette',
              url: 'https://contra.com/alok_yadav_itseicge?r=alok_yadav_itseicge',
              hoverColor: 'hover:border-[#e95420]/30 hover:text-[#e95420]'
            }
          ].map(social => (
            <motion.a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`social-card p-3 rounded-2xl flex items-center justify-between ${social.hoverColor}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="social-icon-wrapper w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary transition-all">
                  <span className="material-symbols-outlined text-[18px]">{social.icon}</span>
                </div>
                <div className="min-w-0">
                  <h6 className="font-black text-xs text-on-background leading-tight">{social.name}</h6>
                  <p className="text-[9px] text-secondary font-semibold truncate mt-0.5">{social.sub}</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-secondary/30 text-base group-hover:text-primary transition-colors pr-2">arrow_forward</span>
            </motion.a>
          ))}
        </div>
      </div>

    </div>

    {/* Bottom Bar Section */}
    <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-outline-variant/15 gap-6 text-xs text-secondary/50 font-bold">
      <div className="order-3 sm:order-1 text-center sm:text-left">
        <p>© 2026 NariCare</p>
        <p className="text-[10px] text-secondary/40 font-semibold mt-0.5">Made with care in India.</p>
      </div>
      <div className="order-1 sm:order-2 text-center text-primary font-black tracking-wide">
        <a 
          href="https://www.linkedin.com/in/alokyadavdesigner/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:underline"
        >
          Designed & Developed by Alok Yadav
        </a>
      </div>
      <div className="order-2 sm:order-3 flex flex-wrap gap-x-6 gap-y-2 justify-center">
        {['Privacy', 'Terms', 'Security', 'Accessibility', 'Cookie Settings'].map(item => (
          <motion.a
            key={item}
            className="premium-link hover:text-primary transition-colors"
            href="#"
            whileHover={{ y: -1 }}
          >
            {item}
          </motion.a>
        ))}
      </div>
    </div>
  </div>
</footer>

</div>
    </>
  );
}
