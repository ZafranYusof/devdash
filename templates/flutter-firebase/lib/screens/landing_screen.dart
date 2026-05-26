import 'package:flutter/material.dart';

class LandingScreen extends StatelessWidget {
  const LandingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      body: SingleChildScrollView(
        child: Column(
          children: [
            _buildHero(context),
            _buildFeatures(context),
            _buildHowItWorks(context),
            _buildCTA(context),
            _buildFooter(context),
          ],
        ),
      ),
    );
  }

  Widget _buildHero(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    final isWide = width > 600;

    return Container(
      padding: EdgeInsets.symmetric(horizontal: 24, vertical: isWide ? 80 : 48),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              border: Border.all(color: const Color(0xFF333333)),
              borderRadius: BorderRadius.circular(20),
              color: const Color(0xFF111111),
            ),
            child: Text(
              'NOW IN BETA',
              style: TextStyle(fontSize: 11, color: Colors.grey[400], letterSpacing: 1.2),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            '{{DISPLAY_NAME}}',
            style: TextStyle(
              fontSize: isWide ? 48 : 36,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          Text(
            'The modern platform to build, ship, and scale your next big idea. Fast, secure, and developer-friendly.',
            style: TextStyle(fontSize: 16, color: Colors.grey[400]),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            alignment: WrapAlignment.center,
            children: [
              ElevatedButton(
                onPressed: () => Navigator.pushNamed(context, '/register'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: const Text('Get Started', style: TextStyle(fontWeight: FontWeight.w600)),
              ),
              OutlinedButton(
                onPressed: () => Navigator.pushNamed(context, '/pricing'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white,
                  side: const BorderSide(color: Color(0xFF333333)),
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: const Text('View Pricing'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFeatures(BuildContext context) {
    final features = [
      {'icon': Icons.bolt, 'title': 'Lightning Fast', 'desc': 'Optimized for speed with edge computing and smart caching.'},
      {'icon': Icons.lock, 'title': 'Secure by Default', 'desc': 'Enterprise-grade security with encryption at rest and in transit.'},
      {'icon': Icons.analytics, 'title': 'Real-time Analytics', 'desc': 'Monitor your app performance with built-in dashboards.'},
      {'icon': Icons.extension, 'title': 'Easy Integrations', 'desc': 'Connect with your favorite tools in just a few clicks.'},
      {'icon': Icons.public, 'title': 'Global Scale', 'desc': 'Deploy to multiple regions with automatic failover.'},
      {'icon': Icons.code, 'title': 'Developer First', 'desc': 'Built by developers, for developers. Great DX guaranteed.'},
    ];

    final width = MediaQuery.of(context).size.width;
    final crossCount = width > 900 ? 3 : width > 600 ? 2 : 1;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
      child: Column(
        children: [
          const Text('Everything you need', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 8),
          Text('Powerful features to help you build faster', style: TextStyle(color: Colors.grey[400])),
          const SizedBox(height: 32),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: crossCount,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 2.2,
            ),
            itemCount: features.length,
            itemBuilder: (context, i) {
              final f = features[i];
              return Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFF111111),
                  border: Border.all(color: const Color(0xFF222222)),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(f['icon'] as IconData, color: const Color(0xFF0070F3), size: 24),
                    const SizedBox(height: 12),
                    Text(f['title'] as String, style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.white)),
                    const SizedBox(height: 4),
                    Text(f['desc'] as String, style: TextStyle(fontSize: 13, color: Colors.grey[400])),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildHowItWorks(BuildContext context) {
    final steps = [
      {'num': '1', 'title': 'Sign Up', 'desc': 'Create your account in seconds. No credit card required.'},
      {'num': '2', 'title': 'Configure', 'desc': 'Set up your project with our intuitive dashboard.'},
      {'num': '3', 'title': 'Launch', 'desc': 'Deploy to production with a single click.'},
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
      child: Column(
        children: [
          const Text('How it works', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 8),
          Text('Get started in three simple steps', style: TextStyle(color: Colors.grey[400])),
          const SizedBox(height: 32),
          LayoutBuilder(
            builder: (context, constraints) {
              if (constraints.maxWidth > 600) {
                return Row(
                  children: steps.map((s) => Expanded(child: _stepCard(s))).toList(),
                );
              }
              return Column(children: steps.map((s) => _stepCard(s)).toList());
            },
          ),
        ],
      ),
    );
  }

  Widget _stepCard(Map<String, String> s) {
    return Padding(
      padding: const EdgeInsets.all(8),
      child: Column(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFF333333)),
              color: const Color(0xFF111111),
            ),
            child: Center(child: Text(s['num']!, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 18))),
          ),
          const SizedBox(height: 12),
          Text(s['title']!, style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.white)),
          const SizedBox(height: 4),
          Text(s['desc']!, style: TextStyle(fontSize: 13, color: Colors.grey[400]), textAlign: TextAlign.center),
        ],
      ),
    );
  }

  Widget _buildCTA(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: const Color(0xFF111111),
        border: Border.all(color: const Color(0xFF222222)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          const Text('Ready to get started?', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 8),
          Text('Join thousands of developers building with us.', style: TextStyle(color: Colors.grey[400])),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => Navigator.pushNamed(context, '/register'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('Start for Free', style: TextStyle(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  Widget _buildFooter(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(border: Border(top: BorderSide(color: Color(0xFF222222)))),
      child: Text('© 2024 {{DISPLAY_NAME}}. All rights reserved.', style: TextStyle(fontSize: 13, color: Colors.grey[600]), textAlign: TextAlign.center),
    );
  }
}
