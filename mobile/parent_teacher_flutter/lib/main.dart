import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:aivo_shared/aivo_shared.dart';
import 'screens/dashboard_screen.dart';
import 'screens/learner_overview_screen.dart';
import 'screens/difficulty_screen.dart';

void main() {
  runApp(const AivoParentTeacherApp());
}

class AivoParentTeacherApp extends StatelessWidget {
  const AivoParentTeacherApp({super.key});

  @override
  Widget build(BuildContext context) {
    // Set light status bar for friendly theme
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      statusBarBrightness: Brightness.light,
    ));

    return MaterialApp(
      title: 'AIVO Parent & Teacher',
      debugShowCheckedModeBanner: false,
      theme: AivoTheme.lightTheme,
      initialRoute: '/',
      routes: {
        '/': (context) => const DashboardScreen(),
        '/learner': (context) => const LearnerOverviewScreen(),
        '/difficulty': (context) => const DifficultyScreen(),
      },
    );
  }
}
