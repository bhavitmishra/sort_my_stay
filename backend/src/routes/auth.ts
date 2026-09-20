import {Router} from "express";
import * as z from "zod";
import sendOtp from "../services/sendOtp.js"
import {client} from "../server.js"
export const router = Router();

const steponeSchema = z.object({
name : z.string(),
email : z.string().email().transform(v => v.toLowerCase().trim()),
})

const otpSchema = z.object({
email : z.string().email().transform(v => v.toLowerCase().trim()),
otp : z.string().regex(/^\d{6}$/, {
  message: "OTP must be exactly 6 digits",
})})

router.post("/signup" , async (req , res) => {
	const result = steponeSchema.safeParse(req.body);
	if(!result.success){
		return res.json({msg : "Please send correct data"})
	}

	const {name , email} = result.data;
	
	// we have the name and email which so now what we'll do is we'll send an otp to the mail and verify it

	await sendOtp(email);
	return res.json({msg : "Otp Sent"});	
})

router.post("/verify" , async(req , res)=>{
	const result = otpSchema.safeParse(req.body);

	if(!result.success){
		return res.json({msg : "Please send otp in a valid format"});
	}
	const {otp , email} = result.data;
	const sent = await client.get(`${email}`);
	if(otp != sent)
	{
		return res.json({msg : "INVALID OTP"})
	}
	await client.del(`${email}`);

	// add user in db and now step2 of signup now prisma 

	return res.json({msg : "verified"})

})
