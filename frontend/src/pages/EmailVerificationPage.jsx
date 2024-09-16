import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

const EmailVerificationPage = () => {
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const inputRefs = useRef([]);
    const navigate = useNavigate();

    const { verifyEmail, error, isLoading } = useAuthStore();

    const handleChange = (index, value) => {
        const newCode = [...code];   // Crea un nuovo array di codici
        // Handle pasted content
        // Gestisce il contenuto incollato
        if (value.length > 1) {
            const pastCode = value.slice(0, 6).split(""); // Suddividi il valore in un array di caratteri
            for (let i = 0; i < 6; i++) {   // Cicla i caratteri
                newCode[i] = pastCode[i] || ""; // Se il carattere non è vuoto, lo inserisce nell'array
            }
            setCode(newCode);   // Aggiorna l'array di codici

            // Focus on the last non-empty input or the first empty one 
            // Concentrati sull'ultimo input non vuoto o sul primo vuoto
            const lastFilledIndex = newCode.findLastIndex((digit) => digit !== "");
            const focusIndex = lastFilledIndex < 5 ? lastFilledIndex + 1 : 5;   // Se l'ultimo input non è vuoto, vai al successivo, altrimenti vai all'ultimo vuoto
            inputRefs.current[focusIndex].focus();   // Focus sull'ultimo input non vuoto o sul primo vuoto
        } else {
            newCode[index] = value;   // Se il valore non è vuoto, lo inserisce nell'array
            setCode(newCode);   // Aggiorna l'array di codici

            // Move focus to the next input field if value is entered
            // Sposta il focus sul campo di input successivo se viene inserito un valore
            if (value && index < 5) {
                inputRefs.current[index + 1].focus();
            }
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {   
            inputRefs.current[index - 1].focus();   // Sposta il focus all'input precedente se è stato premuto il tasto Backspace e l'input non è vuoto
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        const verificationCode = code.join(""); // concatena tutti i codici
        try {
            await verifyEmail(verificationCode);
            navigate("/");
            toast.success("Email verificata con successo");
        } catch (error) {
            console.log(error);
            
        }
    }; 

    // Auto submit when all fields are filled
    // Invio automatico quando tutti i campi sono compilati (incollati)
    useEffect(() => {
        if (code.every(digit => digit !== "")) {
            handleSubmit(new Event("submit"));
        }
    }, [code]);


  return (
    <div className="max-w-md w-full bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden">
    <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-xl rounded-2xl shadow-2xl p-8 w-full max-w-md"
    >
        <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-green-400 to-emerald-500 text-transparent bg-clip-text">
            Verifica Email
            </h2>
            <p className="text-center text-gray-300 mb-6">Inserisci 6 caratteri che hai ricevuto via email</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex justify-between">
                    {code.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => inputRefs.current[index] = el}
                            type="text"
                            maxLength={6}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className="w-12 h-12 text-center text-2xl font-bold bg-gray-700 text-white border-2 border-gray-600 rounded-lg focus:border-green-500 focus:outline-none"
                        />
                    ))}
                </div>
                    {error && <p className="font-semibold text-red-500 mt-2">{error}</p>}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={isLoading || code.some((digit) => !digit)}
                    className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold shadow-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50"
                >
                    {isLoading ? "Verifica in corso..." : "Verifica l'email"}
                </motion.button>
            </form>
    </motion.div>
      
    </div>
  )
}

export default EmailVerificationPage
