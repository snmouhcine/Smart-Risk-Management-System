import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import AdminLayout from './AdminLayout';
import { BookText, Save, Loader2, AlertTriangle, Image as ImageIcon, Plus, X, Globe, Code } from 'lucide-react';

// Un composant réutilisable pour les champs de texte traduisibles
const TranslatableInput = ({ label, settings, fieldKey, handleValueChange }) => (
  <div>
    <label className="block text-lg font-semibold text-white mb-3">{label}</label>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">Français</label>
        <input 
          type="text"
          className="w-full p-2 bg-gray-700 rounded-md text-white"
          value={settings[fieldKey]?.fr || ''}
          onChange={(e) => handleValueChange(fieldKey, 'fr', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">Anglais</label>
        <input 
          type="text"
          className="w-full p-2 bg-gray-700 rounded-md text-white"
          value={settings[fieldKey]?.en || ''}
          onChange={(e) => handleValueChange(fieldKey, 'en', e.target.value)}
        />
      </div>
    </div>
  </div>
);

const AdminContentManagement = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('site_settings').select('*').eq('category', 'landing_page');
      if (error) throw error;
      
      const settingsMap = data.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});
      setSettings(settingsMap);
    } catch (error) {
      console.error('Error fetching site settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        category: 'landing_page'
      }));

      const { error } = await supabase.from('site_settings').upsert(updates, {
        onConflict: 'key'
      });

      if (error) throw error;
      alert('Contenu sauvegardé avec succès !');

    } catch (error) {
      console.error('Error saving site settings:', error);
      alert('Une erreur est survenue lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };
  
  const handleValueChange = (key, lang, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}), // Conserve les autres langues
        [lang]: value
      }
    }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white flex items-center">
            <BookText className="mr-3 h-6 w-6 text-purple-400" />
            Gestion du Contenu (Landing Page)
          </h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            <span>Sauvegarder les Modifications</span>
          </button>
        </div>
        
        <div className="space-y-6 bg-gray-800/50 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-bold text-white border-b border-gray-700 pb-3 mb-4">Section "Hero"</h2>
          
          <TranslatableInput label="Badge" fieldKey="hero_badge" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Titre Principal" fieldKey="hero_title" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Titre Principal (partie colorée)" fieldKey="hero_title_highlight" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Sous-titre" fieldKey="hero_subtitle" settings={settings} handleValueChange={handleValueChange} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TranslatableInput label="Bouton CTA Principal" fieldKey="hero_cta_main" settings={settings} handleValueChange={handleValueChange} />
            <TranslatableInput label="Bouton CTA Secondaire" fieldKey="hero_cta_secondary" settings={settings} handleValueChange={handleValueChange} />
          </div>

          <div>
            <label className="block text-lg font-semibold text-white mb-3">Indicateurs de Confiance</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TranslatableInput label="Indicateur 1" fieldKey="hero_trust_1" settings={settings} handleValueChange={handleValueChange} />
              <TranslatableInput label="Indicateur 2" fieldKey="hero_trust_2" settings={settings} handleValueChange={handleValueChange} />
              <TranslatableInput label="Indicateur 3" fieldKey="hero_trust_3" settings={settings} handleValueChange={handleValueChange} />
            </div>
          </div>
        </div>

        {/* Espace pour les autres sections (Features, Benefits, etc.) */}

      </div>
    </AdminLayout>
  );
};

export default AdminContentManagement;
