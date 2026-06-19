import nodemailer from 'nodemailer';

interface RsvpEmailData {
  name: string;
  email: string;
  phone: string;
  attending: string;
  guestsCount: number;
  guestNames: string[];
  tickets: Array<{ name: string; token: string }>;
}

export async function sendRsvpNotification(data: RsvpEmailData) {
  const notificationEmail = process.env.NOTIFICATION_EMAIL;
  
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || smtpUser || 'rsvp-notifications@example.com';

  const isSMTPConfigured = !!(smtpHost && smtpUser && smtpPass && notificationEmail);

  // Generate Email Content
  const subject = `RSVP Response: ${data.name} - ${data.attending.toUpperCase()}`;

  const guestNamesList = data.guestNames.length > 0 
    ? `<ul>${data.guestNames.map(g => `<li>${g}</li>`).join('')}</ul>`
    : '<p>None</p>';

  const ticketsSection = data.attending === 'yes' && data.tickets.length > 0
    ? `<h3>Generated Entry Passes:</h3>
       <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%; max-width: 600px; border-color: #e2e8f0;">
         <thead>
           <tr style="background-color: #f8fafc;">
             <th align="left">Guest Name</th>
             <th align="left">Pass Link</th>
           </tr>
         </thead>
         <tbody>
           ${data.tickets.map(t => {
             // Try to build public ticket URL
             const host = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
             const ticketUrl = `${host}/invite/${t.token}`;
             return `
               <tr>
                 <td><strong>${t.name}</strong></td>
                 <td><a href="${ticketUrl}" target="_blank">${ticketUrl}</a></td>
               </tr>
             `;
           }).join('')}
         </tbody>
       </table>`
    : '';

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #2563eb; margin-top: 0;">New RSVP Submitted</h2>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 20px;" />
      
      <table cellpadding="6" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 150px; color: #64748b;"><strong>Main Guest:</strong></td>
          <td>${data.name}</td>
        </tr>
        <tr>
          <td style="color: #64748b;"><strong>Email:</strong></td>
          <td>${data.email || 'Not provided'}</td>
        </tr>
        <tr>
          <td style="color: #64748b;"><strong>Phone:</strong></td>
          <td>${data.phone || 'Not provided'}</td>
        </tr>
        <tr>
          <td style="color: #64748b;"><strong>Attending:</strong></td>
          <td>
            <span style="background-color: ${data.attending === 'yes' ? '#dcfce7' : '#fee2e2'}; color: ${data.attending === 'yes' ? '#15803d' : '#b91c1c'}; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 14px;">
              ${data.attending.toUpperCase()}
            </span>
          </td>
        </tr>
        <tr>
          <td style="color: #64748b;"><strong>Total Group Count:</strong></td>
          <td>${data.guestsCount}</td>
        </tr>
      </table>

      ${data.attending === 'yes' && data.guestNames.length > 0 ? `
        <div style="margin-top: 20px;">
          <h3 style="margin-bottom: 8px;">Additional Guests:</h3>
          ${guestNamesList}
        </div>
      ` : ''}

      ${ticketsSection}

      <div style="margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px;">
        Sent automatically by QR Event Portal
      </div>
    </div>
  `;

  if (!isSMTPConfigured) {
    console.log('\n======================================================');
    console.log('📬 EMAIL NOTIFICATION LOG (SMTP NOT CONFIGURED IN ENV)');
    console.log(`To: ${notificationEmail || '[None Defined]'}`);
    console.log(`Subject: ${subject}`);
    console.log('HTML Body:');
    console.log(html);
    console.log('======================================================\n');
    return { success: true, message: 'Logged to console (SMTP not configured)' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for others
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: smtpFrom,
      to: notificationEmail,
      subject,
      html,
    });

    console.log(`RSVP Notification email sent successfully to ${notificationEmail}`);
    return { success: true, message: 'Email sent successfully' };
  } catch (error: any) {
    console.error('Failed to send RSVP Notification email:', error);
    // Return success: true so we don't fail the RSVP database submission due to mail errors
    return { success: false, error: error.message };
  }
}
