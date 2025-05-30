import React, { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';

interface WashroomTimerProps {
  gender: 'male' | 'female';
}

interface WashroomState {
  occupied: boolean;
  timeLeft: number;
  endTime: number | null;
  startTime: number | null;
  prompted: boolean;
  modalResponded: boolean;
  sessionId: string | null;
}

const DEFAULT_DURATION = 120; // 2 minutes in seconds
const POPUP_TIME = 30; // 30 seconds for modal checks
const MAX_MODAL_COUNT = 2; // Maximum 2 modal prompts

// Lunch break hours
const LUNCH_START_HOUR = 13; // 1 PM
const LUNCH_END_HOUR = 14; // 2 PM

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const WashroomTimer: React.FC<WashroomTimerProps> = ({ gender }) => {
  const [state, setState] = useState<WashroomState>({
    occupied: false,
    timeLeft: DEFAULT_DURATION,
    endTime: null,
    startTime: null,
    prompted: false,
    modalResponded: false,
    sessionId: null,
  });
  const [showModal, setShowModal] = useState(false);
  const [showLunchModal, setShowLunchModal] = useState(false);

  const isLunchTime = () => {
    const now = new Date();
    const currentHour = now.getHours();
    return currentHour >= LUNCH_START_HOUR && currentHour < LUNCH_END_HOUR;
  };

  useEffect(() => {
    // Check for lunch time every minute
    const lunchCheckInterval = setInterval(() => {
      if (isLunchTime()) {
        setShowLunchModal(true);
      } else {
        setShowLunchModal(false);
      }
    }, 60000); // Check every minute

    // Initial check
    if (isLunchTime()) {
      setShowLunchModal(true);
    }

    return () => clearInterval(lunchCheckInterval);
  }, []);

  useEffect(() => {
    // Load and sync state with Firebase
    const washroomRef = ref(db, gender);
    const unsubscribe = onValue(washroomRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.occupied && data.endTime && data.startTime) {
        const timeLeft = Math.max(0, Math.floor((data.endTime - Date.now()) / 1000));
        const elapsedTime = Math.floor((Date.now() - data.startTime) / 1000);
        if (timeLeft > 0) {
          const newState = {
            occupied: true,
            timeLeft,
            endTime: data.endTime,
            startTime: data.startTime,
            prompted: data.prompted || false,
            modalResponded: data.modalResponded || false,
            sessionId: data.sessionId || null,
          };
          setState(newState);
          // Show modal if sessionId matches and modalCount < 2
          const localSessionId = localStorage.getItem(`${gender}-sessionId`);
          const modalCount = parseInt(localStorage.getItem(`${gender}-modalCount`) || '0');
          if (
            elapsedTime >= POPUP_TIME &&
            !newState.modalResponded &&
            !showModal &&
            localSessionId === newState.sessionId &&
            modalCount < MAX_MODAL_COUNT
          ) {
            setShowModal(true);
          }
        } else {
          resetWashroom();
        }
      } else {
        resetWashroom();
      }
    });

    return () => unsubscribe();
  }, [gender]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (state.occupied && state.endTime && state.sessionId) {
      timer = setInterval(() => {
        const timeLeft = Math.max(0, Math.floor((state.endTime! - Date.now()) / 1000));
        if (timeLeft <= 0) {
          resetWashroom();
        } else {
          const elapsedTime = Math.floor((Date.now() - state.startTime!) / 1000);
          const localSessionId = localStorage.getItem(`${gender}-sessionId`);
          const modalCount = parseInt(localStorage.getItem(`${gender}-modalCount`) || '0');
          // Check for modal every POPUP_TIME seconds
          if (
            elapsedTime >= POPUP_TIME &&
            Math.floor(elapsedTime / POPUP_TIME) > modalCount &&
            !state.modalResponded &&
            localSessionId === state.sessionId &&
            modalCount < MAX_MODAL_COUNT
          ) {
            setState(prev => ({ ...prev, prompted: true }));
            localStorage.setItem(`${gender}-modalCount`, (modalCount + 1).toString());
            setShowModal(true);
            saveState();
          } else {
            setState(prev => ({ ...prev, timeLeft }));
            saveState();
          }
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [state.occupied, state.endTime, state.startTime, state.prompted, state.modalResponded, state.sessionId]);

  const saveState = () => {
    set(ref(db, gender), {
      occupied: state.occupied,
      endTime: state.endTime,
      startTime: state.startTime,
      prompted: state.prompted,
      modalResponded: state.modalResponded,
      sessionId: state.sessionId,
    });
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const resetWashroom = () => {
    setState({
      occupied: false,
      timeLeft: DEFAULT_DURATION,
      endTime: null,
      startTime: null,
      prompted: false,
      modalResponded: false,
      sessionId: null,
    });
    setShowModal(false);
    if (!isLunchTime()) {
      setShowLunchModal(false);
    }
    set(ref(db, gender), {
      occupied: false,
      endTime: null,
      startTime: null,
      prompted: false,
      modalResponded: false,
      sessionId: null,
    });
    localStorage.removeItem(`${gender}-sessionId`);
    localStorage.setItem(`${gender}-modalCount`, '0');
  };

  const startTimer = (duration: number) => {
    const now = Date.now();
    const sessionId = uuidv4();
    localStorage.setItem(`${gender}-sessionId`, sessionId);
    localStorage.setItem(`${gender}-modalCount`, '0');
    setState({
      occupied: true,
      timeLeft: duration,
      endTime: now + duration * 1000,
      startTime: now,
      prompted: false,
      modalResponded: false,
      sessionId,
    });
    setShowModal(false);
    set(ref(db, gender), {
      occupied: true,
      endTime: now + duration * 1000,
      startTime: now,
      prompted: false,
      modalResponded: false,
      sessionId,
    });
  };

  const handleCheckIn = () => {
    if (isLunchTime()) {
      setShowLunchModal(true);
      return;
    }
    // Reset state and UI before starting new timer
    resetWashroom();
    const selectedTime = parseInt((document.getElementById(`${gender}-timer-select`) as HTMLSelectElement).value) || DEFAULT_DURATION;
    startTimer(selectedTime);
  };

  const handleModalConfirm = () => {
    setShowModal(false);
    setState(prev => ({ ...prev, modalResponded: true }));
    resetWashroom();
  };

  const handleModalCancel = () => {
    setShowModal(false);
    setState(prev => ({ ...prev, modalResponded: false })); // Allow future modals
    saveState();
  };

  return (
    <>
      <style>
        {`
          @keyframes fade-slide-in {
            0% {
              opacity: 0;
              transform: translateY(20px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-slide-in {
            animation: fade-slide-in 0.3s ease-out;
          }
        `}
      </style>
      <div className={`bg-gradient-to-br from-teal-50 to-blue-50 p-6 rounded-xl shadow-xl ${gender === 'female' ? 'mt-6' : 'mb-6'} transition-all duration-300 hover:shadow-2xl`}>
        <h2 className="text-2xl font-bold text-teal-700 capitalize mb-4 flex items-center justify-between">
          <span>{gender} Washroom</span>
          {gender === 'male' ? (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="6" r="4"/>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            </svg>
          ) : (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4"/>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <path d="M12 12v8"/>
              <path d="M8 16h8"/>
            </svg>
          )}
        </h2>
        <p className={`text-lg font-semibold ${state.occupied ? 'text-red-600 animate-pulse' : 'text-green-600'}`}>
          Status: {state.occupied ? 'Occupied' : 'Unoccupied'}
        </p>
        <select
          id={`${gender}-timer-select`}
          className={`border-2 border-teal-300 rounded-lg px-3 py-2 mt-4 bg-white text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200 ${state.occupied || isLunchTime() ? 'hidden' : ''}`}
        >
          <option value="180">3 minutes</option>
          <option value="300">5 minutes</option>
          <option value="600">10 minutes</option>
          <option value="900">15 minutes</option>
        </select>
        <button
          onClick={handleCheckIn}
          className={`bg-teal-500 text-white px-6 py-2 rounded-lg mt-4 ml-3 hover:bg-teal-600 transform hover:scale-105 transition-all duration-200 ${state.occupied || isLunchTime() ? 'hidden' : ''}`}
        >
          Check-In
        </button>
        <p className={`text-lg font-medium text-teal-800 mt-4 ${state.occupied ? '' : 'hidden'}`}>
          Time remaining: <span className="font-bold text-teal-600">{formatTime(state.timeLeft)}</span>
        </p>
      </div>
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full border-2 border-teal-400 animate-fade-slide-in">
            <div className="flex justify-center mb-4">
              <svg className="w-12 h-12 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-center text-teal-800 mb-6">
              Are you done with the {gender} washroom? Click OK to check out.{' '}
              <span className="font-bold text-teal-600">
                (Prompt {parseInt(localStorage.getItem(`${gender}-modalCount`) || '0')} of {MAX_MODAL_COUNT})
              </span>
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleModalCancel}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transform hover:scale-105 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleModalConfirm}
                className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transform hover:scale-105 transition-all duration-200"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      {showLunchModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full border-2 border-blue-400 animate-fade-slide-in">
            <div className="flex justify-center mb-4">
              <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4m5-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-center text-blue-800 font-semibold mb-4">Lunch Break</p>
            <p className="text-center text-blue-800 mb-6">
              The washroom is closed for lunch break (1 PM - 2 PM). Please try again after 2 PM.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowLunchModal(false)}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transform hover:scale-105 transition-all duration-200"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WashroomTimer;
