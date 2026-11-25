import {Router} from "express";
import {authenticate} from "./auth.js";
const router=Router();
router.use(authenticate);
router.get("/",async(req,res,next)=>{try{
 const [entries,pending]=await Promise.all([
  req.prisma.creditLedger.aggregate({where:{userId:req.auth.sub},_sum:{amount:true}}),
  req.prisma.investigation.count({where:{userId:req.auth.sub,status:"RUNNING"}})
 ]);
 res.json({available:Math.max(0,(entries._sum.amount||0)-pending),reserved:pending,consumed:await req.prisma.creditLedger.aggregate({where:{userId:req.auth.sub,kind:"CONSUME"},_sum:{amount:true}}).then(x=>Math.abs(x._sum.amount||0))});
}catch(e){next(e)}});
router.get("/investigations",async(req,res,next)=>{try{res.json({investigations:await req.prisma.investigation.findMany({where:{userId:req.auth.sub},orderBy:{startedAt:"desc"},take:50,select:{id:true,status:true,inputSummary:true,startedAt:true,completedAt:true,failureReason:true,report:true}})})}catch(e){next(e)}});
export default router;