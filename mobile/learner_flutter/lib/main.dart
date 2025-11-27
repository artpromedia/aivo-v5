import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'screens/home_screen.dart';
import 'screens/session_screen.dart';
import 'screens/tutor_screen.dart';
import 'screens/baseline_screen.dart';
import 'package:aivo_shared/theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // Set status bar to dark icons for light theme
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
    statusBarBrightness: Brightness.light,
  ));
  runApp(const AivoLearnerApp());
}

class AivoLearnerApp extends StatelessWidget {
  const AivoLearnerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AIVO Learner',
      debugShowCheckedModeBanner: false,
      theme: AivoTheme.lightTheme,
      initialRoute: '/',
      routes: {
        '/': (context) => const HomeScreen(),
        '/session': (context) => const SessionScreen(),
        '/tutor': (context) => const TutorScreen(),
        '/baseline': (context) => const BaselineScreen(),
      },
    );
  }
}
