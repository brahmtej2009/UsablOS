import React, { useState, useEffect } from 'react';
import { useOSStore } from '../store/useOSStore';
import { 
  Rocket, 
  Orbit, 
  RefreshCw,
  ExternalLink,
  Radio,
  Monitor,
  Camera,
  Play
} from 'lucide-react';

const NASA_API_KEY = 'DEMO_KEY';

interface APODData {
  title: string;
  url: string;
  hdurl?: string;
  explanation: string;
  date: string;
  media_type: string;
  copyright?: string;
}

interface NewsItem {
  id: number;
  title: string;
  url: string;
  image_url: string;
  news_site: string;
  summary: string;
  published_at: string;
}

const Cosmos: React.FC = () => {
    const { user } = useOSStore();
    const isLight = user.theme === 'light';
    const [tab, setTab] = useState<'home' | 'iss' | 'jwst'>('home');
    
    const [apod, setApod] = useState<APODData | null>({
        title: "Carina Nebula: Cosmic Cliffs",
        url: "https://images-assets.nasa.gov/image/PIA25325/PIA25325~orig.jpg",
        hdurl: "https://images-assets.nasa.gov/image/PIA25325/PIA25325~orig.jpg",
        explanation: "This landscape of 'mountains' and 'valleys' speckled with glittering stars is actually the edge of a nearby, young, star-forming region called NGC 3324 in the Carina Nebula. Captured in infrared light by NASA’s James Webb Space Telescope, this image reveals for the first time previously invisible areas of star birth.",
        date: "Mission Default",
        media_type: "image",
        copyright: "NASA / STScI"
    });
    const [issData, setIssData] = useState<any>(null);
    const [issHistory, setIssHistory] = useState<{lat: number, lng: number}[]>([]);
    const [jwstNews, setJwstNews] = useState<NewsItem[]>([]);
    const [jwstImages, setJwstImages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const textColor = isLight ? '#0f172a' : 'white';
    const glassBg = isLight ? 'rgba(255, 255, 255, 0.4)' : 'rgba(10, 10, 15, 0.7)';
    const cardBg = isLight ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.03)';
    const borderColor = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)';

    useEffect(() => {
        if (tab === 'home') fetchAPOD();
        if (tab === 'jwst') {
            fetchJWSTNews();
            fetchJWSTImages();
        }
        if (tab === 'iss') {
            const interval = setInterval(fetchISS, 3000);
            fetchISS();
            return () => clearInterval(interval);
        }
    }, [tab]);

    const fetchAPOD = async () => {
        setLoading(true);
        try {
            const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`);
            if (res.status === 429) {
                console.warn('NASA API Limit Reached - Using Premium Internal Catalog');
                // We keep the initial state which is high-quality
            } else {
                const data = await res.json();
                if (data.url) setApod(data);
            }
        } catch (e) { 
            console.error('APOD Error:', e); 
        }
        setLoading(false);
    };

    const fetchJWSTNews = async () => {
        try {
            const res = await fetch('https://api.spaceflightnewsapi.net/v4/articles/?search=Webb&limit=1');
            const data = await res.json();
            if (data.results && data.results.length > 0) {
                setJwstNews([data.results[0]]);
            }
        } catch (e) { console.error(e); }
    };

    const fetchJWSTImages = async () => {
        try {
            const currentYear = new Date().getFullYear();
            const res = await fetch(`https://images-api.nasa.gov/search?q=James%20Webb&media_type=image&year_start=${currentYear - 1}`);
            const data = await res.json();
            if (data.collection && data.collection.items) {
                // Take newest items first
                const items = data.collection.items.slice(0, 16);
                setJwstImages(items);
            }
        } catch (e) { console.error(e); }
    };

    const fetchISS = async () => {
        try {
            const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
            const data = await res.json();
            setIssData(data);
            setIssHistory(prev => {
                const newPos = { lat: data.latitude, lng: data.longitude };
                const filtered = prev.filter(p => Math.abs(p.lng - newPos.lng) < 50); 
                return [...filtered, newPos].slice(-50);
            });
        } catch (e) { console.error(e); }
    };

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%', 
            background: glassBg, 
            backdropFilter: 'blur(35px) saturate(200%)',
            color: textColor, 
            fontFamily: '"Outfit", "Inter", sans-serif',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <header style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '0 24px', 
                height: '74px',
                borderBottom: `1px solid ${borderColor}`,
                background: isLight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.15)',
                flexShrink: 0 
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ 
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
                        padding: '10px', 
                        borderRadius: '14px',
                        boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)'
                    }}>
                        <Rocket size={20} color="white" />
                    </div>
                    <div>
                        <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.4px', display: 'block' }}>COSMOS</span>
                        <div style={{ fontSize: '10px', opacity: 0.6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px' }}>DEEP SPACE MISSION CONTROL</div>
                    </div>
                </div>

                <nav style={{ display: 'flex', gap: '8px', background: isLight ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.05)', padding: '5px', borderRadius: '14px', border: `1px solid ${borderColor}` }}>
                    {[
                        { id: 'home', label: 'APOD', icon: <Monitor size={15} /> },
                        { id: 'iss', label: 'ISS Stream', icon: <Orbit size={15} /> },
                        { id: 'jwst', label: 'James Webb', icon: <Camera size={15} /> }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id as any)}
                            style={{
                                padding: '10px 22px',
                                background: tab === t.id ? (isLight ? '#fff' : 'rgba(255,255,255,0.12)') : 'transparent',
                                border: 'none',
                                color: tab === t.id ? (isLight ? '#6366f1' : '#a5b4fc') : textColor,
                                borderRadius: '10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                fontSize: '14px',
                                fontWeight: 800,
                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                boxShadow: tab === t.id && isLight ? '0 10px 15px -3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            {t.icon}
                            {t.label}
                        </button>
                    ))}
                </nav>
            </header>

            <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                {loading && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
                        <RefreshCw className="animate-spin" size={40} color="#6366f1" />
                        <span style={{ fontSize: '14px', fontWeight: 700, opacity: 0.6, letterSpacing: '3px' }}>FETCHING MISSION DATA...</span>
                    </div>
                )}
                
                {/* ── APOD PANEL ── */}
                {tab === 'home' && apod && !loading && (
                    <div style={{ maxWidth: '1300px', margin: '0 auto', animation: 'fadeInScale 1s cubic-bezier(0.16, 1, 0.3, 1)', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {/* Main Visual Uplink */}
                        <div style={{ position: 'relative', borderRadius: '40px', overflow: 'hidden', height: '650px', boxShadow: '0 50px 120px -30px rgba(0, 0, 0, 0.8)', border: `1px solid ${borderColor}`, background: '#000', flexShrink: 0 }}>
                            {apod.media_type === 'image' ? (
                                <img 
                                    src={apod.url || apod.hdurl} 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                                    alt={apod.title} 
                                />
                            ) : (
                                <iframe 
                                    src={apod.url} 
                                    style={{ width: '100%', height: '100%', border: 'none', background: '#000' }} 
                                    title="APOD Content" 
                                    allowFullScreen 
                                />
                            )}
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.4))' }} />
                        </div>

                        {/* Analysis & Mission Intel */}
                        <div style={{ 
                            background: cardBg, 
                            padding: '48px', 
                            borderRadius: '40px', 
                            border: `1px solid ${borderColor}`, 
                            backdropFilter: 'blur(30px)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '32px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ maxWidth: '900px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                                        <div style={{ background: '#6366f1', color: 'white', padding: '6px 18px', borderRadius: '40px', fontSize: '11px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '2px', boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)' }}>Mission Observation</div>
                                        <span style={{ opacity: 0.6, fontSize: '14px', fontWeight: 800 }}>{apod.date}</span>
                                    </div>
                                    <h1 style={{ fontSize: '48px', fontWeight: 950, margin: '0 0 24px 0', letterSpacing: '-2px', lineHeight: 1 }}>{apod.title}</h1>
                                    <p style={{ fontSize: '20px', opacity: 0.9, lineHeight: 1.7, margin: 0, fontWeight: 500 }}>{apod.explanation}</p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flexShrink: 0 }}>
                                    <button 
                                        onClick={() => window.open(apod.hdurl || apod.url, '_blank')}
                                        style={{ background: '#6366f1', color: 'white', border: 'none', padding: '14px 32px', borderRadius: '16px', fontSize: '14px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 30px rgba(99, 102, 241, 0.3)', transition: 'all 0.3s' }}
                                    >
                                        <ExternalLink size={18} /> EXTRACT HD
                                    </button>
                                    {apod.copyright && (
                                        <div style={{ textAlign: 'right', paddingRight: '12px' }}>
                                            <div style={{ fontSize: '10px', opacity: 0.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Source Intel</div>
                                            <div style={{ fontSize: '13px', fontWeight: 900 }}>{apod.copyright}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── ISS PANEL ── */}
                {tab === 'iss' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '32px', height: '100%', animation: 'slideRight 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <div style={{ background: cardBg, borderRadius: '32px', border: `1px solid ${borderColor}`, padding: '32px', flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 900 }}>Orbital Ground Track</h3>
                                        <div style={{ fontSize: '13px', opacity: 0.6, fontWeight: 700 }}>Telemetry established via WTHISS Cluster</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(16, 185, 129, 0.1)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)' }}>
                                        <div className="pulse-dot" style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }} />
                                        <span style={{ fontSize: '12px', fontWeight: 900, color: '#10b981' }}>LIVE UPLINK</span>
                                    </div>
                                </div>

                                <div style={{ position: 'relative', flex: 1, minHeight: '400px', background: '#000', borderRadius: '24px', overflow: 'hidden', backgroundImage: 'url("https://upload.wikimedia.org/wikipedia/commons/8/83/Equirectangular_projection_SW.jpg")', backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
                                    <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none', width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
                                        <polyline
                                            points={issHistory.map(p => `${((p.lng + 180) / 360) * 100},${((90 - p.lat) / 180) * 100}`).join(' ')}
                                            fill="none"
                                            stroke="#a5b4fc"
                                            strokeWidth="0.5"
                                            strokeDasharray="1,1"
                                            opacity="0.8"
                                        />
                                    </svg>
                                    {issData && (
                                        <div style={{ position: 'absolute', left: `${((issData.longitude + 180) / 360) * 100}%`, top: `${((90 - issData.latitude) / 180) * 100}%`, transform: 'translate(-50%, -50%)', transition: 'all 3s linear' }}>
                                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <div className="ping-effect" style={{ borderColor: '#6366f1' }} />
                                                <div style={{ background: '#6366f1', padding: '10px', borderRadius: '50%', boxShadow: '0 0 30px #6366f1', zIndex: 10 }}>
                                                    <Orbit size={18} color="white" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ background: cardBg, padding: '40px', borderRadius: '32px', border: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#6366f1', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Radio size={18} />
                                Mission Telemetry
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                                {[
                                    { label: 'ALTITUDE', value: issData ? `${issData.altitude.toFixed(1)} KM` : '---', icon: <Play size={10} /> },
                                    { label: 'VELOCITY', value: issData ? `${Math.round(issData.velocity).toLocaleString()} KM/H` : '---', icon: <Play size={10} /> },
                                    { label: 'LATITUDE', value: issData ? `${issData.latitude.toFixed(4)}°` : '---', icon: <Play size={10} /> },
                                    { label: 'LONGITUDE', value: issData ? `${issData.longitude.toFixed(4)}°` : '---', icon: <Play size={10} /> },
                                    { label: 'VISIBILITY', value: issData ? issData.visibility.toUpperCase() : '---', icon: <Play size={10} /> }
                                ].map(item => (
                                    <div key={item.label}>
                                        <div style={{ fontSize: '11px', color: '#6366f1', fontWeight: 800, letterSpacing: '2px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>{item.icon}{item.label}</div>
                                        <div style={{ fontSize: '32px', fontWeight: 950, fontFamily: 'monospace', letterSpacing: '1px' }}>{item.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── JWST PANEL ── */}
                {tab === 'jwst' && (
                    <div style={{ animation: 'fadeInScale 0.8s cubic-bezier(0.16, 1, 0.3, 1)', maxWidth: '1400px', margin: '0 auto' }}>
                        {/* Headline */}
                        {jwstNews.length > 0 && (
                            <div 
                                onClick={() => window.open(jwstNews[0].url, '_blank')}
                                style={{ background: cardBg, borderRadius: '40px', overflow: 'hidden', border: `1px solid ${borderColor}`, marginBottom: '56px', display: 'grid', gridTemplateColumns: 'minmax(400px, 1.2fr) 1fr', cursor: 'pointer', boxShadow: '0 40px 90px -15px rgba(0,0,0,0.5)', transition: 'all 0.4s ease' }}
                                className="headline-card"
                            >
                                <img src={jwstNews[0].image_url} style={{ width: '100%', height: '500px', objectFit: 'cover' }} alt="JWST Insight" />
                                <div style={{ padding: '56px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div style={{ background: 'linear-gradient(90deg, #ec4899, #f43f5e)', color: 'white', padding: '6px 16px', borderRadius: '30px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', width: 'fit-content', marginBottom: '24px', letterSpacing: '1px' }}>LATEST JWST HEADLINE</div>
                                    <h2 style={{ fontSize: '36px', fontWeight: 950, margin: '0 0 24px 0', lineHeight: 1.1, letterSpacing: '-1.5px' }}>{jwstNews[0].title}</h2>
                                    <p style={{ fontSize: '18px', opacity: 0.7, lineHeight: 1.7, margin: '0 0 40px 0' }}>{jwstNews[0].summary}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ec4899', fontSize: '16px', fontWeight: 900 }}>
                                        VIEW MISSION RECAP <ExternalLink size={18} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div>
                                <h2 style={{ fontSize: '28px', fontWeight: 950, margin: 0, letterSpacing: '-1px' }}>Recent Imagery Discovery</h2>
                                <p style={{ margin: '6px 0 0 0', opacity: 0.6, fontSize: '15px', fontWeight: 700 }}>Filtered for latest deep space captures (2024+)</p>
                            </div>
                            <button onClick={fetchJWSTImages} style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${borderColor}`, color: textColor, padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><RefreshCw size={14} /> REFRESH FEED</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px' }}>
                            {jwstImages.map((item, idx) => (
                                <div key={item.data[0].nasa_id} style={{ borderRadius: '28px', overflow: 'hidden', border: `1px solid ${borderColor}`, background: cardBg, animation: `popIn 0.6s ${idx * 0.05}s both`, cursor: 'pointer' }} className="gallery-card">
                                    <div style={{ height: '260px', overflow: 'hidden', position: 'relative' }}>
                                        <img src={item.links[0].href} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={item.data[0].title} />
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', opacity: 0, transition: 'opacity 0.3s' }} className="overlay">
                                            <div style={{ color: 'white', fontSize: '12px', fontWeight: 800 }}>NASA_ID: {item.data[0].nasa_id}</div>
                                        </div>
                                    </div>
                                    <div style={{ padding: '24px' }}>
                                        <div style={{ fontSize: '15px', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '6px' }}>{item.data[0].title}</div>
                                        <div style={{ fontSize: '12px', opacity: 0.5, fontWeight: 700 }}>Captured: {new Date(item.data[0].date_created).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800;900&display=swap');
                
                @keyframes popIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes fadeInScale {
                    from { opacity: 0; transform: scale(0.97) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes slideRight {
                    from { opacity: 0; transform: translateX(-30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0% { transform: scale(0.95); opacity: 0.5; }
                    50% { transform: scale(1); opacity: 1; }
                    100% { transform: scale(0.95); opacity: 0.5; }
                }
                @keyframes ping-effect {
                    0% { transform: scale(1); opacity: 1; }
                    75%, 100% { transform: scale(3.5); opacity: 0; }
                }
                .animate-spin {
                    animation: spin 5s linear infinite;
                }
                .pulse-dot {
                    animation: pulse 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
                }
                .ping-effect {
                    position: absolute;
                    inset: -10px;
                    border: 3px solid #6366f1;
                    border-radius: 50%;
                    animation: ping-effect 2s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
                .headline-card:hover {
                    transform: translateY(-10px) scale(1.01);
                    box-shadow: 0 50px 100px -20px rgba(0,0,0,0.6);
                }
                .gallery-card:hover {
                    transform: translateY(-5px);
                    border-color: #6366f1;
                }
                .gallery-card:hover .overlay {
                    opacity: 1;
                }
                ::-webkit-scrollbar {
                    width: 8px;
                }
                ::-webkit-scrollbar-track {
                    background: transparent;
                }
                ::-webkit-scrollbar-thumb {
                    background: ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)'};
                    border-radius: 20px;
                    border: 2px solid transparent;
                    background-clip: content-box;
                }
            `}</style>
        </div>
    );
}

export default Cosmos;
