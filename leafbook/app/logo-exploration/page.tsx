"use client";

import { useState } from "react";

export default function LogoExplorationPage() {
  const [dark, setDark] = useState(false);

  const moss = "#5a7a52";
  const darkMoss = "#3d5637";
  const cream = "#f5f0e8";
  const warmBrown = "#4a3f35";
  const lightMoss = "#8aab7f";

  // Dark mode variants
  const pageBg = dark ? "#1e1e1e" : cream;
  const cardBg = dark ? "#2a2a2a" : "white";
  const cardBorder = dark ? "#3a3a3a" : "#e0d9cf";
  const titleColor = dark ? "#c8d8c0" : darkMoss;
  const subtitleColor = dark ? "#9a9a8a" : "#7a6f63";
  const swatchLabel = dark ? "#b0a89e" : "#5a5047";

  // Logo colors that adapt for dark mode
  const lMoss = dark ? "#7aaa6f" : moss;
  const lDarkMoss = dark ? "#5a8a52" : darkMoss;
  const lLightMoss = dark ? "#9dcb8f" : lightMoss;
  const lLeafFill = dark ? "rgba(122,170,111,0.22)" : "rgba(90,122,82,0.18)";
  const lPageLineColor = dark ? "#9dcb8f" : lightMoss;

  return (
    <div className="min-h-screen py-16 px-8 transition-colors duration-300" style={{ backgroundColor: pageBg }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div />
          <h1 className="font-serif text-4xl text-center" style={{ color: titleColor }}>
            Leafbook Logo Exploration
          </h1>
          <button
            onClick={() => setDark(!dark)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors border"
            style={{
              backgroundColor: dark ? "#3a3a3a" : "white",
              borderColor: cardBorder,
              color: dark ? "#c8d8c0" : warmBrown,
            }}
          >
            {dark ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
        <p className="text-center mb-16 text-lg" style={{ color: subtitleColor }}>
          &ldquo;Pressed leaf bookmark&rdquo; variations
        </p>

        {/* ── Reference: Original Logo 1 ── */}
        <h2 className="font-serif text-2xl mb-6" style={{ color: titleColor }}>
          Original
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-20">
          <LogoCard title="Reference — Classic" description="The original: rounded page, pressed leaf, bookmark ribbon." cardBg={cardBg} cardBorder={cardBorder} titleColor={titleColor} subtitleColor={subtitleColor}>
            <svg viewBox="0 0 200 240" width="200" height="240">
              <rect x="30" y="20" width="140" height="200" rx="12" ry="12" fill="none" stroke={lMoss} strokeWidth="3.5" />
              <line x1="55" y1="160" x2="145" y2="160" stroke={lPageLineColor} strokeWidth="1.5" opacity="0.4" />
              <line x1="55" y1="175" x2="130" y2="175" stroke={lPageLineColor} strokeWidth="1.5" opacity="0.3" />
              <line x1="55" y1="190" x2="140" y2="190" stroke={lPageLineColor} strokeWidth="1.5" opacity="0.2" />
              <polygon points="120,20 120,52 130,44 140,52 140,20" fill={lMoss} opacity="0.85" />
              <g transform="translate(100, 105) rotate(-15)">
                <ellipse cx="0" cy="0" rx="22" ry="40" fill={lLeafFill} />
                <ellipse cx="0" cy="0" rx="22" ry="40" fill="none" stroke={lMoss} strokeWidth="2" />
                <line x1="0" y1="-38" x2="0" y2="38" stroke={lMoss} strokeWidth="1.5" />
                <line x1="0" y1="-22" x2="-16" y2="-10" stroke={lMoss} strokeWidth="1" opacity="0.6" />
                <line x1="0" y1="-22" x2="16" y2="-10" stroke={lMoss} strokeWidth="1" opacity="0.6" />
                <line x1="0" y1="-6" x2="-19" y2="6" stroke={lMoss} strokeWidth="1" opacity="0.5" />
                <line x1="0" y1="-6" x2="19" y2="6" stroke={lMoss} strokeWidth="1" opacity="0.5" />
                <line x1="0" y1="10" x2="-16" y2="22" stroke={lMoss} strokeWidth="1" opacity="0.4" />
                <line x1="0" y1="10" x2="16" y2="22" stroke={lMoss} strokeWidth="1" opacity="0.4" />
                <line x1="0" y1="38" x2="3" y2="50" stroke={lMoss} strokeWidth="1.5" />
              </g>
            </svg>
          </LogoCard>
        </div>

        {/* ── Round 4: Vein Pairs + Page Line Layouts ── */}
        <h2 className="font-serif text-2xl mb-2" style={{ color: titleColor }}>
          Vein Pairs &amp; Page Line Layouts
        </h2>
        <p className="text-sm mb-8" style={{ color: subtitleColor }}>
          2 vein pairs branching from midrib + 3 solid page lines in different arrangements
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">

          {/* ── 1: Oval + lines tight at bottom ── */}
          <LogoCard
            title="1 — Oval, Bottom Cluster"
            description="Original oval with 2 vein pairs. Page lines clustered tight near the bottom — gives the page a grounded, anchored feel."
            cardBg={cardBg} cardBorder={cardBorder} titleColor={titleColor} subtitleColor={subtitleColor}
          >
            <svg viewBox="0 0 200 240" width="200" height="240">
              {/* Page */}
              <rect x="30" y="20" width="140" height="200" rx="12" ry="12" fill="none" stroke={lMoss} strokeWidth="3" />
              {/* Book hinge */}
              <line x1="52" y1="25" x2="52" y2="215" stroke={lMoss} strokeWidth="0.6" opacity="0.2" />
              {/* Bookmark */}
              <polygon points="122,20 122,62 131,53 140,62 140,20" fill={lMoss} opacity="0.8" />
              {/* Page lines — clustered tight at bottom */}
              <line x1="56" y1="190" x2="155" y2="190" stroke={lPageLineColor} strokeWidth="1.2" opacity="0.3" />
              <line x1="56" y1="199" x2="140" y2="199" stroke={lPageLineColor} strokeWidth="1.2" opacity="0.22" />
              <line x1="56" y1="208" x2="148" y2="208" stroke={lPageLineColor} strokeWidth="1.2" opacity="0.15" />
              {/* Solid oval leaf */}
              <g transform="translate(100, 105) rotate(-15)">
                <ellipse cx="0" cy="0" rx="23" ry="42" fill={lMoss} opacity="0.75" />
                {/* Midrib */}
                <line x1="0" y1="-40" x2="0" y2="40" stroke={cardBg} strokeWidth="1.8" opacity="0.5" />
                {/* Vein pair 1 — upper */}
                <line x1="0" y1="-16" x2="-18" y2="-6" stroke={cardBg} strokeWidth="1.2" opacity="0.4" />
                <line x1="0" y1="-16" x2="18" y2="-6" stroke={cardBg} strokeWidth="1.2" opacity="0.4" />
                {/* Vein pair 2 — lower */}
                <line x1="0" y1="8" x2="-20" y2="18" stroke={cardBg} strokeWidth="1.2" opacity="0.3" />
                <line x1="0" y1="8" x2="20" y2="18" stroke={cardBg} strokeWidth="1.2" opacity="0.3" />
                {/* Stem */}
                <line x1="0" y1="40" x2="3" y2="54" stroke={lMoss} strokeWidth="2" strokeLinecap="round" />
              </g>
            </svg>
          </LogoCard>

          {/* ── 2: Pointed + lines staggered lengths ── */}
          <LogoCard
            title="2 — Pointed, Staggered"
            description="Pointed oval with 2 vein pairs. Page lines at staggered lengths — long, short, medium — creating a casual, handwritten rhythm."
            cardBg={cardBg} cardBorder={cardBorder} titleColor={titleColor} subtitleColor={subtitleColor}
          >
            <svg viewBox="0 0 200 240" width="200" height="240">
              {/* Page */}
              <rect x="30" y="20" width="140" height="200" rx="12" ry="12" fill="none" stroke={lMoss} strokeWidth="3" />
              {/* Book hinge */}
              <line x1="52" y1="25" x2="52" y2="215" stroke={lMoss} strokeWidth="0.6" opacity="0.2" />
              {/* Bookmark */}
              <polygon points="122,20 122,62 131,53 140,62 140,20" fill={lMoss} opacity="0.8" />
              {/* Page lines — staggered lengths */}
              <line x1="56" y1="175" x2="155" y2="175" stroke={lPageLineColor} strokeWidth="1.2" opacity="0.3" />
              <line x1="56" y1="188" x2="115" y2="188" stroke={lPageLineColor} strokeWidth="1.2" opacity="0.22" />
              <line x1="56" y1="201" x2="138" y2="201" stroke={lPageLineColor} strokeWidth="1.2" opacity="0.15" />
              {/* Solid pointed leaf */}
              <g transform="translate(100, 105) rotate(-15)">
                <path
                  d="M 0,-44 C 18,-36 26,-14 24,8 C 22,24 12,38 0,46 C -12,38 -22,24 -24,8 C -26,-14 -18,-36 0,-44 Z"
                  fill={lMoss}
                  opacity="0.75"
                />
                {/* Midrib */}
                <line x1="0" y1="-42" x2="0" y2="44" stroke={cardBg} strokeWidth="1.8" opacity="0.5" />
                {/* Vein pair 1 */}
                <line x1="0" y1="-18" x2="-19" y2="-6" stroke={cardBg} strokeWidth="1.2" opacity="0.4" />
                <line x1="0" y1="-18" x2="19" y2="-6" stroke={cardBg} strokeWidth="1.2" opacity="0.4" />
                {/* Vein pair 2 */}
                <line x1="0" y1="6" x2="-21" y2="18" stroke={cardBg} strokeWidth="1.2" opacity="0.3" />
                <line x1="0" y1="6" x2="21" y2="18" stroke={cardBg} strokeWidth="1.2" opacity="0.3" />
                {/* Stem */}
                <line x1="0" y1="44" x2="3" y2="56" stroke={lMoss} strokeWidth="2" strokeLinecap="round" />
              </g>
            </svg>
          </LogoCard>

          {/* ── 3: Fiddle + lines wider spaced ── */}
          <LogoCard
            title="3 — Fiddle, Wide Spread"
            description="Fiddle leaf with 2 vein pairs. Page lines spread wider apart across the lower half — gives the page more breathing room."
            cardBg={cardBg} cardBorder={cardBorder} titleColor={titleColor} subtitleColor={subtitleColor}
          >
            <svg viewBox="0 0 200 240" width="200" height="240">
              {/* Page */}
              <rect x="30" y="20" width="140" height="200" rx="12" ry="12" fill="none" stroke={lMoss} strokeWidth="3" />
              {/* Book hinge */}
              <line x1="52" y1="25" x2="52" y2="215" stroke={lMoss} strokeWidth="0.6" opacity="0.2" />
              {/* Bookmark */}
              <polygon points="122,20 122,62 131,53 140,62 140,20" fill={lMoss} opacity="0.8" />
              {/* Page lines — wider spacing */}
              <line x1="56" y1="168" x2="148" y2="168" stroke={lPageLineColor} strokeWidth="1.2" opacity="0.3" />
              <line x1="56" y1="188" x2="155" y2="188" stroke={lPageLineColor} strokeWidth="1.2" opacity="0.22" />
              <line x1="56" y1="208" x2="135" y2="208" stroke={lPageLineColor} strokeWidth="1.2" opacity="0.15" />
              {/* Fiddle leaf */}
              <g transform="translate(100, 105) rotate(-12)">
                <path
                  d="M 0,-42 C 12,-38 24,-28 28,-14 C 30,-4 28,6 24,12 C 20,18 18,20 20,26 C 22,32 24,34 24,38 C 22,44 12,48 0,50 C -12,48 -22,44 -24,38 C -24,34 -22,32 -20,26 C -18,20 -20,18 -24,12 C -28,6 -30,-4 -28,-14 C -24,-28 -12,-38 0,-42 Z"
                  fill={lMoss}
                  opacity="0.75"
                />
                {/* Midrib */}
                <line x1="0" y1="-40" x2="0" y2="48" stroke={cardBg} strokeWidth="1.8" opacity="0.5" />
                {/* Vein pair 1 — in the wide upper portion */}
                <line x1="0" y1="-20" x2="-22" y2="-8" stroke={cardBg} strokeWidth="1.2" opacity="0.4" />
                <line x1="0" y1="-20" x2="22" y2="-8" stroke={cardBg} strokeWidth="1.2" opacity="0.4" />
                {/* Vein pair 2 — in the lower lobe */}
                <line x1="0" y1="10" x2="-16" y2="22" stroke={cardBg} strokeWidth="1.2" opacity="0.3" />
                <line x1="0" y1="10" x2="16" y2="22" stroke={cardBg} strokeWidth="1.2" opacity="0.3" />
                {/* Stem */}
                <line x1="0" y1="48" x2="2" y2="60" stroke={lMoss} strokeWidth="2" strokeLinecap="round" />
              </g>
            </svg>
          </LogoCard>

          {/* ── 4: Pointed + lines from hinge, descending length ── */}
          <LogoCard
            title="4 — Pointed, Tapered Lines"
            description="Pointed oval with 2 vein pairs. Page lines start from the hinge and get progressively shorter — suggests writing trailing off."
            cardBg={cardBg} cardBorder={cardBorder} titleColor={titleColor} subtitleColor={subtitleColor}
          >
            <svg viewBox="0 0 200 240" width="200" height="240">
              {/* Page */}
              <rect x="30" y="20" width="140" height="200" rx="12" ry="12" fill="none" stroke={lMoss} strokeWidth="3" />
              {/* Book hinge */}
              <line x1="52" y1="25" x2="52" y2="215" stroke={lMoss} strokeWidth="1" opacity="0.35" />
              {/* Bookmark */}
              <polygon points="122,20 122,62 131,53 140,62 140,20" fill={lMoss} opacity="0.8" />
              {/* Page lines — from hinge, progressively shorter */}
              <line x1="52" y1="178" x2="155" y2="178" stroke={lPageLineColor} strokeWidth="1.4" opacity="0.45" />
              <line x1="52" y1="191" x2="130" y2="191" stroke={lPageLineColor} strokeWidth="1.4" opacity="0.35" />
              <line x1="52" y1="204" x2="105" y2="204" stroke={lPageLineColor} strokeWidth="1.4" opacity="0.25" />
              {/* Solid pointed leaf */}
              <g transform="translate(100, 105) rotate(-15)">
                <path
                  d="M 0,-44 C 18,-36 26,-14 24,8 C 22,24 12,38 0,46 C -12,38 -22,24 -24,8 C -26,-14 -18,-36 0,-44 Z"
                  fill={lMoss}
                  opacity="0.75"
                />
                {/* Midrib */}
                <line x1="0" y1="-42" x2="0" y2="44" stroke={cardBg} strokeWidth="1.8" opacity="0.5" />
                {/* Vein pair 1 */}
                <line x1="0" y1="-18" x2="-19" y2="-6" stroke={cardBg} strokeWidth="1.2" opacity="0.4" />
                <line x1="0" y1="-18" x2="19" y2="-6" stroke={cardBg} strokeWidth="1.2" opacity="0.4" />
                {/* Vein pair 2 */}
                <line x1="0" y1="6" x2="-21" y2="18" stroke={cardBg} strokeWidth="1.2" opacity="0.3" />
                <line x1="0" y1="6" x2="21" y2="18" stroke={cardBg} strokeWidth="1.2" opacity="0.3" />
                {/* Stem */}
                <line x1="0" y1="44" x2="3" y2="56" stroke={lMoss} strokeWidth="2" strokeLinecap="round" />
              </g>
            </svg>
          </LogoCard>

          {/* ── 5: Oval + lines centered, even spacing ── */}
          <LogoCard
            title="5 — Oval, Centered Lines"
            description="Original oval with 2 vein pairs. Page lines centered horizontally (not from hinge), evenly spaced — balanced and symmetrical."
            cardBg={cardBg} cardBorder={cardBorder} titleColor={titleColor} subtitleColor={subtitleColor}
          >
            <svg viewBox="0 0 200 240" width="200" height="240">
              {/* Page */}
              <rect x="30" y="20" width="140" height="200" rx="12" ry="12" fill="none" stroke={lMoss} strokeWidth="3" />
              {/* Book hinge */}
              <line x1="52" y1="25" x2="52" y2="215" stroke={lMoss} strokeWidth="0.6" opacity="0.2" />
              {/* Bookmark */}
              <polygon points="122,20 122,62 131,53 140,62 140,20" fill={lMoss} opacity="0.8" />
              {/* Page lines — centered, not from hinge */}
              <line x1="65" y1="178" x2="155" y2="178" stroke={lPageLineColor} strokeWidth="1.2" opacity="0.3" />
              <line x1="75" y1="192" x2="145" y2="192" stroke={lPageLineColor} strokeWidth="1.2" opacity="0.22" />
              <line x1="70" y1="206" x2="150" y2="206" stroke={lPageLineColor} strokeWidth="1.2" opacity="0.15" />
              {/* Solid oval leaf */}
              <g transform="translate(100, 105) rotate(-15)">
                <ellipse cx="0" cy="0" rx="23" ry="42" fill={lMoss} opacity="0.75" />
                {/* Midrib */}
                <line x1="0" y1="-40" x2="0" y2="40" stroke={cardBg} strokeWidth="1.8" opacity="0.5" />
                {/* Vein pair 1 */}
                <line x1="0" y1="-16" x2="-18" y2="-6" stroke={cardBg} strokeWidth="1.2" opacity="0.4" />
                <line x1="0" y1="-16" x2="18" y2="-6" stroke={cardBg} strokeWidth="1.2" opacity="0.4" />
                {/* Vein pair 2 */}
                <line x1="0" y1="8" x2="-20" y2="18" stroke={cardBg} strokeWidth="1.2" opacity="0.3" />
                <line x1="0" y1="8" x2="20" y2="18" stroke={cardBg} strokeWidth="1.2" opacity="0.3" />
                {/* Stem */}
                <line x1="0" y1="40" x2="3" y2="54" stroke={lMoss} strokeWidth="2" strokeLinecap="round" />
              </g>
            </svg>
          </LogoCard>
        </div>

        {/* ── Icon Versions ── */}
        <h2 className="font-serif text-2xl mt-20 mb-2" style={{ color: titleColor }}>
          Icon Versions
        </h2>
        <p className="text-sm mb-8" style={{ color: subtitleColor }}>
          Simplified for small sizes — no hinge, no page lines, larger leaf. Shown at icon size (64px) and enlarged for detail.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">

          {/* ── Icon 1: Page + Bookmark + Large Leaf ── */}
          <LogoCard
            title="Icon 1 — Page + Bookmark"
            description="Simplified page with bookmark and enlarged leaf. No hinge or page lines — reads clearly at small sizes."
            cardBg={cardBg} cardBorder={cardBorder} titleColor={titleColor} subtitleColor={subtitleColor}
          >
            <div className="flex items-center gap-8">
              {/* Large preview */}
              <svg viewBox="0 0 200 240" width="160" height="192">
                <rect x="20" y="10" width="160" height="220" rx="16" ry="16" fill="none" stroke={lMoss} strokeWidth="4" />
                <polygon points="130,10 130,58 141,48 152,58 152,10" fill={lMoss} opacity="0.85" />
                <g transform="translate(100, 120) rotate(-15)">
                  <path
                    d="M 0,-56 C 22,-46 33,-18 30,10 C 28,30 15,48 0,58 C -15,48 -28,30 -30,10 C -33,-18 -22,-46 0,-56 Z"
                    fill={lMoss}
                    opacity="0.8"
                  />
                  <line x1="0" y1="-54" x2="0" y2="56" stroke={cardBg} strokeWidth="2.2" opacity="0.5" />
                  <line x1="0" y1="-24" x2="-24" y2="-8" stroke={cardBg} strokeWidth="1.6" opacity="0.4" />
                  <line x1="0" y1="-24" x2="24" y2="-8" stroke={cardBg} strokeWidth="1.6" opacity="0.4" />
                  <line x1="0" y1="8" x2="-26" y2="22" stroke={cardBg} strokeWidth="1.6" opacity="0.3" />
                  <line x1="0" y1="8" x2="26" y2="22" stroke={cardBg} strokeWidth="1.6" opacity="0.3" />
                  <line x1="0" y1="56" x2="4" y2="70" stroke={lMoss} strokeWidth="2.5" strokeLinecap="round" />
                </g>
              </svg>
              {/* Actual icon size */}
              <div className="flex flex-col items-center gap-2">
                <svg viewBox="0 0 200 240" width="48" height="58">
                  <rect x="20" y="10" width="160" height="220" rx="16" ry="16" fill="none" stroke={lMoss} strokeWidth="4" />
                  <polygon points="130,10 130,58 141,48 152,58 152,10" fill={lMoss} opacity="0.85" />
                  <g transform="translate(100, 120) rotate(-15)">
                    <path
                      d="M 0,-56 C 22,-46 33,-18 30,10 C 28,30 15,48 0,58 C -15,48 -28,30 -30,10 C -33,-18 -22,-46 0,-56 Z"
                      fill={lMoss}
                      opacity="0.8"
                    />
                    <line x1="0" y1="-54" x2="0" y2="56" stroke={cardBg} strokeWidth="2.2" opacity="0.5" />
                    <line x1="0" y1="-24" x2="-24" y2="-8" stroke={cardBg} strokeWidth="1.6" opacity="0.4" />
                    <line x1="0" y1="-24" x2="24" y2="-8" stroke={cardBg} strokeWidth="1.6" opacity="0.4" />
                    <line x1="0" y1="8" x2="-26" y2="22" stroke={cardBg} strokeWidth="1.6" opacity="0.3" />
                    <line x1="0" y1="8" x2="26" y2="22" stroke={cardBg} strokeWidth="1.6" opacity="0.3" />
                    <line x1="0" y1="56" x2="4" y2="70" stroke={lMoss} strokeWidth="2.5" strokeLinecap="round" />
                  </g>
                </svg>
                <span className="text-xs" style={{ color: subtitleColor }}>48px</span>
              </div>
            </div>
          </LogoCard>

          {/* ── Icon 2: Page + Large Leaf, No Bookmark ── */}
          <LogoCard
            title="Icon 2 — Page Only"
            description="Even simpler — just the page outline and a large centered leaf. No bookmark, no hinge. Maximum clarity at tiny sizes."
            cardBg={cardBg} cardBorder={cardBorder} titleColor={titleColor} subtitleColor={subtitleColor}
          >
            <div className="flex items-center gap-8">
              <svg viewBox="0 0 200 240" width="160" height="192">
                <rect x="20" y="10" width="160" height="220" rx="16" ry="16" fill="none" stroke={lMoss} strokeWidth="4" />
                <g transform="translate(100, 120) rotate(-15)">
                  <path
                    d="M 0,-60 C 24,-50 36,-20 33,12 C 30,34 16,52 0,64 C -16,52 -30,34 -33,12 C -36,-20 -24,-50 0,-60 Z"
                    fill={lMoss}
                    opacity="0.8"
                  />
                  <line x1="0" y1="-58" x2="0" y2="62" stroke={cardBg} strokeWidth="2.4" opacity="0.5" />
                  <line x1="0" y1="-26" x2="-26" y2="-10" stroke={cardBg} strokeWidth="1.8" opacity="0.4" />
                  <line x1="0" y1="-26" x2="26" y2="-10" stroke={cardBg} strokeWidth="1.8" opacity="0.4" />
                  <line x1="0" y1="10" x2="-28" y2="26" stroke={cardBg} strokeWidth="1.8" opacity="0.3" />
                  <line x1="0" y1="10" x2="28" y2="26" stroke={cardBg} strokeWidth="1.8" opacity="0.3" />
                  <line x1="0" y1="62" x2="4" y2="78" stroke={lMoss} strokeWidth="2.8" strokeLinecap="round" />
                </g>
              </svg>
              <div className="flex flex-col items-center gap-2">
                <svg viewBox="0 0 200 240" width="48" height="58">
                  <rect x="20" y="10" width="160" height="220" rx="16" ry="16" fill="none" stroke={lMoss} strokeWidth="4" />
                  <g transform="translate(100, 120) rotate(-15)">
                    <path
                      d="M 0,-60 C 24,-50 36,-20 33,12 C 30,34 16,52 0,64 C -16,52 -30,34 -33,12 C -36,-20 -24,-50 0,-60 Z"
                      fill={lMoss}
                      opacity="0.8"
                    />
                    <line x1="0" y1="-58" x2="0" y2="62" stroke={cardBg} strokeWidth="2.4" opacity="0.5" />
                    <line x1="0" y1="-26" x2="-26" y2="-10" stroke={cardBg} strokeWidth="1.8" opacity="0.4" />
                    <line x1="0" y1="-26" x2="26" y2="-10" stroke={cardBg} strokeWidth="1.8" opacity="0.4" />
                    <line x1="0" y1="10" x2="-28" y2="26" stroke={cardBg} strokeWidth="1.8" opacity="0.3" />
                    <line x1="0" y1="10" x2="28" y2="26" stroke={cardBg} strokeWidth="1.8" opacity="0.3" />
                    <line x1="0" y1="62" x2="4" y2="78" stroke={lMoss} strokeWidth="2.8" strokeLinecap="round" />
                  </g>
                </svg>
                <span className="text-xs" style={{ color: subtitleColor }}>48px</span>
              </div>
            </div>
          </LogoCard>

          {/* ── Icon 3: Leaf-Only Mark (no page) ── */}
          <LogoCard
            title="Icon 3 — Leaf Mark"
            description="Just the leaf — works as an app icon or favicon inside a rounded square. Boldest and simplest at any size."
            cardBg={cardBg} cardBorder={cardBorder} titleColor={titleColor} subtitleColor={subtitleColor}
          >
            <div className="flex items-center gap-8">
              <svg viewBox="0 0 120 120" width="160" height="160">
                <rect x="0" y="0" width="120" height="120" rx="24" ry="24" fill={lMoss} opacity="0.12" />
                {/* Bookmark ribbon — top right corner */}
                <polygon points="82,0 82,28 90,22 98,28 98,0" fill={lMoss} opacity="0.8" />
                <g transform="translate(60, 56) rotate(-15)">
                  <path
                    d="M 0,-42 C 18,-34 27,-14 24,8 C 22,24 12,38 0,46 C -12,38 -22,24 -24,8 C -27,-14 -18,-34 0,-42 Z"
                    fill={lMoss}
                    opacity="0.9"
                  />
                  <line x1="0" y1="-40" x2="0" y2="44" stroke={cardBg} strokeWidth="2.2" opacity="0.55" />
                  <line x1="0" y1="-18" x2="-19" y2="-6" stroke={cardBg} strokeWidth="1.6" opacity="0.45" />
                  <line x1="0" y1="-18" x2="19" y2="-6" stroke={cardBg} strokeWidth="1.6" opacity="0.45" />
                  <line x1="0" y1="6" x2="-21" y2="18" stroke={cardBg} strokeWidth="1.6" opacity="0.35" />
                  <line x1="0" y1="6" x2="21" y2="18" stroke={cardBg} strokeWidth="1.6" opacity="0.35" />
                  <line x1="0" y1="44" x2="3" y2="56" stroke={lMoss} strokeWidth="2.5" strokeLinecap="round" />
                </g>
              </svg>
              <div className="flex flex-col items-center gap-2">
                <svg viewBox="0 0 120 120" width="48" height="48">
                  <rect x="0" y="0" width="120" height="120" rx="24" ry="24" fill={lMoss} opacity="0.12" />
                  <polygon points="82,0 82,28 90,22 98,28 98,0" fill={lMoss} opacity="0.8" />
                  <g transform="translate(60, 56) rotate(-15)">
                    <path
                      d="M 0,-42 C 18,-34 27,-14 24,8 C 22,24 12,38 0,46 C -12,38 -22,24 -24,8 C -27,-14 -18,-34 0,-42 Z"
                      fill={lMoss}
                      opacity="0.9"
                    />
                    <line x1="0" y1="-40" x2="0" y2="44" stroke={cardBg} strokeWidth="2.2" opacity="0.55" />
                    <line x1="0" y1="-18" x2="-19" y2="-6" stroke={cardBg} strokeWidth="1.6" opacity="0.45" />
                    <line x1="0" y1="-18" x2="19" y2="-6" stroke={cardBg} strokeWidth="1.6" opacity="0.45" />
                    <line x1="0" y1="6" x2="-21" y2="18" stroke={cardBg} strokeWidth="1.6" opacity="0.35" />
                    <line x1="0" y1="6" x2="21" y2="18" stroke={cardBg} strokeWidth="1.6" opacity="0.35" />
                    <line x1="0" y1="44" x2="3" y2="56" stroke={lMoss} strokeWidth="2.5" strokeLinecap="round" />
                  </g>
                </svg>
                <span className="text-xs" style={{ color: subtitleColor }}>48px</span>
              </div>
            </div>
          </LogoCard>
        </div>

        {/* Color swatch reference */}
        <div className="mt-16 flex flex-wrap justify-center gap-6">
          <Swatch color={moss} label="Moss Green (Primary)" labelColor={swatchLabel} />
          <Swatch color={darkMoss} label="Dark Moss" labelColor={swatchLabel} />
          <Swatch color={lightMoss} label="Light Moss" labelColor={swatchLabel} />
          <Swatch color={warmBrown} label="Warm Brown" labelColor={swatchLabel} />
          <Swatch color={cream} label="Cream (BG)" border labelColor={swatchLabel} />
        </div>
      </div>
    </div>
  );
}

function LogoCard({
  title,
  description,
  children,
  cardBg,
  cardBorder,
  titleColor,
  subtitleColor,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  cardBg: string;
  cardBorder: string;
  titleColor: string;
  subtitleColor: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="rounded-2xl p-8 mb-4 shadow-sm border flex items-center justify-center transition-colors duration-300"
        style={{
          backgroundColor: cardBg,
          borderColor: cardBorder,
          minHeight: 300,
        }}
      >
        {children}
      </div>
      <h2 className="font-serif text-xl mb-1" style={{ color: titleColor }}>
        {title}
      </h2>
      <p className="text-sm max-w-xs" style={{ color: subtitleColor }}>
        {description}
      </p>
    </div>
  );
}

function Swatch({ color, label, border, labelColor }: { color: string; label: string; border?: boolean; labelColor: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-6 h-6 rounded-full"
        style={{
          backgroundColor: color,
          border: border ? "1px solid #ccc" : undefined,
        }}
      />
      <span className="text-sm" style={{ color: labelColor }}>
        {label}
      </span>
    </div>
  );
}
