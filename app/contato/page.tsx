"use client"

import { HeaderWrapper } from "@/components/header-wrapper"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Phone, Mail, MapPin, Clock, MessageCircle, Instagram, Send } from "lucide-react"
import Image from "next/image"

export default function ContatoPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderWrapper />
      
      <main className="flex-1">
        {/* Hero Section Simplificada */}
        <section className="py-16 bg-gray-50 border-b border-gray-100">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-4 tracking-tighter">
              Fale com a <span className="text-yellow-500">batata top</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto font-medium">
              Dúvidas, sugestões ou apenas quer bater um papo sobre batatas? Estamos aqui para você!
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Card WhatsApp - O Principal */}
              <div className="lg:col-span-2 bg-white border-2 border-yellow-100 rounded-3xl p-8 md:p-12 shadow-xl shadow-yellow-50 flex flex-col md:flex-row items-center gap-8 transition-transform hover:scale-[1.01]">
                <div className="relative w-32 h-32 md:w-48 md:h-48 flex-shrink-0">
                  <Image
                    src="/logo.png"
                    alt="batata top"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Online Agora
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 mb-4">Atendimento via WhatsApp</h2>
                  <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                    Nossa equipe está pronta para te atender. Clique no botão abaixo para iniciar uma conversa agora mesmo!
                  </p>
                  <a href="https://wa.me/5514997361015" target="_blank" rel="noopener noreferrer">
                    <Button className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white font-black text-lg px-10 h-14 rounded-2xl shadow-lg shadow-green-100 flex items-center justify-center gap-3">
                      <MessageCircle className="h-6 w-6" />
                      CHAMAR NO WHATSAPP
                    </Button>
                  </a>
                </div>
              </div>

              {/* Outros Contatos */}
              <div className="space-y-6">
                {/* Instagram */}
                <a 
                  href="https://www.instagram.com/batatop_1/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <div className="bg-white border border-gray-100 rounded-3xl p-6 flex items-center gap-4 transition-all group-hover:border-pink-200 group-hover:bg-pink-50/30">
                    <div className="w-14 h-14 rounded-2xl bg-pink-50 text-pink-500 flex items-center justify-center group-hover:bg-pink-500 group-hover:text-white transition-all">
                      <Instagram className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Instagram</p>
                      <p className="text-lg font-black text-gray-900">@batatop_1</p>
                    </div>
                  </div>
                </a>

                {/* Email */}
                <div className="bg-white border border-gray-100 rounded-3xl p-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                    <Mail className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">E-mail</p>
                    <p className="text-lg font-black text-gray-900">contato@batata top.com</p>
                  </div>
                </div>

                {/* Horário */}
                <div className="bg-gray-900 rounded-3xl p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Clock className="w-24 h-24" />
                  </div>
                  <p className="text-xs font-black text-yellow-500 uppercase tracking-widest mb-4">Horário de Funcionamento</p>
                  <div className="space-y-2">
                    <p className="text-xl font-black">Segunda a Segunda</p>
                    <p className="text-3xl font-black text-yellow-500">10:00 às 01:30</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Localização */}
            <div className="mt-12 bg-white border border-gray-100 rounded-3xl p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-center md:text-left">
                  <div className="w-16 h-16 rounded-2xl bg-yellow-50 text-yellow-500 flex items-center justify-center mb-6 mx-auto md:mx-0">
                    <MapPin className="h-8 w-8" />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 mb-2">Onde estamos</h2>
                  <p className="text-gray-500 font-medium">Iacanga - SP e Região</p>
                  <p className="text-gray-400 text-sm mt-4">Atendemos toda a cidade com delivery rápido!</p>
                </div>
                <div className="w-full md:w-1/2 h-64 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-4">
                  <MapPin className="h-12 w-12 opacity-20" />
                  <p className="font-bold uppercase tracking-widest text-xs">Mapa em breve</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
