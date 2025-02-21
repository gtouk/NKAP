import axios from 'axios';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import React, { useEffect, useState } from 'react';
import { Button, Col, Container, Modal, Row, Table } from 'react-bootstrap';
import styled from 'styled-components';
import TransactionChart from './TransactionChart';



const StyledModal = styled(Modal)`
  .modal-content {
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border: none;
    background-color: #FFFFFF;
  }

  .modal-header {
    background-color: #16A085;
    color: #FFFFFF;
    border-bottom: none;
    padding: 15px 20px;
  }

  .modal-title {
    font-size: 20px;
    font-weight: 600;
    font-family: 'Poppins', sans-serif;
  }

  .modal-body {
    padding: 20px;
    font-family: 'Poppins', sans-serif;
    color: #2C3E50;
  }

  .modal-body p {
    margin: 10px 0;
    font-size: 16px;
    line-height: 1.5;
  }

  .modal-body strong {
    color: #16A085;
    font-weight: 600;
  }

  .modal-footer {
    border-top: none;
    padding: 15px 20px;
    justify-content: center;
  }

  .btn-secondary {
    background-color: #2C3E50;
    border: none;
    padding: 10px 20px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 5px;
    transition: background-color 0.3s ease;
  }

  .btn-secondary:hover {
    background-color: #1A2634;
  }
`;

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found, please log in.');
        }

        const response = await axios.get('http://localhost:3000/api/transactions/get-transactions', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setTransactions(response.data);
      } catch (error) {
        setError(error.message || 'Error fetching transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const handleShowInvoice = (transaction) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTransaction(null);
  };

  const downloadInvoice = () => {
    if (selectedTransaction) {
      const doc = new jsPDF();
  
      // Configuration des polices et couleurs
      doc.setFont('Helvetica', 'normal'); // Helvetica pour un look plus propre qu'Arial
      const primaryColor = '#16A085'; // Vert émeraude de votre thème
      const textColor = '#2C3E50'; // Bleu foncé pour le texte
  
      // En-tête
      doc.setFillColor(primaryColor);
      doc.rect(0, 0, 210, 40, 'F'); // Rectangle vert en haut (largeur A4 = 210mm)
      doc.setTextColor('#FFFFFF');
      doc.setFontSize(20);
      doc.setFont('Helvetica', 'bold');
      doc.text('Facture de Transaction', 20, 25);
  
      // Sous-titre
      doc.setTextColor(textColor);
      doc.setFontSize(12);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Générée le ${new Date().toLocaleDateString()}`, 20, 35);
  
      // Section Détails de la Transaction
      doc.setFontSize(16);
      doc.setFont('Helvetica', 'bold');
      doc.text('Détails', 20, 50);
      doc.setLineWidth(0.5);
      doc.setDrawColor(primaryColor);
      doc.line(20, 52, 80, 52); // Ligne verte sous "Détails"
  
      // Informations alignées dans un tableau stylisé
      const startY = 60;
      doc.setFontSize(12);
      doc.setFont('Helvetica', 'normal');
      const details = [
        ['Destinataire', selectedTransaction.recipient_name],
        ['Montant', `${selectedTransaction.amount} $`],
        ['Date', new Date(selectedTransaction.transaction_date).toLocaleDateString()],
        ['Méthode', selectedTransaction.method],
        ['État', selectedTransaction.transactionState],
        ['Numéro de compte', selectedTransaction.accountNumber],
        ['Adresse', `${selectedTransaction.recipientAddress}, ${selectedTransaction.recipientTown}`]
      ];
  
      details.forEach((item, index) => {
        const y = startY + index * 10;
        doc.setTextColor(primaryColor);
        doc.setFont('Helvetica', 'bold');
        doc.text(`${item[0]} :`, 20, y); // Label en vert
        doc.setTextColor(textColor);
        doc.setFont('Helvetica', 'normal');
        doc.text(item[1], 70, y); // Valeur en bleu foncé
      });
  
      // Bordure autour des détails
      doc.setDrawColor('#DDD');
      doc.setLineWidth(0.2);
      doc.rect(15, 45, 180, 80, 'S'); // Rectangle gris clair autour des détails
  
      // Pied de page
      doc.setFontSize(10);
      doc.setTextColor('#999');
      doc.text('TransferFast - Votre solution de transfert sécurisée', 20, 280);
      doc.text(`ID Transaction: ${selectedTransaction.transaction_id}`, 150, 280);
  
      // Téléchargement
      doc.save(`Facture_${selectedTransaction.transaction_id}.pdf`);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <Container className="mt-5">
      <Row>
        <Col>
          <h2>Historique des Transactions</h2>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Destinataire</th>
                <th>Montant</th>
                <th>Date</th>
                <th>Methode</th>
                <th>transactionState</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction, index) => (
                <tr key={index}>
                  <td>{transaction.recipient_name}</td>
                  <td>{transaction.amount} $</td>
                  <td>{new Date(transaction.transaction_date).toLocaleDateString()}</td>
                  <td>{transaction.method}</td>
                  <td>{transaction.transactionState}</td>
                  <td>
                    <Button variant='primary' size='sm' onClick={() => handleShowInvoice(transaction)}>
                      Facture
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <TransactionChart transactions={transactions} />
        </Col>
      </Row>

      {/* Modale pour afficher la facture */}
      <StyledModal show={showModal} onHide={handleCloseModal} centered>
      <Modal.Header closeButton>
        <Modal.Title>Facture de la transaction</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selectedTransaction && (
          <>
            <p><strong>Destinataire :</strong> {selectedTransaction.recipient_name}</p>
            <p><strong>Montant :</strong> {selectedTransaction.amount} $</p>
            <p><strong>Date :</strong> {new Date(selectedTransaction.transaction_date).toLocaleDateString()}</p>
            <p><strong>Méthode :</strong> {selectedTransaction.method}</p>
            <p><strong>État :</strong> {selectedTransaction.transactionState}</p>
            <p><strong>Numéro de compte :</strong> {selectedTransaction.accountNumber}</p>
            <p><strong>Adresse</strong> {selectedTransaction.recipientAddress}, {selectedTransaction.recipientTown}</p>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleCloseModal}>
          Fermer
        </Button>
        <Button variant="primary" onClick={downloadInvoice}>
            Télécharger la facture en PDF
          </Button>
      </Modal.Footer>
    </StyledModal>
    </Container>
  );
};

export default TransactionHistory;
