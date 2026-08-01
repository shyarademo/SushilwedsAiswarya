"use client";

import { useEffect } from "react";
import CountdownTimer from "@/components/CountdownTimer";
import EventTimeline from "@/components/EventTimeline";
import PortraitScratchCard from "@/components/PortraitScratchCard";
import RsvpSection from "@/components/RsvpSection";
import SideSelector from "@/components/SideSelector";

export default function HomePage() {
  useEffect(() => {
    // Subtle scroll parallax on the welcome text block.
    // Perf-critical: batch writes into requestAnimationFrame (scroll events
    // can fire several times per frame), cache the element, and stop writing
    // once the section has scrolled out of view.
    const welcomeEl = document.getElementById("welcome-text-parallax");

    // The section shifts up by 0.12 × scrollY, so it is fully off-screen
    // once scrollY exceeds (offsetTop + height) / (1 − 0.12)
    let parallaxEnd = Infinity;
    const measure = () => {
      if (welcomeEl) {
        parallaxEnd = (welcomeEl.offsetTop + welcomeEl.offsetHeight) / 0.88;
      }
    };
    measure();

    let rafId = 0;
    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        if (!welcomeEl) return;
        const scrolled = window.scrollY;
        if (scrolled <= parallaxEnd) {
          welcomeEl.style.transform = `translate3d(0, ${scrolled * -0.12}px, 0)`;
        }
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", measure, { passive: true });

    // IntersectionObserver — staggered entrance reveals
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
          }
        });
      },
      { threshold: 0.12 }
    );

    document
      .querySelectorAll(".scroll-anim")
      .forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", measure);
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div className="wrap">

        {/* ── Hero (DO NOT MODIFY) ── */}
        <div className="hero-section">
          <img src="/Toran SVG.svg" alt="Toran" className="hero-toran" />
          <div className="hero-group">
            <img
              src="/Arch and Temple SVG.svg"
              alt="Arch and Temple"
              className="hero-arch"
            />
          </div>
        </div>

        {/* ── Welcome ── */}
        <div className="welcome-text" id="welcome-text-parallax">

          {/* Layered background decoration: watermark &, engraved corners,
              orbiting rings bleeding off the card, drifting gold motes */}
          <div className="welcome-deco" aria-hidden="true">
            <span className="welcome-deco__amp">&amp;</span>
            <span className="welcome-deco__ring welcome-deco__ring--right"></span>
            <span className="welcome-deco__ring welcome-deco__ring--left"></span>
            <span className="welcome-deco__corner welcome-deco__corner--tl"></span>
            <span className="welcome-deco__corner welcome-deco__corner--tr"></span>
            <span className="welcome-deco__corner welcome-deco__corner--bl"></span>
            <span className="welcome-deco__corner welcome-deco__corner--br"></span>
            <span className="welcome-deco__mote welcome-deco__mote--1"></span>
            <span className="welcome-deco__mote welcome-deco__mote--2"></span>
            <span className="welcome-deco__mote welcome-deco__mote--3"></span>
            <span className="welcome-deco__mote welcome-deco__mote--4"></span>
            <span className="welcome-deco__mote welcome-deco__mote--5"></span>
          </div>

          <p className="welcome-tag scroll-anim delay-1">
            Together with their families
          </p>

          {/* Groom block */}
          <div className="welcome-person scroll-anim delay-2">
            <h1 className="welcome-name">Sushil</h1>
            <p className="welcome-parents">
              Son of Shri. Suraj T R &amp; Smt. Sai Latha V S (Late)
            </p>
          </div>

          {/* "&" divider with flanking rules */}
          <div
            className="welcome-amp-wrap scroll-anim delay-3"
            aria-hidden="true"
          >
            <span className="welcome-amp-rule welcome-amp-rule--left"></span>
            <span className="welcome-amp">&amp;</span>
            <span className="welcome-amp-rule welcome-amp-rule--right"></span>
          </div>

          {/* Bride block */}
          <div className="welcome-person scroll-anim delay-4">
            <h1 className="welcome-name">Aiswarya</h1>
            <p className="welcome-parents">
              Daughter of Smt. Anitha M N &amp; Shri. Ajit P Vasu
            </p>
          </div>

          {/* Invitation footer */}
          <div className="welcome-invite scroll-anim delay-5">
            <p className="welcome-invited">You are warmly invited</p>
          </div>

          {/* Countdown to the Muhurtham */}
          <CountdownTimer />

        </div>

        {/* ── Ornamental divider ── */}
        <div className="section-ornament" aria-hidden="true">
          <span className="section-ornament__line section-ornament__line--left"></span>
          <span className="section-ornament__diamond"></span>
          <span className="section-ornament__line section-ornament__line--right"></span>
        </div>

        {/* ── Couple Portrait ── */}
        <section className="portrait-section">
          <div className="portrait-frame-wrap scroll-anim delay-1">
            <PortraitScratchCard />
            <p className="portrait-caption">
              Sushil
              <span className="portrait-caption__amp">&amp;</span>
              Aiswarya
            </p>
          </div>
        </section>

        {/* ── Ornamental divider ── */}
        <div className="section-ornament" aria-hidden="true">
          <span className="section-ornament__line section-ornament__line--left"></span>
          <span className="section-ornament__diamond"></span>
          <span className="section-ornament__line section-ornament__line--right"></span>
        </div>

        {/* ── Event Timeline ── */}
        <EventTimeline />

        {/* ── Ornamental divider ── */}
        <div className="section-ornament" aria-hidden="true">
          <span className="section-ornament__line section-ornament__line--left"></span>
          <span className="section-ornament__diamond"></span>
          <span className="section-ornament__line section-ornament__line--right"></span>
        </div>

        {/* ── Bride side / Groom side ── */}
        <SideSelector />

        {/* ── Ornamental divider ── */}
        <div className="section-ornament" aria-hidden="true">
          <span className="section-ornament__line section-ornament__line--left"></span>
          <span className="section-ornament__diamond"></span>
          <span className="section-ornament__line section-ornament__line--right"></span>
        </div>

        {/* ── RSVP ── */}
        <RsvpSection />

        {/* ── Footer ── */}
        <footer className="footer-section">
          <div className="footer-ornament" aria-hidden="true">
            <span className="footer-ornament__line footer-ornament__line--left"></span>
            <span className="footer-ornament__diamond"></span>
            <span className="footer-ornament__line footer-ornament__line--right"></span>
          </div>

          <div className="footer-compliments">
            <p className="footer-compliments__label">Best Compliments</p>
            <div className="footer-names-wrap">
              <p className="footer-names">Soumil and Arvind</p>
            </div>
          </div>

          <div className="footer-divider" aria-hidden="true">
            <span className="footer-divider__dot"></span>
          </div>

          <div className="footer-farewell">
            <h2 className="footer-thanks">Thank You</h2>
            <p className="footer-message">
              We can&apos;t wait to celebrate with you!
            </p>
          </div>
        </footer>

      </div>
    </>
  );
}
