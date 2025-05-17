# Decronymer

[![Website](https://img.shields.io/website?url=https%3A%2F%2Fwww.decronymer.app%2F&up_message=online&down_message=offline&style=for-the-badge&logo=internet-explorer&label=Website)](https://www.decronymer.app/)
[![GitHub License](https://img.shields.io/github/license/rFarinha/Decronymer?style=for-the-badge&logo=github)](./LICENSE.txt)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/rFarinha/Decronymer?style=for-the-badge&logo=github)](https://github.com/rFarinha/Decronymer/releases)

A lightweight desktop tray application that automatically detects acronyms from your clipboard and displays their meanings via system notifications.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/M4M71EIAS9)

![image](https://github.com/user-attachments/assets/5b2aa782-2014-4dc3-9095-eea449edec46)

## 🚀 Features

- **Notifications**: Shows system notifications with acronym meanings
- **Multiple File Support**: Organize acronyms across different files (TXT, CSV, MD)
- **Multiple Files Active**: Select multiple files to search all at the same time
- **Team Collaboration**: Optionally sync acronym lists through Google Drive for team sharing
- **Customizable Settings**: Configure notification duration, mute options, and more
- **Cross-Platform**: Works on Windows and Linux, dont have mac to test on macOS

## 📋 How It Works

https://github.com/user-attachments/assets/2036b604-1f2e-4eb3-99da-af6507887a98

1. [Finding an acronym](#finding-an-acronym)
2. [Adding an acronym](#adding-an-acronym)
3. [Selecting Multiple files same folder](#selecting-multiple-files-same-folder)
4. [Changing to text file in another folder](#changing-to-text-file-in-another-folder)

### Finding an acronym
1. Copy any text containing an acronym to your clipboard
2. Decronymer automatically detects if the text matches any acronym in your lists
3. If a match is found, a system notification appears with the meaning
4. The notification disappears after the configured duration

>⚠️ Copying twice the same acronym will not pop up the notification, just copy something random and try again

### Adding an acronym
1. Add an acronym to the acronym file
2. Press Tray Icon
3. Press Refresh to update Decronymer database

![image](https://github.com/user-attachments/assets/b41728e5-230d-4d05-bf76-9b0a73030b52)

### Selecting Multiple files same folder
1. Go to tray and open Active Texts
2. Press to the left of the txt name
   
![image](https://github.com/user-attachments/assets/fa41ef44-75eb-4a6e-ada8-8d4b992997d4)

### Changing to text file in another folder
1. Go to tray and open settings
   
![image](https://github.com/user-attachments/assets/fb95b3a1-874d-435a-876a-813ca7227a7c)

2. Change path to folder with acronym text files (use double \\\\ for windows)

![image](https://github.com/user-attachments/assets/dec9ed47-281a-4fa5-b3b3-f2425cf38908)

3. Press Refresh to update list of text files available

## 💻 Installation

### Method 1: Download Pre-built Binaries

1. Visit the [Releases](https://github.com/rFarinha/Decronymer/releases) page
2. Download the appropriate installer for your operating system:
   - **Windows**: `decronymer-setup.exe`
   - **Linux**: `decronymer_x.x.x_amd64.deb` or `.rpm`
3. Run the installer and follow the installation wizard

### Method 2: Build from Source

⚠️ For **macOS** you need to build from source.

```bash
# Clone the repository
git clone https://github.com/rFarinha/Decronymer.git
cd Decronymer

# Install dependencies
npm install

# Run in development mode
npm start

# Build for production
npm run make
```

## ⚙️ Configuration

Decronymer uses a `settings.json` file for configuration. To open the settings:

1. Press Tray Icon
2. Press Settings (it will open with the default software for JSONs in the OS)

The default settings are:

```json
{
  "folderPath": "examples",
  "extensions": ["txt", "csv", "md"],
  "separator": ";",
  "muteNotifications": true,
  "notificationDuration_ms": 10000,
  "showInActionCenter": false,
  "clipboardTimer_ms": 500,
  "maxAcronymChars": 15,
  "urgency": "normal",
  "activeFiles": {
    "SpaceX.txt": true
  }
}
```
>⚠️ If an invalid settings are saved, Decronymer will reset the settings to default!

### Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `folderPath` | Directory containing acronym files. Use an absolute path. Use \\\\ | `"examples"` |
| `extensions` | Supported file extensions list | `["txt", "csv", "md"]` |
| `separator` | Character separating acronym from definition | `";"` |
| `muteNotifications` | Whether notifications should be silent | `true` |
| `notificationDuration_ms` | How long notifications stay visible (ms) | `10000` |
| `showInActionCenter` | Keep notifications in system notification center | `false` |
| `clipboardTimer_ms` | How often to check clipboard (ms) | `500` |
| `maxAcronymChars` | Maximum characters to consider as acronym | `15` |
| `urgency` | Notification priority level (normal, critical, low) | `"normal"` |
| `activeFiles` | Which files are currently active | `{ "SpaceX.txt": true }` |

## 🤝 Contributing

Contributions are welcomed! Here's how you can help:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


### Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/Decronymer.git
cd Decronymer

# Install dependencies
npm install

# Start development server
npm start

# Run in debug mode
# Set debugMode = true in main.js
```

## 🐛 Issues

Check Troubleshoot guide first - [Troubleshoot Wiki](https://github.com/rFarinha/decronymer/wiki/Troubleshoot)

Found a bug or have a feature request? Please [open an issue](https://github.com/rFarinha/Decronymer/issues/new) with:

- Clear description of the problem/request
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Your operating system and Decronymer version
