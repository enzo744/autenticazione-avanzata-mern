import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("token", token, {
    httpOnly: true, // cookie non leggibile da javascript
    secure: process.env.NODE_ENV === "production",  // se è in produzione, imposta il cookie come sicuro
    sameSite: "strict", // imposta il cookie come sicuro
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 settimana
  });

  return token;

};
