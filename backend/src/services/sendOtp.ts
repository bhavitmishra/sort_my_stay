import { Resend } from 'resend';
import {client} from "../server.js"
const key = process.env.RESEND_API_KEY;
const resend = new Resend(key);

export default async function sendOtp(email : any , name : any) {

	        const otp = Math.floor(100000 +  Math.random()*900000).toString();
		const {data , error} = await resend.emails.send({
		from : 'Bhavit <noreply@bhavit.xyz>' ,
		to : `${email}`,
		subject : `Otp for onboarding`,
		html : `<p>Your otp is : ${otp}</p>`
	})

	if (error) {
  console.error("Error sending email:", error);
  process.exit(1);
}

console.log("Email sent successfully!");
console.log("Email ID:", data?.id);
	await client.set(
  `signup:${email}`,
  JSON.stringify({
    otp,
    name,
  }),
  {
    EX: 300,
  }
);
}

