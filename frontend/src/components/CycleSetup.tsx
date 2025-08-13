import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface CycleSetupProps {
  onComplete: (cycleData: any) => void;
}

const CycleSetup: React.FC<CycleSetupProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    lastPeriodStart: '',
    cycleLength: 28,
    periodLength: 5,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.lastPeriodStart) {
      newErrors.lastPeriodStart = 'Please select the start date of your last period';
    } else {
      const selectedDate = new Date(formData.lastPeriodStart);
      const today = new Date();
      const maxDate = new Date();
      maxDate.setDate(today.getDate() - 1); // Yesterday
      const minDate = new Date();
      minDate.setDate(today.getDate() - 45); // 45 days ago
      
      if (selectedDate > maxDate) {
        newErrors.lastPeriodStart = 'Date cannot be in the future';
      } else if (selectedDate < minDate) {
        newErrors.lastPeriodStart = 'Please select a date within the last 45 days';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    
    if (formData.cycleLength < 21 || formData.cycleLength > 35) {
      newErrors.cycleLength = 'Cycle length should be between 21-35 days';
    }
    
    if (formData.periodLength < 3 || formData.periodLength > 8) {
      newErrors.periodLength = 'Period length should be between 3-8 days';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleComplete = () => {
    if (validateStep2()) {
      onComplete({
        last_period_start: new Date(formData.lastPeriodStart).toISOString(),
        cycle_length: formData.cycleLength,
        period_length: formData.periodLength,
      });
    }
  };

  const getMaxDate = () => {
    const today = new Date();
    today.setDate(today.getDate() - 1);
    return today.toISOString().split('T')[0];
  };

  const getMinDate = () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - 45);
    return minDate.toISOString().split('T')[0];
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gradient mb-2">
            Let's Set Up Your Cycle
          </h1>
          <p className="text-gray-600">
            Help us understand your natural rhythm to optimize your productivity
          </p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((stepNum) => (
            <React.Fragment key={stepNum}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  step >= stepNum
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {stepNum}
              </div>
              {stepNum < 3 && (
                <div
                  className={`w-16 h-1 transition-colors ${
                    step > stepNum ? 'bg-primary-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-semibold mb-4">When did your last period start?</h2>
                <p className="text-gray-600 mb-6">
                  This helps us determine where you are in your current cycle
                </p>
                
                <div>
                  <label htmlFor="lastPeriod" className="block text-sm font-medium text-gray-700 mb-2">
                    First day of your last period
                  </label>
                  <input
                    type="date"
                    id="lastPeriod"
                    value={formData.lastPeriodStart}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastPeriodStart: e.target.value }))}
                    min={getMinDate()}
                    max={getMaxDate()}
                    className={`input-field ${errors.lastPeriodStart ? 'border-red-500' : ''}`}
                  />
                  {errors.lastPeriodStart && (
                    <p className="text-red-500 text-sm mt-1">{errors.lastPeriodStart}</p>
                  )}
                </div>

                <div className="bg-blue-50 p-4 rounded-lg flex items-start space-x-3">
                  <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Privacy Note</p>
                    <p>Your cycle data is stored securely and used only to optimize your task scheduling. We never share personal health information.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  disabled={!formData.lastPeriodStart}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next Step
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-semibold mb-4">Tell us about your typical cycle</h2>
                <p className="text-gray-600 mb-6">
                  These details help us predict your future phases more accurately
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="cycleLength" className="block text-sm font-medium text-gray-700 mb-2">
                      Cycle Length (days)
                    </label>
                    <input
                      type="number"
                      id="cycleLength"
                      min="21"
                      max="35"
                      value={formData.cycleLength}
                      onChange={(e) => setFormData(prev => ({ ...prev, cycleLength: parseInt(e.target.value) }))}
                      className={`input-field ${errors.cycleLength ? 'border-red-500' : ''}`}
                    />
                    {errors.cycleLength && (
                      <p className="text-red-500 text-sm mt-1">{errors.cycleLength}</p>
                    )}
                    <p className="text-gray-500 text-sm mt-1">
                      From first day of one period to first day of the next
                    </p>
                  </div>

                  <div>
                    <label htmlFor="periodLength" className="block text-sm font-medium text-gray-700 mb-2">
                      Period Length (days)
                    </label>
                    <input
                      type="number"
                      id="periodLength"
                      min="3"
                      max="8"
                      value={formData.periodLength}
                      onChange={(e) => setFormData(prev => ({ ...prev, periodLength: parseInt(e.target.value) }))}
                      className={`input-field ${errors.periodLength ? 'border-red-500' : ''}`}
                    />
                    {errors.periodLength && (
                      <p className="text-red-500 text-sm mt-1">{errors.periodLength}</p>
                    )}
                    <p className="text-gray-500 text-sm mt-1">
                      How many days your period typically lasts
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <InformationCircleIcon className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-700">
                      <p className="font-medium mb-1">Don't worry if you're not sure</p>
                      <p>Average cycle length is 28 days with a 5-day period. You can always update these settings later as you learn more about your patterns.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="btn-secondary"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="btn-primary"
                >
                  Next Step
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-4">You're all set! 🎉</h2>
                <p className="text-gray-600 mb-6">
                  Here's a summary of your cycle information
                </p>

                <div className="bg-gradient-to-r from-primary-50 to-purple-50 p-6 rounded-lg mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary-600">
                        {new Date(formData.lastPeriodStart).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600">Last Period Start</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary-600">
                        {formData.cycleLength} days
                      </div>
                      <div className="text-sm text-gray-600">Cycle Length</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary-600">
                        {formData.periodLength} days
                      </div>
                      <div className="text-sm text-gray-600">Period Length</div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-sm text-green-700">
                      <p className="font-medium mb-1">Ready to optimize your productivity!</p>
                      <p>SyncTracker will now help you schedule tasks at the perfect times based on your natural hormonal rhythm.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="btn-secondary"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  className="btn-primary"
                >
                  Complete Setup
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default CycleSetup;