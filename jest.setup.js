/* eslint-env jest */

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map();
  const AsyncStorage = {
    getItem: jest.fn((key) =>
      Promise.resolve(store.has(key) ? store.get(key) : null),
    ),
    setItem: jest.fn((key, value) => {
      store.set(key, String(value));
      return Promise.resolve();
    }),
    removeItem: jest.fn((key) => {
      store.delete(key);
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      store.clear();
      return Promise.resolve();
    }),
    getAllKeys: jest.fn(() => Promise.resolve([...store.keys()])),
  };
  return { __esModule: true, default: AsyncStorage, ...AsyncStorage };
});

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('react-native-device-info', () => {
  const deviceInfo = {
    getUniqueId: jest.fn(() => Promise.resolve('jest-device-id')),
    getDeviceId: jest.fn(() => Promise.resolve('jest-device-id')),
    getDeviceName: jest.fn(() => Promise.resolve('Jest Device')),
    getSystemName: jest.fn(() => 'Android'),
    getSystemVersion: jest.fn(() => '14'),
    getVersion: jest.fn(() => '1.0.0'),
    getBuildNumber: jest.fn(() => '1'),
    isTablet: jest.fn(() => false),
  };
  return { __esModule: true, default: deviceInfo, ...deviceInfo };
});

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

jest.mock('@react-native-firebase/messaging', () => {
  const messaging = () => ({
    getToken: jest.fn(() => Promise.resolve('jest-token')),
    requestPermission: jest.fn(() => Promise.resolve(1)),
    onMessage: jest.fn(() => () => {}),
    onNotificationOpenedApp: jest.fn(() => () => {}),
    getInitialNotification: jest.fn(() => Promise.resolve(null)),
    setBackgroundMessageHandler: jest.fn(),
  });
  return { __esModule: true, default: messaging, ...messaging };
});

jest.mock('@livekit/react-native', () => ({
  __esModule: true,
  AudioSession: {
    startAudioSession: jest.fn(() => Promise.resolve()),
    stopAudioSession: jest.fn(() => Promise.resolve()),
    configureAudio: jest.fn(() => Promise.resolve()),
  },
  registerGlobals: jest.fn(),
}));

jest.mock('react-native-compass-heading', () => ({
  __esModule: true,
  default: {
    start: jest.fn(),
    stop: jest.fn(),
    updateHeading: jest.fn(),
  },
}));

jest.mock('react-native-geolocation-service', () => ({
  __esModule: true,
  default: {
    getCurrentPosition: jest.fn((success) =>
      success({ coords: { latitude: 0, longitude: 0 } }),
    ),
    watchPosition: jest.fn(),
    clearWatch: jest.fn(),
    requestAuthorization: jest.fn(() => Promise.resolve('granted')),
    setRNConfiguration: jest.fn(),
  },
}));

jest.mock('livekit-client', () => {
  class Room {
    remoteParticipants = new Map();
    localParticipant = {
      publishTrack: jest.fn(() => Promise.resolve()),
      unpublishTrack: jest.fn(() => Promise.resolve()),
      getTrackPublication: jest.fn(() => undefined),
    };
    on = jest.fn();
    connect = jest.fn(() => Promise.resolve());
    disconnect = jest.fn();
  }
  return {
    __esModule: true,
    Room,
    RoomEvent: {
      ParticipantConnected: 'participantConnected',
      ParticipantDisconnected: 'participantDisconnected',
      Disconnected: 'disconnected',
    },
    Track: { Source: { Microphone: 'microphone' } },
    createLocalAudioTrack: jest.fn(() => Promise.resolve({})),
  };
});
