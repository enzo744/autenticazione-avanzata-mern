import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    const token = req.cookies.token; // recupero il token dal cookie
    if (!token) {
        return res.status(401).json({ success: false, message: "Unauthorized - Token not found" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // verifico il token

        if (!decoded) return res.status(401).json({ success: false, message: "Unauthorized - Token not valid" });

        req.userId = decoded.userId; // aggiorno l'id utente nella richiesta
        next(); // passo alla prossima funzione (checkAuth) 
    } catch (error) {
        console.log("error, in verifyToken: ", error); 
        return res.status(401).json({ success: false, message: "Unauthorized - Token not valid" });
        // se il token non è valido, restituisco un errore
    }
};