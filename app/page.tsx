'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Footer from '@/components/Footer';
import HeroBackground from './components/HeroBackground';

export default function HomePage() {
  const { isSignedIn, user } = useUser();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white overflow-hidden">
        <HeroBackground />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              Kisan Sahayak
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-green-100 max-w-3xl mx-auto">
              Your AI-powered farming companion for disease detection, crop recommendations, and agricultural insights
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/plant-disease" 
                className="px-8 py-4 bg-white text-green-700 rounded-lg font-semibold hover:bg-gray-100 transform transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Start Using AI
              </Link>
              {isSignedIn && (
                <Link 
                  href="/dashboard" 
                  className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-green-700 transform transition-all duration-300 hover:scale-105"
                >
                  View Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{transitionDelay: '200ms'}}>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features for Modern Farming</h2>
            <p className="text-lg text-gray-600 mb-12">
              AI-powered tools designed to increase your agricultural productivity and profitability
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Disease Detection */}
            <div className={`group bg-white rounded-xl shadow-lg p-8 transition-all duration-1000 transform hover:scale-105 hover:shadow-2xl hover:bg-green-50 border border-gray-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{transitionDelay: '300ms'}}>
              <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:bg-green-200 overflow-hidden">
                <img 
                  src="/images/diseasedetection.png" 
                  alt="AI Disease Detection" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors duration-300">AI Disease Detection</h3>
              <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                Upload plant images and get instant AI-powered disease diagnosis with treatment recommendations
              </p>
            </div>

            {/* Crop Recommendation */}
            <div className={`group bg-white rounded-xl shadow-lg p-8 transition-all duration-1000 transform hover:scale-105 hover:shadow-2xl hover:bg-green-50 border border-gray-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{transitionDelay: '400ms'}}>
              <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:bg-green-200 overflow-hidden">
                <img 
                  src="/images/croprecom.png" 
                  alt="Smart Crop Recommendations" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors duration-300">Smart Crop Recommendations</h3>
              <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                Personalized crop recommendations based on your location, soil type, and seasonal conditions
              </p>
            </div>

            {/* AI Assistant Chatbot */}
            <div className={`group bg-white rounded-xl shadow-lg p-8 transition-all duration-1000 transform hover:scale-105 hover:shadow-2xl hover:bg-green-50 border border-gray-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{transitionDelay: '500ms'}}>
              <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:bg-green-200 overflow-hidden">
                <img 
                  src="/images/aIchatbot.png" 
                  alt="AI Assistant Chatbot" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors duration-300">AI Assistant Chatbot</h3>
              <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                Get expert farming advice and answers to your agricultural questions anytime
              </p>
            </div>

            {/* Offline Support */}
            <div className={`group bg-white rounded-xl shadow-lg p-8 transition-all duration-1000 transform hover:scale-105 hover:shadow-2xl hover:bg-green-50 border border-gray-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{transitionDelay: '600ms'}}>
              <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:bg-green-200 overflow-hidden">
                <img 
                  src="/images/offlinesupport.png" 
                  alt="Offline Support" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors duration-300">Offline Support</h3>
              <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                Access essential features even without internet connection for uninterrupted farming assistance
              </p>
            </div>

            {/* Multilingual Support */}
            <div className={`group bg-white rounded-xl shadow-lg p-8 transition-all duration-1000 transform hover:scale-105 hover:shadow-2xl hover:bg-green-50 border border-gray-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{transitionDelay: '700ms'}}>
              <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:bg-green-200 overflow-hidden">
                <img 
                  src="/images/Multilingualsupport.png" 
                  alt="Multilingual Support" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors duration-300">Multilingual Support</h3>
              <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                Available in multiple Indian languages including Hindi, Tamil, Telugu, and more
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-green-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '24/7', label: 'AI assistance for farming questions' },
              { value: '12+', label: 'Indian languages supported' },
              { value: '3', label: 'Core workflows in one platform' },
              { value: 'Free', label: 'Access plan for students and farmers' }
            ].map((item, index) => (
              <div key={item.label} className={`rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg transition-all duration-1000 hover:-translate-y-1 hover:bg-white/10 hover:shadow-2xl ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: `${350 + index * 100}ms` }}>
                <div className="text-3xl font-bold text-green-200 mb-2">{item.value}</div>
                <p className="text-sm text-green-50">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-14 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '500ms' }}>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Built Like a Practical Farm SaaS</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Everything is organized around the real decisions a farmer makes every day: identify, decide, act, and review.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className={`bg-gray-50 border border-gray-200 rounded-3xl p-8 shadow-xl transition-all duration-1000 hover:-translate-y-1 hover:border-green-200 hover:shadow-2xl ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '600ms' }}>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">How teams use it</h3>
              <div className="grid grid-cols-1 gap-4">
                {[
                  ['1. Detect', 'Upload a plant image and get a disease prediction from the trained CNN model.'],
                  ['2. Understand', 'Generate treatment, causes, effects, and prevention advice in the farmer’s selected language.'],
                  ['3. Plan', 'Use crop suggestions to decide what to grow for a season, timeline, and soil type.'],
                  ['4. Track', 'Save recommendations and conversations in the dashboard for future reference.']
                ].map(([title, desc]) => (
                  <div key={title} className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-green-200 hover:shadow-xl">
                    <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold shrink-0">
                      {title.split('.')[0]}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{title}</h4>
                      <p className="text-gray-600">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '700ms' }}>
              {[
                ['Dashboard History', 'Keep disease reports, crop suggestions, and chat conversations together.'],
                ['Local + Cloud AI', 'Combine local model prediction with Gemini or Ollama-generated advice.'],
                ['Farmer Friendly UX', 'Simple forms, visual cards, saved history, and multilingual output.'],
                ['Always Accessible', 'Designed for repeat use in day-to-day agricultural workflows.']
              ].map(([title, desc]) => (
                <div key={title} className="rounded-2xl bg-green-50 border border-green-100 p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-green-300 hover:shadow-xl">
                  <h4 className="font-semibold text-green-900 mb-2">{title}</h4>
                  <p className="text-gray-700 text-sm">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '750ms' }}>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple Pricing</h2>
            <p className="text-lg text-gray-600">Everything currently available in one free plan.</p>
          </div>

          <div className={`max-w-2xl mx-auto rounded-3xl bg-white border-2 border-green-500 shadow-2xl p-10 text-center transition-all duration-1000 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(22,163,74,0.18)] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '850ms' }}>
            <span className="inline-flex px-4 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-sm mb-4">
              Current Plan
            </span>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">Free</h3>
            <div className="text-5xl font-bold text-green-700 mb-2">$0</div>
            <p className="text-gray-600 mb-8">For students, researchers, demo users, and farmers exploring AI support.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-8">
              {[
                'Plant disease detection',
                'Crop suggestion workflow',
                'AI farming assistant',
                'Dashboard history',
                'Multilingual responses',
                'No subscription required'
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3 text-gray-700 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 shadow-sm transition-all duration-300 hover:border-green-200 hover:bg-green-50 hover:shadow-md">
                  <span className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-xs">✓</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <Link
              href={isSignedIn ? '/dashboard' : '/sign-up'}
              className="inline-flex items-center justify-center px-8 py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-lg"
            >
              {isSignedIn ? 'Open Dashboard' : 'Create Free Account'}
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '900ms' }}>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600">A few quick answers that users usually expect from a SaaS home page.</p>
          </div>

          <div className="space-y-4">
            {[
              ['Is Kisan Sahayak free?', 'Yes. The current plan is free and gives access to the main disease detection, crop suggestion, chatbot, and dashboard features.'],
              ['Can I use it in regional languages?', 'Yes. The app supports multiple Indian languages for treatment guidance, crop advice, and chatbot interactions.'],
              ['Does it save my previous results?', 'Yes. Signed-in users can review disease reports, crop recommendations, and chat history from the dashboard.'],
              ['Can it work with local AI?', 'Yes. The project supports fallback behavior with Ollama for supported text-generation flows.']
            ].map(([question, answer]) => (
              <div key={question} className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-green-200 hover:bg-green-50 hover:shadow-xl">
                <h3 className="font-semibold text-gray-900 mb-2">{question}</h3>
                <p className="text-gray-600">{answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{transitionDelay: '800ms'}}>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Farmers Say About Us</h2>
            <p className="text-lg text-gray-600 mb-12">
              Join thousands of satisfied farmers who have transformed their agricultural practices
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-gray-50 rounded-lg shadow-lg p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="flex items-center mb-4">
                <img 
                  src="/images/testimonials1.png" 
                  alt="Ramesh Kumar" 
                  className="w-12 h-12 rounded-full mr-4 border-2 border-green-200 object-cover"
                />
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Ramesh Kumar</h4>
                  <p className="text-sm text-gray-600">Wheat Farmer • Punjab</p>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2l3.654 2.946-3.654-.707-.707L12 6.343l-4.393 4.393 1.414 1.414L12 8.343l1.414 1.414 1.414L12 2l.946-4.393 4.393-2.657 3.653-.707z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "Kisan Sahayak's AI disease detection helped me identify wheat rust early and save 30% of my crop. The crop suggestions are spot-on for my region!"
              </p>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-gray-50 rounded-lg shadow-lg p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="flex items-center mb-4">
                <img 
                  src="/images/testimonials2.png" 
                  alt="Priya Sharma" 
                  className="w-12 h-12 rounded-full mr-4 border-2 border-green-200 object-cover"
                />
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Priya Sharma</h4>
                  <p className="text-sm text-gray-600">Rice Farmer • Maharashtra</p>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2l3.654 2.946-3.654-.707-.707L12 6.343l-4.393 4.393 1.414 1.414L12 8.343l1.414 1.414 1.414L12 2l.946-4.393 4.393-2.657 3.653-.707z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "The AI assistant is like having an expert available 24/7. It helped me choose the right rice variety and timing for planting."
              </p>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-gray-50 rounded-lg shadow-lg p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="flex items-center mb-4">
                <img 
                  src="/images/testimonials3.png" 
                  alt="Suresh Patel" 
                  className="w-12 h-12 rounded-full mr-4 border-2 border-green-200 object-cover"
                />
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Suresh Patel</h4>
                  <p className="text-sm text-gray-600">Cotton Farmer • Gujarat</p>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2l3.654 2.946-3.654-.707-.707L12 6.343l-4.393 4.393 1.414 1.414L12 8.343l1.414 1.414 1.414L12 2l.946-4.393 4.393-2.657 3.653-.707z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "Crop suggestions helped me increase my yield by 25% while reducing water usage. Best investment I've made!"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{transitionDelay: '900ms'}}>
            <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Farming?</h2>
            <p className="text-xl mb-8 text-green-100">
              Join thousands of farmers who are already using AI to increase their productivity and profitability
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/plant-disease" 
                className="px-8 py-4 bg-white text-green-700 rounded-lg font-semibold hover:bg-gray-100 transform transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Try Disease Detection
              </Link>
              <Link 
                href="/crop-suggestion" 
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-green-700 transform transition-all duration-300 hover:scale-105"
              >
                Get Crop Advice
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
