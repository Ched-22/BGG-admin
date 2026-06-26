import { DEFAULT_CLIENT_LANGUAGE, normalizeClientLanguage } from './clientLanguage';

export const TEMPLATES = {
  es: {
    quote_send:
      '¡Hola {clientName}!\n\n{servicesLine}\n\nA continuación le enviamos el presupuesto aprobado.\n\n¿Está de acuerdo y podemos agendar el servicio?',
    quote_resend:
      '¡Hola {clientName}!\n\n{servicesLine}\n\nLe reenviamos el presupuesto aprobado.\n\n¿Está de acuerdo y podemos agendar el servicio?',
    schedule_confirm:
      '¡Hola {clientName}! Su visita BGG quedó agendada para el {date} a las {time} · {address}. ¡Hasta pronto!',
    task_followup:
      '¡Hola {clientName}! Somos BGG Garagem, en relación con su tarea {taskId} ({project}).',
    service_ready_pickup:
      '¡Hola {clientName}! BGG Garagem le informa que el servicio de su vehículo {vehicle} ha finalizado y está listo para su recogida. Cualquier duda, estamos a su disposición.',
    customer_greeting:
      '¡Hola {clientName}! Somos BGG Garagem. ¿En qué podemos ayudarle?',
  },
  ca: {
    quote_send:
      'Hola {clientName}!\n\n{servicesLine}\n\nA continuació li enviem el pressupost aprovat.\n\nEstà d\'acord i podem programar el servei?',
    quote_resend:
      'Hola {clientName}!\n\n{servicesLine}\n\nLi reenviem el pressupost aprovat.\n\nEstà d\'acord i podem programar el servei?',
    schedule_confirm:
      'Hola {clientName}! La seva visita a BGG ha quedat programada per al {date} a les {time} · {address}. Fins aviat!',
    task_followup:
      'Hola {clientName}! Som BGG Garagem, en relació amb la seva tasca {taskId} ({project}).',
    service_ready_pickup:
      'Hola {clientName}! BGG Garagem us informa que el servei del seu vehicle {vehicle} ha finalitzat i està llest per a la recollida. Qualsevol dubte, estem a la seva disposició.',
    customer_greeting:
      'Hola {clientName}! Som BGG Garagem. En què el podem ajudar?',
  },
  en: {
    quote_send:
      'Hello {clientName}!\n\n{servicesLine}\n\nPlease find your approved quote below.\n\nAre you happy to proceed and shall we schedule the service?',
    quote_resend:
      'Hello {clientName}!\n\n{servicesLine}\n\nWe are resending your approved quote.\n\nAre you happy to proceed and shall we schedule the service?',
    schedule_confirm:
      'Hello {clientName}! Your BGG visit is scheduled for {date} at {time} · {address}. See you soon!',
    task_followup:
      'Hello {clientName}! This is BGG Garagem, regarding your job {taskId} ({project}).',
    service_ready_pickup:
      'Hello {clientName}! BGG Garagem would like to let you know that work on your vehicle {vehicle} is complete and it is ready for collection. If you have any questions, we are here to help.',
    customer_greeting:
      'Hello {clientName}! This is BGG Garagem. How can we help you today?',
  },
  ptBr: {
    quote_send:
      'Olá {clientName}!\n\n{servicesLine}\n\nSegue o orçamento aprovado.\n\nVocê concorda e podemos agendar o serviço?',
    quote_resend:
      'Olá {clientName}!\n\n{servicesLine}\n\nReenviamos o orçamento aprovado.\n\nVocê concorda e podemos agendar o serviço?',
    schedule_confirm:
      'Olá {clientName}! Sua visita à BGG foi agendada para {date} às {time} · {address}. Até breve!',
    task_followup:
      'Olá {clientName}! Somos a BGG Garagem, em relação à sua tarefa {taskId} ({project}).',
    service_ready_pickup:
      'Olá {clientName}! A BGG Garagem informa que o serviço do seu veículo {vehicle} foi concluído e está pronto para retirada. Qualquer dúvida, estamos à disposição.',
    customer_greeting:
      'Olá {clientName}! Somos a BGG Garagem. Em que podemos ajudar?',
  },
  ptPt: {
    quote_send:
      'Olá {clientName}!\n\n{servicesLine}\n\nSegue o orçamento aprovado.\n\nConcorda e podemos agendar o serviço?',
    quote_resend:
      'Olá {clientName}!\n\n{servicesLine}\n\nReenviamos o orçamento aprovado.\n\nConcorda e podemos agendar o serviço?',
    schedule_confirm:
      'Olá {clientName}! A sua visita à BGG ficou agendada para {date} às {time} · {address}. Até breve!',
    task_followup:
      'Olá {clientName}! Somos a BGG Garagem, em relação à sua tarefa {taskId} ({project}).',
    service_ready_pickup:
      'Olá {clientName}! A BGG Garagem informa que o serviço do seu veículo {vehicle} foi concluído e está pronto para levantamento. Qualquer dúvida, estamos à disposição.',
    customer_greeting:
      'Olá {clientName}! Somos a BGG Garagem. Em que o podemos ajudar?',
  },
};

export function getWhatsAppTemplate(templateId, language = DEFAULT_CLIENT_LANGUAGE) {
  const lang = normalizeClientLanguage(language);
  return TEMPLATES[lang]?.[templateId] || TEMPLATES.es[templateId] || '';
}
