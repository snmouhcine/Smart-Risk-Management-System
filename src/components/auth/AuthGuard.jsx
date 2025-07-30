import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { createCheckoutSession, stripePromise } from '../../lib/stripe'
import { Loader2, CreditCard, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const AuthGuard = ({ children }) => {
  const { user, loading, profile, profileLoading } = useAuth()
  
  console.log('[AuthGuard] State:', { loading, profileLoading, user: !!user, profile: !!profile })
  
  // Affichage de chargement pendant la vérification d'authentification
  if (loading || profileLoading) {
    console.log('[AuthGuard] Showing loading screen...')
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white text-lg">Chargement...</p>
          <p className="text-blue-200 text-sm mt-2">Vérification de l'authentification</p>
        </div>
      </div>
    )
  }

  // Si l'utilisateur n'est pas connecté, rediriger vers la page d'auth
  if (!user) {
    console.log('[AuthGuard] No user, redirecting to /auth')
    return <Navigate to="/auth" replace />
  }

  // Check subscription status (exempt admin users)
  // If profile is null or user is not subscribed (and not admin), show payment required
  console.log('[AuthGuard] User is authenticated, checking profile/subscription...')
  if (!profile || ((!profile.is_subscribed || profile.subscription_status !== 'active') && profile.role !== 'admin')) {
    
    // Pour le débogage :
    if (!profile) {
      console.warn('[AuthGuard] Profile is null. This might indicate an issue with profile fetching.')
    } else {
      console.log(`[AuthGuard] Subscription check: is_subscribed=${profile.is_subscribed}, role=${profile.role}`)
    }
    // Special case: if profile is null and it's still loading, wait
    if (!profile && profileLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
            <p className="text-white text-lg">Vérification du profil...</p>
          </div>
        </div>
      )
    }
    
    const [plans, setPlans] = React.useState([]);
    const [isLoadingPlans, setIsLoadingPlans] = React.useState(true);
    const [isRedirecting, setIsRedirecting] = React.useState(false);

    React.useEffect(() => {
      const fetchPlans = async () => {
        setIsLoadingPlans(true);
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('is_active', true)
          .order('price', { ascending: true });

        if (error) {
          console.error("Erreur lors de la récupération des plans:", error);
        } else {
          setPlans(data);
        }
        setIsLoadingPlans(false);
      };

      fetchPlans();
    }, []);

    const handleSubscribeClick = async (priceId) => {
      if (!priceId) {
        alert("L'ID du prix Stripe de ce plan n'est pas configuré.");
        return;
      }
      setIsRedirecting(true);
      try {
        const session = await createCheckoutSession(priceId, user.email, user.id);
        if (session && session.sessionId) {
          const stripe = await stripePromise;
          await stripe.redirectToCheckout({ sessionId: session.sessionId });
        } else {
           alert("Impossible de créer la session de paiement.");
        }
      } catch (error) {
        console.error("Erreur lors du processus d'abonnement:", error);
        alert("Une erreur est survenue. Veuillez réessayer.");
      }
      setIsRedirecting(false);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-yellow-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Abonnement Requis</h2>
          <p className="text-gray-300 mb-6">
            Choisissez un plan pour accéder à la plateforme.
          </p>
          
          <div className="space-y-4">
            {isLoadingPlans ? (
              <div className="flex justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            ) : (
              plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => handleSubscribeClick(plan.stripe_price_id)}
                  disabled={isRedirecting || !plan.stripe_price_id}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRedirecting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <CreditCard className="h-5 w-5" />
                  )}
                  <span>{plan.name} - {plan.price}€</span>
                </button>
              ))
            )}
          </div>
          
          <button
            onClick={() => {
              supabase.auth.signOut()
              window.location.href = '/'
            }}
            className="mt-8 text-gray-400 hover:text-white transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    )
  }

  // Si l'utilisateur est connecté et abonné, afficher l'application
  return children
}

export default AuthGuard