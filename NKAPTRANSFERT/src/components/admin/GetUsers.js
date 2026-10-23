import api from '../../api';
// import { Modal } from 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Form, Modal, Table } from 'react-bootstrap';


const GetUsers = () => {
    const { t } = useTranslation();
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
                const response = await api.get('/api/users');

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
            users.filter((user) => {
                const displayName = (user.name || `${user.firstName || ''} ${user.lastName || ''}`).trim();
                return (displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (user.email || '').toLowerCase().includes(searchQuery.toLowerCase())) &&
                    (roleFilter.length === 0 || roleFilter.includes(user.role)) &&
                    (statusFilter.length === 0 || statusFilter.includes(user.status));
            })
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

        api.put(`/api/users/block-user/${userId}`, {})
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
        api.put(`/api/users/unblock-user/${userId}`, {})
        .then((res) => {
            alert(res.data.message);
            window.location.reload(); // Recharge pour mettre à jour la liste
        })
        .catch((error) => {
            console.error("Erreur lors du déblocage de l'utilisateur:", error);
        });
    };

    const confirmStatusChange = () => {
        if (userIdToUnblock) {
            handleUnblockUser(userIdToUnblock);
        } else if (userIdToBlock) {
            handleBlockUser(userIdToBlock);
        }
    };

    const handleExport = () => {
        api.get(`/api/users/export-users?format=${exportFormat}`, { 
            responseType: 'blob',
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
        <Modal.Title>{t('confirm')}</Modal.Title>
    </Modal.Header>

    <Modal.Body>
        <p>
            {userIdToUnblock
                ? t('confirmUnblock')
                : t('confirmBlock')}
        </p>
    </Modal.Body>

    <Modal.Footer>
        <Button variant="secondary" onClick={handleCloseModal}>
            {t('cancel')}
        </Button>
        <Button variant="primary" onClick={confirmStatusChange}>
            {t('confirm')}
        </Button>
    </Modal.Footer>
</Modal>

            <h2>{t('userList')}</h2>

            <Form.Group controlId="exportFormat" className="mb-3">
                <Form.Label>{t('exportFormat')}</Form.Label>
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
                {t('exportAs', { format: exportFormat.toUpperCase() })}
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
                <Form.Label>{t('searchUser')}</Form.Label>
                <Form.Control
                    type="text"
                    placeholder={t('searchByName')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button variant="primary" className="ms-2">{t('search')}</Button>
            </Form.Group>

            <Form.Group controlId="roleFilter" className="mb-3">
                <Form.Label>{t('filterByRole')}</Form.Label>
                <div>
                    <Form.Check 
                        type="checkbox" 
                        label={t('roleUser')} 
                        value="user" 
                        onChange={handleRoleChange} 
                    />
                    <Form.Check 
                        type="checkbox" 
                        label={t('roleAdmin')} 
                        value="admin" 
                        onChange={handleRoleChange} 
                    />
                    <Form.Check 
                        type="checkbox" 
                        label={t('roleSuperAdmin')} 
                        value="superAdmin" 
                        onChange={handleRoleChange} 
                    />
                </div>
            </Form.Group>

            <Form.Group controlId="statusFilter" className="mb-3">
                <Form.Label>{t('filterByStatus')}</Form.Label>
                <div>
                    <Form.Check 
                        type="checkbox" 
                        label={t('statusActive')} 
                        value="active" 
                        onChange={handleStatusChange} 
                    />
                    <Form.Check 
                        type="checkbox" 
                        label={t('statusBlocked')} 
                        value="blocked" 
                        onChange={handleStatusChange} 
                    />
                </div>
            </Form.Group>

            {loading ? (
                <p>{t('loading')}</p>
            ) : message ? (
                <p>{message}</p>
            ) : (
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>{t('nameRequired')}</th>
                            <th>{t('email')}</th>
                            <th>{t('phone')}</th>
                            <th>{t('createdAt')}</th>
                            <th>{t('role')}</th>
                            <th>{t('state')}</th>
                            <th>{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user, index) => (
                                <tr key={index}>
                                    <td>{user.id}</td>
                                    <td>{user.name || `${user.firstName || ''} ${user.lastName || ''}`}</td>
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
                                                {t('block')}
                                            </Button>
                                        ) : (
                                            <Button 
                                                variant="success" 
                                                onClick={() => handleShowModal(user.id, user.status)}
                                            >
                                                {t('unblock')}
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8">{t('noUsers')}</td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            )}
        </div>
    );
};

export default GetUsers;
