import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Col, Container, Row, Table } from 'react-bootstrap';
import TransactionChart from './TransactionChart';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found, please log in.');
        }

        const response = await axios.get(`http://${process.env.REACT_NKAP_DEMO_API_URL}/api/transactions/get-transactions`, {
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
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction, index) => (
                <tr key={index}>
                  <td>{transaction.recipient_name}</td>
                  <td>{transaction.amount} $</td>
                  <td>{new Date(transaction.transaction_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <TransactionChart transactions={transactions} />
        </Col>
      </Row>
    </Container>
  );
};

export default TransactionHistory;
