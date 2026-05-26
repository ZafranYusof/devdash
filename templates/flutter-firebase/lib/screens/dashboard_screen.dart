import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final user = auth.user;
    final width = MediaQuery.of(context).size.width;
    final crossCount = width > 900 ? 4 : width > 600 ? 2 : 2;

    final stats = [
      {'label': 'Total Users', 'value': '2,847', 'change': '+12%'},
      {'label': 'Revenue', 'value': '\$48.2k', 'change': '+8%'},
      {'label': 'Active Projects', 'value': '23', 'change': '+3'},
      {'label': 'Uptime', 'value': '99.9%', 'change': ''},
    ];

    final activity = [
      {'action': 'New user registered', 'time': '2 minutes ago', 'icon': Icons.person_add},
      {'action': 'Payment received', 'time': '15 minutes ago', 'icon': Icons.payment},
      {'action': 'Project deployed', 'time': '1 hour ago', 'icon': Icons.rocket_launch},
      {'action': 'Support ticket resolved', 'time': '3 hours ago', 'icon': Icons.check_circle},
      {'action': 'New feature shipped', 'time': '5 hours ago', 'icon': Icons.celebration},
    ];

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0A0A0A),
        title: const Text('{{DISPLAY_NAME}}', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pushNamed(context, '/settings'),
            child: Text('Settings', style: TextStyle(color: Colors.grey[400])),
          ),
          TextButton(
            onPressed: () => Navigator.pushNamed(context, '/admin'),
            child: Text('Admin', style: TextStyle(color: Colors.grey[400])),
          ),
          TextButton(
            onPressed: () => auth.signOut(),
            child: Text('Sign Out', style: TextStyle(color: Colors.grey[400])),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Welcome back${user?.displayName != null ? ", ${user!.displayName}" : ""}',
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 4),
            Text("Here's what's happening.", style: TextStyle(color: Colors.grey[400])),
            const SizedBox(height: 24),

            // Stats Grid
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: crossCount,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.8,
              ),
              itemCount: stats.length,
              itemBuilder: (context, i) {
                final s = stats[i];
                return Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF111111),
                    border: Border.all(color: const Color(0xFF222222)),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(s['label']!, style: TextStyle(fontSize: 11, color: Colors.grey[500], letterSpacing: 0.5)),
                      const SizedBox(height: 8),
                      Text(s['value']!, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
                      if ((s['change'] as String).isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(s['change']!, style: const TextStyle(fontSize: 12, color: Colors.green)),
                      ],
                    ],
                  ),
                );
              },
            ),
            const SizedBox(height: 32),

            // Recent Activity
            const Text('Recent Activity', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Colors.white)),
            const SizedBox(height: 12),
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFF111111),
                border: Border.all(color: const Color(0xFF222222)),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: activity.asMap().entries.map((entry) {
                  final a = entry.value;
                  final isLast = entry.key == activity.length - 1;
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      border: isLast ? null : const Border(bottom: BorderSide(color: Color(0xFF222222))),
                    ),
                    child: Row(
                      children: [
                        Icon(a['icon'] as IconData, color: const Color(0xFF0070F3), size: 20),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(a['action'] as String, style: const TextStyle(fontSize: 14, color: Colors.white)),
                              Text(a['time'] as String, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 32),

            // Quick Actions
            const Text('Quick Actions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Colors.white)),
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                _actionButton(context, Icons.settings, 'Settings', '/settings'),
                _actionButton(context, Icons.diamond, 'Upgrade Plan', '/pricing'),
                _actionButton(context, Icons.admin_panel_settings, 'Admin', '/admin'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _actionButton(BuildContext context, IconData icon, String label, String route) {
    return InkWell(
      onTap: () => Navigator.pushNamed(context, route),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: const Color(0xFF111111),
          border: Border.all(color: const Color(0xFF222222)),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 18, color: Colors.grey[400]),
            const SizedBox(width: 8),
            Text(label, style: const TextStyle(fontSize: 14, color: Colors.white)),
          ],
        ),
      ),
    );
  }
}
