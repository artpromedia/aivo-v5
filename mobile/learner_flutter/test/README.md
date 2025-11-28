# AIVO Flutter Tests

Comprehensive testing suite for the AIVO Flutter mobile applications.

## Test Structure

```
test/
├── services/           # Unit tests for services
│   ├── api_client_test.dart
│   └── focus_monitor_test.dart
├── widgets/            # Widget tests
│   ├── emotion_picker_test.dart
│   └── homework_wizard_test.dart
├── golden/             # Visual regression tests
│   └── emotion_picker_golden_test.dart
└── widget_test.dart    # Basic app widget test

integration_test/
└── homework_flow_test.dart  # End-to-end integration tests
```

## Running Tests

### Unit Tests

```bash
cd mobile/learner_flutter

# Run all unit tests
flutter test

# Run with coverage
flutter test --coverage

# Run specific test file
flutter test test/services/focus_monitor_test.dart

# Run tests with random ordering (CI mode)
flutter test --test-randomize-ordering-seed=random
```

### Widget Tests

```bash
# Run all widget tests
flutter test test/widgets/

# Run specific widget test
flutter test test/widgets/emotion_picker_test.dart
```

### Golden Tests

Golden tests capture screenshots of widgets and compare them against baseline images.

```bash
# Run golden tests
flutter test --tags=golden

# Update golden files (when intentional UI changes are made)
flutter test --tags=golden --update-goldens
```

### Integration Tests

Integration tests run on a real device or emulator.

```bash
# Run on connected device
flutter test integration_test

# Run on macOS desktop (for CI)
flutter test integration_test --device-id=macos

# Run on iOS simulator
flutter test integration_test --device-id=iPhone-15-Pro
```

## Test Dependencies

These are the testing dependencies in `pubspec.yaml`:

```yaml
dev_dependencies:
  flutter_test:
    sdk: flutter
  integration_test:
    sdk: flutter
  mockito: ^5.4.0
  build_runner: ^2.4.0
  network_image_mock: ^2.1.1
  golden_toolkit: ^0.15.0
  fake_async: ^1.3.0
```

## Generating Mocks

For tests that use Mockito annotations:

```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

## Test Coverage

### Target Coverage

| Category | Target |
|----------|--------|
| Services | 80%+ |
| Widgets | 70%+ |
| Models | 90%+ |
| Overall | 75%+ |

### Viewing Coverage

```bash
# Generate coverage
flutter test --coverage

# Generate HTML report (requires lcov)
genhtml coverage/lcov.info -o coverage/html

# Open report
open coverage/html/index.html
```

## Writing Tests

### Unit Tests

```dart
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('MyService', () {
    late MyService service;

    setUp(() {
      service = MyService();
    });

    test('does something correctly', () {
      expect(service.doSomething(), equals(expected));
    });
  });
}
```

### Widget Tests

```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('MyWidget displays correctly', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: MyWidget(),
      ),
    );

    expect(find.text('Expected Text'), findsOneWidget);
    
    await tester.tap(find.byType(ElevatedButton));
    await tester.pump();
    
    expect(find.text('Updated Text'), findsOneWidget);
  });
}
```

### Golden Tests

```dart
import 'package:golden_toolkit/golden_toolkit.dart';

void main() {
  testGoldens('MyWidget renders correctly', (tester) async {
    final builder = GoldenBuilder.column()
      ..addScenario('State A', MyWidget(state: 'a'))
      ..addScenario('State B', MyWidget(state: 'b'));

    await tester.pumpWidgetBuilder(
      builder.build(),
      surfaceSize: const Size(400, 600),
    );

    await screenMatchesGolden(tester, 'my_widget_states');
  }, tags: ['golden']);
}
```

### Integration Tests

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:my_app/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('complete user flow', (tester) async {
    app.main();
    await tester.pumpAndSettle();

    // Navigate and interact
    await tester.tap(find.text('Button'));
    await tester.pumpAndSettle();

    expect(find.text('Result'), findsOneWidget);
  });
}
```

## CI Integration

Tests run automatically on:
- Push to `main` branch
- Pull requests targeting `main`
- Changes to `mobile/` directory

### CI Jobs

| Job | Description | Runner |
|-----|-------------|--------|
| Unit Tests | Service and model tests | Ubuntu |
| Widget Tests | UI component tests | Ubuntu |
| Golden Tests | Visual regression tests | Ubuntu |
| Integration Tests | E2E flow tests | macOS |

## Best Practices

1. **Use descriptive test names** - Test names should describe the expected behavior
2. **Group related tests** - Use `group()` to organize tests logically
3. **Test edge cases** - Include tests for error handling and boundary conditions
4. **Keep tests independent** - Each test should be able to run in isolation
5. **Use setUp/tearDown** - Initialize and clean up resources properly
6. **Avoid test interdependence** - Tests should not depend on each other
7. **Mock external dependencies** - Use Mockito for API calls and services
8. **Test accessibility** - Include semantic label tests where appropriate

## Troubleshooting

### Tests fail with "No tests match" error
- Ensure test file names end with `_test.dart`
- Check that test functions are inside `main()`

### Golden tests fail on CI
- Run `flutter test --tags=golden --update-goldens` locally
- Commit the updated golden files

### Integration tests timeout
- Increase timeout with `--timeout` flag
- Ensure device/emulator is properly configured

### Mock generation fails
- Run `flutter pub get` first
- Delete `.dart_tool/` and regenerate
