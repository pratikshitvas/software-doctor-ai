import {Router} from "express";
import crypto from "node:crypto";
import {z} from "zod";
import {authenticate} from "./auth.js";
import {makeSecret,redact,sha256} from "./security.js";
const router=Router();
router.post("/ingest/:projectId",async(req,res,next)=>{try{
 const key=req.headers["x-software-doctor-key"];if(typeof key!=="string")return res.status(401).json({error:"Ingestion key required."});
 const cred=await req.prisma.monitoringKey.findFirst({where:{keyHash:sha256(key),revokedAt:null}});
 if(!cred||cred.projectId!==req.params.projectId)return res.status(401).json({error:"Invalid ingestion key."});
 const p=z.object({message:z.string().min(1).max(4000),stack:z.string().max(16000).optional(),environment:z.record(z.string().max(500)).optional(),version:z.string().max(100).optional(),deploymentId:z.string().max(100).optional(),occurredAt:z.string().datetime().optional()}).safeParse(req.body);
 if(!p.success)return res.status(400).json({error:"Invalid event payload."});
 const msg=redact(p.data.message),stack=p.data.stack?redact(p.data.stack):undefined;
 const fingerprint=crypto.createHash("sha256").update(msg+"\n"+(stack||"").split("\n").slice(0,4).join("\n")).digest("hex");
 const incident=await req.prisma.incident.upsert({where:{projectId_fingerprint:{projectId:cred.projectId,fingerprint}},create:{projectId:cred.projectId,fingerprint,title:msg.slice(0,250),latestStack:stack,environment:p.data.environment},update:{lastSeenAt:new Date(),eventCount:{increment:1},latestStack:stack,environment:p.data.environment}});
 await req.prisma.errorEvent.create({data:{incidentId:incident.id,message:msg,stack,occurredAt:p.data.occurredAt?new Date(p.data.occurredAt):new Date(),metadata:{version:p.data.version,deploymentId:p.data.deploymentId}}});
 res.status(202).json({accepted:true,incidentId:incident.id});
}catch(e){next(e)}});
router.use(authenticate);
router.post("/projects",async(req,res,next)=>{try{
 const p=z.object({name:z.string().trim().min(1).max(100),framework:z.string().max(100).optional()}).safeParse(req.body);
 if(!p.success)return res.status(400).json({error:"Invalid project details."});
 const project=await req.prisma.project.create({data:{ownerId:req.auth.sub,name:p.data.name,framework:p.data.framework}});
 const ingestionKey="sd_"+makeSecret();
 await req.prisma.monitoringKey.create({data:{projectId:project.id,keyHash:sha256(ingestionKey),keyHint:ingestionKey.slice(-6)}});
 await req.prisma.auditLog.create({data:{userId:req.auth.sub,action:"PROJECT_CREATED",resourceType:"Project",resourceId:project.id}});
 res.status(201).json({project,ingestionKey});
}catch(e){next(e)}});
router.get("/projects",async(req,res,next)=>{try{res.json({projects:await req.prisma.project.findMany({where:{ownerId:req.auth.sub},include:{_count:{select:{incidents:true}}},orderBy:{createdAt:"desc"}})})}catch(e){next(e)}});
router.get("/incidents",async(req,res,next)=>{try{const projects=await req.prisma.project.findMany({where:{ownerId:req.auth.sub},select:{id:true}});res.json({incidents:await req.prisma.incident.findMany({where:{projectId:{in:projects.map(x=>x.id)}},include:{project:{select:{name:true}},_count:{select:{events:true}}},orderBy:{lastSeenAt:"desc"},take:100})})}catch(e){next(e)}});
router.post("/projects/:id/rotate-key",async(req,res,next)=>{try{
 const project=await req.prisma.project.findFirst({where:{id:req.params.id,ownerId:req.auth.sub}});
 if(!project)return res.status(404).json({error:"Project not found."});
 const ingestionKey="sd_"+makeSecret();
 await req.prisma.$transaction([req.prisma.monitoringKey.updateMany({where:{projectId:project.id,revokedAt:null},data:{revokedAt:new Date()}}),req.prisma.monitoringKey.create({data:{projectId:project.id,keyHash:sha256(ingestionKey),keyHint:ingestionKey.slice(-6)}})]);
 res.json({ingestionKey});
}catch(e){next(e)}});
router.patch("/incidents/:id",async(req,res,next)=>{try{
 const status=z.enum(["OPEN","INVESTIGATING","RESOLVED","IGNORED"]).safeParse(req.body?.status);
 if(!status.success)return res.status(400).json({error:"Invalid incident status."});
 const incident=await req.prisma.incident.findFirst({where:{id:req.params.id,project:{ownerId:req.auth.sub}}});
 if(!incident)return res.status(404).json({error:"Incident not found."});
 res.json({incident:await req.prisma.incident.update({where:{id:incident.id},data:{status:status.data}})});
}catch(e){next(e)}});
export default router;