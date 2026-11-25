import {app,BrowserWindow,Tray,Menu,Notification,ipcMain,shell,nativeImage} from "electron";
import path from "node:path";
import {fileURLToPath} from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url));
let win,tray;
function createWindow(){
 const devUrl=process.env.SOFTWARE_DOCTOR_URL;
 win=new BrowserWindow({width:1440,height:950,minWidth:960,minHeight:650,show:false,webPreferences:{preload:path.join(here,"preload.cjs"),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 win.once("ready-to-show",()=>win.show());
 win.webContents.setWindowOpenHandler(({url})=>{if(url.startsWith("https://"))shell.openExternal(url);return {action:"deny"}});
 win.webContents.on("will-navigate",(event,url)=>{const allowed=devUrl&&url.startsWith(devUrl);if(!allowed&&!url.startsWith("file://")){event.preventDefault();if(url.startsWith("https://"))shell.openExternal(url)}});
 if(devUrl)win.loadURL(devUrl);else win.loadFile(path.join(process.resourcesPath,"web-dist","index.html"));
 win.on("closed",()=>{win=null});
}
app.whenReady().then(()=>{createWindow();tray=new Tray(nativeImage.createEmpty());tray.setToolTip("Software Doctor AI");tray.setContextMenu(Menu.buildFromTemplate([{label:"Open Software Doctor",click:()=>win?.show()},{type:"separator"},{label:"Quit",click:()=>app.quit()}]));tray.on("double-click",()=>win?.show())});
ipcMain.handle("doctor:notify",(_event,{title,message})=>{new Notification({title:String(title).slice(0,100),body:String(message).slice(0,300)}).show();return true});
ipcMain.handle("doctor:open-external",async(_event,url)=>{if(typeof url==="string"&&/^https:\/\//.test(url))await shell.openExternal(url)});
app.on("window-all-closed",()=>{if(process.platform!=="darwin")app.quit()});app.on("activate",()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()});