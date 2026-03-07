/**
 * Landing — public marketing page, converted from landing.html
 */

import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/* ─────────────────────────────────────────
   All styles are injected on mount and
   removed on unmount to avoid polluting
   other pages.
───────────────────────────────────────── */
const LANDING_CSS = `
/* ─── RESET ─────────────────────────────── */
.lp *,.lp *::before,.lp *::after{box-sizing:border-box;margin:0;padding:0}
.lp a{text-decoration:none;color:inherit}
.lp button{font-family:inherit;cursor:pointer}

/* ─── LAYOUT ─────────────────────────────── */
.lp{
  background:#0A0C10;
  color:#EEF2FF;
  font-family:'Rajdhani',sans-serif;
  overflow-x:hidden;
  min-height:100vh;
  position:relative;
}

/* ─── GLOBAL OVERLAYS ─────────────────────── */
.lp::before{
  content:'';position:fixed;inset:0;z-index:9999;pointer-events:none;
  background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.06) 2px,rgba(0,0,0,0.06) 4px);
  animation:lp-scanRoll 12s linear infinite;
}
.lp::after{
  content:'';position:fixed;inset:0;z-index:9998;pointer-events:none;
  opacity:0.025;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size:128px 128px;
}
@keyframes lp-scanRoll{from{background-position:0 0}to{background-position:0 100vh}}
@keyframes lp-bootFlicker{0%{opacity:0}5%{opacity:1}7%{opacity:0}10%{opacity:1}12%{opacity:0.4}14%{opacity:1}100%{opacity:1}}
.lp{animation:lp-bootFlicker 1.1s ease-out both}

/* ─── CSS VARIABLES ────────────────────── */
.lp{
  --base:#0A0C10;--base2:#0D1018;--base3:#111520;
  --silver:#B8C4D8;--silver-lo:rgba(184,196,216,0.07);--silver-bd:rgba(184,196,216,0.12);--silver-bdh:rgba(184,196,216,0.22);
  --white:#EEF2FF;--muted:#8899B0;--faint:#4A5568;--faintest:#2B3348;
  --green:#22C55E;
  --card-bg:rgba(14,17,26,0.90);--card-border:rgba(180,196,220,0.09);
}

/* ─── HUD CORNERS ─────────────────────── */
.lp .hud-tl,.lp .hud-tr,.lp .hud-bl,.lp .hud-br{
  position:fixed;width:44px;height:44px;z-index:100;pointer-events:none;
}
.lp .hud-tl{top:18px;left:18px;border-top:1px solid rgba(184,196,216,0.22);border-left:1px solid rgba(184,196,216,0.22)}
.lp .hud-tr{top:18px;right:18px;border-top:1px solid rgba(184,196,216,0.22);border-right:1px solid rgba(184,196,216,0.22)}
.lp .hud-bl{bottom:18px;left:18px;border-bottom:1px solid rgba(184,196,216,0.22);border-left:1px solid rgba(184,196,216,0.22)}
.lp .hud-br{bottom:18px;right:18px;border-bottom:1px solid rgba(184,196,216,0.22);border-right:1px solid rgba(184,196,216,0.22)}

/* ─── NAVBAR ─────────────────────────── */
.lp .lp-nav{
  position:fixed;top:0;left:0;right:0;z-index:200;
  display:flex;align-items:center;justify-content:space-between;
  padding:0 40px;height:60px;
  background:rgba(8,10,16,0.72);
  backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);
  border-bottom:1px solid rgba(184,196,216,0.07);
  transition:background 0.3s,border-color 0.3s;
}
.lp .nav-logo{display:flex;align-items:center;gap:12px}
.lp .nav-logo-text{
  font-family:'Orbitron',monospace;font-size:0.90rem;font-weight:700;letter-spacing:0.14em;
  background:linear-gradient(135deg,#fff 0%,#B8C4D8 60%,#7A90B0 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.lp .nav-links{display:flex;align-items:center;gap:28px}
.lp .nav-links a{font-size:0.80rem;letter-spacing:0.08em;color:var(--muted);font-family:'DM Mono',monospace;transition:color 0.18s}
.lp .nav-links a:hover{color:var(--silver)}
.lp .nav-cta{
  padding:0.45rem 1.2rem;background:linear-gradient(135deg,#1E2430,#2C3448);
  border:1px solid rgba(180,200,230,0.20);border-radius:8px;
  font-family:'Orbitron',monospace;font-size:0.55rem;font-weight:600;color:#C8D8F0;letter-spacing:0.12em;
  transition:all 0.22s;position:relative;overflow:hidden;
}
.lp .nav-cta::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(200,220,255,0.30),transparent)}
.lp .nav-cta:hover{background:linear-gradient(135deg,#262E3E,#384050);border-color:rgba(210,225,250,0.32);color:#F0F4FF;transform:translateY(-1px)}

/* ─── HERO ───────────────────────────── */
.lp #lp-hero{
  position:relative;min-height:100vh;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  overflow:hidden;padding:100px 24px 0;
}
.lp #hero-canvas{position:absolute;inset:0;z-index:0;width:100%;height:100%}
.lp .hero-glow{position:absolute;pointer-events:none;z-index:1;border-radius:50%;filter:blur(80px)}
.lp .hero-glow-1{width:600px;height:400px;top:-80px;left:50%;transform:translateX(-50%);background:radial-gradient(ellipse,rgba(180,210,255,0.08),transparent 70%)}
.lp .hero-glow-2{width:400px;height:600px;bottom:-100px;right:-50px;background:radial-gradient(ellipse,rgba(200,220,255,0.05),transparent 70%)}
.lp .hud-sweep{position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden}
.lp .hud-sweep::after{content:'';position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(184,196,216,0.18) 40%,rgba(220,235,255,0.35) 50%,rgba(184,196,216,0.18) 60%,transparent);animation:lp-hudSweep 5s linear infinite}
@keyframes lp-hudSweep{from{top:-2px}to{top:100%}}
.lp .hero-content{position:relative;z-index:3;display:flex;flex-direction:column;align-items:center;text-align:center;gap:1.4rem;max-width:820px}
.lp .hero-logo{position:relative;width:90px;height:90px;display:flex;align-items:center;justify-content:center;margin-bottom:0.4rem}
.lp .logo-hex-frame{
  position:absolute;inset:0;border:1px solid rgba(200,216,240,0.18);
  clip-path:polygon(12px 0%,calc(100% - 12px) 0%,100% 12px,100% calc(100% - 12px),calc(100% - 12px) 100%,12px 100%,0% calc(100% - 12px),0% 12px);
  background:rgba(160,185,220,0.04);
  animation:lp-logoPulse 3.5s ease-in-out infinite;
}
@keyframes lp-logoPulse{0%,100%{border-color:rgba(200,216,240,0.18);box-shadow:none}50%{border-color:rgba(230,242,255,0.38);box-shadow:0 0 28px rgba(200,225,255,0.10)}}
.lp .logo-svg{animation:lp-logoGlow 3.5s ease-in-out infinite}
@keyframes lp-logoGlow{0%,100%{filter:drop-shadow(0 0 5px rgba(200,220,255,0.45))}50%{filter:drop-shadow(0 0 14px rgba(220,235,255,0.80))}}
.lp .draw-path{stroke-dasharray:300;stroke-dashoffset:300;animation:lp-drawIn 2.0s cubic-bezier(0.4,0,0.2,1) 0.6s forwards}
.lp .draw-path-slow{stroke-dasharray:500;stroke-dashoffset:500;animation:lp-drawIn 2.6s cubic-bezier(0.4,0,0.2,1) 0.9s forwards}
@keyframes lp-drawIn{to{stroke-dashoffset:0}}
.lp .hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(184,196,216,0.06);border:1px solid rgba(184,196,216,0.16);border-radius:999px;padding:5px 16px;font-family:'DM Mono',monospace;font-size:0.60rem;letter-spacing:0.14em;color:var(--silver)}
.lp .badge-dot{width:6px;height:6px;border-radius:50%;background:var(--green);animation:lp-blink 1.4s ease-in-out infinite}
@keyframes lp-blink{0%,100%{opacity:1}50%{opacity:0.3}}
.lp .hero-name{font-family:'Orbitron',monospace;font-size:clamp(2.8rem,7vw,5.2rem);font-weight:900;letter-spacing:0.12em;line-height:1;background:linear-gradient(135deg,#FFFFFF 0%,#B8C4D8 50%,#7A90B0 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.lp .hero-tagline{font-family:'Orbitron',monospace;font-size:clamp(0.80rem,2vw,1.05rem);font-weight:400;letter-spacing:0.18em;color:var(--silver);min-height:1.5em}
.lp .hero-cta{display:flex;align-items:center;gap:14px;margin-top:0.6rem;flex-wrap:wrap;justify-content:center}
.lp .btn-primary{
  padding:0.90rem 2.0rem;background:linear-gradient(135deg,#1E2430,#2C3448);border:1px solid rgba(180,200,230,0.22);border-radius:12px;
  font-family:'Orbitron',monospace;font-size:0.64rem;font-weight:600;color:#C8D8F0;letter-spacing:0.13em;
  position:relative;overflow:hidden;transition:all 0.22s;display:inline-block;
}
.lp .btn-primary::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(200,220,255,0.32),transparent)}
.lp .btn-primary:hover{background:linear-gradient(135deg,#262E3E,#384050);border-color:rgba(210,225,250,0.35);color:#F0F4FF;transform:translateY(-2px);box-shadow:0 8px 32px rgba(160,190,230,0.14)}
.lp .btn-secondary{
  padding:0.90rem 2.0rem;background:transparent;border:1px solid rgba(184,196,216,0.20);border-radius:12px;
  font-family:'Orbitron',monospace;font-size:0.64rem;font-weight:600;color:var(--muted);letter-spacing:0.13em;
  transition:all 0.22s;display:inline-block;
}
.lp .btn-secondary:hover{border-color:rgba(184,196,216,0.40);color:var(--silver);background:rgba(184,196,216,0.05);transform:translateY(-2px)}
.lp .scroll-hint{position:absolute;bottom:28px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:6px;font-family:'DM Mono',monospace;font-size:0.56rem;letter-spacing:0.12em;color:var(--faintest);animation:lp-floatHint 2s ease-in-out infinite}
@keyframes lp-floatHint{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(5px)}}
.lp .scroll-chevron{width:18px;height:10px;border-bottom:1px solid rgba(184,196,216,0.25);border-right:1px solid rgba(184,196,216,0.25);transform:rotate(45deg)}

/* ─── TICKER ─────────────────────────── */
.lp .ticker-wrap{position:absolute;bottom:0;left:0;right:0;z-index:3;height:36px;background:rgba(8,10,16,0.85);border-top:1px solid rgba(184,196,216,0.08);overflow:hidden;display:flex;align-items:center}
.lp .ticker-inner{display:flex;align-items:center;white-space:nowrap;animation:lp-tickerScroll 32s linear infinite}
@keyframes lp-tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.lp .ticker-item{display:inline-flex;align-items:center;gap:10px;padding:0 32px;font-family:'DM Mono',monospace;font-size:0.60rem;letter-spacing:0.10em;color:var(--faintest)}
.lp .ticker-item span.hi{color:var(--silver)}
.lp .ticker-sep{width:4px;height:4px;border-radius:50%;background:rgba(184,196,216,0.22);flex-shrink:0}

/* ─── FEATURES (terminal section) ────── */
.lp #lp-features{position:relative;padding:120px 40px 100px;max-width:1200px;margin:0 auto}
.lp .feat-grid{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
.lp .terminal-window{background:rgba(8,10,16,0.95);border:1px solid rgba(184,196,216,0.10);border-radius:14px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,0.55),0 0 0 1px rgba(200,220,255,0.03);position:relative}
.lp .terminal-window::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(200,220,255,0.30) 30%,rgba(240,248,255,0.55) 50%,rgba(200,220,255,0.30) 70%,transparent)}
.lp .term-titlebar{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid rgba(184,196,216,0.07)}
.lp .term-dot{width:10px;height:10px;border-radius:50%}
.lp .term-td-red{background:#FF5F57;opacity:0.8}
.lp .term-td-yel{background:#FFBD2E;opacity:0.8}
.lp .term-td-grn{background:#28C840;opacity:0.8}
.lp .term-title-text{flex:1;text-align:center;font-family:'DM Mono',monospace;font-size:0.62rem;color:var(--faintest);letter-spacing:0.08em}
.lp .term-body{padding:18px;font-family:'DM Mono',monospace;font-size:0.72rem;line-height:1.80;min-height:300px}
.lp .t-prompt{color:var(--silver)}
.lp .t-user{color:#EEF2FF}
.lp .t-ai{color:var(--green);opacity:0.92}
.lp .t-dimmed{color:var(--faintest)}
.lp .t-line{display:block;margin-bottom:2px}
.lp .t-cursor{display:inline-block;width:8px;height:0.9em;background:var(--silver);margin-left:2px;vertical-align:text-bottom;animation:lp-curBlink 1s step-end infinite}
@keyframes lp-curBlink{0%,100%{opacity:1}50%{opacity:0}}
.lp .feat-pills{display:flex;flex-direction:column;gap:14px}
.lp .feat-pill{display:flex;align-items:flex-start;gap:14px;padding:16px 18px;background:rgba(14,17,26,0.88);border:1px solid rgba(180,196,220,0.08);border-radius:12px;transition:all 0.42s cubic-bezier(0.22,1,0.36,1);transform:translateX(60px);opacity:0}
.lp .feat-pill.in-view{transform:translateX(0);opacity:1}
.lp .feat-pill:hover{border-color:rgba(180,196,220,0.18);background:rgba(20,24,36,0.95);transform:translateX(0) translateY(-2px);box-shadow:0 8px 28px rgba(0,0,0,0.35)}
.lp .pill-icon{width:36px;height:36px;border-radius:9px;flex-shrink:0;background:rgba(184,196,216,0.06);border:1px solid rgba(184,196,216,0.14);display:flex;align-items:center;justify-content:center}
.lp .pill-text h4{font-family:'Orbitron',monospace;font-size:0.70rem;font-weight:600;color:var(--white);letter-spacing:0.06em;margin-bottom:4px}
.lp .pill-text p{font-size:0.86rem;color:var(--muted);line-height:1.55;font-family:'Rajdhani',sans-serif}

/* ─── STATS BAR ─────────────────────── */
.lp #lp-stats{position:relative;padding:0 40px;margin:0 auto;max-width:1100px}
.lp .stats-bar{display:grid;grid-template-columns:repeat(4,1fr);background:rgba(14,17,26,0.90);border:1px solid rgba(180,196,220,0.09);border-radius:18px;overflow:hidden;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);position:relative}
.lp .stats-bar::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(200,220,255,0.28) 30%,rgba(240,248,255,0.50) 50%,rgba(200,220,255,0.28) 70%,transparent)}
.lp .stat-cell{padding:38px 24px;text-align:center;border-right:1px solid rgba(184,196,216,0.07);transition:background 0.22s}
.lp .stat-cell:last-child{border-right:none}
.lp .stat-cell:hover{background:rgba(184,196,216,0.03)}
.lp .stat-num{font-family:'Orbitron',monospace;font-size:clamp(1.8rem,3.5vw,2.6rem);font-weight:700;background:linear-gradient(135deg,#FFFFFF,#B8C4D8 60%,#7A90B0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;display:block;line-height:1;margin-bottom:8px}
.lp .stat-suffix{font-family:'Orbitron',monospace;font-size:clamp(1.0rem,2vw,1.5rem);font-weight:600;background:linear-gradient(135deg,#B8C4D8,#7A90B0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.lp .stat-label{font-family:'DM Mono',monospace;font-size:0.62rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--faintest);margin-bottom:4px;display:block}
.lp .stat-sub{font-size:0.78rem;color:var(--faintest);font-family:'Rajdhani',sans-serif}

/* ─── FEATURE GRID ───────────────────── */
.lp #lp-feature-grid{padding:120px 40px 100px;max-width:1100px;margin:0 auto}
.lp .section-head{text-align:center;margin-bottom:60px}
.lp .section-overline{font-family:'DM Mono',monospace;font-size:0.60rem;letter-spacing:0.16em;text-transform:uppercase;color:var(--faintest);margin-bottom:12px;display:block}
.lp .section-title{font-family:'Orbitron',monospace;font-size:clamp(1.5rem,3.5vw,2.4rem);font-weight:700;background:linear-gradient(135deg,#FFFFFF 0%,#B8C4D8 55%,#7A90B0 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:0.06em;margin-bottom:12px}
.lp .section-sub{font-size:1.0rem;color:var(--muted);font-family:'Rajdhani',sans-serif;line-height:1.6;max-width:520px;margin:0 auto}
.lp .card-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.lp .feat-card{background:rgba(14,17,26,0.90);border:1px solid rgba(180,196,220,0.09);border-radius:18px;overflow:hidden;padding:0;position:relative;transition:all 0.28s cubic-bezier(0.22,1,0.36,1);transform:translateY(40px);opacity:0}
.lp .feat-card.in-view{transform:translateY(0);opacity:1}
.lp .feat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(200,220,255,0.28) 30%,rgba(240,248,255,0.50) 50%,rgba(200,220,255,0.28) 70%,transparent)}
.lp .feat-card:hover{border-color:rgba(184,196,216,0.20);transform:translateY(-5px);box-shadow:0 20px 60px rgba(0,0,0,0.50),0 0 0 1px rgba(200,220,255,0.05),0 0 40px rgba(160,190,230,0.07);background:rgba(18,22,32,0.95)}
.lp .feat-card-inner{padding:26px 24px 24px}
.lp .feat-card-icon{width:42px;height:42px;border-radius:11px;background:rgba(184,196,216,0.06);border:1px solid rgba(184,196,216,0.14);display:flex;align-items:center;justify-content:center;margin-bottom:16px}
.lp .feat-card h3{font-family:'Orbitron',monospace;font-size:0.75rem;font-weight:600;color:var(--white);letter-spacing:0.07em;margin-bottom:9px}
.lp .feat-card p{font-size:0.88rem;color:var(--muted);line-height:1.65;font-family:'Rajdhani',sans-serif}
.lp .feat-card-tag{display:inline-block;margin-top:14px;font-family:'DM Mono',monospace;font-size:0.58rem;letter-spacing:0.10em;color:var(--faintest);background:rgba(184,196,216,0.05);border:1px solid rgba(184,196,216,0.09);border-radius:999px;padding:3px 10px}

/* ─── PIPELINE ───────────────────────── */
.lp #lp-pipeline{padding:80px 40px 100px;position:relative;overflow:hidden}
.lp #lp-pipeline::before{content:'';position:absolute;inset:0;opacity:0.028;background-image:repeating-linear-gradient(0deg,rgba(184,196,216,0.5) 0,rgba(184,196,216,0.5) 1px,transparent 1px,transparent 60px),repeating-linear-gradient(90deg,rgba(184,196,216,0.5) 0,rgba(184,196,216,0.5) 1px,transparent 1px,transparent 60px);pointer-events:none}
.lp .pipeline-inner{max-width:1000px;margin:0 auto}
.lp .pipe-nodes{display:flex;align-items:center;justify-content:space-between;position:relative;margin-top:64px}
.lp .pipe-connector{flex:1;height:1px;position:relative;border-top:1px dashed rgba(184,196,216,0.18);margin:0 4px;overflow:visible}
.lp .pipe-packet{position:absolute;top:-4px;left:-4px;width:8px;height:8px;border-radius:50%;background:var(--silver);box-shadow:0 0 10px rgba(184,196,216,0.70);animation:lp-packetTravel 3.6s linear infinite}
.lp .pipe-packet:nth-child(2){animation-delay:1.2s}
.lp .pipe-packet:nth-child(3){animation-delay:2.4s}
@keyframes lp-packetTravel{0%{left:-4px;opacity:0}5%{opacity:1}95%{opacity:1}100%{left:calc(100% - 4px);opacity:0}}
.lp .pipe-node{display:flex;flex-direction:column;align-items:center;gap:14px;flex-shrink:0;cursor:default;transform:translateY(30px);opacity:0;transition:all 0.5s}
.lp .pipe-node.in-view{transform:translateY(0);opacity:1}
.lp .hex-badge{width:68px;height:68px;position:relative;display:flex;align-items:center;justify-content:center}
.lp .hex-badge-bg{position:absolute;inset:0;clip-path:polygon(14px 0%,calc(100% - 14px) 0%,100% 14px,100% calc(100% - 14px),calc(100% - 14px) 100%,14px 100%,0% calc(100% - 14px),0% 14px);background:rgba(184,196,216,0.06);border:1px solid rgba(184,196,216,0.18);transition:all 0.25s}
.lp .pipe-node:hover .hex-badge-bg{background:rgba(184,196,216,0.12);border-color:rgba(184,196,216,0.38);box-shadow:0 0 22px rgba(184,196,216,0.14)}
.lp .hex-num{font-family:'Orbitron',monospace;font-size:0.70rem;font-weight:700;color:var(--silver);letter-spacing:0.06em;position:relative;z-index:1}
.lp .pipe-label{text-align:center}
.lp .pipe-label h4{font-family:'Orbitron',monospace;font-size:0.66rem;font-weight:600;color:var(--white);letter-spacing:0.07em;margin-bottom:5px}
.lp .pipe-label p{font-size:0.82rem;color:var(--muted);font-family:'Rajdhani',sans-serif;max-width:130px;line-height:1.5}

/* ─── CTA BANNER ─────────────────────── */
.lp #lp-cta{padding:80px 40px 100px;position:relative;overflow:hidden}
.lp .cta-inner{max-width:820px;margin:0 auto;background:rgba(14,17,26,0.90);border:1px solid rgba(180,196,220,0.09);border-radius:22px;overflow:hidden;position:relative;padding:64px 48px;text-align:center;backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);box-shadow:0 0 0 1px rgba(200,220,255,0.03),0 32px 80px rgba(0,0,0,0.55)}
.lp .cta-inner::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(200,220,255,0.28) 30%,rgba(240,248,255,0.55) 50%,rgba(200,220,255,0.28) 70%,transparent)}
.lp .cta-inner::after{content:'';position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 60% 50% at 50% -10%,rgba(180,210,255,0.07),transparent 65%),radial-gradient(ellipse 40% 30% at 50% 110%,rgba(160,190,230,0.06),transparent 65%)}
.lp .cta-title{font-family:'Orbitron',monospace;font-size:clamp(1.4rem,3.5vw,2.2rem);font-weight:700;letter-spacing:0.08em;line-height:1.25;background:linear-gradient(135deg,#FFFFFF 0%,#B8C4D8 55%,#7A90B0 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:14px;min-height:2.5em}
.lp .cta-sub{font-size:1.0rem;color:var(--muted);font-family:'Rajdhani',sans-serif;line-height:1.65;max-width:480px;margin:0 auto 32px}
.lp .cta-btns{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;position:relative;z-index:1}

/* ─── FOOTER ─────────────────────────── */
.lp .lp-footer{position:relative;border-top:1px solid rgba(184,196,216,0.07);padding:48px 40px 32px}
.lp .footer-inner{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr auto auto auto auto;gap:40px;align-items:start}
.lp .foot-brand p{font-size:0.85rem;color:var(--faint);font-family:'Rajdhani',sans-serif;line-height:1.6;margin-top:10px;max-width:240px}
.lp .foot-col h5{font-family:'DM Mono',monospace;font-size:0.60rem;letter-spacing:0.14em;text-transform:uppercase;color:var(--faintest);margin-bottom:14px}
.lp .foot-col a{display:block;font-size:0.84rem;color:var(--faint);font-family:'Rajdhani',sans-serif;margin-bottom:8px;transition:color 0.18s}
.lp .foot-col a:hover{color:var(--silver)}
.lp .foot-status{display:flex;align-items:center;gap:7px;font-family:'DM Mono',monospace;font-size:0.60rem;letter-spacing:0.10em;color:var(--green)}
.lp .status-dot{width:7px;height:7px;border-radius:50%;background:var(--green);animation:lp-blink 1.4s ease-in-out infinite}
.lp .foot-bottom{max-width:1100px;margin:28px auto 0;display:flex;align-items:center;justify-content:space-between;border-top:1px solid rgba(184,196,216,0.06);padding-top:22px;flex-wrap:wrap;gap:10px}
.lp .foot-copy{font-family:'DM Mono',monospace;font-size:0.58rem;letter-spacing:0.08em;color:var(--faintest)}
.lp .foot-socials{display:flex;gap:12px}
.lp .foot-social-btn{width:32px;height:32px;border-radius:8px;background:rgba(184,196,216,0.05);border:1px solid rgba(184,196,216,0.10);display:flex;align-items:center;justify-content:center;transition:all 0.18s;color:var(--faintest)}
.lp .foot-social-btn:hover{background:rgba(184,196,216,0.10);border-color:rgba(184,196,216,0.24);color:var(--silver)}

/* ─── SCROLL REVEAL ─────────────────── */
.lp .reveal{opacity:0;transform:translateY(28px);transition:opacity 0.60s cubic-bezier(0.22,1,0.36,1),transform 0.60s cubic-bezier(0.22,1,0.36,1)}
.lp .reveal.in-view{opacity:1;transform:none}
.lp .d1{transition-delay:0.05s}.lp .d2{transition-delay:0.12s}.lp .d3{transition-delay:0.20s}
.lp .d4{transition-delay:0.28s}.lp .d5{transition-delay:0.36s}.lp .d6{transition-delay:0.44s}

/* ─── RESPONSIVE ─────────────────────── */
@media(max-width:900px){
  .lp .feat-grid{grid-template-columns:1fr}
  .lp .card-grid{grid-template-columns:repeat(2,1fr)}
  .lp .pipe-nodes{flex-wrap:wrap;gap:32px;justify-content:center}
  .lp .pipe-connector{display:none}
  .lp .footer-inner{grid-template-columns:1fr 1fr}
  .lp .stats-bar{grid-template-columns:repeat(2,1fr)}
  .lp .stat-cell:nth-child(2){border-right:none}
}
@media(max-width:600px){
  .lp .lp-nav{padding:0 20px}
  .lp .nav-links{display:none}
  .lp #lp-features,.lp #lp-feature-grid,.lp #lp-pipeline,.lp #lp-stats,.lp #lp-cta{padding-left:20px;padding-right:20px}
  .lp .card-grid{grid-template-columns:1fr}
  .lp .stats-bar{grid-template-columns:1fr 1fr}
  .lp .cta-inner{padding:40px 24px}
  .lp .footer-inner{grid-template-columns:1fr}
}
`;

/* ─────────────────────────────────────────
   LogoSVG — used in nav + footer
───────────────────────────────────────── */
function LogoSVG({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <polygon points="50,6 88,28 88,72 50,94 12,72 12,28" stroke="#B8C4D8" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
      <polygon points="50,30 64,50 50,70 36,50" stroke="#D0DCEF" strokeWidth="2" fill="rgba(200,220,255,0.06)" strokeLinejoin="round" />
      <circle cx="50" cy="50" r="5" fill="#EEF4FF" opacity="0.90" />
      <circle cx="50" cy="50" r="2.5" fill="#FFFFFF" />
    </svg>
  );
}

/* ─────────────────────────────────────────
   PillIcon — svg wrapper
───────────────────────────────────────── */
function PillIcon({ children }) {
  return <div className="pill-icon">{children}</div>;
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function Landing() {
  const navRef = useRef(null);
  const ctaTitleRef = useRef(null);

  /* ── CSS injection / cleanup ── */
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.id = 'landing-page-css';
    styleEl.textContent = LANDING_CSS;
    document.head.appendChild(styleEl);

    // Google Fonts (idempotent)
    if (!document.getElementById('lp-fonts')) {
      const link = document.createElement('link');
      link.id = 'lp-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Rajdhani:wght@300;400;500;600;700&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&display=swap';
      document.head.appendChild(link);
    }

    return () => { styleEl.remove(); };
  }, []);

  /* ── Canvas hex grid ── */
  useEffect(() => {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, hexes = [], mouse = { x: 0, y: 0 };
    const R = 32, COLS_EXTRA = 3;
    let rafId;

    function resize() {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
      buildHexes();
    }

    function hexPoly(cx, cy, r) {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 180 * (60 * i - 30);
        pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
      }
      return pts;
    }

    function buildHexes() {
      hexes = [];
      const dx = R * Math.sqrt(3);
      const dy = R * 1.5;
      const cols = Math.ceil(W / dx) + COLS_EXTRA;
      const rows = Math.ceil(H / dy) + 3;
      for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
          const cx = col * dx + (row % 2 === 0 ? 0 : dx / 2);
          const cy = row * dy;
          hexes.push({ cx, cy, phase: Math.random() * Math.PI * 2 });
        }
      }
    }

    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      hexes.forEach(h => {
        const pts = hexPoly(h.cx, h.cy, R - 1);
        const dx2 = h.cx - mouse.x, dy2 = h.cy - mouse.y;
        const dist = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        const proximity = Math.max(0, 1 - dist / 260);
        const pulse = (Math.sin(t * 0.0008 + h.phase) + 1) / 2;
        const alpha = 0.020 + pulse * 0.018 + proximity * 0.065;
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        pts.slice(1).forEach(p => ctx.lineTo(p[0], p[1]));
        ctx.closePath();
        ctx.strokeStyle = `rgba(184,196,216,${alpha})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      });
      rafId = requestAnimationFrame(draw);
    }

    const hero = document.getElementById('lp-hero');
    function onMouseMove(e) {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    }
    function onMouseLeave() { mouse.x = W / 2; mouse.y = H / 2; }

    window.addEventListener('resize', resize);
    hero.addEventListener('mousemove', onMouseMove);
    hero.addEventListener('mouseleave', onMouseLeave);
    resize();
    mouse.x = W / 2; mouse.y = H / 2;
    rafId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      hero.removeEventListener('mousemove', onMouseMove);
      hero.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  /* ── Typewriter utility ── */
  function typewriter(el, text, speed, cb) {
    let i = 0;
    el.textContent = '';
    const iv = setInterval(() => {
      el.textContent += text[i++];
      if (i >= text.length) { clearInterval(iv); if (cb) cb(); }
    }, speed);
    return iv;
  }

  /* ── Hero tagline typewriter ── */
  useEffect(() => {
    const el = document.getElementById('hero-tagline');
    if (!el) return;
    const tid = setTimeout(() => {
      typewriter(el, 'YOUR PERSONAL AI CORE — ALWAYS ONLINE, ALWAYS AWARE', 46);
    }, 1200);
    return () => clearTimeout(tid);
  }, []);

  /* ── Ticker ── */
  useEffect(() => {
    const ticker = document.getElementById('lp-ticker');
    if (!ticker) return;
    const items = [
      { hi: 'Memory Core',       txt: 'active · 0 entries stored' },
      { hi: 'Response Engine',   txt: 'online · avg 340ms' },
      { hi: 'Task Module',       txt: 'ready · awaiting input' },
      { hi: 'Reminder Engine',   txt: 'scanning · no alerts pending' },
      { hi: 'Desktop Bridge',    txt: 'connected · awaiting command' },
      { hi: 'Analytics Core',    txt: 'logging · session started' },
      { hi: 'AI Model',          txt: 'loaded · context window clear' },
      { hi: 'Conversation Log',  txt: 'indexed · history synced' },
      { hi: 'Goal Tracker',      txt: 'online · monitored' },
      { hi: 'Auth Layer',        txt: 'secured · JWT verified' },
    ];
    let html = '';
    for (let pass = 0; pass < 2; pass++) {
      items.forEach(item => {
        html += `<span class="ticker-item"><span class="ticker-sep"></span><span class="hi">${item.hi}</span>— ${item.txt}</span>`;
      });
    }
    ticker.innerHTML = html;
  }, []);

  /* ── Navbar scroll tint ── */
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    function onScroll() {
      if (window.scrollY > 40) {
        nav.style.background = 'rgba(8,10,16,0.92)';
        nav.style.borderBottomColor = 'rgba(184,196,216,0.10)';
      } else {
        nav.style.background = 'rgba(8,10,16,0.72)';
        nav.style.borderBottomColor = 'rgba(184,196,216,0.07)';
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── IntersectionObserver for .reveal ── */
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in-view'); });
    }, { threshold: 0.12 });
    document.querySelectorAll('.lp .reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  /* ── Feature pills ── */
  useEffect(() => {
    const container = document.getElementById('feat-pills');
    if (!container) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.querySelectorAll('.feat-pill').forEach((p, i) => {
            setTimeout(() => p.classList.add('in-view'), i * 100);
          });
        }
      });
    }, { threshold: 0.1 });
    obs.observe(container);
    return () => obs.disconnect();
  }, []);

  /* ── Feature cards ── */
  useEffect(() => {
    const grid = document.querySelector('.lp .card-grid');
    if (!grid) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          document.querySelectorAll('.lp .feat-card').forEach((c, i) => {
            setTimeout(() => c.classList.add('in-view'), i * 90);
          });
        }
      });
    }, { threshold: 0.08 });
    obs.observe(grid);
    return () => obs.disconnect();
  }, []);

  /* ── Pipeline nodes ── */
  useEffect(() => {
    const pipeEl = document.querySelector('.lp .pipe-nodes');
    if (!pipeEl) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          document.querySelectorAll('.lp .pipe-node').forEach((n, i) => {
            setTimeout(() => n.classList.add('in-view'), i * 140);
          });
        }
      });
    }, { threshold: 0.1 });
    obs.observe(pipeEl);
    return () => obs.disconnect();
  }, []);

  /* ── Stat counters ── */
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        obs.unobserve(e.target);
        const cell = e.target;
        const target = +cell.dataset.target;
        const countEl = cell.querySelector('.count');
        if (!countEl) return;
        let cur = 0;
        const dur = 1600, step = 16;
        const inc = target / (dur / step);
        const iv = setInterval(() => {
          cur = Math.min(cur + inc, target);
          countEl.textContent = Math.floor(cur);
          if (cur >= target) { clearInterval(iv); countEl.textContent = target; }
        }, step);
      });
    }, { threshold: 0.4 });
    document.querySelectorAll('.lp .stat-cell').forEach(c => obs.observe(c));
    return () => obs.disconnect();
  }, []);

  /* ── Terminal auto-type ── */
  useEffect(() => {
    const out = document.getElementById('term-output');
    if (!out) return;

    const session = [
      { type: 'delay', ms: 800 },
      { type: 'prompt', msg: 'Remember that I prefer TypeScript over JavaScript' },
      { type: 'delay', ms: 300 },
      { type: 'ai', text: "✓ Memory saved — I'll apply TypeScript conventions in all future sessions." },
      { type: 'nl' },
      { type: 'prompt', msg: 'Add task: Review authentication PR by end of day' },
      { type: 'delay', ms: 250 },
      { type: 'ai', text: '✓ Task created — "Review authentication PR by end of day" added to your board.' },
      { type: 'nl' },
      { type: 'prompt', msg: 'Remind me at 5pm today to push the release build' },
      { type: 'delay', ms: 280 },
      { type: 'ai', text: "✓ Reminder set — I'll alert you at 17:00 — \"Push the release build\"." },
      { type: 'nl' },
      { type: 'prompt', msg: "What's my current pending task count?" },
      { type: 'delay', ms: 220 },
      { type: 'ai', text: 'You have 1 pending task — "Review authentication PR by end of day". No overdue items.' },
      { type: 'nl' },
      { type: 'cursor' },
    ];

    function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

    function addLine(cls, text) {
      const span = document.createElement('span');
      span.className = `t-line ${cls}`;
      span.textContent = text;
      out.appendChild(span);
      out.scrollTop = out.scrollHeight;
      return span;
    }

    function addCursor() {
      const c = document.createElement('span');
      c.className = 't-cursor'; out.appendChild(c); return c;
    }
    function removeCursor() { const c = out.querySelector('.t-cursor'); if (c) c.remove(); }

    function typeIntoLine(el, text, speed) {
      return new Promise(res => {
        let i = 0;
        const curs = addCursor();
        const iv = setInterval(() => {
          el.textContent += text[i++];
          if (i >= text.length) { clearInterval(iv); removeCursor(); res(); }
        }, speed);
      });
    }

    let cancelled = false;

    async function runSession() {
      await wait(1400);
      for (const step of session) {
        if (cancelled) return;
        if (step.type === 'delay') {
          await wait(step.ms);
        } else if (step.type === 'nl') {
          addLine('', '');
        } else if (step.type === 'prompt') {
          const el = addLine('', '');
          const prefix = document.createElement('span');
          prefix.className = 't-prompt'; prefix.textContent = '> '; el.prepend(prefix);
          const textEl = document.createElement('span');
          textEl.className = 't-user'; el.appendChild(textEl);
          await typeIntoLine(textEl, step.msg, 38);
          await wait(120);
        } else if (step.type === 'ai') {
          const el = addLine('t-ai', '');
          await typeIntoLine(el, step.text, 18);
        } else if (step.type === 'cursor') {
          addCursor();
        }
      }
    }

    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { obs.disconnect(); runSession(); } });
    }, { threshold: 0.3 });
    obs.observe(out);

    return () => { cancelled = true; obs.disconnect(); };
  }, []);

  /* ── CTA title typewriter ── */
  useEffect(() => {
    const banner = document.getElementById('lp-cta');
    if (!banner) return;
    let started = false;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && !started) {
          started = true;
          const el = ctaTitleRef.current;
          if (el) typewriter(el, 'Your intelligence layer is ready for activation', 44);
        }
      });
    }, { threshold: 0.4 });
    obs.observe(banner);
    return () => obs.disconnect();
  }, []);

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */
  return (
    <div className="lp">

      {/* HUD corners */}
      <div className="hud-tl" />
      <div className="hud-tr" />
      <div className="hud-bl" />
      <div className="hud-br" />

      {/* ── NAVBAR ── */}
      <nav className="lp-nav" ref={navRef}>
        <div className="nav-logo">
          <LogoSVG size={28} />
          <span className="nav-logo-text">J.A.R.V.I.S</span>
        </div>
        <div className="nav-links">
          <a href="#lp-features">Features</a>
          <a href="#lp-stats">Intelligence</a>
          <a href="#lp-feature-grid">Capabilities</a>
          <a href="#lp-pipeline">How It Works</a>
        </div>
        <Link to="/login" className="nav-cta">ACCESS PORTAL</Link>
      </nav>

      {/* ══════════ SECTION 1 — HERO ══════════ */}
      <section id="lp-hero">
        <canvas id="hero-canvas" />
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />
        <div className="hud-sweep" />

        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            CORE SYSTEMS ONLINE · ALL MODULES ACTIVE
          </div>

          <div className="hero-logo">
            <div className="logo-hex-frame" />
            <svg className="logo-svg" width="54" height="54" viewBox="0 0 100 100" fill="none">
              <polygon className="draw-path-slow" points="50,6 88,28 88,72 50,94 12,72 12,28" stroke="#B8C4D8" strokeWidth="2" fill="none" strokeLinejoin="round" />
              <polygon className="draw-path-slow" points="50,18 76,33 76,67 50,82 24,67 24,33" stroke="#7A8A9E" strokeWidth="1.2" fill="none" strokeLinejoin="round" opacity="0.6" />
              <line className="draw-path" x1="50" y1="6"  x2="50" y2="18" stroke="#B8C4D8" strokeWidth="1.5" opacity="0.55" />
              <line className="draw-path" x1="88" y1="28" x2="76" y2="33" stroke="#B8C4D8" strokeWidth="1.5" opacity="0.55" />
              <line className="draw-path" x1="88" y1="72" x2="76" y2="67" stroke="#B8C4D8" strokeWidth="1.5" opacity="0.55" />
              <line className="draw-path" x1="50" y1="94" x2="50" y2="82" stroke="#B8C4D8" strokeWidth="1.5" opacity="0.55" />
              <line className="draw-path" x1="12" y1="72" x2="24" y2="67" stroke="#B8C4D8" strokeWidth="1.5" opacity="0.55" />
              <line className="draw-path" x1="12" y1="28" x2="24" y2="33" stroke="#B8C4D8" strokeWidth="1.5" opacity="0.55" />
              <polygon className="draw-path" points="50,30 64,50 50,70 36,50" stroke="#D0DCEF" strokeWidth="1.8" fill="rgba(200,220,255,0.05)" strokeLinejoin="round" />
              <circle cx="50" cy="50" r="5" fill="#EEF4FF" opacity="0.90" />
              <circle cx="50" cy="50" r="2.5" fill="#FFFFFF" />
            </svg>
          </div>

          <h1 className="hero-name" id="hero-name">J.A.R.V.I.S</h1>
          <p className="hero-tagline" id="hero-tagline" />

          <div className="hero-cta">
            <Link to="/login"    className="btn-primary">ACCESS YOUR CORE</Link>
            <Link to="/register" className="btn-secondary">CREATE ACCOUNT</Link>
          </div>
        </div>

        {/* Ticker */}
        <div className="ticker-wrap">
          <div className="ticker-inner" id="lp-ticker" />
        </div>

        <div className="scroll-hint">
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.54rem', letterSpacing: '0.1em', color: '#2B3348' }}>
            SCROLL TO EXPLORE
          </span>
          <div className="scroll-chevron" />
        </div>
      </section>

      {/* ══════════ SECTION 2 — TERMINAL + PILLS ══════════ */}
      <section id="lp-features">
        <div className="feat-grid">

          {/* Terminal */}
          <div className="terminal-window reveal d1">
            <div className="term-titlebar">
              <span className="term-dot term-td-red" />
              <span className="term-dot term-td-yel" />
              <span className="term-dot term-td-grn" />
              <span className="term-title-text">jarvis-core — live session</span>
            </div>
            <div className="term-body" id="term-output">
              <span className="t-line t-dimmed"># J.A.R.V.I.S v4.1 · initializing session…</span>
              <span className="t-line t-dimmed"># All modules loaded · ready for input</span>
              <span className="t-line">&nbsp;</span>
            </div>
          </div>

          {/* Feature pills */}
          <div className="feat-pills" id="feat-pills">
            <div className="feat-pill d1">
              <PillIcon>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#B8C4D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              </PillIcon>
              <div className="pill-text">
                <h4>CONTEXT-AWARE CONVERSATION</h4>
                <p>J.A.R.V.I.S maintains a persistent memory of your sessions. Every conversation builds on what came before — no re-explaining, no repetition.</p>
              </div>
            </div>
            <div className="feat-pill d2">
              <PillIcon>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#B8C4D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
              </PillIcon>
              <div className="pill-text">
                <h4>NATURAL TASK MANAGEMENT</h4>
                <p>Say "Add task: review pull requests" and it's live in your task board instantly. Complete and remove tasks the same way — just talk.</p>
              </div>
            </div>
            <div className="feat-pill d3">
              <PillIcon>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#B8C4D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </PillIcon>
              <div className="pill-text">
                <h4>SMART REMINDER ENGINE</h4>
                <p>Schedule reminders with a single phrase. The system parses time, context, and recurrence, then surfaces the right alert at the right moment.</p>
              </div>
            </div>
            <div className="feat-pill d4">
              <PillIcon>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#B8C4D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>
              </PillIcon>
              <div className="pill-text">
                <h4>PERSISTENT MEMORY CORE</h4>
                <p>Store preferences, facts, and instructions permanently. Tell J.A.R.V.I.S something once and it will know it for every session that follows.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ SECTION 3 — STATS BAR ══════════ */}
      <section id="lp-stats">
        <div className="stats-bar reveal">
          <div className="stat-cell" data-target="340">
            <span className="stat-label">Response Speed</span>
            <span className="stat-num"><span className="count">0</span><span className="stat-suffix">ms</span></span>
            <span className="stat-sub">avg. time to first token</span>
          </div>
          <div className="stat-cell" data-target="10">
            <span className="stat-label">Memory Capacity</span>
            <span className="stat-num"><span className="count">0</span><span className="stat-suffix">k+</span></span>
            <span className="stat-sub">stored memory entries</span>
          </div>
          <div className="stat-cell" data-target="128">
            <span className="stat-label">Conversation Depth</span>
            <span className="stat-num"><span className="count">0</span><span className="stat-suffix">k</span></span>
            <span className="stat-sub">context token window</span>
          </div>
          <div className="stat-cell" data-target="99">
            <span className="stat-label">Uptime</span>
            <span className="stat-num"><span className="count">0</span><span className="stat-suffix">.9%</span></span>
            <span className="stat-sub">system availability</span>
          </div>
        </div>
      </section>

      {/* ══════════ SECTION 4 — FEATURE GRID ══════════ */}
      <section id="lp-feature-grid">
        <div className="section-head reveal">
          <span className="section-overline">Core Capabilities</span>
          <h2 className="section-title">Everything your AI core needs</h2>
          <p className="section-sub">Six precision-engineered modules working in concert — from conversational intelligence to system-level automation.</p>
        </div>

        <div className="card-grid">

          <div className="feat-card d1">
            <div className="feat-card-inner">
              <div className="feat-card-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B8C4D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              </div>
              <h3>INTELLIGENT CHAT ENGINE</h3>
              <p>Powered by the latest generation of large language models, J.A.R.V.I.S delivers nuanced, thoughtful responses that understand intent, not just keywords. Multi-turn, context-rich, and always coherent.</p>
              <span className="feat-card-tag">CONVERSATIONAL AI</span>
            </div>
          </div>

          <div className="feat-card d2">
            <div className="feat-card-inner">
              <div className="feat-card-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B8C4D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20" /><path d="M12 8v4l3 3" /></svg>
              </div>
              <h3>TEMPORAL REMINDER SYSTEM</h3>
              <p>Natural language scheduling that actually works. "Remind me to deploy on Friday at 3pm" is enough — J.A.R.V.I.S parses it, stores it, and delivers a precise notification at the exact moment.</p>
              <span className="feat-card-tag">SCHEDULING</span>
            </div>
          </div>

          <div className="feat-card d3">
            <div className="feat-card-inner">
              <div className="feat-card-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B8C4D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
              </div>
              <h3>TASK &amp; GOAL TRACKING</h3>
              <p>Manage your entire workload through conversation. Create tasks, set goals with milestones, track progress, and mark completions — all without leaving the chat interface. Built for people who ship.</p>
              <span className="feat-card-tag">PRODUCTIVITY</span>
            </div>
          </div>

          <div className="feat-card d4">
            <div className="feat-card-inner">
              <div className="feat-card-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B8C4D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>
              </div>
              <h3>LONG-TERM MEMORY CORE</h3>
              <p>Unlike standard AI assistants that forget everything the moment a session ends, J.A.R.V.I.S maintains a structured memory store — your preferences, context clues, and key facts, always at hand.</p>
              <span className="feat-card-tag">PERSISTENT MEMORY</span>
            </div>
          </div>

          <div className="feat-card d5">
            <div className="feat-card-inner">
              <div className="feat-card-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B8C4D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8m-4-4v4" /></svg>
              </div>
              <h3>DESKTOP CONTROL BRIDGE</h3>
              <p>Connect J.A.R.V.I.S directly to your local machine. Execute terminal commands, open applications, inspect system state, and automate repetitive workflows — safely, with full audit logging.</p>
              <span className="feat-card-tag">SYSTEM CONTROL</span>
            </div>
          </div>

          <div className="feat-card d6">
            <div className="feat-card-inner">
              <div className="feat-card-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B8C4D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
              </div>
              <h3>USAGE ANALYTICS ENGINE</h3>
              <p>Understand how you interact with your AI assistant. Session statistics, token usage, memory growth, and activity timelines give you full visibility into your personal intelligence layer.</p>
              <span className="feat-card-tag">ANALYTICS</span>
            </div>
          </div>

        </div>
      </section>

      {/* ══════════ SECTION 5 — PIPELINE ══════════ */}
      <section id="lp-pipeline">
        <div className="pipeline-inner">
          <div className="section-head reveal">
            <span className="section-overline">System Architecture</span>
            <h2 className="section-title">From input to intelligence</h2>
            <p className="section-sub">Every message you send travels through four precision-engineered processing stages in under a second.</p>
          </div>

          <div className="pipe-nodes">
            <div className="pipe-node d1">
              <div className="hex-badge"><div className="hex-badge-bg" /><span className="hex-num">01</span></div>
              <div className="pipe-label">
                <h4>INPUT PARSE</h4>
                <p>Intent, entities, and sentiment are extracted from your natural language input</p>
              </div>
            </div>
            <div className="pipe-connector"><div className="pipe-packet" /><div className="pipe-packet" /></div>
            <div className="pipe-node d2">
              <div className="hex-badge"><div className="hex-badge-bg" /><span className="hex-num">02</span></div>
              <div className="pipe-label">
                <h4>MEMORY ENRICHMENT</h4>
                <p>Relevant context from your personal memory core is retrieved and attached to the request</p>
              </div>
            </div>
            <div className="pipe-connector"><div className="pipe-packet" /><div className="pipe-packet" /></div>
            <div className="pipe-node d3">
              <div className="hex-badge"><div className="hex-badge-bg" /><span className="hex-num">03</span></div>
              <div className="pipe-label">
                <h4>AI REASONING</h4>
                <p>The enriched prompt is processed by the language model core to generate a precise, contextual response</p>
              </div>
            </div>
            <div className="pipe-connector"><div className="pipe-packet" /><div className="pipe-packet" /></div>
            <div className="pipe-node d4">
              <div className="hex-badge"><div className="hex-badge-bg" /><span className="hex-num">04</span></div>
              <div className="pipe-label">
                <h4>ACTION DISPATCH</h4>
                <p>Side-effects — tasks, reminders, memory writes — are executed atomically and synced to your dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ SECTION 6 — CTA BANNER ══════════ */}
      <section id="lp-cta">
        <div className="cta-inner reveal">
          <h2 className="cta-title" ref={ctaTitleRef} />
          <p className="cta-sub">Your personal AI core is ready to deploy. Conversations, tasks, reminders, memory — all unified in one precision interface. No configuration required.</p>
          <div className="cta-btns">
            <Link to="/login"    className="btn-primary">INITIALIZE YOUR CORE</Link>
            <Link to="/register" className="btn-secondary">CREATE AN ACCOUNT</Link>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="lp-footer">
        <div className="footer-inner">
          <div className="foot-brand">
            <div className="nav-logo">
              <LogoSVG size={26} />
              <span className="nav-logo-text">J.A.R.V.I.S</span>
            </div>
            <p>Just A Rather Very Intelligent System. Your personal AI core — built for clarity, speed, and permanence.</p>
            <div className="foot-status" style={{ marginTop: 14 }}>
              <span className="status-dot" />
              ALL SYSTEMS OPERATIONAL
            </div>
          </div>
          <div className="foot-col">
            <h5>Interface</h5>
            <Link to="/login">Sign In</Link>
            <Link to="/register">Create Account</Link>
            <a href="#lp-features">Features</a>
            <a href="#lp-pipeline">How It Works</a>
          </div>
          <div className="foot-col">
            <h5>Modules</h5>
            <a href="#">Memory Core</a>
            <a href="#">Task Manager</a>
            <a href="#">Reminders</a>
            <a href="#">Desktop Control</a>
          </div>
          <div className="foot-col">
            <h5>Intelligence</h5>
            <a href="#">Analytics</a>
            <a href="#">Activity Log</a>
            <a href="#">Goal Tracker</a>
            <a href="#">Command History</a>
          </div>
          <div className="foot-col">
            <h5>System</h5>
            <a href="#">Status Page</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Use</a>
            <a href="#">Documentation</a>
          </div>
        </div>

        <div className="foot-bottom">
          <span className="foot-copy">© 2026 J.A.R.V.I.S AI Core · All rights reserved · v4.1</span>
          <div className="foot-socials">
            <a href="#" className="foot-social-btn" title="GitHub">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" /></svg>
            </a>
            <a href="#" className="foot-social-btn" title="Twitter">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            </a>
            <a href="#" className="foot-social-btn" title="LinkedIn">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
            </a>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 22, fontFamily: "'DM Mono',monospace", fontSize: '0.54rem', letterSpacing: '0.12em', color: '#1D2535' }}>
          J.A.R.V.I.S v4.1 · SECURE ACCESS PORTAL · SYSTEM NOMINAL
        </div>
      </footer>

    </div>
  );
}
