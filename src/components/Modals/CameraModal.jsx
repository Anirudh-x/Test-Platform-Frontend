import { useState, useEffect, useRef, useContext } from 'react';
import { FiX, FiVideoOff } from 'react-icons/fi';
import { ThemeContext } from '../../context/ThemeContext';
import { initSocket } from '../../utils/api';

export default function CameraModal({ testId, onClose }) {
  const theme = useContext(ThemeContext);
  const [students, setStudents] = useState([]);

  // Refs
  const socketRef = useRef(null);
  const peerConnectionsRef = useRef({}); // studentSocketId -> RTCPeerConnection
  const videoRefs = useRef({}); // studentSocketId -> video element ref

  useEffect(() => {
    const socket = initSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      // 1. Tell signaling server we want to watch this test
      socket.emit('admin-watch', testId, (activeStudents) => {
        setStudents(activeStudents);

        // 2. Request offers from all currently active students
        activeStudents.forEach(student => {
          socket.emit('request-offer', { studentSocketId: student.socketId });
        });
      });
    });

    // 3. A new student joined
    socket.on('student-registered', (student) => {
      setStudents(prev => {
        // Prevent duplicates
        if (prev.some(s => s.socketId === student.socketId)) return prev;
        return [...prev, student];
      });
      // Request their offer
      socket.emit('request-offer', { studentSocketId: student.socketId });
    });

    // 4. A student left
    socket.on('student-disconnected', (socketId) => {
      setStudents(prev => prev.filter(s => s.socketId !== socketId));

      // Cleanup PC
      if (peerConnectionsRef.current[socketId]) {
        peerConnectionsRef.current[socketId].close();
        delete peerConnectionsRef.current[socketId];
      }
      // Cleanup Video ref
      if (videoRefs.current[socketId]) {
        delete videoRefs.current[socketId];
      }
    });

    // 5. Receive WebRTC offer from student
    socket.on('webrtc-offer', async (data) => {
      const { studentSocketId, offer } = data;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnectionsRef.current[studentSocketId] = pc;

      // When track arrives, attach it to the correct video element
      pc.ontrack = (event) => {
        const videoEl = videoRefs.current[studentSocketId];
        if (videoEl && event.streams && event.streams[0]) {
          videoEl.srcObject = event.streams[0];
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            targetSocketId: studentSocketId,
            candidate: event.candidate
          });
        }
      };

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        // Send answer back to student
        socket.emit('webrtc-answer', {
          studentSocketId,
          answer
        });
      } catch (e) {
        console.error('Error handling WebRTC offer:', e);
      }
    });

    // 6. Receive ICE candidate from student
    socket.on('ice-candidate', async (data) => {
      const { sourceSocketId, candidate } = data;
      const pc = peerConnectionsRef.current[sourceSocketId];
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding ICE candidate:', e);
        }
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    };
  }, [testId]);

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex flex-col z-50">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 p-4 flex justify-between items-center shadow-md">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            Live Camera Monitor
          </h2>
          <p className="text-slate-400 text-sm mt-1">Test ID: {testId} • {students.length} Active Students</p>
        </div>
        <button
          onClick={onClose}
          className="text-2xl bg-slate-800 hover:bg-slate-700 rounded-lg w-10 h-10 flex items-center justify-center transition-colors text-slate-300 hover:text-white"
        >
          <FiX />
        </button>
      </div>

      {/* Grid Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {students.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {students.map(student => (
              <div key={student.socketId} className="bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700 flex flex-col">
                {/* Video container */}
                <div className="relative aspect-video bg-black flex items-center justify-center">
                  <video
                    ref={el => {
                      if (el) videoRefs.current[student.socketId] = el;
                    }}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Fallback if video isn't showing yet - basic CSS overlay could be added here later */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 pointer-events-none" style={{ zIndex: -1 }}>
                    <FiVideoOff className="text-4xl mb-2 opacity-50" />
                    <span className="text-sm">Connecting...</span>
                  </div>
                </div>

                {/* Student Info Footer */}
                <div className="p-3 bg-slate-800 flex justify-between items-center border-t border-slate-700">
                  <div>
                    <p className="font-semibold text-white text-sm truncate w-40" title={student.name}>{student.name}</p>
                    <p className="text-slate-400 text-xs font-mono">{student.rollNo}</p>
                  </div>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold uppercase rounded border border-green-500/30">
                    Live
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <FiVideoOff className="text-6xl mb-4 opacity-20" />
            <h3 className="text-xl font-semibold text-white mb-2">No Active Cameras</h3>
            <p className="max-w-md text-center">There are currently no students taking this test, or their cameras have not been initialized yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
