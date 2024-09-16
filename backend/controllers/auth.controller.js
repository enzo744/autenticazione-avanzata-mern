import bcryptjs from "bcryptjs";
import crypto from "crypto";

import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendResetSuccessEmail,
} from "../mailtrap/emails.js";
import { User } from "../models/user.model.js";

export const signup = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    if (!email || !password || !name) {
      throw new Error("All fields are required");
    }
    const userAlreadyExists = await User.findOne({ email });
    if (userAlreadyExists) {
      // se esiste già
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const user = new User({
      email,
      password: hashedPassword,
      name,
      verificationToken,
      verificationTokenExpiresAt: Date.now() + 1000 * 60 * 60 * 24, // verifica per 1 giorno - 24 ore
    });

    await user.save(); // salva nel db

    // jwt
    generateTokenAndSetCookie(res, user._id); // restituisce il token

    await sendVerificationEmail(user.email, verificationToken); // invia email di verifica

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        ...user._doc, // restituisce tutti i campi
        password: undefined, // non restituire la password
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  const { code } = req.body;
  try {
    const user = await User.findOne({
      verificationToken: code,
      verificationTokenExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid or expired verification code",
        });
    }

    user.isVerified = true; // verifica l'utente
    user.verificationToken = undefined; // elimina il token
    user.verificationTokenExpiresAt = undefined; // elimina l'orario di scadenza
    await user.save(); // salva nel db

    await sendWelcomeEmail(user.email, user.name); // invia email di benvenuto

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      user: {
        ...user._doc, // restituisce tutti i campi
        password: undefined, // non restituire la password
      },
    });
  } catch (error) {
    console.log("error, in verifyEmail: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const forgotPassword = async (req, res) => { 
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }
    // genera reset token
    const resetToken = crypto.randomBytes(20).toString("hex"); // genero un token random
    const resetTokenExpiresAt = Date.now() + 1000 * 60 * 60 * 1; // 1 ora

    user.resetPasswordToken = resetToken; // salva il token
    user.resetPasswordExpiresAt = resetTokenExpiresAt; // salva l'orario di scadenza

    await user.save(); // salva nel db

    // invia email di reset
    await sendPasswordResetEmail(
      user.email,
      `${process.env.CLIENT_URL}/reset-password/${resetToken}`
    );
    res
      .status(200)
      .json({
        success: true,
        message: "Email di reimpostazione password inviata alla tua email",
      });
  } catch (error) {
    console.log("Error in forgotPassword: ", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => { 
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiresAt: { $gt: Date.now() },
    });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token" });
    }
    // aggiorna la password
    const hashedPassword = await bcryptjs.hash(password, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined; // elimina il token
    user.resetPasswordExpiresAt = undefined; // elimina l'orario di scadenza
    await user.save(); // salva nel db

    await sendResetSuccessEmail(user.email); // invia email di successo
    res
      .status(200)
      .json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.log("error, in resetPassword: ", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const checkAuth = async (req, res) => { // controlla se l'utente è autenticato
  try {
    const user = await User.findById(req.userId).select("-password"); // recupero l'utente dall'id e non mostro la password
    if (!user) { // se l'utente non è autenticato, restituisco un errore
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }
    res.status(200).json({ 
      success: true, user});
  } catch (error) {
    console.log("Error in checkAuth: ", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
    }
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
    }
    generateTokenAndSetCookie(res, user._id); // restituisce il token

    user.lastLogin = Date.now(); // aggiorna l'ultimo login
    await user.save(); // salva nel db
    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: {
        ...user._doc, // restituisce tutti i campi
        password: undefined, // non restituire la password
      },
    });
  } catch (error) {
    console.log("error, in login: ", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ success: true, message: "Logged out successfully" });
};
