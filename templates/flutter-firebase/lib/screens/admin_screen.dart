import 'package:flutter/material.dart';

class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  String _search = '';

  final _stats = [
    {'label': 'Total Users', 'value': '2,847'},
    {'label': 'Pro Users', 'value': '384'},
    {'label': 'New (24h)', 'value': '47'},
    {'label': 'Revenue (MTD)', 'value': '\$12.4k'},
  ];

  final _users = [
    {'name': 'Alice Johnson', 'email': 'alice@example.com', 'role': 'admin', 'plan': 'pro', 'joined': '2024-01-15'},
    {'name': 'Bob Smith', 'email': 'bob@example.com', 'role': 'user', 'plan': 'free', 'joined': '2024-02-20'},
    {'name': 'Carol Williams', 'email': 'carol@example.com', 'role': 'user', 'plan': 'pro', 'joined': '2024-03-10'},
    {'name': 'David Brown', 'email': 'david@example.com', 'role': 'user', 'plan': 'free', 'joined': '2024-03-22'},
    {'name': 'Eve Davis', 'email': 'eve@example.com', 'role': 'user', 'plan': 'enterprise', 'joined': '2024-04-01'},
  ];

  List<Map<String, String>> get _filtered => _users.where((u) =>
    u['name']!.toLowerCase().contains(_search.toLowerCase()) ||
    u['email']!.toLowerCase().contains(_search.toLowerCase())
  ).toList();

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    final crossCount = width > 900 ? 4 : width > 600 ? 2 : 2;

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0A0A0A),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Admin Panel', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Stats
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: crossCount,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 2.0,
              ),
              itemCount: _stats.length,
              itemBuilder: (context, i) {
                final s = _stats[i];
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
                    ],
                  ),
                );
              },
            ),
            const SizedBox(height: 32),

            // Users
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Users', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Colors.white)),
                SizedBox(
                  width: 200,
                  child: TextField(
                    onChanged: (v) => setState(() => _search = v),
                    style: const TextStyle(color: Colors.white, fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'Search users...',
                      hintStyle: TextStyle(color: Colors.grey[600], fontSize: 14),
                      filled: true,
                      fillColor: const Color(0xFF111111),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: Color(0xFF333333)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: Color(0xFF333333)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: Color(0xFF0070F3)),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // User Table
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFF111111),
                border: Border.all(color: const Color(0xFF222222)),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  // Header
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: const BoxDecoration(
                      border: Border(bottom: BorderSide(color: Color(0xFF222222))),
                    ),
                    child: Row(
                      children: [
                        Expanded(flex: 2, child: Text('Name', style: TextStyle(fontSize: 11, color: Colors.grey[500], letterSpacing: 0.5))),
                        Expanded(flex: 2, child: Text('Email', style: TextStyle(fontSize: 11, color: Colors.grey[500], letterSpacing: 0.5))),
                        Expanded(child: Text('Role', style: TextStyle(fontSize: 11, color: Colors.grey[500], letterSpacing: 0.5))),
                        Expanded(child: Text('Plan', style: TextStyle(fontSize: 11, color: Colors.grey[500], letterSpacing: 0.5))),
                        Expanded(child: Text('Joined', style: TextStyle(fontSize: 11, color: Colors.grey[500], letterSpacing: 0.5))),
                      ],
                    ),
                  ),
                  // Rows
                  ..._filtered.map((u) => Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: const BoxDecoration(
                      border: Border(bottom: BorderSide(color: Color(0xFF222222))),
                    ),
                    child: Row(
                      children: [
                        Expanded(flex: 2, child: Text(u['name']!, style: const TextStyle(color: Colors.white, fontSize: 14))),
                        Expanded(flex: 2, child: Text(u['email']!, style: TextStyle(color: Colors.grey[400], fontSize: 14))),
                        Expanded(child: _badge(u['role']!, u['role'] == 'admin' ? Colors.blue : Colors.grey)),
                        Expanded(child: _badge(u['plan']!, u['plan'] == 'pro' ? Colors.green : u['plan'] == 'enterprise' ? Colors.purple : Colors.grey)),
                        Expanded(child: Text(u['joined']!, style: TextStyle(color: Colors.grey[600], fontSize: 13))),
                      ],
                    ),
                  )),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _badge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(text, style: TextStyle(fontSize: 12, color: color.withOpacity(0.9))),
    );
  }
}
