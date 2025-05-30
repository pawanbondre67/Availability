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
const POPUP_TIME = 5; // 5 seconds after timer starts

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
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
          // Show modal only if the sessionId matches the one in localStorage
          const localSessionId = localStorage.getItem(`${gender}-sessionId`);
          if (elapsedTime >= POPUP_TIME && !newState.modalResponded && !showModal && localSessionId === newState.sessionId) {
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
          if (elapsedTime >= POPUP_TIME && !state.modalResponded && !state.prompted && localSessionId === state.sessionId) {
            setState(prev => ({ ...prev, prompted: true }));
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
    set(ref(db, gender), {
      occupied: false,
      endTime: null,
      startTime: null,
      prompted: false,
      modalResponded: false,
      sessionId: null,
    });
    localStorage.removeItem(`${gender}-sessionId`);
  };

  const startTimer = (duration: number) => {
    const now = Date.now();
    const sessionId = uuidv4(); // Generate unique session ID
    localStorage.setItem(`${gender}-sessionId`, sessionId); // Store in localStorage
    setState({
      occupied: true,
      timeLeft: duration,
      endTime: now + duration * 1000,
      startTime: now,
      prompted: false,
      modalResponded: false,
      sessionId,
    });
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
    setState(prev => ({ ...prev, modalResponded: true }));
    saveState();
  };

  return (
    <div className={`${gender === 'female' ? 'mt-4' : 'mb-4'}`}>
      <h2 className="text-lg font-semibold capitalize">{gender} Washroom</h2>
      <p className={`text-gray-700 ${state.occupied ? 'text-red-600' : ''}`}>
        Status: {state.occupied ? 'Occupied' : 'Unoccupied'}
      </p>
      <select
        id={`${gender}-timer-select`}
        className={`border rounded px-2 py-1 mt-2 ${state.occupied ? 'hidden' : ''}`}
      >
        <option value="120">2 minutes</option>
        <option value="300">5 minutes</option>
        <option value="600">10 minutes</option>
        <option value="900">15 minutes</option>
      </select>
      <button
        onClick={handleCheckIn}
        className={`bg-green-500 text-white px-4 py-2 rounded mt-2 ml-2 hover:bg-green-600 ${state.occupied ? 'hidden' : ''}`}
      >
        Check-In
      </button>
      <p className={`text-sm text-gray-500 mt-2 ${state.occupied ? '' : 'hidden'}`}>
        Time remaining: {formatTime(state.timeLeft)}
      </p>
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
            <p className="mb-4">Are you done with the {gender} washroom? Click OK to check out.</p>
            <div className="flex justify-end space-x-2">
              <button onClick={handleModalCancel} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
              <button onClick={handleModalConfirm} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WashroomTimer;