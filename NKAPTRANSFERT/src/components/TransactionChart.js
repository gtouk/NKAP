import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const TransactionChart = ({ transactions = [] }) => {
  const { t } = useTranslation();
  if (!transactions.length) {
    return <p className="mt-3">{t('noTransactionsChart')}</p>;
  }

  const labels = transactions.map((tx) => {
    const date = new Date(tx.transaction_date);
    return `${date.getMonth() + 1}/${date.getFullYear()}`;
  });

  const dataChart = {
    labels,
    datasets: [
      {
        label: t('amount'),
        data: transactions.map((tx) => Number(tx.amount)),
        fill: false,
        borderColor: '#16A085',
        tension: 0.1,
      },
    ],
  };

  const options = {
    scales: {
      x: { title: { display: true, text: t('date') } },
      y: { title: { display: true, text: 'CAD' }, beginAtZero: true },
    },
  };

  return <Line data={dataChart} options={options} />;
};

export default TransactionChart;
