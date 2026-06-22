import { useEffect, useRef, useState } from 'react';
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

/* ─────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────── */

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activePhase, setActivePhase] = useState('follicular');

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
      num: "Phase 01 / 04",
      title: "Menstrual Phase",
      desc: "Introspection and renewal. Hormonal parameters are at their lowest baseline. Focus on gentle recovery and magnesium.",
      energy: "Energy: 40%"
    },
    follicular: {
      num: "Phase 02 / 04",
      title: "Follicular Phase",
      desc: "Rising estrogen drives high cognitive focus and social confidence. The \"Spring\" of your internal calendar.",
      energy: "Energy: 88%"
    },
    ovulation: {
      num: "Phase 03 / 04",
      title: "Ovulation Phase",
      desc: "Peak estrogen and testosterone triggers ovulation. Physical stamina, verbal fluency, and social confidence peak.",
      energy: "Energy: 98%"
    },
    luteal: {
      num: "Phase 04 / 04",
      title: "Luteal Phase",
      desc: "Progesterone builds up, directing energy inward. Ideal for detail-oriented work, nesting, and grounding routines.",
      energy: "Energy: 65%"
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

  /* Connection lines animation for prediction section */
  useEffect(() => {
    let connAnimId: number;
    const container = document.getElementById('prediction-core-container');
    const centerOrb = document.getElementById('prediction-center-orb');
    const cards = [
      document.getElementById('prediction-card-1'),
      document.getElementById('prediction-card-2'),
      document.getElementById('prediction-card-3'),
      document.getElementById('prediction-card-4')
    ];
    const energyPaths = [
      document.getElementById('energy-path-1'),
      document.getElementById('energy-path-2'),
      document.getElementById('energy-path-3'),
      document.getElementById('energy-path-4')
    ];
    const energyBgs = [
      document.getElementById('energy-bg-1'),
      document.getElementById('energy-bg-2'),
      document.getElementById('energy-bg-3'),
      document.getElementById('energy-bg-4')
    ];

    cards.forEach(card => {
      if (!card) return;
      card.addEventListener('mouseenter', () => { card.style.animationPlayState = 'paused'; });
      card.addEventListener('mouseleave', () => { card.style.animationPlayState = 'running'; });
    });

    function animateConnections() {
      if (!container || !centerOrb) {
        connAnimId = requestAnimationFrame(animateConnections);
        return;
      }
      const containerRect = container.getBoundingClientRect();
      if (containerRect.width === 0 || containerRect.height === 0) {
        connAnimId = requestAnimationFrame(animateConnections);
        return;
      }
      const centerRect = centerOrb.getBoundingClientRect();
      const cx = (centerRect.left + centerRect.width / 2) - containerRect.left;
      const cy = (centerRect.top + centerRect.height / 2) - containerRect.top;

      cards.forEach((card, index) => {
        if (!card) return;
        const cardRect = card.getBoundingClientRect();
        const tx = (cardRect.left + cardRect.width / 2) - containerRect.left;
        const ty = (cardRect.top + cardRect.height / 2) - containerRect.top;

        const pathD = `M ${cx} ${cy} L ${tx} ${ty}`;
        if (energyPaths[index]) energyPaths[index]!.setAttribute('d', pathD);
        if (energyBgs[index]) energyBgs[index]!.setAttribute('d', pathD);

        const style = window.getComputedStyle(card);
        const transform = style.transform;
        let opacity = 0.55;
        if (transform && transform !== 'none') {
          const values = transform.split('(')[1].split(')')[0].split(',');
          const scaleX = parseFloat(values[0]);
          opacity = scaleX < 0.9 ? 0.12 : 0.65;
        }
        if (energyPaths[index]) energyPaths[index]!.setAttribute('stroke-opacity', opacity.toString());
      });

      connAnimId = requestAnimationFrame(animateConnections);
    }
    connAnimId = requestAnimationFrame(animateConnections);

    return () => cancelAnimationFrame(connAnimId);
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
{/* ═══════════════ TOP NAVIGATION ═══════════════ */}
<motion.nav
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
      LunaCare
    </motion.div>

    <div className="hidden md:flex gap-8 items-center">
      {['Rhythms', 'Science', 'Insights', 'Experience'].map((item, i) => (
        <motion.a
          key={item}
          className={`${i === 0 ? 'text-primary font-bold' : 'text-secondary hover:text-primary font-semibold'} text-xs tracking-widest uppercase transition-colors duration-300`}
          href={`#${item.toLowerCase()}`}
          onClick={(e) => handleNavClick(e, item.toLowerCase())}
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {item}
        </motion.a>
      ))}
    </div>

    <div className="flex items-center gap-3">
      <motion.button
        className="hidden sm:block bg-primary text-on-primary px-4 md:px-6 py-2 md:py-2.5 rounded-full font-bold text-xs md:text-sm tracking-wide shadow-lg shadow-primary/30"
        whileHover={{ scale: 1.05, boxShadow: '0 8px 30px rgba(165,53,86,0.4)' }}
        whileTap={{ scale: 0.95 }}
      >
        Join Now
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
          {['Rhythms', 'Science', 'Insights', 'Experience'].map((item, i) => (
            <motion.a
              key={item}
              className={`${i === 0 ? 'text-primary' : 'text-secondary hover:text-primary'} font-bold text-base tracking-widest uppercase py-3 border-b border-primary/5 transition-colors`}
              href={`#${item.toLowerCase()}`}
              variants={menuItemVariants}
              custom={i}
              onClick={(e) => {
                setMenuOpen(false);
                handleNavClick(e, item.toLowerCase());
              }}
            >
              {item}
            </motion.a>
          ))}
        </div>
        <motion.button
          className="bg-primary text-on-primary w-full py-4 rounded-full font-bold text-sm tracking-wide shadow-lg shadow-primary/30"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setMenuOpen(false)}
        >
          Join the Sanctuary
        </motion.button>
      </motion.div>
    )}
  </AnimatePresence>
</motion.nav>

{/* ═══════════════ HERO SECTION ═══════════════ */}
<section className="fixed top-0 left-0 w-full h-screen flex items-center justify-center pt-24 overflow-hidden z-0">
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

  <div className="relative z-10 text-center max-w-5xl px-container-padding-mobile mx-auto mt-10">
    <motion.h1
      className="font-hero-display-mobile md:font-hero-display text-hero-display-mobile md:text-hero-display mb-6 tracking-tighter text-on-background drop-shadow-sm"
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
    >
      Your Body Has Patterns. <br className="hidden md:block" />
      <motion.span
        className="text-gradient"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.7 }}
      >
        Finally See Them.
      </motion.span>
    </motion.h1>

    <motion.p
      className="font-body-lg text-body-lg text-secondary max-w-2xl mx-auto mb-12 opacity-90"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.9 }}
    >
      Understand your cycle, mood, symptoms, and energy through <br className="hidden md:block" />beautifully visualized body intelligence.
    </motion.p>

    <motion.div
      className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 1.1 }}
    >
      <motion.button
        className="bg-primary text-on-primary px-6 py-3 md:px-10 md:py-5 rounded-full font-bold text-base md:text-lg border border-primary/50 w-full sm:w-auto"
        whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(165,53,86,0.5)' }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        Start Tracking
      </motion.button>
      <motion.button
        className="glass px-6 py-3 md:px-10 md:py-5 rounded-full font-bold text-base md:text-lg text-primary w-full sm:w-auto"
        whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.9)', boxShadow: '0 8px 30px rgba(0,0,0,0.05)' }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => handleNavClick(e, 'experience')}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        Explore Experience
      </motion.button>
    </motion.div>

    {/* Floating Glass Pills */}
    <motion.div
      className="flex flex-wrap justify-center gap-2 md:gap-4 px-2 md:px-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 1.3 }}
    >
      {[
        { icon: 'ssid_chart', label: 'Neural Mapping' },
        { icon: 'biotech', label: 'Hormonal Logic' },
        { icon: 'shield_person', label: 'Privacy First' },
      ].map((pill, i) => (
        <motion.div
          key={pill.label}
          className="glass px-4 md:px-6 py-2 md:py-3 rounded-full flex items-center gap-2 cursor-default"
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 6 + i * 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.6)' }}
        >
          <span className="material-symbols-outlined text-primary text-sm md:text-base">{pill.icon}</span>
          <span className="font-semibold text-secondary text-xs md:text-sm uppercase tracking-wider">{pill.label}</span>
        </motion.div>
      ))}
    </motion.div>
  </div>
</section>

{/* ═══════════════ CONTENT WRAPPER ═══════════════ */}
<div className="relative z-10 bg-[#fffdfd] mt-[100vh] rounded-t-[3rem] md:rounded-t-[4rem] shadow-[0_-40px_80px_rgba(165,53,86,0.08)] border-t border-white/50" style={{ isolation: 'isolate' }}>

{/* ═══════════════ SECTION 2: LIVING RHYTHM ═══════════════ */}
<section id="rhythms" className="py-section-gap relative min-h-screen flex flex-col items-center justify-center bg-[#fffdfd] overflow-hidden">
  <RevealOnScroll className="text-center max-w-3xl mx-auto mb-20 px-container-padding-mobile">
    <h2 className="text-6xl md:text-7xl font-black mb-6 tracking-tighter text-on-background">The Living Rhythm</h2>
    <p className="text-xl text-secondary">A cinematic representation of your hormonal journey, mapped across 28 days of evolution.</p>
  </RevealOnScroll>

  {/* Giant Interactive Cycle Ring */}
  <RevealOnScroll className="relative w-full max-w-4xl aspect-square flex items-center justify-center px-container-padding-mobile" variants={scaleIn}>
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
          <span className="text-primary font-black text-[10px] md:text-xs tracking-[0.3em] uppercase mb-2 md:mb-3">{phaseData[activePhase].num}</span>
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-on-background mb-2 md:mb-4">{phaseData[activePhase].title.split(' ')[0]}</h3>
          <p className="text-secondary text-xs sm:text-sm md:text-base leading-relaxed max-w-sm hidden sm:block">{phaseData[activePhase].desc}</p>
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
        {label.id.charAt(0).toUpperCase() + label.id.slice(1)}
      </motion.div>
    ))}
  </RevealOnScroll>
</section>

{/* ═══════════════ SECTION 3: INVISIBLE SHIFTS ═══════════════ */}
<section id="science" className="py-section-gap px-container-padding-mobile md:px-container-padding-desktop overflow-hidden bg-[#fffdfd]">
  <div className="grid lg:grid-cols-2 gap-32 items-center max-w-7xl mx-auto">
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={staggerContainer}
    >
      <motion.h2 variants={staggerItem} className="text-6xl font-black tracking-tighter mb-10 leading-none">Mapping The<br/>Invisible Shifts.</motion.h2>
      <motion.p variants={staggerItem} className="text-xl text-secondary leading-relaxed mb-12">Luna translates microscopic hormonal shifts into macro-level life insights. Every ripple in your cycle creates a wave in your experience.</motion.p>
      <motion.button variants={staggerItem} className="group flex items-center gap-4 font-black text-primary uppercase tracking-widest text-sm" whileHover={{ x: 5 }}>
        Learn the Science
        <motion.span className="material-symbols-outlined" whileHover={{ x: 8 }} transition={{ type: 'spring', stiffness: 300 }}>arrow_forward</motion.span>
      </motion.button>
    </motion.div>

    {/* Floating Panels */}
    <RevealOnScroll className="relative h-[400px] sm:h-[500px] md:h-[650px] flex items-center justify-center scale-[0.6] sm:scale-[0.8] md:scale-100 origin-center" variants={scaleIn}>
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
        { icon: 'healing', title: 'Recovery', desc: 'HRV & cell repair', pos: 'top-[8%] left-[2%]', delay: 0 },
        { icon: 'bedtime', title: 'Sleep', desc: 'Deep sleep quality', pos: 'top-[8%] right-[2%]', delay: 1.5 },
        { icon: 'spa', title: 'Stress', desc: 'Cortisol balancing', pos: 'top-[42%] left-[-8%]', delay: 3 },
        { icon: 'sentiment_satisfied', title: 'Mood', desc: 'Emotional resilience', pos: 'top-[42%] right-[-8%]', delay: 0.8 },
        { icon: 'psychology', title: 'Focus', desc: 'Estrogen-driven flow', pos: 'bottom-[8%] left-[2%]', delay: 2.2 },
        { icon: 'bolt', title: 'Energy', desc: 'Mitochondrial rate', pos: 'bottom-[8%] right-[2%]', delay: 1.1 },
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
<section id="neural-map" className="py-section-gap relative overflow-hidden bg-[#fff8fb]">
  <div className="px-container-padding-mobile md:px-container-padding-desktop max-w-full mx-auto">
    <RevealOnScroll className="text-center mb-16">
      <h2 className="text-6xl font-black tracking-tighter mb-6 text-on-background">The Neural Map</h2>
      <p className="text-xl text-secondary max-w-2xl mx-auto">Our AI core builds a private neural network of your specific symptoms and patterns.</p>
    </RevealOnScroll>

    <RevealOnScroll className="relative h-[300px] sm:h-[450px] md:h-[650px] w-full flex items-center justify-center overflow-hidden max-w-7xl mx-auto scale-[0.35] sm:scale-[0.6] md:scale-100 origin-center neural-map-scale" variants={scaleIn}>
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
        { label: 'Stress Sync', desc: 'Cortisol correlation', color: 'bg-primary animate-pulse', pos: 'top-[10%] left-[2%]' },
        { label: 'Cognitive Flow', desc: 'Estrogen peak efficiency', color: 'bg-[#ff7b9c]', pos: 'top-[2%] left-[28%]' },
        { label: 'Estrogen Wave', desc: 'Follicular baseline', color: 'bg-[#ae9fc4]', pos: 'top-[2%] right-[28%]' },
        { label: 'Mood Bias', desc: 'Luteal stage mapping', color: 'bg-primary animate-pulse', pos: 'top-[10%] right-[2%]' },
        { label: 'Cravings Shift', desc: 'Metabolic indicators', color: 'bg-[#ff7b9c]', pos: 'bottom-[10%] left-[2%]' },
        { label: 'HRV Correlation', desc: 'Autonomic stability', color: 'bg-[#ae9fc4]', pos: 'bottom-[2%] left-[28%]' },
        { label: 'Recovery Index', desc: 'Sleep stages link', color: 'bg-primary', pos: 'bottom-[2%] right-[28%]' },
        { label: 'Sleep stage', desc: 'Restorative efficiency', color: 'bg-primary animate-pulse', pos: 'bottom-[10%] right-[2%]' },
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

{/* ═══════════════ SECTION 5: PREDICTION ENGINE ═══════════════ */}
<section id="insights" className="py-section-gap bg-on-background text-on-primary min-h-screen flex items-center justify-center relative overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-primary/35 via-transparent to-tertiary/25 z-0"></div>
  <div className="absolute inset-0 sci-fi-grid opacity-25 pointer-events-none z-0"></div>
  <motion.div
    className="absolute top-[20%] left-[20%] w-96 h-96 rounded-full bg-primary/20 blur-[150px] z-0"
    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
  />
  <motion.div
    className="absolute bottom-[20%] right-[20%] w-[500px] h-[500px] rounded-full bg-tertiary/20 blur-[180px] z-0"
    animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.25, 0.2] }}
    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
  />

  <div className="px-container-padding-mobile max-w-7xl mx-auto w-full text-center relative z-10">
    <RevealOnScroll>
      <h2 className="text-7xl font-black mb-6 tracking-tighter text-white hero-glow-text">The Prediction Core</h2>
      <p className="text-white/60 text-lg max-w-xl mx-auto mb-16">A volumetric diagnostic engine projecting your future body states with cinematic precision.</p>
    </RevealOnScroll>

    {/* Orbiting Sphere Area */}
    <div id="prediction-core-container" className="relative h-[650px] w-full flex items-center justify-center overflow-hidden">
      {/* HUD Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 scale-[0.6] sm:scale-[0.8] md:scale-100">
        <svg className="absolute w-[680px] h-[680px] opacity-20 animate-spin-slow" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="95" fill="none" stroke="rgba(255, 93, 143, 0.4)" strokeWidth="0.5" strokeDasharray="10 30" />
          <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="0.75" strokeDasharray="2 6" />
        </svg>
        <svg className="absolute w-[600px] h-[600px] opacity-25 animate-spin-reverse" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="95" fill="none" stroke="rgba(220, 200, 255, 0.5)" strokeWidth="0.5" strokeDasharray="30 20 10 5" />
          <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(255, 93, 143, 0.2)" strokeWidth="1.2" />
        </svg>
        <svg className="absolute w-[520px] h-[520px] opacity-35 animate-spin-slow" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="95" fill="none" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1" strokeDasharray="8 8" />
          <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(220, 200, 255, 0.3)" strokeWidth="0.75" />
        </svg>
      </div>

      {/* 3D Orbit Rings */}
      <div className="absolute w-[440px] h-[440px] md:w-[580px] md:h-[580px] rounded-full border border-white/10 opacity-30 orbit-animation pointer-events-none z-0" style={{ transform: 'rotateX(70deg) rotateY(15deg)' }}></div>
      <div className="absolute w-[380px] h-[380px] md:w-[500px] md:h-[500px] rounded-full border border-white/20 border-dashed opacity-40 orbit-animation-reverse pointer-events-none z-0" style={{ transform: 'rotateX(70deg) rotateY(-15deg)' }}></div>
      <div className="absolute w-[320px] h-[320px] md:w-[420px] md:h-[420px] rounded-full border border-primary/25 opacity-50 orbit-animation pointer-events-none z-0" style={{ transform: 'rotateX(25deg) rotateY(70deg)' }}></div>

      {/* Energy SVG paths */}
      <svg id="energy-svg" className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ mixBlendMode: 'plus-lighter' }}>
        <defs>
          <linearGradient id="energy-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a53556" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#ff7b9c" stopOpacity="0.8"/>
          </linearGradient>
          <filter id="energy-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {[1, 2, 3, 4].map(n => (
          <g key={n}>
            <path id={`energy-bg-${n}`} stroke="rgba(255, 93, 143, 0.08)" strokeWidth="1.5" fill="none" />
            <path id={`energy-path-${n}`} className="energy-line" stroke="url(#energy-grad-1)" strokeWidth="2.5" fill="none" filter="url(#energy-glow)" />
          </g>
        ))}
      </svg>

      {/* Central Orb */}
      <div id="prediction-center-orb" className="relative z-20 flex items-center justify-center pointer-events-none select-none">
        <motion.div
          className="absolute w-80 h-80 md:w-[350px] md:h-[350px] rounded-full bg-gradient-to-tr from-primary via-primary-container to-tertiary-container blur-[15px] opacity-70"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full bg-gradient-to-tr from-primary via-primary-container to-[#ae9fc4] shadow-[0_0_150px_rgba(165,53,86,0.85)] flex items-center justify-center overflow-hidden border border-white/30">
          <motion.span
            className="material-symbols-outlined text-[100px] md:text-[130px] text-white/50"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            neurology
          </motion.span>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_95%,rgba(255,255,255,0.15)_95%)] bg-[length:100%_12px] opacity-40 pointer-events-none"></div>
        </div>
      </div>

      {/* Orbiting Cards */}
      {[
        { id: 1, delay: '0s', badge: 'Hormone Curve', text: '"Energy peaks in 3 days"', sub1: 'Estrogen cycle day 11', sub2: 'Confidence: 98%', dotColor: 'bg-primary animate-ping' },
        { id: 2, delay: '-8s', badge: 'Autonomic Trend', text: '"Cycle remains consistent"', sub1: '28.2 day avg variance', sub2: 'Optimal stability', dotColor: 'bg-[#ae9fc4] animate-pulse' },
        { id: 3, delay: '-16s', badge: 'Somnological Index', text: '"Sleep quality improving"', sub1: 'REM +22m over baseline', sub2: 'HRV recovery positive', dotColor: 'bg-[#ffd9df]' },
        { id: 4, delay: '-24s', badge: 'Critical Phase', text: '"Ovulation approaching"', sub1: 'Fertility peak in 48h', sub2: 'LH surge detected', dotColor: 'bg-primary animate-pulse' },
      ].map(card => (
        <div key={card.id} id={`prediction-card-${card.id}`} className="orbit-card-wrapper pointer-events-auto" style={{ animation: 'orbit-elliptical 32s linear infinite', animationDelay: card.delay }}>
          <motion.div
            className="glass border-white/15 p-6 rounded-3xl w-64 text-left shadow-2xl select-none"
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)' }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2 h-2 rounded-full ${card.dotColor}`}></span>
              <p className="text-white/50 font-black text-[10px] uppercase tracking-widest">{card.badge}</p>
            </div>
            <p className="text-white text-lg font-bold">{card.text}</p>
            <div className="mt-3 flex items-center justify-between text-[11px] text-white/40">
              <span>{card.sub1}</span>
              <span>{card.sub2}</span>
            </div>
          </motion.div>
        </div>
      ))}
    </div>
  </div>
</section>

{/* ═══════════════ SECTION 6: BODY INSIGHTS ═══════════════ */}
<section id="body-communicating" className="py-section-gap relative bg-gradient-to-b from-[#fcf9f8] to-[#fff5f7] overflow-hidden" style={{ isolation: 'isolate', backgroundColor: '#fcf9f8' }}>
  <RevealOnScroll className="px-container-padding-mobile text-center mb-16">
    <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full glass border border-primary/10 text-primary font-bold text-xs tracking-[0.2em] mb-6">
      <motion.span className="material-symbols-outlined text-[16px]" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>analytics</motion.span>
      BIOMETRIC CORRELATIONS
    </div>
    <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter text-on-background">Your Body Is Constantly Communicating.</h2>
    <p className="text-xl text-secondary max-w-2xl mx-auto">Luna decodes autonomic responses to map the exact relationship between chemical shifts and lifestyle inputs.</p>
  </RevealOnScroll>

  <motion.div
    className="grid md:grid-cols-2 gap-10 max-w-7xl mx-auto px-container-padding-mobile px-container-padding-desktop"
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.1 }}
    variants={staggerContainer}
  >
    {/* Card 1: Energy */}
    <motion.div variants={staggerItem} className="glass-card p-10 rounded-[2.5rem] flex flex-col justify-between cursor-pointer" whileHover={{ y: -8, boxShadow: '0 30px 60px -15px rgba(165,53,86,0.1)' }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
      <div>
        <div className="flex justify-between items-center mb-6">
          <span className="text-primary font-black text-xs tracking-widest uppercase">Energy Waveform</span>
          <span className="material-symbols-outlined text-primary text-2xl">bolt</span>
        </div>
        <h3 className="text-3xl font-black text-on-background mb-4">Hormonal Stamina</h3>
        <p className="text-secondary leading-relaxed mb-8">Fluctuations in estrogen dictate cellular metabolic rates. Identify your physical baseline to structure high-impact output during your follicular phase and lower intensities during luteal entry.</p>
      </div>
      <div className="glass p-6 rounded-2xl flex items-center justify-between gap-6 border border-primary/5">
        <div className="w-full">
          <div className="flex justify-between text-[11px] text-secondary font-bold uppercase mb-2">
            <span>Estrogen Curve</span>
            <span className="text-primary">Peak Day 14</span>
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
    <motion.div variants={staggerItem} className="glass-card p-10 rounded-[2.5rem] flex flex-col justify-between cursor-pointer" whileHover={{ y: -8, boxShadow: '0 30px 60px -15px rgba(165,53,86,0.1)' }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
      <div>
        <div className="flex justify-between items-center mb-6">
          <span className="text-primary font-black text-xs tracking-widest uppercase">Hormonal Temperature</span>
          <span className="material-symbols-outlined text-primary text-2xl">sentiment_satisfied</span>
        </div>
        <h3 className="text-3xl font-black text-on-background mb-4">Emotional Weather</h3>
        <p className="text-secondary leading-relaxed mb-8">Chemical changes subtly shape emotional resilience. Map these shifts to cycle phases to transform mood variability into intuitive self-knowledge.</p>
      </div>
      <div className="glass p-6 rounded-2xl flex flex-col gap-4 border border-primary/5">
        <div className="flex justify-between text-[11px] text-secondary font-bold uppercase">
          <span>Autonomic Seasons</span>
          <span className="text-primary">Current: Spring</span>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-black">
          <div className="p-2 rounded-xl bg-secondary-container/40 text-secondary">QUIET<br/><span className="text-[9px] font-normal">Menstrual</span></div>
          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">ALERT<br/><span className="text-[9px] font-normal">Follicular</span></div>
          <div className="p-2 rounded-xl bg-[#ffd8c7]/50 text-[#760e34]">SOCIAL<br/><span className="text-[9px] font-normal">Ovular</span></div>
          <div className="p-2 rounded-xl bg-[#ecdcff]/40 text-[#413555]">CALM<br/><span className="text-[9px] font-normal">Luteal</span></div>
        </div>
      </div>
    </motion.div>

    {/* Card 3: Sleep */}
    <motion.div variants={staggerItem} className="glass-card p-10 rounded-[2.5rem] flex flex-col justify-between cursor-pointer" whileHover={{ y: -8, boxShadow: '0 30px 60px -15px rgba(165,53,86,0.1)' }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
      <div>
        <div className="flex justify-between items-center mb-6">
          <span className="text-primary font-black text-xs tracking-widest uppercase">Restorative stage</span>
          <span className="material-symbols-outlined text-primary text-2xl">bedtime</span>
        </div>
        <h3 className="text-3xl font-black text-on-background mb-4">Sleep Architecture</h3>
        <p className="text-secondary leading-relaxed mb-8">Fluctuating core body temperature affects deep and REM recovery periods. By syncing sleep schedules to hormonal cycles, you can improve recovery efficiency.</p>
      </div>
      <div className="glass p-6 rounded-2xl flex flex-col gap-3 border border-primary/5">
        <div className="flex justify-between text-[11px] text-secondary font-bold uppercase">
          <span>Deep Sleep Quality</span>
          <span className="text-primary">7.8h RESTORED</span>
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
    <motion.div variants={staggerItem} className="glass-card p-10 rounded-[2.5rem] flex flex-col justify-between cursor-pointer" whileHover={{ y: -8, boxShadow: '0 30px 60px -15px rgba(165,53,86,0.1)' }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
      <div>
        <div className="flex justify-between items-center mb-6">
          <span className="text-primary font-black text-xs tracking-widest uppercase">Autonomic Correlations</span>
          <span className="material-symbols-outlined text-primary text-2xl">healing</span>
        </div>
        <h3 className="text-3xl font-black text-on-background mb-4">Symptom Logic</h3>
        <p className="text-secondary leading-relaxed mb-8">Identify triggers causing physical discomfort. Luna maps how factors like caffeine intake, hydration, and stress levels affect cramps, bloating, and fatigue.</p>
      </div>
      <div className="glass p-6 rounded-2xl border border-primary/5">
        <div className="flex flex-col gap-3 text-xs">
          <div className="flex justify-between items-center border-b border-outline-variant/10 pb-2">
            <span className="font-bold text-secondary">Caffeine + Luteal Stage</span>
            <span className="text-primary font-black">+32% Cramping Risk</span>
          </div>
          <div className="flex justify-between items-center border-b border-outline-variant/10 pb-2">
            <span className="font-bold text-secondary">Hydration Baseline</span>
            <span className="text-green-700 font-black">-15% Bloating Index</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-secondary">Magnesium Syncing</span>
            <span className="text-green-700 font-black">-40% Cramp Duration</span>
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
      <RevealOnScroll className="relative h-[600px] md:h-[800px] w-full flex items-center justify-center [perspective:2000px] group/presentation" variants={scaleIn}>
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
        <div className="relative w-full max-w-[600px] h-full flex items-center justify-center [transform-style:preserve-3d] group-hover/presentation:rotate-y-[5deg] group-hover/presentation:rotate-x-[2deg] transition-transform duration-[2s] ease-out scale-[0.6] sm:scale-[0.7] md:scale-[0.8] lg:scale-[0.75] xl:scale-[0.85]">
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
                  <span>LunaCare</span>
                  <span className="material-symbols-outlined text-[10px] text-primary">wifi</span>
                </div>
                <div className="flex-grow flex flex-col items-center justify-center text-center mt-4">
                  <span className="text-primary font-black text-[8px] tracking-widest uppercase mb-1">Luteal Phase</span>
                  <h4 className="text-xl font-black text-on-background mb-3">Day 22</h4>
                  <div className="relative w-24 h-24 flex items-center justify-center mb-4">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="16" fill="none" stroke="#f3ded9" strokeWidth="2.5"></circle>
                      <circle cx="18" cy="18" r="16" fill="none" stroke="#a53556" strokeWidth="2.5" strokeDasharray="100" strokeDashoffset="30" strokeLinecap="round"></circle>
                    </svg>
                    <div className="absolute text-center">
                      <span className="font-black text-[10px] text-primary">4 Days</span>
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
                  <span>Logging</span>
                  <span className="text-secondary/60">Active</span>
                </div>
                <div className="flex-grow flex flex-col text-left mt-6">
                  <h4 className="text-base font-black text-on-background mb-4">Log Biometrics</h4>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-secondary/10 text-[8px] font-bold">
                      <span className="text-secondary flex items-center gap-1.5"><span className="material-symbols-outlined text-primary text-[10px]">bolt</span>Energy</span>
                      <span className="bg-[#ffd9df] text-primary px-1.5 py-0.5 rounded-full">HIGH</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-secondary/10 text-[8px] font-bold">
                      <span className="text-secondary flex items-center gap-1.5"><span className="material-symbols-outlined text-primary text-[10px]">healing</span>Cramps</span>
                      <span className="bg-secondary-container text-secondary px-1.5 py-0.5 rounded-full">NONE</span>
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
                  <p className="text-[10px] text-secondary font-bold uppercase tracking-wider mb-1">Good Morning,</p>
                  <h4 className="text-2xl font-black text-on-background mb-5">Clara</h4>
                  <div className="glass bg-white/80 p-4 rounded-2xl mb-4 border border-primary/10 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-xl"></div>
                    <span className="text-primary font-black text-[9px] uppercase tracking-wider mb-2 block">DAILY SANCTUARY</span>
                    <p className="text-[11px] text-on-background font-bold leading-relaxed">"Your estrogen is leveling. Expect high cognitive focus and calm energy today."</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-secondary/5 flex flex-col gap-3 shadow-sm">
                    <div className="flex justify-between text-[9px] font-bold text-secondary">
                      <span>Focus State</span>
                      <span className="text-primary">Optimized (92%)</span>
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
                <span className="text-[9px] font-black uppercase tracking-widest text-primary">Prediction</span>
              </div>
              <p className="text-on-background font-black text-sm md:text-base leading-tight relative z-10">Ovulation in 48h</p>
              <p className="text-[10px] text-secondary mt-1 font-semibold relative z-10">Confidence: 98.4%</p>
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
                <span className="text-[9px] font-black uppercase tracking-widest text-[#413555]">Insight</span>
              </div>
              <p className="text-on-background font-black text-sm leading-tight relative z-10">Serene focus state</p>
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
              <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-primary block mt-1 relative z-10">Energy Wave</span>
              <p className="text-[10px] md:text-[11px] font-bold text-on-background mt-0.5 relative z-10">Peak stamina</p>
            </motion.div>

            <motion.div
              className="absolute -left-[5px] md:-left-[60px] bottom-[15%] w-[130px] md:w-[140px] glass-card p-3 rounded-2xl border border-white/50 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] [transform-style:preserve-3d] z-50"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
              whileHover={{ scale: 1.05, x: -3 }}
              style={{ transform: 'translateZ(100px) rotateY(12deg)' }}
            >
              <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-secondary block mb-2">Tracked Input</span>
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
        <motion.h2 variants={staggerItem} className="text-6xl font-black mb-10 tracking-tighter leading-none text-on-background">High-Fidelity<br/>Health.</motion.h2>
        <motion.p variants={staggerItem} className="text-xl text-secondary mb-12">The Luna interface is engineered for zero friction. Every tap is a step toward total self-mastery.</motion.p>
        <div className="space-y-10">
          {[
            { icon: 'calendar_month', title: 'Predictive Calendar', desc: 'Visual forecasting with 98% prediction accuracy.' },
            { icon: 'add_notes', title: 'Fluid Logging', desc: 'Swipe-to-log symptoms in less than 3 seconds.' },
            { icon: 'lock_person', title: 'Encrypted Vault', desc: 'Your data is yours. End-to-end medical encryption.' },
          ].map((feature, i) => (
            <motion.div key={feature.title} variants={staggerItem} className="flex items-start gap-8">
              <motion.div
                className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center shrink-0"
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(165,53,86,0.15)' }}
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, type: 'spring', stiffness: 200 }}
              >
                <span className="material-symbols-outlined text-primary text-3xl">{feature.icon}</span>
              </motion.div>
              <div>
                <h5 className="text-2xl font-black mb-2 text-on-background">{feature.title}</h5>
                <p className="text-secondary text-lg">{feature.desc}</p>
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
        CURATED INTEL FEED
      </div>
      <h2 className="text-4xl md:text-6xl font-black mb-16 tracking-tighter text-on-background">Listen To Your Body.</h2>
    </RevealOnScroll>

    <motion.div
      className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 text-left"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.05 }}
      variants={staggerContainer}
    >
      {/* Card 1: Today's Wisdom */}
      <motion.div variants={staggerItem} className="glass p-12 rounded-[2.5rem] md:col-span-2 flex flex-col justify-between shadow-xl border border-primary/5 cursor-pointer relative group" whileHover={{ y: -8, backgroundColor: 'rgba(255,255,255,0.7)', boxShadow: '0 30px 60px rgba(165,53,86,0.08)' }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
        <div>
          <div className="flex justify-between items-center mb-8">
            <p className="text-primary font-black uppercase tracking-widest text-xs">Today's Wisdom</p>
            <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-[9px] uppercase tracking-wider">Luteal • Day 26</span>
          </div>
          <h4 className="text-4xl font-black mb-6 text-on-background group-hover:text-primary transition-colors leading-tight">"Your body is asking for more magnesium today."</h4>
          <p className="text-secondary text-lg leading-relaxed max-w-2xl">Autonomic markers indicate light uterine strain as progesterone transitions. Synced hydration and taking magnesium targets smooth recovery during late luteal entry.</p>
        </div>
        <div className="mt-8 flex items-center gap-3 text-secondary/60 text-xs font-bold uppercase">
          <span className="material-symbols-outlined text-primary text-[18px]">info</span>
          <span>Based on sleep architecture and recovery index variance</span>
        </div>
      </motion.div>

      {/* Cards 2-5 */}
      {[
        { badge: 'Energy Forecast', phase: 'Follicular • Day 9', phaseBg: 'bg-[#ffd8c7]/50 text-[#760e34]', title: '"Optimized for deep work between 10am-2pm."', desc: 'Cognitive focus is peaking as estrogen levels rise. Save complex logic problems or critical writing for this peak performance window.', icon: 'bolt', footer: 'Cognitive flow peak detected' },
        { badge: 'Social Pulse', phase: 'Ovulation • Day 14', phaseBg: 'bg-[#ff7b9c]/20 text-primary', title: '"High social resilience detected for tonight."', desc: 'Estrogen and testosterone surges peak. You are entering your most expressive phase—ideal for collaboration.', icon: 'forum', footer: 'Communication scores optimized' },
        { badge: 'Recovery Focus', phase: 'Luteal • Day 20', phaseBg: 'bg-[#ecdcff] text-[#413555]', title: '"Prioritize low-impact aerobic recovery."', desc: 'HRV variance trends slightly lower as baseline body temperature rises. Focus on gentle recovery.', icon: 'healing', footer: 'Heart rate variability warning' },
        { badge: 'Sleep Preparation', phase: 'Menstrual • Day 2', phaseBg: 'bg-secondary-container text-secondary', title: '"Deep sleep cycles projected to extend by 15m."', desc: 'Lower progesterone ranges prompt deeper recovery stages. Sleep early to capture this natural optimization wave.', icon: 'bedtime', footer: 'Volumetric REM recovery forecast' },
      ].map((card) => (
        <motion.div key={card.badge} variants={staggerItem} className="glass p-12 rounded-[2.5rem] flex flex-col justify-between shadow-xl border border-primary/5 cursor-pointer group" whileHover={{ y: -8, backgroundColor: 'rgba(255,255,255,0.7)', boxShadow: '0 30px 60px rgba(165,53,86,0.08)' }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
          <div>
            <div className="flex justify-between items-center mb-8">
              <p className="text-primary font-black uppercase tracking-widest text-xs">{card.badge}</p>
              <span className={`px-4 py-1.5 rounded-full ${card.phaseBg} font-bold text-[9px] uppercase tracking-wider`}>{card.phase}</span>
            </div>
            <h4 className="text-3xl font-black mb-6 text-on-background group-hover:text-primary transition-colors leading-snug">{card.title}</h4>
            <p className="text-secondary leading-relaxed">{card.desc}</p>
          </div>
          <div className="mt-8 flex items-center gap-2 text-secondary/60 text-xs font-bold uppercase">
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
        GLOBAL METRICS
      </div>
    </RevealOnScroll>

    <motion.div
      className="flex flex-col md:flex-row justify-center items-stretch gap-10 max-w-6xl mx-auto mb-20"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={staggerContainer}
    >
      {[
        { stat: '98%', title: 'Prediction Accuracy', desc: 'Luna decodes endocrine patterns, consistently reducing forecasting error below standard thresholds.', visual: 'sparkline' },
        { stat: '100K+', title: 'Cycles Mapped', desc: 'Our system processes biometric entries globally, building the most extensive anonymous database of female health.', visual: 'nodes' },
        { stat: '4.9/5', title: 'App Store Rating', desc: 'Consistently ranked as a premium experience, combining interface luxury with medical efficacy.', visual: 'stars' },
      ].map((widget) => (
        <motion.div
          key={widget.title}
          variants={staggerItem}
          className="glass-card flex-1 p-10 rounded-[2.5rem] text-left relative overflow-hidden border border-primary/5 shadow-2xl"
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
        {['"The most beautiful health app I\'ve ever used."', '"Finally understand my energy dips."', '"Radical body literacy in my pocket."', '"No more guessing games."', '"A visual masterpiece and science tool."'].map((review, i) => (
          <div key={i} className="glass px-8 py-4 rounded-full whitespace-nowrap font-black text-sm text-secondary">{review}</div>
        ))}
      </div>
    </div>
  </div>
</section>

{/* ═══════════════ SECTION 10: FINAL CTA ═══════════════ */}
<section className="relative min-h-[80vh] w-full flex flex-col items-center justify-center overflow-hidden bg-[#1b1c1c] py-24">
  <div className="absolute inset-0 z-0">
    <div className="absolute inset-0 bg-gradient-to-br from-[#1b1c1c] via-[#2a1b24] to-[#1b1c1c]"></div>
    <motion.div className="absolute top-[20%] left-[10%] w-[30rem] h-[30rem] rounded-full bg-primary/10 blur-[120px] pointer-events-none" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
    <motion.div className="absolute bottom-[10%] right-[10%] w-[40rem] h-[40rem] rounded-full bg-[#ae9fc4]/10 blur-[140px] pointer-events-none" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 3 }} />
  </div>

  <div className="relative z-10 text-center px-container-padding-mobile max-w-5xl mx-auto flex flex-col items-center py-20">
    <RevealOnScroll>
      <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full glass border border-white/15 text-white font-bold text-xs tracking-[0.2em] mb-8 uppercase select-none">
        <motion.span className="material-symbols-outlined text-[16px] text-[#ff7b9c]" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }}>favorite</motion.span>
        ALIGNED WITH NATURE • DRIVEN BY SCIENCE
      </div>
    </RevealOnScroll>

    <RevealOnScroll>
      <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tighter">
        Your Rhythm. <motion.span className="text-gradient bg-gradient-to-r from-primary to-primary-container" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.8 }}>Your Superpower.</motion.span>
      </h2>
    </RevealOnScroll>

    <RevealOnScroll custom={1}>
      <p className="font-body-lg text-base md:text-lg text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
        Luna translates the micro-fluctuations of your cycle into daily personal wisdom.
        Begin a new, harmonious relationship with your biology today.
      </p>
    </RevealOnScroll>

    <RevealOnScroll custom={2} className="w-full max-w-md mb-16">
      <motion.button
        className="relative overflow-hidden group w-full sm:w-auto bg-white hover:bg-transparent text-on-background hover:text-white px-12 py-5 rounded-full font-black text-xl border-2 border-white transition-all duration-500 shadow-xl"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="relative z-10 transition-colors duration-500">Enter the Sanctuary</span>
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-container opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>
      </motion.button>
    </RevealOnScroll>

    {/* Trust Cards */}
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full text-left"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={staggerContainer}
    >
      {[
        { icon: 'lock', title: 'Medical-Grade Security', desc: 'Zero-knowledge local encryption. Your health data remains strictly on your device.' },
        { icon: 'biotech', title: 'Endocrine-Validated', desc: 'Built and verified in collaboration with leading gynecologists and researchers.' },
        { icon: 'shield_person', title: '100% Private & Ad-Free', desc: 'No data brokers, no advertisers, no compromises. We protect your privacy always.' },
        { icon: 'query_stats', title: '98% Prediction Accuracy', desc: 'Luna learns your personal cycle variability to project symptoms and energy levels.' },
        { icon: 'spa', title: 'Adaptive Bio-Insights', desc: 'Receive customized nutrition, sleep, and exercise advice synchronized to your cycle.' },
        { icon: 'groups', title: 'Global Sanctuary', desc: 'Join a growing collective of 1M+ members aligning their schedules to biology.' },
      ].map((card) => (
        <motion.div
          key={card.title}
          variants={staggerItem}
          className="dark-glass p-6 rounded-2xl flex flex-col gap-2 shadow-lg"
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
        "You are not a static machine. You are a living rhythm. It's time to align."
      </p>
    </RevealOnScroll>
  </div>
</section>

{/* ═══════════════ FOOTER ═══════════════ */}
<RevealOnScroll>
  <footer className="bg-[#fffdfd] border-t border-outline-variant/30 py-24">
    <div className="px-container-padding-mobile md:px-container-padding-desktop max-w-7xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-16 mb-24">
        <div className="col-span-2">
          <div className="font-headline-md text-3xl text-primary font-black tracking-tighter mb-8">LunaCare</div>
          <p className="text-secondary text-xl max-w-sm mb-10">Transforming how the world views women's health through cinematic intelligence and radical empathy.</p>
          <div className="flex gap-6">
            {['language', 'favorite'].map(icon => (
              <motion.div key={icon} className="w-12 h-12 rounded-full glass border border-primary/20 flex items-center justify-center cursor-pointer" whileHover={{ scale: 1.1, backgroundColor: 'rgba(165,53,86,0.1)' }}>
                <span className="material-symbols-outlined text-primary">{icon}</span>
              </motion.div>
            ))}
          </div>
        </div>
        <div>
          <h5 className="font-black text-primary uppercase tracking-widest text-xs mb-8">Product</h5>
          <ul className="space-y-4 font-bold text-secondary">
            {['Rhythms', 'Science', 'Predictions', 'Security'].map(item => (
              <li key={item}><motion.a className="hover:text-primary transition-colors" href="#" whileHover={{ x: 4 }}>{item}</motion.a></li>
            ))}
          </ul>
        </div>
        <div>
          <h5 className="font-black text-primary uppercase tracking-widest text-xs mb-8">Sanctuary</h5>
          <ul className="space-y-4 font-bold text-secondary">
            {['Journal', 'Community', 'Research', 'Careers'].map(item => (
              <li key={item}><motion.a className="hover:text-primary transition-colors" href="#" whileHover={{ x: 4 }}>{item}</motion.a></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-outline-variant/20 gap-8">
        <p className="text-secondary/50 font-bold">© 2024 LunaCare. All rights reserved.</p>
        <div className="flex gap-10 font-bold text-secondary/50 text-sm">
          {['Privacy Policy', 'Terms of Service', 'Security'].map(item => (
            <motion.a key={item} className="hover:text-primary transition-colors" href="#" whileHover={{ y: -2 }}>{item}</motion.a>
          ))}
        </div>
      </div>
    </div>
  </footer>
</RevealOnScroll>

</div>
    </>
  );
}
