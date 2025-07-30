import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import AdminLayout from './AdminLayout';
import { BookText, Save, Loader2, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { defaultLandingContent } from '../../constants/defaultContent';

// Composant réutilisable pour une section de contenu
const ContentSection = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {isOpen ? <ChevronUp /> : <ChevronDown />}
      </button>
      {isOpen && <div className="mt-6 space-y-6 border-t border-gray-700 pt-6">{children}</div>}
    </div>
  );
};

// Composant réutilisable pour les champs de texte traduisibles
const TranslatableInput = ({ label, settings, fieldKey, handleValueChange, type = 'input' }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-300 mb-2">{label}</label>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {['fr', 'en'].map(lang => (
        <div key={lang}>
          <label className="block text-xs font-medium text-gray-400 mb-1">{lang.toUpperCase()}</label>
          {type === 'textarea' ? (
            <textarea
              className="w-full p-2 bg-gray-700 rounded-md text-white h-24"
              value={settings[fieldKey]?.[lang] || ''}
              onChange={(e) => handleValueChange(fieldKey, lang, e.target.value)}
            />
          ) : (
            <input 
              type="text"
              className="w-full p-2 bg-gray-700 rounded-md text-white"
              value={settings[fieldKey]?.[lang] || ''}
              onChange={(e) => handleValueChange(fieldKey, lang, e.target.value)}
            />
          )}
        </div>
      ))}
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
      
      const dbSettings = data.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});

      // Fusionne les valeurs par défaut avec celles de la BDD pour pré-remplir
      const mergedSettings = { ...defaultLandingContent };
      for (const key in mergedSettings) {
        if (dbSettings[key]) {
          mergedSettings[key] = { ...mergedSettings[key], ...dbSettings[key] };
        }
      }
      
      setSettings(mergedSettings);

    } catch (error) {
      console.error('Error fetching site settings:', error);
      setSettings(defaultLandingContent); // Fallback to defaults on error
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

      const { error } = await supabase.from('site_settings').upsert(updates, { onConflict: 'key' });
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
    setSettings(prev => ({ ...prev, [key]: { ...(prev[key] || {}), [lang]: value } }));
  };

  if (loading) return <AdminLayout><div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-white" /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="p-6 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white flex items-center"><BookText className="mr-3 h-6 w-6 text-purple-400" />Gestion du Contenu (Landing Page)</h1>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2 disabled:opacity-50">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            <span>Sauvegarder les Modifications</span>
          </button>
        </div>
        
        <ContentSection title="Section Hero">
          <TranslatableInput label="Badge" fieldKey="hero_badge" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Titre Principal" fieldKey="hero_title" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Titre Principal (partie colorée)" fieldKey="hero_title_highlight" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Sous-titre" fieldKey="hero_subtitle" settings={settings} handleValueChange={handleValueChange} type="textarea"/>
          <TranslatableInput label="Bouton CTA Principal" fieldKey="hero_cta_main" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Bouton CTA Secondaire" fieldKey="hero_cta_secondary" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Indicateur de Confiance 1" fieldKey="hero_trust_1" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Indicateur de Confiance 2" fieldKey="hero_trust_2" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Indicateur de Confiance 3" fieldKey="hero_trust_3" settings={settings} handleValueChange={handleValueChange} />
        </ContentSection>
        
        <ContentSection title="Section Features">
          <TranslatableInput label="Titre" fieldKey="features_title" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Titre (partie colorée)" fieldKey="features_title_highlight" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Sous-titre" fieldKey="features_subtitle" settings={settings} handleValueChange={handleValueChange} type="textarea" />
        </ContentSection>
        
        <ContentSection title="Section Benefits">
           <TranslatableInput label="Titre" fieldKey="benefits_title" settings={settings} handleValueChange={handleValueChange} />
           <TranslatableInput label="Titre (partie colorée)" fieldKey="benefits_title_highlight" settings={settings} handleValueChange={handleValueChange} />
           <TranslatableInput label="Sous-titre" fieldKey="benefits_subtitle" settings={settings} handleValueChange={handleValueChange} type="textarea" />
        </ContentSection>
        
        <ContentSection title="Section Pricing">
           <TranslatableInput label="Titre" fieldKey="pricing_title" settings={settings} handleValueChange={handleValueChange} />
           <TranslatableInput label="Titre (partie colorée)" fieldKey="pricing_title_highlight" settings={settings} handleValueChange={handleValueChange} />
           <TranslatableInput label="Sous-titre" fieldKey="pricing_subtitle" settings={settings} handleValueChange={handleValueChange} type="textarea" />
           <TranslatableInput label="Badge 'Most Popular'" fieldKey="pricing_popular_badge" settings={settings} handleValueChange={handleValueChange} />
           <TranslatableInput label="Texte du bouton" fieldKey="pricing_cta_button" settings={settings} handleValueChange={handleValueChange} />
           <TranslatableInput label="Garantie" fieldKey="pricing_guarantee" settings={settings} handleValueChange={handleValueChange} />
        </ContentSection>

        {/* Feature Boxes */}
        <ContentSection title="Feature 1: AI-Powered Analysis">
          <TranslatableInput label="Titre" fieldKey="feature_1_title" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Description" fieldKey="feature_1_description" settings={settings} handleValueChange={handleValueChange} type="textarea" />
          <TranslatableInput label="Point 1" fieldKey="feature_1_item_1" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Point 2" fieldKey="feature_1_item_2" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Point 3" fieldKey="feature_1_item_3" settings={settings} handleValueChange={handleValueChange} />
        </ContentSection>

        <ContentSection title="Feature 2: Smart Risk Management">
          <TranslatableInput label="Titre" fieldKey="feature_2_title" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Description" fieldKey="feature_2_description" settings={settings} handleValueChange={handleValueChange} type="textarea" />
          <TranslatableInput label="Point 1" fieldKey="feature_2_item_1" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Point 2" fieldKey="feature_2_item_2" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Point 3" fieldKey="feature_2_item_3" settings={settings} handleValueChange={handleValueChange} />
        </ContentSection>

        <ContentSection title="Feature 3: Advanced Journal">
          <TranslatableInput label="Titre" fieldKey="feature_3_title" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Description" fieldKey="feature_3_description" settings={settings} handleValueChange={handleValueChange} type="textarea" />
          <TranslatableInput label="Point 1" fieldKey="feature_3_item_1" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Point 2" fieldKey="feature_3_item_2" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Point 3" fieldKey="feature_3_item_3" settings={settings} handleValueChange={handleValueChange} />
        </ContentSection>

        <ContentSection title="Feature 4: Real-Time Analytics">
          <TranslatableInput label="Titre" fieldKey="feature_4_title" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Description" fieldKey="feature_4_description" settings={settings} handleValueChange={handleValueChange} type="textarea" />
          <TranslatableInput label="Point 1" fieldKey="feature_4_item_1" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Point 2" fieldKey="feature_4_item_2" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Point 3" fieldKey="feature_4_item_3" settings={settings} handleValueChange={handleValueChange} />
        </ContentSection>

        <ContentSection title="Feature 5: Trading Checklist">
          <TranslatableInput label="Titre" fieldKey="feature_5_title" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Description" fieldKey="feature_5_description" settings={settings} handleValueChange={handleValueChange} type="textarea" />
          <TranslatableInput label="Point 1" fieldKey="feature_5_item_1" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Point 2" fieldKey="feature_5_item_2" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Point 3" fieldKey="feature_5_item_3" settings={settings} handleValueChange={handleValueChange} />
        </ContentSection>

        <ContentSection title="Feature 6: Position Calculator">
          <TranslatableInput label="Titre" fieldKey="feature_6_title" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Description" fieldKey="feature_6_description" settings={settings} handleValueChange={handleValueChange} type="textarea" />
          <TranslatableInput label="Point 1" fieldKey="feature_6_item_1" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Point 2" fieldKey="feature_6_item_2" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Point 3" fieldKey="feature_6_item_3" settings={settings} handleValueChange={handleValueChange} />
        </ContentSection>

        {/* Benefit Boxes */}
        <ContentSection title="Benefit 1: Win Rate">
          <TranslatableInput label="Titre" fieldKey="benefit_1_title" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Description" fieldKey="benefit_1_description" settings={settings} handleValueChange={handleValueChange} type="textarea" />
        </ContentSection>

        <ContentSection title="Benefit 2: Capital Protection">
          <TranslatableInput label="Titre" fieldKey="benefit_2_title" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Description" fieldKey="benefit_2_description" settings={settings} handleValueChange={handleValueChange} type="textarea" />
        </ContentSection>

        <ContentSection title="Benefit 3: Learning">
          <TranslatableInput label="Titre" fieldKey="benefit_3_title" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Description" fieldKey="benefit_3_description" settings={settings} handleValueChange={handleValueChange} type="textarea" />
        </ContentSection>

        <ContentSection title="Benefit 4: Time Saving">
          <TranslatableInput label="Titre" fieldKey="benefit_4_title" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Description" fieldKey="benefit_4_description" settings={settings} handleValueChange={handleValueChange} type="textarea" />
        </ContentSection>

        {/* ROI Calculator */}
        <ContentSection title="ROI Calculator">
          <TranslatableInput label="Titre" fieldKey="roi_calculator_title" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Label 1" fieldKey="roi_calculator_label_1" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Label 2" fieldKey="roi_calculator_label_2" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Label 3" fieldKey="roi_calculator_label_3" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Disclaimer" fieldKey="roi_calculator_disclaimer" settings={settings} handleValueChange={handleValueChange} />
        </ContentSection>

        {/* Testimonials Section */}
        <ContentSection title="Section Testimonials">
          <TranslatableInput label="Titre" fieldKey="testimonials_title" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Titre (partie colorée)" fieldKey="testimonials_title_highlight" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Sous-titre" fieldKey="testimonials_subtitle" settings={settings} handleValueChange={handleValueChange} type="textarea" />
        </ContentSection>

        {/* Individual Testimonials */}
        <ContentSection title="Testimonial 1">
          <TranslatableInput label="Texte" fieldKey="testimonial_1_text" settings={settings} handleValueChange={handleValueChange} type="textarea" />
          <TranslatableInput label="Nom" fieldKey="testimonial_1_name" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Rôle" fieldKey="testimonial_1_role" settings={settings} handleValueChange={handleValueChange} />
        </ContentSection>

        <ContentSection title="Testimonial 2">
          <TranslatableInput label="Texte" fieldKey="testimonial_2_text" settings={settings} handleValueChange={handleValueChange} type="textarea" />
          <TranslatableInput label="Nom" fieldKey="testimonial_2_name" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Rôle" fieldKey="testimonial_2_role" settings={settings} handleValueChange={handleValueChange} />
        </ContentSection>

        <ContentSection title="Testimonial 3">
          <TranslatableInput label="Texte" fieldKey="testimonial_3_text" settings={settings} handleValueChange={handleValueChange} type="textarea" />
          <TranslatableInput label="Nom" fieldKey="testimonial_3_name" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Rôle" fieldKey="testimonial_3_role" settings={settings} handleValueChange={handleValueChange} />
        </ContentSection>

        {/* Final CTA Section */}
        <ContentSection title="Section CTA Final">
          <TranslatableInput label="Titre" fieldKey="final_cta_title" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Sous-titre" fieldKey="final_cta_subtitle" settings={settings} handleValueChange={handleValueChange} type="textarea" />
          <TranslatableInput label="Bouton 1" fieldKey="final_cta_button1" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Bouton 2" fieldKey="final_cta_button2" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Sous-texte" fieldKey="final_cta_subtext" settings={settings} handleValueChange={handleValueChange} />
        </ContentSection>

        {/* Footer Section */}
        <ContentSection title="Footer">
          <TranslatableInput label="Description" fieldKey="footer_description" settings={settings} handleValueChange={handleValueChange} type="textarea" />
          <TranslatableInput label="Copyright" fieldKey="footer_copyright" settings={settings} handleValueChange={handleValueChange} />
        </ContentSection>

        <ContentSection title="Footer Section 1: Produit">
          <TranslatableInput label="Titre" fieldKey="footer_section_1_title" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Lien 1" fieldKey="footer_section_1_link_1" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Lien 2" fieldKey="footer_section_1_link_2" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Lien 3" fieldKey="footer_section_1_link_3" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Lien 4" fieldKey="footer_section_1_link_4" settings={settings} handleValueChange={handleValueChange} />
        </ContentSection>

        <ContentSection title="Footer Section 2: Entreprise">
          <TranslatableInput label="Titre" fieldKey="footer_section_2_title" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Lien 1" fieldKey="footer_section_2_link_1" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Lien 2" fieldKey="footer_section_2_link_2" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Lien 3" fieldKey="footer_section_2_link_3" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Lien 4" fieldKey="footer_section_2_link_4" settings={settings} handleValueChange={handleValueChange} />
        </ContentSection>

        <ContentSection title="Footer Section 3: Légal">
          <TranslatableInput label="Titre" fieldKey="footer_section_3_title" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Lien 1" fieldKey="footer_section_3_link_1" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Lien 2" fieldKey="footer_section_3_link_2" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Lien 3" fieldKey="footer_section_3_link_3" settings={settings} handleValueChange={handleValueChange} />
          <TranslatableInput label="Lien 4" fieldKey="footer_section_3_link_4" settings={settings} handleValueChange={handleValueChange} />
        </ContentSection>

      </div>
    </AdminLayout>
  );
};

export default AdminContentManagement;
