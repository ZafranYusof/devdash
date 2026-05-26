import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <PricingSection />
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <FadeIn>
        <span className="rounded-full border border-[#333] bg-[#111] px-4 py-1.5 text-xs uppercase tracking-wider text-gray-400">
          Now in Beta
        </span>
      </FadeIn>
      <FadeIn delay={100}>
        <h1 className="mt-8 text-5xl font-bold leading-tight sm:text-6xl">
          {'{{DISPLAY_NAME}}'}
        </h1>
      </FadeIn>
      <FadeIn delay={200}>
        <p className="mt-4 max-w-xl text-lg text-gray-400">
          The modern platform to build, ship, and scale your next big idea. Fast, secure, and developer-friendly.
        </p>
      </FadeIn>
      <FadeIn delay={300}>
        <div className="mt-8 flex gap-4">
          <Link to="/register" className="rounded-md bg-white px-6 py-3 font-medium text-black hover:bg-gray-200 transition">
            Get Started
          </Link>
          <Link to="/pricing" className="rounded-md border border-[#333] px-6 py-3 font-medium text-white hover:border-gray-500 transition">
            View Pricing
          </Link>
        </div>
      </FadeIn>
    </section>
  );
}

function Features() {
  const features = [
    { icon: '⚡', title: 'Lightning Fast', desc: 'Optimized for speed with edge computing and smart caching.' },
    { icon: '🔒', title: 'Secure by Default', desc: 'Enterprise-grade security with encryption at rest and in transit.' },
    { icon: '📊', title: 'Real-time Analytics', desc: 'Monitor your app performance with built-in dashboards.' },
    { icon: '🔌', title: 'Easy Integrations', desc: 'Connect with your favorite tools in just a few clicks.' },
    { icon: '🌍', title: 'Global Scale', desc: 'Deploy to multiple regions with automatic failover.' },
    { icon: '🛠️', title: 'Developer First', desc: 'Built by developers, for developers. Great DX guaranteed.' },
  ];

  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <FadeIn>
        <h2 className="text-center text-3xl font-bold">Everything you need</h2>
        <p className="mt-3 text-center text-gray-400">Powerful features to help you build faster</p>
      </FadeIn>
      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <FadeIn key={f.title} delay={i * 80}>
            <div className="rounded-lg border border-[#222] bg-[#111] p-6 transition hover:border-[#444]">
              <div className="text-2xl">{f.icon}</div>
              <h3 className="mt-3 font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-400">{f.desc}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { num: '1', title: 'Sign Up', desc: 'Create your account in seconds. No credit card required.' },
    { num: '2', title: 'Configure', desc: 'Set up your project with our intuitive dashboard.' },
    { num: '3', title: 'Launch', desc: 'Deploy to production with a single click.' },
  ];

  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      <FadeIn>
        <h2 className="text-center text-3xl font-bold">How it works</h2>
        <p className="mt-3 text-center text-gray-400">Get started in three simple steps</p>
      </FadeIn>
      <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
        {steps.map((s, i) => (
          <FadeIn key={s.num} delay={i * 120}>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#333] bg-[#111] text-lg font-bold">
                {s.num}
              </div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-gray-400">{s.desc}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const quotes = [
    { name: 'Sarah Chen', role: 'CTO at TechFlow', text: 'This platform cut our development time in half. The DX is unmatched.' },
    { name: 'Marcus Johnson', role: 'Lead Developer', text: 'Finally a tool that just works. No more fighting with infrastructure.' },
    { name: 'Aisha Patel', role: 'Founder at LaunchPad', text: 'We went from idea to production in a weekend. Incredible.' },
  ];

  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <FadeIn>
        <h2 className="text-center text-3xl font-bold">Loved by developers</h2>
      </FadeIn>
      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {quotes.map((q, i) => (
          <FadeIn key={q.name} delay={i * 100}>
            <div className="rounded-lg border border-[#222] bg-[#111] p-6">
              <p className="text-sm text-gray-300 italic">"{q.text}"</p>
              <div className="mt-4">
                <p className="text-sm font-medium text-white">{q.name}</p>
                <p className="text-xs text-gray-500">{q.role}</p>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

function PricingSection() {
  const tiers = [
    { name: 'Free', price: '$0', period: '/month', features: ['1 project', '1GB storage', 'Community support', 'Basic analytics'], cta: 'Get Started', highlight: false },
    { name: 'Pro', price: '$29', period: '/month', features: ['Unlimited projects', '100GB storage', 'Priority support', 'Advanced analytics', 'Custom domains', 'Team collaboration'], cta: 'Start Free Trial', highlight: true },
    { name: 'Enterprise', price: '$99', period: '/month', features: ['Everything in Pro', '1TB storage', 'Dedicated support', 'SLA guarantee', 'SSO & SAML', 'Audit logs', 'Custom integrations'], cta: 'Contact Sales', highlight: false },
  ];

  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <FadeIn>
        <h2 className="text-center text-3xl font-bold">Simple pricing</h2>
        <p className="mt-3 text-center text-gray-400">No hidden fees. Cancel anytime.</p>
      </FadeIn>
      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {tiers.map((t, i) => (
          <FadeIn key={t.name} delay={i * 100}>
            <div className={`rounded-lg border p-6 ${t.highlight ? 'border-blue-500 bg-[#111]' : 'border-[#222] bg-[#111]'}`}>
              <h3 className="font-semibold text-white">{t.name}</h3>
              <div className="mt-3">
                <span className="text-3xl font-bold">{t.price}</span>
                <span className="text-gray-500">{t.period}</span>
              </div>
              <ul className="mt-6 space-y-2">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="text-green-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className={`mt-6 block rounded-md px-4 py-2 text-center text-sm font-medium transition ${t.highlight ? 'bg-white text-black hover:bg-gray-200' : 'border border-[#333] text-white hover:border-gray-500'}`}
              >
                {t.cta}
              </Link>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#222] px-6 py-12">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-gray-500">© 2024 {'{{DISPLAY_NAME}}'}. All rights reserved.</p>
        <div className="flex gap-6">
          <Link to="/pricing" className="text-sm text-gray-400 hover:text-white transition">Pricing</Link>
          <a href="#" className="text-sm text-gray-400 hover:text-white transition">Docs</a>
          <a href="#" className="text-sm text-gray-400 hover:text-white transition">GitHub</a>
        </div>
      </div>
    </footer>
  );
}

function FadeIn({ children, delay = 0 }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add('opacity-100', 'translate-y-0'), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className="opacity-0 translate-y-4 transition-all duration-700 ease-out">
      {children}
    </div>
  );
}
