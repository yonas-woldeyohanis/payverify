import 'package:flutter/material.dart';
import '../utils/constants.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        backgroundColor: backgroundColor,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await supabase.auth.signOut();
            },
          )
        ],
      ),
      body: const Center(
        child: Text('Scanner Screen coming next!'),
      ),
    );
  }
}
