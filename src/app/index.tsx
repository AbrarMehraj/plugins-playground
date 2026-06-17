import { Button, Host, List, ListItem, Text } from '@expo/ui';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useAccessibility,
  useBatteryOptimization,
  useDndAccess,
  useExactAlarm,
  useFullScreenIntent,
  useLocation,
  useMedia,
  useNotifications,
  useOverlay,
  useUsageStats
} from '../../modules/permission-kit/src';

// ─────────────────── Permission Items ───────────────────────────────────────

type PermItem = {
  label: string;
  sublabel: string;
  status: string;
  success: boolean;
  action: () => Promise<any>;
};

export default function HomeScreen() {
  const battery = useBatteryOptimization();
  const overlay = useOverlay();
  const usageStats = useUsageStats();
  const exactAlarm = useExactAlarm();
  const fullScreenIntent = useFullScreenIntent();
  const accessibility = useAccessibility({ androidServicePath: '.MockAccessibilityService' });
  const dndAccess = useDndAccess();

  const notifications = useNotifications();

  const mediaPhoto = useMedia({ type: 'photo', requestMore: true });
  const mediaVideo = useMedia({ type: 'video', requestMore: true });
  const mediaAudio = useMedia({ type: 'audio' });
  const mediaAll = useMedia({ type: 'all' });

  const location = useLocation({ fetchCoordinates: false });
  const locationFull = useLocation({ timeout: 15000, fetchCoordinates: true });

  const run = async (key: string, fn: () => Promise<any>) => {
    try {
      await fn();
    } catch (e) {
      console.error(`[${key}]`, e);
    }
  };

  const permItems: PermItem[] = [
    {
      label: 'Battery Optimization',
      sublabel: 'Ignores doze mode',
      status: battery.status,
      success: battery.success,
      action: battery.request,
    },
    {
      label: 'Draw Over Other Apps',
      sublabel: 'System Alert Window',
      status: overlay.status,
      success: overlay.success,
      action: overlay.request,
    },
    {
      label: 'Usage Stats',
      sublabel: 'App usage data',
      status: usageStats.status,
      success: usageStats.success,
      action: usageStats.request,
    },
    {
      label: 'Exact Alarms',
      sublabel: 'Schedule exact alarms',
      status: exactAlarm.status,
      success: exactAlarm.success,
      action: exactAlarm.request,
    },
    {
      label: 'Full Screen Intent',
      sublabel: 'Show lock screen alerts',
      status: fullScreenIntent.status,
      success: fullScreenIntent.success,
      action: fullScreenIntent.request,
    },
    {
      label: 'Accessibility Service',
      sublabel: 'MockService configured',
      status: accessibility.status,
      success: accessibility.success,
      action: accessibility.request,
    },
    {
      label: 'Do Not Disturb',
      sublabel: 'Modify DND state',
      status: dndAccess.status,
      success: dndAccess.success,
      action: dndAccess.request,
    },
    {
      label: 'Notifications',
      sublabel: 'Push & local alerts',
      status: notifications.status,
      success: notifications.success,
      action: notifications.request,
    },
    {
      label: 'Media: Photos',
      sublabel: 'READ_MEDIA_IMAGES',
      status: mediaPhoto.status,
      success: mediaPhoto.success,
      action: mediaPhoto.request,
    },
    {
      label: 'Media: Videos',
      sublabel: 'READ_MEDIA_VIDEO',
      status: mediaVideo.status,
      success: mediaVideo.success,
      action: mediaVideo.request,
    },
    {
      label: 'Media: Audio',
      sublabel: 'READ_MEDIA_AUDIO',
      status: mediaAudio.status,
      success: mediaAudio.success,
      action: mediaAudio.request,
    },
    {
      label: 'Media: All',
      sublabel: 'Photos, Videos, Audio',
      status: mediaAll.status,
      success: mediaAll.success,
      action: mediaAll.request,
    },
    {
      label: 'Location (Permission Only)',
      sublabel: 'Checks permission without GPS',
      status: location.status,
      success: location.success,
      action: location.request,
    },
    {
      label: 'Location (Full)',
      sublabel: 'Requests perm & GPS coords',
      status: locationFull.status,
      success: locationFull.success,
      action: locationFull.request,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Host style={{ flex: 1 }}>
        <List>
          {permItems.map((item, idx) => (
            <ListItem
              key={idx}
              supportingText={`${item.sublabel} • ${item.status.toUpperCase()}`}
              trailing={
                <Button
                  label={item.success ? 'Granted' : 'Request'}
                  onPress={() => run(item.label, item.action)}
                />
              }
            >
              <Text>{item.label}</Text>
            </ListItem>
          ))}


        </List>
      </Host>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  locationText: {
    fontSize: 13,
    color: '#34C759',
    fontWeight: '500',
    marginTop: 4,
  },
});
