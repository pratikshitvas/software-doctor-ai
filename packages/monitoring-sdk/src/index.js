const sensitive=/(authorization|cookie|password|secret|api[_-]?key|token)/i;
const clean=v=>String(v??"").replace(/(authorization\s*[:=]\s*)(bearer\s+)?[^\s,;]+/gi,"$1[REDACTED]").replace(/((?:api[_-]?key|access[_-]?token|password|secret)\s*[:=]\s*)[^\s,;]+/gi,"$1[REDACTED]");
const safeEnv=o=>Object.fromEntries(Object.entries(o||{}).filter(([k,v])=>!sensitive.test(k)&&typeof v==="string"&&v.length<500).slice(0,30));
export const SoftwareDoctor={
 config:null,
 init(options){
  if(!options?.projectId||!options?.ingestionKey||!options?.endpoint)throw Error("projectId, ingestionKey, and endpoint are required.");
  this.config={...options,sampleRate:Math.min(1,Math.max(0,options.sampleRate??1)),environment:safeEnv(options.environment)};
  if(typeof window!=="undefined"){
   window.addEventListener("error",e=>this.capture({message:e.message||"Unhandled browser error",stack:e.error?.stack}));
   window.addEventListener("unhandledrejection",e=>this.capture({message:String(e.reason?.message||e.reason||"Unhandled promise rejection"),stack:e.reason?.stack}));
  }
  if(typeof process!=="undefined"&&typeof window==="undefined"){
   process.on("uncaughtExceptionMonitor",e=>this.capture({message:e.message,stack:e.stack}));
   process.on("unhandledRejection",e=>this.capture({message:String(e?.message||e),stack:e?.stack}));
  }
 },
 async capture(input){
  if(!this.config||Math.random()>this.config.sampleRate)return;
  const c=this.config,payload={message:clean(input.message).slice(0,4000),stack:clean(input.stack).slice(0,16000),environment:c.environment,version:c.version,deploymentId:c.deploymentId,occurredAt:new Date().toISOString()};
  try{await fetch(`${c.endpoint.replace(/\/$/,"")}/api/monitoring/ingest/${encodeURIComponent(c.projectId)}`,{method:"POST",headers:{"content-type":"application/json","x-software-doctor-key":c.ingestionKey},body:JSON.stringify(payload),keepalive:true})}catch{/* Telemetry errors must not crash the host app. */}
 }
};