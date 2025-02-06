import axios from "axios";
import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

const LogoutButton = () => {
    const {logout} = useContext(AuthContext);
    const navigate = useNavigate();


    const handleLogout = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.post(
                `http://${process.env.REACT_NKAP_DEMO_API_URL}/api/users/logout`, 
                { token }, // Les données vont ici
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    }
                }
            );
    
            if (response.status === 200) { // Axios utilise `status` et pas `ok`
                // localStorage.removeItem('token');
                logout();
                navigate('/login');
            } else {
                console.log('Erreur lors de la déconnexion');
            }
        } catch (error) {
            console.log('Erreur :', error);
        }
    };
    

    return (
        <button onClick={handleLogout} className="btn btn-danger">Déconnexion</button>
            );
        };

export default LogoutButton;