import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useConfig } from '../context/ConfigContext';
import { Skeleton, ErrorState, EmptyState } from '../components/UI';

export function LandingPage() {
  const { config } = useConfig();
  const navigate = useNavigate();

  const [specializations, setSpecializations] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = `${config.clinicName || 'AuraCare Health'} - Patient Appointment Booking`;
  }, [config.clinicName]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [specRes, docRes] = await Promise.all([
        API.get('/specializations'),
        API.get('/doctors?limit=4')
      ]);
      if (specRes.data.success) setSpecializations(specRes.data.data || []);
      if (docRes.data.success) setDoctors(docRes.data.data || []);
    } catch (err) {
      console.error('Failed to load landing page data:', err);
      setError('Unable to load clinical directory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4 max-w-3xl mx-auto leading-tight">
          Book Specialist Medical Care With Ease
        </h1>
        <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto mb-8 font-normal">
          Connect with certified healthcare professionals, check live consultation availability, and confirm your appointment online in minutes.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <Link
            to="/doctors"
            className="px-6 py-3.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            Find a Doctor
          </Link>
          <Link
            to="/login"
            className="px-6 py-3.5 bg-slate-200/80 hover:bg-slate-200 text-slate-800 border border-slate-300 font-semibold text-sm rounded-xl transition-all shadow-sm"
          >
            Sign In to Account
          </Link>
        </div>

        {/* Clinic Location & Info Notice */}
        {(config.clinicName || config.address || config.hours) && (
          <div className="bg-slate-200/60 border border-slate-300/70 p-5 rounded-2xl max-w-xl mx-auto text-xs text-slate-600 space-y-1 shadow-sm">
            {config.clinicName && <p className="font-bold text-slate-900 text-sm">{config.clinicName}</p>}
            {config.address && <p>📍 {config.address}</p>}
            {config.hours && <p>🕒 Clinic Hours: {config.hours}</p>}
            {config.phone && <p>📞 Phone: {config.phone}</p>}
          </div>
        )}
      </section>

      {/* How Booking Works */}
      <section className="bg-slate-200/40 border-y border-slate-300/60 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-10">Simple 3-Step Appointment Booking</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-slate-100 border border-slate-200 p-6 rounded-2xl shadow-sm">
              <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center mx-auto mb-4 text-base border border-teal-200">1</div>
              <h3 className="font-bold text-slate-900 mb-2">1. Choose a Specialist</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Browse experienced clinicians filtered by medical specialization and qualifications.</p>
            </div>
            <div className="bg-slate-100 border border-slate-200 p-6 rounded-2xl shadow-sm">
              <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center mx-auto mb-4 text-base border border-teal-200">2</div>
              <h3 className="font-bold text-slate-900 mb-2">2. Select a Time Slot</h3>
              <p className="text-xs text-slate-600 leading-relaxed">View live consultation slots up to {config.bookingWindowDays || 60} days in advance and pick your preferred time.</p>
            </div>
            <div className="bg-slate-100 border border-slate-200 p-6 rounded-2xl shadow-sm">
              <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center mx-auto mb-4 text-base border border-teal-200">3</div>
              <h3 className="font-bold text-slate-900 mb-2">3. Instant Confirmation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Receive instant confirmation and keep track of your consultation details from your patient portal.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Specializations Shortcuts */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Medical Specializations</h2>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : specializations.length === 0 ? (
          <EmptyState message="No specializations available yet." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {specializations.map(spec => (
              <button
                key={spec._id}
                onClick={() => navigate(`/doctors?specializationId=${spec._id}`)}
                className="p-4 bg-slate-200/60 border border-slate-300/70 hover:border-teal-500 rounded-2xl text-left transition-all shadow-sm hover:shadow-md"
              >
                <h3 className="font-bold text-sm text-slate-900">{spec.name}</h3>
                {spec.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{spec.description}</p>}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Featured Doctors Directory */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Featured Specialists</h2>
          <Link to="/doctors" className="text-xs font-bold text-teal-700 hover:text-teal-900 transition-colors">
            View All Specialists →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : doctors.length === 0 ? (
          <EmptyState message="No doctors available yet." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {doctors.map(doc => (
              <div key={doc.id} className="bg-slate-200/60 border border-slate-300/70 p-5 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <h3 className="font-bold text-base text-slate-900">{doc.name}</h3>
                  <p className="text-xs text-teal-700 font-semibold">{doc.specialization?.name || 'General Medicine'}</p>
                  <p className="text-xs text-slate-500 mt-2">{doc.qualification}</p>
                  <p className="text-xs text-slate-500">{doc.experience} years experience</p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800">
                    Fee: {doc.consultationFee ? `${doc.consultationFee}` : 'N/A'}
                  </span>
                  <Link
                    to={`/doctors?specializationId=${doc.specialization?.id || ''}`}
                    className="text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white px-3.5 py-1.5 rounded-lg transition-colors shadow-sm"
                  >
                    Book Slot
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
