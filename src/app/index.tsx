import { useState } from 'react';
import {
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LocationResult, PermissionKit } from '../../modules/permission-kit/src';

// ─────────────────── Permission Items ───────────────────────────────────────

type PermItem = {
  label: string;
  sublabel: string;
  action: () => Promise<any>;
};

export default function HomeScreen() {
  const [locationState, setLocationState] = useState<{
    loading: boolean;
    result: LocationResult | null;
  }>({ loading: false, result: null });

  const [results, setResults] = useState<Record<string, string>>({});

  const run = async (key: string, fn: () => Promise<any>) => {
    try {
      const r = await fn();
      setResults(prev => ({ ...prev, [key]: JSON.stringify(r) }));
      console.log(`[${key}]`, r);
    } catch (e) {
      console.error(`[${key}]`, e);
    }
  };

  const permItems: PermItem[] = [
    {
      label: 'Battery Optimization',
      sublabel: 'Android only',
      action: () => PermissionKit.batteryOptimization(),
    },
    {
      label: 'Overlay Permission',
      sublabel: 'Draw over other apps',
      action: () => PermissionKit.overlay(),
    },
    {
      label: 'Exact Alarm',
      sublabel: 'Schedule precise alarms',
      action: () => PermissionKit.exactAlarm(),
    },
    {
      label: 'Full Screen Intent',
      sublabel: 'Use full screen intents',
      action: () => PermissionKit.fullScreenIntent(),
    },
    {
      label: 'Accessibility Service',
      sublabel: 'Assistive access',
      action: () => PermissionKit.accessibility({ androidServicePath: '.MockAccessibilityService' }),
    },
    {
      label: 'Do Not Disturb',
      sublabel: 'Notification policy access',
      action: () => PermissionKit.dndAccess(),
    },
    {
      label: 'Notifications',
      sublabel: 'Push & local alerts',
      action: () =>
        PermissionKit.notifications({
          showAlertConfig: true,
          alertConfig: {
            title: 'Notifications Required',
            description: 'Please enable notifications in Settings to continue.',
          },
        }),
    },
    {
      label: 'Media (Photos)',
      sublabel: 'Access photo library',
      action: () => PermissionKit.media({ type: 'photo', requestMore: true }),
    },
    {
      label: 'Media (Video)',
      sublabel: 'Access video library',
      action: () => PermissionKit.media({ type: 'video', requestMore: true }),
    },
    {
      label: 'Media (Audio)',
      sublabel: 'Access music library',
      action: () => PermissionKit.media({ type: 'audio' }),
    },
    {
      label: 'Media (All Files)',
      sublabel: 'Manage external storage',
      action: () => PermissionKit.media({ type: 'all' }),
    },
    {
      label: 'Check Location Status',
      sublabel: 'Read-only, no prompt',
      action: () => PermissionKit.checkLocation(),
    },
    {
      label: 'Location (Permission Only)',
      sublabel: 'No GPS fetch',
      action: () => PermissionKit.location({ fetchCoordinates: false }),
    },
    {
      label: 'Location (Full)',
      sublabel: 'Permission + GPS coordinates',
      action: async () => {
        setLocationState({ loading: true, result: null });
        const result = await PermissionKit.location({
          timeout: 15000,
          showAlertConfig: true,
          alertConfig: {
            title: 'Location Required',
            description: 'We need your location to show accurate results. pls enable in settings ',
          },
        });
        setLocationState({ loading: false, result });
        return result;
      },
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>PermissionKit</Text>
        <Text style={styles.subtitle}>Tap any item to test the permission flow</Text>

        {permItems.map((item, idx) => (
          <View key={idx} style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.label}</Text>
              <Text style={styles.cardSubtitle}>{item.sublabel}</Text>
              {results[item.label] && (
                <Text style={styles.cardResult}>{results[item.label]}</Text>
              )}
            </View>
            <Button
              title={
                item.label === 'Location (Full)' && locationState.loading
                  ? 'Fetching…'
                  : 'Test'
              }
              onPress={() => run(item.label, item.action)}
            />
          </View>
        ))}

        {locationState.result?.status === 'granted' &&
          'latitude' in locationState.result && (
            <View style={[styles.card, styles.successCard]}>
              <Text style={styles.cardTitle}>📍 Location Result</Text>
              <Text style={styles.locationText}>
                {`Lat: ${locationState.result.latitude.toFixed(5)}, Lng: ${locationState.result.longitude.toFixed(5)}`}
              </Text>
              <Text style={styles.cardSubtitle}>
                {`Accuracy: ±${Math.round(locationState.result.accuracy as number)}m`}
              </Text>
            </View>
          )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    padding: 16,
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
    color: '#1C1C1E',
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  successCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  cardContent: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  cardResult: {
    fontSize: 11,
    color: '#34C759',
    marginTop: 4,
    fontFamily: 'Courier',
  },
  locationText: {
    fontSize: 13,
    color: '#34C759',
    fontWeight: '500',
    marginTop: 4,
  },
});
