import { Router } from "express";
import * as z from "zod";
import sendOtp from "../services/sendOtp.js";
import { client } from "../server.js";
import prisma from "../services/prisma.js";
import jwt from "jsonwebtoken";
import {
  authenticateManager,
} from "../middleware/auth.js";
import type {
  AuthRequest,
} from "../middleware/auth.js";
export const router = Router();

const steponeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),

  email: z
    .string()
    .email("Invalid email address")
    .transform((v) => v.toLowerCase().trim()),
});

const otpSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .transform((v) => v.toLowerCase().trim()),

  otp: z.string().regex(/^\d{6}$/, {
    message: "OTP must be exactly 6 digits",
  }),
});

const managerProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),

  gst: z
    .string()
    .trim()
    .toUpperCase()
    .length(15, "GST number must be 15 characters")
    .regex(/^[0-9A-Z]{15}$/, "Invalid GST number"),

  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Invalid Indian phone number"),

  bankIfsc: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[A-Z]{4}0[A-Z0-9]{6}$/,
      "Invalid IFSC code"
    ),

  accountNumber: z
    .string()
    .trim()
    .min(9, "Invalid account number")
    .max(18, "Invalid account number")
    .regex(
      /^\d+$/,
      "Account number must contain only digits"
    ),
});


router.post("/signup", async (req, res) => {
  try {
    const result = steponeSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Please send correct data",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { name, email } = result.data;



    await sendOtp(email, name);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Signup error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});


router.post("/verify", async (req, res) => {
  try {
    const result = otpSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Please send OTP in a valid format",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { otp, email } = result.data;


    const data = await client.get(`signup:${email}`);

    if (!data) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or not found",
      });
    }

    const {
      otp: storedOtp,
      name,
    } = JSON.parse(data);


    if (otp !== storedOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }


    const existingManager = await prisma.manager.findUnique({
      where: {
        email,
      },
    });

    if (existingManager) {
      await client.del(`signup:${email}`);

      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }



    await client.del(`signup:${email}`);


    const manager = await prisma.manager.create({
      data: {
        email,
        name,
        status: "PENDING",
      },

      select: {
        id: true,
        email: true,
        name: true,
        status: true,
      },
    });

	const token = jwt.sign(
  {
    id: manager.id,
    email: manager.email,
  },
  process.env.JWT_SECRET!,
  {
    expiresIn: "7d",
  }
);

    return res.status(201).json({
  success: true,
  message: "Email registered successfully",
  data: {
    manager,
    token,
  },
});
  } catch (error) {
    console.error("OTP verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});



router.post(
  "/manager/profile",
  authenticateManager,
  async (req: AuthRequest, res) => {
    try {
      const result = managerProfileSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid request data",
          errors: result.error.flatten().fieldErrors,
        });
      }

      const {
        name,
        gst,
        phone,
        bankIfsc,
        accountNumber,
      } = result.data;

      const managerId = req.user!.id;

      const manager = await prisma.manager.findUnique({
        where: {
          id: managerId,
        },
      });

      if (!manager) {
        return res.status(404).json({
          success: false,
          message: "Manager not found",
        });
      }

      if (
        manager.status !== "PENDING" &&
        manager.status !== "PROFILE_INCOMPLETE" &&
        manager.status !== "REJECTED"
      ) {
        return res.status(400).json({
          success: false,
          message: "Profile cannot be edited at this stage",
        });
      }

      const updatedManager = await prisma.manager.update({
        where: {
          id: managerId,
        },

        data: {
          name,
          gst,
          phone,
          bankIfsc,
          accountNumber,
          status: "UNDER_REVIEW",
        },

        select: {
          id: true,
          name: true,
          email: true,
          gst: true,
          phone: true,
          bankIfsc: true,
          accountNumber: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Profile submitted for review",
        data: updatedManager,
      });
    } catch (error) {
      console.error("Manager profile update error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);