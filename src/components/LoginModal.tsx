// src/components/LoginModal.tsx
import React, { useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (user: { username: string; isVerified: boolean }) => void;
}

type Mode = "login" | "register";

type FieldErrors = {
    username?: string;
    email?: string;
    password?: string;
    general?: string;
};

export const LoginModal: React.FC<LoginModalProps> = ({
    isOpen,
    onClose,
    onLoginSuccess,
}) => {
    const [mode, setMode] = useState<Mode>("login");

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [touched, setTouched] = useState({
        username: false,
        email: false,
        password: false,
    });

    const [loading, setLoading] = useState(false);
    const [generalError, setGeneralError] = useState<string | null>(null);

    const validate = (): FieldErrors => {
        const errors: FieldErrors = {};

        // username solo obligatorio en REGISTER
        if (mode === "register") {
            if (!username.trim()) errors.username = "El nombre de usuario es obligatorio.";
            else if (username.trim().length < 3) errors.username = "Mínimo 3 caracteres.";
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) errors.email = "El email es obligatorio.";
        else if (!emailRegex.test(email.trim())) errors.email = "Formato de email no válido.";

        if (!password) errors.password = "La contraseña es obligatoria.";
        else {
            if (password.length < 8) errors.password = "Mínimo 8 caracteres.";
            else if (!/[A-Z]/.test(password)) errors.password = "Debe incluir al menos una mayúscula.";
            else if (!/[0-9]/.test(password)) errors.password = "Debe incluir al menos un número.";
        }

        return errors;
    };

    const errors = useMemo(() => validate(), [mode, username, email, password]);
    const isFormValid = Object.keys(errors).length === 0;

    const handleBlur = (field: "username" | "email" | "password") => {
        setTouched((prev) => ({ ...prev, [field]: true }));
    };

    const mapSupabaseError = (msg?: string) => {
        if (!msg) return "Error desconocido.";
        if (msg.toLowerCase().includes("invalid login credentials")) return "Email o contraseña incorrectos.";
        if (msg.toLowerCase().includes("user already registered")) return "Ese email ya está registrado. Prueba a iniciar sesión.";
        if (msg.toLowerCase().includes("email not confirmed")) return "Tu email no está confirmado. Confírmalo o desactiva confirmación para pruebas.";
        return msg;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setTouched({ username: true, email: true, password: true });
        setGeneralError(null);

        if (!isFormValid) return;

        try {
            setLoading(true);

            if (mode === "register") {
                const { error } = await supabase.auth.signUp({
                    email: email.trim(),
                    password,
                    options: {
                        data: {
                            username: username.trim(),
                        },
                    },
                });
                if (error) throw error;

                // Si confirm email está OFF, se crea sesión directamente.
                // Si está ON, puede que necesites confirmar y luego hacer login.
                const { data: userData } = await supabase.auth.getUser();

                onLoginSuccess({
                    username: (userData.user?.user_metadata?.username as string) || username.trim() || email.trim(),
                    isVerified: true,
                });

                onClose();
                return;
            }

            // LOGIN
            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });
            if (error) throw error;

            const { data: userData } = await supabase.auth.getUser();

            onLoginSuccess({
                username: (userData.user?.user_metadata?.username as string) || email.trim(),
                isVerified: true,
            });

            onClose();
        } catch (err: any) {
            setGeneralError(mapSupabaseError(err?.message));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="bg-zinc-900 text-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute right-3 top-3 text-gray-400 hover:text-white text-xl"
                    aria-label="Cerrar"
                >
                    ×
                </button>

                <h2 className="text-xl font-semibold mb-2 text-center">
                    {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
                </h2>

                <p className="text-xs text-gray-400 mb-4 text-center">
                    {mode === "login"
                        ? "Entra con tu email y contraseña."
                        : "Crea tu usuario con email y contraseña para guardar eventos."}
                </p>

                {generalError && (
                    <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                        {generalError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* USERNAME (solo register) */}
                    {mode === "register" && (
                        <div>
                            <label className="block text-xs mb-1" htmlFor="username">
                                Nombre de usuario
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onBlur={() => handleBlur("username")}
                                className="w-full rounded-md bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                                placeholder="Ej: julen_21"
                            />
                            {touched.username && errors.username && (
                                <p className="mt-1 text-xs text-red-400">{errors.username}</p>
                            )}
                        </div>
                    )}

                    {/* EMAIL */}
                    <div>
                        <label className="block text-xs mb-1" htmlFor="email">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onBlur={() => handleBlur("email")}
                            className="w-full rounded-md bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                            placeholder="tucorreo@example.com"
                        />
                        {touched.email && errors.email && (
                            <p className="mt-1 text-xs text-red-400">{errors.email}</p>
                        )}
                    </div>

                    {/* PASSWORD */}
                    <div>
                        <label className="block text-xs mb-1" htmlFor="password">
                            Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onBlur={() => handleBlur("password")}
                            className="w-full rounded-md bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                            placeholder="Mínimo 8 caracteres"
                        />
                        {touched.password && errors.password && (
                            <p className="mt-1 text-xs text-red-400">{errors.password}</p>
                        )}
                        <p className="mt-1 text-[10px] text-gray-500">
                            Debe tener al menos 8 caracteres, una mayúscula y un número.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={!isFormValid || loading}
                        className={`w-full mt-2 py-2 rounded-md text-sm font-semibold transition
              ${!isFormValid || loading
                                ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                                : "bg-white text-black hover:bg-zinc-100"
                            }`}
                    >
                        {loading ? "Cargando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
                    </button>

                    <div className="text-center text-xs text-gray-400 pt-2">
                        {mode === "login" ? (
                            <>
                                ¿No tienes cuenta?{" "}
                                <button
                                    type="button"
                                    className="text-white hover:underline"
                                    onClick={() => {
                                        setMode("register");
                                        setGeneralError(null);
                                        setTouched({ username: false, email: false, password: false });
                                    }}
                                >
                                    Crear cuenta
                                </button>
                            </>
                        ) : (
                            <>
                                ¿Ya tienes cuenta?{" "}
                                <button
                                    type="button"
                                    className="text-white hover:underline"
                                    onClick={() => {
                                        setMode("login");
                                        setGeneralError(null);
                                        setTouched({ username: false, email: false, password: false });
                                    }}
                                >
                                    Iniciar sesión
                                </button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};
