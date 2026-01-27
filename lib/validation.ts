/**
 * Utilitários de Validação de Dados (Segurança Camada 3)
 * Focado em impedir dados maliciosos ou inválidos.
 */

export const validatePhone = (phone: string): boolean => {
  // Aceita formatos: (14) 99999-9999, 14999999999, etc.
  const re = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/
  return re.test(phone)
}

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const sanitizeString = (str: string): string => {
  // Remove tags HTML para evitar XSS básico
  return str.replace(/<[^>]*>?/gm, '').trim()
}

export const validateOrder = (order: any): { isValid: boolean; error?: string } => {
  if (!order.customerName || order.customerName.length < 3) {
    return { isValid: false, error: "Nome do cliente inválido" }
  }
  
  if (!validatePhone(order.customerPhone)) {
    return { isValid: false, error: "Telefone inválido" }
  }
  
  if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
    return { isValid: false, error: "O pedido deve conter pelo menos um item" }
  }
  
  if (order.total <= 0) {
    return { isValid: false, error: "Valor total inválido" }
  }

  return { isValid: true }
}
