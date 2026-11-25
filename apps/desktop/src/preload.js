import {contextBridge,ipcRenderer} from "electron";
contextBridge.exposeInMainWorld("softwareDoctorDesktop",Object.freeze({
 notify:(title,message)=>ipcRenderer.invoke("doctor:notify",{title,message}),
 openExternal:url=>ipcRenderer.invoke("doctor:open-external",url),
 platform:process.platform
}));
