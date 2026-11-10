import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
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

  const [selectedCamera, setSelectedCamera] = useState<'front' | 'back'>(
    'back',
  );
  const [permission, setPermission] =
    useState<CameraPermissionStatus>('not-determined');
  const frontDevice = devices?.find(item => item.position === 'front');
  const backDevice =
    devices?.find(item => item.position === 'back') ?? frontDevice;
  const device = selectedCamera === 'back' ? backDevice : frontDevice;

  // Turn the camera back on so the user can scan again
  const resumeCamera = () => {
    cameraActiveRef.current = true;
    setCameraActive(true);
  };

  const { scan } = usePassgageQRScanner({
    options: { skipLocationCheck: false, skipRepetitiveCheck: false },
    onSuccess: entrance => {
      const message = `Access granted!\nEntrance ID: ${entrance?.id || 'N/A'}`;
      Alert.alert('Success', message);
    },
    onError: error => {
      const errorMessage = error?.message || 'QR validation failed';
      const code = error?.error?.code;
      Alert.alert('Failed', code ? `${errorMessage}\n(${code})` : errorMessage, [
        { text: 'Scan again', onPress: resumeCamera },
      ]);
    },
  });

  // The camera reports the code on every frame: take the first one, stop
  // the camera, and let the result decide whether to scan again. (The SDK
  // also ignores scan calls made while one is running.)
  const onRead = (qrCode: string) => {
    Vibration.vibrate(200);
    setCameraActive(false);
    scan(qrCode);
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

  if (permission === 'denied') {
    return <Text>Camera permission is required to scan QR codes</Text>;
  }

  if (device == null) {
    return <Text>No camera found</Text>;
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
