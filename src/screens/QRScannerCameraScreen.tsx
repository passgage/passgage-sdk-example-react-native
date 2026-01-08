import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Alert,
  Pressable,
} from 'react-native';
import {
  Camera,
  useCameraDevices,
  CameraPermissionStatus,
  useCodeScanner,
} from 'react-native-vision-camera';
import { usePassgageQRScanner } from '@passgage/sdk-react-native';

export const QRScannerCameraScreen = () => {
  const cameraRef = useRef<Camera>(null);
  const devices = useCameraDevices();
  const cameraActiveRef = useRef(true);
  const [cameraActive, setCameraActive] = useState(true);
  const [lastScanResult, setLastScanResult] = useState<string | null>(null);

  const [selectedCamera, setSelectedCamera] = useState<'front' | 'back'>(
    'back',
  );
  const [permission, setPermission] =
    useState<CameraPermissionStatus>('not-determined');
  const frontDevice = devices?.find(item => item.position === 'front');
  const backDevice =
    devices?.find(item => item.position === 'back') ?? frontDevice;
  const device = selectedCamera === 'back' ? backDevice : frontDevice;

  const { scan, isLoading } = usePassgageQRScanner({
    skipLocationCheck: false,
    skipRepetitiveCheck: false,
    onSuccess: entrance => {
      const message = `Access granted!\nEntrance ID: ${entrance?.id || 'N/A'}`;
      setLastScanResult(message);
      setCameraActive(false);
      Alert.alert('Success', message);
    },
    onError: error => {
      const errorMessage = error.message || 'QR validation failed';
      setLastScanResult(`Error: ${errorMessage}`);
      Alert.alert('Failed', errorMessage);
    },
  });

  const onRead = async (qrCode: string) => {
    Vibration.vibrate(200);
    scan(qrCode);
    setCameraActive(false);
  };

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: codes => {
      const value = codes[0]?.value;
      if (value === null || !value) {
        return;
      }
      if (cameraActiveRef.current) {
        cameraActiveRef.current = false;
        onRead(value);
      }
    },
  });

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setPermission(status);
    })();
  }, []);

  if (device == null) {
    return <Text>Kamera bulunamadı</Text>;
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={cameraActive}
        codeScanner={codeScanner}
      />

      <Pressable
        style={{
          position: 'absolute',
          right: 30,
          bottom: 60,

          // backgroundColor: 'white',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
        }}
      >
        <Text
          onPress={() => {
            cameraActiveRef.current = !cameraActiveRef.current;

            setCameraActive(prev => !prev);
          }}
          style={{ fontSize: 30, marginRight: 12 }}
        >
          {cameraActive ? '⏸️' : '▶️'}
        </Text>
        <Text
          onPress={() => {
            setSelectedCamera(selectedCamera === 'back' ? 'front' : 'back');
          }}
          style={{ fontSize: 30 }}
        >
          🔄
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  button: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: 'bold',
  },
});
