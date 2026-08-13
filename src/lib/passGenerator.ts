import QRCode from 'qrcode';

export interface PassData {
  name: string;
  token: string;
  isAdditionalGuest?: boolean;
  mainGuestName?: string;
}

/**
 * Loads an image from a URL with crossOrigin support and returns a promise.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Draws a rounded rectangle path on canvas context.
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Generates a high-resolution, beautifully designed PNG pass data URL / blob.
 * Canvas resolution: 600px width x 920px height.
 */
export async function generatePassCanvas(data: PassData): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const w = 600;
  const h = 920;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // 1. Base Background
  ctx.fillStyle = '#0e0a03';
  ctx.fillRect(0, 0, w, h);

  // 2. Cover Banner Header
  try {
    const coverImg = await loadImage('/premium_cover.png');
    ctx.save();
    roundRect(ctx, 0, 0, w, 200, 0);
    ctx.clip();
    ctx.drawImage(coverImg, 0, 0, w, 200);
    ctx.restore();
  } catch (e) {
    console.warn('Cover image loading fallback:', e);
    // Fallback cover header gradient
    const grad = ctx.createLinearGradient(0, 0, w, 200);
    grad.addColorStop(0, '#1f1604');
    grad.addColorStop(0.5, '#3b2b0a');
    grad.addColorStop(1, '#1f1604');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, 200);
  }

  // Gradient fade on cover image
  const coverFade = ctx.createLinearGradient(0, 100, 0, 200);
  coverFade.addColorStop(0, 'rgba(14, 10, 3, 0)');
  coverFade.addColorStop(1, 'rgba(14, 10, 3, 1)');
  ctx.fillStyle = coverFade;
  ctx.fillRect(0, 100, w, 100);

  // Outer Gold Border Frame
  ctx.strokeStyle = '#c9a84c';
  ctx.lineWidth = 3;
  roundRect(ctx, 12, 12, w - 24, h - 24, 24);
  ctx.stroke();

  // Subtle Inner Gold Border
  ctx.strokeStyle = 'rgba(201, 168, 76, 0.25)';
  ctx.lineWidth = 1;
  roundRect(ctx, 18, 18, w - 36, h - 36, 18);
  ctx.stroke();

  // 3. Header Title Box (y: 200 - 300)
  const headerGrad = ctx.createLinearGradient(0, 200, w, 300);
  headerGrad.addColorStop(0, '#1a1200');
  headerGrad.addColorStop(0.5, '#2e2000');
  headerGrad.addColorStop(1, '#1a1200');
  ctx.fillStyle = headerGrad;
  ctx.fillRect(20, 200, w - 40, 100);

  // Gold subtitle
  ctx.fillStyle = 'rgba(201, 168, 76, 0.85)';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('A GOLDEN CELEBRATION', w / 2, 222);

  // Main Event Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px "Playfair Display", Georgia, serif';
  ctx.fillText("Felix's 50th Birthday", w / 2, 254);

  // Badge Tag
  const isGuest = Boolean(data.isAdditionalGuest || data.mainGuestName);
  const badgeText = isGuest ? `✦ GUEST OF ${((data.mainGuestName || 'INVITED HOST')).toUpperCase()}` : '✦ VIP ACCESS PASS';
  ctx.font = 'bold 10px sans-serif';
  const badgeWidth = Math.min(w - 60, ctx.measureText(badgeText).width + 24);
  const badgeX = (w - badgeWidth) / 2;
  const badgeY = 268;

  const badgeGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeWidth, badgeY + 20);
  badgeGrad.addColorStop(0, '#c9a84c');
  badgeGrad.addColorStop(1, '#ffe066');
  ctx.fillStyle = badgeGrad;
  roundRect(ctx, badgeX, badgeY, badgeWidth, 20, 10);
  ctx.fill();

  ctx.fillStyle = '#0a0800';
  ctx.textAlign = 'center';
  ctx.fillText(badgeText, w / 2, badgeY + 14);

  // 4. Tear Line (y: 315)
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = 'rgba(201, 168, 76, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(35, 315);
  ctx.lineTo(w - 35, 315);
  ctx.stroke();
  ctx.setLineDash([]); // reset line dash

  // Notch holes on tear line sides
  ctx.fillStyle = '#050505';
  ctx.beginPath();
  ctx.arc(12, 315, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w - 12, 315, 10, 0, Math.PI * 2);
  ctx.fill();

  // 5. Guest Name Section (y: 335 - 410)
  ctx.fillStyle = 'rgba(201, 168, 76, 0.7)';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PASS HOLDER', w / 2, 345);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px "Playfair Display", Georgia, serif';
  // Truncate name if extremely long
  let displayName = data.name.toUpperCase();
  if (displayName.length > 28) displayName = displayName.substring(0, 25) + '...';
  ctx.fillText(displayName, w / 2, 375);

  if (isGuest && data.mainGuestName) {
    ctx.fillStyle = '#ffe066';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`GUEST OF: ${data.mainGuestName.toUpperCase()}`, w / 2, 393);
  }

  ctx.fillStyle = 'rgba(201, 168, 76, 0.5)';
  ctx.font = '11px monospace';
  ctx.fillText(`TOKEN ID: ${data.token}`, w / 2, (isGuest && data.mainGuestName) ? 410 : 395);

  // 6. QR Code Section (y: 420 - 610)
  try {
    const qrDataUrl = await QRCode.toDataURL(data.token, {
      width: 400,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    });
    const qrImg = await loadImage(qrDataUrl);

    // QR Code Container Box
    const qrBoxSize = 180;
    const qrBoxX = (w - qrBoxSize) / 2;
    const qrBoxY = 425;

    ctx.fillStyle = '#ffffff';
    roundRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 16);
    ctx.fill();

    ctx.strokeStyle = '#c9a84c';
    ctx.lineWidth = 2;
    roundRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 16);
    ctx.stroke();

    ctx.drawImage(qrImg, qrBoxX + 10, qrBoxY + 10, qrBoxSize - 20, qrBoxSize - 20);
  } catch (err) {
    console.error('QR code render error on canvas:', err);
  }

  // Scan instruction
  ctx.fillStyle = 'rgba(255, 224, 102, 0.85)';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('PRESENT THIS QR CODE AT ENTRY GATE', w / 2, 628);

  // 7. Event Details Block (y: 645 - 840)
  const detailsBoxY = 645;
  const detailsBoxH = 205;
  ctx.fillStyle = '#140f05';
  roundRect(ctx, 35, detailsBoxY, w - 70, detailsBoxH, 16);
  ctx.fill();

  ctx.strokeStyle = 'rgba(201, 168, 76, 0.25)';
  ctx.lineWidth = 1;
  roundRect(ctx, 35, detailsBoxY, w - 70, detailsBoxH, 16);
  ctx.stroke();

  // Details items
  ctx.textAlign = 'left';
  let currY = detailsBoxY + 30;

  // Date & Time
  ctx.fillStyle = '#ffe066';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('DATE & TIME', 55, currY);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('Saturday, November 28, 2026 · 1:00 PM – 8:00 PM', 55, currY + 18);

  // Divider
  currY += 40;
  ctx.strokeStyle = 'rgba(201, 168, 76, 0.15)';
  ctx.beginPath();
  ctx.moveTo(55, currY);
  ctx.lineTo(w - 55, currY);
  ctx.stroke();

  // Location
  currY += 20;
  ctx.fillStyle = '#ffe066';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('LOCATION / VENUE', 55, currY);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('Gallani Event Center, NO 1 Abel Awe Close,', 55, currY + 18);
  ctx.fillText('Ajao Street, GRA, Jericho, Ibadan', 55, currY + 34);

  // Divider
  currY += 48;
  ctx.strokeStyle = 'rgba(201, 168, 76, 0.15)';
  ctx.beginPath();
  ctx.moveTo(55, currY);
  ctx.lineTo(w - 55, currY);
  ctx.stroke();

  // Dress Code
  currY += 20;
  ctx.fillStyle = '#ffe066';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('DRESS CODE', 55, currY);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('Strictly White with Gold headwear', 55, currY + 18);

  // 8. Footer (y: 875)
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(201, 168, 76, 0.5)';
  ctx.font = '9px sans-serif';
  ctx.fillText('CELEBRATING 50 GOLDEN YEARS · OFFICIAL ENTRY TICKET PASS', w / 2, 885);

  return canvas;
}

/**
 * Handles cross-platform downloading or sharing of the generated pass.
 * Supports iOS Safari, Android Chrome, and WebViews using Web Share API + Blob download.
 */
export async function downloadOrSharePass(
  passData: PassData,
  onOpenModal?: (imageUrl: string) => void
): Promise<void> {
  const fileName = `${passData.name.replace(/\s+/g, '_')}_Ticket.png`;
  const canvas = await generatePassCanvas(passData);

  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        console.error('Failed to convert pass canvas to blob');
        resolve();
        return;
      }

      const file = new File([blob], fileName, { type: 'image/png' });
      const dataUrl = canvas.toDataURL('image/png');

      // 1. Always notify modal opener if provided (so user can view image & long-press to save)
      if (onOpenModal) {
        onOpenModal(dataUrl);
      }

      // 2. Try native Web Share API (Works best on iOS Safari & Mobile Chrome!)
      if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `${passData.name}'s Entry Pass`,
            text: `Here is the VIP entry pass for ${passData.name} - Felix's 50th Birthday.`,
          });
          resolve();
          return;
        } catch (shareErr: any) {
          // Ignore AbortError (user canceled share dialog)
          if (shareErr.name !== 'AbortError') {
            console.warn('Web Share API error:', shareErr);
          }
        }
      }

      // 3. Try standard programmatic blob link download
      try {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 15000);
      } catch (err) {
        console.warn('Programmatic download fallback triggered:', err);
      }

      resolve();
    }, 'image/png', 0.95);
  });
}
