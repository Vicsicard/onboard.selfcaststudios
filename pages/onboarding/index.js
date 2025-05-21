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
    colorPreference: '#4a6fa5',
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

  // Get URL parameters on client side only
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const extId = urlParams.get('external_id');
    if (extId) {
      setExternalId(extId);
    }
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
      stylePackage: style
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
        colorPreference: '#4a6fa5',
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
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <Head>
          <title>Onboarding Complete | Self Cast Studios</title>
          <meta name="description" content="Self Cast Studios onboarding process" />
        </Head>
        
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Onboarding Complete!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Thank you for completing the onboarding process.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                We've received your information
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Our team will be in touch with you shortly to discuss the next steps.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Self Cast Studios | Onboarding</title>
        <meta name="description" content="Complete your onboarding process with Self Cast Studios" />
      </Head>
      
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
      
      {/* Calendly Integration */}
      <Script
        id="calendly-widget"
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="afterInteractive"
        onLoad={() => {
          // Initialize Calendly after script loads
          if (typeof window !== 'undefined' && window.Calendly) {
            window.Calendly.initInlineWidget({
              url: 'https://calendly.com/selfcaststudios/workshop-interview?hide_gdpr_banner=1',
              parentElement: document.querySelector('.calendly-inline-widget'),
              prefill: {},
              utm: {}
            });
          }
        }}
      />
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Welcome to Self Cast Studios
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Complete this form to begin your onboarding process
          </p>
        </div>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {submitError && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      {submitError}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200">
              <div className="space-y-8 divide-y divide-gray-200">
                <div>
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Personal Information
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Please provide your contact information.
                    </p>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                        Full name *
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="fullName"
                          id="fullName"
                          autoComplete="name"
                          value={formData.fullName}
                          onChange={handleChange}
                          className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${formErrors.fullName ? 'border-red-300' : ''}`}
                        />
                        {formErrors.fullName && (
                          <p className="mt-2 text-sm text-red-600">{formErrors.fullName}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Project title
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="title"
                          id="title"
                          value={formData.title}
                          onChange={handleChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-4">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email address *
                      </label>
                      <div className="mt-1">
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${formErrors.email ? 'border-red-300' : ''}`}
                        />
                        {formErrors.email && (
                          <p className="mt-2 text-sm text-red-600">{formErrors.email}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Phone number *
                      </label>
                      <div className="mt-1">
                        <input
                          type="tel"
                          name="phone"
                          id="phone"
                          autoComplete="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${formErrors.phone ? 'border-red-300' : ''}`}
                        />
                        {formErrors.phone && (
                          <p className="mt-2 text-sm text-red-600">{formErrors.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-8">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Social Media Profiles
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Add your social media profiles to connect with your audience.
                    </p>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700">
                        LinkedIn
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="linkedin"
                          id="linkedin"
                          value={formData.linkedin}
                          onChange={handleChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor="instagram" className="block text-sm font-medium text-gray-700">
                        Instagram
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="instagram"
                          id="instagram"
                          value={formData.instagram}
                          onChange={handleChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor="facebook" className="block text-sm font-medium text-gray-700">
                        Facebook
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="facebook"
                          id="facebook"
                          value={formData.facebook}
                          onChange={handleChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor="twitter" className="block text-sm font-medium text-gray-700">
                        Twitter
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="twitter"
                          id="twitter"
                          value={formData.twitter}
                          onChange={handleChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-8">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Brand Preferences
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Select your preferred color scheme and style.
                    </p>
                  </div>
                  
                  <div className="mt-6">
                    <fieldset>
                      <legend className="text-base font-medium text-gray-900">Color Preference</legend>
                      <div className="mt-4 space-y-4">
                        <div className="flex items-center space-x-3">
                          {['#4a6fa5', '#6b7280', '#10b981', '#8b5cf6', '#ef4444'].map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => handleColorSelect(color, formData.stylePackage)}
                              className={`h-8 w-8 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                                formData.colorPreference === color ? 'ring-2 ring-offset-2 ring-indigo-500' : ''
                              }`}
                              style={{ backgroundColor: color }}
                              aria-label={`Select color ${color}`}
                            />
                          ))}
                        </div>
                      </div>
                    </fieldset>
                    
                    <fieldset className="mt-6">
                      <legend className="text-base font-medium text-gray-900">Style Package</legend>
                      <div className="mt-4 space-y-4">
                        <div className="flex items-center">
                          <input
                            id="standard-professional"
                            name="stylePackage"
                            type="radio"
                            value="standard-professional"
                            checked={formData.stylePackage === 'standard-professional'}
                            onChange={() => handleColorSelect(formData.colorPreference, 'standard-professional')}
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                          />
                          <label htmlFor="standard-professional" className="ml-3 block text-sm font-medium text-gray-700">
                            Standard Professional
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="modern-minimal"
                            name="stylePackage"
                            type="radio"
                            value="modern-minimal"
                            checked={formData.stylePackage === 'modern-minimal'}
                            onChange={() => handleColorSelect(formData.colorPreference, 'modern-minimal')}
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                          />
                          <label htmlFor="modern-minimal" className="ml-3 block text-sm font-medium text-gray-700">
                            Modern Minimal
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="bold-creative"
                            name="stylePackage"
                            type="radio"
                            value="bold-creative"
                            checked={formData.stylePackage === 'bold-creative'}
                            onChange={() => handleColorSelect(formData.colorPreference, 'bold-creative')}
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                          />
                          <label htmlFor="bold-creative" className="ml-3 block text-sm font-medium text-gray-700">
                            Bold Creative
                          </label>
                        </div>
                      </div>
                    </fieldset>
                  </div>
                </div>
                
                <div className="pt-8">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Workshop Questions
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      These questions help us prepare for our initial workshop session.
                    </p>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-6">
                      <label htmlFor="successDefinition" className="block text-sm font-medium text-gray-700">
                        How do you define success for your personal brand?
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="successDefinition"
                          name="successDefinition"
                          rows={3}
                          value={formData.successDefinition}
                          onChange={handleChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-6">
                      <label htmlFor="contentGoals" className="block text-sm font-medium text-gray-700">
                        What are your main content goals?
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="contentGoals"
                          name="contentGoals"
                          rows={3}
                          value={formData.contentGoals}
                          onChange={handleChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-6">
                      <label htmlFor="challenges" className="block text-sm font-medium text-gray-700">
                        What challenges are you facing with your current online presence?
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="challenges"
                          name="challenges"
                          rows={3}
                          value={formData.challenges}
                          onChange={handleChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-8">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Schedule Your Workshop Interview
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Select a time for your initial workshop interview.
                    </p>
                  </div>
                  
                  <div className="mt-6">
                    <div 
                      className="calendly-inline-widget" 
                      data-url="https://calendly.com/selfcaststudios/workshop-interview?hide_gdpr_banner=1"
                      style={{ minWidth: '320px', height: '630px' }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="pt-5">
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                      isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
