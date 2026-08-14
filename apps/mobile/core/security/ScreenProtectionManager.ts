import * as ScreenCapture from 'expo-screen-capture';

export class ScreenProtectionManager {
  static async enable() {
    try {
      await ScreenCapture.preventScreenCaptureAsync();
    } catch (e) {
      console.warn('Screen protection not supported on this device/simulator');
    }
  }

  static async disable() {
    try {
      await ScreenCapture.allowScreenCaptureAsync();
    } catch (e) {
      // Ignore
    }
  }
}
