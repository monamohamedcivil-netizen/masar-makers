"use client";

/* eslint-disable @next/next/no-img-element */

import Script from "next/script";
import { useEffect, useMemo, useState } from "react";

import type { LandingContent, LandingGift } from "@/lib/landing/types";

type Props = {
  content: LandingContent;
  whatsappNumber: string;
  pixelId: string | null;
  isDraft: boolean;
  slug: string;
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const WA_ICON = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.2c-.1-.1-.3-.2-.5-.3Z"
    />
  </svg>
);

function GiftIcon({ icon }: { icon: LandingGift["icon"] }) {
  if (icon === "video") {
    return (
      <svg viewBox="0 0 42 42" aria-hidden="true">
        <rect x="5" y="9" width="32" height="22" rx="4" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <path d="M18 15v10l9-5z" fill="currentColor" />
        <path d="M13 36h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (icon === "cert") {
    return (
      <svg viewBox="0 0 42 42" aria-hidden="true">
        <circle cx="21" cy="17" r="10" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <path d="M15 26l-3 11 9-4 9 4-3-11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 42 42" aria-hidden="true">
      <rect x="7" y="5" width="28" height="32" rx="4" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M13 15h16M13 21h16M13 27h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function isExternal(url: string) {
  return /^https?:\/\//.test(url);
}

function digits(value: string) {
  return value.replace(/[^0-9]/g, "");
}

function displayPhone(n: string) {
  return n.length > 6 ? `+${n.slice(0, n.length - 10)} ${n.slice(-10, -7)} ${n.slice(-7, -4)} ${n.slice(-4)}` : `+${n}`;
}

export default function LandingView({ content: c, whatsappNumber, pixelId, isDraft, slug }: Props) {
  const countries = c.booking.countries.length ? c.booking.countries : [{ name: "", code: "" }];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState(countries[0].code);
  const [country, setCountry] = useState(countries[0].name);
  const [plan, setPlan] = useState(c.booking.planOptions[0] ?? "");
  const [error, setError] = useState("");
  const [source, setSource] = useState("");
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const parts = [q.get("utm_source"), q.get("utm_campaign"), q.get("utm_content")].filter(Boolean);
    setSource(parts.join(" / "));
  }, []);

  const message = useMemo(() => {
    const lines = [
      c.booking.messageIntro,
      `الاسم: ${name.trim()}`,
      `الإيميل: ${email.trim()}`,
      `الواتساب: ${code} ${digits(phone)}`.trim(),
      `الدولة: ${country}`,
      `نوع الرحلة: ${plan}`,
    ];
    if (source) lines.push(`المصدر: ${source}`);
    return lines.join("\n");
  }, [c.booking.messageIntro, name, email, code, phone, country, plan, source]);

  const waHref = `https://wa.me/${digits(whatsappNumber)}?text=${encodeURIComponent(message)}`;

  function onSend(event: React.MouseEvent<HTMLAnchorElement>) {
    let problem = "";
    if (name.trim().length < 2) problem = "اكتب اسمك عشان نعرف نكلمك.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) problem = "الإيميل مش مكتوب صح. مثال: name@email.com";
    else if (digits(phone).length < 8) problem = "رقم الواتساب ناقص. اكتبه من غير كود الدولة.";
    setError(problem);
    if (problem) {
      event.preventDefault();
      return;
    }
    try {
      window.fbq?.("track", "Lead", { content_name: slug, content_category: plan });
    } catch {
      /* Pixel اختياري */
    }
  }

  function onCode(value: string) {
    setCode(value);
    const match = countries.find((item) => item.code === value);
    if (match) setCountry(match.name);
  }

  const plans = [...c.offer.plans].sort((a, b) => Number(b.featured) - Number(a.featured));

  return (
    <div className="mm-lp" dir="rtl" lang="ar">
      {pixelId ? (
        <Script id="mm-lp-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${digits(pixelId)}');fbq('track','PageView');fbq('track','ViewContent',{content_name:'${slug}'});`}
        </Script>
      ) : null}

      {isDraft ? <div className="ribbon">مسودة — تظهر لك كأدمن فقط. انشريها من لوحة التحكم.</div> : null}

      <header className="top">
        <div className="wrap">
          <a className="brand" href="#top" aria-label="صنّاع المسار">
            <img src="/images/branding/masar-makers-email-logo.png" alt="" width={44} height={44} />
            <span>
              <b>صنّاع المسار</b>
              <small>masarmakers.com</small>
            </span>
          </a>
          <a className="btn btn-gold btn-sm" href="#book">
            احجز مكانك
          </a>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="wrap">
            <div className="hero-grid">
              <div>
                <span className="status">
                  <i />
                  {c.hero.badge}
                </span>
                <h1>
                  {c.hero.titleBefore} <em>{c.hero.titleHighlight}</em> {c.hero.titleAfter}
                </h1>
                <p className="lead">{c.hero.lead}</p>
                {c.hero.startDate ? (
                  <div className="start">
                    <b>{c.hero.startLabel}</b>
                    <span className="when">{c.hero.startDate}</span>
                    <span>{c.hero.startNote}</span>
                  </div>
                ) : null}
                <div className="hero-cta">
                  <a className="btn btn-gold" href="#book">
                    {c.hero.ctaBook}
                    {c.hero.ctaBookChip ? <span className="pct-chip">{c.hero.ctaBookChip}</span> : null}
                  </a>
                  <a className="btn btn-ghost" href="#levels">
                    {c.hero.ctaTopics}
                  </a>
                </div>
                {c.hero.note ? <p className="hero-note">{c.hero.note}</p> : null}
              </div>
              <figure className="screen">
                {playing && c.hero.youtubeId ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(c.hero.youtubeId)}?autoplay=1&rel=0`}
                    title={c.seo.title}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <button
                    type="button"
                    className="poster"
                    onClick={() => setPlaying(Boolean(c.hero.youtubeId))}
                    aria-label="تشغيل الفيديو"
                  >
                    <img src={c.hero.image} alt="" />
                    {c.hero.youtubeId ? (
                      <span className="play">
                        <span />
                      </span>
                    ) : null}
                  </button>
                )}
                {!playing ? (
                  <figcaption>
                    <span>{c.hero.caption}</span>
                    <span>MASAR MAKERS</span>
                  </figcaption>
                ) : null}
              </figure>
            </div>

            <div className="facts" role="list">
              {c.facts.map((fact, index) => (
                <div className="fact" role="listitem" key={index}>
                  <b>{fact.value}</b>
                  <span>{fact.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="wrap">
            <div className="sec-head">
              <span className="eyebrow-ar">{c.who.eyebrow}</span>
              <h2>{c.who.title}</h2>
            </div>
            <div className="who">
              {c.who.items.map((item, index) => (
                <article key={index}>
                  <span className="tag">{item.tag}</span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="journey">
          <div className="wrap">
            <div className="sec-head">
              <span className="eyebrow">{c.journey.eyebrow}</span>
              <h2>{c.journey.title}</h2>
              <p className="lead">{c.journey.lead}</p>
            </div>
            <div className="stages">
              {c.journey.stages.map((stage, index) => (
                <article className="stage" key={index}>
                  <img src={stage.image} alt={stage.title} loading="lazy" />
                  <div className="body">
                    <span className="sta">{stage.sta}</span>
                    <h3>
                      {stage.title}
                      <span>{stage.en}</span>
                    </h3>
                    <p>{stage.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="levels">
          <div className="wrap">
            <div className="sec-head">
              <span className="eyebrow-ar">{c.levels.eyebrow}</span>
              <h2>{c.levels.title}</h2>
              <p className="lead">{c.levels.lead}</p>
            </div>
            <div className="levels">
              {c.levels.items.map((level, index) => (
                <article className="level" key={index}>
                  <header>
                    <h3>{level.title}</h3>
                    <span className="badge">{level.badge}</span>
                  </header>
                  <p className="out">
                    <b>هتطلع بإيه؟</b> {level.outcome}
                  </p>
                  <ol className="topics">
                    {level.topics.map((topic, t) => (
                      <li key={t}>
                        <span>{topic.ar}</span>
                        <span className="en">{topic.en}</span>
                      </li>
                    ))}
                  </ol>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="help">
          <div className="wrap">
            <div className="sec-head">
              <span className="eyebrow-ar">{c.help.eyebrow}</span>
              <h2>{c.help.title}</h2>
            </div>
            <div className="help">
              <a href={c.help.chatUrl} target="_blank" rel="noopener">
                <div className="vis" aria-hidden="true">
                  <img className="vthumb dim" src={c.help.chatImage} alt="" loading="lazy" />
                  <div className="chatmock">
                    <div className="hd">
                      <img src="/images/branding/masar-makers-email-logo.png" alt="" />
                      <span>مساعد صنّاع المسار</span>
                      <i />
                    </div>
                    <div className="bub">{c.help.chatBubble}</div>
                    <div className="opts">
                      {c.help.chatOptions.map((option, index) => (
                        <span key={index}>{option}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="txt">
                  <h3>{c.help.chatTitle}</h3>
                  <p>{c.help.chatText}</p>
                  <span className="go">{c.help.chatCta}</span>
                </div>
              </a>
              <a href={c.help.videoUrl} target="_blank" rel="noopener">
                <div className="vis" aria-hidden="true">
                  <img className="vthumb" src={c.help.videoImage} alt="" loading="lazy" />
                  <div className="play">
                    <span />
                  </div>
                  <span className="vlabel">{c.help.videoLabel}</span>
                </div>
                <div className="txt">
                  <h3>{c.help.videoTitle}</h3>
                  <p>{c.help.videoText}</p>
                  <span className="go">{c.help.videoCta}</span>
                </div>
              </a>
            </div>
          </div>
        </section>

        <section>
          <div className="wrap two">
            <div className="sheetbox">
              <span className="eyebrow">{c.outputs.eyebrow}</span>
              <h2 className="mt8">{c.outputs.title}</h2>
              <p className="lead mt8">{c.outputs.lead}</p>
              <div className="deliv">
                {c.outputs.featured.title ? (
                  <div className="feat">
                    <b>{c.outputs.featured.title}</b>
                    <small>{c.outputs.featured.en}</small>
                  </div>
                ) : null}
                {c.outputs.items.map((item, index) => (
                  <div key={index}>
                    <b>{item.title}</b>
                    <small>{item.en}</small>
                  </div>
                ))}
              </div>
            </div>
            <div className="sheetbox">
              <span className="eyebrow-ar">{c.gifts.eyebrow}</span>
              <ul className="gifts">
                {c.gifts.items.map((gift, index) => (
                  <li key={index}>
                    <GiftIcon icon={gift.icon} />
                    <div>
                      <h3>{gift.title}</h3>
                      <p>{gift.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="pricing">
          <div className="wrap">
            <div className="sec-head">
              <span className="eyebrow-ar">{c.offer.eyebrow}</span>
              <h2>{c.offer.title}</h2>
            </div>
            <div className="offer">
              <div className="pct">
                <small>{c.offer.percentLabel}</small>
                {c.offer.percent}
              </div>
              <div>
                <h3>{c.offer.heading}</h3>
                <p>{c.offer.text}</p>
              </div>
            </div>
            <div className="prices">
              {plans.map((planItem, index) => (
                <article className={`price${planItem.featured ? " best" : ""}`} key={index}>
                  <span className="flag">{planItem.flag || "—"}</span>
                  <h3>{planItem.title}</h3>
                  <p className="muted">{planItem.desc}</p>
                  <ul>
                    {planItem.bullets.map((bullet, b) => (
                      <li key={b}>{bullet}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="book">
          <div className="wrap book">
            <div>
              <span className="eyebrow-ar">{c.booking.eyebrow}</span>
              <h2 className="mt8">{c.booking.title}</h2>
              <ol className="steps">
                {c.booking.steps.map((step, index) => (
                  <li key={index}>
                    <b>{index + 1}</b>
                    <p>
                      <strong>{step.title}</strong> {step.text}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
            <form onSubmit={(event) => event.preventDefault()} noValidate>
              <div className="row2">
                <label htmlFor="lp-name">
                  الاسم
                  <input id="lp-name" autoComplete="name" placeholder="م. أحمد محمد" value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <label htmlFor="lp-email">
                  الإيميل
                  <input
                    id="lp-email"
                    type="email"
                    autoComplete="email"
                    className="ltr"
                    placeholder="name@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
              </div>
              <label htmlFor="lp-phone">
                رقم الواتساب
                <span className="phone">
                  <select aria-label="كود الدولة" value={code} onChange={(e) => onCode(e.target.value)}>
                    {countries.map((item, index) => (
                      <option key={index} value={item.code}>
                        {item.code ? `${item.code}` : "أخرى"}
                      </option>
                    ))}
                  </select>
                  <input
                    id="lp-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    placeholder="5X XXX XXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </span>
              </label>
              <div className="row2">
                <label htmlFor="lp-country">
                  الدولة
                  <select id="lp-country" value={country} onChange={(e) => setCountry(e.target.value)}>
                    {countries.map((item, index) => (
                      <option key={index}>{item.name}</option>
                    ))}
                  </select>
                </label>
                <label htmlFor="lp-plan">
                  نوع الرحلة
                  <select id="lp-plan" value={plan} onChange={(e) => setPlan(e.target.value)}>
                    {c.booking.planOptions.map((option, index) => (
                      <option key={index}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="err" role="alert">
                {error}
              </p>
              <a className="btn wa" href={waHref} target="_blank" rel="noopener" onClick={onSend}>
                {WA_ICON}
                {c.booking.button}
              </a>
              <p className="form-note">
                {c.booking.note} <span className="num">{displayPhone(digits(whatsappNumber))}</span>
              </p>
            </form>
          </div>
        </section>

        <section>
          <div className="wrap">
            <div className="sec-head">
              <span className="eyebrow-ar">{c.faq.eyebrow}</span>
              <h2>{c.faq.title}</h2>
            </div>
            <div className="faq">
              {c.faq.items.map((item, index) => (
                <details key={index}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="pathband">
          <img className="pathbg" src={c.path.image} alt="" />
          <div className="wrap inner">
            <span className="eyebrow-ar">{c.path.eyebrow}</span>
            <h2>{c.path.title}</h2>
            <ol className="road">
              {c.path.stations.map((station, index) => (
                <li className={station.current ? "here" : undefined} key={index}>
                  <span className="ic">
                    <img src={station.icon} alt="" />
                  </span>
                  <span className="n">{String(index + 1).padStart(2, "0")}</span>
                  <b>{station.title}</b>
                  <small>{station.sub}</small>
                </li>
              ))}
            </ol>
            <div>
              <a
                className="btn btn-gold"
                href={c.path.url}
                {...(isExternal(c.path.url) ? { target: "_blank", rel: "noopener" } : {})}
              >
                {c.path.cta}
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <span>© صنّاع المسار · Masar Makers</span>
          <span>
            واتساب: <span className="num">{displayPhone(digits(whatsappNumber))}</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
