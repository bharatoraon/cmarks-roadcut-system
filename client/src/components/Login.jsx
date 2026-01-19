import React, { useState } from 'react';
import { X, LogIn } from 'lucide-react';
import axios from 'axios';

export default function Login({ onClose, onLogin }) {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [isRegister, setIsRegister] = useState(false);
    const [agencies, setAgencies] = useState([]);
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        if (isRegister) {
            axios.get('http://localhost:5001/api/agencies').then(res => setAgencies(res.data));
        }
    }, [isRegister]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const endpoint = isRegister ? '/register' : '/login';
            const payload = isRegister ? { ...formData, agency_id: parseInt(formData.agency_id) } : formData;
            const res = await axios.post(`http://localhost:5001/api/auth${endpoint}`, payload);
            localStorage.setItem('token', res.data.token);
            onLogin(res.data.user);
            onClose();
        } catch (err) {
            alert(err.response?.data?.error || 'Error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="glass-panel animate-fade-in" style={{ width: '400px', padding: '32px', position: 'relative', background: '#1e293b' }}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                    <X size={24} />
                </button>

                <h2 style={{ marginTop: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <LogIn size={24} />
                    {isRegister ? 'Register' : 'Login'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    {isRegister ? 'Create an account to apply for road cuts' : 'Login to your agency account'}
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Username</label>
                        <input
                            type="text"
                            className="input-field"
                            required
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Password</label>
                        <input
                            type="password"
                            className="input-field"
                            required
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    {isRegister && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Agency</label>
                            <select
                                className="input-field"
                                required
                                value={formData.agency_id}
                                onChange={e => setFormData({ ...formData, agency_id: e.target.value })}
                            >
                                <option value="">Select Agency</option>
                                {agencies.map(agency => (
                                    <option key={agency.id} value={agency.id}>{agency.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Processing...' : (isRegister ? 'Register' : 'Login')}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '16px', color: 'var(--text-secondary)' }}>
                    {isRegister ? 'Already have an account?' : "Don't have an account?"}
                    <button
                        onClick={() => setIsRegister(!isRegister)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', marginLeft: '4px' }}
                    >
                        {isRegister ? 'Login' : 'Register'}
                    </button>
                </p>
            </div>
        </div>
    );
}