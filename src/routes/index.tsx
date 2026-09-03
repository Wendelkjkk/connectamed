import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import * as React from "react";
import { CheckCircle2, FileText, ShieldCheck, ArrowRight, Zap, Lock, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MotionButton = motion.create(Button);

import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};

const transition = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };

const stagger = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const bentoItemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition
  }
};

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground dark selection:bg-primary/30">
      <div className="hidden">Quero migrar meu projeto para usar exclusivamente o Supabase como backend. Remova toda dependência do Lovable Cloud, mantenha somente o frontend no Lovable e preserve o fluxo atual de pagamento com PushinPay.</div>
      {/* Background Orbs Removidos */}

      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between h-20 px-6">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold tracking-tighter"
          >
            Conecta<span className="text-primary">Med</span>
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-4"
          >
            {/* O botão Entrar foi removido conforme solicitação anterior */}
          </motion.div>
        </div>
      </nav>

      <main className="pt-32 pb-24 px-6 overflow-x-hidden">
        {/* Hero Section */}
        <section className="container mx-auto max-w-5xl text-center mb-32">
          <motion.div 
            {...fadeInUp}
            transition={transition}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-muted-foreground mb-8"
          >
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            Disponível 24/7 para sua necessidade
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] text-balance"
          >
            Excelência Médica <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/50">
              Ao Seu Alcance
            </span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Obtenha seu atestado de forma simples, clara e totalmente digital. 
            Uma experiência premium para documentos médicos essenciais.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row justify-center gap-6"
          >
            <Link to="/solicitar">
              <MotionButton size="lg" className="group w-full sm:w-auto" {...fadeInUp} transition={transition}>
                Solicitar Atestado
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </MotionButton>
            </Link>
          </motion.div>
        </section>

        {/* Bento Grid Features */}
        <section className="container mx-auto max-w-6xl mb-32">
          <motion.div 
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6"
          >
            <motion.div 
              variants={bentoItemVariants}
              className="md:col-span-2 md:row-span-2 bento-item p-10 flex flex-col justify-end min-h-[400px]"
            >
              <div className="absolute top-10 right-10">
                <ShieldCheck className="w-16 h-16 text-primary opacity-20" />
              </div>
              <Lock className="w-8 h-8 text-primary mb-6" />
              <h3 className="text-3xl font-bold mb-4">Segurança Absoluta</h3>
              <p className="text-muted-foreground leading-relaxed">
                Nossos sistemas utilizam criptografia de ponta a ponta e verificação por blockchain 
                para garantir que cada documento seja 100% autêntico e inviolável.
              </p>
            </motion.div>

            <motion.div 
              variants={bentoItemVariants}
              className="md:col-span-2 bento-item group"
            >
              <Zap className="w-6 h-6 text-primary mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-2">Velocidade Instantânea</h3>
              <p className="text-sm text-muted-foreground">
                Receba sua análise em minutos. Processamento otimizado para sua urgência.
              </p>
            </motion.div>

            <motion.div 
              variants={bentoItemVariants}
              className="bento-item group"
            >
              <Globe className="w-6 h-6 text-primary mb-4 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold mb-1">Nacional</h4>
              <p className="text-xs text-muted-foreground">Válido em todo território.</p>
            </motion.div>

            <motion.div 
              variants={bentoItemVariants}
              className="bento-item group"
            >
              <FileText className="w-6 h-6 text-primary mb-4 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold mb-1">Digital</h4>
              <p className="text-xs text-muted-foreground">Formato PDF inteligente.</p>
            </motion.div>
          </motion.div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto max-w-3xl mb-32">
          <motion.h3 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-16"
          >
            Questões Comuns
          </motion.h3>
          <div className="grid gap-12">
            {[
              { q: "O atestado é válido em todo o Brasil?", a: "Sim, nossos atestados são emitidos por médicos registrados e seguem rigorosamente as normas do Conselho Federal de Medicina." },
              { q: "Como recebo meu atestado?", a: "Após a análise criteriosa, o documento digital é enviado instantaneamente para seu e-mail e WhatsApp através de canais criptografados." },
              { q: "Quanto tempo demora?", a: "Prezamos pelo seu tempo. O processo médio de análise e emissão leva entre 15 a 30 minutos em dias úteis." }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group"
              >
                <h4 className="text-lg font-bold mb-3 group-hover:text-primary transition-colors">{item.q}</h4>
                <p className="text-muted-foreground leading-relaxed">{item.a}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-20 px-6 bg-card/50 backdrop-blur-xl">
        <div className="container mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="text-left">
            <h2 className="text-2xl font-bold mb-4 tracking-tighter">ConectaMed</h2>
            <p className="text-muted-foreground text-sm max-w-xs">
              Líder em tecnologia para documentação médica digital, unindo segurança e eficiência.
            </p>
          </div>
          <div className="text-left md:text-right space-y-4">
            <p className="text-sm text-muted-foreground">© 2026 ConectaMed. Todos os direitos reservados.</p>
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest leading-relaxed">
              Serviço destinado a orientações e emissão de documentos médicos <br className="hidden md:block" />
              conforme legislação vigente e ética profissional.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
