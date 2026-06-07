import { Button, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PermissionKit } from '../../modules/permission-kit/src';

import { AnimatedIcon } from '@/components/animated-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';


export default function HomeScreen() {

  const test = async () => {
    const result = await PermissionKit.batteryOptimization();
    console.log("Battery Result:", result);
  };

  const testOverlay = async () => {
    const result = await PermissionKit.overlay();
    console.log("Overlay Result:", result);
  };

  const testExactAlarm = async () => {
    const result = await PermissionKit.exactAlarm();
    console.log("Exact Alarm Result:", result);
  };

  const testAccessibility = async () => {
    const result = await PermissionKit.accessibility({
      androidServicePath: ".MockAccessibilityService"
    });
    console.log("Accessibility Result:", result);
  };

  const testDndAccess = async () => {
    const result = await PermissionKit.dndAccess();
    console.log("DND Access Result:", result);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>
          <AnimatedIcon />
          <ThemedText type="title" style={styles.title}>
            Welcome to&nbsp;Expo
          </ThemedText>
        </ThemedView>

        <ThemedText type="code" style={styles.code}>
          get started
        </ThemedText>


        <Button title="Battery Optimization" onPress={test} />
        <Button title="Overlay Permission" onPress={testOverlay} />
        <Button title="Exact Alarm" onPress={testExactAlarm} />
        <Button title="Accessibility Service" onPress={testAccessibility} />
        <Button title="DND Access" onPress={testDndAccess} />

        {Platform.OS === 'web' && <WebBadge />}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  title: {
    textAlign: 'center',
  },
  code: {
    textTransform: 'uppercase',
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
});
