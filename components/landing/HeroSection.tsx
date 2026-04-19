"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Clock, MessageCircle, ArrowRight } from 'lucide-react';
import ParticleHero from '@/components/ui/particle-hero';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15 + 0.3, duration: 0.7, ease: 'easeOut' as const },
  }),
};

const STATS = [
  { value: '69 000+', label: 'spokojených klientů' },
  { value: 'od 2003', label: 'zkušenosti na trhu' },
  { value: '500+', label: 'certifikovaných poradců' },
];

export default function HeroSection() {
  return (
    <ParticleHero className="min-h-screen flex items-center">
      {/* Navbar overlay */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#162459]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#009EE2] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" strokeWidth={1.8} />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">
              Poradce do kapsy
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="#jak-to-funguje"
              className="hidden sm:block text-sm text-white/60 hover:text-white transition-colors font-medium"
            >
              Jak to funguje
            </a>
            <a
              href="#sluzby"
              className="hidden sm:block text-sm text-white/60 hover:text-white transition-colors font-medium"
            >
              Služby
            </a>
            <a
              href="#prihlaseni"
              className="text-sm font-semibold px-4 py-2 rounded-xl border border-[#009EE2]/40 text-[#009EE2] hover:bg-[#009EE2]/10 transition-colors"
            >
              Přihlásit se
            </a>
          </div>
        </div>
      </nav>

      {/* Hero content */}
      <div className="pt-32 pb-20 md:pt-40 md:pb-28 px-6 md:px-12 lg:px-20 w-full">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2 rounded-full mb-8 border border-[#009EE2]/30 bg-[#009EE2]/10 backdrop-blur-sm"
          >
            <span className="w-2 h-2 rounded-full bg-[#009EE2] animate-pulse" />
            <span className="text-[#009EE2]">Certifikovaný poradce ProfiFP · OVB Allfinanz</span>
          </motion.div>

          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
            <div className="w-20 h-1 bg-[#009EE2] mx-auto mb-8 rounded-full" />
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70"
          >
            Profesionální finanční
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#009EE2] to-[#1a9fdd]">
              poradenství online
            </span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed mb-10"
          >
            Vyplňte dotazník, dostanete osobní návrh pojištění, penzijního spoření
            nebo investic — bez schůzek, bez závazků, zcela zdarma.
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6"
          >
            <Link
              href="/signup"
              className="group w-full sm:w-auto px-8 py-4 font-semibold rounded-xl text-white text-base transition-all hover:shadow-lg hover:shadow-[#009EE2]/20 hover:-translate-y-0.5 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #009EE2 0%, #0088c6 100%)' }}
            >
              Začít dotazník zdarma
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#jak-to-funguje"
              className="w-full sm:w-auto px-8 py-4 font-semibold rounded-xl text-white/80 text-base border border-white/20 hover:bg-white/5 transition-all text-center"
            >
              Jak to funguje?
            </a>
          </motion.div>

          <motion.p
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-sm text-white/30"
          >
            Dotazník zabere ~3 minuty · Bez závazků · Zdarma
          </motion.p>
        </div>

        {/* Stats circles - inspired by ProfiFP */}
        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="max-w-3xl mx-auto mt-20"
        >
          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="w-36 h-36 md:w-44 md:h-44 rounded-full border-2 border-[#009EE2]/30 flex flex-col items-center justify-center text-center backdrop-blur-sm bg-[#162459]/30"
              >
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-white/50 px-4">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick benefits strip */}
        <motion.div
          custom={6}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto mt-16"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Clock, text: 'Osobní návrh do 48 hodin' },
              { icon: Shield, text: '100% bezplatné poradenství' },
              { icon: MessageCircle, text: 'Přímý chat s poradcem' },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-3 px-5 py-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm"
              >
                <Icon className="w-5 h-5 text-[#009EE2] shrink-0" />
                <span className="text-sm text-white/70">{text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </ParticleHero>
  );
}
