"use client"

import { HeaderWrapper } from "@/components/header-wrapper"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { HelpCircle, MessageCircle, Phone, Mail, Clock, MapPin, ArrowLeft, ChevronRight, Package, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { OrderSummary } from "@/components/order-summary"
import Link from "next/link"

export default function AjudaPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  useEffect(() => {
    // No localhost, se o auth falhar, não vamos redirecionar para não causar 404/loops
    if (!loading && !user && window.location.hostname !== "localhost") {
      router.push("/login")
    }
  }, [user, loading, router])

  const faqItems = [
    {
      question: "Como faço um pedido?",
      answer: "Navegue pelo cardápio, escolha suas batatas, adicione ao carrinho e finalize. O pagamento é feito na entrega."
    },
    {
      question: "Qual o tempo de entrega?",
      answer: "O tempo médio é de 15 a 22 minutos, variando conforme sua localização."
    },
    {
      question: "Como adiciono um endereço?",
      answer: "Vá em 'Meus Dados' e clique em 'Adicionar Endereço'."
    },
    {
      question: "Posso cancelar meu pedido?",
      answer: "Sim, em até 5 minutos após a confirmação. Depois disso, fale conosco pelo WhatsApp."
    },
    {
      question: "Não estou achando meu endereço",
      answer: "Se o seu endereço não aparece ou o CEP não é reconhecido, verifique se ele está dentro de Iacanga. Caso esteja tudo correto e ainda assim não consiga cadastrar, entre em contato conosco pelo nosso número oficial para que possamos te ajudar e realizar seu pedido manualmente."
    },
  ]

  const contactOptions = [
    {
      icon: MessageCircle,
      title: "WhatsApp",
      value: "(14) 99736-1015",
      action: () => window.open("https://wa.me/5514997361015", "_blank"),
      color: "green"
    },
    {
      icon: Phone,
      title: "Telefone",
      value: "(14) 99736-1015",
      action: () => window.open("tel:+5514997361015", "_blank"),
      color: "blue"
    },
  ]

  const quickLinks = [
    { icon: Package, title: "Meus Pedidos", href: "/pedidos", color: "blue" },
    { icon: AlertCircle, title: "Problemas", href: "/contato", color: "red" },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <HeaderWrapper />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
        </main>
        <Footer />
        <OrderSummary />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <HeaderWrapper />
      <main className="flex-1 py-8 pb-24 lg:pb-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-black text-gray-800">Ajuda</h1>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {quickLinks.map((link, index) => (
              <Link key={index} href={link.href}>
                <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full bg-${link.color}-50 flex items-center justify-center`}>
                    <link.icon className={`h-5 w-5 text-${link.color}-500`} />
                  </div>
                  <p className="text-sm font-bold text-gray-800">{link.title}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="space-y-3 mb-6">
            {contactOptions.map((option, index) => (
              <button key={index} onClick={option.action} className="w-full bg-white rounded-xl p-4 border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-full bg-${option.color}-50 flex items-center justify-center`}>
                    <option.icon className={`h-6 w-6 text-${option.color}-500`} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-800">{option.title}</p>
                    <p className="text-sm font-bold text-yellow-600">{option.value}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300" />
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-100">
            <h3 className="font-black text-gray-800 mb-4">Dúvidas Frequentes</h3>
            <div className="space-y-3">
              {faqItems.map((item, index) => (
                <div key={index} className="border-b border-gray-50 last:border-0 pb-3 last:pb-0">
                  <button onClick={() => setExpandedFaq(expandedFaq === index ? null : index)} className="w-full text-left flex items-center justify-between py-2">
                    <span className="font-bold text-gray-800 text-sm">{item.question}</span>
                    <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${expandedFaq === index ? 'rotate-90' : ''}`} />
                  </button>
                  {expandedFaq === index && (
                    <div className="animate-in fade-in slide-in-from-top-1">
                      <p className="text-sm text-gray-500 mt-2">{item.answer}</p>
                      {item.question === "Não estou achando meu endereço" && (
                        <Button 
                          onClick={() => window.open("https://wa.me/5514997361015", "_blank")}
                          className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-bold gap-2"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Falar com a Batatop
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="h-5 w-5 text-blue-500" />
              <p className="font-bold text-gray-800">Horário</p>
            </div>
            <p className="text-sm text-gray-600">Segunda a Segunda: 10:00 - 01:30</p>
          </div>
        </div>
      </main>
      <Footer />
      <OrderSummary />
    </div>
  )
}
