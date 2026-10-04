export default ({ config }) => {
  const APP_NAME = process.env.EXPO_PUBLIC_APP_NAME || "PayVerify Waiter";
  const APP_SLUG = process.env.EXPO_PUBLIC_APP_SLUG || "payverify-waiter";
  const BUNDLE_ID = process.env.EXPO_PUBLIC_BUNDLE_ID || "com.payverify.waiter";
  const PRIMARY_COLOR = process.env.EXPO_PUBLIC_PRIMARY_COLOR || "#14181F";

  return {
    ...config,
    name: APP_NAME,
    slug: APP_SLUG,
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      backgroundColor: PRIMARY_COLOR,
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: false,
      bundleIdentifier: BUNDLE_ID,
      infoPlist: {
        NSCameraUsageDescription: `${APP_NAME} scans mobile-payment receipts with the camera to record transactions.`
      }
    },
    android: {
      package: BUNDLE_ID,
      versionCode: 2,
      permissions: ["CAMERA"],
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: PRIMARY_COLOR
      }
    },
    plugins: [
      ["expo-camera", { cameraPermission: `Allow ${APP_NAME} to access the camera to scan receipts.` }]
    ],
    extra: {
      eas: {
        projectId: "d93fce73-7968-445d-be1f-bdf85947650d"
      }
    }
  };
};
