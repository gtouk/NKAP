import axios from 'axios';
// import { Modal } from 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useEffect, useState } from 'react';
import { Button, Form, Modal, Table } from 'react-bootstrap';


const GetUsers = () => {
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [roleFilter, setRoleFilter] = useState([]);
    const [statusFilter, setStatusFilter] = useState([]);
    const [exportFormat, setExportFormat] = useState('csv');
    const [showModal, setShowModal] = useState(false);
    const [userIdToUnblock, setUserIdToUnblock] = useState(null);
    const [userIdToBlock, setUserIdToBlock] = useState(null);
    // const [blockDuration, setBlockDuration] = useState(0); // Durée en minutes

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get('http://localhost:3000/api/users', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });

                if (Array.isArray(response.data)) {
                    setUsers(response.data);
                } else {
                    setMessage('Aucun utilisateur trouvé ou format incorrect des données.');
                }
                setLoading(false);
            } catch (error) {
                console.error('Erreur lors de la récupération des utilisateurs:', error.response ? error.response.data : error.message);                
                setMessage('Une erreur est survenue lors de la récupération des utilisateurs.');
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    useEffect(() => {
        setFilteredUsers(
            users.filter((user) => 
                (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
                (roleFilter.length === 0 || roleFilter.includes(user.role)) &&
                (statusFilter.length === 0 || statusFilter.includes(user.status))
            )
        );
    }, [searchQuery, roleFilter, statusFilter, users]);

    const handleRoleChange = (e) => {
        const value = e.target.value;
        setRoleFilter(prev =>
           prev.includes(value) ? prev.filter(role => role !== value) : [...prev, value]
        );
    };

    const handleStatusChange = (e) => {
        const value = e.target.value;
        setStatusFilter(prev =>
              prev.includes(value) ? prev.filter(status => status !== value) : [...prev, value]
        );
    };


    const handleShowModal = (userId, status) => {
        setShowModal(true);
        if (status === 'active') {
            // Si l'utilisateur est actif, on le prépare pour le bloquer
            setUserIdToBlock(userId);
            setUserIdToUnblock(null);
        } else if (status === 'blocked') {
            // Si l'utilisateur est bloqué, on le prépare pour le débloquer
            setUserIdToUnblock(userId);
            setUserIdToBlock(null);
        }
    };
    

    const handleCloseModal = () => {
        setShowModal(false); // Ferme le modal sans rien faire
        setUserIdToBlock(null);
        setUserIdToUnblock(null);
    };

    // 📌 Fonction pour bloquer un utilisateur
    const handleBlockUser = (userId) => {   
            // if (!window.confirm("Êtes-vous sûr de vouloir bloquer cet utilisateur ?")) {
            //     return;
            // }
            setShowModal(false); // Ferme le modal après l'action
            setUserIdToBlock(null);

        axios.put(`http://localhost:3000/api/users/block-user/${userId}`,{},  {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            }
        })
        .then((res) => {
            alert(res.data.message);
            window.location.reload(); // Recharge pour mettre à jour la liste
        })
        .catch((error) => {
            console.error("Erreur lors du blocage de l'utilisateur:", error.response ? error.response.data : error.message);
        });
    };

    // 📌 Fonction pour débloquer un utilisateur
    const handleUnblockUser = (userId) => {
        // if (!window.confirm("Êtes-vous sûr de vouloir debloquer cet utilisateur ?")) {
        //     return;
        // }

        setShowModal(false); // Ferme le modal après l'action
        setUserIdToUnblock(null);
        axios.put(`http://localhost:3000/api/users/unblock-user/${userId}`, {}, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            }
        })
        .then((res) => {
            alert(res.data.message);
            window.location.reload(); // Recharge pour mettre à jour la liste
        })
        .catch((error) => {
            console.error("Erreur lors du déblocage de l'utilisateur:", error);
        });
    };

    const userBlockStatus = (status) => {
        if (status === 'active') {
            handleUnblockUser(userIdToUnblock);
        } else {
            handleBlockUser(userIdToBlock);
        }
    };

    const handleExport = () => {
        axios.get(`http://localhost:3000/api/users/export-users?format=${exportFormat}`, { 
            responseType: 'blob',
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
         })
        .then((response) => {
            let filename = 'users';
            switch (exportFormat) {
                case 'csv':
                    filename = 'users.csv';
                    break;
                case 'pdf':
                    filename = 'users.pdf';
                    break;
                case 'excel':
                    filename = 'users.xlsx';
                    break;
                default:
                    filename = 'users.csv';
            }

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);  
            document.body.appendChild(link);
            link.click();
        })
        .catch((error) => {
            console.error("Erreur lors de l'exportation des utilisateurs:", error);
        });
    };


    return (
        <div>
            
            {/* Modal de confirmation */}
            <Modal show={showModal} onHide={handleCloseModal}>
    <Modal.Header closeButton>
        <Modal.Title>Confirmation</Modal.Title>
    </Modal.Header>

    <Modal.Body>
        {/* Conditionner le texte selon si l'utilisateur est bloqué ou non */}
        <p>
            {userIdToUnblock 
                ? "Êtes-vous sûr de vouloir débloquer cet utilisateur ?" 
                : "Êtes-vous sûr de vouloir bloquer cet utilisateur ?"}
        </p>
    </Modal.Body>

    <Modal.Footer>
        <Button variant="secondary" onClick={handleCloseModal}>
            Annuler
        </Button>
        <Button variant="primary" onClick={userBlockStatus}>
            Confirmer
        </Button>
    </Modal.Footer>
</Modal>

            <h2>Liste des utilisateurs</h2>

            {/* Format d'exportation */}
            <Form.Group controlId="exportFormat" className="mb-3">
                <Form.Label>Sélectionnez le format d'exportation</Form.Label>
                <Form.Control
                    as="select"
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                >
                    <option value="csv">CSV</option>
                    <option value="pdf">PDF</option>
                    <option value="excel">Excel</option>
                </Form.Control>
            </Form.Group>
            <Button variant="primary" onClick={handleExport}>
                Exporter en {exportFormat.toUpperCase()}
            </Button>

            {/* Saisie de la durée du blocage */}
            {/* <Form.Group controlId="blockDuration" className="mb-3">
                <Form.Label>Durée du blocage (en minutes)</Form.Label>
                <Form.Control
                    type="number"
                    value={blockDuration}
                    onChange={(e) => setBlockDuration(e.target.value)}
                    placeholder="Entrez la durée en minutes"
                />
            </Form.Group> */}

            <Form.Group controlId="searchUsers" className="mb-3 d-flex align-items-center">
                <Form.Label>Rechercher un utilisateur</Form.Label>
                <Form.Control
                    type="text"
                    placeholder="Rechercher par nom ou email"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button variant="primary" className="ms-2">Rechercher</Button>
            </Form.Group>

            <Form.Group controlId="roleFilter" className="mb-3">
                <Form.Label>Filtrer par rôle :</Form.Label>
                <div>
                    <Form.Check 
                        type="checkbox" 
                        label="Utilisateur" 
                        value="user" 
                        onChange={handleRoleChange} 
                    />
                    <Form.Check 
                        type="checkbox" 
                        label="Administrateur" 
                        value="admin" 
                        onChange={handleRoleChange} 
                    />
                    <Form.Check 
                        type="checkbox" 
                        label="Super Administrateur" 
                        value="superAdmin" 
                        onChange={handleRoleChange} 
                    />
                </div>
            </Form.Group>

            <Form.Group controlId="statusFilter" className="mb-3">
                <Form.Label>Filtrer par statut :</Form.Label>
                <div>
                    <Form.Check 
                        type="checkbox" 
                        label="Actif" 
                        value="active" 
                        onChange={handleStatusChange} 
                    />
                    <Form.Check 
                        type="checkbox" 
                        label="Bloqué" 
                        value="blocked" 
                        onChange={handleStatusChange} 
                    />
                </div>
            </Form.Group>

            {loading ? (
                <p>Chargement...</p>
            ) : message ? (
                <p>{message}</p>
            ) : (
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nom</th>
                            <th>Email</th>
                            <th>Téléphone</th>
                            <th>Date de création</th>
                            <th>Rôle</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user, index) => (
                                <tr key={index}>
                                    <td>{user.id}</td>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>{user.phone}</td>
                                    <td>{user.created_at}</td>
                                    <td>{user.role}</td>
                                    <td>{user.status}</td>
                                    <td>
                                        {user.status === 'active' ? (
                                            <Button 
                                                variant="warning" 
                                                onClick={() => handleShowModal(user.id, user.status)}
                                            >
                                                Bloquer
                                            </Button>
                                        ) : (
                                            <Button 
                                                variant="success" 
                                                onClick={() => handleShowModal(user.id, user.status)}
                                            >
                                                Débloquer
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8">Aucun utilisateur trouvé</td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            )}
        </div>
    );
};

export default GetUsers;
