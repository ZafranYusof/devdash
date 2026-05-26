import { Link } from 'react-router-dom';

export default function Pricing() {
  const tiers = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      desc: 'Perfect for side projects and experimentation.',
      features: ['1 project', '1GB storage', 'Community support', 'Basic analytics', 'Shared infrastructure'],
      cta: 'Get Started',
      highlight: false,
    },
    {
      name: 'Pro',
      price: '$29',
      period: '/month',
      desc: 'For professionals and growing teams.',
      features: ['Unlimited projects', '100GB storage', 'Priority support', 'Advanced analytics', 'Custom domains', 'Team collaboration', 'API access'],
      cta: 'Start Free Trial',
      highlight: true,
    },
    {
      name: 'Enterprise',
      price: '$99',
      period: '/month',
      desc: 'For organizations that need full control.',
      features: ['Everything in Pro', '1TB storage', 'Dedicated support', 'SLA guarantee', 'SSO & SAML', 'Audit logs', 'Custom integrations', 'On-premise option'],
      cta: 'Contact Sales',
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <header className="px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link to="/" className="text-lg font-bold">{'{{DISPLAY_NAME}}'}</Link>
          <Link to="/login" className="text-sm text-gray-400 hover:text-white transition">Sign In</Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Simple, transparent pricing</h1>
          <p className="mt-4 text-lg text-gray-400">No hidden fees. No surprises. Cancel anytime.</p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`rounded-lg border p-8 flex flex-col ${t.highlight ? 'border-blue-500 bg-[#111] ring-1 ring-blue-500/20' : 'border-[#222] bg-[#111]'}`}
            >
              <h3 className="text-lg font-semibold">{t.name}</h3>
              <p className="mt-1 text-sm text-gray-400">{t.desc}</p>
              <div className="mt-6">
                <span className="text-4xl font-bold">{t.price}</span>
                <span className="text-gray-500">{t.period}</span>
              </div>
              <ul className="mt-8 flex-1 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="text-green-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className={`mt-8 block rounded-md px-4 py-2.5 text-center text-sm font-medium transition ${t.highlight ? 'bg-white text-black hover:bg-gray-200' : 'border border-[#333] text-white hover:border-gray-500'}`}
              >
                {t.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-400">Need a custom plan?{' '}
            <a href="#" className="text-blue-400 hover:text-blue-300">Contact us</a>
          </p>
        </div>
      </main>
    </div>
  );
}
