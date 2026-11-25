import test from "node:test";
import assert from "node:assert/strict";
import {SoftwareDoctor} from "../src/index.js";
test("does not send telemetry before configuration",async()=>{SoftwareDoctor.config=null;await SoftwareDoctor.capture({message:"ignored"})});
test("sends a sanitized event and omits secret environment fields",async()=>{
 const originalFetch=globalThis.fetch,uncaught=process.listeners("uncaughtExceptionMonitor"),rejections=process.listeners("unhandledRejection");let observed;
 globalThis.fetch=async(url,options)=>{observed={url,options};return {ok:true,status:202}};
 try{
  SoftwareDoctor.init({projectId:"p1",ingestionKey:"private-key",endpoint:"http://localhost:4000",sampleRate:1,environment:{region:"test",password:"should-drop"}});
  await SoftwareDoctor.capture({message:"failed password=secret"});
  assert.equal(observed.url,"http://localhost:4000/api/monitoring/ingest/p1");
  assert.equal(observed.options.headers["x-software-doctor-key"],"private-key");
  assert.doesNotMatch(JSON.parse(observed.options.body).message,/secret/);
  assert.equal(SoftwareDoctor.config.environment.password,undefined);
 }finally{
  globalThis.fetch=originalFetch;SoftwareDoctor.config=null;
  process.removeAllListeners("uncaughtExceptionMonitor");uncaught.forEach(x=>process.on("uncaughtExceptionMonitor",x));
  process.removeAllListeners("unhandledRejection");rejections.forEach(x=>process.on("unhandledRejection",x));
 }
});