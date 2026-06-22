import React, { useEffect, useRef } from 'react';

interface BackgroundShaderProps {
  canvasId?: string;
  opacity?: number;
}

export const BackgroundShader: React.FC<BackgroundShaderProps> = ({
  canvasId = 'shader-canvas-shared',
  opacity = 1.0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rawGl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!rawGl) return;
    const gl = rawGl as WebGLRenderingContext;
    let renderId: number;

    function syncSize() {
      if (!canvas) return;
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

    function compileShader(type: number, src: string): WebGLShader | null {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    }

    const prog = gl.createProgram();
    if (!prog) return;

    const vsShader = compileShader(gl.VERTEX_SHADER, vs);
    const fsShader = compileShader(gl.FRAGMENT_SHADER, fs);

    if (vsShader && fsShader) {
      gl.attachShader(prog, vsShader);
      gl.attachShader(prog, fsShader);
      gl.linkProgram(prog);

      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(prog));
        return;
      }

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
        if (!canvas) return;
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
  }, [canvasId]);

  return (
    <div
      className="absolute inset-0 pointer-events-none w-full h-full z-0 overflow-hidden"
      style={{ opacity }}
    >
      <canvas
        ref={canvasRef}
        id={canvasId}
        className="w-full h-full block absolute inset-0"
      />
    </div>
  );
};
