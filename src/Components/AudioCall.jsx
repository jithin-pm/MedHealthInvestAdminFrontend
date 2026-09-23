import React, { useEffect, useState, useRef } from 'react';
import { PiPhoneCallBold, PiPhoneDisconnectBold, PiMicrophoneBold, PiMicrophoneSlashBold } from 'react-icons/pi';
import { MdOutlineSupportAgent, MdClose } from 'react-icons/md';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { BASE_URL } from '../services/baseUrl';
import { commonApi } from '../services/CommonApi';

const AudioCall = ({
    isOpen,
    isIncoming,
    isOutgoing,
    callerName,
    channelName,
    accessToken,
    onAccept,
    onReject,
    onEnd,
    remoteStatus,
    reason,
    onCallAgain,
    onClose
}) => {
    const [callStatus, setCallStatus] = useState('connecting'); // connecting, connected
    const [remoteUserJoined, setRemoteUserJoined] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');
    const durationRef = useRef(0);
    const joinInProgress = useRef(false);
    const isMounted = useRef(true);

    const clientRef = useRef(null);
    if (!clientRef.current) {
        clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    }
    const client = clientRef.current;

    const clientUidRef = useRef(Math.floor(Math.random() * 10000000) + 1);
    const subscribedUsersRef = useRef(new Set());
    const hasJoined = useRef(false);
    const localAudioTrackRef = useRef(null);
    const leavePromiseRef = useRef(null);
    const timerRef = useRef(null);
    const audioCtxRef = useRef(null);
    const ringIntervalRef = useRef(null);

    const playRingTone = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;

        const beep = () => {
            if (ctx.state === 'suspended') ctx.resume().catch(() => {});
            
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc1.frequency.value = 440;
            osc2.frequency.value = 480;

            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(ctx.destination);

            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.75, ctx.currentTime + 0.05);
            gainNode.gain.setValueAtTime(0.75, ctx.currentTime + 1.5);
            gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.6);

            osc1.start(ctx.currentTime);
            osc2.start(ctx.currentTime);
            osc1.stop(ctx.currentTime + 1.6);
            osc2.stop(ctx.currentTime + 1.6);
        };

        beep();
        if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = setInterval(beep, 3500);
    };

    const stopRingTone = () => {
        if (ringIntervalRef.current) {
            clearInterval(ringIntervalRef.current);
            ringIntervalRef.current = null;
        }
        if (audioCtxRef.current) {
            audioCtxRef.current.close().catch(() => {});
            audioCtxRef.current = null;
        }
    };

    useEffect(() => {
        if (!isOpen) {
            hasJoined.current = false;
            isMounted.current = false;
            leaveCall(true);
            return;
        }

        isMounted.current = true;

        if (isOpen && !isIncoming) {
            if (!hasJoined.current) {
                hasJoined.current = true;
                if (!isOutgoing) {
                    setCallStatus('connected');
                    setRemoteUserJoined(true);
                } else {
                    setCallStatus('connecting');
                }
                joinCall();
            }
        } else if (isOpen && isIncoming) {
            setCallStatus('ringing');
            playRingTone();
        }

        return () => {};
    }, [isOpen, isIncoming, channelName]);

    useEffect(() => {
        if (remoteStatus === 'rejected') {
            leaveCall();
            stopRingTone();
        }
    }, [remoteStatus]);

    useEffect(() => {
        if (callStatus === 'ringing' || (callStatus === 'connecting' && isOutgoing)) {
            playRingTone();
        } else {
            stopRingTone();
        }

        return () => stopRingTone();
    }, [callStatus, isOutgoing]);

    useEffect(() => {
        if (callStatus === 'connected') {
            timerRef.current = setInterval(() => {
                setCallDuration(prev => {
                    const next = prev + 1;
                    durationRef.current = next;
                    return next;
                });
            }, 1000);
        } else {
            clearInterval(timerRef.current);
            setCallDuration(0);
            durationRef.current = 0;
        }
        return () => clearInterval(timerRef.current);
    }, [callStatus]);

    useEffect(() => {
        let timeoutRef;
        if (callStatus === 'connecting' && isOutgoing) {
            timeoutRef = setTimeout(() => {
                handleReject('timeout');
            }, 30000);
        }

        return () => clearTimeout(timeoutRef);
    }, [callStatus, isOutgoing]);

    const formatDuration = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const fetchAgoraToken = async () => {
        try {
            const res = await commonApi("GET", `${BASE_URL}/api/chat/agora-token?channelName=${channelName}&uid=${clientUidRef.current}`, "");
            
            if (res && res.status === 200) {
                return { token: res.data.data.token, appId: res.data.data.appId };
            } else {
                throw new Error(res?.response?.data?.message || res?.message || 'Failed to fetch token');
            }
        } catch (error) {
            console.error("[AudioCall] Token fetch error:", error);
            setErrorMsg(`Connection Error: ${error.message || 'Server unreachable'}`);
            return null;
        }
    };

    const joinCall = async () => {
        if (joinInProgress.current) {
            return;
        }
        
        if (leavePromiseRef.current) {
            await leavePromiseRef.current;
            leavePromiseRef.current = null;
        }

        if (client.connectionState !== 'DISCONNECTED') {
            try {
                await client.leave();
            } catch (e) {
                console.error("Force leave error:", e);
            }
        }
        
        joinInProgress.current = true;
        
        try {
            let localAudioTrack = localAudioTrackRef.current;
            if (!localAudioTrack) {
                localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                localAudioTrackRef.current = localAudioTrack;
                localAudioTrack.setMuted(isMuted);
            }

            const credentials = await fetchAgoraToken();
            if (!isMounted.current || !credentials) {
                joinInProgress.current = false;
                return;
            }

            const { appId, token } = credentials;

            const subscribeRemoteTrack = async (user, mediaType) => {
                if (mediaType !== "audio") return;
                if (user.uid === client.uid) return;
                if (subscribedUsersRef.current.has(user.uid)) return;
                
                subscribedUsersRef.current.add(user.uid);
                try {
                    const remoteAudioTrack = await client.subscribe(user, mediaType);
                    remoteAudioTrack?.play();
                    setRemoteUserJoined(true);
                    setCallStatus('connected');
                } catch (err) {
                    subscribedUsersRef.current.delete(user.uid);
                    console.error("[AudioCall] Error subscribing/playing track:", err);
                }
            };

            client.removeAllListeners("user-published");
            client.removeAllListeners("user-joined");
            client.removeAllListeners("user-unpublished");
            client.removeAllListeners("user-left");

            client.on("user-published", (user, mediaType) => {
                subscribeRemoteTrack(user, mediaType);
            });

            client.on("user-joined", (user) => {
                if (user.uid === client.uid) return;
                setRemoteUserJoined(true);
                setCallStatus('connected');
            });

            client.on("user-unpublished", (user) => {});

            client.on("user-left", () => {
                handleEndCall();
            });

            await client.join(appId, channelName, token, clientUidRef.current);
            await client.publish([localAudioTrack]);

            if (client.remoteUsers.length > 0) {
                setRemoteUserJoined(true);
                setCallStatus('connected');
                
                client.remoteUsers.forEach((user) => {
                    if (user.hasAudio) {
                        subscribeRemoteTrack(user, "audio");
                    }
                });
            }

        } catch (error) {
            console.error("[AudioCall] Fatal joinCall error:", error);
            setErrorMsg(`Call Error: ${error.message || 'Microphone access denied or network issue'}`);
            joinInProgress.current = false;
        }
    };

    const leaveCall = async (isUnmounting = false) => {
        stopRingTone();
        joinInProgress.current = false;
        hasJoined.current = false;
        subscribedUsersRef.current.clear();
        if (localAudioTrackRef.current) {
            localAudioTrackRef.current.stop();
            localAudioTrackRef.current.close();
            localAudioTrackRef.current = null;
        }
        try {
            if (client.connectionState !== 'DISCONNECTED') {
                leavePromiseRef.current = client.leave();
                await leavePromiseRef.current;
            }
        } catch (error) {
            console.error("Error leaving channel:", error);
        } finally {
            leavePromiseRef.current = null;
        }
        
        if (!isUnmounting && isMounted.current) {
            setCallStatus('disconnected');
            setIsMuted(false);
            setCallDuration(0);
            setErrorMsg('');
            setRemoteUserJoined(false);
        }
    };

    useEffect(() => {
        if (remoteStatus === 'accepted' && callStatus === 'connecting') {
            setRemoteUserJoined(true);
            setCallStatus('connected');
        }
    }, [remoteStatus, callStatus]);

    const handleAccept = () => {
        onAccept();
    };

    const handleReject = (reason = 'declined') => {
        onReject(reason);
        leaveCall();
    };

    const handleEndCall = () => {
        onEnd(durationRef.current);
        leaveCall();
    };

    const toggleMute = () => {
        const currentMuteState = !isMuted;
        setIsMuted(currentMuteState);
        if (localAudioTrackRef.current) {
            localAudioTrackRef.current.setMuted(currentMuteState);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#111111] border border-white/10 w-[340px] rounded-[32px] p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] flex flex-col items-center transform scale-100 animate-in zoom-in-95 duration-300 ease-out">
                
                <p className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-8">
                    {errorMsg ? 'Error' : 'Audio Call'}
                </p>

                <div className="relative mb-6 flex items-center justify-center">
                    {(callStatus === 'ringing' || callStatus === 'connecting') && (
                        <>
                            <div className="absolute inset-0 w-full h-full rounded-full bg-blue-500/20 animate-ping" style={{ animationDuration: '2s' }}></div>
                            <div className="absolute inset-[-15px] rounded-full border border-blue-500/30 animate-pulse"></div>
                            <div className="absolute inset-[-30px] rounded-full border border-blue-500/10 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                        </>
                    )}
                    <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-lg border-4 border-[#222] z-10">
                        {callerName === 'Support Agent' ? (
                            <MdOutlineSupportAgent className="w-14 h-14 text-white" />
                        ) : (
                            <span className="text-4xl font-bold text-white">
                                {callerName?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                        )}
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2 tracking-tight text-center w-full truncate px-4">
                    {callerName}
                </h2>
                
                <div className="h-6 flex items-center justify-center mb-10">
                    {remoteStatus === 'rejected' ? (
                        <span className="text-red-400 text-sm font-medium tracking-wide">
                            {reason === 'timeout' ? 'No Response' : 'Call Declined'}
                        </span>
                    ) : errorMsg ? (
                        <span className="text-red-400 text-sm font-medium">{errorMsg}</span>
                    ) : callStatus === 'ringing' ? (
                        <span className="text-blue-400 text-sm font-medium tracking-wide animate-pulse">Incoming Call...</span>
                    ) : callStatus === 'disconnected' ? (
                        <span className="text-gray-500 text-sm font-medium tracking-wide">Call Ended</span>
                    ) : (callStatus === 'connecting' || !remoteUserJoined) && isOutgoing ? (
                        <span className="text-blue-400 text-sm font-medium tracking-wide animate-pulse">
                            {remoteStatus === 'ringing' ? 'Ringing...' : 'Calling...'}
                        </span>
                    ) : (callStatus === 'connecting' || (!remoteUserJoined && !isIncoming)) ? (
                        <span className="text-blue-400 text-sm font-medium tracking-wide animate-pulse">Connecting...</span>
                    ) : (
                        <span className="text-gray-400 font-bold text-lg">{formatDuration(callDuration)}</span>
                    )}
                </div>

                <div className="flex items-center gap-12 w-full justify-center mt-4">
                    {remoteStatus === 'rejected' ? (
                        <>
                            <div className="flex flex-col items-center gap-3">
                                <button 
                                    onClick={onClose}
                                    className="w-[68px] h-[68px] rounded-full bg-[#2A2A2A] border border-white/5 text-white flex items-center justify-center hover:bg-gray-600 transition-all duration-400 ease-out shadow-lg transform hover:-translate-y-1"
                                    title="Close"
                                >
                                    <MdClose className="w-8 h-8" />
                                </button>
                                <span className="text-gray-500 text-xs tracking-wider font-medium">Close</span>
                            </div>
                            {isOutgoing && (
                                <div className="flex flex-col items-center gap-3">
                                    <button 
                                        onClick={onCallAgain}
                                        className="w-[68px] h-[68px] rounded-full bg-[#34C759] text-white flex items-center justify-center transition-all duration-400 ease-out shadow-lg hover:shadow-[0_8px_25px_rgba(52,199,89,0.5)] transform hover:-translate-y-1 hover:bg-[#30D158]"
                                        title="Call Again"
                                    >
                                        <PiPhoneCallBold className="w-7 h-7" />
                                    </button>
                                    <span className="text-gray-500 text-xs tracking-wider font-medium">Call Again</span>
                                </div>
                            )}
                        </>
                    ) : callStatus === 'ringing' ? (
                        <>
                            <div className="flex flex-col items-center gap-3">
                                <button 
                                    onClick={() => handleReject('declined')}
                                    className="w-[68px] h-[68px] rounded-full bg-[#2A2A2A] border border-white/5 text-white flex items-center justify-center hover:bg-[#FF3B30] hover:border-[#FF3B30] transition-all duration-400 ease-out shadow-lg hover:shadow-[0_8px_25px_rgba(255,59,48,0.4)] transform hover:-translate-y-1"
                                    title="Decline"
                                >
                                    <PiPhoneDisconnectBold className="w-7 h-7" />
                                </button>
                                <span className="text-gray-500 text-xs tracking-wider font-medium">Decline</span>
                            </div>
                            
                            <div className="flex flex-col items-center gap-3">
                                <div className="relative flex items-center justify-center">
                                    <div className="absolute inset-0 rounded-full bg-[#34C759] animate-ping opacity-30" style={{ animationDuration: '2.5s' }}></div>
                                    <button 
                                        onClick={handleAccept}
                                        className="relative w-[68px] h-[68px] rounded-full bg-[#34C759] text-white flex items-center justify-center transition-all duration-400 ease-out shadow-lg hover:shadow-[0_8px_25px_rgba(52,199,89,0.5)] transform hover:-translate-y-1 hover:bg-[#30D158]"
                                        title="Accept"
                                    >
                                        <PiPhoneCallBold className="w-7 h-7" />
                                    </button>
                                </div>
                                <span className="text-gray-500 text-xs tracking-wider font-medium">Accept</span>
                            </div>
                        </>
                    ) : callStatus === 'disconnected' ? (
                        <div className="flex flex-col items-center gap-3">
                            <button 
                                onClick={onClose}
                                className="w-[68px] h-[68px] rounded-full bg-[#2A2A2A] border border-white/5 text-white flex items-center justify-center hover:bg-gray-600 transition-all duration-400 ease-out shadow-lg transform hover:-translate-y-1"
                                title="Close"
                            >
                                <MdClose className="w-8 h-8" />
                            </button>
                            <span className="text-gray-500 text-xs tracking-wider font-medium">Close</span>
                        </div>
                    ) : (
                        <>
                            <button 
                                onClick={toggleMute}
                                className={`w-[72px] h-[72px] rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
                                    isMuted 
                                        ? 'bg-white text-black' 
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                                title={isMuted ? "Unmute" : "Mute"}
                            >
                                {isMuted ? <PiMicrophoneSlashBold className="w-8 h-8" /> : <PiMicrophoneBold className="w-8 h-8" />}
                            </button>

                            <button 
                                onClick={handleEndCall}
                                className="w-[72px] h-[72px] rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-red-500/30"
                                title="End Call"
                            >
                                <PiPhoneDisconnectBold className="w-8 h-8" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AudioCall;
