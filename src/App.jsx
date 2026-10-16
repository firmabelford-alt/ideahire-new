/* IdeaHire | P48 | Cięcie + ciągłe tło WebGL na całej stronie głównej | Pełny plik src/App.jsx */
import {useEffect,useLayoutEffect,useMemo,useRef,useState} from "react";
import {createPortal} from "react-dom";
import "./App.css";
import {IDEA_HIRE_PUBLIC_OFFER,helpCenterHref} from "./MarketUI";
import {Link,useNavigate} from "react-router-dom";
import {supabase} from "./supabase";
import {useSitePreferences,translateUiText,IDEA_HIRE_VISUAL_SYSTEM} from "./Preferences";

const IH47_STYLES=String.raw`:host{display:block;width:100%;font-family:Inter,Arial,sans-serif;font-synthesis:none;color:var(--ink);line-height:1.5;letter-spacing:-.015em;-webkit-font-smoothing:antialiased;}
*,*::before,*::after{box-sizing:border-box;}
:where(h1,h2,h3,h4,p,figure){margin:0;}
:where(button,input,select,a){font:inherit;color:inherit;}
:where(a){text-decoration:none;}
:where(button){cursor:pointer;}
:where(button:disabled){cursor:default;opacity:.5;}
:where(svg){display:block;}
:where(a,button,input):focus-visible{outline:3px solid var(--ink);outline-offset:5px;}
[hidden]{display:none!important;}
::selection{background:var(--ink);color:var(--paper);}
.site{position:relative;isolation:isolate;min-height:100svh;background:var(--bg);overflow-x:clip;--pad:clamp(24px,5.4vw,88px);}
.world{position:fixed;inset:0;width:100%;height:100svh;z-index:0;pointer-events:none;}
.fallback-world{position:fixed;inset:0;z-index:0;pointer-events:none;display:flex;align-items:center;justify-content:flex-end;padding:0 7vw;color:var(--material);font-size:clamp(100px,18vw,260px);font-weight:800;line-height:.8;letter-spacing:-.09em;transform:perspective(900px) rotateY(-16deg);opacity:.65;}
.fallback-world>span{display:block;}.site[data-renderer=ready] .fallback-world{display:none;}
.view{position:relative;z-index:1;}
.sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}
.skip{position:fixed;top:12px;left:16px;z-index:500;padding:12px 20px;background:var(--ink);color:var(--paper);transform:translateY(-160%);}
.skip:focus{transform:none;}
.header-slot{position:relative;z-index:40;min-height:118px;}
.masthead{display:block;width:100%;background:var(--bg);border-bottom:1px solid var(--line);}
.fee-strip{display:flex;align-items:center;justify-content:center;gap:28px;min-height:34px;padding:8px var(--pad);background:var(--ink);color:var(--paper);font-size:12px;line-height:1.4;}
.fee-strip>span{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;}.fee-strip strong{font-weight:700;}
.fee-strip svg{width:15px;height:15px;}
.navigation{display:flex;align-items:center;justify-content:space-between;gap:26px;min-height:84px;padding:16px var(--pad);}
.brand{display:inline-flex;align-items:center;gap:11px;min-height:44px;flex:0 0 auto;color:var(--ink);font-size:29px;font-weight:750;letter-spacing:-1.8px;line-height:1;}
.mark{display:grid;grid-template-columns:repeat(2,6px);grid-template-rows:repeat(2,6px);gap:3px;flex:0 0 15px;width:15px;height:15px;}
.mark i{display:block;width:6px;height:6px;background:currentColor;}.brand .mark{grid-template-columns:repeat(2,7px);grid-template-rows:repeat(2,7px);gap:4px;width:18px;height:18px;flex-basis:18px;}.brand .mark i{width:7px;height:7px;}
.brand:hover .mark i{animation:pixel-enter .5s cubic-bezier(.16,.8,.2,1) both;}.mark i:nth-child(2){animation-delay:40ms;}.mark i:nth-child(3){animation-delay:80ms;}.mark i:nth-child(4){animation-delay:120ms;}
.quick-nav{display:flex;align-items:center;gap:28px;}.quick-nav a{display:flex;align-items:center;min-height:44px;font-size:13px;font-weight:550;position:relative;}
.quick-nav a::after{content:"";position:absolute;left:0;right:0;bottom:7px;height:1px;background:currentColor;transform:scaleX(0);transform-origin:left;transition:transform .2s;}.quick-nav a:hover::after{transform:scaleX(1);}
.header-tools{display:flex;align-items:center;gap:20px;}.palette-now{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0;border:0;background:none;color:var(--ink);font-size:12px;}
.swatch{width:14px;height:14px;border:1px solid var(--line);background:#26c8cc;display:inline-block;flex:0 0 14px;}.swatch.mono{background:linear-gradient(135deg,#fff 50%,#171a18 50%);}
.avatar{display:grid;place-items:center;position:relative;width:38px;height:38px;border-radius:50%;background:var(--paper);border:1px solid var(--line);color:var(--ink);font-size:13px;font-weight:600;}.avatar img{width:100%;height:100%;border-radius:inherit;object-fit:cover;}.avatar>i{position:absolute;right:-2px;top:-2px;width:8px;height:8px;border:2px solid var(--bg);border-radius:50%;background:var(--ink);}
.login-link{display:flex;align-items:center;min-height:44px;font-size:13px;font-weight:550;}
.menu-trigger,.menu-close{display:flex;align-items:center;justify-content:center;gap:13px;min-width:44px;min-height:44px;padding:0;border:0;background:transparent;color:var(--ink);font-size:12px;font-weight:550;}
.bars{display:flex;flex-direction:column;justify-content:space-between;width:26px;height:18px;}.bars i{display:block;width:26px;height:2px;background:currentColor;}.bars[data-open=true] i:first-child{transform:translateY(8px) rotate(45deg);}.bars[data-open=true] i:nth-child(2){opacity:0;}.bars[data-open=true] i:last-child{transform:translateY(-8px) rotate(-45deg);}
.hero{position:relative;padding:25px var(--pad) 0;min-height:calc(100svh - 118px);display:flex;flex-direction:column;}
.hero-meta{display:flex;align-items:center;justify-content:space-between;gap:20px;min-height:40px;}.eyebrow{display:block;font-size:11px;font-weight:600;letter-spacing:.065em;text-transform:uppercase;line-height:1.45;}.hero-meta>.eyebrow{display:flex;align-items:center;gap:10px;}
.motion{display:flex;align-items:center;gap:8px;}.motion button{display:flex;align-items:center;justify-content:center;gap:9px;min-height:40px;min-width:40px;padding:10px 12px;border:1px solid var(--line);background:var(--paper);color:var(--ink);font-size:11px;font-weight:500;border-radius:2px;}.motion svg{width:16px;height:16px;}
.hero-stage{display:flex;align-items:center;position:relative;flex:1;min-height:550px;padding:54px 0 72px;}
.hero-copy{position:relative;z-index:2;width:51%;max-width:660px;}
.kinetic{font-size:clamp(57px,6.6vw,102px);font-weight:650;line-height:1.02;letter-spacing:-.073em;color:var(--ink);}
.kinetic>span{display:block;overflow:hidden;padding:0 .06em .07em 0;}.kinetic b{display:block;font-weight:inherit;animation:type-cut .52s cubic-bezier(.16,.85,.2,1) both;animation-delay:calc(var(--line)*60ms);}
.hero-copy>p{max-width:360px;margin-top:25px;color:var(--muted);font-size:16px;line-height:1.65;}
.hero-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:29px;}
.button{display:inline-flex;align-items:center;justify-content:space-between;gap:25px;min-height:52px;padding:15px 18px;border:1px solid var(--line);border-radius:2px;background:var(--paper);color:var(--ink);font-size:13px;font-weight:550;line-height:1.3;transition:background .2s,border-color .2s;}
.button svg,.text-link svg{width:20px;height:20px;flex:0 0 20px;transition:transform .2s;}.button:hover svg,.text-link:hover svg{transform:translateX(3px);}.button:hover{border-color:var(--ink);}
.button.primary{background:var(--accent);color:var(--on);border-color:var(--accent);}.button.primary:hover{background:var(--ink);border-color:var(--ink);color:var(--paper);}
.frame-caption{position:absolute;right:0;bottom:35px;display:flex;align-items:center;gap:14px;color:var(--ink);font-size:11px;font-weight:550;letter-spacing:.03em;}.frame-caption>span:first-child{color:var(--muted);font-size:10px;}
.chapters{position:relative;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-top:1px solid var(--line);min-height:70px;}
.film-progress{position:absolute;left:0;right:0;top:-1px;height:2px;transform-origin:left;transform:scaleX(var(--film-progress,0));background:var(--ink);}
.chapters button{display:flex;align-items:center;gap:14px;min-height:70px;padding:16px 18px 16px 0;border:0;background:none;color:var(--muted);text-align:left;font-size:12px;font-weight:500;}.chapters button>small{font-size:10px;}.chapters button .mark{margin-left:auto;opacity:0;}.chapters button[aria-current=step]{color:var(--ink);font-weight:650;}.chapters button[aria-current=step] .mark{opacity:1;}
.paths{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));margin-top:20px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--paper);}
.paths>a{display:flex;align-items:center;gap:24px;padding:34px var(--pad);min-height:146px;color:var(--ink);}.paths>a+a{border-left:1px solid var(--line);}.paths small{display:block;margin-bottom:8px;font-size:12px;color:var(--muted);}.paths strong{display:block;font-size:clamp(24px,2.2vw,34px);font-weight:550;line-height:1.15;letter-spacing:-.05em;}.paths svg{width:28px;height:28px;margin-left:auto;flex:0 0 28px;}.paths>a:hover{background:var(--surface);}
.section{padding:90px var(--pad);scroll-margin-top:25px;position:relative;}.section:not(.closing){background:var(--paper);}.section+.section{border-top:1px solid var(--line);}
.section-heading{display:grid;grid-template-columns:1fr auto;align-items:end;gap:22px 40px;margin-bottom:45px;}.section-heading .eyebrow{grid-column:1/-1;}.section-heading h2{font-size:clamp(38px,4.5vw,67px);font-weight:550;line-height:1.05;letter-spacing:-.066em;}.section-heading h2>span{display:block;}.section-heading>p{max-width:290px;font-size:15px;line-height:1.65;color:var(--muted);}
.text-link{display:inline-flex;align-items:center;gap:22px;min-height:44px;color:var(--ink);font-size:13px;font-weight:600;}
.projects{margin:76px var(--pad);padding:46px;border:1px solid var(--line);border-radius:2px;background:var(--paper);}
.projects .section-heading{margin-bottom:36px;}.projects h2{font-size:clamp(35px,3.6vw,54px);}
.job-list{border-top:1px solid var(--line);}.job{display:grid;grid-template-columns:24px minmax(0,1fr) auto 22px;align-items:center;gap:23px;min-height:110px;padding:25px 0;border-bottom:1px solid var(--line);color:var(--ink);transition:background .2s;}.job:hover,.job:focus-visible{background:var(--surface);}.job>small{font-size:11px;color:var(--muted);}.job>div{min-width:0;}.job>div>span{display:block;margin-bottom:8px;font-size:12px;color:var(--muted);line-height:1.5;}.job strong{display:block;font-size:clamp(21px,2.2vw,31px);font-weight:550;line-height:1.22;letter-spacing:-.045em;overflow-wrap:anywhere;}.job-price{font-size:14px;font-weight:550;white-space:nowrap;}.job>svg{width:22px;height:22px;}
.category-workspace{display:grid;grid-template-columns:1fr 1.12fr;gap:55px;}.category-tabs{display:flex;flex-direction:column;}.category-tabs button{display:flex;align-items:center;gap:16px;width:100%;min-height:55px;padding:14px 0;border:0;border-top:1px solid var(--line);background:none;color:var(--muted);text-align:left;}.category-tabs button>small{font-size:10px;flex:0 0 21px;}.category-tabs button>span{flex:1;font-size:14px;line-height:1.45;}.category-tabs button>svg{width:20px;height:20px;opacity:0;}.category-tabs button[aria-selected=true]{color:var(--ink);font-weight:650;}.category-tabs button[aria-selected=true]>svg{opacity:1;transform:rotate(-35deg);}
.category-detail{min-width:0;padding:35px;background:var(--surface);border:1px solid var(--line);animation:detail-enter .35s ease both;}.category-number{display:flex;justify-content:space-between;align-items:flex-start;font-size:90px;font-weight:450;letter-spacing:-.08em;line-height:1;margin-bottom:30px;}.category-number .mark{margin-top:12px;}.category-detail h3{font-size:clamp(29px,3vw,45px);font-weight:550;line-height:1.1;letter-spacing:-.055em;margin-bottom:17px;}.category-detail>p{max-width:390px;color:var(--muted);font-size:14px;line-height:1.7;margin-bottom:25px;}
.specialisms{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:26px;}.specialisms>a{display:inline-flex;align-items:center;gap:13px;min-height:43px;padding:10px 12px;border:1px solid var(--line);background:var(--paper);color:var(--ink);font-size:12px;line-height:1.4;}.specialisms>a:hover{border-color:var(--ink);}
.method{display:grid;grid-template-columns:1fr 1fr;gap:65px;}.method .section-heading{display:block;margin-bottom:0;}.method .eyebrow{margin-bottom:24px;}.method h2{font-size:clamp(36px,3.7vw,53px);}.method-list article{border-top:1px solid var(--line);}.method-list h3 button{display:flex;align-items:center;gap:17px;width:100%;min-height:92px;padding:25px 0;border:0;background:none;color:var(--ink);text-align:left;}.method-list h3 small{font-size:11px;font-weight:450;align-self:flex-start;line-height:2.2;color:var(--muted);}.method-list h3 span{flex:1;font-size:23px;font-weight:550;line-height:1.2;letter-spacing:-.04em;}.method-list h3 b{font-weight:350;font-size:24px;}.method-content{position:relative;padding:0 34px 30px 36px;animation:detail-enter .3s ease both;}.method-content p{max-width:360px;font-size:15px;line-height:1.7;color:var(--muted);}.method-content .mark{position:absolute;right:0;bottom:32px;}
.commission{display:grid;grid-template-columns:1fr 1fr;gap:70px;background:var(--surface)!important;}.commission .section-heading{display:block;margin:0;}.commission .eyebrow{margin-bottom:24px;}.commission .section-heading>p{margin-top:25px;max-width:360px;}
.fee-rate{display:flex;align-items:flex-end;justify-content:space-between;gap:22px;border-bottom:1px solid var(--line);padding-bottom:30px;margin-bottom:27px;}.fee-rate>strong{font-size:clamp(80px,9vw,128px);font-weight:550;line-height:.85;letter-spacing:-.08em;}.fee-rate>strong>span{font-size:.5em;}.fee-rate>span{font-size:12px;line-height:1.8;color:var(--muted);}.calculator label{display:flex;align-items:center;justify-content:space-between;gap:20px;font-size:14px;}.calculator output{font-size:25px;font-weight:550;letter-spacing:-.035em;}.calculator input{display:block;width:100%;height:44px;margin:16px 0;accent-color:var(--accent);cursor:pointer;}.fee-sum{display:grid;grid-template-columns:1fr 1fr;gap:22px;padding:23px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);}.fee-sum>span{font-size:12px;color:var(--muted);}.fee-sum strong{display:block;margin-top:9px;font-size:29px;font-weight:550;color:var(--ink);letter-spacing:-.045em;}.calculator>p{font-size:12px;color:var(--muted);line-height:1.7;margin-top:18px;}
.closing{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:560px;text-align:center;background:var(--bg);}.closing>.mark{margin-bottom:30px;}.closing h2{font-size:clamp(48px,7.6vw,110px);font-weight:550;line-height:1;letter-spacing:-.075em;margin-bottom:35px;}.closing h2>span{display:block;}
.footer{display:grid;grid-template-columns:1fr 1fr auto;gap:40px;padding:45px var(--pad) 65px;border-top:1px solid var(--line);background:var(--paper);color:var(--ink);}.footer p{max-width:260px;margin-top:15px;color:var(--muted);font-size:13px;line-height:1.65;}.footer>nav{display:grid;grid-template-columns:1fr 1fr;gap:3px 24px;}.footer nav>a{display:flex;align-items:center;min-height:40px;font-size:12px;}.footer>span{margin-top:15px;font-size:11px;white-space:nowrap;color:var(--muted);}
.menu{position:fixed;inset:0;z-index:1000;overflow:auto;overscroll-behavior:contain;background:var(--bg);color:var(--ink);padding:24px var(--pad,clamp(24px,5.4vw,88px)) 50px;animation:menu-curtain .45s cubic-bezier(.16,.85,.2,1) both;}
.menu-top{display:flex;justify-content:space-between;align-items:center;padding-bottom:25px;border-bottom:1px solid var(--line);}.menu-body{display:grid;grid-template-columns:1.5fr 1fr;gap:8vw;max-width:1500px;margin:50px auto 0;}.menu-links{display:flex;flex-direction:column;margin-top:20px;}.menu-links>a{display:flex;align-items:center;gap:22px;min-height:88px;padding:20px 0;border-bottom:1px solid var(--line);color:var(--ink);animation:menu-item .55s cubic-bezier(.16,.85,.2,1) both;animation-delay:calc(var(--index)*45ms);}.menu-links>a>small{font-size:11px;color:var(--muted);align-self:flex-start;margin-top:9px;}.menu-links>a>span{flex:1;font-size:clamp(32px,4vw,60px);font-weight:500;letter-spacing:-.06em;line-height:1.1;}.menu-links>a>svg{width:27px;height:27px;}
.template-switch{display:flex;flex-direction:column;gap:10px;margin:25px 0;}.template-switch>button{display:flex;align-items:center;gap:14px;width:100%;min-height:56px;padding:14px 16px;border:1px solid var(--line);background:var(--paper);color:var(--ink);font-size:14px;text-align:left;}.template-switch>button[aria-pressed=true]{border-color:var(--ink);background:var(--surface);}.template-switch>button[aria-pressed=true]::after{content:"✓";margin-left:auto;}
.menu-options{display:grid;grid-template-columns:1fr 1fr;gap:12px;}.menu-options>button{display:flex;align-items:center;justify-content:space-between;gap:15px;min-height:50px;padding:13px 15px;border:1px solid var(--line);background:var(--paper);color:var(--ink);font-size:13px;}.menu-options svg{width:20px;height:20px;}.menu-account-link,.menu-logout{display:flex;align-items:center;gap:15px;width:100%;min-height:52px;padding:15px 0;border:0;border-bottom:1px solid var(--line);background:none;color:var(--ink);font-size:14px;}.menu-account-link{margin-top:25px;}.menu-account-link svg,.menu-logout svg{width:20px;height:20px;margin-left:auto;}.menu-account-link i{width:6px;height:6px;background:var(--ink);border-radius:50%;}.menu-settings>p{max-width:280px;margin-top:40px;color:var(--muted);font-size:14px;line-height:1.7;}.menu-settings>.mark{margin-top:25px;}
[data-reveal=waiting]{opacity:0;transform:translateY(30px);}[data-reveal]{transition:opacity .6s ease,transform .7s cubic-bezier(.16,.85,.2,1);}
.site[data-paused=true] *,.site[data-paused=true] *::before,.site[data-paused=true] *::after{animation-play-state:paused!important;}
@keyframes type-cut{from{transform:translateY(105%) rotate(2deg);opacity:.3;}to{transform:none;opacity:1;}}
@keyframes detail-enter{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
@keyframes pixel-enter{from{transform:scale(.1) translateY(5px);opacity:0;}to{transform:none;opacity:1;}}
@keyframes menu-curtain{from{clip-path:inset(0 0 100% 0);}to{clip-path:inset(0);}}
@keyframes menu-item{from{transform:translateY(30px);opacity:0;}to{transform:none;opacity:1;}}
@media(min-width:1700px){.site{--pad:max(80px,calc((100vw - 1500px)/2));}}
@media(max-width:1120px){.quick-nav{gap:19px;}.header-tools{gap:15px;}.palette-now>span:last-child{display:none;}.hero-copy{width:57%;}.hero-copy>p{max-width:330px;}.hero-actions{gap:8px;}.button{padding:14px 15px;gap:15px;font-size:12px;}.category-workspace{gap:35px;}.method,.commission{gap:42px;}.projects{padding:35px;}.menu-body{gap:55px;}}
@media(max-width:820px){
 .site{--pad:26px;}.header-slot{min-height:106px;}.navigation{min-height:72px;padding:13px var(--pad);}.brand{font-size:27px;}.quick-nav{display:none;}.fee-strip{gap:20px;padding:8px 20px;font-size:11px;}.fee-strip .fee-description{display:none;}.menu-trigger>span:first-child{display:none;}.hero{padding-top:20px;}.hero-meta{min-height:40px;}.hero-meta>.eyebrow{font-size:10px;}.motion button{font-size:10px;padding:10px;min-height:40px;}.hero-stage{align-items:flex-start;min-height:790px;padding-top:48px;padding-bottom:100px;}.hero-copy{width:100%;max-width:520px;}.kinetic{font-size:clamp(54px,8vw,74px);}.hero-copy>p{font-size:15px;max-width:340px;margin-top:20px;}.hero-actions{margin-top:24px;}.hero-actions>.button{font-size:13px;min-height:52px;}.frame-caption{bottom:25px;right:0;}.chapters button{font-size:11px;gap:10px;}.chapters button .mark{display:none;}
 .paths>a{padding:28px 26px;gap:15px;min-height:125px;}.paths strong{font-size:24px;}.paths small{font-size:11px;}.paths .mark{display:none;}.paths svg{width:24px;height:24px;flex-basis:24px;}.section{padding-top:75px;padding-bottom:75px;}.section-heading h2{font-size:45px;}.section-heading>p{font-size:14px;max-width:220px;}.projects{margin-top:60px;margin-bottom:60px;padding:30px;}.projects h2{font-size:41px;}.job{gap:16px;}.job strong{font-size:24px;}.job-price{font-size:13px;}.category-workspace{gap:25px;}.category-tabs button>span{font-size:13px;}.category-detail{padding:27px;}.category-number{font-size:76px;}.category-detail h3{font-size:32px;}.category-detail>p{font-size:13px;}.specialisms>a{font-size:11px;}.method,.commission{grid-template-columns:1fr;gap:35px;}.method h2{font-size:44px;}.commission .section-heading>p{max-width:440px;}.closing{min-height:480px;}.closing h2{font-size:70px;}.footer{grid-template-columns:1fr 1fr;gap:30px;}.footer>span{grid-column:1/-1;margin-top:0;}.footer>nav{grid-template-columns:1fr;}
 .menu{padding-left:26px;padding-right:26px;}.menu-body{grid-template-columns:1.2fr 1fr;gap:35px;margin-top:35px;}.menu-links>a{gap:14px;min-height:78px;}.menu-links>a>span{font-size:33px;}.menu-options{grid-template-columns:1fr;}
}
@media(max-width:560px){
 .site{--pad:22px;}.navigation{gap:12px;}.brand{font-size:26px;gap:9px;}.brand .mark{transform:scale(.9);}.header-tools{gap:13px;}.palette-now{min-width:28px;}.login-link{font-size:12px;}.avatar{width:35px;height:35px;font-size:12px;}.hero-meta>.eyebrow>.mark{display:none;}.hero-meta>.eyebrow{font-size:10px;max-width:155px;}.motion{gap:6px;}.motion button{font-size:10px;padding:9px;gap:7px;}.motion svg{width:15px;height:15px;}.hero-stage{min-height:760px;padding-top:35px;}.hero-copy{max-width:100%;}.kinetic{font-size:clamp(47px,11.2vw,63px);line-height:1.03;}.hero-copy>p{font-size:15px;line-height:1.6;max-width:300px;margin-top:17px;}.hero-actions{display:grid;grid-template-columns:1fr;max-width:310px;gap:8px;margin-top:20px;}.hero-actions>.button{font-size:13px;padding:14px 16px;min-height:50px;}.frame-caption{bottom:20px;font-size:10px;gap:10px;}.frame-caption>span:first-child{font-size:9px;}.chapters{min-height:68px;}.chapters button{flex-direction:column;align-items:flex-start;gap:7px;min-height:68px;padding:14px 6px 14px 0;font-size:10px;}.chapters button>small{font-size:9px;}
 .paths{grid-template-columns:1fr;margin-top:16px;}.paths>a{min-height:112px;padding:25px 22px;gap:18px;}.paths>a+a{border-left:0;border-top:1px solid var(--line);}.paths .mark{display:grid;}.paths strong{font-size:26px;}.paths small{font-size:12px;}.section{padding-top:60px;padding-bottom:60px;}.section-heading{grid-template-columns:1fr;gap:18px;margin-bottom:32px;}.section-heading h2,.method h2{font-size:38px;}.section-heading>p{max-width:300px;}.eyebrow{font-size:11px;}.projects{margin:50px 14px;padding:25px 20px;}.projects h2{font-size:34px;}.projects .section-heading{margin-bottom:28px;}.job{grid-template-columns:18px minmax(0,1fr) 20px;gap:12px;align-items:start;padding:24px 0;min-height:135px;}.job>small{margin-top:4px;font-size:10px;}.job>div>span{font-size:11px;line-height:1.5;}.job strong{font-size:23px;}.job-price{grid-column:2;grid-row:2;font-size:13px;}.job>svg{grid-column:3;grid-row:1;align-self:center;width:20px;height:20px;}.category-workspace{grid-template-columns:1fr;gap:24px;}.category-tabs{display:grid;grid-template-columns:1fr 1fr;gap:0 17px;}.category-tabs button{min-height:66px;padding:13px 0;gap:8px;}.category-tabs button>small{flex-basis:18px;font-size:10px;}.category-tabs button>span{font-size:12px;line-height:1.4;}.category-tabs button>svg{display:none;}.category-detail{padding:26px 23px;}.category-number{font-size:72px;margin-bottom:25px;}.category-detail h3{font-size:32px;}.category-detail>p{font-size:14px;}.specialisms>a{min-height:44px;font-size:12px;padding:10px;gap:9px;}.category-detail>.button{width:100%;font-size:13px;}.method-list h3 button{min-height:85px;gap:15px;}.method-list h3 span{font-size:22px;}.method-content{padding-left:30px;}.method-content p{font-size:14px;}.fee-rate>strong{font-size:96px;}.fee-rate>span{font-size:11px;}.calculator output{font-size:24px;}.fee-sum strong{font-size:27px;}.closing{min-height:430px;}.closing h2{font-size:49px;}.closing>.button{min-width:185px;font-size:14px;}.footer{grid-template-columns:1fr;padding-bottom:50px;gap:30px;}.footer>nav{grid-template-columns:1fr 1fr;gap:0 14px;}.footer nav>a{font-size:12px;min-height:44px;}.footer p{font-size:13px;}.footer>span{font-size:11px;}
 .menu{padding:20px 22px 40px;}.menu-top{padding-bottom:18px;}.menu-body{grid-template-columns:1fr;gap:36px;margin-top:28px;}.menu-links{margin-top:15px;}.menu-links>a{min-height:73px;padding:18px 0;}.menu-links>a>span{font-size:34px;}.menu-links>a>small{font-size:10px;margin-top:6px;}.menu-links>a>svg{width:23px;height:23px;}.template-switch{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:20px 0;}.template-switch>button{min-height:54px;padding:13px 11px;gap:9px;font-size:12px;}.menu-options{grid-template-columns:1fr 1fr;}.menu-options>button{font-size:12px;padding:13px 11px;}.menu-settings>p{font-size:14px;margin-top:30px;}
}
@media(max-width:360px){.site{--pad:16px;}.navigation{gap:8px;}.header-tools{gap:8px;}.login-link{display:none;}.hero-meta>.eyebrow{font-size:9px;max-width:130px;}.motion button{font-size:9px;padding:8px;}.hero-stage{min-height:780px;}.kinetic{font-size:44px;}.hero-copy>p{font-size:14px;}.chapters button{font-size:9px;}.paths>a{padding-left:16px;padding-right:16px;}.paths strong{font-size:24px;}.menu-links>a>span{font-size:30px;}.template-switch>button{font-size:11px;}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important;}[data-reveal]{opacity:1!important;transform:none!important;}}
/* P47 — ciągły, tonalny dół. Duża typografia i sceny w prawdziwej perspektywie. */
:host{font-size:16px;}
.site{background:var(--bg);}
.fee-strip{background:var(--surface);color:var(--ink);min-height:36px;font-size:12px;gap:30px;}
.fee-strip .mark{width:12px;height:12px;grid-template-columns:repeat(2,5px);grid-template-rows:repeat(2,5px);gap:2px;flex-basis:12px;}.fee-strip .mark i{width:5px;height:5px;}
.masthead{background:var(--bg);}.navigation{min-height:88px;}.brand{font-size:29px;}.quick-nav{gap:30px;}.header-slot{min-height:124px;}
.swatch{background:#29c6c7;}.swatch.mono{background:linear-gradient(135deg,#f6f5ef 50%,#151c1a 50%);}
.intro-film{padding:0;}.ih43-film{margin-bottom:0!important;}.film-underbar{display:flex;align-items:center;justify-content:space-between;gap:25px;min-height:76px;padding:20px var(--pad);border-bottom:1px solid var(--line);font-size:12px;}.film-underbar>span{display:flex;align-items:center;gap:12px;}.film-underbar>a{display:flex;align-items:center;gap:16px;font-weight:600;min-height:40px;}.film-underbar svg{width:20px;height:20px;}
.lower-heading{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:30px var(--pad) 0;}.lower-heading .eyebrow{font-size:11px;}.pause-all{display:inline-flex;align-items:center;gap:9px;min-height:44px;padding:9px 12px;border:1px solid var(--line);background:none;color:var(--ink);font-size:11px;}.pause-all svg{width:15px;height:15px;}
.chapter{padding:80px var(--pad);scroll-margin-top:24px;border-bottom:1px solid var(--line);background:var(--bg);}
.chapter .section-heading{margin-bottom:36px;grid-template-columns:minmax(0,1fr) minmax(160px,280px);align-items:end;gap:22px 50px;}.chapter .section-heading h2{font-size:clamp(43px,4.8vw,74px);font-weight:600;letter-spacing:-.065em;line-height:1.04;}.chapter .section-heading .eyebrow{grid-column:1/-1;}.chapter .section-heading>p{max-width:280px;font-size:15px;line-height:1.65;color:var(--muted);}.chapter .section-heading>.text-link{justify-self:end;}
.chapter.projects{margin:0;border-radius:0;border:0;border-bottom:1px solid var(--line);padding:70px var(--pad) 85px;background:var(--bg);}
.project-stage,.fee-stage,.process-stage{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);align-items:center;gap:40px;}
.space{position:relative;height:620px;min-width:0;isolation:isolate;touch-action:pan-y;}.space>canvas{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;}.space-fallback{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:30px;color:var(--ink);font-size:100px;font-weight:800;line-height:.85;letter-spacing:-.08em;transform:perspective(900px) rotateY(-15deg);}.space-fallback>span:last-child{font-size:60px;}.space[data-renderer=ready] .space-fallback{display:none;}
.job-list{border:0;}.job{grid-template-columns:22px minmax(0,1fr) 22px;gap:18px;padding:27px 0;min-height:142px;border-top:1px solid var(--line);border-bottom:0;}.job:last-of-type{border-bottom:1px solid var(--line);}.job>small{align-self:start;margin-top:6px;font-size:11px;}.job>div>span{font-size:12px;margin-bottom:10px;line-height:1.5;}.job strong{font-size:clamp(23px,2.4vw,37px);font-weight:600;letter-spacing:-.045em;line-height:1.2;}.job .job-price{display:block;grid-column:auto;grid-row:auto;margin:14px 0 0;font-size:14px;color:var(--ink);}.job:hover,.job:focus-visible{background:var(--surface);}.caption{font-size:12px;line-height:1.65;color:var(--muted);margin-top:22px;max-width:420px;}
.category-stage{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:70px;align-items:center;}.category-tabs button{min-height:56px;padding:14px 0;gap:15px;}.category-tabs button>span{font-size:14px;}.category-tabs button[aria-selected=true]>svg{transform:rotate(-35deg);}.category-tabs button:hover{color:var(--ink);}.category-detail{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:70px;margin-top:30px;padding:35px 0 0;border:0;border-top:1px solid var(--line);background:none;animation:detail-enter .3s ease;}.category-detail h3{font-size:clamp(29px,3vw,43px);margin:20px 0 14px;font-weight:600;}.category-detail p{max-width:360px;font-size:14px;line-height:1.65;color:var(--muted);}.specialisms>a{background:var(--bg);font-size:12px;min-height:44px;}.specialisms>a:hover{background:var(--surface);}.specialisms{gap:8px;margin-bottom:25px;}
.chapter.commission{display:block;background:var(--bg)!important;}.fee-stage{grid-template-columns:minmax(0,.88fr) minmax(0,1.12fr);gap:65px;}.fee-stage>.space{height:720px;}.fee-rate{padding-bottom:30px;margin-bottom:28px;}.fee-rate>strong{font-size:clamp(100px,11vw,160px);font-weight:600;}.fee-rate>span{font-size:13px;line-height:1.8;}.calculator label{font-size:14px;align-items:center;}.budget-field{display:inline-flex;align-items:center;gap:7px;padding:7px 0;border-bottom:1px solid var(--ink);}.budget-field input{width:115px;min-width:0;padding:0;border:0;background:transparent;color:var(--ink);font-size:30px;font-weight:600;line-height:1.2;letter-spacing:-.05em;}.budget-field>span{font-size:13px;}.budget-field input::-webkit-inner-spin-button,.budget-field input::-webkit-outer-spin-button{-webkit-appearance:none;margin:0;}.budget-field input[type=number]{-moz-appearance:textfield;}.calculator .budget-range{width:100%;height:44px;margin:18px 0 12px;accent-color:var(--ink);background:transparent;}.budget-presets{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:27px;}.budget-presets>button{min-height:43px;padding:8px 5px;border:1px solid var(--line);background:transparent;color:var(--ink);font-size:12px;}.budget-presets>button[aria-pressed=true],.budget-presets>button:hover{border-color:var(--ink);background:var(--surface);}.fee-sum{display:flex;flex-direction:column;gap:0;padding:0;border:0;}.fee-sum>div{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:18px 0;border-top:1px solid var(--line);}.fee-sum>div>span{font-size:13px;color:var(--muted);}.fee-sum strong{margin:0;font-size:24px;font-weight:600;color:var(--ink);white-space:nowrap;}.fee-sum>.fee-total{padding-top:22px;border-bottom:1px solid var(--line);padding-bottom:22px;}.fee-total>span{color:var(--ink)!important;}.fee-total strong{font-size:33px;}.calculator>.caption{font-size:12px;line-height:1.65;}
.chapter.method{display:block;}.process-stage{grid-template-columns:minmax(0,.88fr) minmax(0,1.12fr);gap:65px;}.process-tabs{display:flex;flex-direction:column;}.process-tabs>button{display:block;width:100%;padding:26px 0;text-align:left;color:var(--muted);border:0;border-top:1px solid var(--line);background:none;}.process-tabs>button:last-child{border-bottom:1px solid var(--line);}.process-tabs>button[aria-selected=true]{color:var(--ink);}.step-index{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;font-size:12px;}.step-index .mark{opacity:0;}.process-tabs>button[aria-selected=true] .mark{opacity:1;}.process-tabs strong{display:block;font-size:clamp(25px,2.7vw,40px);line-height:1.15;font-weight:550;letter-spacing:-.05em;}.process-tabs p{max-width:360px;margin-top:18px;font-size:15px;line-height:1.7;color:var(--muted);animation:detail-enter .3s ease;}
.closing{min-height:490px;padding:80px var(--pad);background:var(--bg);border-bottom:1px solid var(--line);}.closing h2{font-size:clamp(55px,8.5vw,124px);font-weight:650;letter-spacing:-.075em;}.closing .closing-actions{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;}.closing>.mark{margin-bottom:30px;}.paths{margin:0;border:0;background:var(--bg);}.paths>a{padding:35px var(--pad);border-bottom:1px solid var(--line);background:var(--bg);}.paths>a+a{border-left:1px solid var(--line);}.footer{background:var(--bg);border-top:0;}.menu{background:var(--bg);}.template-switch>button,.menu-options>button{background:var(--bg);}.template-switch>button[aria-pressed=true]{background:var(--surface);}.button{background:var(--bg);}.button.primary{background:var(--ink);color:var(--on);border-color:var(--ink);}
@media(max-width:1120px){.chapter .section-heading h2{font-size:55px;}.project-stage,.fee-stage,.process-stage{gap:30px;}.category-stage,.category-detail{gap:40px;}.space{height:550px;}.fee-stage>.space{height:650px;}.quick-nav{gap:20px;}.chapter{padding-top:65px;padding-bottom:65px;}.chapter.projects{padding-top:60px;padding-bottom:65px;}.job strong{font-size:29px;}}
@media(max-width:820px){.header-slot{min-height:108px;}.navigation{min-height:72px;}.chapter{padding-top:60px;padding-bottom:60px;}.chapter.projects{padding-top:55px;padding-bottom:60px;}.chapter .section-heading{gap:20px 25px;}.chapter .section-heading h2{font-size:43px;}.chapter .section-heading>p{font-size:14px;}.project-stage,.fee-stage,.process-stage{gap:20px;grid-template-columns:minmax(0,1fr) minmax(0,1fr);}.space{height:510px;}.fee-stage>.space{height:580px;}.category-stage{gap:30px;grid-template-columns:minmax(0,1fr) minmax(0,1fr);}.category-tabs button>span{font-size:13px;}.category-tabs button{gap:11px;}.category-detail{gap:30px;}.fee-rate{gap:15px;}.fee-rate>strong{font-size:91px;}.fee-rate>span{font-size:11px;}.budget-field input{width:95px;font-size:27px;}.calculator label{font-size:13px;}.fee-sum strong{font-size:21px;}.fee-total strong{font-size:28px;}.process-tabs strong{font-size:28px;}.process-tabs p{font-size:14px;}.closing{min-height:430px;}.closing h2{font-size:75px;}.film-underbar{min-height:72px;font-size:11px;}}
@media(max-width:650px){.chapter .section-heading{grid-template-columns:1fr;gap:19px;}.chapter .section-heading h2{font-size:clamp(34px,8.9vw,48px);}.chapter .section-heading>.text-link{justify-self:start;}.project-stage,.fee-stage,.process-stage{grid-template-columns:1fr;gap:0;}.space{height:460px;margin:12px -12px 0;}.project-stage>.space{order:-1;margin-top:-15px;margin-bottom:15px;}.job{min-height:118px;padding:24px 0;}.job strong{font-size:27px;}.job .job-price{font-size:14px;margin-top:13px;}.category-stage{display:flex;flex-direction:column;gap:20px;}.category-stage>.space{width:calc(100% + 24px);height:430px;margin-top:-25px;}.category-tabs{display:grid;grid-template-columns:1fr 1fr;gap:0 20px;width:100%;}.category-tabs button{min-height:67px;padding:14px 0;gap:8px;}.category-tabs button>span{font-size:12px;line-height:1.45;}.category-tabs button>small{font-size:10px;flex-basis:18px;}.category-tabs button>svg{display:none;}.category-detail{grid-template-columns:1fr;gap:25px;margin-top:28px;padding-top:27px;}.category-detail h3{font-size:32px;margin-top:18px;}.category-detail p{font-size:14px;}.specialisms>a{font-size:12px;}.fee-stage>.space{height:460px;order:-1;margin-top:-24px;margin-bottom:20px;}.fee-rate>strong{font-size:116px;}.fee-rate>span{font-size:12px;}.calculator label{font-size:14px;}.budget-field input{width:125px;font-size:33px;}.fee-sum strong{font-size:25px;}.fee-total strong{font-size:34px;}.process-stage>div:last-child{order:-1;}.process-stage .space{height:420px;margin-top:-25px;margin-bottom:15px;}.process-tabs strong{font-size:29px;}.process-tabs p{max-width:100%;font-size:15px;}.process-tabs>button{padding:25px 0;}.closing{min-height:425px;padding-top:65px;padding-bottom:65px;}.closing h2{font-size:clamp(47px,11vw,66px);}.closing-actions{width:100%;}.closing-actions>.button{flex:1;min-width:155px;font-size:13px;}.paths strong{font-size:27px;}.film-underbar{align-items:flex-start;gap:14px;padding-top:20px;padding-bottom:20px;}.film-underbar>span{max-width:220px;font-size:11px;line-height:1.6;}.film-underbar>span>.mark{display:none;}.film-underbar>a{font-size:11px;gap:8px;white-space:nowrap;}.lower-heading{padding-top:25px;}.lower-heading .eyebrow{font-size:10px;}.pause-all{font-size:10px;padding:9px;gap:7px;}.chapter{padding-top:55px;padding-bottom:55px;}.chapter.projects{padding-top:45px;padding-bottom:55px;}}
@media(max-width:360px){.chapter .section-heading h2{font-size:32px;}.space{height:410px;}.category-stage>.space{height:395px;}.fee-stage>.space{height:430px;}.film-underbar>span{max-width:175px;}.fee-sum strong{font-size:22px;}.fee-total strong{font-size:30px;}.fee-rate>strong{font-size:103px;}.closing h2{font-size:46px;}}

/* P48 — ciągła scena od nagłówka po stopkę, bez odcinających ją pełnych teł. */
.ih48-world{position:fixed;inset:0;z-index:0;width:100%;height:100%;pointer-events:none;overflow:hidden;background:var(--bg);}
.ih48-world>canvas{display:block;width:100%;height:100%;}
.ih48-world[data-renderer=fallback]{background:var(--bg);}
.view{position:relative;z-index:1;}
.ih47-home.ih47-home .ih43-film,.ih47-home.ih47-home .ih43-film[data-classic=true]{background:transparent!important;}
.chapter,.chapter.projects,.chapter.commission,.chapter.method,.closing,.paths,.paths>a,.footer{background:transparent!important;}
.chapter{position:relative;}
.chapter .section-heading{position:relative;padding:24px 25px;margin-left:-25px;margin-right:-25px;background:color-mix(in srgb,var(--bg) 89%,transparent);border-radius:3px;}
.project-stage>.job-list,.category-tabs,.calculator,.process-tabs{position:relative;padding:22px 25px;background:color-mix(in srgb,var(--bg) 94%,transparent);border:1px solid color-mix(in srgb,var(--line) 65%,transparent);border-radius:3px;}
.category-detail{padding:30px 25px;background:color-mix(in srgb,var(--bg) 94%,transparent);border:1px solid color-mix(in srgb,var(--line) 65%,transparent);border-radius:3px;}
.film-underbar,.lower-heading,.footer,.paths>a{background:color-mix(in srgb,var(--bg) 93%,transparent)!important;}
.lower-heading{padding-bottom:25px;}
.closing{position:relative;isolation:isolate;}
.closing::before{content:"";position:absolute;inset:35px var(--pad);z-index:-1;background:color-mix(in srgb,var(--bg) 90%,transparent);border:1px solid color-mix(in srgb,var(--line) 65%,transparent);border-radius:3px;}
.masthead{background:color-mix(in srgb,var(--bg) 97%,transparent);}
.fee-strip{background:color-mix(in srgb,var(--bg) 94%,transparent);}
.space{border:0;}
@media(max-width:820px){.chapter .section-heading{padding:20px;margin-left:-14px;margin-right:-14px;}.project-stage>.job-list,.category-tabs,.calculator,.process-tabs{padding:20px;}.category-detail{padding:25px 20px;}}
@media(max-width:650px){.category-tabs{display:grid;gap:0 17px;}.category-detail{gap:24px;}.closing::before{inset:22px 12px;}.chapter .section-heading{padding:18px 14px;margin-left:-8px;margin-right:-8px;}.space{margin-left:-10px;margin-right:-10px;}.project-stage>.job-list,.calculator,.process-tabs{padding:18px 16px;}.category-tabs{padding:16px;}.lower-heading{padding-bottom:20px;}}
`;
const IH43_STYLES=String.raw`
__IH43__ .ih43-film {--ih43-pad:28px;--ih43-bottom:101px;--ih43-button:226px;--ih43-gap:12px;--ih43-toolbar:calc(100% - 176px);position:relative!important;isolation:isolate!important;display:block!important;width:100%!important;max-width:none!important;height:clamp(710px,53vw,850px)!important;min-height:710px!important;margin:0 0 44px!important;padding:0!important;overflow:hidden!important;border:0!important;border-radius:0!important;background:var(--bg)!important;color:var(--ink)!important;font-family:Inter,Arial,sans-serif!important;text-align:left!important;box-shadow:none!important;}
__IH43__ .ih43-film,__IH43__ .ih43-film * {box-sizing:border-box!important;}
__IH43__ .ih43-film[data-classic="true"] {background:var(--bg)!important;color:var(--ink)!important;}
__IH43__ .ih43-canvas {position:absolute!important;inset:0!important;display:block!important;width:100%!important;height:100%!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;opacity:0;pointer-events:none!important;}
__IH43__ .ih43-film[data-ready="true"] .ih43-canvas {opacity:1;}
__IH43__ .ih43-film[data-failed="true"] .ih43-canvas {display:none!important;}
__IH43__ .ih43-hit {position:absolute!important;z-index:3!important;display:block!important;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;background:transparent!important;background-image:none!important;color:transparent!important;-webkit-text-fill-color:transparent!important;border:0!important;border-radius:8px!important;box-shadow:none!important;text-shadow:none!important;text-decoration:none!important;transform:none!important;transition:none!important;animation:none!important;cursor:pointer!important;touch-action:manipulation;}
__IH43__ .ih43-hit::before,__IH43__ .ih43-hit::after {content:none!important;}
__IH43__ .ih43-hit:focus-visible {outline:2px solid #fff!important;outline-offset:4px!important;box-shadow:0 0 0 7px #111!important;}
__IH43__ .ih43-hit:disabled {cursor:default!important;}
__IH43__ .ih43-control {left:calc(var(--ih43-toolbar) + var(--ih43-index) * 52px)!important;top:22px!important;width:44px!important;height:44px!important;border-radius:50%!important;}
__IH43__ .ih43-link {left:calc(var(--ih43-pad) + var(--ih43-index) * (var(--ih43-button) + var(--ih43-gap)))!important;bottom:calc(var(--ih43-bottom) - 52px)!important;width:var(--ih43-button)!important;height:52px!important;}
__IH43__ .ih43-accessible,__IH43__ .ih43-link-label {position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;clip-path:inset(50%)!important;white-space:nowrap!important;border:0!important;}
__IH43__ .ih43-film[data-failed="true"] .ih43-accessible {top:18%!important;left:var(--ih43-pad)!important;width:calc(100% - var(--ih43-pad) * 2)!important;height:auto!important;margin:0!important;overflow:visible!important;clip:auto!important;clip-path:none!important;white-space:normal!important;}
__IH43__ .ih43-film[data-failed="true"] .ih43-accessible h1 {margin:0 0 25px!important;padding:0!important;font-size:clamp(42px,7vw,102px)!important;font-weight:800!important;line-height:1.05!important;letter-spacing:-.05em!important;color:inherit!important;-webkit-text-fill-color:currentColor!important;}
__IH43__ .ih43-film[data-failed="true"] .ih43-accessible p {max-width:600px!important;margin:0 0 15px!important;font-size:14px!important;line-height:1.6!important;color:inherit!important;-webkit-text-fill-color:currentColor!important;}
__IH43__ .ih43-film[data-failed="true"] .ih43-control {display:none!important;}
__IH43__ .ih43-film[data-failed="true"] .ih43-link {display:flex!important;align-items:center!important;justify-content:center!important;background:#f4f0e5!important;border:1px solid #171717!important;color:#171717!important;-webkit-text-fill-color:#171717!important;}
__IH43__ .ih43-film[data-failed="true"] .ih43-link-label {position:static!important;width:auto!important;height:auto!important;margin:0!important;padding:8px!important;overflow:visible!important;clip:auto!important;clip-path:none!important;white-space:normal!important;font-size:12px!important;font-weight:700!important;line-height:1.4!important;text-align:center!important;}
@media(max-width:820px){__IH43__ .ih43-film {--ih43-pad:20px;--ih43-gap:10px;--ih43-button:calc((100% - 50px) / 2);--ih43-toolbar:calc(100% - 168px);height:min(820px,max(680px,calc(100svh - 96px)))!important;min-height:680px!important;margin-bottom:30px!important;}}
`.replaceAll("__IH43__",".ih47-home");

const IH43_FILM={
  "key": "01-Ciecie",
  "name": "Cięcie",
  "genre": "cut",
  "period": 44,
  "palette": {
    "paper": "#eee9df",
    "ink": "#141313",
    "accent": "#ed3625",
    "secondary": "#c8c0ac",
    "light": "#ffffff",
    "muted": "#827a70"
  },
  "shots": [
    {
      "kind": "type",
      "duration": 1.6,
      "bg": "ink",
      "motion": "slam"
    },
    {
      "kind": "type",
      "duration": 2,
      "bg": "accent",
      "motion": "side"
    },
    {
      "kind": "brief",
      "duration": 3.8,
      "bg": "ink",
      "motion": "slam"
    },
    {
      "kind": "type",
      "duration": 1.8,
      "bg": "paper",
      "motion": "side"
    },
    {
      "kind": "services",
      "duration": 3.2,
      "bg": "accent",
      "motion": "slam"
    },
    {
      "kind": "fee",
      "duration": 4.8,
      "bg": "paper",
      "motion": "slam"
    },
    {
      "kind": "type",
      "duration": 1.8,
      "bg": "ink",
      "motion": "letters"
    },
    {
      "kind": "type",
      "duration": 1.4,
      "bg": "paper",
      "motion": "side"
    },
    {
      "kind": "dialogue",
      "duration": 3.4,
      "bg": "accent",
      "motion": "slam"
    },
    {
      "kind": "type",
      "duration": 1.5,
      "bg": "ink",
      "motion": "slam"
    },
    {
      "kind": "terms",
      "duration": 3.8,
      "bg": "accent",
      "motion": "slam"
    },
    {
      "kind": "type",
      "duration": 2,
      "bg": "paper",
      "motion": "side"
    },
    {
      "kind": "pair",
      "duration": 4,
      "bg": "ink",
      "motion": "slam"
    },
    {
      "kind": "final",
      "duration": 8.9,
      "bg": "accent",
      "motion": "slam"
    }
  ],
  "pl": {
    "cta": [
      "Potrzebuję wykonawcy",
      "Szukam zlecenia"
    ],
    "subtitle": "Opisz projekt, poznaj wykonawcę i ustalcie szczegóły.",
    "disclosure": "Sekwencja pokazowa — przykładowe materiały.",
    "endTags": [
      "GRAFIKA",
      "KOD",
      "MONTAŻ"
    ],
    "ui": {
      "panel": "Opis / zakres",
      "project": "Strona Twojej marki",
      "details": [
        "Zakres strony",
        "Termin realizacji",
        "Budżet projektu"
      ],
      "note": "Projekt pokazowy",
      "fee": "Prowizja IdeaHire",
      "minimum": "min.",
      "maximum": "maks.",
      "limit": "Zlecenia do",
      "payer": "Płaci zleceniodawca.",
      "thread": "Uzgodnienia",
      "messages": [
        "Termin: piątek?",
        "Tak, dam radę."
      ],
      "prompt": "Zapiszcie zakres, kwotę i termin."
    },
    "ctaMobile": [
      "Wykonawcy",
      "Zlecenia"
    ],
    "frames": [
      [
        "MASZ",
        "POMYSŁ."
      ],
      [
        "OPISZ,",
        "CO ROBIMY."
      ],
      [
        "ZAKRES.",
        "TERMIN.",
        "BUDŻET."
      ],
      [
        "ZNAJDŹ",
        "SWOJĄ OSOBĘ."
      ],
      [
        "PROJEKT.",
        "KOD.",
        "FILM."
      ],
      [
        "JASNA PROWIZJA."
      ],
      [
        "SPRAWDŹ",
        "PORTFOLIO."
      ],
      [
        "ZŁAPCIE",
        "KONTAKT."
      ],
      [
        "USTALMY",
        "SZCZEGÓŁY."
      ],
      [
        "ZAPISZCIE",
        "USTALENIA."
      ],
      [
        "CENA.",
        "TERMIN.",
        "REZULTAT."
      ],
      [
        "MOŻNA",
        "ZACZYNAĆ."
      ],
      [
        "TWÓJ POMYSŁ.",
        "JEGO FACH.",
        "WSPÓLNA PRACA."
      ],
      [
        "Masz pomysł.",
        "Daj mu życie."
      ]
    ],
    "final": [
      "Masz pomysł.",
      "Daj mu życie."
    ]
  },
  "en": {
    "cta": [
      "Commission a task",
      "Browse listings"
    ],
    "subtitle": "Describe the project, meet the professional and agree on the details.",
    "disclosure": "Illustrative sequence — sample materials.",
    "endTags": [
      "DESIGN",
      "CODE",
      "EDITING"
    ],
    "ui": {
      "panel": "Description / scope",
      "project": "Your brand’s website",
      "details": [
        "Website scope",
        "Delivery date",
        "Project budget"
      ],
      "note": "Sample project",
      "fee": "IdeaHire service fee",
      "minimum": "min.",
      "maximum": "max.",
      "limit": "Orders up to",
      "payer": "Paid by the client.",
      "thread": "Agreement",
      "messages": [
        "Friday delivery?",
        "Yes, that works."
      ],
      "prompt": "Record the scope, price and delivery."
    },
    "ctaMobile": [
      "Hire talent",
      "Find work"
    ],
    "frames": [
      [
        "YOU HAVE",
        "AN IDEA."
      ],
      [
        "SAY WHAT",
        "YOU NEED."
      ],
      [
        "SCOPE.",
        "TIMING.",
        "BUDGET."
      ],
      [
        "FIND",
        "YOUR PERSON."
      ],
      [
        "DESIGN.",
        "CODE.",
        "FILM."
      ],
      [
        "A CLEAR FEE."
      ],
      [
        "SEE THEIR",
        "PORTFOLIO."
      ],
      [
        "START A",
        "CONVERSATION."
      ],
      [
        "LET’S AGREE",
        "THE DETAILS."
      ],
      [
        "WRITE IT",
        "DOWN."
      ],
      [
        "PRICE.",
        "TIMING.",
        "RESULT."
      ],
      [
        "READY",
        "TO BEGIN."
      ],
      [
        "YOUR IDEA.",
        "THEIR SKILLS.",
        "SHARED WORK."
      ],
      [
        "Have an idea?",
        "Bring it to life."
      ]
    ],
    "final": [
      "Have an idea?",
      "Bring it to life."
    ]
  },
  "paths": [
    "/find-talent",
    "/jobs"
  ],
  "finalStart": 35.1,
  "offer": {
    "percent": 5.5,
    "minimum": 20,
    "maximum": 229,
    "orderLimit": 10000
  }
};

/* IdeaHire P43 — montaż typografii i scen interfejsu. Canvas 2D, bez modeli 3D. */
const IH43={
  clamp:(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),
  mix:(a,b,t)=>a+(b-a)*t,
  ease(t){t=this.clamp(t);return 1-Math.pow(1-t,4);},
  smooth(t){t=this.clamp(t);return t*t*(3-2*t);},
  back(t){t=this.clamp(t);return 1+2.70158*Math.pow(t-1,3)+1.70158*Math.pow(t-1,2);},
  phase(time){
    const cycle=((time%IH43_FILM.period)+IH43_FILM.period)%IH43_FILM.period;
    let start=0;
    for(let i=0;i<IH43_FILM.shots.length;i++){const shot=IH43_FILM.shots[i];if(cycle<start+shot.duration||i===IH43_FILM.shots.length-1)return{shot,index:i,local:cycle-start,start,cycle};start+=shot.duration;}
  },
  layout(w,h){const mobile=w<=820,pad=mobile?20:Math.max(28,Math.min(72,w*.045)),gap=mobile?10:12,buttonWidth=mobile?(w-pad*2-gap)/2:226;
    return{w,h,mobile,pad,x:pad,y:84,cw:w-pad*2,ch:Math.max(250,h-244),bottom:h-101,buttonWidth,gap,toolbarX:w-pad-148,toolbarY:22};
  },
};
const IH43_MEASURE=new Map();
function ih43Contrast(a,b){const lum=s=>{const values=[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return values[0]*.2126+values[1]*.7152+values[2]*.0722;},x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
function ih43Readable(background,preferred,alternate){if(ih43Contrast(background,preferred)>=4.5)return preferred;if(ih43Contrast(background,alternate)>=4.5)return alternate;return ih43Contrast(background,"#000000")>=ih43Contrast(background,"#ffffff")?"#000000":"#ffffff";}
function ih43Path(c,x,y,w,h,r=12){r=Math.max(0,Math.min(r,w/2,h/2));c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();}
function ih43Box(c,x,y,w,h,fill,r=12,stroke=null){ih43Path(c,x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
function ih43Text(c,text,x,y,size,color,weight=600,align="left",tracking=0){
  weight=Math.round(weight/100)*100;c.font=weight+" "+size+"px Inter, Arial, sans-serif";c.fillStyle=color;c.textAlign=align;c.textBaseline="alphabetic";
  if(!tracking){c.fillText(String(text),x,y);return;}
  const chars=Array.from(String(text)),width=chars.reduce((s,ch)=>s+c.measureText(ch).width,0)+(chars.length-1)*tracking;
  let offset=align==="center"?-width/2:align==="right"?-width:0;c.textAlign="left";
  for(const ch of chars){c.fillText(ch,x+offset,y);offset+=c.measureText(ch).width+tracking;}
}
function ih43Fit(c,lines,width,height,maxSize=180,weight=900){
  weight=Math.round(weight/100)*100;
  const key=[lines.join("|"),Math.round(width),Math.round(height),maxSize,weight].join(":");if(IH43_MEASURE.has(key))return IH43_MEASURE.get(key);
  let size=Math.min(maxSize,height/(lines.length*.94));c.font=weight+" "+size+"px Inter, Arial, sans-serif";
  const measured=Math.max(1,...lines.map(line=>c.measureText(line).width));size*=Math.min(1,width/measured);
  if(IH43_MEASURE.size>400)IH43_MEASURE.clear();IH43_MEASURE.set(key,size);return size;
}
function ih43Lines(c,lines,box,options={}){
  const {x,y,w,h}=box,weight=options.weight||900,size=ih43Fit(c,lines,w,h,options.max||190,weight),lineHeight=size*.94;
  const block=lines.length*lineHeight,top=y+(h-block)*.5,progress=options.progress??1,mode=options.mode||"rise",color=options.color||"#fff";
  for(let i=0;i<lines.length;i++){
    const reveal=IH43.ease((progress-i*.065)/.78);c.save();c.globalAlpha*=IH43.clamp(reveal*1.6);
    let ox=0,oy=0,angle=0,scale=1;
    if(mode==="slam"){scale=1+(1-reveal)*2.8;angle=(1-reveal)*(i%2?.12:-.10);}
    else if(mode==="side"){ox=(1-reveal)*(i%2?1:-1)*w*1.2;angle=(1-reveal)*.08;}
    else if(mode==="letters"){
      const text=lines[i],chars=Array.from(text);c.font=weight+" "+size+"px Inter, Arial, sans-serif";let offset=0;
      for(let n=0;n<chars.length;n++){const p=IH43.ease((progress-n*.018-i*.04)/.58);c.save();c.translate(x+offset,top+(i+1)*lineHeight+(1-p)*size*.85);c.rotate((1-p)*(n%2?.2:-.2));c.globalAlpha*=p;ih43Text(c,chars[n],0,0,size,color,weight);c.restore();offset+=c.measureText(chars[n]).width;}
      c.restore();continue;
    }else oy=(1-reveal)*size*1.65;
    const align=options.align||"left",anchor=align==="center"?x+w/2:x;
    c.translate(anchor+ox,top+(i+1)*lineHeight+oy);c.rotate(angle);c.scale(scale,scale);ih43Text(c,lines[i],0,0,size,color,weight,align,-size*.045);c.restore();
  }
  return{size,top,bottom:top+block};
}
function ih43Tag(c,text,x,y,colors,angle=0,scale=1){
  c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);c.font="700 15px Inter, Arial, sans-serif";const w=c.measureText(text).width+36;ih43Box(c,-w/2,-20,w,40,colors.fill,5,colors.stroke);const ink=ih43Readable(colors.fill,colors.ink,"#ffffff");ih43Text(c,text,0,5,15,ink,700,"center");c.restore();return w;
}
function ih43Arrow(c,x,y,color,size=14){c.strokeStyle=color;c.lineWidth=1.7;c.lineCap="round";c.beginPath();c.moveTo(x-size*.45,y+size*.45);c.lineTo(x+size*.45,y-size*.45);c.moveTo(x-size*.33,y-size*.45);c.lineTo(x+size*.45,y-size*.45);c.lineTo(x+size*.45,y+size*.33);c.stroke();}
function ih43Panel(c,x,y,w,h,options={}){
  const fill=options.fill||"#f5f0e5",ink=options.ink||"#151515";c.save();c.translate(x,y);c.rotate(options.angle||0);c.scale(options.scale||1,options.scale||1);c.globalAlpha*=options.alpha??1;
  c.shadowColor="rgba(0,0,0,.18)";c.shadowBlur=26;c.shadowOffsetY=10;ih43Box(c,-w/2,-h/2,w,h,fill,10);c.shadowColor="transparent";
  c.strokeStyle=options.line||"rgba(20,20,20,.16)";c.lineWidth=1;c.beginPath();c.moveTo(-w/2+20,-h/2+43);c.lineTo(w/2-20,-h/2+43);c.stroke();
  if(options.label)ih43Text(c,options.label,-w/2+21,-h/2+28,11,ink,600);
  c.fillStyle=ink;for(let i=0;i<3;i++){c.globalAlpha*=.8;c.beginPath();c.arc(w/2-23-i*9,-h/2+24,2,0,Math.PI*2);c.fill();}c.restore();
}
function ih43Palette(classic,dark=false){
 if(classic)return{...IH43_FILM.palette,paper:"#f6f5ef",ink:"#151c1a",accent:"#727b73",secondary:"#c1c8bd",light:"#ffffff",muted:"#555f56"};
 const p=IDEA_HIRE_VISUAL_SYSTEM[dark?"turquoiseDark":"turquoise"];
 return{paper:p.paper,ink:p.ink,accent:p.bg,secondary:p.surface,light:p.on,muted:p.muted,backgrounds:{paper:p.paper,ink:p.surface,accent:p.bg,secondary:p.surface}};
}
function ih43Surface(p,mode){if(p.backgrounds)return p.backgrounds[mode]||p.backgrounds.ink;return mode==="paper"?p.paper:mode==="accent"?p.accent:mode==="secondary"?p.secondary:p.ink;}
function ih43Backdrop(c,l,p,shot,time){
 const mode=shot.bg||"ink",bg=ih43Surface(p,mode);c.save();c.globalAlpha=p.backgrounds?.72:.96;c.fillStyle=bg;c.fillRect(0,0,l.w,l.h);c.restore();
 return{bg,ink:mode==="paper"||mode==="secondary"?p.ink:p.paper};
}
function ih43Transition(c,l,p,phase){
  const duration=.32,remaining=phase.shot.duration-phase.local;if(remaining>duration||IH43_FILM.genre==="network")return;
  const progress=IH43.ease(1-remaining/duration),next=IH43_FILM.shots[(phase.index+1)%IH43_FILM.shots.length];
  const color=ih43Surface(p,next.bg);
  c.save();c.fillStyle=color;
  if(IH43_FILM.genre==="cut"){
    for(let i=0;i<7;i++){const x=l.w*i/7,shift=IH43.clamp(progress*1.35-i*.045);c.fillRect(x,-l.h+(l.h*2)*shift,l.w/7+2,l.h);}
  }else{c.translate(l.w*(1-progress),0);c.transform(1,0,-.18,1,0,0);c.fillRect(0,-10,l.w+l.h*.2,l.h+20);}
  c.restore();
}
function ih43Ui(c,l,p,s,phase){
  const bg=phase.shot.bg||"ink",surface=ih43Surface(p,bg),ink=ih43Readable(surface,p.ink,p.paper),outline=ih43Contrast(surface,"#000000")>=ih43Contrast(surface,"#ffffff")?"rgba(8,35,30,.38)":"rgba(225,250,240,.50)";
  const language=s.english?IH43_FILM.en:IH43_FILM.pl;
  const brandSize=l.mobile?19:22;ih43Text(c,"IdeaHire",l.pad,52,brandSize,ink,800);
  const progress=phase.cycle/IH43_FILM.period;c.fillStyle=outline;c.fillRect(l.pad,68,l.w-l.pad*2,1);c.fillStyle=ink;c.fillRect(l.pad,68,(l.w-l.pad*2)*progress,2);
  const icon=(index,type)=>{
    const x=l.toolbarX+index*52,y=l.toolbarY;c.save();if(s.reduced)c.globalAlpha=.4;ih43Box(c,x,y,44,44,null,22,outline);c.translate(x+22,y+22);c.strokeStyle=ink;c.lineWidth=1.5;c.lineCap="round";
    if(type==="skip"){c.beginPath();c.moveTo(-7,-7);c.lineTo(3,0);c.lineTo(-7,7);c.closePath();c.stroke();c.beginPath();c.moveTo(7,-7);c.lineTo(7,7);c.stroke();}
    else if(type==="replay"){c.beginPath();c.arc(0,0,8,-2.6,2.7);c.stroke();c.beginPath();c.moveTo(-7,-8);c.lineTo(-7,-2);c.lineTo(-1,-2);c.stroke();}
    else if(type==="pause"){if(s.paused||s.reduced){c.beginPath();c.moveTo(-4,-7);c.lineTo(7,0);c.lineTo(-4,7);c.closePath();c.stroke();}else{c.beginPath();c.moveTo(-3,-7);c.lineTo(-3,7);c.moveTo(3,-7);c.lineTo(3,7);c.stroke();}}
    else{c.beginPath();c.moveTo(-8,-3);c.lineTo(-4,-3);c.lineTo(1,-8);c.lineTo(1,8);c.lineTo(-4,3);c.lineTo(-8,3);c.closePath();c.stroke();if(s.sound){c.beginPath();c.arc(0,0,11,-.65,.65);c.stroke();}else{c.beginPath();c.moveTo(6,-4);c.lineTo(12,4);c.moveTo(12,-4);c.lineTo(6,4);c.stroke();}}
    c.restore();
  };icon(0,phase.cycle<IH43_FILM.finalStart?"skip":"replay");icon(1,"pause");icon(2,"sound");
  for(let i=0;i<2;i++){
    const x=l.pad+i*(l.buttonWidth+l.gap),y=l.bottom,hover=s.hover===i,fill=i===0?ink:null,textColor=i===0?ih43Readable(ink,p.paper,p.ink):ink;
    c.save();if(hover){c.shadowColor=ink;c.shadowBlur=14;c.globalAlpha=.95;}ih43Box(c,x,y,l.buttonWidth,52,fill,8,ink);c.shadowColor="transparent";
    const label=(l.mobile?language.ctaMobile:language.cta)[i],font=ih43Fit(c,[label],l.buttonWidth-57,22,l.mobile?12:13,650);ih43Text(c,label,x+16,y+31,font,textColor,650);ih43Arrow(c,x+l.buttonWidth-22,y+26,textColor,14);c.restore();
  }
  ih43Text(c,language.disclosure,l.pad,l.h-26,l.mobile?9:10,ink,450);
  if(!l.mobile){const stamp=String(phase.index+1).padStart(2,"0")+" / "+String(IH43_FILM.shots.length).padStart(2,"0");ih43Text(c,stamp,l.w-l.pad,l.h-26,10,ink,500,"right");}
}
function ih43Frame(c,w,h,time,s,includeUi=true){
  const clock=s.reduced?IH43_FILM.finalStart+2.5:time,l=IH43.layout(w,h),phase=IH43.phase(clock),p=ih43Palette(s.classic,s.dark);
  c.clearRect(0,0,w,h);c.save();c.beginPath();c.rect(0,0,w,h);c.clip();ih43Backdrop(c,l,p,phase.shot,time);
  c.save();c.beginPath();c.rect(0,75,w,h-195);c.clip();
  const px=s.reduced?0:(s.pointerX||0)*3,py=s.reduced?0:(s.pointerY||0)*2;c.translate(px,py);
  ih43Scene(c,l,p,phase,s,clock);c.restore();
  if(!s.reduced){c.save();c.beginPath();c.rect(0,75,w,h-195);c.clip();ih43Transition(c,l,p,phase);c.restore();}
  if(includeUi)ih43Ui(c,l,p,s,phase);
  c.restore();return phase;
}
function ih43Start(canvas,host,state,report){
  let frame=0,disposed=false,visible=true,last=0,lastDraw=0,dirty=true,width=0,height=0,ratio=1,previous=-1,observer,resizeObserver,c,audio=null,sound=false;
  const listeners=[],audioNodes=new Set();
  const listen=(node,type,fn,opts)=>{node.addEventListener(type,fn,opts);listeners.push(()=>node.removeEventListener(type,fn,opts));};
  const stopSound=()=>{for(const node of audioNodes){try{node.stop();}catch{}}audioNodes.clear();};
  function hit(index){if(!sound||!audio||audio.state!=="running"||state.current.paused||state.current.reduced)return;
    try{const oscillator=audio.createOscillator(),gain=audio.createGain(),now=audio.currentTime;oscillator.type=IH43_FILM.genre==="network"?"sine":"triangle";oscillator.frequency.setValueAtTime(150+index%3*35,now);oscillator.frequency.exponentialRampToValueAtTime(52+index%2*18,now+.12);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.09,now+.006);gain.gain.exponentialRampToValueAtTime(.0001,now+.17);oscillator.connect(gain);gain.connect(audio.destination);audioNodes.add(oscillator);oscillator.onended=()=>{audioNodes.delete(oscillator);oscillator.disconnect();gain.disconnect();};oscillator.start(now);oscillator.stop(now+.19);}catch{sound=false;state.current.sound=false;report({sound:false});}
  }
  const destroy=()=>{if(disposed)return;disposed=true;cancelAnimationFrame(frame);frame=0;listeners.forEach(fn=>fn());observer?.disconnect();resizeObserver?.disconnect();stopSound();if(audio&&audio.state!=="closed")audio.close().catch(()=>{});};
  const resize=()=>{const rect=host.getBoundingClientRect();if(!rect.width||!rect.height)return;width=rect.width;height=rect.height;ratio=Math.min(window.devicePixelRatio||1,width<=820?1.45:1.6);const budget=width<=820?700000:1800000,px=width*height*ratio*ratio;if(px>budget)ratio*=Math.sqrt(budget/px);canvas.width=Math.max(1,Math.floor(width*ratio));canvas.height=Math.max(1,Math.floor(height*ratio));
    const l=IH43.layout(width,height);for(const[key,value]of Object.entries({pad:l.pad,bottom:height-l.bottom,button:l.buttonWidth,gap:l.gap,toolbar:l.toolbarX}))host.style.setProperty("--ih43-"+key,value+"px");dirty=false;};
  const render=now=>{frame=0;if(disposed||!visible||document.hidden)return;try{
    const s=state.current,interval=width<=820?1000/30:1000/45;if(!s.paused&&!s.reduced&&lastDraw&&now-lastDraw<interval-1){frame=requestAnimationFrame(render);return;}
    const dt=last?Math.min(.1,(now-last)/1000):0;last=now;lastDraw=now;if(dirty)resize();if(!width||!height){frame=requestAnimationFrame(render);return;}
    if(!s.paused&&!s.reduced)s.time+=dt;
    c.setTransform(ratio,0,0,ratio,0,0);const phase=ih43Frame(c,width,height,s.time,s,true);
    if(phase.index!==previous){previous=phase.index;report({scene:phase.index});hit(phase.index);}if(!s.ready){s.ready=true;report({ready:true});}
    if(!s.paused&&!s.reduced)frame=requestAnimationFrame(render);
  }catch{destroy();report({failed:true,ready:true});}};
  const wake=()=>{if(!disposed&&visible&&!document.hidden&&!frame){last=0;lastDraw=0;frame=requestAnimationFrame(render);}};
  try{
    c=canvas.getContext("2d",{alpha:true});if(!c)throw new Error("ih43_canvas");
    listen(window,"resize",()=>{dirty=true;wake();},{passive:true});listen(document,"visibilitychange",()=>{last=0;lastDraw=0;if(document.hidden){cancelAnimationFrame(frame);frame=0;stopSound();}else wake();});
    if(typeof ResizeObserver!=="undefined"){resizeObserver=new ResizeObserver(()=>{dirty=true;wake();});resizeObserver.observe(host);}
    if(typeof IntersectionObserver!=="undefined"){observer=new IntersectionObserver(entries=>{visible=!!entries[0]?.isIntersecting;if(visible)wake();else{cancelAnimationFrame(frame);frame=0;last=0;lastDraw=0;stopSound();}},{rootMargin:"100px"});observer.observe(host);}
    ih47Fonts().then(()=>{if(!disposed){IH43_MEASURE.clear();wake();}}).catch(()=>{});
    resize();wake();
    return{wake,destroy,mute(){sound=false;state.current.sound=false;stopSound();wake();},replay(){state.current.time=0;previous=-1;wake();},finale(){state.current.time=IH43_FILM.finalStart+1.6;previous=-1;wake();},async toggleSound(){if(disposed||state.current.reduced)return false;try{if(!audio){const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return false;audio=new Context();}if(!sound){await audio.resume();if(disposed||state.current.reduced)return false;sound=true;}else{sound=false;stopSound();}state.current.sound=sound;wake();return sound;}catch{return false;}}};
  }catch{destroy();report({failed:true,ready:true});return{wake(){},destroy,mute(){},replay(){},finale(){},async toggleSound(){return false;}};}
}

function ih43Brief(c,l,p,phase,words,time){
  const enter=IH43.back(phase.local/.58),w=Math.min(l.cw*.78,l.mobile?360:650),h=l.mobile?245:286,x=l.w*.53,y=l.y+l.ch*.57;
  c.save();c.translate(x+(1-enter)*l.w,y);c.rotate((1-enter)*-.16+Math.sin(time*2)*.012);c.scale(.92+enter*.08,.92+enter*.08);
  ih43Panel(c,0,0,w,h,{fill:p.paper,ink:p.ink,label:words.panel});
  ih43Text(c,words.project,-w/2+24,-h/2+86,l.mobile?24:34,p.ink,800);
  const tags=words.details;for(let i=0;i<tags.length;i++){const t=IH43.ease((phase.local-.18-i*.12)/.4),fill=i%2?p.accent:p.ink;c.save();c.globalAlpha=t;ih43Box(c,-w/2+24,-h/2+113+i*33,(w-48)*t,25,fill,3);ih43Text(c,tags[i],-w/2+35,-h/2+131+i*33,12,ih43Readable(fill,p.paper,p.ink),550);c.restore();}
  ih43Text(c,words.note,-w/2+24,h/2-23,11,p.ink,450);c.restore();
}
function ih43CutFee(c,l,p,phase,s,words){
  const o=s.offer||IH43_FILM.offer,locale=s.english?"en-US":"pl-PL",fmt=n=>Number(n).toLocaleString(locale),pct=fmt(o.percent)+"%",currency=s.english?"PLN":"zł";
  const color=p.ink,progress=IH43.ease(phase.local/.38);
  ih43Text(c,words.fee,l.pad,l.y+22,l.mobile?13:16,color,650);
  ih43Lines(c,[pct],{x:l.pad,y:l.y+28,w:l.cw,h:l.ch*.60},{color,progress,mode:"slam",max:l.mobile?108:230});
  const y=l.y+l.ch*.68,labels=[words.minimum+" "+fmt(o.minimum)+" "+currency,words.maximum+" "+fmt(o.maximum)+" "+currency];
  for(let i=0;i<2;i++){const t=IH43.ease((phase.local-.35-i*.12)/.4),w=(l.cw-12)/2;c.save();c.globalAlpha=t;ih43Box(c,l.pad+i*(w+12),y+(1-t)*40,w,47,p.ink,5);ih43Text(c,labels[i],l.pad+i*(w+12)+14,y+30,l.mobile?13:18,p.paper,700);c.restore();}
  ih43Text(c,words.limit+" "+fmt(o.orderLimit)+" "+currency,l.pad,y+77,l.mobile?11:14,color,550);
  ih43Text(c,words.payer,l.pad,y+98,l.mobile?10:12,color,450);
}
function ih43CutConversation(c,l,p,phase,words,time){
  const width=Math.min(l.cw*.84,660),height=l.mobile?220:250,x=l.w/2,y=l.y+l.ch*.58;
  const e=IH43.ease(phase.local/.5);ih43Panel(c,x+(1-e)*l.w,y,width,height,{fill:p.paper,ink:p.ink,label:words.thread,angle:(1-e)*.12});
  for(let i=0;i<2;i++){const a=IH43.back((phase.local-.30-i*.60)/.42);if(a<=0)continue;const bw=width*(i?.65:.70),xx=x-width*.43+(i?width*.22:0),yy=y-height*.25+i*82,fill=i?p.accent:p.ink;c.save();c.globalAlpha=IH43.clamp(a);c.translate(xx,yy+(1-a)*35);ih43Box(c,0,0,bw,60,fill,10);ih43Text(c,words.messages[i],16,36,l.mobile?15:20,ih43Readable(fill,p.paper,p.ink),650);c.restore();}
  const tick=.4+.6*Math.sin(time*5)**2;c.save();c.globalAlpha=tick;ih43Text(c,words.prompt,x,y+height*.40,11,p.ink,500,"center");c.restore();
}
function ih43Scene(c,l,p,phase,s,time){
  const shot=phase.shot,lang=s.english?IH43_FILM.en:IH43_FILM.pl,text=lang.frames[phase.index],ink=ih43Readable(ih43Surface(p,shot.bg),p.ink,p.paper);
  const enter=IH43.clamp(phase.local/.48),shake=s.reduced?0:Math.sin(phase.local*72)*Math.exp(-phase.local*13)*5;
  c.translate(shake,0);
  const titleBox={x:l.pad,y:l.y+13,w:l.cw,h:l.ch-16};
  if(shot.kind==="brief"){
    ih43Lines(c,text,{x:l.pad,y:l.y,w:l.cw,h:l.ch*.27},{color:ink,progress:enter,mode:"side",max:l.mobile?48:72});ih43Brief(c,l,p,phase,lang.ui,time);
  }else if(shot.kind==="fee")ih43CutFee(c,l,p,phase,s,lang.ui);
  else if(shot.kind==="dialogue"){
    ih43Lines(c,text,{x:l.pad,y:l.y,w:l.cw,h:l.ch*.25},{color:ink,progress:enter,mode:"side",max:l.mobile?52:86});ih43CutConversation(c,l,p,phase,lang.ui,time);
  }else if(shot.kind==="services"){
    for(let i=0;i<3;i++){
      const e=IH43.back((phase.local-i*.16)/.48),yy=l.y+l.ch*(.21+i*.29),x=l.pad+(i%2?1-e:e-1)*l.w;
      c.save();c.translate(x,yy);c.rotate((i-1)*-.028);const sz=ih43Fit(c,[text[i]],l.cw,l.ch*.26,l.mobile?68:145,900);ih43Text(c,text[i],0,sz*.45,sz,ink,900,"left",-sz*.05);c.restore();
    }
  }else if(shot.kind==="terms"){
    const scale=IH43.back(phase.local/.45);c.save();c.translate(l.w/2,l.y+l.ch/2);c.rotate(-.05+(1-scale)*.2);c.scale(scale,scale);ih43Box(c,-l.cw*.44,-l.ch*.36,l.cw*.88,l.ch*.72,p.paper,0);c.strokeStyle=p.ink;c.lineWidth=3;c.strokeRect(-l.cw*.41,-l.ch*.32,l.cw*.82,l.ch*.64);ih43Lines(c,text,{x:-l.cw*.36,y:-l.ch*.29,w:l.cw*.72,h:l.ch*.58},{color:p.ink,progress:1,mode:"rise",max:l.mobile?48:100});c.restore();
  }else if(shot.kind==="pair"){
    const two=text.slice(0,2),gap=14,bw=l.mobile?l.cw:(l.cw-gap)/2,bh=l.mobile?l.ch*.30:l.ch*.60;
    for(let i=0;i<2;i++){const e=IH43.ease((phase.local-i*.16)/.5),x=l.mobile?l.pad:l.pad+i*(bw+gap),y=l.mobile?l.y+i*(bh+16):l.y+l.ch*.05;c.save();c.translate((i?1:-1)*(1-e)*l.w,0);ih43Box(c,x,y,bw,bh,i?p.accent:p.paper,7);ih43Lines(c,[two[i]],{x:x+18,y:y+20,w:bw-36,h:bh-40},{color:i?p.paper:p.ink,progress:1,max:l.mobile?38:68});c.restore();}
    ih43Lines(c,[text[2]],{x:l.pad,y:l.y+l.ch*.72,w:l.cw,h:l.ch*.27},{color:ink,progress:IH43.ease((phase.local-.55)/.40),mode:"slam",max:l.mobile?55:100});
  }else if(shot.kind==="final"){
    const float=s.reduced?0:Math.sin(time*1.6)*3;
    if(!s.reduced){c.save();c.globalAlpha=.12;const label=lang.endTags[Math.floor(phase.local/2.1)%3],sz=l.mobile?100:245;ih43Text(c,label,l.pad+(1-((phase.local/3)%1))*l.cw,l.y+l.ch*.80,sz,ink,900);c.restore();}
    ih43Lines(c,text,{...titleBox,y:titleBox.y-25+float,h:l.ch*.72},{color:ink,progress:IH43.clamp(phase.local/.6),mode:"letters",max:l.mobile?85:185});
    const tags=lang.endTags;for(let i=0;i<3;i++){const x=l.pad+l.cw*(.17+i*.33),y=l.y+l.ch*.85+Math.sin(time*2+i*1.7)*5;ih43Tag(c,tags[i],x,y,{fill:i%2?p.accent:p.paper,ink:i%2?p.paper:p.ink},Math.sin(time+i)*.035,l.mobile?.73:1);}
  }else ih43Lines(c,text,titleBox,{color:ink,progress:enter,mode:shot.motion||"slam",max:l.mobile?95:220});
  if(shot.kind!=="fee"&&shot.kind!=="final"){
    const rail=s.english?"CUT / ":"CIĘCIE / ";c.save();c.globalAlpha=.28;ih43Text(c,rail+String(phase.index+1).padStart(2,"0"),l.w-l.pad,l.y+l.ch-2,9,ink,600,"right",1.2);c.restore();
  }
}

function ih43Reduced(){
  return typeof window!=="undefined"&&!!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/* Każdy wariant jest alternatywą całego pliku App.jsx. Trasy, płatności i dalsza strona pozostają w części P40. */
export function IdeaHireCinematicHero({paused=false,onPause=()=>{}}){
  const setPaused=onPause;
  const site=useSitePreferences();
  const english=site.language==="en",classic=site.template==="classic";
  const copy=english?IH43_FILM.en:IH43_FILM.pl;
  const [reduced,setReduced]=useState(ih43Reduced);
  const [sound,setSound]=useState(false);
  const [ready,setReady]=useState(false);
  const [failed,setFailed]=useState(false);
  const [scene,setScene]=useState(()=>ih43Reduced()?IH43_FILM.shots.length-1:0);
  const rootRef=useRef(null),canvasRef=useRef(null),engineRef=useRef(null),alive=useRef(false),soundBusy=useRef(false);
  const motion=useRef({time:0,paused:false,reduced,english,classic,dark:site.theme==="dark",offer:IDEA_HIRE_PUBLIC_OFFER,ready:false,sound:false,pointerX:0,pointerY:0,hover:-1});
  const finale=scene===IH43_FILM.shots.length-1;
  const labels=english?{
    region:"IdeaHire — "+IH43_FILM.name,
    skip:"Skip to the final scene",replay:"Replay the film",pause:"Pause the animation",play:"Resume the animation",
    soundOn:"Enable sound",soundOff:"Mute sound",controls:"Film controls",
  }:{
    region:"IdeaHire — "+IH43_FILM.name,
    skip:"Przejdź do finału",replay:"Odtwórz od początku",pause:"Zatrzymaj animację",play:"Wznów animację",
    soundOn:"Włącz dźwięk",soundOff:"Wycisz dźwięk",controls:"Sterowanie filmem",
  };
  useEffect(()=>{
    const media=window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if(!media)return;
    const change=()=>setReduced(media.matches);change();
    media.addEventListener?.("change",change);
    return()=>media.removeEventListener?.("change",change);
  },[]);
  useLayoutEffect(()=>{
    Object.assign(motion.current,{reduced,english,classic,dark:site.theme==="dark",paused,offer:IDEA_HIRE_PUBLIC_OFFER});
    if(reduced){setSound(false);engineRef.current?.mute();}
    engineRef.current?.wake();
  },[reduced,english,classic,paused,site.theme]);
  useEffect(()=>{
    alive.current=true;
    const engine=ih43Start(canvasRef.current,rootRef.current,motion,update=>{
      if(!alive.current)return;
      if(update.ready)setReady(true);
      if(update.failed)setFailed(true);
      if(update.scene!==undefined)setScene(update.scene);
      if(update.sound!==undefined)setSound(update.sound);
    });
    engineRef.current=engine;
    return()=>{alive.current=false;engine.destroy();engineRef.current=null;};
  },[]);
  function cut(){
    if(reduced||failed)return;
    if(IH43.phase(motion.current.time).cycle>=IH43_FILM.finalStart){
      motion.current.paused=false;setPaused(false);engineRef.current?.replay();
    }else engineRef.current?.finale();
  }
  function togglePause(){
    motion.current.paused=!motion.current.paused;
    setPaused(motion.current.paused);engineRef.current?.wake();
  }
  async function toggleSound(){
    if(soundBusy.current||reduced||failed)return;
    soundBusy.current=true;
    try{const enabled=await engineRef.current?.toggleSound();if(alive.current)setSound(!!enabled);}
    finally{soundBusy.current=false;}
  }
  function hover(index){motion.current.hover=index;engineRef.current?.wake();}
  function move(event){
    if(reduced||paused||failed||event.pointerType!=="mouse")return;
    const rect=event.currentTarget.getBoundingClientRect();
    motion.current.pointerX=IH43.clamp((event.clientX-rect.left)/rect.width*2-1,-1,1);
    motion.current.pointerY=IH43.clamp((event.clientY-rect.top)/rect.height*2-1,-1,1);
  }
  function leave(){motion.current.pointerX=0;motion.current.pointerY=0;hover(-1);}
  return <section ref={rootRef} className="ih43-film" data-cinematic-version={"P43-"+IH43_FILM.key}
    data-ready={ready} data-failed={failed} data-classic={classic} data-no-translate="true"
    aria-label={labels.region} onPointerMove={move} onPointerLeave={leave}>
    <style>{IH43_STYLES}</style>
    <canvas ref={canvasRef} className="ih43-canvas" aria-hidden="true"/>
    <div className="ih43-accessible">
      <h1>{copy.final.join(" ")}</h1>
      <p>{copy.subtitle}</p>
      <p>{copy.disclosure}</p>
      {IH43_FILM.genre==="cut"&&<p>{english?"IdeaHire service fee":"Prowizja IdeaHire"}: {IDEA_HIRE_PUBLIC_OFFER.percent}%,
        {english?" minimum":" min."} {IDEA_HIRE_PUBLIC_OFFER.minimum} {english?"PLN":"zł"},
        {english?" maximum":" maks."} {IDEA_HIRE_PUBLIC_OFFER.maximum} {english?"PLN":"zł"}.
        {english?" Orders up to ":" Zlecenia do "}{IDEA_HIRE_PUBLIC_OFFER.orderLimit} {english?"PLN. Paid by the client.":"zł. Płaci zleceniodawca."}</p>}
    </div>
    <div role="group" aria-label={labels.controls}>
      <button type="button" className="ih43-hit ih43-control" style={{"--ih43-index":0}}
        aria-label={finale?labels.replay:labels.skip} title={finale?labels.replay:labels.skip} disabled={reduced||failed} onClick={cut}/>
      <button type="button" className="ih43-hit ih43-control" style={{"--ih43-index":1}}
        aria-label={paused?labels.play:labels.pause} title={paused?labels.play:labels.pause} aria-pressed={paused||reduced}
        disabled={reduced||failed} onClick={togglePause}/>
      <button type="button" className="ih43-hit ih43-control" style={{"--ih43-index":2}}
        aria-label={sound?labels.soundOff:labels.soundOn} title={sound?labels.soundOff:labels.soundOn} aria-pressed={sound}
        disabled={reduced||failed} onClick={toggleSound}/>
    </div>
    {copy.cta.map((label,index)=><Link key={index} className="ih43-hit ih43-link" style={{"--ih43-index":index}}
      to={IH43_FILM.paths[index]} onMouseEnter={()=>hover(index)} onMouseLeave={()=>hover(-1)} onFocus={()=>hover(index)} onBlur={()=>hover(-1)}>
      <span className="ih43-link-label">{label}</span>
    </Link>)}
  </section>;
}


function ih47Clamp(x,a=0,b=1){return Math.max(a,Math.min(b,x));}
function ih47Ease(x){x=ih47Clamp(x);return 1-Math.pow(1-x,5);}
function ih47Mix(a,b,t){return a+(b-a)*t;}
function ih47Identity(){return [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];}
function ih47Mul(a,b){const o=Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o;}
function ih47Transform(x,y,z,rx=0,ry=0,rz=0,scale=1,sy=scale,sz=scale){
 const cx=Math.cos(rx),sx=Math.sin(rx),cy=Math.cos(ry),ssy=Math.sin(ry),cz=Math.cos(rz),ssz=Math.sin(rz);
 const X=[1,0,0,0,0,cx,sx,0,0,-sx,cx,0,0,0,0,1],Y=[cy,0,-ssy,0,0,1,0,0,ssy,0,cy,0,0,0,0,1],Z=[cz,ssz,0,0,-ssz,cz,0,0,0,0,1,0,0,0,0,1];
 const m=ih47Mul(ih47Mul(Z,Y),X);for(let r=0;r<3;r++){m[r]*=scale;m[4+r]*=sy;m[8+r]*=sz;}m[12]=x;m[13]=y;m[14]=z;return m;
}
function ih47Perspective(fov,aspect,near=.1,far=70){const f=1/Math.tan(fov/2);return[f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0];}
function ih47Look(eye,at){const norm=v=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n);},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);const z=norm(eye.map((x,i)=>x-at[i])),x=norm(cross([0,1,0],z)),y=cross(z,x);return[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];}
function ih47RGB(hex){return[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);}
function ih47Fonts(){const fonts=document.fonts;if(!fonts)return Promise.resolve();const tasks=[fonts.ready];if(fonts.load)for(const weight of [400,600,700,800])tasks.push(fonts.load(weight+' 32px Inter','Zażółć gęślą jaźń ąćęłńóśźż 5,5% IdeaHire'));return Promise.allSettled(tasks);}

/* P47 — prawdziwe sceny WebGL: drukowane plansze, głębia, światło i fizyczne krawędzie. */
const IH47_VERTEX=String.raw`
precision highp float;
attribute vec3 aPosition,aNormal;attribute vec2 aUV;attribute float aMaterial;
uniform mat4 uModel,uVP;varying vec3 vPosition,vNormal;varying vec2 vUV;varying float vMaterial;
void main(){vec4 p=uModel*vec4(aPosition,1.0);vPosition=p.xyz;vNormal=normalize(mat3(uModel)*aNormal);vUV=aUV;vMaterial=aMaterial;gl_Position=uVP*p;}`;
const IH47_FRAGMENT=String.raw`
precision highp float;
uniform vec3 uEye,uBG,uInk,uBase,uAccent;uniform float uMode,uAlpha;uniform sampler2D uTexture;
varying vec3 vPosition,vNormal;varying vec2 vUV;varying float vMaterial;
void main(){
 vec3 n=normalize(vNormal),eye=normalize(uEye-vPosition);if(dot(n,eye)<0.0)n=-n;
 vec3 light=normalize(vec3(-3.0,5.0,6.0)-vPosition);float nl=max(0.0,dot(n,light));
 vec3 col=uBase*(.50+.45*nl);float alpha=uAlpha;
 if(uMode<1.5&&vMaterial<.5){col=texture2D(uTexture,vUV).rgb*(.96+.04*nl);}
 else{float spec=pow(max(0.0,dot(n,normalize(light+eye))),65.0);col+=uAccent*spec*.22;}
 if(uMode>1.5){vec2 p=(vUV-.5)*2.0;alpha*=exp(-4.0*dot(p,p));col=uInk;}
 gl_FragColor=vec4(clamp(col,0.0,1.0),alpha);
}`;
function ih47CardMesh(){
 const ring=[],radius=.055,w=1.25,h=1.67;
 for(let corner=0;corner<4;corner++){const cx=corner===0||corner===3?w-radius:-w+radius,cy=corner<2?h-radius:-h+radius;for(let j=0;j<=5;j++){const a=corner*Math.PI/2+j*Math.PI/10;ring.push([cx+radius*Math.cos(a),cy+radius*Math.sin(a)]);}}
 const vertices=[],indices=[],put=(p,n,u,v,m)=>{const i=vertices.length/9;vertices.push(...p,...n,u,v,m);return i;};
 const center=put([0,0,.025],[0,0,1],.5,.5,0),front=[];
 for(const[x,y]of ring)front.push(put([x,y,.025],[0,0,1],(x+w)/(w*2),(y+h)/(h*2),0));
 for(let i=0;i<ring.length;i++)indices.push(center,front[i],front[(i+1)%ring.length]);
 for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1,n=[dy/length,-dx/length,0];const start=vertices.length/9;for(const[p,z]of [[a,.025],[b,.025],[b,-.025],[a,-.025]])put([p[0],p[1],z],n,0,0,1);indices.push(start,start+1,start+2,start,start+2,start+3);}
 const back=vertices.length/9;for(const p of [[-w,-h],[w,-h],[w,h],[-w,h]])put([...p,-.025],[0,0,-1],0,0,1);indices.push(back,back+2,back+1,back,back+3,back+2);
 return{vertices,indices};
}
function ih47ShadowMesh(){return{vertices:[-1,-1,0,0,0,1,0,0,0,1,-1,0,0,0,1,1,0,0,1,1,0,0,0,1,1,1,0,-1,1,0,0,0,1,0,1,0],indices:[0,1,2,0,2,3]};}
function ih47Fee(amount,offer){return Math.round(Math.max(offer.minimum,Math.min(offer.maximum,amount*offer.percent/100))*100)/100;}
function ih47Money(value,english){return Number(value).toLocaleString(english?'en-GB':'pl-PL',{maximumFractionDigits:2})+(english?' PLN':' zł');}
function ih47Texture(state,index){
 const canvas=document.createElement('canvas');canvas.width=900;canvas.height=1200;const c=canvas.getContext('2d'),p=state.palette,en=state.english,mode=state.mode;
 if(mode==='fees'&&index>0){canvas.height=600;c.fillStyle=p.paper;c.fillRect(0,0,900,600);c.strokeStyle=p.line;c.lineWidth=2;c.strokeRect(1,1,898,598);c.fillStyle=p.ink;c.font='600 22px Inter,Arial';c.fillText('IDEAHIRE / '+(index===1?(en?'PROFESSIONAL':'WYKONAWCA'):(en?'CLIENT':'ZLECENIODAWCA')),50,72);c.font='600 51px Inter,Arial';c.fillText(index===1?(en?'The agreed amount.':'Ustalona kwota.'):(en?'A clear total.':'Jasna suma.'),50,225);c.font='700 77px Inter,Arial';c.fillText(ih47Money(index===1?state.amount:state.amount+ih47Fee(state.amount,state.offer),en),50,370);c.font='400 23px Inter,Arial';c.fillText(index===1?(en?'Project remuneration':'Wynagrodzenie za zlecenie'):(en?'Project + IdeaHire fee':'Zlecenie + prowizja IdeaHire'),50,440);c.strokeStyle=p.line;c.beginPath();c.moveTo(50,500);c.lineTo(850,500);c.stroke();c.font='400 19px Inter,Arial';c.fillText(en?'ILLUSTRATIVE CALCULATION':'PRZYKŁADOWE OBLICZENIE',50,550);return canvas;}
 c.fillStyle=p.paper;c.fillRect(0,0,900,1200);c.strokeStyle=p.line;c.lineWidth=2;c.strokeRect(1,1,898,1198);
 const text=(s,x,y,size=25,weight=500,color=p.ink)=>{c.font=weight+' '+size+'px Inter,Arial';c.fillStyle=color;c.fillText(String(s),x,y);};
 const line=y=>{c.strokeStyle=p.line;c.beginPath();c.moveTo(52,y);c.lineTo(848,y);c.stroke();};
 const mark=(x,y)=>{c.fillStyle=p.ink;for(let i=0;i<4;i++)c.fillRect(x+(i%2)*18,y+Math.floor(i/2)*18,12,12);};
 const wrap=(s,y,size=62)=>{c.font='700 '+size+'px Inter,Arial';const words=String(s).split(' ');let row='',count=0;for(const word of words){const value=row?row+' '+word:word;if(c.measureText(value).width>770&&row){text(row,52,y,size,700);y+=size*1.1;count++;row=word;if(count===3)break;}else row=value;}text(row.slice(0,35),52,y,size,700);return y+size*1.1;};
 mark(52,48);text('IDEAHIRE',105,73,23,700);c.textAlign='right';text('0'+(index+1),848,73,22);c.textAlign='left';line(110);
 if(mode==='fees'){
  const amount=state.amount,offer=state.offer,fee=ih47Fee(amount,offer),n=amount+fee;
  text(index===0?(en?'YOUR CALCULATION':'TWOJE OBLICZENIE'):index===1?(en?'PROFESSIONAL':'WYKONAWCA'):(en?'CLIENT':'ZLECENIODAWCA'),52,175,22,600);
  if(index===0){text(offer.percent.toLocaleString(en?'en-GB':'pl-PL')+'%',52,390,180,700);text(en?'IdeaHire service fee':'Prowizja IdeaHire',58,447,27);line(500);
   for(const[row,value,i]of [[en?'Project value':'Wartość zlecenia',amount,0],[en?'IdeaHire fee':'Prowizja IdeaHire',fee,1],[en?'Client total':'Razem dla klienta',n,2]]){text(row,52,580+i*138,24,500,p.muted);text(ih47Money(value,en),52,642+i*138,46,700);if(i<2)line(675+i*138);}
  }else{wrap(index===1?(en?'The agreed amount.':'Ustalona kwota.'):(en?'A clear total.':'Jasna suma.'),300,72);text(ih47Money(index===1?amount:n,en),52,635,64,700);text(index===1?(en?'Project remuneration':'Wynagrodzenie za zlecenie'):(en?'Project + IdeaHire fee':'Zlecenie + prowizja IdeaHire'),52,705,26);}
  line(1045);text(en?'ILLUSTRATIVE CALCULATION':'PRZYKŁADOWE OBLICZENIE',52,1100,20,600);text('min. '+offer.minimum+' / '+(en?'max. ':'maks. ')+offer.maximum+' '+(en?'PLN':'zł'),52,1140,20,500,p.muted);
 }else if(mode==='categories'){
  text(en?'THE FIELD':'DZIEDZINA',52,180,22,600);const category=state.category;wrap(category?.label||(en?'Your expertise.':'Twój fach.'),310,74);
  const specs=category?.specialisms||[];for(let i=0;i<Math.min(5,specs.length);i++){const y=620+i*69;line(y-36);text(String(specs[(i+index*2)%specs.length]).slice(0,44),52,y,26,500);text('↗',810,y,30,600);}
  line(1045);text(en?'CHOOSE A SPECIALISM':'WYBIERZ SPECJALIZACJĘ',52,1100,21,600);text('IDEA / HIRE',52,1140,22,500,p.muted);
 }else if(mode==='process'){
  const steps=en?[['THE BRIEF','Say what you need.',['Scope','Delivery','Budget']],['THE DETAILS','Agree before starting.',['Price','Revisions','Delivery']],['THE WORK','Make it happen.',['Conversation','Files','Handover']]]:[['OPIS','Powiedz, co robimy.',['Zakres','Termin','Budżet']],['USTALENIA','Zapiszcie konkrety.',['Kwota','Poprawki','Termin']],['WSPÓŁPRACA','Dobra. Do roboty.',['Rozmowa','Pliki','Przekazanie']]];
  const step=steps[index%3];text(step[0],52,180,22,600);wrap(step[1],330,82);step[2].forEach((item,i)=>{const y=690+i*92;line(y-42);text('0'+(i+1),52,y,22,500,p.muted);text(item,125,y,38,600);});line(1045);text('IDEAHIRE / '+(index+1)+' / 3',52,1110,23,600);
 }else{
  const job=state.jobs[index%Math.max(1,state.jobs.length)],sample=!ih47RealJob(job),titles=en?['A website for a new brand','A visual identity','Copy for a company website']:['Strona dla nowej marki','Identyfikacja wizualna','Teksty na stronę firmową'];
  text(en?'PROJECT BRIEF':'ZAKRES PROJEKTU',52,180,22,600);wrap(sample?titles[index%3]:job.title,310,74);
  const budget=sample?[3000,1800,900][index%3]:(Number(job?.budget)>0?Number(job.budget):null);line(690);text(en?'Project budget':'Budżet projektu',52,750,25,500,p.muted);text(budget===null?(en?'To agree':'Do ustalenia'):ih47Money(budget,en),52,825,69,700);line(910);
  text(en?'SCOPE / TIMING / RESULT':'ZAKRES / TERMIN / REZULTAT',52,980,23,600);line(1045);text(sample?(en?'ILLUSTRATIVE BRIEF':'PRZYKŁADOWY ZAKRES'):(en?'IDEAHIRE LISTING':'ZLECENIE IDEAHIRE'),52,1100,21,600);text('↗',790,1140,48,500);
 }
 return canvas;
}
function ih47SpacePlan(s,width,height){
 const small=width<650,t=s.time,phase=Math.floor(t/5.5)%4,local=t%5.5,cut=s.reduced?1:ih47Ease(local/.6),turn=s.reduced?0:Math.sin(t*.55)*.035;
 const changing=s.reduced?0:1-ih47Ease(s.transition/.65),entry=s.reduced?0:1-ih47Ease(s.enter/.85),yScroll=s.reduced?0:(s.progress-.5)*.42;
 const selected=s.mode==='fees'?0:s.selected??0,mode=s.mode;
 const eye=[small?.1:.45+(s.x||0)*.20,.4+(s.y||0)*.12,small?8.7:8.5],at=[small?0:-.18,0,0],vp=ih47Mul(ih47Perspective(42*Math.PI/180,width/height),ih47Look(eye,at));
 const poses=mode==='fees'?[[.0,0,1.1,-.08,-.10,-.055],[-1.35,.95,-.4,.04,.35,-.13],[1.35,-.75,-.2,-.02,-.25,.10]]:mode==='process'?[[0,0,.8,-.04,-.14,-.04],[-1.35,.05,-.5,.05,.28,-.15],[1.35,.0,-.7,-.06,-.22,.15]]:[[0,0,.8,-.045,-.14,-.045],[-1.5,.15,-.7,.03,.30,-.17],[1.55,.10,-.9,-.02,-.27,.13]];
 const calls=[];
 for(let i=2;i>=0;i--){const rank=(i-selected+3)%3,p=poses[rank],spin=changing*(i%2?-.45:.45),slide=entry*(i-1)*3.5+changing*(i-1)*.25;
  const rhythm=(which)=>which===0?[0,0,0]:which===1?[rank===1?-.1:rank===2?.15:0,rank===1?.38:rank===2?-.3:0,rank===0?.12:0]:which===2?[rank===1?-.3:rank===2?.30:0,0,rank===0?.20:-.3]:[rank===1?.15:rank===2?-.1:0,rank===1?-.25:rank===2?.2:0,0];
  const from=rhythm((phase+3)%4),to=rhythm(phase),beat=to.map((v,j)=>ih47Mix(from[j],v,cut));
  const x=p[0]+slide+beat[0],y=p[1]+yScroll+turn*(i+1)+beat[1],z=p[2]+(rank===0?changing*.3:0)+beat[2],sy=mode==='fees'&&i>0?.46:.92;
  calls.push({mesh:'card',texture:i,model:ih47Transform(x,y,z,p[3]+(s.y||0)*.04,p[4]+(s.x||0)*.10+spin+(1-cut)*(rank-1)*.18,p[5]+turn,.92,sy,.92),mode:0,alpha:1});}
 calls.unshift({mesh:'shadow',model:ih47Transform(0,-1.84,-.15,-Math.PI/2,0,0,3.2,1.1,1),mode:2,alpha:.20});
 return{eye,vp,calls};
}
function ih47SpaceRenderer(canvas){
 const gl=canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'low-power'});if(!gl)return null;
 const shaders=[],buffers=[],textures=[];let program=null,signature='',lastUpload=-1000;
 const shader=(kind,source)=>{const sh=gl.createShader(kind);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){gl.deleteShader(sh);throw Error('P47 shader');}shaders.push(sh);return sh;};
 try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,IH47_VERTEX));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,IH47_FRAGMENT));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('P47 link');}catch{shaders.forEach(sh=>gl.deleteShader(sh));if(program)gl.deleteProgram(program);return null;}
 gl.useProgram(program);const uniforms={};for(const key of ['uModel','uVP','uEye','uBG','uInk','uBase','uAccent','uMode','uAlpha','uTexture'])uniforms[key]=gl.getUniformLocation(program,key);
 const attributes={};for(const key of ['aPosition','aNormal','aUV','aMaterial'])attributes[key]=gl.getAttribLocation(program,key);
 const meshes={};for(const[name,data]of Object.entries({card:ih47CardMesh(),shadow:ih47ShadowMesh()})){const vb=gl.createBuffer(),ib=gl.createBuffer();buffers.push(vb,ib);gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data.vertices),gl.STATIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(data.indices),gl.STATIC_DRAW);meshes[name]={vb,ib,count:data.indices.length};}
 for(let i=0;i<3;i++)textures.push(gl.createTexture());gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.uniform1i(uniforms.uTexture,0);
 const vec=(key,value)=>gl.uniform3fv(uniforms[key],new Float32Array(value));
 return{draw(width,height,s){
  if(gl.isContextLost())return;if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}gl.viewport(0,0,width,height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  const next=JSON.stringify([s.mode,s.english,s.palette,s.amount,s.category,s.jobs,s.fontCycle]);if(next!==signature&&(s.time-lastUpload>.08||!signature||s.paused||s.reduced)){signature=next;lastUpload=s.time;for(let i=0;i<3;i++){gl.bindTexture(gl.TEXTURE_2D,textures[i]);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,ih47Texture(s,i));for(const[key,value]of [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,key,value);}}
  const plan=ih47SpacePlan(s,s.cssWidth,s.cssHeight),p=s.palette;gl.uniformMatrix4fv(uniforms.uVP,false,new Float32Array(plan.vp));vec('uEye',plan.eye);vec('uBG',ih47RGB(p.bg));vec('uInk',ih47RGB(p.ink));vec('uBase',ih47RGB(p.material));vec('uAccent',ih47RGB(p.paper));
  for(const call of plan.calls){const mesh=meshes[call.mesh];gl.bindBuffer(gl.ARRAY_BUFFER,mesh.vb);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.ib);for(const[key,size,offset]of [['aPosition',3,0],['aNormal',3,12],['aUV',2,24],['aMaterial',1,32]]){gl.enableVertexAttribArray(attributes[key]);gl.vertexAttribPointer(attributes[key],size,gl.FLOAT,false,36,offset);}gl.uniformMatrix4fv(uniforms.uModel,false,new Float32Array(call.model));gl.uniform1f(uniforms.uMode,call.mode);gl.uniform1f(uniforms.uAlpha,call.alpha);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,textures[call.texture||0]);gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);}
 },destroy(){buffers.forEach(b=>gl.deleteBuffer(b));textures.forEach(t=>gl.deleteTexture(t));shaders.forEach(sh=>gl.deleteShader(sh));gl.deleteProgram(program);}};
}
function ih47StartSpace(canvas,host,state){
 let engine=null,dead=false,frame=0,last=0,lastDraw=0,visible=true,dirty=true,observer,resizeObserver;const cleanup=[];
 const listen=(node,event,fn,options)=>{node.addEventListener(event,fn,options);cleanup.push(()=>node.removeEventListener(event,fn,options));};
 const create=()=>{engine?.destroy();try{engine=ih47SpaceRenderer(canvas);}catch{engine=null;}host.dataset.renderer=engine?'ready':'fallback';dirty=true;};
 function tick(now){frame=0;if(dead||!visible||document.hidden)return;const s=state.current,interval=window.innerWidth<821?1000/30:1000/45;if(!s.paused&&!s.reduced&&lastDraw&&now-lastDraw<interval-1){frame=requestAnimationFrame(tick);return;}const dt=last?Math.min(.08,(now-last)/1000):0;last=now;lastDraw=now;
  if(!s.paused&&!s.reduced){s.time+=dt;s.transition+=dt;s.enter+=dt;s.x+=(s.targetX-s.x)*.12;s.y+=(s.targetY-s.y)*.12;}
  const b=host.getBoundingClientRect();s.progress=ih47Clamp((window.innerHeight-b.top)/(window.innerHeight+b.height),0,1);
  if(dirty){s.cssWidth=Math.max(1,b.width);s.cssHeight=Math.max(1,b.height);let dpr=Math.min(window.devicePixelRatio||1,1.6);dpr=Math.min(dpr,Math.sqrt(850000/(s.cssWidth*s.cssHeight)));s.width=Math.max(1,Math.round(s.cssWidth*dpr));s.height=Math.max(1,Math.round(s.cssHeight*dpr));dirty=false;}
  try{engine?.draw(s.width,s.height,s);}catch{engine?.destroy();engine=null;host.dataset.renderer='fallback';}
  if(engine&&!s.paused&&!s.reduced)frame=requestAnimationFrame(tick);
 }
 const wake=()=>{if(!dead&&visible&&!document.hidden&&!frame){last=0;lastDraw=0;frame=requestAnimationFrame(tick);}};
 create();listen(window,'resize',()=>{dirty=true;wake();},{passive:true});listen(window,'scroll',wake,{passive:true});listen(host,'pointermove',e=>{if(e.pointerType!=='mouse'||state.current.reduced)return;const b=host.getBoundingClientRect();state.current.targetX=(e.clientX-b.left)/Math.max(1,b.width)*2-1;state.current.targetY=(e.clientY-b.top)/Math.max(1,b.height)*2-1;},{passive:true});listen(host,'pointerleave',()=>{state.current.targetX=0;state.current.targetY=0;});
 listen(document,'visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;last=0;}else wake();});listen(canvas,'webglcontextlost',e=>{e.preventDefault();engine=null;host.dataset.renderer='fallback';cancelAnimationFrame(frame);frame=0;});listen(canvas,'webglcontextrestored',()=>{create();wake();});
 if(typeof IntersectionObserver!=='undefined'){observer=new IntersectionObserver(entries=>{visible=!!entries[0]?.isIntersecting;if(visible)wake();else{cancelAnimationFrame(frame);frame=0;last=0;}},{rootMargin:'100px'});observer.observe(host);}
 if(typeof ResizeObserver!=='undefined'){resizeObserver=new ResizeObserver(()=>{dirty=true;wake();});resizeObserver.observe(host);}
 ih47Fonts().then(()=>{if(!dead){state.current.fontCycle=(state.current.fontCycle||0)+1;wake();}}).catch(()=>{});
 wake();return{wake,destroy(){dead=true;cancelAnimationFrame(frame);cleanup.forEach(fn=>fn());observer?.disconnect();resizeObserver?.disconnect();engine?.destroy();}};
}
function IH47Space({mode,selected=0,amount=2200,category=null,jobs=[],palette,english,reduced,paused}){
 const root=useRef(null),canvas=useRef(null),engine=useRef(null),state=useRef({time:0,transition:1,enter:0,x:0,y:0,targetX:0,targetY:0,mode,selected,amount,category,jobs,palette,english,reduced,paused,offer:IDEA_HIRE_PUBLIC_OFFER});
 useLayoutEffect(()=>{const s=state.current;if(s.selected!==selected||s.amount!==amount||s.category!==category)s.transition=0;Object.assign(s,{mode,selected,amount,category,jobs,palette,english,reduced,paused});engine.current?.wake();},[mode,selected,amount,category,jobs,palette,english,reduced,paused]);
 useEffect(()=>{engine.current=ih47StartSpace(canvas.current,root.current,state);return()=>{engine.current?.destroy();engine.current=null;};},[]);
 return <div className="space" ref={root} aria-hidden="true"><canvas ref={canvas}/><div className="space-fallback"><span>IDEA<br/>HIRE</span><span>{mode==='fees'?IDEA_HIRE_PUBLIC_OFFER.percent.toLocaleString(english?'en-GB':'pl-PL')+'%':'↗'}</span></div></div>;
}

const IH47_COPY={
  pl:{menu:"Menu",close:"Zamknij menu",how:"Jak to działa",categories:"Kategorie",fee:"Prowizja",account:"Moje konto",login:"Zaloguj się",register:"Dołącz",logout:"Wyloguj się",notices:"Powiadomienia",find:"Znajdź wykonawcę",work:"Znajdź zlecenie",skip:"Pomiń wejście",replay:"Powtórz animację",pause:"Zatrzymaj animacje",play:"Wznów animacje",hero:"Ludzie do Twoich pomysłów.",intro:[ ["Masz","pomysł."],["Ktoś","potrafi."],["Złapcie","kontakt."],["Działajcie","razem."],["Masz pomysł.","Daj mu życie."] ],chapters:["Pomysł","Umiejętności","Rozmowa","Współpraca"],subtitle:"Strona, identyfikacja, film? Znajdź osobę, z którą zrobisz następny krok.",sample:"Przykładowy projekt",all:"Wszystkie zlecenia",go:"Przejrzyj zlecenia",latest:"Do zrobienia",examples:"Przykładowe zakresy",jobsTitle:"Ktoś właśnie szuka\nTwoich umiejętności.",categoriesTitle:"Zacznij od\nswojej dziedziny.",categoryLead:"Wybierz kierunek. Dalej są konkretne specjalizacje.",methodTitle:"Od pierwszej rozmowy\ndo konkretów.",method:[["Opisz, co chcesz zrobić.","Zakres, termin i oczekiwany rezultat. Kilka konkretów ułatwi znalezienie właściwej osoby."],["Sprawdź, z kim pracujesz.","Zobacz profil i portfolio. Zapytaj o doświadczenie przy podobnych projektach."],["Ustalcie warunki.","Porozmawiajcie o cenie, przekazaniu pracy i poprawkach. Zapiszcie ustalenia przed rozpoczęciem."]],closing:["Dobry moment,","żeby zacząć."],summary:"Miejsce spotkania pomysłu z wykonaniem.",legal:"Dokumenty i pomoc",help:"Pomoc",terms:"Regulamin",privacy:"Prywatność",illegal:"Zgłoś nielegalną treść",light:"Tryb jasny",dark:"Tryb ciemny",mono:"Czerń i biel",turquoise:"Turkus",theme:"Szablon strony",language:"Język",more:"Więcej",noOffers:"Przykład — to nie jest aktywne ogłoszenie."},
  en:{menu:"Menu",close:"Close menu",how:"How it works",categories:"Categories",fee:"Service fee",account:"My account",login:"Sign in",register:"Join",logout:"Sign out",notices:"Notifications",find:"Find a professional",work:"Find a project",skip:"Skip the entrance",replay:"Replay the animation",pause:"Pause animations",play:"Resume animations",hero:"People for your ideas.",intro:[["You have","an idea."],["Someone has","the skills."],["Start a","conversation."],["Make it","together."],["Have an idea?","Bring it to life."]],chapters:["Idea","Skills","Conversation","Collaboration"],subtitle:"A website, identity or film? Find the person for your next step.",sample:"Illustrative project",all:"All projects",go:"Browse projects",latest:"Work to do",examples:"Illustrative briefs",jobsTitle:"Someone is looking\nfor your skills.",categoriesTitle:"Start with\nyour field.",categoryLead:"Choose a field, then explore the specialisms.",methodTitle:"From the first conversation\nto the details.",method:[["Say what you need.","The scope, deadline and expected result. A few clear details help you find the right person."],["Get to know the professional.","Explore their profile and portfolio. Ask about experience with similar projects."],["Agree on the details.","Discuss the price, delivery and revisions. Record your agreement before you begin."]],closing:["A good time","to get started."],summary:"Where an idea meets the skills to make it happen.",legal:"Documents and help",help:"Help",terms:"Terms",privacy:"Privacy",illegal:"Report illegal content",light:"Light mode",dark:"Dark mode",mono:"Black and white",turquoise:"Turquoise",theme:"Site template",language:"Language",more:"More",noOffers:"Illustrative scope — not an active listing."}
};
function IH47Arrow(){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.6"/></svg>;}
function IH47Mark(){return <span className="mark" aria-hidden="true"><i/><i/><i/><i/></span>;}
function IH47Burger({open=false}){return <span className="bars" data-open={open} aria-hidden="true"><i/><i/><i/></span>;}
function IH47Brand({onClick}={}){return <Link onClick={onClick} to="/" className="brand" aria-label="IdeaHire"><IH47Mark/><span>IdeaHire</span></Link>;}
function IH47ThemeButtons({site,copy}){return <div className="template-switch" role="group" aria-label={copy.theme}><button type="button" aria-pressed={site.template==="classic"} onClick={()=>site.setTemplate("classic")}><i className="swatch mono"/>{copy.mono}</button><button type="button" aria-pressed={site.template!=="classic"} onClick={()=>site.setTemplate("current")}><i className="swatch"/>{copy.turquoise}</button></div>;}
function IH47Menu({open,onClose,rootRef,triggerRef,site,copy,session,hasNotifications,logout,overlay,onAnchor}){
 const panel=useRef(null),closeRef=useRef(onClose);closeRef.current=onClose;
 useLayoutEffect(()=>{if(!open||!overlay)return;const root=rootRef.current,overflow=document.body.style.overflow,wasInert=root?.hasAttribute("inert"),returnTo=triggerRef.current,dialog=panel.current;document.body.style.overflow="hidden";root?.setAttribute("inert","");dialog?.querySelector("button,a")?.focus({preventScroll:true});
  const key=e=>{if(e.key==="Escape"){e.preventDefault();closeRef.current();return;}if(e.key!=="Tab")return;const list=[...(dialog?.querySelectorAll('a[href],button:not([disabled]),[tabindex="0"]')||[])].filter(el=>!el.hidden);if(!list.length)return;const active=dialog.getRootNode().activeElement,first=list[0],last=list[list.length-1];if(e.shiftKey&&(active===first||!dialog.contains(active))){e.preventDefault();last.focus();}else if(!e.shiftKey&&(active===last||!dialog.contains(active))){e.preventDefault();first.focus();}};
  document.addEventListener("keydown",key);return()=>{document.body.style.overflow=overflow;if(!wasInert)root?.removeAttribute("inert");document.removeEventListener("keydown",key);returnTo?.focus({preventScroll:true});};
 },[open,overlay]);
 if(!open||!overlay)return null;const english=site.language==="en",links=[{href:"#how-it-works",name:copy.how},{href:"#categories",name:copy.categories},{to:"/jobs",name:copy.work},{to:"/find-talent",name:copy.find},{to:session?"/account":"/register",name:session?copy.account:copy.register}];
 return createPortal(<div ref={panel} id="ih47-menu" className="menu" role="dialog" aria-modal="true" aria-labelledby="ih47-menu-title" data-no-translate="true"><div className="menu-top"><IH47Brand onClick={onClose}/><button className="menu-close" type="button" onClick={onClose} aria-label={copy.close}><span>{english?"Close":"Zamknij"}</span><IH47Burger open/></button></div><div className="menu-body"><div><span className="eyebrow" id="ih47-menu-title">{copy.menu}</span><nav className="menu-links">{links.map((item,i)=>{const Item=item.to?Link:"a";return <Item key={i} {...(item.to?{to:item.to}:{href:item.href})} style={{"--index":i}} onClick={e=>{onClose();if(item.href){e.preventDefault();requestAnimationFrame(()=>onAnchor(item.href));}}}><small>0{i+1}</small><span>{item.name}</span><IH47Arrow/></Item>;})}</nav></div><div className="menu-settings"><span className="eyebrow">{copy.theme}</span><IH47ThemeButtons site={site} copy={copy}/><div className="menu-options"><button type="button" onClick={()=>site.setTheme(site.theme==="dark"?"light":"dark")}>{site.theme==="dark"?copy.light:copy.dark}<span aria-hidden="true">◐</span></button><button type="button" onClick={()=>site.setLanguage(english?"pl":"en")}>{english?"Polski":"English"}<span aria-hidden="true">{english?"PL":"EN"}</span></button></div>{session?<><Link className="menu-account-link" to="/notifications" onClick={onClose}>{copy.notices}{hasNotifications&&<i/>}<IH47Arrow/></Link><button className="menu-logout" type="button" onClick={()=>{onClose();logout();}}>{copy.logout}<IH47Arrow/></button></>:<Link className="menu-account-link" to="/login" onClick={onClose}>{copy.login}<IH47Arrow/></Link>}<p>{copy.summary}</p><IH47Mark/></div></div></div>,overlay);
}
const IH47_CATEGORY_EN={Programowanie:"Web, apps and IT","Grafika i design":"Graphics, UX and 3D",Marketing:"Marketing and sales",Copywriting:"Copy and translation",Video:"Video, motion and audio",Fotografia:"Photography","AI i automatyzacje":"AI and automation","Dane, analizy i research":"Data and research","Biznes i e-commerce":"Business and e-commerce","Architektura, wnętrza i CAD":"Architecture and CAD"};
const IH47_CATEGORY_COPY={
  Programowanie:["Strona firmowa, sklep, aplikacja lub techniczne wsparcie.","Company websites, shops, apps and technical support."],
  "Grafika i design":["Identyfikacja, projekt interfejsu i grafika do publikacji.","Brand identities, interface design and graphics for publication."],
  Marketing:["Kampanie, komunikacja i promocja Twojej działalności.","Campaigns, communication and promotion for your business."],
  Copywriting:["Teksty na stronę, artykuły i tłumaczenia.","Website copy, articles and translations."],
  Video:["Montaż, animacja i dźwięk do Twojego materiału.","Editing, animation and sound for your content."],
  Fotografia:["Sesje zdjęciowe, retusz i zdjęcia produktów.","Photo shoots, retouching and product photography."],
  "AI i automatyzacje":["Automatyzacja zadań i połączenie narzędzi, z których korzystasz.","Task automation and connections between the tools you use."],
  "Dane, analizy i research":["Uporządkowanie danych, analiza i sprawdzenie informacji.","Data organisation, analysis and research."],
  "Biznes i e-commerce":["Wsparcie w prowadzeniu działalności i sklepu internetowego.","Support for your business and online shop."],
  "Architektura, wnętrza i CAD":["Projekty przestrzeni, wizualizacje i dokumentacja techniczna.","Space design, visualisations and technical drawings."]
};
function ih47RealJob(job){return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(job?.id||''));}
function useIH47Reduced(){const[reduced,setReduced]=useState(()=>typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false);useEffect(()=>{const m=window.matchMedia?.('(prefers-reduced-motion: reduce)');if(!m)return;const change=()=>setReduced(m.matches);m.addEventListener?.('change',change);return()=>m.removeEventListener?.('change',change);},[]);return reduced;}
function IH47FeeStrip({english}){const o=IDEA_HIRE_PUBLIC_OFFER,n=x=>x.toLocaleString(english?'en-GB':'pl-PL');return <a className="fee-strip" href="#commission"><span><IH47Mark/><strong>{n(o.percent)}%</strong> {english?'IdeaHire fee':'prowizji IdeaHire'}</span><span>min. {n(o.minimum)} · {english?'max.':'maks.'} {n(o.maximum)} {english?'PLN':'zł'}</span><span className="fee-description">{english?'Calculate your project':'Policz swoje zlecenie'}<IH47Arrow/></span></a>;}
function IH47Projects({jobs,palette,english,reduced,paused}){
 const[focus,setFocus]=useState(null),actual=jobs.some(ih47RealJob),examples=english?['A website for a new brand','A visual identity','Copy for a company website']:['Strona dla nowej marki','Identyfikacja wizualna','Teksty na stronę firmową'];
 return <section className="chapter projects" id="projects"><div className="section-heading"><span className="eyebrow">01 / {english?'THE PROJECTS':'DO ZROBIENIA'}</span><h2>{english?<>There is work<br/>with your name on it.</>:<>Jest robota.<br/>Może właśnie dla Ciebie.</>}</h2><Link className="text-link" to="/jobs">{english?'All projects':'Wszystkie zlecenia'}<IH47Arrow/></Link></div><div className="project-stage"><div className="job-list">{jobs.slice(0,3).map((job,i)=>{const real=ih47RealJob(job);return <Link className="job" key={job.id||i} to="/jobs" state={real?{lucynaJobId:String(job.id),lucynaTitle:String(job.title)}:undefined} onPointerEnter={()=>setFocus(i)} onPointerLeave={()=>setFocus(null)} onFocus={()=>setFocus(i)} onBlur={()=>setFocus(null)}><small>0{i+1}</small><div><span>{real?(english?'Open listing':'Otwarte zlecenie'):(english?'Illustrative brief':'Przykładowy zakres')}</span><strong>{real?job.title:examples[i]}</strong><span className="job-price">{Number(job.budget)>0?ih47Money(job.budget,english):(english?'To agree':'Do ustalenia')}</span></div><IH47Arrow/></Link>;})}<p className="caption">{actual?(english?'See the listing for the full scope and terms.':'Zakres i warunki sprawdzisz w ogłoszeniu.'):(english?'These examples show the types of projects you can post.':'Przykłady pokazują, co możesz zlecić na IdeaHire.')}</p></div><IH47Space mode="projects" selected={focus??0} jobs={jobs} palette={palette} english={english} reduced={reduced} paused={paused}/></div></section>;
}
function IH47Categories({groups,palette,english,reduced,paused}){
 const[selection,setSelection]=useState(groups[0]?.value||'Programowanie'),buttons=useRef([]);const current=Math.max(0,groups.findIndex(x=>x.value===selection)),group=groups[current]||{value:'Programowanie',label:'Strony, aplikacje i IT',subcategories:[]};const label=english?IH47_CATEGORY_EN[group.value]||group.label:group.label;
 const category=useMemo(()=>({label,specialisms:(group.subcategories||[]).map(s=>english?translateUiText(s):s)}),[label,group,english]);
 function key(e,index){if(!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?groups.length-1:(index+(['ArrowDown','ArrowRight'].includes(e.key)?1:groups.length-1))%groups.length;setSelection(groups[next].value);buttons.current[next]?.focus({preventScroll:true});}
 return <section className="chapter categories" id="categories"><div className="section-heading"><span className="eyebrow">02 / {english?'YOUR FIELD':'TWÓJ FACH'}</span><h2>{english?<>Different skills.<br/>A place to meet.</>:<>Różne umiejętności.<br/>Wspólne miejsce.</>}</h2><p>{english?'Choose a field. Then go straight to the specialism you need.':'Wybierz dziedzinę. Dalej są konkretne specjalizacje.'}</p></div><div className="category-stage"><IH47Space mode="categories" selected={current%3} category={category} palette={palette} english={english} reduced={reduced} paused={paused}/><div className="category-tabs" role="tablist" aria-orientation="vertical" aria-label={english?'Categories':'Kategorie'}>{groups.map((g,i)=><button ref={el=>buttons.current[i]=el} id={'ih47-cat-'+i} type="button" role="tab" aria-selected={i===current} aria-controls="ih47-specialisms" tabIndex={i===current?0:-1} key={g.value} onClick={()=>setSelection(g.value)} onKeyDown={e=>key(e,i)}><small>{String(i+1).padStart(2,'0')}</small><span>{english?IH47_CATEGORY_EN[g.value]||g.label:g.label}</span><IH47Arrow/></button>)}</div></div><div className="category-detail" id="ih47-specialisms" role="tabpanel" aria-labelledby={'ih47-cat-'+current} tabIndex={0}><div><span className="eyebrow">{String(current+1).padStart(2,'0')} / {english?'SPECIALISMS':'SPECJALIZACJE'}</span><h3>{label}</h3><p>{(IH47_CATEGORY_COPY[group.value]||['Znajdź projekt dla siebie.','Find your next project.'])[english?1:0]}</p></div><div><div className="specialisms">{(group.subcategories||[]).map(s=><Link key={s} to={'/jobs?'+new URLSearchParams({category:group.value,subcategory:s})}>{english?translateUiText(s):s}<span aria-hidden="true">↗</span></Link>)}</div><Link className="text-link" to={'/jobs?'+new URLSearchParams({category:group.value})}>{english?'Browse this field':'Przejrzyj tę dziedzinę'}<IH47Arrow/></Link></div></div></section>;
}
function IH47Commission({palette,english,reduced,paused}){
 const[value,setValue]=useState('2200'),offer=IDEA_HIRE_PUBLIC_OFFER,amount=Math.max(1,Math.min(offer.orderLimit,Math.round(Number(value)||1))),fee=ih47Fee(amount,offer),money=n=>ih47Money(n,english);
 return <section className="chapter commission" id="commission"><div className="section-heading"><span className="eyebrow">03 / {english?'THE NUMBERS':'POLICZMY TO'}</span><h2>{english?<>Your project.<br/>A clear calculation.</>:<>Twoje zlecenie.<br/>Jasny rachunek.</>}</h2><p>{english?'The client pays the IdeaHire fee. The professional gets the agreed project amount.':'Prowizję IdeaHire płaci zleceniodawca. Wykonawca otrzymuje ustaloną kwotę zlecenia.'}</p></div><div className="fee-stage"><div className="calculator"><div className="fee-rate"><strong>{offer.percent.toLocaleString(english?'en-GB':'pl-PL')}<span>%</span></strong><span>min. {money(offer.minimum)}<br/>{english?'max.':'maks.'} {money(offer.maximum)}</span></div><label htmlFor="ih47-budget">{english?'Project value':'Wartość zlecenia'}<span className="budget-field"><input id="ih47-budget" type="number" inputMode="numeric" min="1" max={offer.orderLimit} step="1" value={value} onChange={e=>setValue(e.target.value)} onBlur={()=>setValue(String(amount))}/><span>{english?'PLN':'zł'}</span></span></label><input className="budget-range" type="range" min="1" max={offer.orderLimit} step="1" value={amount} onChange={e=>setValue(e.target.value)} aria-label={english?'Project value slider':'Suwak wartości zlecenia'} aria-valuetext={money(amount)}/><div className="budget-presets" role="group" aria-label={english?'Example amounts':'Przykładowe kwoty'}>{[500,1500,4000,10000].map(n=><button type="button" key={n} aria-pressed={amount===n} onClick={()=>setValue(String(n))}>{n.toLocaleString(english?'en-GB':'pl-PL')}</button>)}</div><div className="fee-sum" aria-live="polite" aria-atomic="true"><div><span>{english?'Professional receives':'Wykonawca otrzyma'}</span><strong>{money(amount)}</strong></div><div><span>{english?'IdeaHire fee':'Prowizja IdeaHire'}</span><strong>{money(fee)}</strong></div><div className="fee-total"><span>{english?'Client total':'Klient zapłaci'}</span><strong>{money(amount+fee)}</strong></div></div><p className="caption">{english?'Illustrative calculation. The total is confirmed before payment. Projects up to ':'Przykładowe obliczenie. Kwotę potwierdzisz przed płatnością. Zlecenia do '}{money(offer.orderLimit)}.</p></div><IH47Space mode="fees" amount={amount} palette={palette} english={english} reduced={reduced} paused={paused}/></div></section>;
}
function IH47Process({palette,english,reduced,paused}){
 const[active,setActive]=useState(0),steps=english?[['Describe the job.','A scope, a deadline and a budget. Start with the things the other person needs to know.'],['Agree on the details.','Get to know the portfolio. Discuss delivery and revisions, then record your agreement.'],['Do the work.','Keep the conversation, files and delivery details together in the project.']]:[['Opisz, co robimy.','Zakres, termin i budżet. Zacznij od rzeczy, które druga osoba powinna wiedzieć.'],['Zapiszcie ustalenia.','Sprawdź portfolio. Omówcie przekazanie pracy i poprawki, a potem zapiszcie warunki.'],['Dobra. Do roboty.','Rozmowa, pliki i szczegóły przekazania pracy zostają w jednym miejscu przy projekcie.']];
 return <section className="chapter method" id="how-it-works"><div className="section-heading"><span className="eyebrow">04 / {english?'HOW IT WORKS':'JAK TO DZIAŁA'}</span><h2>{english?<>From a conversation<br/>to a finished project.</>:<>Od pierwszego „cześć”<br/>do gotowej pracy.</>}</h2></div><div className="process-stage"><div className="process-tabs" role="tablist" aria-label={english?'Collaboration steps':'Etapy współpracy'}>{steps.map(([title,body],i)=><button id={'ih47-step-'+i} type="button" role="tab" aria-selected={active===i} aria-controls="ih47-step-detail" tabIndex={active===i?0:-1} key={title} onClick={()=>setActive(i)} onKeyDown={e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const next=(i+(e.key==='ArrowDown'?1:2))%3;setActive(next);e.currentTarget.parentElement.children[next]?.focus();}}}><span className="step-index">0{i+1}<IH47Mark/></span><strong>{title}</strong>{active===i&&<p>{body}</p>}</button>)}</div><div id="ih47-step-detail" role="tabpanel" aria-labelledby={'ih47-step-'+active}><IH47Space mode="process" selected={active} palette={palette} english={english} reduced={reduced} paused={paused}/><span className="sr">{steps[active][1]}</span></div></div></section>;
}

function useIH47Reveals(root,reduced){useEffect(()=>{const items=[...(root.current?.querySelectorAll('.section-heading,.paths,.closing')||[])];if(reduced||typeof IntersectionObserver==='undefined')return;const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.dataset.reveal='seen';observer.unobserve(entry.target);}}),{threshold:.08});items.forEach(item=>{item.dataset.reveal='waiting';observer.observe(item);});return()=>{observer.disconnect();items.forEach(item=>delete item.dataset.reveal);};},[reduced]);}

function useIdeaHireScrollHeader(headerRef, slotRef, enabled=true) {
  useLayoutEffect(() => {
    if (!enabled) return undefined;
    const header = headerRef.current, slot = slotRef.current;
    if (!header || !slot) return undefined;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const properties = ["position","top","right","bottom","left","width","max-width","margin","z-index","opacity","translate","transition","pointer-events","box-shadow"];
    const saved = properties.map(name => [name,header.style.getPropertyValue(name),header.style.getPropertyPriority(name)]);
    const originalInert = header.hasAttribute("inert");
    let mode = "home", idle = 0, returning = 0, frame = 0, hovering = false, focused = false, disposed = false, insetLeft = 0, insetRight = 0;
    const set = (name,value) => header.style.setProperty(name,value,"important");
    const hold = () => hovering || focused || Boolean(header.querySelector('[aria-expanded="true"]'));
    function restore() {
      window.clearTimeout(idle); window.clearTimeout(returning); idle = 0; returning = 0;
      mode = "home";
      saved.forEach(([name,value,priority]) => value ? header.style.setProperty(name,value,priority) : header.style.removeProperty(name));
      slot.style.removeProperty("height");
      if (!originalInert) header.removeAttribute("inert");
      header.dataset.scrollHeader = "home";
    }
    function rest() {
      window.clearTimeout(idle); idle = 0;
      if (mode !== "following" || hold()) return;
      mode = "returning"; header.dataset.scrollHeader = "returning";
      set("opacity","0"); set("translate",reduced.matches ? "0 0" : "0 -12px"); set("pointer-events","none");
      header.setAttribute("inert","");
      returning = window.setTimeout(restore,reduced.matches ? 0 : 230);
    }
    function arm() {
      window.clearTimeout(idle);
      if (mode === "following" && !hold()) idle = window.setTimeout(rest,1200);
    }
    function follow() {
      if (disposed) return;
      const box = slot.getBoundingClientRect();
      const beyond = box.bottom < -12;
      if (!beyond) { restore(); return; }
      if (mode === "home") {
        const headerBox = header.getBoundingClientRect();
        insetLeft = headerBox.left - box.left; insetRight = box.right - headerBox.right;
        slot.style.setProperty("height",`${box.height}px`,"important");
        set("position","fixed"); set("top","0px"); set("right","auto"); set("bottom","auto");
        set("left",`${headerBox.left}px`); set("width",`${headerBox.width}px`); set("max-width","none"); set("margin","0");
        set("z-index","500"); set("box-shadow","0 10px 32px rgba(8,16,30,.12)");
        set("transition",reduced.matches ? "none" : "opacity 210ms ease, translate 230ms cubic-bezier(.2,.75,.3,1)");
      }
      window.clearTimeout(returning); returning = 0;
      if (!originalInert) header.removeAttribute("inert");
      mode = "following"; header.dataset.scrollHeader = "following";
      set("opacity","1"); set("translate","0 0"); set("pointer-events","auto"); arm();
    }
    const scroll = () => { if (!frame) frame = window.requestAnimationFrame(() => {frame = 0; follow();}); };
    const enter = event => {if(event.pointerType === "mouse"){hovering = true;window.clearTimeout(idle);}};
    const leave = () => {hovering = false;arm();};
    const focus = () => {focused = true;window.clearTimeout(idle);if(mode === "returning") follow();};
    const blur = event => {if(header.contains(event.relatedTarget)) return;focused = false;arm();};
    const pointer = event => {if(mode === "following" && event.pointerType === "mouse" && !event.buttons) arm();};
    const resize = () => {
      if (mode === "home") return;
      if (!hold()) {restore();return;}
      const box = slot.getBoundingClientRect();set("left",`${box.left + insetLeft}px`);set("width",`${Math.max(0,box.width - insetLeft - insetRight)}px`);
    };
    const hidden = () => {if(document.hidden) restore();};
    const lost = () => {hovering = false;focused = false;arm();};
    const settings = () => {if(mode === "following") set("transition",reduced.matches ? "none" : "opacity 210ms ease, translate 230ms cubic-bezier(.2,.75,.3,1)");};
    const observer = typeof MutationObserver !== "undefined" ? new MutationObserver(arm) : null;
    observer?.observe(header,{subtree:true,attributes:true,attributeFilter:["aria-expanded","data-mobile-menu-open"]});
    header.dataset.scrollHeader = "home";
    window.addEventListener("scroll",scroll,{passive:true});window.addEventListener("resize",resize,{passive:true});window.addEventListener("blur",lost);
    document.addEventListener("pointermove",pointer,{passive:true});document.addEventListener("visibilitychange",hidden);
    header.addEventListener("pointerenter",enter);header.addEventListener("pointerleave",leave);header.addEventListener("focusin",focus);header.addEventListener("focusout",blur);
    reduced.addEventListener?.("change",settings);
    return () => {
      disposed = true;window.cancelAnimationFrame(frame);restore();observer?.disconnect();delete header.dataset.scrollHeader;
      window.removeEventListener("scroll",scroll);window.removeEventListener("resize",resize);window.removeEventListener("blur",lost);
      document.removeEventListener("pointermove",pointer);document.removeEventListener("visibilitychange",hidden);
      header.removeEventListener("pointerenter",enter);header.removeEventListener("pointerleave",leave);header.removeEventListener("focusin",focus);header.removeEventListener("focusout",blur);
      reduced.removeEventListener?.("change",settings);
    };
  },[headerRef,slotRef,enabled]);
}

const categories = [
  { value: "Programowanie", label: "Strony, aplikacje i IT" },
  { value: "Grafika i design", label: "Grafika, UX i 3D" },
  { value: "Marketing", label: "Marketing i sprzedaż" },
  { value: "Copywriting", label: "Teksty i tłumaczenia" },
  { value: "Video", label: "Wideo, animacja i audio" },
  { value: "Fotografia", label: "Fotografia i obróbka zdjęć" },
  { value: "AI i automatyzacje", label: "AI i automatyzacje" },
  { value: "Dane, analizy i research", label: "Dane, analizy i research" },
  { value: "Biznes i e-commerce", label: "Biznes i e-commerce" },
  { value: "Architektura, wnętrza i CAD", label: "Architektura, wnętrza i CAD" },
];

const categoryLabels = Object.fromEntries(
  categories.map((category) => [category.value, category.label])
);

function getCategoryLabel(category) {
  return categoryLabels[category] || category || "Inna kategoria";
}

const fallbackJobs = [
  {
    id: "fallback-1",
    title: "Nowoczesna strona internetowa",
    description:
      "Szukam osoby, która stworzy prostą i szybką stronę dla nowej marki.",
    category: "Programowanie",
    budget: 3000,
  },
  {
    id: "fallback-2",
    title: "Identyfikacja wizualna marki",
    description:
      "Potrzebuję spójnego logo oraz podstawowych materiałów graficznych.",
    category: "Grafika i design",
    budget: 1800,
  },
  {
    id: "fallback-3",
    title: "Teksty na stronę firmową",
    description:
      "Zlecę przygotowanie przejrzystych tekstów do sześciu podstron.",
    category: "Copywriting",
    budget: 900,
  },
];


/* P48: jedna ciągła scena WebGL pod całym widokiem głównym. */
const IH48_WORLD_VERTEX=String.raw`
precision highp float;
attribute vec3 aLocal,aNormal;attribute vec2 aCell;attribute float aSeed;
uniform mat4 uVP;uniform float uTime,uScroll,uChapter,uVelocity;uniform vec2 uPointer;
varying vec3 vNormal,vPosition;varying vec2 vLocal;varying float vSeed,vFold;
vec3 rotate(vec3 p,float x,float y){float a=cos(x),b=sin(x),c=cos(y),d=sin(y);p=vec3(p.x,p.y*a-p.z*b,p.y*b+p.z*a);return vec3(p.x*c+p.z*d,p.y,-p.x*d+p.z*c);}
void main(){
 float t=uTime,chapter=uChapter;
 vec2 cell=aCell;cell.y+=mod(uScroll*.8,1.0)*.64;
 float diagonal=cell.y+cell.x*.43;
 float sweep=13.0-(mod(t,7.5)-1.0)*8.5;
 float ribbon=exp(-pow((diagonal-sweep)/1.45,2.0));
 float second=exp(-pow((cell.x-cell.y*.34-5.5*sin(t*.24+chapter*.5))/2.4,2.0));
 float breath=sin(cell.x*.32+cell.y*.22-t*.55);
 float distanceToPointer=length(cell-uPointer*vec2(9.0,6.0));
 float ripple=sin(distanceToPointer*1.3-t*1.9)*exp(-distanceToPointer*.34)*.16;
 float height=.22*breath+1.15*ribbon+.55*second+ripple;
 float xTurn=.10*cos(cell.y*.3-t*.6)+ribbon*.54+uVelocity*.10;
 float yTurn=.12*sin(cell.x*.33+t*.4)+second*.34;
 float stagger=sin(cell.x*1.7+cell.y*.7+t*.36)*.025;
 vec3 p=rotate(aLocal,xTurn,yTurn);
 p+=vec3(cell.x,cell.y,height+stagger);
 vPosition=p;vNormal=rotate(aNormal,xTurn,yTurn);vLocal=aLocal.xy;vSeed=aSeed;vFold=ribbon;
 gl_Position=uVP*vec4(p,1.0);
}`;
const IH48_WORLD_FRAGMENT=String.raw`
precision highp float;
uniform vec3 uBG,uLight,uEye;uniform float uDark;
varying vec3 vNormal,vPosition;varying vec2 vLocal;varying float vSeed,vFold;
void main(){
 vec3 n=normalize(vNormal),eye=normalize(uEye-vPosition);
 if(dot(n,eye)<0.0)n=-n;
 vec3 light=normalize(vec3(-5.0,8.0,11.0)-vPosition);
 float diffuse=max(dot(n,light),0.0);
 float specular=pow(max(dot(n,normalize(light+eye)),0.0),54.0);
 float edge=smoothstep(.245,.308,max(abs(vLocal.x),abs(vLocal.y)));
 float face=.84+.18*diffuse+specular*.18;
 face-=edge*.11;
 face+=vSeed*.012;
 vec3 col=uBG*face;
 col=mix(col,uLight,specular*(uDark>.5?.10:.08));
 float fog=smoothstep(4.0,16.0,length(vPosition.xy));
 col=mix(col,uBG,fog*.75);
 gl_FragColor=vec4(clamp(col,0.0,1.0),1.0);
}`;
function ih48WorldMesh(){
 const vertices=[],indices=[],put=(p,n,x,y,seed)=>{const i=vertices.length/9;vertices.push(...p,...n,x,y,seed);return i;};
 const inner=[[-.288,-.288],[.288,-.288],[.288,.288],[-.288,.288]],outer=[[-.31,-.31],[.31,-.31],[.31,.31],[-.31,.31]];
 for(let row=0;row<36;row++)for(let col=0;col<48;col++){
  const x=(col-23.5)*.64,y=(row-17.5)*.64,seed=((col*13+row*37)%101)/101;
  const f=inner.map(p=>put([...p,.035],[0,0,1],x,y,seed));indices.push(f[0],f[1],f[2],f[0],f[2],f[3]);
  for(let k=0;k<4;k++){
   const j=(k+1)%4,normal=k===0?[0,-.55,.83]:k===1?[.55,0,.83]:k===2?[0,.55,.83]:[-.55,0,.83];
   const q=[put([...inner[k],.035],normal,x,y,seed),put([...outer[k],.005],normal,x,y,seed),put([...outer[j],.005],normal,x,y,seed),put([...inner[j],.035],normal,x,y,seed)];indices.push(q[0],q[1],q[2],q[0],q[2],q[3]);
   const nn=k===0?[0,-1,0]:k===1?[1,0,0]:k===2?[0,1,0]:[-1,0,0];
   const side=[put([...outer[k],.005],nn,x,y,seed),put([...outer[k],-.055],nn,x,y,seed),put([...outer[j],-.055],nn,x,y,seed),put([...outer[j],.005],nn,x,y,seed)];indices.push(side[0],side[1],side[2],side[0],side[2],side[3]);
  }
 }
 return{vertices,indices};
}
function ih48WorldPlan(s,width,height){
 const aspect=width/height,small=width<700;
 const distance=small?14.8:13.8;
 const eye=[1.1+s.x*.35+Math.sin(s.time*.12)*.18,1.8+s.y*.22+Math.sin(s.scroll*.35)*.4,distance];
 const aim=[0,0,.15],vp=ih47Mul(ih47Perspective((small?48:44)*Math.PI/180,aspect,.1,65),ih47Look(eye,aim));
 return{eye,vp};
}
function ih48WorldRenderer(canvas){
 const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power',depth:true});if(!gl)return null;
 const shaders=[],buffers=[];let program;
 try{
  program=gl.createProgram();for(const[kind,source]of[[gl.VERTEX_SHADER,IH48_WORLD_VERTEX],[gl.FRAGMENT_SHADER,IH48_WORLD_FRAGMENT]]){const sh=gl.createShader(kind);shaders.push(sh);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error('world shader');gl.attachShader(program,sh);}gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('world link');
  gl.useProgram(program);const mesh=ih48WorldMesh();for(const[target,data]of[[gl.ARRAY_BUFFER,new Float32Array(mesh.vertices)],[gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(mesh.indices)]]){const buffer=gl.createBuffer();buffers.push(buffer);gl.bindBuffer(target,buffer);gl.bufferData(target,data,gl.STATIC_DRAW);}
  for(const[name,size,offset]of[['aLocal',3,0],['aNormal',3,12],['aCell',2,24],['aSeed',1,32]]){const a=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,size,gl.FLOAT,false,36,offset);}
  const uniforms={};for(const name of['uVP','uTime','uScroll','uChapter','uVelocity','uPointer','uBG','uLight','uEye','uDark'])uniforms[name]=gl.getUniformLocation(program,name);
  gl.enable(gl.DEPTH_TEST);
  return{draw(width,height,s){
   if(gl.isContextLost())return;if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}gl.viewport(0,0,width,height);gl.useProgram(program);const p=s.palette,plan=ih48WorldPlan(s,s.cssWidth,s.cssHeight),bg=ih47RGB(p.bg);gl.clearColor(...bg,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
   gl.uniformMatrix4fv(uniforms.uVP,false,new Float32Array(plan.vp));for(const[name,value]of[['uTime',s.time],['uScroll',s.scroll],['uChapter',s.chapter],['uVelocity',s.velocity],['uDark',s.dark?1:0]])gl.uniform1f(uniforms[name],value);
   gl.uniform2f(uniforms.uPointer,s.x,s.y);for(const[name,value]of[['uBG',bg],['uLight',ih47RGB(s.dark?p.ink:p.paper)],['uEye',plan.eye]])gl.uniform3fv(uniforms[name],new Float32Array(value));gl.drawElements(gl.TRIANGLES,mesh.indices.length,gl.UNSIGNED_SHORT,0);
  },destroy(){buffers.forEach(b=>gl.deleteBuffer(b));shaders.forEach(sh=>gl.deleteShader(sh));gl.deleteProgram(program);}};
 }catch{buffers.forEach(b=>gl.deleteBuffer(b));shaders.forEach(sh=>gl.deleteShader(sh));if(program)gl.deleteProgram(program);return null;}
}
function ih48StartWorld(canvas,host,root,state){
 let renderer=null,frame=0,dead=false,last=0,lastDraw=0,dirty=true,measure=true,visible=true,observer;const listeners=[];
 const listen=(node,event,fn,options)=>{node.addEventListener(event,fn,options);listeners.push(()=>node.removeEventListener(event,fn,options));};
 const create=()=>{renderer?.destroy();renderer=ih48WorldRenderer(canvas);host.dataset.renderer=renderer?'ready':'fallback';};
 function tick(now){
  frame=0;if(dead||document.hidden||!visible)return;const s=state.current,interval=window.innerWidth<821?1000/30:1000/40;
  if(!s.paused&&!s.reduced&&lastDraw&&now-lastDraw<interval-1){frame=requestAnimationFrame(tick);return;}
  const dt=last?Math.min(.08,(now-last)/1000):0;last=now;lastDraw=now;
  if(measure){const h=Math.max(1,window.innerHeight);s.targetScroll=(window.scrollY||0)/h;const chapters=Array.from(root.current?.querySelectorAll('.chapter')||[]);let chapter=0;chapters.forEach((el,i)=>{if(el.getBoundingClientRect().top<h*.65)chapter=i+1;});s.targetChapter=chapter;measure=false;}
  if(!s.paused&&!s.reduced){s.time+=dt;s.x+=(s.targetX-s.x)*.10;s.y+=(s.targetY-s.y)*.10;const previous=s.scroll;s.scroll+=(s.targetScroll-s.scroll)*.10;s.velocity=ih47Clamp((s.scroll-previous)*15,-1,1);s.chapter+=(s.targetChapter-s.chapter)*.12;}
  if(dirty){s.cssWidth=Math.max(1,window.innerWidth);s.cssHeight=Math.max(1,window.innerHeight);const budget=s.cssWidth<821?430000:1000000,dpr=Math.min(window.devicePixelRatio||1,1.4,Math.sqrt(budget/(s.cssWidth*s.cssHeight)));s.width=Math.round(s.cssWidth*dpr);s.height=Math.round(s.cssHeight*dpr);dirty=false;}
  try{renderer?.draw(s.width,s.height,s);}catch{renderer?.destroy();renderer=null;host.dataset.renderer='fallback';}
  if(renderer&&!s.paused&&!s.reduced)frame=requestAnimationFrame(tick);
 }
 const wake=()=>{if(!dead&&!document.hidden&&visible&&!frame){last=0;lastDraw=0;frame=requestAnimationFrame(tick);}};
 create();listen(window,'scroll',()=>{measure=true;wake();},{passive:true});listen(window,'resize',()=>{dirty=measure=true;wake();},{passive:true});
 listen(window,'pointermove',e=>{if(e.pointerType!=='mouse'||state.current.paused||state.current.reduced)return;state.current.targetX=e.clientX/Math.max(1,window.innerWidth)*2-1;state.current.targetY=1-e.clientY/Math.max(1,window.innerHeight)*2;wake();},{passive:true});
 listen(document,'visibilitychange',()=>{cancelAnimationFrame(frame);frame=0;last=0;if(!document.hidden)wake();});
 listen(canvas,'webglcontextlost',e=>{e.preventDefault();renderer=null;host.dataset.renderer='fallback';cancelAnimationFrame(frame);frame=0;});listen(canvas,'webglcontextrestored',()=>{create();dirty=true;wake();});
 if(typeof IntersectionObserver!=='undefined'){observer=new IntersectionObserver(entries=>{visible=!!entries[0]?.isIntersecting;if(visible)wake();else{cancelAnimationFrame(frame);frame=0;last=0;}});if(root.current)observer.observe(root.current);}
 wake();return{wake,destroy(){dead=true;cancelAnimationFrame(frame);listeners.forEach(fn=>fn());observer?.disconnect();renderer?.destroy();}};
}
function IH48World({rootRef,palette,paused,reduced,dark}){
 const host=useRef(null),canvas=useRef(null),engine=useRef(null),state=useRef({time:1.8,x:0,y:0,targetX:0,targetY:0,scroll:0,targetScroll:0,chapter:0,targetChapter:0,velocity:0,palette,paused,reduced,dark});
 useLayoutEffect(()=>{Object.assign(state.current,{palette,paused,reduced,dark});engine.current?.wake();},[palette,paused,reduced,dark]);
 useEffect(()=>{engine.current=ih48StartWorld(canvas.current,host.current,rootRef,state);return()=>{engine.current?.destroy();engine.current=null;};},[]);
 return <div ref={host} className="ih48-world" aria-hidden="true"><canvas ref={canvas}/></div>;
}

function IH47Page({session,loading,categoryGroups=[],overlay}){
 const homeRootRef=useRef(null),headerRef=useRef(null),headerSlotRef=useRef(null),mobileMenuButtonRef=useRef(null);
 const[mobileMenuOpen,setMobileMenuOpen]=useState(false),[paused,setPaused]=useState(false);
 const site=useSitePreferences(),english=site.language==='en',mono=site.template==='classic',dark=site.theme==='dark',copy=IH47_COPY[english?'en':'pl'];
 const palette=IDEA_HIRE_VISUAL_SYSTEM[mono?(dark?'monoDark':'mono'):(dark?'turquoiseDark':'turquoise')],reduced=useIH47Reduced();
 useIdeaHireScrollHeader(headerRef,headerSlotRef,true);
 useIH47Reveals(homeRootRef,reduced);
  const [hasNotifications, setHasNotifications] = useState(false);
  const [recentJobs, setRecentJobs] = useState(fallbackJobs);
  const [activeJobIndex, setActiveJobIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    checkNotifications(session);

    function handleNotificationsRead(
      event
    ) {
      if (
        !event?.detail?.userId ||
        event.detail.userId ===
          session?.user?.id
      ) {
        setHasNotifications(false);
      }
    }

    function handleStorage(event) {
      if (
        event.key ===
        `ideahire_read_notifications_${session?.user?.id}`
      ) {
        checkNotifications(session);
      }
    }

    window.addEventListener(
      "ideahire:notifications-read",
      handleNotificationsRead
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    const interval = setInterval(() => {
      if (mounted) {
        checkNotifications(session);
      }
    }, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);

      window.removeEventListener(
        "ideahire:notifications-read",
        handleNotificationsRead
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, [session?.user?.id]);

  useEffect(() => {
    let mounted = true;

    async function loadRecentJobs() {
      try {
        const { data, error } =
          await supabase
            .from("jobs")
            .select(
              "id, title, description, category, budget, created_at"
            )
            .order("created_at", {
              ascending: false,
            })
            .limit(8);

        if (error) {
          console.error(
            "HOME RECENT JOBS ERROR:",
            error
          );
          return;
        }

        if (
          mounted &&
          Array.isArray(data) &&
          data.length > 0
        ) {
          setRecentJobs(data);
          setActiveJobIndex(0);
        }
      } catch (error) {
        console.error(
          "HOME RECENT JOBS ERROR:",
          error
        );
      }
    }

    loadRecentJobs();

    const channel = supabase
      .channel("home-recent-jobs")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "jobs",
        },
        () => {
          loadRecentJobs();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (recentJobs.length <= 1) return undefined;

    const interval = window.setInterval(
      () => {
        setActiveJobIndex(
          (current) =>
            (current + 1) % recentJobs.length
        );
      },
      4500
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [recentJobs.length]);

  useLayoutEffect(() => {
    const root = document.querySelector(".app");

    if (!root) return undefined;

    const revealElements = Array.from(
      root.querySelectorAll(".home-reveal")
    );

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    root.classList.add("home-motion-ready");

    revealElements.forEach((element) => {
      const group = element.parentElement;
      const groupedElements = group
        ? Array.from(group.children).filter((child) =>
            child.classList.contains("home-reveal")
          )
        : [];
      const position = Math.max(
        0,
        groupedElements.indexOf(element)
      );

      element.style.setProperty(
        "--home-reveal-delay",
        `${Math.min(position, 5) * 75}ms`
      );
    });

    if (
      prefersReducedMotion ||
      !("IntersectionObserver" in window)
    ) {
      revealElements.forEach((element) => {
        element.classList.add("is-visible");
      });

      return () => {
        root.classList.remove("home-motion-ready");
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target;

          if (entry.isIntersecting) {
            element.classList.add("is-visible");
            element.classList.remove(
              "is-above",
              "is-below"
            );
            return;
          }

          element.classList.remove("is-visible");

          const viewportTop =
            entry.rootBounds?.top || 0;
          const viewportBottom =
            entry.rootBounds?.bottom ||
            window.innerHeight;

          if (
            entry.boundingClientRect.bottom <=
            viewportTop
          ) {
            element.classList.add("is-above");
            element.classList.remove("is-below");
          } else if (
            entry.boundingClientRect.top >=
            viewportBottom
          ) {
            element.classList.add("is-below");
            element.classList.remove("is-above");
          }
        });
      },
      {
        threshold: [0, 0.08, 0.18],
        rootMargin: "-5% 0px -5% 0px",
      }
    );

    revealElements.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
      root.classList.remove("home-motion-ready");
    };
  }, []);

  async function checkNotifications(currentSession) {
    const userId = currentSession?.user?.id;

    if (!userId) {
      setHasNotifications(false);
      return;
    }

    try {
      const { data: myJobs, error: jobsError } = await supabase
        .from("jobs")
        .select("id")
        .eq("user_id", userId);

      if (jobsError) {
        console.error("HOME NOTIFICATION JOBS ERROR:", jobsError);
        return;
      }

      const jobIds = (myJobs || []).map((job) => job.id);

      let applications = [];

      if (jobIds.length > 0) {
        const {
          data,
          error: applicationsError,
        } = await supabase
          .from("job_applications")
          .select("id, job_id, applicant_id, created_at")
          .in("job_id", jobIds)
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        if (applicationsError) {
          console.error(
            "HOME NOTIFICATION APPLICATIONS ERROR:",
            applicationsError
          );
          return;
        }

        applications = data || [];
      }

      const readKey = `ideahire_read_notifications_${userId}`;

      let readIds = [];

      try {
        const storedReadIds = JSON.parse(
          localStorage.getItem(readKey) || "[]"
        );

        readIds = Array.isArray(storedReadIds)
          ? storedReadIds
          : [];
      } catch {
        readIds = [];
      }

      const [
        rejectedResult,
        acceptedResult,
        blockedResult,
      ] = await Promise.all([
        supabase
          .from("job_applications")
          .select("id")
          .eq("applicant_id", userId)
          .eq("status", "rejected"),

        supabase
          .from("job_applications")
          .select("id")
          .eq("applicant_id", userId)
          .eq("status", "accepted"),

        supabase
          .from("user_blocks")
          .select("id")
          .eq("blocked_id", userId),
      ]);

      if (rejectedResult.error) {
        console.error(
          "HOME REJECTED NOTIFICATIONS ERROR:",
          rejectedResult.error
        );
      }

      if (acceptedResult.error) {
        console.error(
          "HOME ACCEPTED NOTIFICATIONS ERROR:",
          acceptedResult.error
        );
      }

      if (blockedResult.error) {
        console.error(
          "HOME BLOCK NOTIFICATIONS ERROR:",
          blockedResult.error
        );
      }

      const hasUnreadIncoming =
        (applications || []).some(
          (application) =>
            !readIds.includes(
              `incoming:${application.id}`
            )
        );

      const hasUnreadRejected =
        (rejectedResult.data || []).some(
          (application) =>
            !readIds.includes(
              `rejected:${application.id}`
            )
        );

      const hasUnreadAccepted =
        (acceptedResult.data || []).some(
          (application) =>
            !readIds.includes(
              `accepted:${application.id}`
            )
        );

      const hasUnreadBlock =
        (blockedResult.data || []).some(
          (block) =>
            !readIds.includes(
              `blocked:${block.id}`
            )
        );

      setHasNotifications(
        hasUnreadIncoming ||
          hasUnreadRejected ||
          hasUnreadAccepted ||
          hasUnreadBlock
      );
    } catch (error) {
      console.error("HOME NOTIFICATION CHECK ERROR:", error);
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(`Nie udało się wylogować: ${error.message}`);
      return;
    }

    navigate("/");
  }

  const userName =
    session?.user?.user_metadata?.name ||
    session?.user?.email?.split("@")[0] ||
    "Użytkownik";

  const avatarUrl =
    session?.user?.user_metadata
      ?.avatar_url || "";

  const userInitial = userName
    .charAt(0)
    .toUpperCase();

  const activeJob =
    recentJobs[
      activeJobIndex % recentJobs.length
    ] || fallbackJobs[0];

  const nextJob =
    recentJobs[
      (activeJobIndex + 1) %
        recentJobs.length
    ] || fallbackJobs[1];

  const followingJob =
    recentJobs[
      (activeJobIndex + 2) %
        recentJobs.length
    ] || fallbackJobs[2];

  function formatBudget(value) {
    return `${Number(
      value || 0
    ).toLocaleString("pl-PL")} zł`;
  }


 function anchor(hash){const id=hash.slice(1).replace(/[^a-z0-9_-]/gi,''),el=homeRootRef.current?.querySelector('[id="'+id+'"]');el?.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});if(id==='ih47-content')el?.focus({preventScroll:true});}
 function anchorClick(e){const link=e.target.closest?.('a[href^="#"]');if(link){e.preventDefault();anchor(link.getAttribute('href'));}}
 useEffect(()=>{if(window.location.hash){const frame=requestAnimationFrame(()=>anchor(window.location.hash));return()=>cancelAnimationFrame(frame);}},[]);
 const motionPaused=paused||mobileMenuOpen;
 return <><div ref={homeRootRef} className="site ih47-home" data-no-translate="true" data-paused={paused||reduced} onClick={anchorClick}><IH48World rootRef={homeRootRef} palette={palette} paused={motionPaused} reduced={reduced} dark={dark}/><div className="view"><a className="skip" href="#ih47-content">{english?'Skip to content':'Przejdź do treści'}</a>
 <div ref={headerSlotRef} className="header-slot"><header ref={headerRef} className="masthead"><IH47FeeStrip english={english}/><div className="navigation"><IH47Brand/><nav className="quick-nav" aria-label={copy.menu}><a href="#how-it-works">{copy.how}</a><a href="#categories">{copy.categories}</a><a href="#commission">{copy.fee}</a></nav><div className="header-tools"><button type="button" className="palette-now" onClick={()=>setMobileMenuOpen(true)} aria-label={copy.theme}><i className={'swatch'+(mono?' mono':'')}/><span>{mono?copy.mono:copy.turquoise}</span></button>{loading?<span className="avatar" aria-busy="true"><span className="sr">{english?'Loading account':'Wczytywanie konta'}</span></span>:session?<Link className="avatar" to="/account" aria-label={copy.account}>{avatarUrl?<img src={avatarUrl} alt=""/>:<span>{userInitial}</span>}{hasNotifications&&<i/>}</Link>:<Link className="login-link" to="/login">{copy.login}</Link>}<button ref={mobileMenuButtonRef} className="menu-trigger" type="button" onClick={()=>setMobileMenuOpen(true)} aria-label={copy.menu} aria-expanded={mobileMenuOpen} aria-controls="ih47-menu"><span>{copy.menu}</span><IH47Burger/></button></div></div></header></div>
 <main id="ih47-content" tabIndex={-1}><div className="intro-film"><IdeaHireCinematicHero paused={motionPaused} onPause={setPaused}/></div><div className="film-underbar"><span><IH47Mark/>{english?'An idea is a start. Meet the person who can take it further.':'Pomysł to początek. Poznaj osobę, z którą zrobisz następny krok.'}</span><a href="#projects">{english?'See what is next':'Zobacz, co dalej'}<IH47Arrow/></a></div>
 <div className="lower-heading"><span className="eyebrow">IDEAHIRE / {english?'FROM AN IDEA TO WORK':'OD POMYSŁU DO PRACY'}</span><button className="pause-all" type="button" onClick={()=>setPaused(!paused)} disabled={reduced} aria-pressed={paused||reduced}><svg viewBox="0 0 24 24" aria-hidden="true"><path d={paused?'m8 5 11 7-11 7Z':'M8 5v14M16 5v14'} fill="none" stroke="currentColor" strokeWidth="1.6"/></svg>{paused?(english?'Resume motion':'Wznów ruch'):(english?'Pause motion':'Zatrzymaj ruch')}</button></div>
 <IH47Projects jobs={recentJobs} palette={palette} english={english} reduced={reduced} paused={motionPaused}/><IH47Categories groups={categoryGroups.length?categoryGroups:categories} palette={palette} english={english} reduced={reduced} paused={motionPaused}/><IH47Commission palette={palette} english={english} reduced={reduced} paused={motionPaused}/><IH47Process palette={palette} english={english} reduced={reduced} paused={motionPaused}/>
 <section className="paths" id="for-users" aria-label={english?'Choose your next step':'Wybierz swój następny krok'}><Link to="/find-talent"><IH47Mark/><span><small>{english?'I have a project':'Mam projekt'}</small><strong>{english?'I need a professional.':'Szukam wykonawcy.'}</strong></span><IH47Arrow/></Link><Link to="/jobs"><IH47Mark/><span><small>{english?'I have the skills':'Mam umiejętności'}</small><strong>{english?'I need a project.':'Szukam zlecenia.'}</strong></span><IH47Arrow/></Link></section><section className="closing"><IH47Mark/><h2>{english?<>Your next project.<br/>Start here.</>:<>Twój następny projekt.<br/>Zacznij tutaj.</>}</h2><div className="closing-actions"><Link className="button primary" to={session?'/account':'/register'}>{session?copy.account:copy.register}<IH47Arrow/></Link><Link className="button" to="/jobs">{copy.work}<IH47Arrow/></Link></div></section>
 </main><footer className="footer"><div><IH47Brand/><p>{english?'Where a project meets the skills to make it happen.':'Miejsce spotkania pomysłu z wykonaniem.'}</p></div><nav aria-label={copy.legal}><a href={helpCenterHref()} onClick={e=>{e.currentTarget.href=helpCenterHref();}} referrerPolicy="no-referrer">{copy.help}</a><Link to="/regulamin">{copy.terms}</Link><Link to="/polityka-prywatnosci">{copy.privacy}</Link><Link to="/polityka-cookies">Cookies</Link><a href="mailto:ideahireprywatnosc@gmail.com?subject=Zg%C5%82oszenie%20nielegalnej%20tre%C5%9Bci%20w%20IdeaHire">{copy.illegal}</a></nav><span>© {new Date().getFullYear()} IdeaHire</span></footer>
 </div></div><IH47Menu open={mobileMenuOpen} onClose={()=>setMobileMenuOpen(false)} rootRef={homeRootRef} triggerRef={mobileMenuButtonRef} site={site} copy={copy} session={session} hasNotifications={hasNotifications} logout={handleLogout} overlay={overlay} onAnchor={anchor}/></>;
}

/* Shadow DOM odcina historyczne reguły globalne; kontekst React i routing pozostają wspólne. */
function App(props){
 const host=useRef(null),[mount,setMount]=useState(null),site=useSitePreferences();
 const mono=site.template==="classic",dark=site.theme==="dark",palette=IDEA_HIRE_VISUAL_SYSTEM[mono?(dark?"monoDark":"mono"):(dark?"turquoiseDark":"turquoise")];
 useLayoutEffect(()=>{const element=host.current,shadow=element.shadowRoot||element.attachShadow({mode:"open"});let view=shadow.querySelector('[data-view-mount]'),overlay=shadow.querySelector('[data-overlay-mount]');if(!view){const style=document.createElement("style");style.textContent=IH47_STYLES;view=document.createElement("div");overlay=document.createElement("div");view.dataset.viewMount="";overlay.dataset.overlayMount="";shadow.append(style,view,overlay);}setMount({view,overlay});
  const guard=document.createElement("style");guard.textContent='body.ih47-page{margin:0!important;background:var(--v-bg)!important;color:var(--v-ink)!important}body.ih47-page #root{width:100%!important;max-width:none!important;margin:0!important;padding:0!important;text-align:left!important;overflow:visible!important}body.ih47-page [data-ideahire-stage-host]{display:block!important;width:100%!important;min-height:100svh!important;margin:0!important;padding:0!important;transform:none!important;filter:none!important;contain:none!important}body.ih47-page .site-preferences{display:none!important}';document.head.appendChild(guard);document.body.classList.add("ih47-page");return()=>{guard.remove();document.body.classList.remove("ih47-page");};
 },[]);
 useLayoutEffect(()=>{const element=host.current;Object.entries(palette).forEach(([key,value])=>element.style.setProperty("--"+key,value));},[palette]);
 return <div ref={host} data-ideahire-stage-host="p48" data-no-translate="true">{mount&&createPortal(<IH47Page {...props} overlay={mount.overlay}/>,mount.view)}</div>;
}

export default App;
