/* Duotech Goiânia — interações e animações
   GSAP 3.12.5 + ScrollTrigger (cdnjs). Sem GSAP o site continua 100% legível. */
(() => {
  const WA = "https://wa.me/5562982375064";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;

  /* ---------- WhatsApp: mensagem contextual por botão ---------- */
  $$("[data-wa]").forEach(a => {
    a.href = `${WA}?text=${encodeURIComponent(a.dataset.wa)}`;
  });

  const ano = $("#ano");
  if (ano) ano.textContent = new Date().getFullYear();

  /* ---------- Menu mobile ---------- */
  const toggle = $(".nav__toggle");
  const menu = $("#menu");
  const setMenu = open => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    menu.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    if (open) menu.querySelector("a").focus({ preventScroll: true });
  };
  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  menu.addEventListener("click", e => { if (e.target.closest("a") && menu.classList.contains("is-open")) setMenu(false); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && menu.classList.contains("is-open")) { setMenu(false); toggle.focus(); } });
  matchMedia("(min-width:901px)").addEventListener("change", () => setMenu(false));

  /* ---------- Áudio de boas-vindas + vídeo da bancada ---------- */
  const store = {
    get: (k, ss) => { try { return (ss ? sessionStorage : localStorage).getItem(k); } catch (e) { return null; } },
    set: (k, v, ss) => { try { (ss ? sessionStorage : localStorage).setItem(k, v); } catch (e) {} }
  };
  const audio = $("#welcome");
  const soundBtn = $(".sound");
  const soundLabel = $(".sound__label");
  const video = $(".svc__video");
  const vBtn = $(".svc__sound");

  const setSoundUI = playing => {
    soundBtn.classList.toggle("is-playing", playing);
    soundBtn.setAttribute("aria-pressed", String(playing));
    soundLabel.textContent = playing ? "Pausar boas-vindas" : "Ouvir boas-vindas";
  };
  const muteVideo = () => {
    if (!video || video.muted) return;
    video.muted = true; vBtn.setAttribute("aria-pressed", "false"); vBtn.querySelector("span").textContent = "Ativar som";
  };
  audio.addEventListener("play", () => { setSoundUI(true); muteVideo(); });
  ["pause", "ended"].forEach(ev => audio.addEventListener(ev, () => setSoundUI(false)));

  const playWelcome = () => {
    audio.currentTime = 0;
    return audio.play().then(() => store.set("dt-welcome", "1", true));
  };
  soundBtn.addEventListener("click", () => {
    if (!audio.paused) { audio.pause(); store.set("dt-muted", "1"); }
    else { store.set("dt-muted", "0"); playWelcome().catch(() => {}); }
  });

  // Toca a mensagem "Seja bem-vindo ao site da Duotech" uma vez por visita.
  // Navegadores só liberam som após uma interação; então tentamos já e, se bloqueado,
  // tocamos no primeiro toque/clique/tecla do visitante (exceto se ele já silenciou).
  let welcomeArmed = false;
  const armWelcome = () => {
    if (welcomeArmed || store.get("dt-muted") === "1" || store.get("dt-welcome", true) === "1") return;
    welcomeArmed = true;
    playWelcome().catch(() => {
      const evs = ["click", "touchend", "keydown"];
      const once = e => {
        evs.forEach(n => document.removeEventListener(n, once, true));
        if (e.target.closest && e.target.closest(".sound, .svc__sound")) return;
        if (audio.paused && store.get("dt-muted") !== "1") playWelcome().catch(() => {});
      };
      evs.forEach(n => document.addEventListener(n, once, true));
    });
  };

  if (video) {
    vBtn.addEventListener("click", () => {
      const on = video.muted;
      video.muted = !on;
      if (on) { audio.pause(); video.currentTime = 0; video.play().catch(() => {}); }
      vBtn.setAttribute("aria-pressed", String(on));
      vBtn.querySelector("span").textContent = on ? "Desativar som" : "Ativar som";
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { if (video.preload === "none") video.preload = "auto"; video.play().catch(() => {}); }
        else { video.pause(); muteVideo(); }
      }, { threshold: .25 }).observe(video);
    }
  }

  /* ---------- Sem GSAP: mostra tudo e encerra ---------- */
  if (!window.gsap || !window.ScrollTrigger) { root.classList.remove("js"); root.classList.add("no-gsap"); armWelcome(); return; }
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Fábrica de smartphones ---------- */
  const COLORS = ["orange", "silver", "blue", "black", "orange", "silver"];
  let colorIdx = 0;
  const makePhone = w => {
    const el = document.createElement("div");
    el.className = `phone phone--${COLORS[colorIdx++ % COLORS.length]}`;
    el.style.setProperty("--w", `${w}px`);
    el.innerHTML =
      `<div class="phone__face phone__front"><div class="phone__screen">` +
      `<div class="phone__apps"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>` +
      `<div class="phone__dock"></div></div></div>` +
      `<div class="phone__face phone__back"><div class="phone__cam"><i></i><i></i><i></i></div></div>`;
    return el;
  };

  const rnd = (a, b) => a + Math.random() * (b - a);
  const hero = $(".hero");
  const lanes = {
    far: $(".lane--far"),
    mid: $(".lane--mid"),
    near: $(".lane--near")
  };

  // Configuração das trajetórias por profundidade (y = fração da altura do hero)
  const laneConfig = () => {
    const mobile = innerWidth < 901;
    const s = mobile ? Math.max(.6, innerWidth / 640) : Math.min(1.25, innerWidth / 1440);
    return mobile ? {
      far:  { count: 3, w: [42, 58].map(v => v * s), y: [.06, .70], dur: [13, 18], tilt: 25 },
      mid:  { count: 2, w: [70, 88].map(v => v * s), y: [.56, .74], dur: [8, 11], tilt: 30 },
      near: { count: 1, w: [130, 150].map(v => v * s), y: [.80, .9], dur: [5.5, 7], tilt: 18 }
    } : {
      far:  { count: 6, w: [58, 86].map(v => v * s), y: [.10, .86], dur: [15, 22], tilt: 30 },
      mid:  { count: 3, w: [108, 140].map(v => v * s), y: [.10, .74], dur: [9, 13], tilt: 35 },
      near: { count: 2, w: [180, 220].map(v => v * s), y: [.86, .96], dur: [5.5, 7.5], tilt: 10 }
    };
  };

  let phoneTweens = [];
  let running = false;

  const fly = (phone, cfg, firstDelay) => {
    const W = hero.clientWidth, H = hero.clientHeight;
    const pw = phone.offsetWidth, ph = phone.offsetHeight;
    const dir = Math.random() < .5 ? 1 : -1;               // 1 = esquerda → direita
    const x0 = dir > 0 ? -pw * 1.6 : W + pw * .6;
    const x1 = dir > 0 ? W + pw * .6 : -pw * 1.6;
    const y0 = H * rnd(cfg.y[0], cfg.y[1]);
    const y1 = Math.min(H * cfg.y[1], Math.max(H * cfg.y[0], y0 + H * rnd(-.18, .18)));
    const yMid = (y0 + y1) / 2 - H * rnd(.04, .12);         // leve arco
    const rY0 = dir > 0 ? rnd(-60, -20) : rnd(20, 60);
    const spin = dir * rnd(150, 230);                       // mostra a traseira no meio do percurso
    const dur = rnd(cfg.dur[0], cfg.dur[1]);

    const tl = gsap.timeline({
      delay: firstDelay ?? rnd(.4, 3.5),
      onComplete: () => { if (running) fly(phone, cfg); }
    });
    tl.set(phone, { x: x0, y: y0, rotationY: rY0, rotationX: rnd(-14, 14), rotationZ: rnd(-cfg.tilt, cfg.tilt), opacity: 1 })
      .to(phone, { x: x1, duration: dur, ease: "none" }, 0)
      .to(phone, { keyframes: { y: [y0, yMid, y1], easeEach: "sine.inOut" }, duration: dur }, 0)
      .to(phone, { rotationY: rY0 + spin, rotationZ: `+=${dir * rnd(10, 30)}`, rotationX: rnd(-14, 14), duration: dur, ease: "sine.inOut" }, 0);
    phoneTweens.push(tl);
    if (phoneTweens.length > 60) phoneTweens = phoneTweens.filter(t => t.isActive() || t.paused());
  };

  const buildPhones = (animate = true) => {
    phoneTweens.forEach(t => t.kill());
    phoneTweens = [];
    Object.values(lanes).forEach(l => (l.innerHTML = ""));
    const cfg = laneConfig();
    Object.entries(cfg).forEach(([name, c]) => {
      for (let i = 0; i < c.count; i++) {
        const p = makePhone(rnd(c.w[0], c.w[1]));
        lanes[name].appendChild(p);
        if (animate) {
          gsap.set(p, { opacity: 0 });
          // primeiras entradas escalonadas para a cena se formar com ritmo
          fly(p, c, .9 + i * (name === "far" ? 1.6 : name === "mid" ? 2.4 : 3.2) + (name === "near" ? 1.2 : 0));
        } else {
          // versão estática (movimento reduzido)
          const W = hero.clientWidth, H = hero.clientHeight;
          gsap.set(p, { x: W * (.52 + .4 * ((i + 1) / (c.count + 1))), y: H * rnd(c.y[0], c.y[1]), rotationY: -25, rotationZ: rnd(-15, 15) });
        }
      }
    });
  };

  /* ---------- Campo de velocidade (canvas) ---------- */
  const warp = (() => {
    const c = $(".hero__warp"), ctx = c.getContext("2d");
    const st = { speed: 1, base: 2.2, boost: 0 };
    let W = 0, H = 0, stars = [], raf = 0, live = false;
    const vp = { x: 0, y: 0, bx: 0, by: 0, tx: 0, ty: 0 };
    const spawn = (z = Math.random()) => ({ a: Math.random() * Math.PI * 2, z, amber: Math.random() < .5, w: rnd(.6, 1.6) });
    const size = () => {
      const dpr = Math.min(1.5, devicePixelRatio || 1);
      W = c.clientWidth; H = c.clientHeight;
      c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const m = innerWidth < 901;
      vp.bx = vp.x = vp.tx = W * (m ? .5 : .7);
      vp.by = vp.y = vp.ty = H * (m ? .74 : .55);
      stars = Array.from({ length: m ? 90 : 190 }, () => spawn());
    };
    const frame = () => {
      raf = requestAnimationFrame(frame);
      st.boost *= .92;
      const sp = st.speed + st.boost;
      vp.x += (vp.tx - vp.x) * .05; vp.y += (vp.ty - vp.y) * .05;
      ctx.clearRect(0, 0, W, H);
      const R = Math.hypot(W, H) * .75, k = 3 + sp * 1.4;
      for (const s of stars) {
        const z0 = s.z;
        s.z += .0011 * sp * (.35 + s.z);
        if (s.z >= 1) { Object.assign(s, spawn(.02)); continue; }
        const r1 = Math.pow(s.z, 2.3) * R, r0 = Math.pow(z0, 2.3) * R;
        const tail = Math.max(0, r1 - (r1 - r0) * k);
        const cx = Math.cos(s.a), sy = Math.sin(s.a);
        const a = Math.min(1, s.z * 1.8) * (s.amber ? .75 : .5);
        ctx.strokeStyle = s.amber ? `rgba(252,161,6,${a})` : `rgba(255,255,255,${a * .8})`;
        ctx.lineWidth = s.w * (.4 + s.z * 1.8);
        ctx.beginPath();
        ctx.moveTo(vp.x + cx * tail, vp.y + sy * tail);
        ctx.lineTo(vp.x + cx * r1, vp.y + sy * r1);
        ctx.stroke();
      }
    };
    const start = () => { if (!live) { live = true; frame(); } };
    const stop = () => { live = false; cancelAnimationFrame(raf); };
    const drawStatic = () => { size(); st.speed = 0; for (let i = 0; i < 40; i++) stars.forEach(s => s.z = Math.min(.95, s.z)); ctx.clearRect(0,0,W,H); };
    return { st, vp, size, start, stop, drawStatic, get center() { return { x: vp.x, y: vp.y }; } };
  })();

  /* ---------- Celulares vindo em direção à câmera ---------- */
  const approach = (opts = {}) => {
    const lane = opts.lane || lanes.near;
    const m = innerWidth < 901;
    const w = (opts.w || rnd(m ? 70 : 90, m ? 95 : 130));
    const p = makePhone(w);
    lane.appendChild(p);
    const pw = p.offsetWidth, ph = p.offsetHeight;
    const { x: cx, y: cy } = warp.center;
    // direções que não cruzam o texto: à direita no desktop, para baixo/laterais no celular
    const ang = (m ? rnd(-15, 195) : rnd(-75, 80)) * Math.PI / 180;
    const dist = Math.hypot(innerWidth, innerHeight) * rnd(.65, .9);
    const dur = opts.dur || rnd(1.5, 2.3);
    gsap.set(p, { x: cx - pw / 2, y: cy - ph / 2, scale: .04, rotationY: rnd(-80, 80), rotationX: rnd(-30, 30), rotationZ: rnd(-40, 40), opacity: 0 });
    const tl = gsap.timeline({ delay: opts.delay || 0, onComplete: () => p.remove() });
    tl.to(p, { opacity: 1, duration: .35, ease: "power1.out" }, 0)
      .to(p, { x: cx - pw / 2 + Math.cos(ang) * dist, y: cy - ph / 2 + Math.sin(ang) * dist,
               scale: rnd(1.6, 2.6), duration: dur, ease: "power3.in" }, 0)
      .to(p, { rotationY: `+=${rnd(160, 320) * (Math.random() < .5 ? -1 : 1)}`, rotationZ: `+=${rnd(-80, 80)}`, rotationX: rnd(-25, 25), duration: dur, ease: "power1.in" }, 0);
    phoneTweens.push(tl);
    return tl;
  };

  /* ---------- Utilitários de texto ---------- */
  const splitWords = (el, wrapMask) => {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span");
            w.className = "w";
            if (wrapMask) {
              w.style.cssText = "display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.1em;margin-bottom:-.1em";
              const inner = document.createElement("span");
              inner.className = "wi";
              inner.style.display = "inline-block";
              inner.textContent = part;
              w.appendChild(inner);
            } else w.textContent = part;
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
  };

  // linhas-guia da seção "por que"
  $$(".why__item").forEach(li => {
    const r = document.createElement("span");
    r.className = "why__rule";
    r.setAttribute("aria-hidden", "true");
    li.prepend(r);
    li.classList.add("has-rule");
  });

  /* ---------- Cabeçalho e botão flutuante ---------- */
  const nav = $(".nav");
  ScrollTrigger.create({ start: 60, onToggle: s => nav.classList.toggle("is-solid", s.isActive) });
  const waFloat = $(".wa-float");
  ScrollTrigger.create({ trigger: hero, start: "bottom 70%", onToggle: s => waFloat.classList.toggle("is-in", s.isActive) });

  const mm = gsap.matchMedia();

  /* =================== MOVIMENTO COMPLETO =================== */
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    running = true;

    /* ---- Abertura: portal OO ---- */
    const loops = $$(".hero__loop rect");
    loops.forEach(r => { const len = r.getTotalLength(); gsap.set(r, { strokeDasharray: len, strokeDashoffset: len }); });
    splitWords($(".hero__lead"), false);

    // título letra a letra
    $$(".hero__title .ln > span").forEach(span => {
      const words = span.textContent.split(" ");
      span.innerHTML = words.map(w => `<span class="wd" style="display:inline-block;white-space:nowrap">${[...w].map(ch => `<span class="ch">${ch}</span>`).join("")}</span>`).join(" ");
    });
    const chars = $$(".hero__title .ch");
    const amberChars = $$(".hero__title .ln:last-child .ch");

    // máscara com os dois "O" vazados
    const rr = (x, y, w, h, r) => `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
    const oA = rr(150, 400, 330, 200, 84), oB = rr(520, 400, 330, 200, 84);
    $(".intro__mask").setAttribute("d", `M-40000 -40000H40000V40000H-40000Z ${oA} ${oB}`);
    const ooPaths = $$(".intro__oo path");
    ooPaths[0].setAttribute("d", oA); ooPaths[1].setAttribute("d", oB);
    ooPaths.forEach(pth => { const L = pth.getTotalLength(); gsap.set(pth, { strokeDasharray: L, strokeDashoffset: L }); });

    warp.size(); warp.start();
    const skipIntro = scrollY > 60;
    const intro = gsap.timeline({ defaults: { ease: "power3.out" }, onComplete: () => { $(".intro").classList.add("is-done"); armWelcome(); } });
    intro
      .set([".hero__copy", ".hero__rider", ".nav"], { visibility: "visible" })
      .set(warp.st, { speed: 0 })
      .to(ooPaths, { strokeDashoffset: 0, duration: .9, ease: "power2.inOut", stagger: .12 }, .1)
      .to(".intro__oo path", { strokeWidth: 22, duration: .25, ease: "power2.out", yoyo: true, repeat: 1 }, .95)
      .to(".intro__veil", { opacity: 0, duration: .35, ease: "power1.in" }, 1.15)
      .to(".intro__oo", { opacity: 0, duration: .3 }, 1.35)
      .fromTo(".intro__frame", { scale: 1 }, { scale: 34, duration: 1.05, ease: "expo.in" }, 1.25)
      .set(".intro", { display: "none" }, 2.3)
      .to(warp.st, { speed: 26, duration: .6, ease: "power2.in" }, 1.3)
      .to(warp.st, { speed: () => warp.st.base, duration: 2.2, ease: "power2.out" }, 2.0)
      .call(() => { for (let i = 0; i < (innerWidth < 901 ? 4 : 7); i++) approach({ delay: i * .07, dur: rnd(1.1, 1.7) }); }, null, 1.75)
      .to(loops, { strokeDashoffset: 0, duration: 2.4, ease: "power2.inOut", stagger: .25 }, 1.8)
      .from(".nav", { y: -30, opacity: 0, duration: .9, clearProps: "transform,opacity" }, 2.0)
      .from(".hero__tag", { opacity: 0, x: -20, duration: .8 }, 2.0)
      .from(chars, { rotationX: -100, yPercent: 40, opacity: 0, duration: 1, stagger: .028, ease: "back.out(1.6)" }, 2.05)
      .to(amberChars, { color: "#fff6dd", textShadow: "0 0 24px rgba(252,161,6,.9)", duration: .22, stagger: .035, yoyo: true, repeat: 1, ease: "power1.inOut" }, 3.1)
      .from(".hero__lead .w", { opacity: 0, y: 12, duration: .6, stagger: .022 }, 2.6)
      .from(".hero__rider", { x: () => -innerWidth * .9, duration: 1.5, ease: "expo.out" }, 1.95)
      .from(".rider__img", { filter: "blur(10px)", duration: .9, ease: "power2.out", clearProps: "filter" }, 1.95)
      .from(".rider__img", { rotation: -5, transformOrigin: "50% 100%", duration: 1.8, ease: "elastic.out(1,.55)" }, 2.1)
      .to(".rider__beam", { keyframes: { opacity: [0, .9, .2, 1, .55, 1] }, duration: .7, ease: "none" }, 3.0)
      .from(".hero__actions .btn", { y: 26, opacity: 0, duration: .8, stagger: .1 }, 2.9)
      .from(".sound", { y: 16, opacity: 0, duration: .7 }, 3.15)
      .from(".hero__road", { opacity: 0, duration: 1 }, 2.6)
      .from(".hero__cue", { opacity: 0, duration: .8 }, 3.4);
    if (skipIntro) intro.progress(1);
    const skip = () => { if (intro.progress() < .55) intro.progress(.55); };
    addEventListener("keydown", skip, { once: true });
    $(".intro").addEventListener("pointerdown", skip);

    // suspensão da moto e respiração do farol
    const idle = gsap.timeline({ repeat: -1, yoyo: true, delay: 3.6 });
    idle.to(".rider__img", { y: -4, rotation: -.4, transformOrigin: "60% 100%", duration: .55, ease: "sine.inOut" });
    const sway = gsap.to(".hero__rider", { x: "+=10", duration: 3.2, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 3.6 });
    const beam = gsap.to(".rider__beam", { opacity: .7, duration: 1.6, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 3.8 });

    // celulares laterais + celulares vindo na direção da câmera
    buildPhones(true);
    let approachLoop;
    const loopApproach = () => { approach(); approachLoop = gsap.delayedCall(rnd(1.8, 3.4), loopApproach); };
    approachLoop = gsap.delayedCall(4.2, loopApproach);

    let rw = innerWidth;
    const onResize = () => { warp.size(); if (Math.abs(innerWidth - rw) > 80) { rw = innerWidth; buildPhones(true); } };
    addEventListener("resize", onResize);

    // pausa a cena quando o hero sai da tela (economia de CPU/GPU)
    ScrollTrigger.create({
      trigger: hero, start: "top top", end: "bottom top",
      onLeave: () => { phoneTweens.forEach(t => t.pause()); idle.pause(); sway.pause(); beam.pause(); approachLoop.pause(); warp.stop(); },
      onEnterBack: () => { phoneTweens.forEach(t => t.resume()); idle.resume(); sway.resume(); beam.resume(); approachLoop.resume(); warp.start(); },
      onUpdate: s => { warp.st.boost = Math.min(22, Math.abs(s.getVelocity()) / 160); }
    });

    /* ---- Cursor: profundidade + ponto de fuga ---- */
    let onMove;
    if (matchMedia("(pointer:fine)").matches) {
      const movers = $$(".lane").map(l => ({
        d: +l.dataset.depth,
        x: gsap.quickTo(l, "x", { duration: 1.2, ease: "power3.out" }),
        y: gsap.quickTo(l, "y", { duration: 1.2, ease: "power3.out" })
      }));
      const rider = { x: gsap.quickTo(".rider__img", "x", { duration: 1.4, ease: "power3.out" }) };
      onMove = e => {
        const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
        movers.forEach(m => { m.x(nx * 60 * m.d); m.y(ny * 36 * m.d); });
        rider.x(nx * -14);
        warp.vp.tx = warp.vp.bx - nx * 120; warp.vp.ty = warp.vp.by - ny * 80;
      };
      hero.addEventListener("pointermove", onMove);
    }

    /* ---- Hero ao rolar: a moto sai para a entrega ---- */
    gsap.timeline({ scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: .6 } })
      .to(".hero__copy", { y: -90, opacity: 0, ease: "none" }, 0)
      .to(".hero__rider", { xPercent: 85, yPercent: 6, ease: "power2.in" }, 0)
      .to(".rider__beam", { scaleX: 1.6, ease: "none" }, 0)
      .to(".hero__loop", { scale: 1.15, opacity: 0, ease: "none" }, 0)
      .to(".lane--far, .lane--mid", { scale: 1.25, opacity: 0, ease: "none" }, 0);

    /* ---- Títulos revelados por máscara ---- */
    $$("[data-reveal-lines]").forEach(h => {
      splitWords(h, true);
      gsap.from($$(".wi", h), {
        yPercent: 108, duration: 1, ease: "expo.out", stagger: .045,
        scrollTrigger: { trigger: h, start: "top 85%" }
      });
    });
    $$("[data-fade]").forEach(el => gsap.from(el, {
      opacity: 0, y: 26, duration: 1, ease: "power3.out", delay: .15,
      scrollTrigger: { trigger: el, start: "top 88%" }
    }));

    /* ---- Statement: palavras acendem com a rolagem ---- */
    const st = $("[data-words]");
    splitWords(st, false);
    gsap.fromTo($$(".w", st), { opacity: .13 }, {
      opacity: 1, stagger: .1, ease: "none",
      scrollTrigger: { trigger: st, start: "top 78%", end: "bottom 45%", scrub: .5 }
    });

    /* ---- Serviços ---- */
    gsap.fromTo(".svc--repair .svc__media",
      { clipPath: "inset(14% 18% 14% 0% round 28px)", rotation: 2 },
      { clipPath: "inset(0% 0% 0% 0% round 28px)", rotation: -1.2, ease: "none",
        scrollTrigger: { trigger: ".svc--repair", start: "top 90%", end: "center 55%", scrub: .8 } });
    gsap.fromTo(".svc__video", { scale: 1.25 }, { scale: 1, ease: "none",
      scrollTrigger: { trigger: ".svc--repair", start: "top bottom", end: "bottom top", scrub: true } });
    $$(".svc__body").forEach(b => gsap.from(b.children, {
      opacity: 0, x: b.closest(".svc--delivery") ? -40 : 40, duration: .9, stagger: .09, ease: "power3.out",
      scrollTrigger: { trigger: b, start: "top 80%" }
    }));
    gsap.fromTo(".svc__figure img", { yPercent: 14 }, { yPercent: -6, ease: "none",
      scrollTrigger: { trigger: ".svc--delivery", start: "top bottom", end: "bottom top", scrub: true } });
    gsap.from(".svc__halo", { scale: .3, opacity: 0, ease: "none",
      scrollTrigger: { trigger: ".svc--delivery", start: "top 85%", end: "center center", scrub: true } });

    /* ---- Linhas: carrossel infinito com todos os aparelhos ---- */
    $$(".line").forEach(line => {
      const row = $(".line__row", line), set = $(".line__set", row), dir = +line.dataset.dir;
      for (let i = 0; i < 2; i++) { const cl = set.cloneNode(true); cl.setAttribute("aria-hidden", "true"); row.appendChild(cl); }
      const third = -100 / 3;
      const loop = gsap.fromTo(row, { xPercent: dir < 0 ? 0 : third }, {
        xPercent: dir < 0 ? third : 0, ease: "none", repeat: -1,
        duration: () => set.offsetWidth / (innerWidth < 901 ? 70 : 110), paused: true
      });
      let target = 1;
      ScrollTrigger.create({
        trigger: line, start: "top bottom", end: "bottom top",
        onToggle: s => s.isActive ? loop.play() : loop.pause(),
        onUpdate: s => { target = 1 + Math.min(5, Math.abs(s.getVelocity()) / 350); }
      });
      gsap.ticker.add(() => { target += (1 - target) * .04; loop.timeScale(loop.timeScale() + (target - loop.timeScale()) * .12); });
      const track = $(".line__track", line);
      track.addEventListener("pointerenter", () => { target = .25; });
      gsap.from($$("i", row), { rotation: -180, scale: 0, stagger: .03, duration: .9, ease: "back.out(2)",
        scrollTrigger: { trigger: line, start: "top 80%" } });
    });

    /* ---- Por que: linhas desenhadas + itens ---- */
    $$(".why__item").forEach(li => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: li, start: "top 82%" } });
      tl.from($(".why__rule", li), { scaleX: 0, duration: 1.1, ease: "expo.inOut" })
        .from($("h3", li), { x: 50, opacity: 0, duration: .9, ease: "power3.out" }, .25)
        .from($("p", li), { x: 30, opacity: 0, duration: .9, ease: "power3.out" }, .38);
    });
    const markRects = $$(".why__mark rect");
    markRects.forEach(r => { const L = r.getTotalLength(); gsap.set(r, { strokeDasharray: L, strokeDashoffset: L }); });
    const markCircle = $(".why__mark circle");
    const cL = markCircle.getTotalLength();
    gsap.set(markCircle, { strokeDasharray: cL, strokeDashoffset: cL });
    gsap.timeline({ scrollTrigger: { trigger: ".why", start: "top 65%", end: "center 45%", scrub: .8 } })
      .to(markRects, { strokeDashoffset: 0, stagger: .15, ease: "none" })
      .to(markCircle, { strokeDashoffset: 0, ease: "none" }, .2);

    /* ---- Como funciona: rota percorrida pela rolagem ---- */
    const route = $(".route"), steps = $$(".step");
    ScrollTrigger.create({
      trigger: route, start: "top 70%", end: () => innerWidth < 901 ? "bottom 60%" : "bottom 40%", scrub: .6,
      onUpdate: s => {
        const p = s.progress;
        route.style.setProperty("--p", p.toFixed(4));
        steps.forEach((st, i) => st.classList.toggle("is-on", p >= i / (steps.length - 1) - .03));
      }
    });
    gsap.from(steps, { y: 40, opacity: 0, stagger: .1, duration: .9, ease: "power3.out",
      scrollTrigger: { trigger: route, start: "top 82%" } });

    /* ---- Cobertura: rotas desenhadas a partir de Goiânia ---- */
    const paths = $$(".region__routes path");
    paths.forEach(p => { const L = p.getTotalLength(); gsap.set(p, { strokeDasharray: L, strokeDashoffset: L }); });
    gsap.timeline({ scrollTrigger: { trigger: ".region", start: "top 70%", end: "center 40%", scrub: .8 } })
      .from(".region__core", { scale: 0, transformOrigin: "50% 50%", ease: "back.out(3)", duration: .2 })
      .from(".region__rings circle", { scale: .2, opacity: 0, svgOrigin: "500 350", stagger: .06, duration: .5 }, 0)
      .to(paths, { strokeDashoffset: 0, stagger: .05, duration: .7, ease: "none" }, .1)
      .from(".region__pins circle", { scale: 0, transformOrigin: "50% 50%", stagger: .05, duration: .2 }, .6);
    gsap.to(".region__rings", { rotation: 25, svgOrigin: "500 350", ease: "none",
      scrollTrigger: { trigger: ".region", start: "top bottom", end: "bottom top", scrub: true } });
    gsap.from(".region__title span", { xPercent: -30, opacity: 0, stagger: .12, duration: 1.1, ease: "expo.out",
      scrollTrigger: { trigger: ".region__copy", start: "top 80%" } });
    gsap.from(".region__copy", { y: 40, opacity: 0, duration: 1, ease: "power3.out",
      scrollTrigger: { trigger: ".region__copy", start: "top 85%" } });

    /* ---- CTA final: a moto atravessa a cena ---- */
    gsap.fromTo(".final__ride img", { x: () => -$(".final__ride img").offsetWidth * 1.05 }, {
      x: () => innerWidth * .5 - $(".final__ride img").offsetWidth * .5, ease: "none",
      scrollTrigger: { trigger: ".final__ride", start: "top bottom", end: "bottom 85%", scrub: .8, invalidateOnRefresh: true }
    });
    gsap.fromTo(".final__lane", { backgroundPositionX: 0 }, { backgroundPositionX: -700, ease: "none",
      scrollTrigger: { trigger: ".final", start: "top bottom", end: "bottom bottom", scrub: true } });

    addEventListener("load", () => ScrollTrigger.refresh());
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      running = false;
      warp.stop(); approachLoop && approachLoop.kill();
      removeEventListener("resize", onResize);
      if (onMove) hero.removeEventListener("pointermove", onMove);
      phoneTweens.forEach(t => t.kill());
    };
  });

  /* =================== MOVIMENTO REDUZIDO =================== */
  mm.add("(prefers-reduced-motion: reduce)", () => {
    gsap.set([".hero__copy", ".hero__rider", ".nav"], { visibility: "visible" });
    gsap.set(".rider__beam", { opacity: .6 });
    buildPhones(false);
    armWelcome();
    const route = $(".route");
    route.style.setProperty("--p", 1);
    $$(".step").forEach(s => s.classList.add("is-on"));
  });

  root.classList.add("is-ready");
})();
