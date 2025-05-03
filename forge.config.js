const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    name: 'Decronymer',
    executableName: 'Decronymer',
    icon: 'resources/img/logo',
    extraResource: ['./resources/examples', './resources/img', './resources/settings'],
    asar: true,
    win32metadata: {
      CompanyName: 'Decronymer',
      FileDescription: 'Decronymer App',
      OriginalFilename: 'Decronymer.exe',
      ProductName: 'Decronymer',
      InternalName: 'Decronymer'
    }
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        setupIcon: 'resources/img/logo.ico'
      },
    },
    // DMG maker for Intel Macs
    {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin'],
      architectures: ['x64'],
      config: {
        format: 'ULFO',
        icon: 'resources/img/logo.icns',
        name: 'Decronymer-x64',
        overwrite: true
      }
    },
    // DMG maker for Apple Silicon Macs
    {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin'],
      architectures: ['arm64'],
      config: {
        format: 'ULFO',
        icon: 'resources/img/logo.icns',
        name: 'Decronymer-arm64',
        overwrite: true
      }
    },
    // Debian package maker
    {
      name: '@electron-forge/maker-deb',
      config: {
        icon: 'resources/img/logo.png',
        categories: ['Utility'],
        depends: ['debconf'],
        section: 'utils',
        priority: 'optional',
        homepage: 'https://www.decronymer.app',
      },
    },
    // RPM package maker
    {
      name: '@electron-forge/maker-rpm',
      config: {
        icon: 'resources/img/logo.png',
        categories: ['Utility'],
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
