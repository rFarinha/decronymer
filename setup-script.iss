; Script generated for Decronymer with Discord-like installer experience
; Author: Claude

#define MyAppName "Decronymer"
#define MyAppVersion "0.1"
#define MyAppPublisher "Decronymer"
#define MyAppURL "https://www.decronymer.app"
#define MyAppExeName "Decronymer.exe"
#define MyAppAssocName MyAppName + " File"
#define MyAppAssocExt ".myp"
#define MyAppAssocKey StringChange(MyAppAssocName, " ", "") + MyAppAssocExt

[Setup]
; NOTE: The value of AppId uniquely identifies this application. Do not use the same AppId value in installers for other applications.
AppId={{1B451195-8AA2-4F51-B572-6BE9FE9BFF71}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
; "ArchitecturesAllowed=x64compatible" specifies that Setup cannot run
; on anything but x64 and Windows 11 on Arm.
ArchitecturesAllowed=x64compatible
; "ArchitecturesInstallIn64BitMode=x64compatible" requests that the
; install be done in "64-bit mode" on x64 or Windows 11 on Arm
ArchitecturesInstallIn64BitMode=x64compatible
ChangesAssociations=yes
DisableProgramGroupPage=yes
; Remove the following line to run in administrative install mode which installs for all users
PrivilegesRequired=lowest
OutputBaseFilename=decronymer-setup
; Set your icon path here
SetupIconFile=resources\img\logo.ico
Compression=lzma
SolidCompression=yes
WizardStyle=modern

; Set these to your custom background images (create 164x314 px for WizardImageFile and 55x58 px for WizardSmallImageFile)
; WizardImageFile=resources\img\installer-background.bmp
; WizardSmallImageFile=resources\img\installer-small.bmp

; Customize colors - Discord uses a dark theme
WizardResizable=no
BackColor=$232529
BackColor2=$181616
BackColorDirection=lefttoright

; Installer styling and branding
SetupLogging=yes
DisableWelcomePage=no
DisableDirPage=auto
AlwaysShowDirOnReadyPage=no
DisableReadyPage=no
DisableReadyMemo=no
CloseApplications=force
RestartApplications=no
DisableStartupPrompt=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Messages]
; Custom installer messages to match the app's branding and style
WelcomeLabel1=Welcome to the {#MyAppName} Setup Wizard
WelcomeLabel2=This will install {#MyAppName} version {#MyAppVersion} on your computer.%n%nIt is recommended that you close all other applications before continuing.
FinishedHeadingLabel=Completing the {#MyAppName} Setup Wizard
FinishedLabel=Setup has finished installing {#MyAppName} on your computer. The application may be launched by selecting the installed shortcuts.
WizardReady=Ready to Install
ReadyLabel1=Setup is now ready to begin installing {#MyAppName} on your computer.
ReadyLabel2a=Click Install to continue with the installation, or click Back if you want to review or change any settings.

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "startmenuicon"; Description: "Create a Start menu shortcut"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "autostart"; Description: "Start {#MyAppName} when Windows starts"; GroupDescription: "Additional options:";

[Files]
; Adjust paths to match your output directory structure
Source: "out\{#MyAppName}-win32-x64\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion nocompression
Source: "out\{#MyAppName}-win32-x64\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "{#MyAppExeName}"
; NOTE: Don't use "Flags: ignoreversion" on any shared system files

[Registry]
; File association
Root: HKA; Subkey: "Software\Classes\{#MyAppAssocExt}\OpenWithProgids"; ValueType: string; ValueName: "{#MyAppAssocKey}"; ValueData: ""; Flags: uninsdeletevalue
Root: HKA; Subkey: "Software\Classes\{#MyAppAssocKey}"; ValueType: string; ValueName: ""; ValueData: "{#MyAppAssocName}"; Flags: uninsdeletekey
Root: HKA; Subkey: "Software\Classes\{#MyAppAssocKey}\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\{#MyAppExeName},0"
Root: HKA; Subkey: "Software\Classes\{#MyAppAssocKey}\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" ""%1"""
Root: HKA; Subkey: "Software\Classes\Applications\{#MyAppExeName}\SupportedTypes"; ValueType: string; ValueName: ".myp"; ValueData: ""

; Auto start with Windows if selected
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "{#MyAppName}"; ValueData: """{app}\{#MyAppExeName}"""; Flags: uninsdeletevalue; Tasks: autostart

; User settings and first run experience
Root: HKCU; Subkey: "Software\{#MyAppName}"; ValueType: string; ValueName: "InstallPath"; ValueData: "{app}"
Root: HKCU; Subkey: "Software\{#MyAppName}"; ValueType: string; ValueName: "FirstRun"; ValueData: "1"; Flags: createvalueifdoesntexist

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon
Name: "{userstartup}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: autostart

[Run]
; Launch the app after installation if the user chooses to
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[Code]
// Add custom code for splash screen, first-run detection, etc.

// Display a custom splash screen
procedure InitializeWizard;
var
  SplashForm: TSetupForm;
  SplashImage: TBitmapImage;
begin
  // Create splash form
  SplashForm := CreateCustomForm;
  SplashForm.BorderStyle := bsNone;
  SplashForm.Width := 500;
  SplashForm.Height := 300;
  SplashForm.Color := $232529; // Dark background color
  SplashForm.Position := poScreenCenter;
  
  // You can add a bitmap image here for the splash logo
  // SplashImage := TBitmapImage.Create(SplashForm);
  // SplashImage.Parent := SplashForm;
  // SplashImage.Bitmap.LoadFromFile(ExpandConstant('{tmp}\splash.bmp'));
  // SplashImage.AutoSize := True;
  // SplashImage.Left := (SplashForm.ClientWidth - SplashImage.Width) div 2;
  // SplashImage.Top := (SplashForm.ClientHeight - SplashImage.Height) div 2;
  
  // Show splash for 2 seconds
  SplashForm.Show;
  Sleep(2000);
  SplashForm.Close;
  SplashForm.Free;
end;

// Check if the app is already running and close it before installation
function InitializeSetup(): Boolean;
var
  ResultCode: Integer;
begin
  // Try to close the application if it's running
  Exec(ExpandConstant('{sys}\taskkill.exe'), '/F /IM {#MyAppExeName}', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Result := True;
end;

// Customize the wizard pages
procedure CurPageChanged(CurPageID: Integer);
begin
  if CurPageID = wpWelcome then
  begin
    // Customize welcome page if needed
  end
  else if CurPageID = wpFinished then
  begin
    // Customize finished page if needed
  end;
end;

// Check for previous versions and handle migration
function GetUninstallString(): String;
var
  sUnInstPath: String;
  sUnInstallString: String;
begin
  sUnInstPath := ExpandConstant('Software\Microsoft\Windows\CurrentVersion\Uninstall\{#emit SetupSetting("AppId")}_is1');
  sUnInstallString := '';
  if not RegQueryStringValue(HKLM, sUnInstPath, 'UninstallString', sUnInstallString) then
    RegQueryStringValue(HKCU, sUnInstPath, 'UninstallString', sUnInstallString);
  Result := sUnInstallString;
end;

function IsUpgrade(): Boolean;
begin
  Result := (GetUninstallString() <> '');
end;

function InitializeUninstall(): Boolean;
var
  ResultCode: Integer;
begin
  // Close the app if it's running during uninstall
  Exec(ExpandConstant('{sys}\taskkill.exe'), '/F /IM {#MyAppExeName}', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Result := True;
end;