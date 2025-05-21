import { useState, useEffect } from 'react';
import Head from 'next/head';
import Script from 'next/script';

export default function OnboardingPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    title: '',
    linkedin: '',
    instagram: '',
    facebook: '',
    twitter: '',
    colorPreference: '#007AFF',
    stylePackage: 'standard-professional',
    successDefinition: '',
    contentGoals: '',
    challenges: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [externalId, setExternalId] = useState('');
  const [calendlyLoaded, setCalendlyLoaded] = useState(false);

  // Get URL parameters on client side only
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const extId = urlParams.get('external_id');
    if (extId) {
      setExternalId(extId);
    }
  }, []);
  
  // Handle Calendly initialization - separate effect to avoid re-initialization
  useEffect(() => {
    // Only run once when component mounts
    if (calendlyLoaded) return;
    
    const initCalendly = () => {
      if (typeof window !== 'undefined' && window.Calendly) {
        console.log('Initializing Calendly widget...');
        const calendlyContainer = document.querySelector('.calendly-container');
        
        // Check if Calendly is already initialized in this container
        if (calendlyContainer && !calendlyContainer.querySelector('iframe')) {
          window.Calendly.initInlineWidget({
            url: 'https://calendly.com/vicsicard/30min?hide_gdpr_banner=1',
            parentElement: calendlyContainer,
            prefill: {
              name: formData.fullName,
              email: formData.email,
              customAnswers: {
                a1: formData.phone
              }
            },
            styles: {
              height: '750px'
            }
          });
          
          // Add loaded class to hide the loading message
          setTimeout(() => {
            if (calendlyContainer) {
              calendlyContainer.classList.add('loaded');
              setCalendlyLoaded(true);
            }
          }, 1500); // Short delay to ensure widget is fully loaded
        }
      } else {
        console.log('Calendly not loaded yet, retrying in 1 second...');
        setTimeout(initCalendly, 1000);
      }
    };
    
    // Clean up any existing Calendly scripts to avoid duplicates
    const existingScript = document.getElementById('calendly-script');
    if (existingScript) {
      existingScript.remove();
    }
    
    // Load Calendly script
    const script = document.createElement('script');
    script.id = 'calendly-script';
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    script.onload = initCalendly;
    document.body.appendChild(script);
    
    // Cleanup function
    return () => {
      // We don't remove the script on cleanup as it might be needed by other components
    };
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle color selection
  const handleColorSelect = (color, style) => {
    setFormData(prev => ({
      ...prev,
      colorPreference: color,
      stylePackage: style || prev.stylePackage
    }));
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.fullName.trim()) {
      errors.fullName = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      // Map form data to API format
      const apiData = {
        clientName: formData.fullName,
        clientEmail: formData.email,
        projectName: formData.title || `${formData.fullName}'s Brand Site`,
        phoneNumber: formData.phone,
        colorPreference: formData.colorPreference,
        stylePackage: formData.stylePackage,
        socialMedia: {
          linkedin: formData.linkedin || '',
          instagram: formData.instagram || '',
          facebook: formData.facebook || '',
          twitter: formData.twitter || ''
        },
        workshopResponses: {
          successDefinition: formData.successDefinition || '',
          contentGoals: formData.contentGoals || '',
          challenges: formData.challenges || ''
        }
      };

      const response = await fetch('/api/submit-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      
      // Track onboarding form submission with Meta Pixel if available
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Lead', {
          content_name: 'onboarding_complete',
          external_id: externalId
        });
      }
      
      // Show success message
      setSubmitSuccess(true);
      
      // Clear form
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        title: '',
        linkedin: '',
        instagram: '',
        facebook: '',
        twitter: '',
        colorPreference: '#007AFF',
        stylePackage: 'standard-professional',
        successDefinition: '',
        contentGoals: '',
        challenges: ''
      });
      
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitError(error.message || 'Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If form was successfully submitted, show success page
  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-surface">
        <Head>
          <title>Onboarding Complete | Self Cast Studios</title>
          <meta name="description" content="Self Cast Studios onboarding process" />
        </Head>
        
        <div className="onboarding-container">
          <div className="onboarding-header">
            <h2>Onboarding Complete!</h2>
            <p>Thank you for completing the onboarding process.</p>
          </div>

          <div className="onboarding-form">
            <div className="success-container">
              <svg
                className="success-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <h3 className="success-title">We've received your information</h3>
              <p className="success-message">
                Our team will be in touch with you shortly to discuss the next steps.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-surface">
      <Head>
        <title>Self Cast Studios | Onboarding</title>
        <meta name="description" content="Complete your onboarding process with Self Cast Studios" />
      </Head>
      
      {/* Brand Header */}
      <div className="brand-header">
        <div className="brand-header-inner">
          <a href="https://selfcaststudios.com" className="brand-logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="brand-logo-text">Self Cast Studios</span>
          </a>
        </div>
        <div className="accent-strip"></div>
      </div>
      
      {/* Facebook Pixel Code */}
      <Script
        id="fb-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '123456789012345'); // Replace with your actual Pixel ID
            fbq('track', 'PageView');
          `,
        }}
      />
      
      {/* Calendly Integration - Script is now loaded via useEffect */}
      
      <div className="onboarding-container">
        <div className="onboarding-header">
          <h1>Welcome to Self Cast Studios</h1>
          <p>Complete this form to begin your onboarding process</p>
        </div>
        
        <div className="onboarding-form">
          {submitError && (
            <div style={{ 
              marginBottom: '1.5rem', 
              padding: '1rem', 
              borderRadius: '0.5rem', 
              backgroundColor: 'rgba(255, 59, 48, 0.1)', 
              borderLeft: '4px solid var(--error-color)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0 }}>
                  <svg 
                    style={{ width: '1.25rem', height: '1.25rem', color: 'var(--error-color)' }} 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
                <div style={{ marginLeft: '0.75rem' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--error-color)' }}>
                    {submitError}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h3>Personal Information</h3>
              <p>Please provide your contact information.</p>
              
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="fullName">Full name *</label>
                  <input
                    type="text"
                    name="fullName"
                    id="fullName"
                    autoComplete="name"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={formErrors.fullName ? 'error' : ''}
                  />
                  {formErrors.fullName && (
                    <p className="error">{formErrors.fullName}</p>
                  )}
                </div>
                
                <div className="form-field">
                  <label htmlFor="title">Project title</label>
                  <input
                    type="text"
                    name="title"
                    id="title"
                    value={formData.title}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-field">
                  <label htmlFor="email">Email address *</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={formErrors.email ? 'error' : ''}
                  />
                  {formErrors.email && (
                    <p className="error">{formErrors.email}</p>
                  )}
                </div>
                
                <div className="form-field">
                  <label htmlFor="phone">Phone number *</label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className={formErrors.phone ? 'error' : ''}
                  />
                  {formErrors.phone && (
                    <p className="error">{formErrors.phone}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <h3>Social Media Profiles</h3>
              <p>Add your social media profiles to connect with your audience.</p>
              
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="linkedin">LinkedIn</label>
                  <input
                    type="text"
                    name="linkedin"
                    id="linkedin"
                    value={formData.linkedin}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-field">
                  <label htmlFor="instagram">Instagram</label>
                  <input
                    type="text"
                    name="instagram"
                    id="instagram"
                    value={formData.instagram}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-field">
                  <label htmlFor="facebook">Facebook</label>
                  <input
                    type="text"
                    name="facebook"
                    id="facebook"
                    value={formData.facebook}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-field">
                  <label htmlFor="twitter">Twitter</label>
                  <input
                    type="text"
                    name="twitter"
                    id="twitter"
                    value={formData.twitter}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <h3>Brand Preferences</h3>
              <p>Select your preferred color scheme and style.</p>
              
              <div className="form-field">
                <label>Color Preference</label>
                <div className="color-options">
                  {['#007AFF', '#1a1a1a', '#10b981', '#8b5cf6', '#ef4444'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleColorSelect(color)}
                      className={`color-option ${formData.colorPreference === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </div>
              
              <div className="form-field">
                <label>Style Package</label>
                <div className="style-options">
                  <div className="style-option">
                    <input
                      id="standard-professional"
                      name="stylePackage"
                      type="radio"
                      value="standard-professional"
                      checked={formData.stylePackage === 'standard-professional'}
                      onChange={() => handleColorSelect(formData.colorPreference, 'standard-professional')}
                    />
                    <label htmlFor="standard-professional">Standard Professional</label>
                  </div>
                  <div className="style-option">
                    <input
                      id="modern-minimal"
                      name="stylePackage"
                      type="radio"
                      value="modern-minimal"
                      checked={formData.stylePackage === 'modern-minimal'}
                      onChange={() => handleColorSelect(formData.colorPreference, 'modern-minimal')}
                    />
                    <label htmlFor="modern-minimal">Modern Minimal</label>
                  </div>
                  <div className="style-option">
                    <input
                      id="bold-creative"
                      name="stylePackage"
                      type="radio"
                      value="bold-creative"
                      checked={formData.stylePackage === 'bold-creative'}
                      onChange={() => handleColorSelect(formData.colorPreference, 'bold-creative')}
                    />
                    <label htmlFor="bold-creative">Bold Creative</label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <h3>Workshop Questions</h3>
              <p>These questions help us prepare for our initial workshop session.</p>
              
              <div className="form-field">
                <label htmlFor="successDefinition">How do you define success for your personal brand?</label>
                <textarea
                  id="successDefinition"
                  name="successDefinition"
                  rows={3}
                  value={formData.successDefinition}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-field">
                <label htmlFor="contentGoals">What are your main content goals?</label>
                <textarea
                  id="contentGoals"
                  name="contentGoals"
                  rows={3}
                  value={formData.contentGoals}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-field">
                <label htmlFor="challenges">What challenges are you facing with your current online presence?</label>
                <textarea
                  id="challenges"
                  name="challenges"
                  rows={3}
                  value={formData.challenges}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="form-section">
              <h3>Schedule Your Workshop Interview</h3>
              <p>Select a time for your initial workshop interview.</p>
              
              <div className="calendly-container" style={{ minHeight: '750px' }}></div>
            </div>
            
            <div style={{ marginTop: '2rem', textAlign: 'right' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                className="submit-button"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
