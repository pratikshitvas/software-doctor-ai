import {Router} from "express";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import nodemailer from "nodemailer";
import {z} from "zod";
import {sha256} from "./security.js";
const router=Router();
const registration=z.object({email:z.string().email().max(254),password:z.string().min(12).max(128),name:z.string().trim().min(1).max(100).optional()});
const loginInput=z.object({email:z.string().email(),password:z.string().min(1).max(128)});
const access=(u)=>{if(!process.env.JWT_ACCESS_SECRET)throw Error("JWT_ACCESS_SECRET is required");return jwt.sign({sub:u.id,email:u.email,admin:u.isPlatformAdmin},{},process.env.JWT_ACCESS_SECRET,{expiresIn:"15m",issuer:"software-doctor-ai"});};
async function session(prisma,user,familyId=crypto.randomUUID()){
 const refresh=crypto.randomBytes(48).toString("base64url");
 await prisma.refreshToken.create({data:{userId:user.id,tokenHash:sha256(refresh),familyId,expiresAt:new Date(Date.now()+30*86400000)}});
 return {accessToken:access(user),refreshToken:refresh,user:{id:user.id,email:user.email,name:user.name}};
}
async function sendVerify(user,token){
 const link=`${process.env.WEB_PUBLIC_URL||"http://localhost:5173"}/verify?token=${token}`;
 if(!process.env.SMTP_HOST){if(process.env.NODE_ENV==="development")console.info("Email verification link:",link);return;}
 const mailer=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:process.env.SMTP_SECURE==="true",auth:process.env.SMTP_USER?{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD}:undefined});
 await mailer.sendMail({from:process.env.EMAIL_FROM,to:user.email,subject:"Verify your Software Doctor AI account",text:`Open this link to verify: ${link}`});
}
router.post("/register",async(req,res,next)=>{try{
 const p=registration.safeParse(req.body);if(!p.success)return res.status(400).json({error:"Invalid registration details.",details:p.error.flatten()});
 const email=p.data.email.toLowerCase();if(await req.prisma.user.findUnique({where:{email}}))return res.status(409).json({error:"Account already exists."});
 const user=await req.prisma.user.create({data:{email,name:p.data.name,passwordHash:await argon2.hash(p.data.password,{type:argon2.argon2id})}});
 const raw=crypto.randomBytes(32).toString("base64url");
 await req.prisma.verificationToken.create({data:{userId:user.id,purpose:"EMAIL_VERIFY",tokenHash:sha256(raw),expiresAt:new Date(Date.now()+86400000)}});
 await sendVerify(user,raw);
 res.status(201).json({message:"Account created. Verify your email before signing in.",verificationEmailSent:Boolean(process.env.SMTP_HOST)});
}catch(e){next(e)}});
router.post("/verify-email",async(req,res,next)=>{try{
 const t=z.string().min(20).safeParse(req.body?.token);if(!t.success)return res.status(400).json({error:"Verification token required."});
 const row=await req.prisma.verificationToken.findUnique({where:{tokenHash:sha256(t.data)},include:{user:true}});
 if(!row||row.purpose!=="EMAIL_VERIFY"||row.usedAt||row.expiresAt<new Date())return res.status(400).json({error:"Verification token invalid or expired."});
 await req.prisma.$transaction(async tx=>{
  await tx.verificationToken.update({where:{id:row.id},data:{usedAt:new Date()}});
  await tx.user.update({where:{id:row.userId},data:{emailVerifiedAt:new Date()}});
  await tx.creditLedger.create({data:{userId:row.userId,kind:"GRANT",amount:Number(process.env.FREE_INVESTIGATIONS||2),idempotencyKey:"trial-grant-v1"}});
 });
 res.json({message:"Email verified.",...await session(req.prisma,row.user)});
}catch(e){next(e)}});
router.post("/login",async(req,res,next)=>{try{
 const p=loginInput.safeParse(req.body);if(!p.success)return res.status(400).json({error:"Invalid credentials."});
 const user=await req.prisma.user.findUnique({where:{email:p.data.email.toLowerCase()}});
 if(!user||!await argon2.verify(user.passwordHash,p.data.password))return res.status(401).json({error:"Email or password is incorrect."});
 if(!user.emailVerifiedAt)return res.status(403).json({error:"Verify your email before signing in."});
 res.json(await session(req.prisma,user));
}catch(e){next(e)}});
router.post("/refresh",async(req,res,next)=>{try{
 const p=z.string().min(30).safeParse(req.body?.refreshToken);if(!p.success)return res.status(400).json({error:"Refresh token required."});
 const old=await req.prisma.refreshToken.findUnique({where:{tokenHash:sha256(p.data)},include:{user:true}});
 if(!old||old.expiresAt<new Date()||old.revokedAt){if(old?.revokedAt)await req.prisma.refreshToken.updateMany({where:{userId:old.userId,familyId:old.familyId},data:{revokedAt:new Date()}});return res.status(401).json({error:"Refresh token invalid or expired."});}
 const next=crypto.randomBytes(48).toString("base64url");
 await req.prisma.$transaction([req.prisma.refreshToken.update({where:{id:old.id},data:{revokedAt:new Date()}}),req.prisma.refreshToken.create({data:{userId:old.userId,tokenHash:sha256(next),familyId:old.familyId,expiresAt:new Date(Date.now()+30*86400000)}})]);
 res.json({accessToken:access(old.user),refreshToken:next,user:{id:old.user.id,email:old.user.email,name:old.user.name}});
}catch(e){next(e)}});
router.post("/logout",async(req,res,next)=>{try{const t=z.string().min(30).safeParse(req.body?.refreshToken);if(t.success)await req.prisma.refreshToken.updateMany({where:{tokenHash:sha256(t.data),revokedAt:null},data:{revokedAt:new Date()}});res.json({message:"Signed out."})}catch(e){next(e)}});
router.delete("/account",async(req,res,next)=>{try{
 const id=req.auth.sub;await req.prisma.$transaction(async tx=>{
  await tx.auditLog.create({data:{userId:id,action:"ACCOUNT_DELETED",resourceType:"User",resourceId:id}});
  await tx.user.delete({where:{id}});
 });
 res.status(204).end();
}catch(e){next(e)}});
export function authenticate(req,res,next){
 const token=req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
 if(!token||!process.env.JWT_ACCESS_SECRET)return res.status(401).json({error:"Authentication required."});
 try{req.auth=jwt.verify(token,process.env.JWT_ACCESS_SECRET,{issuer:"software-doctor-ai"});next()}catch{return res.status(401).json({error:"Session expired. Sign in again."})}
}
export default router;