const { app, Menu, Tray, nativeImage, BrowserWindow, clipboard, Notification, shell } = require('electron')
const { exec } = require('child_process'); // To open notepad when settings in tray is selected
const path = require('path')
const fs = require('fs');

// find if Mac so the tray closes instead of quit
const isMac = process.platform === 'darwin'

// Necessary for notifications to show the correct app name
if (process.platform === 'win32')
  {
      app.setAppUserModelId(app.name);
  }

const assetsPath = app.isPackaged ? path.join(process.resourcesPath) : "resources";

// CONFIGURATIONS
const debugMode = true; //  true for debug mode, false for normal mode
const settingsFileName = path.join(assetsPath, "settings/settings.json")

// Global vars
let settings
let files
let tray
let currentClipTxt = ""
let folderPath
let lastNotifiedAcronym = "";

// icon
const iconPath = path.join(assetsPath, 'img', 
  process.platform === 'win32' ? 'logo.ico' : 
  process.platform === 'darwin' ? 'logo.icns' : 'logo.png')
const icon = nativeImage.createFromPath(iconPath)


// Create a Map to store acronyms and their definitions
const acronymMap = new Map();

// **********************************************************
// APP START
// **********************************************************
app.whenReady().then(() => {

  debugLog(settingsFileName)
  // 1. Load settings, update acronym database and check available txts
  refreshData()

  // 2. build tray based on files found
  buildTray()

  // 3. Set an interval to periodically read the clipboard
  setInterval(readClipboardAndPerformActions, settings.clipboardTimer_ms);

})
.catch((error) => {
  console.error('Error starting the app:', error);
});

// **********************************************************
// REFRESH DATA
// **********************************************************

function refreshData() {
  settings = loadSettings();
  getFolderPath();
  files = findTxtFiles();
  updateActiveFiles(files);
  updateAcronymDatabase();
}

/**
 * Load Settings with fallback to defaults for any missing properties
 * @returns {Object} Complete settings object with defaults for any missing values
 */
function loadSettings() {
  // Define default settings
  const defaultSettings = {
    folderPath: "examples",
    extensions: ["txt","csv","md"],
    separator: ";",
    muteNotifications: true,
    notificationDuration_ms: 10000,
    showInActionCenter: false,
    clipboardTimer_ms: 500,
    maxAcronymChars: 15,
    urgency: "normal",
    activeFiles: {
      "SpaceX.txt": true
    }
  };

  try {
    // Check if settings file exists
    if (!fs.existsSync(settingsFileName)) {
      debugLog("Settings file not found. Creating with defaults.");
      fs.writeFileSync(settingsFileName, JSON.stringify(defaultSettings, null, 2), 'utf8');
      return defaultSettings;
    }

    // Read the existing settings file
    const data = fs.readFileSync(settingsFileName, 'utf8');
    let userSettings;
    
    try {
      userSettings = JSON.parse(data);
    } catch (parseError) {
      console.error('Error parsing settings JSON:', parseError);
      debugLog('Invalid JSON in settings file. Using defaults.');
      fs.writeFileSync(settingsFileName, JSON.stringify(defaultSettings, null, 2), 'utf8');
      return defaultSettings;
    }
    
    // Backward compatibility: convert extension to extensions array if needed
    if (!userSettings.extensions && userSettings.extension) {
      userSettings.extensions = [userSettings.extension];
      debugLog('Converted single extension to array for compatibility');
    }
    
    // Merge user settings with defaults to ensure all properties exist
    const mergedSettings = { ...defaultSettings };
    let needsUpdate = false;
    
    // Check all default properties
    Object.keys(defaultSettings).forEach(key => {
      if (userSettings[key] !== undefined) {
        mergedSettings[key] = userSettings[key];
      } else {
        debugLog(`Missing setting "${key}", using default: ${JSON.stringify(defaultSettings[key])}`);
        needsUpdate = true;
      }
    });
    
    // If activeFiles is null or undefined, initialize it
    if (!mergedSettings.activeFiles) {
      mergedSettings.activeFiles = {};
      needsUpdate = true;
    }
    
    // If settings were missing and restored, update the file
    if (needsUpdate) {
      debugLog("Some settings were missing. Updating settings file with defaults.");
      fs.writeFileSync(settingsFileName, JSON.stringify(mergedSettings, null, 2), 'utf8');
    }
    
    return mergedSettings;
  } catch (err) {
    console.error('Error loading settings:', err);
    debugLog("Using default settings due to error.");
    
    // In case of any other error, return defaults and try to create the settings file
    try {
      fs.writeFileSync(settingsFileName, JSON.stringify(defaultSettings, null, 2), 'utf8');
    } catch (writeErr) {
      console.error('Error creating default settings file:', writeErr);
    }
    
    return defaultSettings;
  }
}

/**
 * Get the folder path from settings
 * If the folderPath is 'examples', it will use the assetsPath
 * Otherwise, it will use the folderPath from settings
 */
function getFolderPath(){
  if (settings.folderPath === 'examples'){
    folderPath = path.join(assetsPath, settings.folderPath);
  }else{
    folderPath = settings.folderPath
  }

}

function updateAcronymDatabase() {
  activeFiles = settings.activeFiles;

  // Clear map to remove unselected files
  acronymMap.clear()

  // We only need the file name of the active files
  const activeFilesKeys = Object.keys(activeFiles).filter(key => activeFiles[key]);

  let lines = [];
  
  activeFilesKeys.forEach(file => {
    const fileLines = fs.readFileSync(`${folderPath}/${file}`, 'utf-8').split('\n');
    lines = lines.concat(fileLines);
  });
  
  // Populate the Map with arrays of definitions
  lines.forEach(line => {
    if (!line.trim()) return; // Skip empty lines
    
    const [acronym, ...definitionParts] = line.split(settings.separator).map(item => item.trim());
    if (!acronym) return; // Skip if no acronym
    
    const definition = definitionParts.join(settings.separator);
    
    // If this acronym already exists in the map, add to its definitions array
    if (acronymMap.has(acronym)) {
      const definitions = acronymMap.get(acronym);
      // Only add if this definition isn't already in the array
      if (!definitions.includes(definition)) {
        definitions.push(definition);
      }
    } else {
      // First occurrence of this acronym
      acronymMap.set(acronym, [definition]);
    }
  });
}

/**
 * Will search a path for files with given extension and return file names in an array
 * @returns {Array<string>} filteredFiles List of file names found in folderPath with extension = fileExtension
 */
function findTxtFiles() {
  // Check if the folderPath exists
  if (!fs.existsSync(folderPath)) {
    console.error(`Folder does not exist: ${folderPath}`);
    return [];
  }

  // Read the contents of the folder
  const files = fs.readdirSync(folderPath);

  // Check if settings.extensions is an array, if not convert it
  const extensions = Array.isArray(settings.extensions) 
    ? settings.extensions 
    : [settings.extension || 'txt']; // Fallback to 'extension' for backward compatibility
  
  debugLog(`Looking for files with extensions: ${extensions.join(', ')}`);

  // Filter files by the given extensions
  const filteredFiles = files.filter((file) => {
    const fileExtension = path.extname(file).toLowerCase().substring(1); // Remove the dot
    return extensions.includes(fileExtension.toLowerCase());
  });

  debugLog(`Found ${filteredFiles.length} files with matching extensions`);
  return filteredFiles;
}

/**
 * Update the activeFiles in settings based on the provided fileList
 * @param {Array<string>} fileList - List of files to update
 */
function updateActiveFiles(fileList) {
  // Get the current activeFiles from settings
  const activeFiles = settings.activeFiles || {};
  let hasChanges = false;

  // Create a new object to store the updated activeFiles
  const updatedActiveFiles = {};

  // Add or update files from the input list
  fileList.forEach(file => {
    if (activeFiles.hasOwnProperty(file)) {
      updatedActiveFiles[file] = activeFiles[file];
    } else {
      updatedActiveFiles[file] = false;
      hasChanges = true;
    }
  });

  // Check if files were removed
  let oldFileCount = Object.keys(activeFiles).length;
  let newFileCount = Object.keys(updatedActiveFiles).length;
  if (oldFileCount !== newFileCount) {
    hasChanges = true;
  }

  // Update the settings object with the new activeFiles
  settings.activeFiles = updatedActiveFiles;

  // Only write if there are changes
  if (hasChanges) {
    try {
      fs.writeFileSync(settingsFileName, JSON.stringify(settings, null, 2), 'utf8');
      debugLog('settings.json has been updated successfully.');
    } catch (err) {
      console.error('Error writing settings file:', err);
    }
  }
}

// **********************************************************
// 2. BUILD TRAY
// **********************************************************

function buildTray(){
  tray = new Tray(icon)
  const menu = buildMenu(files, settings.activeFiles)
  tray.setToolTip('Decronymer v' + app.getVersion())
  tray.setContextMenu(menu)
}

function updateTrayMenu() {
  debugLog('Updating tray menu');
  const menu = buildMenu(files, settings.activeFiles);
  tray.setContextMenu(menu);
}

function buildMenu(files, selectedFiles){
  const menu = Menu.buildFromTemplate([
    { 
      label: `${app.name} v${app.getVersion()}`,
      click: () => {
        shell.openExternal('http://decronymer.app')
      },
    },
    { type: 'separator' },
    {
      label: 'Active Texts',
      submenu: [
        ...files.map((fileName) => ({
          label: fileName,
          type: 'checkbox',
          click: (menuItem) => {
            // Save selected to settings
            selectedFiles[fileName] = menuItem.checked;
            debugLog('Selected files:', selectedFiles);
            saveSelectedFilesToFile(selectedFiles);
            updateAcronymDatabase();
            updateTrayMenu();
          },
          // Get default from selectedFiles which loads from settings at startup
          checked: selectedFiles[fileName] || false,
        })),
        { type: 'separator' },
        {
          label: 'Open Folder',
          click: () => {
            openFolder();
          },
        },
      ],
    },
    { 
      label: 'Refresh',
      click: () => {
        refreshBtnAction()
      }
    },
    { type: 'separator' },
    { 
      label: 'Settings',
      click: () => {
        settingsBtnAction()
      }
    },
    { type: 'separator' },
    {
      label: 'Exit',
      click: () => {
        // Handle exit button click here
        app.quit();
      },
    },
  ]);
  return menu
}

/**
 * get current selected files and save to settings so next startup they are active
 * @param {*} selectedFiles 
 */
function saveSelectedFilesToFile(selectedFiles) {
  const settingsData = loadSettings();
  
  if (!Array.isArray(settingsData.extensions)) {
    settingsData.extensions = settingsData.extension ? [settingsData.extension] : ['txt'];
  }
  
  const dataToSave = JSON.stringify({ 
    ...settingsData, 
    "activeFiles": {...selectedFiles}
  }, null, 2);
  
  debugLog(dataToSave);
  const filePath = settingsFileName;

  try {
    fs.writeFileSync(filePath, dataToSave);
    debugLog('Selected files saved to', filePath);
  } catch (err) {
    console.error('Error saving selected files:', err);
  }
}

// **********************************************************
// TRAY BUTTONS
// **********************************************************

// Function to handle the click event of the refresh button
function refreshBtnAction() {
  debugLog('Refresh pressed!')
  refreshData()
  updateTrayMenu()
}

// Function to handle the click event of the settings button
function settingsBtnAction() {
  debugLog('Settings pressed!')
  openJsonFile(settingsFileName)
}

// Function to open the JSON file in the default text editor
function openJsonFile(jsonFile) {
  debugLog('openJsonFile()');
  
  // Choose editor based on platform
  let command;
  
  if (process.platform === 'win32') {
    command = `notepad "${jsonFile}"`;
  } else if (process.platform === 'darwin') {
    command = `open -t "${jsonFile}"`; // On macOS, -t flag opens in default text editor
  } else {
    command = `xdg-open "${jsonFile}"`;
  }
  
  exec(command, (err) => {
    if (err) {
      console.error('An error occurred while opening the JSON file:', err);
    }
  });
}

// Function to open the folder in the file explorer
function openFolder() {
  debugLog('openFolder()')
  const command = process.platform === 'win32' 
    ? `explorer "${folderPath}"`
    : process.platform === 'darwin'
      ? `open "${folderPath}"`
      : `xdg-open "${folderPath}"`; // Linux uses xdg-open
  
  exec(command, (err) => {
    if (err) {
      console.error('Error opening folder:', err);
    }
  });
}

// **********************************************************
// 3. CLIPBOARD FUNCTIONALITY
// **********************************************************

// Function to periodically read clipboard and perform actions
function readClipboardAndPerformActions() {
  const clipboardText = clipboard.readText();
  handleClipboardTextValidation(clipboardText)
}

// Function to handle clipboard text validation
// @param {string} clipboardText - The text from the clipboard
function handleClipboardTextValidation(clipboardText){
  
  // Check if string
  if (typeof clipboardText !== 'string'){
    debugLog("NOT STRING!")
    return
  }

  // Check if value changed
  if (currentClipTxt === clipboardText){
    debugLog("VALUE NOT CHANGED!")
    return
  }

  // Check if acronym bigger than character limit in settings
  if (clipboardText.length >  settings.maxAcronymChars){
    debugLog("ABOVE CHAR LIMIT!")
    return
  }

  // Check if we've already notified about this acronym recently
  if (lastNotifiedAcronym === clipboardText) {
    debugLog("ALREADY NOTIFIED FOR THIS ACRONYM!")
    return
  }

  currentClipTxt = clipboardText;
  debugLog(currentClipTxt);
  const acronymDefinitions = getDefinition(currentClipTxt);
  
  if (acronymDefinitions && acronymDefinitions.length > 0) {
    // Show a notification for each definition
    acronymDefinitions.forEach(definition => {
      showNotification(clipboardText, definition);
    });
    
    lastNotifiedAcronym = clipboardText;
    // Reset after 5 seconds
    setTimeout(resetLastNotifiedAcronym, 5000);
  }
}

// **********************************************************
// NOTIFICATION FUNCTIONALITY
// **********************************************************

// Function to show a notification
// @param {string} notificationTitle - The title of the notification
// @param {string} notificationBody - The body of the notification
function showNotification(notificationTitle, notificationBody) {
  if (settings != null){
    const notification = new Notification({
      title: notificationTitle,
      body: notificationBody,
      icon: icon,
      silent: settings.muteNotifications,
      urgency: settings.urgency,
      timeoutType: settings.showInActionCenter ? 'default' : 'never',
      hasReply: false,
      closeButtonText: null,
    });

    notification.show();

    // Automatically close notification after X milliseconds
    setTimeout(() => {
      notification.close();
    }, settings.notificationDuration_ms || 10000);
  }
}

// Function to get the definition of an acronym
// @param {string} acronym - The acronym to look up
// @returns {string} - The definition of the acronym
// If not found, returns an empty string
function getDefinition(acronym) {
  const acronymDefinitions = acronymMap.get(acronym);
  debugLog(acronymDefinitions);
  return acronymDefinitions;
}

// CLEAN last used acronym
function resetLastNotifiedAcronym() {
  lastNotifiedAcronym = "";
}

// **********************************************************
// UTILS
// **********************************************************

// Function to log messages if debugMode is true
function debugLog(message) {
  if (debugMode) {
    console.log(message);
  }
}