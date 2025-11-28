import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'screens/home_screen.dart';
import 'screens/session_screen.dart';
import 'screens/tutor_screen.dart';
import 'screens/baseline_screen.dart';
import 'screens/calm_corner/calm_corner.dart';
import 'screens/regulation_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/homework_screen.dart';
import 'screens/focus_break_screen.dart';
import 'package:aivo_shared/aivo_shared.dart';
import 'package:aivo_shared/sentry_config.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Set status bar to dark icons for light theme
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
    statusBarBrightness: Brightness.light,
  ));
  
  // Initialize Sentry and run the app
  await initSentry(
    () => runApp(const AivoLearnerApp()),
    config: AivoSentryConfig.fromEnvironment(),
  );
}

class AivoLearnerApp extends StatelessWidget {
  const AivoLearnerApp({super.key});

  @override
  Widget build(BuildContext context) {
    // TODO: Replace with actual learner ID from auth
    const learnerId = 'demo-learner';
    
    return SensoryProfileWrapper(
      learnerId: learnerId,
      child: Builder(
        builder: (context) {
          final sensory = SensoryProvider.maybeOf(context);
          final preferDarkMode = sensory?.profile.visual.preferDarkMode ?? false;
          
          return MaterialApp(
            title: 'AIVO Learner',
            debugShowCheckedModeBanner: false,
            theme: preferDarkMode ? AivoTheme.darkTheme : AivoTheme.lightTheme,
            initialRoute: '/',
            routes: {
              '/': (context) => const HomeScreen(),
              '/session': (context) => const SessionScreen(),
              '/tutor': (context) => const TutorScreen(),
              '/baseline': (context) => const BaselineScreen(),
              '/calm-corner': (context) => const CalmCornerScreen(),
              '/regulation': (context) => const RegulationScreen(),
              '/settings': (context) => const SettingsScreen(learnerId: learnerId),
              '/homework': (context) => const HomeworkScreen(),
              '/focus-break': (context) => const FocusBreakScreen(),
            },
          );
        },
      ),
    );
  }
}
