import React, { useState } from "react";
import { Button } from "react-bootstrap";
import CreateAdmin from "./CreateAdmin";
import CreateUser from "./CreateUser";
import GetUsers from "./GetUsers";

function AdminInterface() {
    // État pour contrôler quel composant afficher
    const [view, setView] = useState(null);

    return (
        <div>
            <h1>Admin Interface</h1>
            {/* Boutons pour changer de vue */}
            <Button variant="primary" onClick={() => setView("createUser")}>Créer un utilisateur</Button>
            <Button variant="primary" onClick={() => setView("createAdmin")}>Créer un admin</Button>
            <Button variant="primary" onClick={() => setView("getUsers")}>Voir les utilisateurs</Button>

            {/* Affichage dynamique des composants en fonction de l'état */}
            {view === "createUser" && <CreateUser />}
            {view === "createAdmin" && <CreateAdmin />}
            {view === "getUsers" && <GetUsers />}
        </div>
    );
}

export default AdminInterface;
