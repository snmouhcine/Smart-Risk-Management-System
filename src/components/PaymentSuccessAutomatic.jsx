import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const PaymentSuccessAutomatic = () => {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const [status, setStatus] = useState('activating'); // 'activating', 'success', 'error'
  const pollerRef = useRef(null);

  useEffect(() => {
    const MAX_ATTEMPTS = 10; // 10 attempts * 2 seconds = 20 seconds timeout
    let attempts = 0;

    const pollSubscriptionStatus = async () => {
      attempts++;
      
      // Refresh profile data from the database
      await refreshProfile();
      
      // After refresh, check the new profile status
      // We need to get the latest profile state, so we check it directly after refresh
      const { data: updatedProfile, error } = await supabase
        .from('user_profiles')
        .select('subscription_status')
        .eq('id', profile.id)
        .single();
        
      if (updatedProfile?.subscription_status === 'active') {
        setStatus('success');
        clearInterval(pollerRef.current);
        
        setTimeout(() => {
          navigate('/app');
        }, 2000);

      } else if (attempts >= MAX_ATTEMPTS) {
        setStatus('error');
        clearInterval(pollerRef.current);
      }
    };

    if (profile && profile.subscription_status !== 'active') {
      pollerRef.current = setInterval(pollSubscriptionStatus, 2000);
    } else if (profile?.subscription_status === 'active') {
        // Already active, navigate away
        setStatus('success');
        setTimeout(() => {
          navigate('/app');
        }, 1000);
    }

    return () => {
      if (pollerRef.current) {
        clearInterval(pollerRef.current);
      }
    };
  }, [profile, refreshProfile, navigate]);
  
  // Render logic based on status
  if (status === 'activating') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white text-lg">Activation de votre abonnement...</p>
          <p className="text-blue-200 text-sm mt-2">Veuillez patienter, cela peut prendre quelques secondes.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
       <div className="min-h-screen bg-gradient-to-br from-red-900 via-gray-900 to-red-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Activation en attente</h2>
          <p className="text-gray-300 mb-6">
            Votre paiement a été reçu, mais nous attendons la confirmation finale pour activer votre compte.
          </p>
           <button
            onClick={() => navigate('/app')}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg mb-4"
          >
            Vérifier mon statut
          </button>
          <p className="text-xs text-gray-500">Si le problème persiste, veuillez contacter le support.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <CheckCircle className="h-10 w-10 text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Abonnement Actif!</h1>
        <div className="mb-6">
          <Sparkles className="h-6 w-6 text-yellow-400 inline mr-2" />
          <p className="text-gray-300 inline">
            Vous avez maintenant accès à toutes les fonctionnalités.
          </p>
        </div>
        <p className="text-gray-400 mb-8">
          Redirection automatique...
        </p>
         <button
          onClick={() => navigate('/app')}
          className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg"
        >
          Accéder au Tableau de Bord
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccessAutomatic;