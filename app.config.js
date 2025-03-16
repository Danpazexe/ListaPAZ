module.exports = {
  name: "Lista de Compras",
  slug: "bolt-expo-nativewind",
  version: "1.0.0",
  assetBundlePatterns: ["**/*"],
  plugins: ["expo-router"],
  experiments: {
    typedRoutes: true
  },
  extra: {
    router: {
      origin: false
    },
    eas: {
      projectId: "1e83dbc1-1997-44ab-a35d-93af217ac9b8"
    }
  },
  android: {
    package: "com.pazzdan.boltexponativewind",
    newArchEnabled: false
  },
  ios: {
    bundleIdentifier: "com.pazzdan.listacompras",
    newArchEnabled: false
  }
}; 