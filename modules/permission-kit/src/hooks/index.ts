import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { PermissionKit } from '../PermissionKit';

// A helper type to extract the Status type from the result of the check function
type ExtractStatus<T> = T extends { status: infer S } ? S : unknown;

// Clean Object Return Type
export interface UsePermissionResult<TStatus, TReqRes, TParams extends any[]> {
  status: TStatus | 'loading';
  success: boolean;
  request: (...argsOverride: TParams | []) => Promise<TReqRes>;
  check: (...argsOverride: TParams | []) => Promise<TStatus>;
  isLoading: boolean;
  result: TReqRes | null;
}

export type HookOptions = {
  /** If true, automatically requests the permission when the component mounts. Default: false */
  autoRequest?: boolean;
};

// Injects `HookOptions` into the existing hook parameter types
type InjectHookOptions<T extends any[]> = T extends []
  ? [HookOptions?]
  : T extends [infer First]
  ? [First & HookOptions]
  : T extends [(infer First)?]
  ? [(NonNullable<First> & HookOptions)?]
  : never;

/**
 * Internal factory to generate individual, tree-shakeable permission hooks.
 * Automatically handles checking status on mount and when the app resumes.
 */
function createPermissionHook<
  TCheckFn extends (...args: any[]) => Promise<any>,
  TRequestFn extends (...args: any[]) => Promise<any>
>(checkFn: TCheckFn, requestFn: TRequestFn) {
  type Params = Parameters<TRequestFn>;
  type CheckRes = Awaited<ReturnType<TCheckFn>>;
  type ReqRes = Awaited<ReturnType<TRequestFn>>;
  type Status = ExtractStatus<CheckRes>;
  type HookParams = InjectHookOptions<Params>;

  return function useSpecificPermission(...args: HookParams): UsePermissionResult<Status, ReqRes, HookParams> {
    const [status, setStatus] = useState<Status | 'loading'>('loading');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [fullResult, setFullResult] = useState<ReqRes | null>(null);
    
    // Store latest args in a ref so we don't have to parse JSON
    const argsRef = useRef(args);
    useEffect(() => {
      argsRef.current = args;
    });

    // Stringify dependencies to avoid infinite loops if the user passes inline object literals
    const optionsStr = JSON.stringify(args);

    const isInitialMount = useRef(true);

    const check = useCallback(async (...argsOverride: HookParams | []): Promise<Status> => {
      if (isInitialMount.current) {
        setIsLoading(true);
      }

      try {
        const callArgs = argsOverride.length > 0 ? argsOverride : argsRef.current;
        const result = await checkFn(...callArgs as any);
        
        const newStatus = result?.status ?? result;
        setStatus(newStatus as Status);
        return newStatus as Status;
      } finally {
        if (isInitialMount.current) {
          setIsLoading(false);
          isInitialMount.current = false;
        }
      }
    }, [optionsStr]);

    const request = useCallback(async (...argsOverride: HookParams | []): Promise<ReqRes> => {
      setIsLoading(true);
      try {
        const callArgs = argsOverride.length > 0 ? argsOverride : argsRef.current;
        const result = await requestFn(...callArgs as any);
        
        const newStatus = result?.status ?? result;
        setStatus(newStatus as Status);
        setFullResult(result as ReqRes);
        return result as ReqRes;
      } finally {
        setIsLoading(false);
      }
    }, [optionsStr]);

    const hasAutoRequested = useRef(false);

    useEffect(() => {
      const shouldAutoRequest = argsRef.current[0]?.autoRequest === true;
      
      if (shouldAutoRequest && !hasAutoRequested.current) {
        hasAutoRequested.current = true;
        request();
      } else {
        check();
      }

      const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
          check();
        }
      });

      return () => {
        subscription.remove();
      };
    }, [check, request]);

    return {
      status,
      success: status === 'granted',
      request,
      check,
      isLoading,
      result: fullResult
    };
  };
}

// ─── Exported Individual Hooks ───────────────────────────────────────────────

export const useBatteryOptimization = createPermissionHook(
  PermissionKit.checkBatteryOptimization,
  PermissionKit.batteryOptimization
);

export const useOverlay = createPermissionHook(
  PermissionKit.checkOverlay,
  PermissionKit.overlay
);

export const useUsageStats = createPermissionHook(
  PermissionKit.checkUsageStats,
  PermissionKit.usageStats
);

export const useExactAlarm = createPermissionHook(
  PermissionKit.checkExactAlarm,
  PermissionKit.exactAlarm
);

export const useFullScreenIntent = createPermissionHook(
  PermissionKit.checkFullScreenIntent,
  PermissionKit.fullScreenIntent
);

export const useDndAccess = createPermissionHook(
  PermissionKit.checkDndAccess,
  PermissionKit.dndAccess
);

export const useNotifications = createPermissionHook(
  PermissionKit.checkNotifications,
  PermissionKit.notifications
);

export const useLocation = createPermissionHook(
  PermissionKit.checkLocation,
  PermissionKit.location
);

export const useAccessibility = createPermissionHook(
  PermissionKit.checkAccessibility,
  PermissionKit.accessibility
);

export const useMedia = createPermissionHook(
  PermissionKit.checkMedia,
  PermissionKit.media
);
