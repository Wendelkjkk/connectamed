import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, User, Calendar, Mail, Phone, Clock, CreditCard, Stethoscope, MapPin, Search, Copy, CheckCircle2, Loader2, QrCode, FileSearch, AlertCircle, XCircle } from "lucide-react";
import * as React from "react";
import certificatePreviewAsset from "@/assets/final_5_page-0001.jpg.asset.json";
import { createPixPayment, getPaymentStatus } from "@/lib/payments.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

export const Route = createFileRoute("/solicitar")({
  component: SolicitarAtestado,
});

function SolicitarAtestado() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState(1);
  const totalSteps = 4;
  
  const [isPaying, setIsPaying] = React.useState(false);
  const [pixData, setPixData] = React.useState<{ id: string; pixCode: string; qrCode: string | null; amount: number } | null>(null);
  const [paymentStatus, setPaymentStatus] = React.useState<'pending' | 'paid' | 'failed' | 'expired'>('pending');
  const [timeLeft, setTimeLeft] = React.useState(360); // 6 minutes in seconds
  
  const callCreatePix = useServerFn(createPixPayment);
  const callGetStatus = useServerFn(getPaymentStatus);

  const [formData, setFormData] = React.useState({
    nome: "",
    nomeMae: "",
    cpf: "",
    dataNascimento: "",
    dataConsulta: "",
    horaConsulta: "",
    email: "",
    whatsapp: "",
    diasAtestado: "1",
    cid: "",
    cep: "",
    upa: "",
    bairro: "",
    cidade: "",
    estado: "",
    teleconsulta: false,
    confirmado: false
  });

  const [upas, setUpas] = React.useState<{ nome: string; endereco: string; distancia: number }[]>([]);
  const [loadingCep, setLoadingCep] = React.useState(false);

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 9);
  };

  const handleCepLookup = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        const city = data.localidade;
        const state = data.uf;
        const neighborhood = data.bairro;
        
        setFormData(prev => ({
          ...prev,
          bairro: neighborhood || "",
          cidade: city || "",
          estado: state || ""
        }));

        setUpas([
          { 
            nome: `UPA 24h - ${neighborhood || "Centro"}`, 
            endereco: `${data.logradouro || "Área Central"}, ${neighborhood || ""} - ${city}/${state}`,
            distancia: 0.8
          },
          { 
            nome: `Unidade de Saúde Central - ${city}`, 
            endereco: `Rua Principal, S/N - Centro - ${city}/${state}`,
            distancia: 1.5
          },
          { 
            nome: `Pronto Atendimento Municipal`, 
            endereco: `Avenida das Nações, 1000 - Distrito Industrial - ${city}/${state}`,
            distancia: 2.3
          }
        ].sort((a, b) => a.distancia - b.distancia));
      } else {
        alert("CEP não encontrado. Por favor, verifique o número digitado.");
        setUpas([]);
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      alert("Erro ao buscar unidades próximas. Tente novamente mais tarde.");
      setUpas([]);
    } finally {
      setLoadingCep(false);
    }
  };

  const isValidCPF = (cpf: string) => {
    cpf = cpf.replace(/[^\d]+/g, "");
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
    let add = 0;
    for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(9))) return false;
    add = 0;
    for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(10))) return false;
    return true;
  };

  const precos = {
    "1": "R$ 50,00",
    "2": "R$ 50,00",
    "3": "R$ 50,00",
    "4": "R$ 60,00",
    "5": "R$ 70,00",
    "6": "R$ 80,00",
    "7": "R$ 90,00",
    "8": "R$ 100,00",
    "9": "R$ 110,00",
    "10": "R$ 120,00",
    "11": "R$ 130,00",
    "12": "R$ 140,00",
    "13": "R$ 150,00",
    "14": "R$ 160,00"
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      if (!isValidCPF(formData.cpf)) {
        toast.error("CPF Inválido", { description: "Por favor, insira um CPF válido." });
        return;
      }
    }

    if (step < totalSteps) {
      setStep(prev => prev + 1);
      return;
    }

    // Processamento de Pagamento no Passo Final
    setIsPaying(true);
    try {
      const valorCentavos = Math.round(parseFloat(precos[formData.diasAtestado as keyof typeof precos].replace("R$ ", "").replace(",", ".")) * 100);
      
      const result = await callCreatePix({
        data: {
          productId: formData.diasAtestado,
          productName: `Atestado Médico - ${formData.diasAtestado} dias`,
          amount: valorCentavos,
          customerName: formData.nome,
          customerEmail: formData.email,
          customerCpf: formData.cpf,
          customerBirthDate: formData.dataNascimento,
          customerMotherName: formData.nomeMae,
          customerWhatsapp: formData.whatsapp,
          orderDetails: {
            dataConsulta: formData.dataConsulta,
            horaConsulta: formData.horaConsulta,
            cid: formData.cid,
            cep: formData.cep,
            upa: formData.upa,
            bairro: formData.bairro,
            cidade: formData.cidade,
            estado: formData.estado,
            teleconsulta: formData.teleconsulta
          }
        }
      });
      
      setPixData(result);
      setTimeLeft(360); // Reset timer when PIX is generated
    } catch (error) {
      console.error("Erro ao gerar PIX:", error);
      toast.error("Erro no Pagamento", { description: "Não foi possível gerar o código PIX. Tente novamente." });
    } finally {
      setIsPaying(false);
    }
  };

  // Polling para status do pagamento e cronômetro
  React.useEffect(() => {
    let interval: number;
    let timerInterval: number;
    
    if (pixData && paymentStatus === 'pending') {
      // Timer decrement
      timerInterval = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setPaymentStatus('expired');
            clearInterval(timerInterval);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      interval = window.setInterval(async () => {
        try {
          const statusResult = await callGetStatus({ data: { paymentId: pixData.id } });
          if (statusResult.status === 'paid') {
            setPaymentStatus('paid');
            clearInterval(interval);
            clearInterval(timerInterval);
            toast.success("Pagamento Confirmado!", { description: "Seu atestado está sendo gerado e será enviado para seu e-mail." });
          } else if (statusResult.status === 'failed') {
            setPaymentStatus('failed');
            clearInterval(interval);
            clearInterval(timerInterval);
            toast.error("Pagamento Falhou", { description: "Ocorreu um erro no processamento do seu pagamento." });
          } else if (statusResult.status === 'expired') {
            setPaymentStatus('expired');
            clearInterval(interval);
            clearInterval(timerInterval);
            toast.error("PIX Expirado", { description: "O tempo para pagamento expirou. Por favor, tente novamente." });
          }
        } catch (error) {
          console.error("Erro ao checar status:", error);
        }
      }, 5000); // Checa a cada 5 segundos
    }
    
    return () => {
      if (interval) clearInterval(interval);
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [pixData, paymentStatus, callGetStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyPixCode = () => {
    if (pixData?.pixCode) {
      navigator.clipboard.writeText(pixData.pixCode);
      toast.success("Copiado!", { description: "Código PIX copiado para a área de transferência." });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    } else {
      navigate({ to: "/" });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "cpf") formattedValue = formatCPF(value);
    if (name === "whatsapp") formattedValue = formatPhone(value);
    if (name === "cep") {
      formattedValue = formatCEP(value);
      if (formattedValue.length === 9) {
        handleCepLookup(formattedValue);
      }
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const progressValue = (step / totalSteps) * 100;

  const stepTitles = {
    1: "Dados Pessoais",
    2: "Informações da Consulta",
    3: "Local da Consulta (UPA)",
    4: "Prévia e Pagamento"
  };

  const stepDescriptions = {
    1: "Conte-nos quem você é para o documento.",
    2: "Quando e por qual motivo?",
    3: "Localize a UPA mais próxima de você.",
    4: "Revise seus dados e conclua o pedido."
  };

  return (
    <div className="min-h-screen bg-background text-foreground dark selection:bg-primary/30 py-20 px-6">
      {/* Background Orbs Removidos */}

      <div className="container mx-auto max-w-2xl">
        <Button 
          variant="ghost" 
          className="mb-8 group" 
          onClick={handleBack}
        >
          <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {step > 1 ? "Voltar Passo" : "Voltar para Home"}
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glass premium-shadow border-white/5 overflow-hidden">
            <div className="bg-primary/5 px-8 pt-8 pb-4 border-b border-white/5">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-primary">
                  {pixData ? "Pagamento PIX" : `Passo ${step} de ${totalSteps}`}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {pixData ? "Aguardando confirmação" : stepTitles[step as keyof typeof stepTitles]}
                </span>
              </div>
              <Progress value={pixData ? 100 : progressValue} className="h-1" />
            </div>

            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl font-bold tracking-tight mb-2">
                {pixData ? (
                  paymentStatus === 'paid' ? "Pagamento Confirmado!" : 
                  paymentStatus === 'failed' ? "Pagamento Falhou" :
                  paymentStatus === 'expired' ? "Código Expirado" :
                  "Finalize seu Pedido"
                ) : stepTitles[step as keyof typeof stepTitles]}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {pixData 
                  ? (paymentStatus === 'paid' 
                      ? "Seu pagamento foi recebido com sucesso." 
                      : paymentStatus === 'failed'
                      ? "Não foi possível processar seu pagamento."
                      : paymentStatus === 'expired'
                      ? "O tempo para realizar o PIX expirou."
                      : "Escaneie o QR Code ou cole o código para pagar via PIX.") 
                  : stepDescriptions[step as keyof typeof stepDescriptions]}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {pixData ? (
                <div className="space-y-8 py-4">
                  {paymentStatus === 'paid' ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center space-y-4 py-10"
                    >
                      <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                      </div>
                      <h3 className="text-xl font-bold text-center">Tudo Pronto!</h3>
                      <p className="text-muted-foreground text-center max-w-sm">
                        O atestado médico será enviado para: <strong>{formData.whatsapp}</strong> via WhatsApp.
                      </p>
                      <p className="text-muted-foreground text-xs text-center max-w-sm mt-2">
                        Se necessário, também enviamos uma cópia para o e-mail: <strong>{formData.email}</strong>.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 mt-6">
                        <Button 
                          onClick={() => navigate({ to: "/" })}
                          className="flex-1 bg-white/5 hover:bg-white/10 text-white border-white/10"
                        >
                          Voltar para o Início
                        </Button>
                        <Button 
                          asChild
                          className="flex-1 bg-primary hover:bg-primary/90"
                        >
                          <a 
                            href="https://wa.me/5582988642056?text=Ol%C3%A1%2C%20tenho%20duvida%20sobre%20meu%20atestado." 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            Suporte WhatsApp
                          </a>
                        </Button>
                      </div>
                    </motion.div>
                  ) : paymentStatus === 'failed' || paymentStatus === 'expired' ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center space-y-4 py-10"
                    >
                      <div className={`w-20 h-20 ${paymentStatus === 'failed' ? 'bg-red-500/20' : 'bg-orange-500/20'} rounded-full flex items-center justify-center mb-4`}>
                        {paymentStatus === 'failed' ? (
                          <XCircle className="w-12 h-12 text-red-500" />
                        ) : (
                          <AlertCircle className="w-12 h-12 text-orange-500" />
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-center">
                        {paymentStatus === 'failed' ? "Ops! Algo deu errado" : "O tempo expirou"}
                      </h3>
                      <p className="text-muted-foreground text-center max-w-sm">
                        {paymentStatus === 'failed' 
                          ? "Não conseguimos confirmar seu pagamento. Se você já pagou, entre em contato com nosso suporte."
                          : "O tempo para pagamento via PIX expirou. Por favor, inicie uma nova solicitação."}
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-4 mt-6 w-full max-w-sm">
                        <Button 
                          onClick={() => {
                            setPixData(null);
                            setPaymentStatus('pending');
                            setStep(4);
                          }}
                          className="flex-1 bg-white/5 hover:bg-white/10 text-white border-white/10"
                        >
                          {paymentStatus === 'failed' ? "Tentar Novamente" : "Novo Pedido"}
                        </Button>
                        <Button 
                          asChild
                          className="flex-1 bg-primary hover:bg-primary/90"
                        >
                          <a 
                            href="https://wa.me/5582988642056?text=Ol%C3%A1%2C%20tive%20problema%20com%20o%20pagamento%20do%20meu%20atestado." 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            Suporte WhatsApp
                          </a>
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center space-y-8">
                      <div className="bg-white p-4 rounded-2xl shadow-2xl premium-shadow flex items-center justify-center min-w-[224px] min-h-[224px]">
                        {pixData.qrCode ? (
                          <img 
                            src={pixData.qrCode.startsWith('data:') ? pixData.qrCode : `data:image/png;base64,${pixData.qrCode}`} 
                            alt="PIX QR Code" 
                            className="w-48 h-48 block"
                          />
                        ) : (
                          <div className="w-48 h-48 bg-muted flex flex-col items-center justify-center rounded-xl gap-2">
                            <QrCode className="w-12 h-12 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground font-medium px-2 text-center">QR Code não disponível. Use o código abaixo.</span>
                          </div>
                        )}
                      </div>

                      <div className="w-full space-y-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Valor a pagar:</span>
                          <span className="text-xl font-bold text-primary">
                            {(pixData.amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs uppercase tracking-widest text-muted-foreground">PIX Copia e Cola</Label>
                          <div className="relative">
                            <Input 
                              readOnly 
                              value={pixData.pixCode} 
                              className="bg-white/5 border-white/10 pr-12 text-xs font-mono truncate"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="absolute right-1 top-1/2 -translate-y-1/2 hover:bg-primary/20"
                              onClick={copyPixCode}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-col items-center justify-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10">
                          <div className="flex items-center gap-3">
                            <Loader2 className="w-4 h-4 text-primary animate-spin" />
                            <span className="text-sm font-medium animate-pulse">Aguardando pagamento...</span>
                          </div>
                          <div className="flex flex-col items-center mt-2 pt-2 border-t border-primary/10 w-full">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">O QR Code expira em:</span>
                            <span className="text-2xl font-mono font-bold text-primary tabular-nums">
                              {formatTime(timeLeft)}
                            </span>
                          </div>
                        </div>

                        <p className="text-[10px] text-center text-muted-foreground italic">
                          A confirmação é instantânea. Assim que o pagamento for detectado ou o tempo expirar, esta tela atualizará automaticamente.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="nome" className="flex items-center gap-2"><User className="w-4 h-4" /> Nome Completo</Label>
                          <Input 
                            id="nome" name="nome" value={formData.nome} placeholder="Seu nome" required 
                            className="bg-white/5 border-white/10" onChange={handleChange} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nomeMae" className="flex items-center gap-2"><User className="w-4 h-4" /> Nome da Mãe</Label>
                          <Input 
                            id="nomeMae" name="nomeMae" value={formData.nomeMae} placeholder="Nome completo da mãe" required 
                            className="bg-white/5 border-white/10" onChange={handleChange} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cpf" className="flex items-center gap-2"><CreditCard className="w-4 h-4" /> CPF</Label>
                          <Input 
                            id="cpf" name="cpf" value={formData.cpf} placeholder="000.000.000-00" required maxLength={14}
                            className="bg-white/5 border-white/10" onChange={handleChange} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dataNascimento" className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Nascimento</Label>
                          <Input 
                            id="dataNascimento" name="dataNascimento" type="date" value={formData.dataNascimento} required 
                            className="bg-white/5 border-white/10" onChange={handleChange} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="flex items-center gap-2"><Mail className="w-4 h-4" /> E-mail</Label>
                          <Input 
                            id="email" name="email" type="email" value={formData.email} placeholder="seu@email.com" required 
                            className="bg-white/5 border-white/10" onChange={handleChange} 
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="whatsapp" className="flex items-center gap-2"><Phone className="w-4 h-4" /> WhatsApp</Label>
                          <Input 
                            id="whatsapp" name="whatsapp" value={formData.whatsapp} placeholder="(00) 00000-0000" required maxLength={15}
                            className="bg-white/5 border-white/10" onChange={handleChange} 
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="dataConsulta" className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Data Consulta</Label>
                          <Input 
                            id="dataConsulta" name="dataConsulta" type="date" value={formData.dataConsulta} required 
                            className="bg-white/5 border-white/10" onChange={handleChange} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="horaConsulta" className="flex items-center gap-2"><Clock className="w-4 h-4" /> Hora Consulta</Label>
                          <Input 
                            id="horaConsulta" name="horaConsulta" type="time" value={formData.horaConsulta} required 
                            className="bg-white/5 border-white/10" onChange={handleChange} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="diasAtestado" className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Quantidade de Dias e Valor</Label>
                          <select
                            id="diasAtestado" name="diasAtestado" value={formData.diasAtestado} required
                            className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 appearance-none cursor-pointer hover:bg-white/10 transition-colors"
                            onChange={handleChange}
                          >
                            {Object.entries(precos).map(([dias, preco]) => (
                              <option key={dias} value={dias} className="bg-background text-foreground">
                                {dias} {parseInt(dias) === 1 ? 'Dia' : 'Dias'} - {preco}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cid" className="flex items-center gap-2"><Stethoscope className="w-4 h-4" /> Selecione o CID da Doença</Label>
                          <select
                            id="cid" name="cid" value={formData.cid} required
                            className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 appearance-none cursor-pointer hover:bg-white/10 transition-colors"
                            onChange={handleChange}
                          >
                            <option value="" disabled className="bg-background text-foreground">Selecione uma opção...</option>
                            {[
                              { id: "J11", label: "Gripe (J11)" },
                              { id: "B34.9", label: "Infecção Viral/Virose (B34.9)" },
                              { id: "A90", label: "Dengue (A90)" },
                              { id: "M54.5", label: "Lombalgia/Dor Lombar (M54.5)" },
                              { id: "U07.1", label: "COVID-19 (U07.1)" },
                              { id: "F41.1", label: "Ansiedade (F41.1)" },
                              { id: "J32", label: "Sinusite (J32)" },
                              { id: "R51", label: "Cefaleia/Dor de cabeça (R51)" },
                              { id: "J01", label: "Sinusite Aguda (J01)" },
                              { id: "J02", label: "Faringite Aguda (J02)" },
                              { id: "J06", label: "Infecção Vias Aéreas Superiores (J06)" },
                              { id: "J20", label: "Bronquite Aguda (J20)" },
                              { id: "K21", label: "Refluxo Gastroesofágico (K21)" },
                              { id: "M54.2", label: "Cervicalgia (M54.2)" },
                              { id: "N20", label: "Cálculo Renal (N20)" },
                              { id: "R50", label: "Febre (R50)" },
                              { id: "B35", label: "Dermatofitose/Micose (B35)" },
                              { id: "G43", label: "Enxaqueca (G43)" }
                            ].map((item) => (
                              <option key={item.id} value={item.label} className="bg-background text-foreground">
                                {item.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center space-x-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer md:col-span-2" onClick={() => setFormData(prev => ({ ...prev, teleconsulta: !prev.teleconsulta }))}>
                          <Checkbox 
                            id="teleconsulta" 
                            checked={formData.teleconsulta}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, teleconsulta: !!checked }))}
                          />
                          <div className="grid gap-1.5 leading-none">
                            <Label 
                              htmlFor="teleconsulta" 
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              Foi teleconsulta?
                            </Label>
                            <p className="text-[10px] text-muted-foreground">
                              Marque esta opção se o atendimento foi realizado via vídeo ou chamada.
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="cep" className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Digite seu CEP</Label>
                          <div className="relative">
                            <Input 
                              id="cep" name="cep" value={formData.cep} placeholder="00000-000" required maxLength={9}
                              className="bg-white/5 border-white/10 pr-10" onChange={handleChange} 
                            />
                            {loadingCep ? (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                            ) : (
                              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground italic">Buscaremos as UPAs disponíveis na sua região.</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="cidade" className="text-xs text-muted-foreground">Cidade</Label>
                              <Input 
                                id="cidade" name="cidade" value={formData.cidade} readOnly
                                className="bg-white/5 border-white/10 h-8 text-xs cursor-not-allowed" 
                                placeholder="Cidade"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="estado" className="text-xs text-muted-foreground">Estado</Label>
                              <Input 
                                id="estado" name="estado" value={formData.estado} readOnly
                                className="bg-white/5 border-white/10 h-8 text-xs cursor-not-allowed" 
                                placeholder="UF"
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="bairro" className="text-xs text-muted-foreground">Bairro</Label>
                              <Input 
                                id="bairro" name="bairro" value={formData.bairro} readOnly
                                className="bg-white/5 border-white/10 h-8 text-xs cursor-not-allowed" 
                                placeholder="Bairro"
                              />
                            </div>
                          </div>
                        </div>

                        {upas.length > 0 && (
                          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center justify-between">
                              <Label className="flex items-center gap-2 text-sm font-semibold">Unidades Encontradas</Label>
                              <span className="text-[10px] text-muted-foreground uppercase tracking-widest bg-white/5 px-2 py-1 rounded">Ordenado por distância</span>
                            </div>
                            <div className="grid gap-3">
                              {upas.map((upa, idx) => (
                                <motion.div 
                                  key={idx}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: idx * 0.1 }}
                                  onClick={() => setFormData(prev => ({ ...prev, upa: upa.nome }))}
                                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                                    formData.upa === upa.nome 
                                      ? "bg-primary/15 border-primary ring-1 ring-primary/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]" 
                                      : "bg-white/5 border-white/10 hover:border-primary/40 hover:bg-white/10"
                                  }`}
                                >
                                  <div className="flex justify-between items-start mb-1 relative z-10">
                                    <div className="flex flex-col">
                                      <span className="font-bold text-sm group-hover:text-primary transition-colors">{upa.nome}</span>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] flex items-center gap-1 text-primary bg-primary/10 px-1.5 py-0.5 rounded-full font-medium">
                                          <MapPin className="w-2.5 h-2.5" />
                                          {upa.distancia} km
                                        </span>
                                      </div>
                                    </div>
                                    {formData.upa === upa.nome && (
                                      <motion.div 
                                        layoutId="active-check"
                                        className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20"
                                      >
                                        <div className="w-2 h-2 rounded-full bg-white" />
                                      </motion.div>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-2 relative z-10 leading-relaxed">{upa.endereco}</p>
                                  
                                  {/* Hover background effect */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-primary/0 group-hover:to-primary/5 transition-all duration-500" />
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {step === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div className="space-y-4">
                          <Label className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
                            <FileSearch className="w-4 h-4" /> Modelo Digital com QR Code Válido
                          </Label>
                          <div 
                            className="relative rounded-xl overflow-hidden border border-white/10 group select-none"
                            onContextMenu={(e) => e.preventDefault()}
                          >
                            <img 
                              src={certificatePreviewAsset.url} 
                              alt="Prévia do Atestado" 
                              className="w-full h-auto object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                              draggable={false}
                            />
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
                              <div className="text-white/10 font-bold text-4xl -rotate-45 whitespace-nowrap select-none uppercase tracking-[0.5em]">
                                CONECTAMED CONECTAMED CONECTAMED CONECTAMED
                              </div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-60 pointer-events-none" />
                          </div>
                          <p className="text-[10px] font-medium text-primary bg-primary/10 border border-primary/20 rounded-md py-3 px-4 text-center mt-2 shadow-sm leading-relaxed">
                            ✅ Seu atestado será emitido no modelo digital UPA com QR Code válido e assinatura digital do médico, contendo todas as suas informações pessoais e os dados da unidade UPA da sua cidade. A UPA possui unidades em todo o Brasil, garantindo autenticidade e aceitação nacional.
                          </p>
                        </div>

                        <div className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-4">
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-muted-foreground text-sm">Paciente</span>
                          <span className="font-medium text-sm">{formData.nome || "Não informado"}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-muted-foreground text-sm">CPF</span>
                          <span className="font-medium text-sm">{formData.cpf || "Não informado"}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-muted-foreground text-sm">Nascimento</span>
                          <span className="font-medium text-sm">
                            {formData.dataNascimento ? new Date(formData.dataNascimento + 'T00:00:00').toLocaleDateString('pt-BR') : "Não informado"}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-muted-foreground text-sm">Mãe</span>
                          <span className="font-medium text-sm">{formData.nomeMae || "Não informado"}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-muted-foreground text-sm">Duração</span>
                          <span className="font-medium text-sm">{formData.diasAtestado} Dias</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-muted-foreground text-sm">Consulta</span>
                          <span className="font-medium text-sm">
                            {formData.dataConsulta 
                              ? new Date(formData.dataConsulta + 'T00:00:00').toLocaleDateString('pt-BR') 
                              : "Não informado"} às {formData.horaConsulta}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-muted-foreground text-sm">Local (UPA)</span>
                          <div className="text-right">
                            <span className="block font-medium text-sm">{formData.upa || "Não selecionado"}</span>
                            {formData.cidade && (
                              <span className="block text-[10px] text-muted-foreground uppercase tracking-wider">
                                {formData.bairro ? `${formData.bairro}, ` : ""}{formData.cidade} - {formData.estado}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-muted-foreground text-sm">CID</span>
                          <span className="font-medium text-sm">{formData.cid || "Não selecionado"}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-muted-foreground text-sm">Teleconsulta</span>
                          <span className={`font-medium text-sm ${formData.teleconsulta ? "text-primary" : "text-muted-foreground"}`}>
                            {formData.teleconsulta ? "Sim" : "Não"}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2">
                          <span className="text-primary font-bold">Total a Pagar</span>
                          <span className="text-primary font-bold">{precos[formData.diasAtestado as keyof typeof precos]}</span>
                        </div>
                      </div>

                      <div 
                        className="flex items-start space-x-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => setFormData(prev => ({ ...prev, confirmado: !prev.confirmado }))}
                      >
                        <Checkbox 
                          id="confirmado" 
                          checked={formData.confirmado}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, confirmado: !!checked }))}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label 
                            htmlFor="confirmado" 
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            Confirmo que meus dados estão corretos
                          </Label>
                          <p className="text-[10px] text-muted-foreground">
                            Ao marcar, você valida todas as informações acima para a emissão do documento.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full group h-12 text-lg font-semibold bg-primary hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={(step === totalSteps && !formData.confirmado) || isPaying}
                  >
                    {isPaying ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : null}
                    {isPaying ? "Processando..." : (step === totalSteps ? "Ir para Pagamento" : "Próximo Passo")}
                    {!isPaying && (step === totalSteps ? (
                      <CreditCard className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    ) : (
                      <ArrowLeft className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform rotate-180" />
                    ))}
                  </Button>
                </div>
                
                <p className="text-[10px] text-center text-muted-foreground/50 uppercase tracking-widest leading-relaxed mt-6">
                  Privacidade Total: Seus dados não são armazenados em nossos servidores.
                </p>
              </form>
            )}
          </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
