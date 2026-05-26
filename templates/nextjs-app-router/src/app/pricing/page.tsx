'use client';

import Link from 'next/link';

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      description: 'Perfect for side projects and experimentation.',
      features: ['1 project', '1,000 API calls/mo', 'Community support', 'Basic analytics', '1 team member'],
      cta: 'Get Started',
      highlight: false,
    },
    {
      name: 'Pro',
      price: '$29',
      period: '/month',
      description: 'For professionals and growing teams.',
      features: ['Unlimited projects', '100,000 API calls/mo', 'Priority support', 'Advanced analytics', 'Custom domains', 'Up to 5 team members', 'Webhooks'],
      cta: 'Start Free Trial',
      highlight: true,
    },
    {
      name: 'Enterprise',
      price: '$99',
      period: '/month',
      description: 'For organizations that need scale and security.',
      features: ['Everything in Pro', 'Unlimited API calls', 'Dedicated support', 'SSO & SAML', 'SLA guarantee', 'Unlimited team members', 'Audit logs', 'Custom integrations'],
      cta: 'Contact Sales',
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] font-[Inter,sans-serif]">
      {/* Header */}
      <header className="border-b border-[#222] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">{'{{DISPLAY_NAME}}'}</Link>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition">Sign in</Link>
            <Link href="/register" className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-gray-200 transition">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">Simple, transparent pricing</h1>
          <p className="mt-4 text-lg text-gray-400">No hidden fees. No surprises. Cancel anytime.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`rounded-lg border p-8 flex flex-col ${plan.highlight ? 'border-[#0070F3] bg-[#0A1628] relative' : 'border-[#222] bg-[#111]'}`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#0070F3] px-3 py-1 text-xs font-semibold text-white">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
              <p className="mt-2 text-sm text-gray-400">{plan.description}</p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-gray-400">{plan.period}</span>
              </div>
              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center text-sm text-gray-300">
                    <svg className="mr-3 h-4 w-4 flex-shrink-0 text-[#0070F3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`mt-8 block rounded-md px-4 py-3 text-center font-semibold transition ${plan.highlight ? 'bg-[#0070F3] text-white hover:bg-[#005bb5]' : 'border border-[#333] text-white hover:border-[#555]'}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-4">
            {[
              { q: 'Can I change plans later?', a: 'Yes, you can upgrade or downgrade at any time. Changes take effect immediately.' },
              { q: 'Is there a free trial?', a: 'Pro plan comes with a 14-day free trial. No credit card required.' },
              { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.' },
            ].map((faq, i) => (
              <div key={i} className="rounded-lg border border-[#222] bg-[#111] p-5">
                <h3 className="text-sm font-semibold text-white">{faq.q}</h3>
                <p className="mt-2 text-sm text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
