import axios from 'axios';
import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js';
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';

// Enregistrer les composants nécessaires pour Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const TransactionChart = () => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    // Récupérer les transactions de l'API
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem('token');  // Supposons que le token est stocké dans localStorage
        const response = await axios.get(`http://${process.env.REACT_NKAP_DEMO_API_URL}/api/transactions/get-transactions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTransactions(response.data);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };

    fetchTransactions();
  }, []);

  // Préparer les données pour le graphique
  const labels = transactions.map(tx => {
    const date = new Date(tx.transaction_date);
    const month = date.getMonth() + 1; // Les mois commencent à 0, donc ajouter 1
    const year = date.getFullYear();
    return `${month}/${year}`;
  });

  const data = transactions.map(tx => tx.amount);

  const dataChart = {
    labels: labels,
    datasets: [
      {
        label: 'Montant Transféré',
        data: data,
        fill: false,
        borderColor: '#16A085',
        tension: 0.1
      }
    ]
  };

  const options = {
    scales: {
      x: {
        title: {
          display: true,
          text: 'Mois/Année'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Montants Transférés (USD)'
        },
        beginAtZero: true
      }
    }
  };

  return <Line data={dataChart} options={options} />;
};

export default TransactionChart;
