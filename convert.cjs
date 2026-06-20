const fs = require('fs');

const html = fs.readFileSync('index.original.html', 'utf-8');

const bodyStart = html.indexOf('<body');
const bodyStartClose = html.indexOf('>', bodyStart) + 1;
const bodyEnd = html.lastIndexOf('</body>');

let jsx = html.substring(bodyStartClose, bodyEnd);

// Remove all scripts and inline styles
jsx = jsx.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
jsx = jsx.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

// Convert class to className
jsx = jsx.replace(/class=/g, 'className=');
jsx = jsx.replace(/rounded-t-\[3rem\] md:rounded-t-\[4rem\]/g, 'rounded-[3rem] md:rounded-[4rem] overflow-hidden mb-4 md:mb-8');
// Convert for to htmlFor
jsx = jsx.replace(/for=/g, 'htmlFor=');

// Self close tags
jsx = jsx.replace(/<br>/gi, '<br/>');
jsx = jsx.replace(/<hr>/gi, '<hr/>');
jsx = jsx.replace(/<img([^>]+?)(?<!\/)>/gi, '<img$1 />');
jsx = jsx.replace(/<input([^>]+?)(?<!\/)>/gi, '<input$1 />');

// SVG camelCase attributes
const svgAttrs = ['stroke-width', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap', 'stroke-opacity', 'fill-rule', 'clip-rule', 'preserveAspectRatio'];
svgAttrs.forEach(attr => {
  const camel = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  jsx = jsx.replace(new RegExp(attr + '=', 'gi'), camel + '=');
});

// Inline styles conversion
jsx = jsx.replace(/style="([^"]*)"/g, (match, p1) => {
  if (!p1.trim()) return `style={{}}`;
  const styles = p1.split(';').filter(s => s.trim()).map(s => {
    let [key, value] = s.split(':');
    if (!key || !value) return null;
    key = key.trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    value = value.trim();
    // Special fix for fontVariationSettings nested quotes
    if (key === 'fontVariationSettings') {
      return `${key}: "'FILL' 1"`;
    }
    return `${key}: '${value}'`;
  }).filter(Boolean);
  return `style={{ ${styles.join(', ')} }}`;
});

// Fix extra closing section tag (line 229 in JSX)
jsx = jsx.replace(/<\/section>\s*<\/section>\s*<!-- Section 3/g, '</section>\n<!-- Section 3');
jsx = jsx.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<\/section>\s*<!-- Section 4/g, '</div>\n</div>\n</section>\n<!-- Section 4');

// Replace HTML comments that would break JSX
jsx = jsx.replace(/<!--([\s\S]*?)-->/g, '{/* $1 */}');

// Remove dynamically added classes (like reveal active) from the HTML snapshot
jsx = jsx.replace(/className="reveal active/g, 'className="reveal');
jsx = jsx.replace(/className="([^"]*)reveal active/g, 'className="$1reveal');

const componentCode = `import React, { useEffect } from 'react';

export default function LandingPage() {
  
  useEffect(() => {
    // 1. WebGL Shader Animation
    const canvas = document.getElementById('shader-canvas-ANIMATION_11') as HTMLCanvasElement;
    if (canvas) {
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        let renderId: number;
        
        function syncSize() {
          const w = canvas.clientWidth  || window.innerWidth  || 1280;
          const h = canvas.clientHeight || window.innerHeight || 720;
          if (canvas.width !== w || canvas.height !== h) {
            canvas.width  = w;
            canvas.height = h;
          }
        }
        
        const resizeObserver = new ResizeObserver(syncSize);
        resizeObserver.observe(canvas);
        syncSize();

        const vs = \`attribute vec2 a_position;
        varying vec2 v_texCoord;
        void main() {
          v_texCoord = a_position * 0.5 + 0.5;
          gl_Position = vec4(a_position, 0.0, 1.0);
        }\`;
        const fs = \`precision highp float;

        varying vec2 v_texCoord;
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform vec2 u_mouse;

        // Simplex noise helpers
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
            
            // Create soft morphing liquid shape
            float noiseScale = 1.8;
            float timeScale = u_time * 0.15;
            float noise = snoise(uv * noiseScale + timeScale) * 0.12;
            noise += snoise(uv * noiseScale * 2.5 - timeScale * 1.2) * 0.05;
            
            float dist = distance(uv, center);
            
            // Add subtle mouse interaction to the orb's position/distortion
            float mouseDist = distance(uv, mouse);
            float mouseInfluence = smoothstep(0.4, 0.0, mouseDist) * 0.03;
            
            // Liquid mask for the central orb
            float orbRadius = 0.32 + noise + mouseInfluence;
            float mask = smoothstep(orbRadius, orbRadius - 0.15, dist);
            
            // Luxury Colors (Luna Brand Palette)
            vec3 rosePink = vec3(1.0, 0.36, 0.56);    // #FF5D8F
            vec3 lavender = vec3(0.86, 0.78, 1.0);    // #DCC8FF
            vec3 softPeach = vec3(1.0, 0.85, 0.78);   // #FFD8C7
            
            // Layered Aurora movement
            float aurora1 = snoise(uv * 1.2 + u_time * 0.1) * 0.5 + 0.5;
            float aurora2 = snoise(uv * 2.0 - u_time * 0.08) * 0.5 + 0.5;
            
            vec3 color = mix(rosePink, lavender, aurora1);
            color = mix(color, softPeach, aurora2 * 0.6);
            
            // Internal glow and depth
            float innerGlow = (1.0 - dist * 2.0) * 0.4;
            color += innerGlow * rosePink;
            
            // Final composite: Background aurora + central orb mask
            vec3 bgAurora = mix(vec3(1.0, 0.97, 0.97), color, 0.15); // Soft ivory pink base
            vec3 finalColor = mix(bgAurora, color, mask);
            
            // Add a bit of glass-like shimmer on the edges
            float shimmer = pow(1.0 - abs(dist - orbRadius), 8.0) * 0.15;
            finalColor += shimmer * lavender;
            
            gl_FragColor = vec4(finalColor, 1.0);
        }\`;
        
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
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
            const pos = gl.getAttribLocation(prog, 'a_position');
            gl.enableVertexAttribArray(pos);
            gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
            
            const uTime = gl.getUniformLocation(prog, 'u_time');
            const uRes = gl.getUniformLocation(prog, 'u_resolution');
            const uMouse = gl.getUniformLocation(prog, 'u_mouse');

            let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
            
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
      }
    }
  }, []);

  useEffect(() => {
    // Intersection Observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // Parallax
    const handleMouseMove = (e: MouseEvent) => {
        const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
        const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
        document.querySelectorAll('.animate-float').forEach((el: any) => {
            el.style.transform = \`translate(\${moveX}px, \${moveY}px)\`;
        });
    };
    document.addEventListener('mousemove', handleMouseMove);
    
    // Cycle Ring Interaction
    const phaseData: Record<string, any> = {
      menstrual: {
        num: "Phase 01 / 04",
        title: "Menstrual Phase",
        desc: "Introspection and renewal. Hormonal parameters are at their lowest baseline. Focus on gentle recovery and magnesium.",
        energy: "Energy: 40%"
      },
      follicular: {
        num: "Phase 02 / 04",
        title: "Follicular Phase",
        desc: "Rising estrogen drives high cognitive focus and social confidence. The \\"Spring\\" of your internal calendar.",
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

    function updatePhase(phaseKey: string | null) {
      if (!phaseKey) return;
      const data = phaseData[phaseKey];
      if (!data) return;
      
      const titleEl = document.getElementById('center-phase-title');
      const descEl = document.getElementById('center-phase-desc');
      const numEl = document.getElementById('center-phase-num');
      const energyEl = document.getElementById('center-phase-energy');
      const cardEl = document.getElementById('center-phase-card');

      if (titleEl && descEl && numEl && energyEl && cardEl) {
        cardEl.style.opacity = '0.7';
        cardEl.style.transform = 'scale(0.98)';
        
        setTimeout(() => {
          numEl.textContent = data.num;
          titleEl.textContent = data.title;
          descEl.textContent = data.desc;
          energyEl.textContent = data.energy;
          
          cardEl.style.opacity = '1';
          cardEl.style.transform = 'scale(1)';
        }, 150);
      }

      // Update active label highlights
      document.querySelectorAll('.phase-label').forEach(label => {
        if (label.getAttribute('data-phase') === phaseKey) {
          label.classList.add('border-primary/20', 'text-primary');
          label.classList.remove('text-secondary');
        } else {
          label.classList.remove('border-primary/20', 'text-primary');
          label.classList.add('text-secondary');
        }
      });
      
      // Update SVG ring segment thicknesses
      document.querySelectorAll('[id^="ring-"]').forEach(circle => {
        if (circle.getAttribute('data-phase') === phaseKey) {
          circle.setAttribute('stroke-width', '11.5');
        } else {
          circle.setAttribute('stroke-width', '8.5');
        }
      });
    }

    const handlePhaseAction = (e: Event) => {
      const phase = (e.currentTarget as HTMLElement).getAttribute('data-phase');
      updatePhase(phase);
    };

    document.querySelectorAll('.phase-label').forEach(label => {
      label.addEventListener('click', handlePhaseAction);
      label.addEventListener('mouseenter', handlePhaseAction);
    });

    document.querySelectorAll('[id^="ring-"]').forEach(circle => {
      circle.addEventListener('click', handlePhaseAction);
      circle.addEventListener('mouseenter', handlePhaseAction);
    });
    
    // Connection Lines SVG animation
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
      card.addEventListener('mouseenter', () => {
        card.style.animationPlayState = 'paused';
      });
      card.addEventListener('mouseleave', () => {
        card.style.animationPlayState = 'running';
      });
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

        const pathD = \`M \${cx} \${cy} L \${tx} \${ty}\`;
        if (energyPaths[index]) energyPaths[index].setAttribute('d', pathD);
        if (energyBgs[index]) energyBgs[index].setAttribute('d', pathD);

        const style = window.getComputedStyle(card);
        const transform = style.transform;
        let opacity = 0.55;
        if (transform && transform !== 'none') {
          const values = transform.split('(')[1].split(')')[0].split(',');
          const scaleX = parseFloat(values[0]);
          opacity = scaleX < 0.9 ? 0.12 : 0.65;
        }
        if (energyPaths[index]) energyPaths[index].setAttribute('stroke-opacity', opacity.toString());
      });

      connAnimId = requestAnimationFrame(animateConnections);
    }
    connAnimId = requestAnimationFrame(animateConnections);
    
    // Mobile Menu Toggle Logic
    const menuBtn = document.getElementById('mobile-menu-btn');
    const menuDropdown = document.getElementById('mobile-menu-dropdown');
    const menuIcon = document.getElementById('menu-icon');

    const toggleMenu = (e: Event) => {
      e.stopPropagation();
      if (!menuDropdown || !menuIcon) return;
      const isOpen = menuDropdown.classList.contains('opacity-100');
      if (isOpen) {
        menuDropdown.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
        menuDropdown.classList.add('opacity-0', '-translate-y-10', 'pointer-events-none');
        menuIcon.textContent = 'menu';
      } else {
        menuDropdown.classList.remove('opacity-0', '-translate-y-10', 'pointer-events-none');
        menuDropdown.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');
        menuIcon.textContent = 'close';
      }
    };
    
    const closeMenu = (e: Event) => {
      if (!menuDropdown || !menuIcon || !menuBtn) return;
      if (!menuDropdown.contains(e.target as Node) && !menuBtn.contains(e.target as Node)) {
        menuDropdown.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
        menuDropdown.classList.add('opacity-0', '-translate-y-10', 'pointer-events-none');
        menuIcon.textContent = 'menu';
      }
    };

    if (menuBtn) menuBtn.addEventListener('click', toggleMenu);
    document.addEventListener('click', closeMenu);
    
    if (menuDropdown) {
        menuDropdown.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                menuDropdown.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
                menuDropdown.classList.add('opacity-0', '-translate-y-10', 'pointer-events-none');
                if (menuIcon) menuIcon.textContent = 'menu';
            });
        });
    }

    // Navigation Scroll Glassmorphism
    const navContainer = document.getElementById('nav-container');
    const handleScroll = () => {
      if (!navContainer) return;
      if (window.scrollY > 20) {
        navContainer.classList.remove('bg-transparent', 'border-transparent');
        navContainer.classList.add('bg-white/80', 'backdrop-blur-2xl', 'shadow-[0_4px_40px_rgba(165,53,86,0.10)]', 'border-white/70');
      } else {
        navContainer.classList.add('bg-transparent', 'border-transparent');
        navContainer.classList.remove('bg-white/80', 'backdrop-blur-2xl', 'shadow-[0_4px_40px_rgba(165,53,86,0.10)]', 'border-white/70');
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Call once on mount

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', closeMenu);
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(connAnimId);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      ${jsx}
    </>
  );
}
`;

fs.writeFileSync('src/LandingPage.tsx', componentCode);
console.log("Converted successfully!");
