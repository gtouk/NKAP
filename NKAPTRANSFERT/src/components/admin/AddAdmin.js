import axios from 'axios';
import React, { useState } from 'react';

function AddAdmin() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token'); // Token du super admin
            const response = await axios.post(
                'http://localhost:3000/users/register',
                { email, password },
                { headers: { Authorization: token } }
            );
            setMessage(response.data.message);
            setEmail('');
            setPassword('');
        } catch (error) {
            console.error(error);
            setMessage(error.response?.data?.message || 'Erreur');
        }
    };

    return (
        <div>
            <h1>Ajouter un administrateur</h1>
            <form onSubmit={handleSubmit}>
            <div>
                    <label>Nom :</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Telephone :</label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Email :</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Mot de passe :</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Créer un administrateur</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
}

export default AddAdmin;
