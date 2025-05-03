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
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO', 
        icon: 'resources/img/logo.icns',
        name: 'Decronymer',
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
  hooks: {
    postMake: async (config, makeResults) => {
      // Check if this is a Windows build
      const windowsResult = makeResults.find(result => result.platform === 'win32');
      if (!windowsResult) return makeResults;
      
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const path = require('path');
      const execAsync = promisify(exec);
      
      try {
        const issScriptPath = path.join(__dirname, 'setup-script.iss');
        const outputDir = path.dirname(windowsResult.artifacts[0]);
        
        // Update the ISS script to point to the correct output directory
        const fs = require('fs');
        let issContent = fs.readFileSync(issScriptPath, 'utf8');
        
        // Replace the output base filename
        issContent = issContent.replace(
          /OutputBaseFilename=.*/,
          'OutputBaseFilename=Decronymer-Inno-Setup'
        );
        
        // Write temporary ISS file
        const tempIssPath = path.join(outputDir, 'temp-setup.iss');
        fs.writeFileSync(tempIssPath, issContent);
        
        // Execute Inno Setup
        await execAsync(`iscc "${tempIssPath}" /O"${outputDir}"`);
        
        // Clean up temp file
        fs.unlinkSync(tempIssPath);
        
        // Add the Inno Setup installer to the artifacts
        windowsResult.artifacts.push(path.join(outputDir, 'Decronymer-Inno-Setup.exe'));
        
        console.log('Inno Setup installer created successfully!');
      } catch (error) {
        console.error('Inno Setup compilation failed:', error);
      }
      
      return makeResults;
    }
  }
};
