import 'package:flutter/material.dart';

class PricingScreen extends StatelessWidget {
  const PricingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final tiers = [
      {
        'name': 'Free',
        'price': '\$0',
        'period': '/month',
        'desc': 'Perfect for side projects and experimentation.',
        'features': ['1 project', '1GB storage', 'Community support', 'Basic analytics', 'Shared infrastructure'],
        'highlight': false,
      },
      {
        'name': 'Pro',
        'price': '\$29',
        'period': '/month',
        'desc': 'For professionals and growing teams.',
        'features': ['Unlimited projects', '100GB storage', 'Priority support', 'Advanced analytics', 'Custom domains', 'Team collaboration', 'API access'],
        'highlight': true,
      },
      {
        'name': 'Enterprise',
        'price': '\$99',
        'period': '/month',
        'desc': 'For organizations that need full control.',
        'features': ['Everything in Pro', '1TB storage', 'Dedicated support', 'SLA guarantee', 'SSO & SAML', 'Audit logs', 'Custom integrations'],
        'highlight': false,
      },
    ];

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0A0A0A),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('{{DISPLAY_NAME}}', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Text(
              'Simple, transparent pricing',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'No hidden fees. No surprises. Cancel anytime.',
              style: TextStyle(fontSize: 16, color: Colors.grey[400]),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            LayoutBuilder(
              builder: (context, constraints) {
                if (constraints.maxWidth > 800) {
                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: tiers.map((t) => Expanded(child: Padding(
                      padding: const EdgeInsets.all(6),
                      child: _tierCard(context, t),
                    ))).toList(),
                  );
                }
                return Column(
                  children: tiers.map((t) => Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: _tierCard(context, t),
                  )).toList(),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _tierCard(BuildContext context, Map<String, dynamic> tier) {
    final highlight = tier['highlight'] as bool;
    final features = tier['features'] as List<String>;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF111111),
        border: Border.all(color: highlight ? const Color(0xFF0070F3) : const Color(0xFF222222)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(tier['name'] as String, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Colors.white)),
          const SizedBox(height: 4),
          Text(tier['desc'] as String, style: TextStyle(fontSize: 13, color: Colors.grey[400])),
          const SizedBox(height: 16),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(tier['price'] as String, style: const TextStyle(fontSize: 36, fontWeight: FontWeight.bold, color: Colors.white)),
              const SizedBox(width: 4),
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Text(tier['period'] as String, style: TextStyle(color: Colors.grey[500])),
              ),
            ],
          ),
          const SizedBox(height: 20),
          ...features.map((f) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              children: [
                const Icon(Icons.check, color: Colors.green, size: 16),
                const SizedBox(width: 8),
                Expanded(child: Text(f, style: TextStyle(fontSize: 14, color: Colors.grey[400]))),
              ],
            ),
          )),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: highlight
                ? ElevatedButton(
                    onPressed: () => Navigator.pushNamed(context, '/register'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: const Text('Start Free Trial', style: TextStyle(fontWeight: FontWeight.w600)),
                  )
                : OutlinedButton(
                    onPressed: () => Navigator.pushNamed(context, '/register'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: const BorderSide(color: Color(0xFF333333)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: Text(tier['name'] == 'Enterprise' ? 'Contact Sales' : 'Get Started'),
                  ),
          ),
        ],
      ),
    );
  }
}
