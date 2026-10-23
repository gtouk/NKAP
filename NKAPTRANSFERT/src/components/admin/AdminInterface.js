import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "react-bootstrap";
import CreateAdmin from "./CreateAdmin";
import CreateUser from "./CreateUser";
import GetUsers from "./GetUsers";

function AdminInterface() {
    const { t } = useTranslation();
    // État pour contrôler quel composant afficher
    const [view, setView] = useState(null);

    return (
        <div className="panel" style={{ padding: 24 }}>
            <h1>{t('adminTitle')}</h1>
            <p>{t('adminHelp')}</p>
            <div className="admin-switch">
            <Button className={view === 'createUser' ? 'active' : ''} onClick={() => setView("createUser")}>{t('createUser')}</Button>
            <Button className={view === 'createAdmin' ? 'active' : ''} onClick={() => setView("createAdmin")}>{t('createAdmin')}</Button>
            <Button className={view === 'getUsers' ? 'active' : ''} onClick={() => setView("getUsers")}>{t('viewUsers')}</Button>
            </div>

            {/* Affichage dynamique des composants en fonction de l'état */}
            {view === "createUser" && <CreateUser />}
            {view === "createAdmin" && <CreateAdmin />}
            {view === "getUsers" && <GetUsers />}
        </div>
    );
}

export default AdminInterface;
