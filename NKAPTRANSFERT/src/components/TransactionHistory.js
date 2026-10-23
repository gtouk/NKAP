import api from '../api';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Col, Container, Modal, Row, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
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
  const { t, i18n } = useTranslation();
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

        const response = await api.get('/api/transactions/get-transactions');

        setTransactions(response.data);
      } catch (error) {
        setError(error.response?.data?.message || error.message || 'Impossible de charger les transactions');
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
      doc.setFont('helvetica', 'normal'); // Helvetica pour un look plus propre qu'Arial
      const primaryColor = '#16A085'; // Vert émeraude de votre thème
      const textColor = '#2C3E50'; // Bleu foncé pour le texte
  
      // En-tête
      doc.setFillColor(primaryColor);
      doc.rect(0, 0, 210, 40, 'F'); // Rectangle vert en haut (largeur A4 = 210mm)
      doc.setTextColor('#FFFFFF');
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(t('invoiceTitle'), 20, 25);
  
      doc.setTextColor(textColor);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(t('generatedOn', { date: new Date().toLocaleDateString(i18n.language.startsWith('en') ? 'en-CA' : 'fr-CA') }), 20, 35);
  
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(t('details'), 20, 50);
      doc.setLineWidth(0.5);
      doc.setDrawColor(primaryColor);
      doc.line(20, 52, 80, 52); // Ligne verte sous "Détails"
  
      // Informations alignées dans un tableau stylisé
      const startY = 60;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const details = [
        [t('recipient'), selectedTransaction.recipient_name],
        [t('amount'), `${selectedTransaction.amount} $`],
        [t('date'), new Date(selectedTransaction.transaction_date).toLocaleDateString(i18n.language.startsWith('en') ? 'en-CA' : 'fr-CA')],
        [t('method'), selectedTransaction.method],
        [t('state'), selectedTransaction.transactionState],
        [t('accountNumber'), selectedTransaction.accountNumber],
        [t('address'), `${selectedTransaction.recipientAddress}, ${selectedTransaction.recipientTown}`]
      ];
  
      details.forEach((item, index) => {
        const y = startY + index * 10;
        doc.setTextColor(primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text(`${item[0]} :`, 20, y); // Label en vert
        doc.setTextColor(textColor);
        doc.setFont('helvetica', 'normal');
        doc.text(item[1], 70, y); // Valeur en bleu foncé
      });
  
      // Bordure autour des détails
      doc.setDrawColor('#DDD');
      doc.setLineWidth(0.2);
      doc.rect(15, 45, 180, 80, 'S'); // Rectangle gris clair autour des détails
  
      // Pied de page
      doc.setFontSize(10);
      doc.setTextColor('#999');
      doc.text('NKAP Transfert', 20, 280);
      doc.text(`ID Transaction: ${selectedTransaction.transaction_id}`, 150, 280);
  
      // Téléchargement
      doc.save(`Facture_${selectedTransaction.transaction_id}.pdf`);
    }
  };

  if (loading) {
    return <div>{t('loading')}</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <Container className="mt-5">
      <Row>
        <Col>
          <h2>{t('historyTitle')}</h2>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>{t('reference')}</th>
                <th>{t('recipient')}</th>
                <th>{t('amount')}</th>
                <th>{t('date')}</th>
                <th>{t('method')}</th>
                <th>{t('state')}</th>
                <th>{t('action')}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="7">{t('noTransactions')}</td>
                </tr>
              ) : transactions.map((transaction) => (
                <tr key={transaction.transaction_id}>
                  <td>{transaction.reference || transaction.transaction_id}</td>
                  <td>{transaction.recipient_name}</td>
                  <td>{transaction.amount} $</td>
                  <td>{new Date(transaction.transaction_date).toLocaleDateString(i18n.language.startsWith('en') ? 'en-CA' : 'fr-CA')}</td>
                  <td>{transaction.method}</td>
                  <td>{transaction.transactionState}</td>
                  <td>
                    <Button variant='primary' size='sm' onClick={() => handleShowInvoice(transaction)}>
                      {t('invoice')}
                    </Button>
                    {transaction.reference && (
                      <Button as={Link} to={`/track/${transaction.reference}`} variant="outline-primary" size="sm" className="ms-2">
                        {t('track')}
                      </Button>
                    )}
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
        <Modal.Title>{t('invoiceTitle')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selectedTransaction && (
          <>
            <p><strong>{t('recipient')} :</strong> {selectedTransaction.recipient_name}</p>
            <p><strong>{t('amount')} :</strong> {selectedTransaction.amount} $</p>
            <p><strong>{t('date')} :</strong> {new Date(selectedTransaction.transaction_date).toLocaleDateString(i18n.language.startsWith('en') ? 'en-CA' : 'fr-CA')}</p>
            <p><strong>{t('method')} :</strong> {selectedTransaction.method}</p>
            <p><strong>{t('state')} :</strong> {selectedTransaction.transactionState}</p>
            <p><strong>{t('accountNumber')} :</strong> {selectedTransaction.accountNumber}</p>
            <p><strong>{t('address')}</strong> {selectedTransaction.recipientAddress}, {selectedTransaction.recipientTown}</p>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleCloseModal}>
          {t('close')}
        </Button>
        <Button variant="primary" onClick={downloadInvoice}>
            {t('downloadPdf')}
          </Button>
      </Modal.Footer>
    </StyledModal>
    </Container>
  );
};

export default TransactionHistory;
