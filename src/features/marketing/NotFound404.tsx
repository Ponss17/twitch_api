import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import { appPath } from '@/core/config/paths';
import { landingBtnPrimary, landingBtnSecondary } from './landingContent';

export function NotFound404() {
    return (
        <section className="relative flex min-h-[calc(100vh-220px)] flex-1 items-center justify-center overflow-hidden px-6 py-16 text-center">
            <div
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                    backgroundImage:
                        'linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)',
                    backgroundSize: '72px 72px',
                    backgroundPosition: 'center top',
                    maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 25%, transparent 72%)',
                    WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 25%, transparent 72%)'
                }}
                aria-hidden
            />
            
            <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-6"
                >
                    <div className="text-[8rem] leading-none font-semibold tracking-tight text-text-main md:text-[10rem]">
                        404
                    </div>
                </motion.div>

                <motion.span 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mb-6 inline-flex items-center rounded-lg border border-border-subtle bg-bg-secondary px-3 py-1 text-[0.78rem] font-medium text-text-muted uppercase tracking-widest"
                >
                    Error 404
                </motion.span>
                
                <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-3xl font-semibold tracking-tight text-text-main sm:text-4xl md:text-5xl"
                >
                    Comando no reconocido.
                </motion.h1>
                
                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mt-5 max-w-[34rem] mx-auto text-base leading-relaxed text-text-muted md:text-lg"
                >
                    La página que intentas visitar no existe en nuestra API o la URL es incorrecta. Vuelve al panel para seguir configurando tu stream.
                </motion.p>
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mt-8 flex flex-wrap items-center justify-center gap-3"
                >
                    <button 
                        type="button"
                        onClick={() => window.history.back()}
                        className={landingBtnSecondary}
                    >
                        <ArrowLeft className="h-4 w-4" /> Volver atrás
                    </button>
                    <a
                        href={appPath('/')}
                        className={landingBtnPrimary}
                    >
                        Ir al Inicio <Home className="h-4 w-4" />
                    </a>
                </motion.div>
            </div>
        </section>
    );
}
