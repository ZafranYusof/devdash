'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    const elements = ref.current?.querySelectorAll('.reveal');
    elements?.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return ref;
}

export default function Home() {
  const containerRef = useScrollReveal();

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0A0A0A] text-white font-[Inter,sans-serif]">
      <style>{`
        .reveal { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .animate-fade-in { opacity: 1; transform: translateY(0); }
      `}</style>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="reveal text-5xl font-bold tracking-tight sm:text-7xl">
          {'{{DISPLAY_NAME}}'}
        </h1>
        <p className="reveal mt-6 max-w-2xl text-lg text-gray-400">
          The modern platform that helps you ship faster, scale effortlessly, and delight your users from day one.
        </p>
        <div className="reveal mt-10 flex flex-wrap gap-4 justify-center">
          <Link href="/register" className="rounded-md bg-white px-6 py-3 font-semibold text-black hover:bg-gray-200 transition">
            Get Started Free
          </Link>
          <Link href="/pricing" className="rounded-md border border-[#333] px-6 py-3 font-semibold text-white hover:border-[#555] transition">
            View Pricing
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <h2 className="reveal text-3xl font-bold text-center mb-12">Everything you need</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Lightning Fast', desc: 'Optimized for speed with edge deployments and smart caching.' },
            { title: 'Secure by Default', desc: 'Enterprise-grade security with encryption at rest and in transit.' },
            { title: 'Analytics Built-in', desc: 'Real-time dashboards and insights without third-party tools.' },
            { title: 'Team Collaboration', desc: 'Invite your team, assign roles, and work together seamlessly.' },
            { title: 'API First', desc: 'RESTful APIs with comprehensive documentation and SDKs.' },
            { title: '99.9% Uptime', desc: 'Redundant infrastructure ensures your app is always available.' },
          ].map((f, i) => (
            <div key={i} className="reveal rounded-lg border border-[#222] bg-[#111] p-6">
              <h3 className="text-lg font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <h2 className="reveal text-3xl font-bold text-center mb-12">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '1', title: 'Sign Up', desc: 'Create your account in seconds. No credit card required.' },
            { step: '2', title: 'Configure', desc: 'Set up your workspace and invite your team members.' },
            { step: '3', title: 'Launch', desc: 'Deploy your project and start serving users immediately.' },
          ].map((s, i) => (
            <div key={i} className="reveal text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#0070F3] text-white font-bold text-lg">
                {s.step}
              </div>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-gray-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <h2 className="reveal text-3xl font-bold text-center mb-12">Loved by developers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Sarah Chen', role: 'CTO at Flowbase', quote: 'We shipped our MVP in 2 days instead of 2 weeks. The DX is incredible.' },
            { name: 'Marcus Johnson', role: 'Indie Hacker', quote: "Finally a starter that doesn't feel like a toy. Production-ready from day one." },
            { name: 'Aisha Patel', role: 'Lead Engineer at Nexus', quote: 'The auth and payments integration saved us hundreds of engineering hours.' },
          ].map((t, i) => (
            <div key={i} className="reveal rounded-lg border border-[#222] bg-[#111] p-6">
              <p className="text-sm text-gray-300 italic">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-4">
                <p className="text-sm font-semibold text-white">{t.name}</p>
                <p className="text-xs text-gray-500">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <h2 className="reveal text-3xl font-bold text-center mb-4">Simple pricing</h2>
        <p className="reveal text-center text-gray-400 mb-12">No hidden fees. Cancel anytime.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Free', price: '$0', period: '/month', features: ['1 project', '1,000 API calls/mo', 'Community support', 'Basic analytics'], cta: 'Get Started', highlight: false },
            { name: 'Pro', price: '$29', period: '/month', features: ['Unlimited projects', '100,000 API calls/mo', 'Priority support', 'Advanced analytics', 'Custom domains', 'Team members (up to 5)'], cta: 'Start Free Trial', highlight: true },
            { name: 'Enterprise', price: '$99', period: '/month', features: ['Everything in Pro', 'Unlimited API calls', 'Dedicated support', 'SSO & SAML', 'SLA guarantee', 'Unlimited team members'], cta: 'Contact Sales', highlight: false },
          ].map((p, i) => (
            <div key={i} className={`reveal rounded-lg border p-6 flex flex-col ${p.highlight ? 'border-[#0070F3] bg-[#0A1628]' : 'border-[#222] bg-[#111]'}`}>
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold">{p.price}</span>
                <span className="text-gray-400">{p.period}</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-center text-sm text-gray-300">
                    <svg className="mr-2 h-4 w-4 text-[#0070F3]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className={`mt-6 block rounded-md px-4 py-2.5 text-center font-semibold transition ${p.highlight ? 'bg-[#0070F3] text-white hover:bg-[#005bb5]' : 'border border-[#333] text-white hover:border-[#555]'}`}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#222] px-6 py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/pricing" className="hover:text-white transition">Pricing</Link></li>
              <li><a href="#" className="hover:text-white transition">Features</a></li>
              <li><a href="#" className="hover:text-white transition">Changelog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition">About</a></li>
              <li><a href="#" className="hover:text-white transition">Blog</a></li>
              <li><a href="#" className="hover:text-white transition">Careers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition">API Reference</a></li>
              <li><a href="#" className="hover:text-white transition">Status</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition">Privacy</a></li>
              <li><a href="#" className="hover:text-white transition">Terms</a></li>
              <li><a href="#" className="hover:text-white transition">Security</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-[#222] text-center text-sm text-gray-500">
          &copy; 2024 {'{{DISPLAY_NAME}}'}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
