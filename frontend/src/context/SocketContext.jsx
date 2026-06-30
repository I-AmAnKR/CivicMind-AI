import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

const SOCKET_URL = import.meta.env.PROD ? '/' : (import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [liveNotifications, setLiveNotifications] = useState([]);

  useEffect(() => {
    // Connect socket
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setConnected(true);
      console.log('🔌 Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('❌ Socket disconnected');
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connect error:', err.message);
    });

    // ========== REAL-TIME EVENTS ==========

    // New issue reported in the area
    socket.on('new-issue', (data) => {
      const notif = {
        id: Date.now(),
        type: 'new-issue',
        title: '📍 New Issue Reported',
        message: data.title || 'A new civic issue was reported nearby',
        severity: data.severity,
        time: new Date(),
      };
      addNotification(notif);
      toast(
        `📍 New ${data.severity} issue: ${data.title}`,
        {
          icon: data.severity === 'Critical' ? '🔴' : data.severity === 'High' ? '🟠' : '🟡',
          style: { background: '#0A0A1A', color: '#fff', border: '1px solid rgba(108,99,255,0.3)' },
          duration: 5000,
        }
      );
    });

    // Issue verified by community
    socket.on('issue-verified', (data) => {
      const notif = {
        id: Date.now(),
        type: 'verified',
        title: '✅ Issue Verified',
        message: `Your report got a community verification! (${data.count} total)`,
        time: new Date(),
      };
      addNotification(notif);
      toast.success(`✅ Your issue got verified! (${data.count} verifications)`, {
        duration: 4000,
      });
    });

    // Issue resolved
    socket.on('issue-resolved', (data) => {
      const notif = {
        id: Date.now(),
        type: 'resolved',
        title: '🎉 Issue Resolved!',
        message: `AI Verdict: ${data.verdict} — ${data.comment}`,
        time: new Date(),
      };
      addNotification(notif);
      toast.success(`🎉 Issue resolved! AI says: ${data.verdict}`, {
        duration: 6000,
      });
    });

    // Priority updated
    socket.on('priority-updated', (data) => {
      toast(`⚡ Priority score updated: ${data.score}`, {
        style: { background: '#0A0A1A', color: '#FFD93D', border: '1px solid rgba(255,217,61,0.3)' },
        duration: 3000,
      });
    });

    // New supporter added to your issue
    socket.on('new-supporter', (data) => {
      const notif = {
        id: Date.now(),
        type: 'supporter',
        title: '🙌 New Supporter!',
        message: `Someone confirmed your "${data.title}" report. (${data.supporterCount} supporters now)`,
        time: new Date(),
      };
      addNotification(notif);
      toast.success(`🙌 Someone confirmed your report! (${data.supporterCount} supporters)`, {
        duration: 5000,
        style: { background: '#0A0A1A', color: '#6BCB77', border: '1px solid rgba(107,203,119,0.3)' },
      });
    });

    // AI flagged a resolution — community asked to vote
    socket.on('community-confirm-requested', (data) => {
      const notif = {
        id: Date.now(),
        type: 'community-confirm',
        title: '🔎 Your vote needed!',
        message: `"${data.title}" — ${data.isFakePhoto ? '⚠️ Possible fake fix!' : 'AI says not resolved.'} Go to Community Feed to vote.`,
        time: new Date(),
      };
      addNotification(notif);
      toast(`🔎 Vote needed: Is "${data.title}" actually fixed?`, {
        icon: data.isFakePhoto ? '⚠️' : '🗳️',
        duration: 8000,
        style: {
          background: '#0A0A1A', color: '#FFD93D',
          border: '1px solid rgba(255,217,61,0.4)',
        },
      });
    });

    // 🏅 Badge earned — golden celebration toast
    socket.on('badge-earned', (data) => {
      (data.badges || []).forEach((badge, i) => {
        setTimeout(() => {
          const notif = {
            id: Date.now() + i,
            type: 'badge',
            title: `🏅 Badge Unlocked: ${badge.name}!`,
            message: badge.desc,
            time: new Date(),
          };
          addNotification(notif);
          toast(`${badge.icon} Badge Unlocked: ${badge.name}!`, {
            duration: 6000,
            style: {
              background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
              color: '#FFD93D',
              border: '1px solid rgba(255,217,61,0.5)',
              boxShadow: '0 0 20px rgba(255,217,61,0.2)',
              fontWeight: 700,
              fontSize: '0.95rem',
            },
          });
        }, i * 800);
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Join user room when user logs in
  useEffect(() => {
    if (user && socketRef.current?.connected) {
      socketRef.current.emit('join-room', user.id || user._id);
      console.log(`🏠 Joined user room: user-${user.id || user._id}`);
    }
  }, [user, connected]);

  const addNotification = (notif) => {
    setLiveNotifications(prev => [notif, ...prev].slice(0, 20)); // keep last 20
  };

  const joinAreaRoom = (lat, lng) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-area', { lat, lng });
    }
  };

  const clearLiveNotifications = () => setLiveNotifications([]);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      connected,
      liveNotifications,
      joinAreaRoom,
      clearLiveNotifications,
    }}>
      {children}
    </SocketContext.Provider>
  );
};
