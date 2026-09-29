import React, { useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';

export function PrivacyPage() {
  const { config } = useConfig();

  useEffect(() => {
    document.title = `Privacy Policy - ${config.clinicName || 'AuraCare Health'}`;
  }, [config.clinicName]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-slate-800">
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-amber-900 text-xs mb-8 font-medium">
        ⚖️ <strong>Notice:</strong> This Privacy Policy describes data collection for our online appointment booking portal.
      </div>

      <h1 className="text-3xl font-extrabold text-slate-900 mb-6">Privacy Policy</h1>
      
      <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">1. Information We Collect</h2>
          <p>
            When you register an account or book an appointment on this platform, we collect personal details including your full name, email address, phone number, gender, date of birth, and contact information. Clinical record history documented during consultations is kept strictly confidential.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">2. How Information Is Used</h2>
          <p>
            Your information is strictly used to facilitate healthcare consultation bookings, verify specialist availability, send status updates, and maintain medical records between you and your attending physician.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">3. Role-Based Data Isolation</h2>
          <p>
            Administrative personnel are restricted from viewing or editing medical diagnosis details. Specialists can access medical records exclusively for patients under their care.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">4. Cookies &amp; Data Security</h2>
          <p>
            Authentication tokens are secured via browser cookies. Medical records and confidential notes are never stored in unencrypted client cache.
          </p>
        </section>
      </div>
    </div>
  );
}

export function TermsPage() {
  const { config } = useConfig();

  useEffect(() => {
    document.title = `Terms of Service - ${config.clinicName || 'AuraCare Health'}`;
  }, [config.clinicName]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-slate-800">
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-amber-900 text-xs mb-8 font-medium">
        ⚖️ <strong>Notice:</strong> These Terms of Service outline your rights and obligations when using the booking portal.
      </div>

      <h1 className="text-3xl font-extrabold text-slate-900 mb-6">Terms of Service</h1>

      <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">1. Medical Emergency Disclaimer</h2>
          <p className="text-rose-700 font-semibold bg-rose-50 p-4 rounded-xl border border-rose-200">
            This online appointment booking platform is strictly intended for non-urgent scheduled consultations. If you are experiencing a medical emergency, acute pain, or life-threatening symptoms, DO NOT wait for an online response. Call your local emergency hotline immediately.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">2. Appointment Cancellations</h2>
          <p>
            Patients may cancel scheduled appointments up to {config.cancellationCutoffHours || 24} hours prior to the appointment time. Cancellations inside the {config.cancellationCutoffHours || 24}-hour cutoff window require direct contact with clinic staff.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">3. User Responsibilities</h2>
          <p>
            Users must provide accurate, up-to-date contact and personal details during registration and booking.
          </p>
        </section>
      </div>
    </div>
  );
}

/** Default export used by the lazy() import in App.jsx.
 *  Pass `page="privacy"` or `page="terms"` as a prop via the Route element. */
export default function StaticPages({ page }) {
  if (page === 'terms') return <TermsPage />;
  return <PrivacyPage />;
}
