const { app, Menu, Tray, nativeImage, BrowserWindow, clipboard, Notification } = require('electron')
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
const iconPath = path.join(assetsPath, 'img', 'logo.ico')
const icon = nativeImage.createFromPath(iconPath)

// Create a Map to store acronyms and their definitions
const acronymMap = new Map();

// **********************************************************
// APP START
// **********************************************************
app.whenReady().then(() => {

  console.log(settingsFileName)
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
// 1. REFRESH DATA
// **********************************************************

function refreshData() {
  settings = loadSettings();
  getFolderPath();
  files = findTxtFiles();
  updateActiveFiles(files);
  updateAcronymDatabase();
}

/**
 * Load Settings 
 * @returns JS Object converted from JSON string
 */
function loadSettings() {
  try {
      const data = fs.readFileSync(settingsFileName, 'utf8');
      return JSON.parse(data);
  } catch (err) {
      // Handle file read errors or initial setup here
      return {};
  }
}

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
  
  // Populate the Map
  lines.forEach(line => {
    const [acronym, ...definitionParts] = line.split(settings.separator).map(item => item.trim());
    const definition = definitionParts.join(settings.separator);
    acronymMap.set(acronym, definition);
  });
}

/**
 * Will search a path for files with given extension and return file names in an array
 * @returns {Array<string>} filteredFiles List of file names found in folderPath with extension = fileExtension
 */
function findTxtFiles(){
  // Check if the folderPath exists
  if (!fs.existsSync(folderPath)) {
    console.error(`Folder does not exist: ${folderPath}`);
    return [];
  }

  // Read the contents of the folder
  const files = fs.readdirSync(folderPath);

  // Filter files by the given extension
  const filteredFiles = files.filter((file) =>
    path.extname(file).toLowerCase() === `.${settings.extension.toLowerCase()}`
  );

  return filteredFiles;
}

function updateActiveFiles(fileList) {
  // Get the current activeFiles from settings
  const activeFiles = settings.activeFiles;

  // Create a new object to store the updated activeFiles
  const updatedActiveFiles = {};

  // Add or update files from the input list
  fileList.forEach(file => {
    if (activeFiles.hasOwnProperty(file)) {
      updatedActiveFiles[file] = activeFiles[file];
    } else {
      updatedActiveFiles[file] = false;
    }
  });

  // Remove files not in the input list
  for (const file in activeFiles) {
    if (!fileList.includes(file)) {
      delete activeFiles[file];
    }
  }

  // Update the settings object with the new activeFiles
  settings.activeFiles = updatedActiveFiles;

  // Write the updated settings back to the JSON file
  fs.writeFileSync(settingsFileName, JSON.stringify(settings, null, 2), 'utf8');
  debugLog('settings.json has been updated successfully.');
}

// **********************************************************
// 2. BUILD TRAY
// **********************************************************

function buildTray(){
  tray = new Tray(icon)
  const menu = buildMenu(files, settings.activeFiles)
  tray.setToolTip('Decronymer')
  tray.setContextMenu(menu)
}


function buildMenu(files, selectedFiles){
  const menu = Menu.buildFromTemplate([
    { label: app.name, enabled: false },
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
  const settingsData = loadSettings()
  const dataToSave = JSON.stringify({ ...settingsData, "activeFiles": {...selectedFiles} }, null, 2);
  debugLog(dataToSave)
  const filePath = settingsFileName; // Path to your JSON file

  try {
    fs.writeFileSync(filePath, dataToSave);
    debugLog('Selected files saved to', filePath);
  } catch (err) {
    console.error('Error saving selected files:', err);
  }
}

function refreshBtnAction() {
  debugLog('Refresh pressed!')
  refreshData()
  tray.destroy()
  buildTray()
}


function settingsBtnAction() {
  debugLog('Settings pressed!')
  openJsonFile(settingsFileName)
}

function openJsonFile(jsonFile) {
  //const filePath = path.join(__dirname, jsonFile);
  exec(`notepad ${jsonFile}`, (err) => {
      if (err) {
          console.error('An error occurred while opening the JSON file:', err);
      }
  });
}

function openFolder() {
  exec(`explorer "${folderPath}"`, (err) => {
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

  currentClipTxt = clipboardText
  debugLog(currentClipTxt)
  const acronymDefinition = getDefinition(currentClipTxt)
  if(acronymDefinition){
    showNotification(clipboardText, acronymDefinition)
    lastNotifiedAcronym = clipboardText

    // Reset after 5 seconds (adjust time as needed)
    setTimeout(resetLastNotifiedAcronym, 5000);
  }
}

function showNotification(notificationTitle, notificationBody) {
  if (settings != null){
    const notification = new Notification({
      title: notificationTitle,
      body: notificationBody,
      icon: icon,
      silent: settings.muteNotifications,
      urgency: 'low',
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

function getDefinition(acronym) {
  const acronymDefinition = acronymMap.get(acronym)
  debugLog(acronymDefinition)
  return acronymDefinition
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