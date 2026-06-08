import { Button, Platform, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LocationResult, PermissionKit } from '../../modules/permission-kit/src';

import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useState } from 'react';


export default function HomeScreen() {
  const [locationState, setLocationState] = useState<{ loading: boolean; result: LocationResult | null }>({
    loading: false,
    result: null,
  });

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

  const testNotifications = async () => {
    const result = await PermissionKit.notifications();
    console.log("Notifications Result:", result);
  };

  const testLocation = async () => {
    setLocationState({ loading: true, result: null });
    try {
      const result = await PermissionKit.location({ timeout: 15000 });
      setLocationState({ loading: false, result });
      console.log("Location Result:", JSON.stringify(result, null, 2));
    } catch (e) {
      console.error("Location error:", e);
      setLocationState({ loading: false, result: null });
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
     


        <Button title="Battery Optimization" onPress={test} />
        <Button title="Overlay Permission" onPress={testOverlay} />
        <Button title="Exact Alarm" onPress={testExactAlarm} />
        <Button title="Accessibility Service" onPress={testAccessibility} />
        <Button title="DND Access" onPress={testDndAccess} />
        <Button title="Notifications" onPress={testNotifications} />
        <Button
          title={locationState.loading ? "📍 Fetching location…" : "Location"}
          onPress={testLocation}
        />
        {locationState.loading && (
          <Text style={{ textAlign: 'center', marginTop: 8, color: '#888' }}>
            Waiting for GPS signal…
          </Text>
        )}
        {locationState.result?.status === 'granted' && 'latitude' in locationState.result && (
          <Text style={{ textAlign: 'center', marginTop: 8, color: 'green' }}>
            📍 {locationState.result.latitude.toFixed(5)}, {locationState.result.longitude.toFixed(5)}
            {'\n'}Accuracy: ±{Math.round(locationState.result.accuracy)}m
          </Text>
        )}
        {locationState.result?.status === 'denied' && (
          <Text style={{ textAlign: 'center', marginTop: 8, color: 'red' }}>
            ❌ Location denied{locationState.result.error ? ` (${locationState.result.error})` : ''}
          </Text>
        )}

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
