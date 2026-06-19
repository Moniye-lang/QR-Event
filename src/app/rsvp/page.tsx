'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, Phone, User, Mail, Download, ExternalLink, Loader2 } from 'lucide-react';
import QRCode from 'qrcode';

interface Ticket {
  name: string;
  token: string;
}

export default function RSVPPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    attending: '',
    guests: '1'
  });
  const [guestNames, setGuestNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdTickets, setCreatedTickets] = useState<Ticket[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGuestsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const numGuests = parseInt(e.target.value) || 1;
    setFormData({ ...formData, guests: e.target.value });
    
    // Calculate how many additional guest names are needed (total - 1)
    const needed = numGuests - 1;
    if (needed <= 0) {
      setGuestNames([]);
    } else {
      setGuestNames(prev => {
        const next = [...prev];
        if (next.length < needed) {
          while (next.length < needed) {
            next.push('');
          }
        } else if (next.length > needed) {
          next.splice(needed);
        }
        return next;
      });
    }
  };

  const handleGuestNameChange = (index: number, value: string) => {
    const next = [...guestNames];
    next[index] = value;
    setGuestNames(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          attending: formData.attending,
          guests: parseInt(formData.guests) || 1,
          guestNames: formData.attending === 'yes' ? guestNames : [],
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (formData.attending === 'yes') {
          setCreatedTickets(
            data.invites.map((inv: any) => ({
              name: inv.name,
              token: inv.token,
            }))
          );
        }
        setSubmitted(true);
      } else {
        setErrorMsg(data.message || 'Failed to submit RSVP. Please try again.');
      }
    } catch (err) {
      console.error('RSVP submission error:', err);
      setErrorMsg('A network error occurred. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadQrCode = async (token: string, name: string) => {
    try {
      const dataUrl = await QRCode.toDataURL(token, { 
        width: 600, 
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${name.replace(/\s+/g, '_')}_QR_Pass.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download QR Code error:', err);
    }
  };

  // SUCCESS STATE VIEW
  if (submitted) {
    if (formData.attending === 'no') {
      return (
        <main className="min-h-screen py-12 px-6 flex items-center justify-center">
          <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />
          </div>
          <div className="max-w-md w-full glass rounded-[2.5rem] p-8 text-center space-y-6 border border-white/5 shadow-2xl">
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto text-blue-400">
              <Calendar className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold text-white">RSVP Received</h2>
            <p className="text-slate-300 leading-relaxed">
              Thank you, <strong className="text-white">{formData.name}</strong>. We have recorded your response that you will not be attending.
            </p>
            <button 
              onClick={() => { 
                setSubmitted(false); 
                setFormData({ name: '', email: '', phone: '', attending: '', guests: '1' }); 
                setGuestNames([]); 
              }}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all w-full font-semibold border border-white/10 cursor-pointer"
            >
              Back to Form
            </button>
          </div>
        </main>
      );
    }

    return (
      <main className="min-h-screen py-12 px-6">
        <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold gradient-text">RSVP Confirmed!</h1>
            <p className="text-slate-400 max-w-lg mx-auto">
              Your registration was successful. Below are your unique entry passes containing QR codes. Present them at the entrance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {createdTickets.map((ticket, idx) => (
              <TicketItem key={ticket.token} ticket={ticket} idx={idx} onDownload={downloadQrCode} />
            ))}
          </div>

          <div className="text-center pt-6">
            <button
              onClick={() => { 
                setSubmitted(false); 
                setFormData({ name: '', email: '', phone: '', attending: '', guests: '1' }); 
                setGuestNames([]); 
                setCreatedTickets([]); 
              }}
              className="px-8 py-3.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl transition-all font-semibold hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Submit Another RSVP
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ACTIVE RSVP FORM VIEW
  return (
    <main className="min-h-screen py-12 px-6">
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Event Details Section */}
        <div className="glass rounded-3xl p-8 space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text">Event Details</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Date</h3>
                <p className="text-slate-400">Saturday, June 28, 2026</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Time</h3>
                <p className="text-slate-400">6:00 PM - 11:00 PM</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Location</h3>
                <p className="text-slate-400">Grand Event Hall, Downtown</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Expected Guests</h3>
                <p className="text-slate-400">Up to 200 attendees</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <h3 className="text-lg font-semibold text-white mb-2">About the Event</h3>
            <p className="text-slate-400 leading-relaxed animate-pulse-subtle">
              Join us for an unforgettable evening of celebration, networking, and entertainment. 
              This exclusive event brings together industry leaders, innovators, and enthusiasts 
              for a night filled with great food, music, and meaningful connections.
            </p>
          </div>
        </div>

        {/* RSVP Form Section */}
        <div className="glass rounded-3xl p-8">
          <h2 className="text-3xl font-bold gradient-text mb-6">RSVP Form</h2>
          
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            {/* Phone Number Field */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="tel"
                  id="phone"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            {/* Attending Radio Buttons */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Will you be attending?
              </label>
              <div className="flex space-x-6">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="attending"
                    value="yes"
                    required
                    checked={formData.attending === 'yes'}
                    onChange={(e) => setFormData({ ...formData, attending: e.target.value })}
                    className="w-5 h-5 text-blue-500 bg-white/5 border-white/20 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-white">Yes</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="attending"
                    value="no"
                    checked={formData.attending === 'no'}
                    onChange={(e) => setFormData({ ...formData, attending: e.target.value })}
                    className="w-5 h-5 text-blue-500 bg-white/5 border-white/20 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-white">No</span>
                </label>
              </div>
            </div>

            {/* Number of Guests & Dynamic Additional Guest Names */}
            {formData.attending === 'yes' && (
              <>
                <div>
                  <label htmlFor="guests" className="block text-sm font-medium text-slate-300 mb-2">
                    Number of Guests
                  </label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <select
                      id="guests"
                      value={formData.guests}
                      onChange={handleGuestsChange}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                    >
                      {[1, 2, 3, 4, 5].map((num) => (
                        <option key={num} value={num} className="bg-slate-800">
                          {num} Guest{num > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Additional Guest Name Inputs */}
                {guestNames.map((name, idx) => (
                  <div key={idx} className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <label htmlFor={`guest-${idx}`} className="block text-sm font-medium text-slate-300 ml-1">
                      Guest {idx + 2} Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="text"
                        id={`guest-${idx}`}
                        required
                        value={name}
                        onChange={(e) => handleGuestNameChange(idx, e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder={`Enter guest ${idx + 2}'s full name`}
                      />
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span>Submitting RSVP...</span>
                </>
              ) : (
                <span>Submit RSVP</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

// TICKET CARD ITEM COMPONENT
function TicketItem({ ticket, idx, onDownload }: { ticket: Ticket; idx: number; onDownload: (token: string, name: string) => void }) {
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    QRCode.toDataURL(ticket.token, {
      width: 400,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      }
    }).then(setQrUrl).catch(console.error);
  }, [ticket.token]);

  return (
    <div className="glass rounded-[2rem] overflow-hidden border border-white/10 flex flex-col relative shadow-xl hover:scale-[1.01] transition-transform">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
        <span className="text-sm uppercase tracking-widest text-white/90 font-bold">Entry Pass #{idx + 1}</span>
        <span className="text-xs px-2.5 py-1 bg-white/20 rounded-full text-white font-semibold backdrop-blur-md">Confirmed</span>
      </div>
      
      <div className="p-6 flex-1 flex flex-col items-center text-center space-y-6">
        <div className="space-y-1">
          <h3 className="text-2xl font-bold text-white uppercase tracking-tight">{ticket.name}</h3>
          <p className="text-xs text-slate-500 font-mono">Token: {ticket.token.slice(0, 8)}...</p>
        </div>

        {qrUrl ? (
          <div className="p-4 bg-white rounded-2xl shadow-inner">
            <img src={qrUrl} alt="Entry QR" className="w-48 h-48" />
          </div>
        ) : (
          <div className="w-48 h-48 flex items-center justify-center bg-white/5 rounded-2xl">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <div className="w-full grid grid-cols-2 gap-4 text-left border-y border-white/5 py-4 text-slate-400 text-xs">
          <div>
            <span className="block font-semibold text-white">Date & Time</span>
            <span>June 28, 2026 at 6:00 PM</span>
          </div>
          <div>
            <span className="block font-semibold text-white">Location</span>
            <span>Grand Hall, Downtown</span>
          </div>
        </div>

        <div className="w-full flex gap-3">
          <button
            onClick={() => onDownload(ticket.token, ticket.name)}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
          <a
            href={`/invite/${ticket.token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 glass hover:bg-white/10 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 border border-white/10"
          >
            <ExternalLink className="w-4 h-4 text-purple-400" />
            <span>Open Link</span>
          </a>
        </div>
      </div>
    </div>
  );
}
