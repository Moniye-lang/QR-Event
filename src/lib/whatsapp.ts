export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-numeric characters except leading plus if present
  let cleaned = phone.trim().replace(/[^\d+]/g, '');
  
  // Handle leading '+'
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  
  // Handle local Nigerian numbers starting with '0' e.g. 08012345678 -> 2348012345678
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '234' + cleaned.substring(1);
  }

  return cleaned;
}

interface SendWhatsAppMessageParams {
  recipientPhone: string;
  guestName: string;
  inviteUrl: string;
  isTemplate?: boolean;
}

interface SendWhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
  formattedPhone?: string;
}

export async function sendWhatsAppMessage({
  recipientPhone,
  guestName,
  inviteUrl,
  isTemplate = false,
}: SendWhatsAppMessageParams): Promise<SendWhatsAppResult> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return {
      success: false,
      error: 'WhatsApp API credentials (WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID) are missing in environment configuration.',
    };
  }

  const formattedPhone = formatPhoneNumber(recipientPhone);
  if (!formattedPhone || formattedPhone.length < 8) {
    return {
      success: false,
      error: `Invalid phone number format: "${recipientPhone}". Ensure standard international format with country code.`,
    };
  }

  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
  const templateLang = process.env.WHATSAPP_TEMPLATE_LANG || 'en_US';
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v20.0';

  const useTemplateFormat = isTemplate || Boolean(templateName);

  let payload: Record<string, any>;

  if (useTemplateFormat && templateName) {
    payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: templateLang },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: guestName },
              { type: 'text', text: inviteUrl },
            ],
          },
        ],
      },
    };
  } else {
    // Custom formatted text message (requires active 24h user window or sandbox/testing)
    payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'text',
      text: {
        preview_url: true,
        body: `Dear ${guestName},\n\nYou are cordially invited! ✨\n\nPlease view your personalized invitation & RSVP details using the link below:\n${inviteUrl}\n\nWe look forward to celebrating with you!`,
      },
    };
  }

  try {
    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage =
        data.error?.error_data?.details ||
        data.error?.message ||
        `WhatsApp API returned status ${response.status}`;
      return {
        success: false,
        formattedPhone,
        error: errorMessage,
      };
    }

    const messageId = data.messages?.[0]?.id || 'unknown_id';
    return {
      success: true,
      formattedPhone,
      messageId,
    };
  } catch (err: any) {
    return {
      success: false,
      formattedPhone,
      error: err.message || 'Failed to communicate with WhatsApp Cloud API.',
    };
  }
}
