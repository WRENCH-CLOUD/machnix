"use client"

import React, { useState, useEffect } from 'react';
import { motion, Transition } from 'framer-motion';
import { 
  ArrowRight, 
  Box, 
  Cpu, 
  Shield, 
  Activity, 
  Settings2, 
  Gauge, 
  Terminal,
  Layers,
  Wrench
} from 'lucide-react';

const mechSpring: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 35,
  mass: 1,
};

const SectionLine = () => (
  <div className="w-full h-[1px] bg-white/10 relative my-12 md:my-24">
    <div className="absolute left-0 top-1/2 -mt-[2px] w-1 h-1 bg-white/30" />
    <div className="absolute right-0 top-1/2 -mt-[2px] w-1 h-1 bg-white/30" />
  </div>
);

const SystemStatus = ({ className = "" }) => (
  <motion.div 
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5, ...mechSpring }}
    className={`inline-flex items-center gap-3 px-3 py-1.5 border border-primary/30 bg-primary/5 backdrop-blur-md ${className}`}
  >
    <div className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
    </div>
    <span className="font-mono text-xs text-primary uppercase tracking-[0.2em] font-medium">System GO</span>
  </motion.div>
);

const FeaturesGrid = () => {
  const features = [
    { id: "01", icon: <Cpu />, title: "Computational Logic", desc: "Algorithmic scheduling neutralizes chaotic workflow variations." },
    { id: "02", icon: <Box />, title: "Shadow Boarding", desc: "Every tool, invoice, and assigned task has a strict, designated digital slot." },
    { id: "03", icon: <Activity />, title: "Precision Telemetry", desc: "Real-time workshop analytics delivered via low-latency data pipes." },
    { id: "04", icon: <Shield />, title: "Structural Integrity", desc: "Bulletproof data retention architectures mapping to physical reality." },
    { id: "05", icon: <Gauge />, title: "Torque Calibration", desc: "Adaptive load balancing for peak mechanical throughput." },
    { id: "06", icon: <Layers />, title: "Blueprint Assembly", desc: "Modular interface layering inspired by modernist drafting techniques." }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-white/10 p-[1px]">
      {features.map((f, i) => (
        <motion.div
          key={f.id}
          initial="idle"
          whileHover="hover"
          variants={{
            idle: { backgroundColor: "rgba(10,10,10,1)" },
            hover: { backgroundColor: "rgba(18,18,18,1)" }
          }}
          transition={mechSpring}
          className="relative h-64 p-8 flex flex-col justify-between overflow-hidden group cursor-crosshair bg-[#0a0a0a]"
        >
          <div className="flex justify-between items-start">
            <div className="p-2 border border-white/10 bg-white/5 text-white/50 group-hover:text-primary transition-colors duration-200">
              {f.icon}
            </div>
            <span className="font-mono text-xs text-white/20 group-hover:text-primary/50 transition-colors">
              PNT:{f.id}
            </span>
          </div>
          
          <div className="relative z-10">
            <h3 className="font-serif text-xl text-white mb-2">{f.title}</h3>
            <p className="font-sans text-sm text-white/50 leading-relaxed font-light">
              {f.desc}
            </p>
          </div>

          {/* Mechanical Slide Effect */}
          <motion.div 
            variants={{
              idle: { y: "100%", opacity: 0 },
              hover: { y: "0%", opacity: 1 }
            }}
            transition={mechSpring}
            className="absolute bottom-0 left-0 w-full h-1 bg-primary shadow-[0_0_15px_var(--color-primary)] z-20"
          />
        </motion.div>
      ))}
    </div>
  );
};

export function SwissLanding() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#060606] text-white selection:bg-primary selection:text-white overflow-hidden relative">
      {/* Background Architectural Grid */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '4rem 4rem'
        }}
      />

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
        
        {/* TOP NAV BAR - Minimalist Blueprint Style */}
        <header className="py-8 flex justify-between items-center border-b border-white/10">
          <div className="flex items-center gap-4">
            <Wrench className="w-5 h-5 text-white" />
            <span className="font-serif text-xl tracking-tight">WrenchCloud</span>
          </div>
          <div className="hidden md:flex gap-8 font-mono text-xs uppercase text-white/50 tracking-widest">
            <a href="#architecture" className="hover:text-primary transition-colors">Architecture</a>
            <a href="#systems" className="hover:text-primary transition-colors">Systems</a>
            <a href="#telemetry" className="hover:text-primary transition-colors">Telemetry</a>
          </div>
          <SystemStatus />
        </header>

        {/* HERO SECTION */}
        <section className="pt-24 pb-16 md:pt-40 md:pb-32 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          <div className="col-span-1 lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <h1 className="font-serif text-5xl md:text-7xl lg:text-[5.5rem] leading-[1.05] tracking-tight text-white mb-8">
                Chaos Neutralized. <br className="hidden md:block"/>
                <span className="text-white/40 italic">Operational Clarity Achieved.</span>
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <p className="font-sans text-lg md:text-xl text-white/60 font-light max-w-2xl leading-relaxed mb-12">
                A mastery-engineered facility for your automotive business. WrenchCloud leverages rigorous structural integrity and mathematical clarity to transform disorganized flux into robust operational rhythm.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, ...mechSpring }}
              className="flex flex-col sm:flex-row gap-6 items-start sm:items-center"
            >
              <button className="group relative px-8 py-4 bg-primary text-black font-mono text-sm uppercase tracking-widest overflow-hidden hover:bg-white transition-colors duration-300">
                <span className="relative z-10 flex items-center gap-2 font-bold">
                  Initialize Protocol
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              
              <div className="flex items-center gap-4 font-mono text-xs text-white/40">
                <Box className="w-4 h-4" />
                <span>VERSION 0.1.0-STABLE</span>
              </div>
            </motion.div>
          </div>

          {/* HERO TELEMETRY BOX */}
          <div className="col-span-1 lg:col-span-4 mt-12 lg:mt-0">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, ...mechSpring }}
              className="border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 h-full flex flex-col"
            >
              <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <SystemStatus className="scale-90 origin-left" />
                <span className="font-mono text-xs text-white/30">DAT: {new Date().toISOString().split('T')[0]}</span>
              </div>
              
              <div className="flex-grow space-y-6 flex flex-col justify-center">
                <div>
                  <div className="font-mono text-[10px] text-white/40 uppercase mb-1">Efficiency Delta</div>
                  <div className="font-serif text-4xl text-primary">+47.3%</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] text-white/40 uppercase mb-1">Flux Capacitor State</div>
                  <div className="font-mono text-lg text-white">NOMINAL</div>
                </div>
                <div className="pt-4 border-t border-white/5">
                  <div className="font-mono text-[10px] text-primary uppercase mb-2 flex items-center gap-2">
                    <Terminal className="w-3 h-3" />
                    LIVE TERMINAL
                  </div>
                  <div className="font-mono text-xs text-white/60 space-y-1">
                    <div>&gt; BOOT SEQUENCE INITIATED...</div>
                    <div>&gt; CALIBRATING LOAD... <span className="text-primary">OK</span></div>
                    <div>&gt; STRUCTURAL INTEGRITY... <span className="text-primary">LOCKED</span></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <SectionLine />

        {/* ARCHITECTURE SECTION */}
        <section id="architecture" className="py-16">
          <div className="flex flex-col md:flex-row justify-between items-baseline mb-16 gap-8">
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white tracking-tight">
              Invisible Authority.
            </h2>
            <div className="font-mono text-sm text-white/40 max-w-sm border-l border-primary/30 pl-4">
              Structural grids and typography do the heavy lifting. Function dictates form without decorative excess.
            </div>
          </div>

          <FeaturesGrid />
        </section>

        <SectionLine />

        {/* LABORATORY / DATA SECTION */}
        <section id="systems" className="py-16 grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="order-2 lg:order-1 border border-white/10 bg-white/[0.02] p-8 flex flex-col justify-between min-h-[500px] backdrop-blur-md">
            <div>
              <div className="font-mono text-xs text-primary mb-8 border border-primary/20 bg-primary/5 inline-block px-2 py-1">
                MODULE // 894-B
              </div>
              <h3 className="font-serif text-3xl text-white mb-6">
                Laboratory Precision meets Garage Logic.
              </h3>
              <p className="font-sans text-white/50 leading-relaxed font-light mb-8 max-w-md">
                Drawings from the abstract essence of modernist transit maps, the interface guides the operator seamlessly through complex job pipelines. Every input behaves like a precisely machined mechanism.
              </p>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/40">MECHANICAL RESPONSE</span>
                <span className="text-white">12ms (SNAPPY)</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/40">VISUAL HIERARCHY</span>
                <span className="text-white">RIGID & BREATHABLE</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-white/40">EMOTIONAL ARC</span>
                <span className="text-primary">OPERATIONAL CALM</span>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 flex flex-col gap-6 justify-center">
            {[1, 2, 3].map((item) => (
              <motion.div 
                key={item}
                whileHover={{ x: 10 }}
                transition={mechSpring}
                className="group border border-white/10 bg-[#0a0a0a] p-6 cursor-pointer relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/10 group-hover:bg-primary transition-colors duration-300" />
                <div className="pl-4 flex items-center justify-between">
                  <div>
                    <div className="font-mono text-[10px] text-white/40 mb-2 uppercase">Sub-System {item}.0</div>
                    <div className="font-serif text-xl text-white">Dynamic Routing Mechanics</div>
                  </div>
                  <Settings2 className="w-5 h-5 text-white/20 group-hover:text-primary transition-colors duration-300 group-hover:rotate-90" />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <SectionLine />

        {/* CTA SECTION - THE FINAL SEAL */}
        <section className="py-24 text-center">
          <div className="max-w-3xl mx-auto border border-white/10 bg-white/[0.01] p-12 md:p-24 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 border border-white/20 rounded-full mb-8">
                <Shield className="w-6 h-6 text-primary" />
              </div>

              <h2 className="font-serif text-4xl md:text-5xl text-white mb-6">
                Secure the Engine.
              </h2>
              
              <p className="font-sans text-white/50 text-lg font-light mb-12 max-w-xl mx-auto">
                No decorative excess. Just the definitive tool for the modern automotive professional. The final, secure seal on a perfectly serviced pipeline.
              </p>

              <button className="group relative px-12 py-5 bg-white text-black font-mono text-sm uppercase tracking-widest hover:bg-primary transition-colors duration-500 overflow-hidden">
                <span className="relative z-10 font-bold flex items-center gap-3">
                  Deploy Framework
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.span>
                </span>
                <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              </button>
            </motion.div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="py-12 border-t border-white/10 font-mono text-[10px] uppercase text-white/40 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Wrench className="w-3 h-3" />
            <span>WRENCHCLOUD © {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-8">
            <span className="hover:text-primary cursor-pointer transition-colors">Specifications</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Telemetry</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Coordinates</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
